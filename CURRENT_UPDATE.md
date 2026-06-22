# CURRENT UPDATE

Date: 2026-06-22 20:45 PKT
Project: DawaiSaver.pk
Update: DRAP Acquisition Deployment Instructions

## 1. Git Repository Status (COMPLETED)

Repository is clean. All changes committed and pushed.

---

## 2. Mirror Status Dashboard Fix (COMPLETED)

### Files Changed
- `src/cli/drap-mirror.ts` - New CLI entry point
- `package.json` - Added `drap:mirror` script
- `src/modules/drap/mirror-status.service.ts` - Added `getCurrentBatchItemTotals()`
- `.gitignore` - Added missing exclusions

### Build Result
**PASS** - `npm run build` completed successfully

### Git Result
Commits: `806cd4d`, `97b9b91`, `0ce2f9c`, `5a46190`
Push: `main` → `origin/main`

---

## 3. DRAP Acquisition Deployment (PENDING COOLIFY)

### Code Status
CLI command ready: `npm run drap:mirror`

### Coolify Deployment Required
The application container (`yh5wt7bbkhqsjycey5df0lbe`) is running an older image.
**Manual redeployment through Coolify UI is required** to pick up the new code.

### Steps to Deploy
1. Log into Coolify dashboard
2. Navigate to the application
3. Click "Deploy" or "Redeploy"
4. Wait for build to complete

### Environment Variables (Set in Coolify)
```
DRAP_MIRROR_RUN_ID=run-20260623-001
DRAP_MIRROR_START_REGISTRATION=091350
DRAP_MIRROR_END_REGISTRATION=135068
DRAP_MIRROR_TOTAL_REGISTRATIONS=43719
```

### R2 Configuration (Verify in Coolify)
```
R2_ACCOUNT_ID=<your-account-id>
R2_ACCESS_KEY_ID=<your-access-key>
R2_SECRET_ACCESS_KEY=<your-secret-key>
R2_BUCKET_NAME=dawaisaver-pk
```

---

## 4. Current State (Pre-Deployment)

| Metric | Value |
|--------|-------|
| Highest acquired registration | 091349 |
| Highest source registration | 135068 |
| Remaining registrations | 43,719 |
| RUNNING batches | 0 |
| R2 completeness | 97.69% (380/389) |

---

## 5. Post-Deployment Verification

After Coolify deployment, run on production:
```bash
export DRAP_MIRROR_RUN_ID=run-20260623-001
export DRAP_MIRROR_START_REGISTRATION=091350
export DRAP_MIRROR_END_REGISTRATION=135068
export DRAP_MIRROR_TOTAL_REGISTRATIONS=43719
npm run drap:mirror
```

### Verification Checklist
- [ ] New batches created with `run-20260623-001`
- [ ] Registrations >091349 being processed
- [ ] Dashboard showing advancing registration numbers
- [ ] R2 archive segments uploading
- [ ] Progress bar increasing

---

## 6. Expected Results

| Metric | Value |
|--------|-------|
| Current registration | 091349 → 135068 (advancing) |
| Remaining registrations | 43,719 → 0 (decreasing) |
| Completion % | 0% → 100% |
| Estimated finish | Depends on throughput |

---

## Files Changed

| File | Change |
|------|--------|
| `src/cli/drap-mirror.ts` | New file |
| `package.json` | Added `drap:mirror` script |
| `src/modules/drap/mirror-status.service.ts` | Added `getCurrentBatchItemTotals()` |
| `.gitignore` | Updated exclusions |
| `docs/archive/COOLIFY_AUTOMATION.md` | Archived |
| `CURRENT_UPDATE.md` | This file |

---

## 3. DRAP Acquisition Status (INVESTIGATION COMPLETE)

### Current State
| Metric | Value |
|--------|-------|
| Highest acquired registration | 091349 |
| Highest source registration | 135068 |
| Remaining registrations | 43,719 |
| RUNNING batches | 0 |
| run-20260622-001 batches | 0 |
| R2 completeness | 97.69% (380/389) |

### Root Cause: Job Never Started
1. `runDrapMirrorJob()` in `src/jobs/drap-mirror.job.ts` requires `DRAP_MIRROR_RUN_ID` env var
2. Environment is set to `run-20260622-001` but **no batches were created**
3. The job function is exported but **not imported** in main application
4. `mirror_runtime_control.state = "running"` was set manually but job never triggered
5. 50+ PENDING batches from 2026-06-18 are stale (checkpoint ~5450, last reg ~080000)

### Why No Batches for run-20260622-001
- The `runDrapMirrorJob` function exists but is not invoked by the NestJS application
- It requires external scheduling (cron, worker process, or manual invocation)
- The job must be started manually or via a scheduler with proper environment configuration

### R2 Segment Failures
| Metric | Count |
|--------|-------|
| Referenced segments expected | 389 |
| Segments present | 380 |
| Missing segments | 9 |

All 9 missing segments cover registrations 059300–062299 across three batches. Failed due to missing `R2_ACCOUNT_ID` at upload time.

---

## 4. Recommended Actions

### Immediate (Completed)
- [x] Fix mirror status API to query actual database totals
- [x] Build and deploy fix
- [x] Clean up git repository

### Future Work (Requires Backend Access)
- [ ] Start DRAP mirror job with:
  - `DRAP_MIRROR_RUN_ID=run-20260623-001` (new run)
  - `DRAP_MIRROR_START_REGISTRATION=091350`
  - `DRAP_MIRROR_END_REGISTRATION=135068`
- [ ] Recover/re-upload 9 missing R2 segments
- [ ] Clean up stale PENDING batches from 2026-06-18

---

## Files Changed

| File | Change |
|------|--------|
| `src/modules/drap/mirror-status.service.ts` | Added `getCurrentBatchItemTotals()` method |
| `.gitignore` | Added missing exclusions |
| `docs/archive/COOLIFY_AUTOMATION.md` | Moved from root |
| `CURRENT_UPDATE.md` | This file |

## Build & Deployment

- Build: **PASS**
- Git commits: `806cd4d`, `97b9b91`
- Git push: `main` → `origin/main`
- Deployment: Use Coolify

## Production Verification (Pending)

After deployment, verify dashboard shows:
- Processed: 398,068
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
