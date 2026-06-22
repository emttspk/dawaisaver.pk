# CURRENT UPDATE

Date: 2026-06-22 21:20 PKT
Project: DawaiSaver.pk
Update: Mirror Status Fix + DRAP Acquisition Running

## 1. Mirror Status Dashboard Fix (COMPLETED)

### Problem
"Last Registration" card showed `047749` (Worker 1) instead of `085249` (highest across all workers).

### Root Cause
`referenceSnapshot` was sorted by `processed` count, not by `lastRegistrationNumber`.

### Solution
Changed sorting to use `lastRegistrationNumber`:
```typescript
.sort((left, right) => {
  const leftNum = parseInt(left.checkpoint.lastRegistrationNumber || "0", 10);
  const rightNum = parseInt(right.checkpoint.lastRegistrationNumber || "0", 10);
  return rightNum - leftNum;
})
```

### Backend Field Mappings

| Dashboard Card | Backend Field | Source |
|----------------|---------------|--------|
| Status | `status` | `mirror_runtime_control.state` + batch aggregation |
| Processed | `processed_count` | `snapshots[].checkpoint.processed` sum |
| Success | `success_count` | `snapshots[].checkpoint.parsed` sum |
| Failed | `failed_count` | `snapshots[].checkpoint.failed` sum |
| Duplicates | `duplicates` | `snapshots[].checkpoint.duplicate` sum |
| Remaining | `total_rows - processed_count` | `activeBatches.totalRows` - `processed_count` |
| Progress % | `(processed_count / total_rows) * 100` | Calculated |
| Archive Uploads | `archive_uploads` | `snapshots[].archive.uploadedSegments` sum |
| ETA | `eta_at` | `started_at + (remaining / throughput)` |
| Workers | `worker_count` | `snapshots[].workerCount` max |
| Throughput | `throughput` | `processed_count / elapsed_seconds` |
| **Last Registration** | `last_registration` | **MAX of `snapshots[].checkpoint.lastRegistrationNumber`** |

### Build & Deploy
- Build: **PASS**
- Commit: `ea490eb` - "fix: show highest lastRegistrationNumber in dashboard"
- Push: `main` → `origin/main`

---

## 2. DRAP Acquisition Status (RUNNING)

### Live Checkpoint Evidence
| Worker | Last Registration |
|--------|-------------------|
| Worker 1 | 047749 |
| Worker 2 | 060249 |
| Worker 3 | 072749 |
| Worker 4 | 085249 |

### Progress
| Metric | Value |
|--------|-------|
| Current registration | 085249 (highest) |
| Remaining | ~43,719 |
| Completion | In progress |

---

## 3. Required Actions

### Deploy via Coolify
1. Deploy application to pick up commit `ea490eb`
2. Verify container restarted

### Continue Acquisition
The acquisition is already running. No restart needed.

---

## Files Changed

| File | Change |
|------|--------|
| `src/modules/drap/mirror-status.service.ts` | Fixed `referenceSnapshot` sorting |
| `CURRENT_UPDATE.md` | This file |

## Build Result

**PASS**