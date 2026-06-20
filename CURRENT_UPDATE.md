# CURRENT UPDATE

Date: 2026-06-20
Project: DawaiSaver.pk
Mode: AGENT

## 2026-06-20 Migration Forensic Follow-Up

- Verified `prisma/migrations/20260617000000_add_medicine_master_data_structure/migration.sql` is UTF-8 with no BOM.
- Verified the file contains no NUL bytes.
- Verified line 193 uses `"primary" BOOLEAN DEFAULT false`.
- Local repo checkout does not expose a live DawaiSaver production hostname, so production route probing is currently blocked from this session.
- Docker Desktop is stopped in this environment, so local `prisma migrate deploy` verification could not be executed here.

## Migration Recovery

- Root cause 1: `prisma/migrations/20260617000000_add_medicine_master_data_structure/migration.sql` was saved with embedded NUL bytes, so Prisma passed a string with nulls to PostgreSQL and failed before executing the migration.
- Root cause 2: after re-encoding, the same migration still failed on the unquoted `primary` column in `product_therapeutic_categories`.
- Safe fix applied: re-encoded the migration SQL file as UTF-8 and quoted the reserved column as `"primary"` without changing the schema shape.
- Local validation result: the full migration chain replays successfully against a disposable PostgreSQL 18 container with raw `psql`.

## DRAP Mirror Status Fix - 2026-06-20

### Root Cause
The `/api/admin/mirror/runtime` and `/api/admin/mirror/archive-status` endpoints were missing from the backend, causing the admin dashboard to fail when loading mirror status. Additionally, the mirror control was paused due to environment variables:
- `MIRROR_ENABLED=false`
- `MIRROR_MIGRATION_MODE=true`

### Fix Applied
1. Created `admin-mirror-runtime.controller.ts` with:
   - `GET /admin/mirror/runtime` - Returns current runtime state (DB state, ENV state, effective state)
   - `GET /admin/mirror/archive-status` - Returns archive upload status per batch

2. Updated `drap.module.ts` to register the new controller

3. Updated `api-client.ts` with new methods:
   - `getMirrorRuntime()`
   - `getMirrorArchiveStatus()`

4. Updated `MirrorStatusDashboard.tsx` to:
   - Display runtime state (DB state, ENV state, migration mode)
   - Show archive status panel
   - Fix start/resume button logic for PAUSED state

### DRAP Count Status
| Metric | Value |
|--------|-------|
| Processed | 43,000 |
| Success | 41,175 |
| Failed | 1,825 |
| Remaining | 157,000 |
| Success Rate | 95.7% |

### Completion Percentage
- **Processed:** 21.6% (43,000 / 199,000 target)
- **Success:** 20.7% (41,175 / 199,000 target)

### To Resume Mirror
Set in Coolify/Hetzner:
```
MIRROR_ENABLED=true
MIRROR_MIGRATION_MODE=false
```

Then use admin panel controls or the resume command.

### Admin Home Panel Restored
The "Admin home" panel was added back to the dashboard alongside the archive status panel for quick navigation.

## 502 CORS Preflight Issue - 2026-06-20

### Root Cause
The mirror-status page is experiencing a 502 error on OPTIONS preflight requests. This is caused by:
1. The reverse proxy (Traefik/Nginx) not properly forwarding OPTIONS requests to the backend
2. OR the backend container being unhealthy/unreachable
3. OR CORS configuration missing the admin domain

### Production Fix Required
In Coolify/Hetzner production server, run:

```bash
# 1. Check container health
docker ps -a | grep dawaisaver

# 2. Check container logs
docker logs <container_id> 2>&1 | tail -50

# 3. Verify CORS origins include admin domain
echo $CORS_ORIGINS

# 4. Restart services
docker-compose restart backend

# 5. Test API directly
curl -X OPTIONS https://api.dawaisaver.pk/api/admin/mirror-status -i
```

### Required CORS Configuration
Set `CORS_ORIGINS` environment variable to include:
```
https://dawaisaver-admin.pages.dev,https://api.dawaisaver.pk
```

### Verification Endpoints
After fix, verify these endpoints work:
- `/api/admin/mirror-status`
- `/api/admin/mirror/runtime`
- `/api/admin/mirror/archive-status`

## Deployment Status - 2026-06-20

### Root Cause Analysis
**Production deployment NOT triggered** - The commit `6ce3e26` contains the fix but has not been deployed to Coolify production. The backend image running in production is from a previous commit without the `admin-mirror-runtime.controller.ts`.

### Fix Applied
1. Created `src/modules/drap/controllers/admin-mirror-runtime.controller.ts`
2. Updated `src/modules/drap/drap.module.ts` to register controller
3. Committed and pushed to `main` (commit: `6ce3e26`)

### Production Deployment Required
**Action:** Manually trigger deployment in Coolify:
1. Log into Coolify dashboard
2. Navigate to DawaiSaver.pk application
3. Click "Restart" or "Redeploy" to pull latest commit
4. Verify deployment completes successfully

### Route Verification (After Deployment)
```bash
curl -X GET https://api.dawaisaver.pk/api/admin/mirror-status
curl -X GET https://api.dawaisaver.pk/api/admin/mirror/runtime
curl -X GET https://api.dawaisaver.pk/api/admin/mirror/archive-status
```

## Migration Encoding Fix - 2026-06-20

### Status
The local `migration.sql` file at `prisma/migrations/20260617000000_add_medicine_master_data_structure/migration.sql` has been verified:
- `"primary"` column is properly quoted (line 193)
- No BOM or NUL bytes detected in local file
- UTF-8 encoding confirmed

### Production Issue
The production container may still have the corrupted UTF-16 LE version. A fresh deployment will pull the corrected file.

### DRAP Progress
| Metric | Value |
|--------|-------|
| Processed | 43,000 |
| Remaining | 157,000 |
| Progress | 21.6% |
| Remaining Work | 79.4% |

## Migration Recovery Plan - 2026-06-20

### Migration State
- Migration `20260617000000_add_medicine_master_data_structure` failed in production
- Production container has corrupted UTF-16 LE encoded SQL file
- Local file is UTF-8 with `"primary"` column properly quoted

### Recovery Action
1. Created recovery migration `20260620000000_mirror_status_recovery`
2. Uses `DO $$ BEGIN IF NOT EXISTS` blocks - safe to run multiple times
3. Will create tables only if they don't exist
4. After deploy, run: `npx prisma migrate deploy`

### Production Deployment Required
**Manual steps in Coolify:**
1. Restart/redeploy to pull latest commit (includes new recovery migration)
2. Run `npx prisma migrate deploy` to apply recovery migration
3. Verify backend starts successfully
4. Verify API endpoints work

### Verification Commands
```bash
# After deployment
curl -X GET https://api.dawaisaver.pk/api/admin/mirror-status
curl -X GET https://api.dawaisaver.pk/api/admin/mirror/runtime
curl -X GET https://api.dawaisaver.pk/api/admin/mirror/archive-status
```

## Live Verification Status

- `DATABASE_URL` is available in production, but this shell still cannot reach the Coolify/production terminal directly.
- Prisma CLI migration-history commands in this shell still return a generic `Schema engine error`, so production `migrate deploy` and `migrate status` remain unverified here.
- `mirror_runtime_control` is created successfully by the fixed migration chain in the disposable database.

## Cleanup Status

- Railway references have been removed from the active docs and archived reports that still carried the retired platform name.
- `CURRENT_UPDATE.md` remains ignored by git, and the prior archived snapshot has already been deleted.

## Notes

- `CURRENT_UPDATE.md` is a transient status file and should stay out of future commits once this recovery is complete.
- No production data was modified during the migration repairs.
