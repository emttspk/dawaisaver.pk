# CURRENT UPDATE

Date: 2026-06-22 21:15 PKT
Project: DawaiSaver.pk
Update: Mirror Status Fix + DRAP Acquisition Deployment

## 1. Mirror Status Dashboard Fix (COMPLETED)

### Problem
Dashboard was mixing metrics:
- `processed_count`, `success_count`, `failed_count` from `getCurrentBatchItemTotals()` (all batches)
- `total_rows`, `archive_uploads` from snapshot (active run only)

### Solution
- Removed `getCurrentBatchItemTotals()` method
- All metrics now derived from `snapshots` of active run batches
- Consistent data source for all cards

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

### Build & Deploy
- Build: **PASS**
- Commit: `832fff5` - "fix: use snapshot checkpoint metrics consistently"
- Push: `main` → `origin/main`

---

## 2. DRAP Acquisition Deployment (PENDING)

### Current State
| Metric | Value |
|--------|-------|
| Highest acquired registration | 091349 |
| Highest source registration | 135068 |
| Remaining registrations | 43,719 |
| RUNNING batches | 0 |
| R2 completeness | 97.69% |

### Required Coolify Deployment
1. Log into Coolify dashboard
2. Deploy application to pick up commit `832fff5`
3. Verify container restarted

---

## 3. Start Acquisition (After Deployment)

```bash
docker exec <app_container> sh -c '
export DRAP_MIRROR_RUN_ID=run-20260623-001 &&
export DRAP_MIRROR_START_REGISTRATION=091350 &&
export DRAP_MIRROR_END_REGISTRATION=135068 &&
export DRAP_MIRROR_TOTAL_REGISTRATIONS=43719 &&
npm run drap:mirror
'
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/modules/drap/mirror-status.service.ts` | Fixed metric consistency |
| `CURRENT_UPDATE.md` | This file |

## Build Result

**PASS**