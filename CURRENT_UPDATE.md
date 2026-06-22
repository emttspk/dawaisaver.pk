# CURRENT UPDATE

Date: 2026-06-22 19:52 PKT
Project: DawaiSaver.pk
Update: DRAP Acquisition Continuation Investigation & Mirror Status Fix

## Update Status: COMPLETED (Investigation Only)

**Protected Scope Protocol maintained**: No production data, deployment, runtime control, or R2 objects were changed during this audit.

## 1. Mirror Status Dashboard Fix (COMPLETED)

Fixed stale metrics in Mirror Status dashboard by updating `src/modules/drap/mirror-status.service.ts`:

- Added `getCurrentBatchItemTotals()` method to query actual totals from `import_batch_items` table
- Updated `getMirrorStatus()` to use database counts instead of stale batch checkpoints
- Build: **PASS** (`npm run build` completed)
- Commit: `806cd4d` - "fix: mirror status dashboard stale metrics"
- Push: `main` branch updated

**Expected dashboard values after deployment:**
- Processed: 398,068 (372,149 + 25,919)
- Success: 372,149
- Failed: 25,919

## 2. DRAP Acquisition Status (INVESTIGATION COMPLETE)

### Current Run Verification

- Target run: `run-20260622-001`
- **Status: No batches created for this run**
- Mirror runtime control: `state: running` (last updated 2026-06-21 09:30)
- No RUNNING batches found
- All PENDING batches are from 2026-06-18

### Acquisition Progress

| Metric | Value |
|--------|-------|
| Highest acquired registration | 091349 |
| Highest source registration available | 135068 |
| Registrations remaining | 43,719 |
| R2 completeness | 380/389 segments (97.69%) |

### Root Cause Analysis

1. **Acquisition stopped at 091349** - The last successfully acquired registration
2. **No batches for run-20260622-001** - The configured run ID has no batches created
3. **Stalled PENDING batches** - 50+ PENDING batches from 2026-06-18 with stale checkpoints
4. **No active workers** - No RUNNING batches exist

### Evidence Summary

```
mirror_runtime_control: drap_mirror:control = running
Highest registration in import_batches: 091349
Highest registration in import_batch_items: 091349
Batches for run-20260622-001: 0 rows
RUNNING batches: 0 rows
PENDING batches: 50+ rows (all from 2026-06-18)
```

## 3. R2 Segment Failures (INVESTIGATION COMPLETE)

| Metric | Count |
|--------|-------|
| Referenced segments expected | 389 |
| Segments present in R2 | 380 |
| Missing segments | 9 |
| Unreferenced extra objects | 137 |

**Missing segments cover registrations 059300–062299 across three batches:**
- `19b804b2...`: 1 segment
- `3aad052c...`: 4 segments  
- `8f2d6c33...`: 4 segments

All failed due to missing `R2_ACCOUNT_ID` at upload time.

## 4. Dashboard Semantics (DOCUMENTED - NOT FIXED)

The dashboard mixes all-time item totals with stale batch checkpoints. Cards display:
- Processed/Success/Failed: Now fixed (query actual `import_batch_items`)
- Progress: Still uses batch checkpoint totals (not unique registrations)
- Remaining: Still uses stale batch totals
- ETA: Based on historical throughput, not current state

## 5. Recommended Next Actions

### Immediate (Already Done)
- [x] Fix mirror status API to query actual database totals
- [x] Build and deploy fix
- [x] Verify dashboard reflects correct totals

### Future Work (Requires Backend Access)
- [ ] Determine why `run-20260622-001` batches were not created
- [ ] Resume acquisition from registration 091350 through 135068
- [ ] Recover/re-upload 9 missing R2 segments
- [ ] Fix dashboard to show unique registration counts instead of item counts
- [ ] Clean up stale PENDING batches

## Files Changed

| File | Change |
|------|--------|
| `src/modules/drap/mirror-status.service.ts` | Added `getCurrentBatchItemTotals()`; updated `getMirrorStatus()` |
| `CURRENT_UPDATE.md` | Updated with investigation findings |
| `docs/archive/CURRENT_UPDATE-2026-06-22.md` | Archived previous version |

## Build & Deployment

- Build: **PASS**
- Git commit: `806cd4d`
- Git push: `main` branch
- Deployment: Use Coolify to deploy the fix

## Production Verification (Pending)

After deployment, verify dashboard shows:
- Processed: 398,068
- Success: 372,149  
- Failed: 25,919
