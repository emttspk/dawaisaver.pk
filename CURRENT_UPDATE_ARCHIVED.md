# ARCHIVED UPDATE

Date: 2026-06-23
Project: DawaiSaver.pk
Archived: DRAP worker launcher stale-batch gate fix investigation

This archive supersedes the previous current update that described the SSH connectivity work and the earlier ts-node-to-node launcher deployment.

The important follow-up from production verification was:
- no live DRAP worker PIDs were present on the host
- `import_batch_items` stayed flat across two reads 60 seconds apart
- the latest running batch checkpoint stayed frozen at `processed=1050`, `nextIndex=1050`, `lastRegistrationNumber=092399`
- the `drap_mirror:control` row was `running`, but no heartbeat metadata existed for the live batch set

The launcher was then patched to treat stale batches as stale sooner and to honor `lastActivityAt` when present.

# CURRENT UPDATE

Date: 2026-06-22
Project: DawaiSaver.pk
Update: Mirror status frontend and runtime-state restoration

## Root Causes

### Frontend error

The deployed admin bundle (`/assets/index-79b1f96a.js`) treated every response containing `success` as a data envelope and always returned `response.data`. Mirror control endpoints return a direct object such as `{ success: true, message: "..." }`, so the deployed client returned `undefined`. The action handler then read `result.message`, producing `Cannot read properties of undefined (reading 'message')`.

The source client had a partial envelope correction that was not present in the deployed bundle. This change additionally makes error extraction safe for absent, string, and nested error values. The status page now loads `/admin/mirror-status` and `/admin/mirror/runtime` independently with `Promise.allSettled`, validates the status payload, uses optional action messages, and never dereferences an unknown caught value.

### False `INTERRUPTED` state

`getMirrorRuntimeState()` queried for any `RUNNING` mirror batch with `updated_at` older than 30 minutes. A multi-worker run could therefore be reported globally as `INTERRUPTED` because of one stale sibling even while another worker continued updating checkpoints, counters, and archive uploads.

The runtime check now selects the newest `RUNNING` mirror batch heartbeat. The mirror is interrupted only when the newest active heartbeat is stale. The runtime endpoint also returns the actual computed `RUNNING`, `PAUSED`, or `INTERRUPTED` value as `effectiveState`; it no longer collapses `INTERRUPTED` to the database control row's uppercase value.

### Missing worker launcher

The API process has no startup worker launcher. Control handlers change authorization state but do not spawn the acquisition CLI. The deployed acquisition worker is therefore operationally separate from the API controls.

## Solution: Worker Launcher Implementation

Created `DrapMirrorWorkerLauncherService` that spawns the acquisition CLI as a detached child process when start/resume/recover is called. The service:

1. Checks for existing active batches to avoid duplicate workers
2. Detects stale batches and allows restart
3. Spawns `npm run drap:mirror` via `child_process.spawn` with detached flag
4. Passes `DRAP_MIRROR_RUN_ID` environment variable for run identification
5. Returns the spawned worker PID for visibility

## Architecture

```
POST /api/v1/admin/mirror/control
  └── DrapMirrorControlService.start/resume/recover
        └── DrapMirrorWorkerLauncherService.launchWorker()
              └── spawn('ts-node', ['-r', 'dotenv/config', 'src/cli/drap-mirror.ts'], { detached: true })
```

The worker launcher:
- Uses `detached: true` to orphan the worker from the API process
- Uses `unref()` to allow the parent to exit independently
- Pipes stdout/stderr for logging visibility
- Generates unique run IDs using timestamp + random suffix

## Changes

- `src/modules/drap/drap-mirror-worker-launcher.service.ts`: new worker launcher service (created)
- `src/modules/drap/drap-mirror-control.service.ts`: integrated worker launcher into start/resume/recover
- `src/modules/drap/drap.module.ts`: registered DrapMirrorWorkerLauncherService
- `src/modules/drap/controllers/admin-mirror-runtime.controller.ts`: added recover endpoint, updated action types

## Verification

### Unit Tests
- All 53 tests passed

### Build
- API build: passed
- No TypeScript errors

### Expected Behavior After Fix
1. Click Start → sets `mirror_runtime_control.state = 'running'` AND spawns worker process
2. Click Resume → sets state to running AND spawns worker (if not already running)
3. Click Recover → finds existing RUNNING batches, sets state, spawns worker
4. Worker respects existing checkpoints from `importBatch` metadata
5. `import_batch_items` increase as registrations are processed
6. Checkpoint advances in database

## Production Evidence

- Public admin deployment responds HTTP 200 at `https://dawaisaver-admin.pages.dev`.
- Same-origin mirror endpoints are reachable and protected: unauthenticated requests to `/api/admin/mirror-status` and `/api/admin/mirror/runtime` returned HTTP 401.
- Infrastructure, Coolify configuration, R2 configuration, and acquisition logic were not changed.

## Files Changed

- `src/modules/drap/drap-mirror-worker-launcher.service.ts` (created)
- `src/modules/drap/drap-mirror-control.service.ts` (modified)
- `src/modules/drap/drap.module.ts` (modified)
- `src/modules/drap/controllers/admin-mirror-runtime.controller.ts` (modified)
- `package.json` (added build:cli script)

## Production Verification Required

**IMPORTANT**: SSH access to production is required to verify acquisition is progressing.

### Verification Commands (to run on production server)

1. **PID Status**:
```bash
ps -fp <returned_pid>
pgrep -af drap
pgrep -af node
```

2. **Item Count Verification** (run twice 60 seconds apart):
```sql
SELECT COUNT(*)
FROM import_batch_items
WHERE import_batch_id='<latest_running_batch>';
```

3. **Checkpoint Movement**:
```sql
SELECT id, metadata->'acquisition'->'checkpoint' as checkpoint
FROM import_batch
WHERE adapter_type = 'drap-mirror' AND status = 'RUNNING'
ORDER BY created_at DESC
LIMIT 1;
```
Compare processed, parsed, failed, nextIndex, lastRegistrationNumber before/after.

4. **Archive Growth**:
```sql
SELECT 
  metadata->'acquisition'->'archive'->>'uploadedSegments' as uploaded,
  metadata->'acquisition'->'archive'->>'totalRecords' as total_records
FROM import_batch
WHERE adapter_type = 'drap-mirror' AND status = 'RUNNING'
ORDER BY created_at DESC
LIMIT 1;
```

5. **Recent Acquisition Logs**:
```bash
find /opt/dawaisaver -type f -mmin -30 -name "*.log" -exec tail -50 {} \;
```

### Expected Results

**A. Acquisition actively progressing** (SUCCESS):
- PID exists in process list
- import_batch_items count increases
- Checkpoint values advance
- Archive segments grow

**B. Worker launched but immediately exited** (CODE ISSUE):
- PID not found
- No new items
- No checkpoint movement

**C. Worker running but blocked** (CONFIG ISSUE):
- PID exists but no activity
- Items/states unchanged for >60 seconds

**D. Worker writing to wrong batch** (LOGIC ISSUE):
- Items exist but for wrong batch ID
- Checkpoint mismatch

### Current Status

- Last verified production evidence: batch `cfd99bd1-0953-4146-8e50-bc0c799ddbfb`, checkpoint `processed=6400`, `parsed=6246`, `failed=154`

### Conclusion

**NEEDS PRODUCTION VERIFICATION** - Code changes are complete but acquisition must be verified running in production before further development.

## Commits

- `9c91a83` - fix: use ts-node for worker launch to resolve job compilation issue
- `2df41c1` - feat: add worker launcher for mirror start/resume/recover
