# Next Actions

## Current Task

P40 DRAP Mirror Speed Optimization Implementation + 1,000 Live Test (Complete)

## Completed

- Batched gzip archive manager implemented
- Per-product R2 upload removed from the DRAP hot path
- Archive manifest and upload state persisted in JSON metadata
- Checkpoint/resume replay validated
- 1,000 real DRAP registrations processed
- Prisma format passed
- Prisma generate passed
- Build passed
- Tests passed

## Next

1. Run a 10,000-registration checkpointed DRAP mirror canary with 4 workers
2. Force one interruption and verify resume from `nextIndex` plus manifest replay
3. Confirm archive upload recovery and runtime on the target deployment class

## Exact Next Prompt

Project: DawaiSaver.pk

Task: P41 DRAP Mirror Canary With Resume Validation

Mode: AGENT

Protected Scope Protocol active.

No breaking changes.
No schema changes.
Preserve existing APIs.
Preserve existing matching logic.
Preserve WHO normalization.
Preserve composition generation.

Goal:

Run a 10,000-registration checkpointed DRAP mirror canary with 4 workers, force one interruption, and verify resume idempotency through `nextIndex` plus archive manifest replay.

Required Work:

1. Keep the current batched archive flow unchanged
2. Use the existing JSON metadata fields for checkpoint and manifest state
3. Validate recovery after interruption
4. Compare runtime against the P40 1,000-row live test
5. Update CURRENT_UPDATE.md, AI_CODE_AUDIT_REPORT.md, AI_IMPLEMENTATION_INDEX.md, NEXT_ACTIONS.md
