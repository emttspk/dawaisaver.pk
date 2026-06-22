# CURRENT UPDATE

Date: 2026-06-22
Project: DawaiSaver.pk
Update: DRAP mirror import batch summary counter synchronization

## Production Evidence

- Active batch: `cfd99bd1-0953-4146-8e50-bc0c799ddbfb`
- `import_batches`: `status=RUNNING`, `total_rows=12500`, and all four summary counters were `0`.
- The same row's acquisition checkpoint had `processed=6400`, `fetched=6400`, `parsed=6246`, and `failed=154`.
- Its archive manifest had 6 uploaded segments and 6400 records; `import_batch_items` contained 6412 rows.
- This proves acquisition, item persistence, checkpoint persistence, archiving, and R2 upload were progressing while scalar summary fields were stale.

## Root Cause

`DrapAcquisitionService.persistBatchState()` is called at each configured checkpoint and successfully writes `metadata.acquisition.checkpoint`, R2 state, and archive state. Before this fix, that update omitted `validRows`, `invalidRows`, `duplicateRows`, and `savedRows`.

Those scalar fields were initialized from the starting checkpoint in `ensureBatch()` and otherwise written only by the final completion update. A new, long-running batch therefore retained zeros until the full range completed, even though its JSON checkpoint advanced. There is no separate transaction, alternate table, or wrong-batch update involved: both checkpoint and final updates target `importBatch` by `batch.id`.

Status behavior is separate and intentional: `RUNNING` is set at batch creation, completion changes it to `COMPLETED` or `COMPLETED_WITH_ERRORS`, and the acquisition catch path marks an aborted run `COMPLETED_WITH_ERRORS`.

## Fix

The checkpoint update now synchronizes:

- `validRows = checkpoint.parsed`
- `invalidRows = checkpoint.failed`
- `duplicateRows = checkpoint.duplicate`
- `savedRows = checkpoint.parsed`

This matches the existing creation and completion semantics and does not alter acquisition, infrastructure, Coolify, or R2 behavior.

A focused unit test verifies that a checkpoint with the production-shaped values writes both the metadata checkpoint and all four scalar counters in the same Prisma update.

## Files Changed

- `src/modules/drap/drap.acquisition.service.ts`
- `src/modules/drap/testing/drap-acquisition.service.test.ts`
- `CURRENT_UPDATE.md`

## Verification

- Focused unit test: passed (3 tests)
- Build: passed (`npm.cmd run build` / `nest build`)
- Commit: changes committed after verification
