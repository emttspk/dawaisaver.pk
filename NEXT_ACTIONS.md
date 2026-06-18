# Next Actions

## Current Task

P38 Live DRAP Verification Crawl (Complete)

## Completed

- Real DRAP endpoint crawl executed
- 100 real registrations parsed and stored
- Raw HTML archived to R2
- Structured crawl rows persisted to PostgreSQL
- Live throughput measured
- P37 benchmark projections compared against live results
- Prisma format passed
- Prisma generate passed
- Build passed
- Tests passed

## Next

1. Prepare a checkpointed DRAP mirror scale-up plan for the highest-capacity option from the live run, using 4 workers and a stop/resume checkpoint strategy
2. Run a larger live batch only after confirming the target infrastructure and operational window

## Exact Next Prompt

Project: DawaiSaver.pk

Task: P39 Checkpointed DRAP Mirror Scale-Up

Mode: AGENT

Protected Scope Protocol active.

No breaking changes.
No schema changes.
Preserve existing APIs.
Preserve existing matching logic.
Preserve WHO normalization.
Preserve composition generation.

Goal:

Run a checkpointed DRAP mirror scale-up on the highest-capacity option from the live P38 run using 4 workers and explicit stop/resume support.

Required Work:

1. Keep the existing acquisition logic unchanged
2. Reuse the R2 archival path and structured persistence path
3. Run a larger checkpointed batch
4. Compare actual runtime against the live P38 benchmark
5. Update the recovery docs with the scale-up outcome
