# AI Code Audit Report

## Date

2026-06-18

## Phase

P38 Live DRAP Verification Crawl

## Scope

Audit of the live DRAP crawl run, R2 archival path, structured persistence path, projection comparison, and validation sweep.

## Findings

| Area | Result | Evidence |
|------|--------|----------|
| R2 configuration verification | Pass | All required R2 variables were present in the live run environment |
| Live DRAP crawl | Pass | The crawl reached the real DRAP endpoint and parsed 100 real registrations |
| Raw HTML archival | Pass | Raw HTML objects were uploaded to R2 for fetched pages |
| Structured persistence | Pass | Parsed rows and crawl metadata were written to the local PostgreSQL verification database |
| Error handling | Pass | Failed DRAP pages were recorded as failed crawl rows with source evidence |
| Projection comparison | Pass | Live runtime was compared against the P37 benchmark projections |
| Validation | Pass | Prisma format, Prisma generate, build, and tests all passed |

## Live Crawl Metrics

| Metric | Value |
|--------|-------|
| Fetched | 109 |
| Parsed | 100 |
| Failed | 9 |
| Duplicates | 0 |
| Retries | 0 |
| Total runtime | 130,576.87 ms |
| Actual throughput | 0.77 registrations/sec |
| Avg fetch time | 85.90 ms |
| Avg parse time | 0.34 ms |
| Avg R2 upload time | 1,093.77 ms |
| Avg DB write time | 12.04 ms |
| Avg HTML size | 18,776.47 bytes |

## Projection Comparison

| Full Mirror Size | P37 Projection | Live Projection |
|-----------------|----------------|-----------------|
| 10,000 records | ~1.0 hours | ~3.63 hours |
| 50,000 records | ~5.2 hours | ~18.14 hours |
| 150,000 records | ~15.6 hours | ~54.41 hours |

## Recommendation Summary

- Railway only: acceptable for smaller checkpointed runs, not the full mirror at this pace
- 4 vCPU VPS: too slow for the full mirror
- 8 vCPU VPS: workable for partial runs, still slow for the full mirror
- 16 vCPU VPS: best fit among the listed options for the full mirror

## Validation Notes

- Prisma format: passed
- Prisma generate: passed
- Build: passed
- Tests: passed (31 suites, 45 tests)

## Audit Conclusion

P38 is complete. The live crawl verified that the DRAP acquisition path works against real registrations, raw HTML is archived to R2, and structured crawl data is persisted successfully. The live throughput is materially slower than the earlier P37 benchmark projections, so the larger mirror should use the highest-capacity option from the requested set and should remain checkpointed.
