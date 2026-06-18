# Next Actions

## Current Task

P41 DRAP Mirror Canary + Reliability Validation (Complete)

## Completed

- Four-worker canary executed over 10,000 real DRAP registrations
- Forced interruption and checkpoint resume validated
- `nextIndex` recovery validated
- Archive manifest replay validated
- Duplicate prevention validated
- Idempotent resume validated
- Prisma format passed
- Prisma generate passed
- Build passed
- Tests passed

## Next

1. Run a 50,000-registration sustained mirror pass using the same batched archive architecture
2. Verify the 4.18-hour projection holds under longer real-world load
3. Confirm whether the 8 vCPU VPS recommendation is worth keeping as a conservative fallback

## Exact Next Prompt

Project: DawaiSaver.pk

Task: P42 DRAP Sustained Mirror Projection Validation

Mode: AGENT

Protected Scope Protocol active.

No breaking changes.
No schema changes.
Preserve existing APIs.
Preserve existing matching logic.
Preserve WHO normalization.
Preserve composition generation.

Goal:

Run a 50,000-registration sustained DRAP mirror pass using the same batched archive architecture and confirm whether the 4.18-hour projection from the P41 canary remains accurate.

Required Work:

1. Keep the current batched archive flow unchanged
2. Use the same checkpoint/resume and manifest replay behavior
3. Record runtime, throughput, failure rate, archive uploads, and resume safety
4. Compare against the P41 10,000-registration canary
5. Update CURRENT_UPDATE.md, AI_CODE_AUDIT_REPORT.md, AI_IMPLEMENTATION_INDEX.md, NEXT_ACTIONS.md
