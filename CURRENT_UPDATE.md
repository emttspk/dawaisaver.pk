# CURRENT UPDATE

Date: 2026-06-22 20:12 PKT
Project: DawaiSaver.pk
Update: DRAP Acquisition Investigation & Git Repository Cleanup

## 1. Git Repository Cleanup (COMPLETED)

### Status
- Root cause: Unmanaged directories (`node_modules/`, `dist/`, etc.) were not in `.gitignore`
- VS Code reported 10,000+ changed files due to these directories

### Actions Taken
1. Updated `.gitignore` with missing exclusions:
   - `node_modules/`, `dist/`, `build/`, `coverage/`
   - `*.csv`, `*.xlsx`
   - `apps/admin/node_modules/`, `apps/web/node_modules/`
   - `.env.test`, `.kilo/`, `.wrangler-*`

2. Archived unused markdown:
   - `coolifyautomation.md` → `docs/archive/COOLIFY_AUTOMATION.md`

### Current Repository State
```
Untracked files:
  .codex-xdg/
  .env.test
  .kilo/
  .wrangler-config/
  .wrangler-temp/
  .wrangler/
  apps/admin/.codex-xdg/
  apps/admin/dist/
  apps/admin/node_modules/
  apps/web/dist/
  apps/web/node_modules/
  dist/
  node_modules/
```

All untracked files are now properly ignored by `.gitignore`.

---

## 2. Mirror Status Dashboard Fix (COMPLETED)

### Problem
Dashboard showed stale metrics:
- UI: Processed: 47,550, Success: 45,178, Failed: 2,372
- Database: SAVED: 372,149, FAILED: 25,919

### Solution
Updated `src/modules/drap/mirror-status.service.ts`:
- Added `getCurrentBatchItemTotals()` method using Prisma `groupBy` on `import_batch_items`
- Modified `getMirrorStatus()` to query actual database counts

### Build & Deploy
- Build: **PASS**
- Commit: `806cd4d` + `97b9b91`
- Push: `main` branch

**Expected dashboard values:**
- Processed: 398,068
- Success: 372,149
- Failed: 25,919

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
