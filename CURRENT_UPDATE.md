# CURRENT UPDATE

Date: 2026-06-22 22:33 PKT
Project: DawaiSaver.pk
Update: DRAP Acquisition Recovery Implementation - COMPLETE

## 1. Investigation Results (COMPLETED)

### Current State
Four RUNNING batches found with stale checkpoints:

| Worker | Batch ID | Last Registration | Processed | Total Rows |
|--------|----------|-------------------|-----------|------------|
| 1 | 7ea2aabc... | 047749 | 6400 | 12500 |
| 2 | cfd99bd1... | 060249 | 6400 | 12500 |
| 3 | 9c5090c0... | 072749 | 6400 | 12500 |
| 4 | e7174d59... | 085249 | 6400 | 12500 |

### Root Cause
- Coolify deployment destroyed the old container
- New container started but **acquisition process was not restarted**
- `mirror_runtime_control.state` still shows `running`
- Batches remain in RUNNING status with stale checkpoints

### Recovery Plan

**Resume Registration Per Worker:**
| Worker | Resume From |
|--------|-------------|
| 1 | 047750 |
| 2 | 060250 |
| 3 | 072750 |
| 4 | 085250 |

**Can Continue Safely:**
- Yes - checkpoints saved progress
- No duplicate acquisition (nextIndex = 6400)
- R2 uploads already completed for first 6400 items per worker

---

## 2. Recovery Implementation (COMPLETED)

### Changes Made

**1. Added INTERRUPTED status** (`drap.freeze.ts`)
```typescript
export type DrapMirrorRuntimeState = "RUNNING" | "PAUSED" | "INTERRUPTED";

async function checkForStaleBatches(): Promise<boolean> {
  // Only triggers when control state is RUNNING
  // 30-minute stale threshold
}
```

**2. Updated dashboard** (`mirror-status.service.ts`)
- Dashboard shows `INTERRUPTED` when state=RUNNING but stale batches exist
- Status derived from runtime control + stale batch detection

**3. Updated types** (`drap.types.ts`)
- Added `INTERRUPTED` to `DrapMirrorStatusResponse.status`

**4. Resume/Recover endpoints** (`drap-mirror-control.service.ts`, `drap-mirror.controller.ts`)
- `resume()` - Sets state to RUNNING
- `recover()` - Finds RUNNING batches, initiates recovery
- Resume button enabled when status=INTERRUPTED

**5. Frontend fixes** (`MirrorStatusDashboard.tsx`, `api-client.ts`)
- Resume button enabled for PAUSED, STOPPED, and INTERRUPTED states
- Fixed response handling for direct `{ success, message }` responses
- Added null check for result.message

---

## 3. Deployment Steps (COMPLETED)

### Coolify Deployment
1. Navigate to Coolify dashboard → DawaiSaver.pk application
2. Click "Deploy" or "Restart"
3. Wait for health check to pass
4. Click "Resume Mirror" in dashboard (INTERRUPTED status should show)
5. Monitor checkpoints advancing beyond 085249

---

## 4. Dashboard Field Mappings

| Card | Backend Field | Source |
|------|---------------|--------|
| Status | `status` | `INTERRUPTED` (stale RUNNING detection) |
| Processed | `processed_count` | `snapshots[].checkpoint.processed` sum |
| Success | `success_count` | `snapshots[].checkpoint.parsed` sum |
| Failed | `failed_count` | `snapshots[].checkpoint.failed` sum |
| Remaining | `total_rows - processed_count` | `activeBatches.totalRows` - `processed_count` |
| Progress % | `(processed_count / total_rows) * 100` | Calculated |
| Last Registration | `last_registration` | **MAX** of `snapshots[].checkpoint.lastRegistrationNumber` |

---

## 5. Files Changed

| File | Change |
|------|--------|
| `src/modules/drap/drap.freeze.ts` | Added `INTERRUPTED` state + stale batch detection |
| `src/modules/drap/drap.types.ts` | Added `INTERRUPTED` to status type |
| `src/modules/drap/mirror-status.service.ts` | Fixed `referenceSnapshot` sorting, added `INTERRUPTED` handling |
| `src/modules/drap/drap-mirror-control.service.ts` | Added `resume()`, `recover()` endpoints |
| `src/modules/drap/controllers/drap-mirror.controller.ts` | Added `/recover` endpoint |
| `apps/admin/src/pages/MirrorStatusDashboard.tsx` | Enabled Resume for INTERRUPTED state |
| `apps/admin/src/services/api-client.ts` | Fixed response handling |
| `CURRENT_UPDATE.md` | This file |

---

## 6. Build & Deploy

- Build: **PASS**
- Commit: `d8a0053`
- Push: `main` → `origin/main`

---

## 7. Production Verification

- [x] Dashboard shows `INTERRUPTED` status
- [x] Deploy via Coolify
- [x] Click "Resume Mirror" - starts acquisition
- [ ] Verify batches processing registrations >085249
- [ ] Checkpoints advance
- [ ] R2 uploads continue
- [ ] No duplicate registrations acquired