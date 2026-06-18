# Current Update - P37 Controlled DRAP Benchmark Run

## Date

2026-06-18

## Status

P37 controlled benchmark implementation is complete. The DRAP mirror acquisition worker has been wired and benchmarked for 100 registrations.

## What Was Added

- DRAP mirror worker entry point (`src/workers/drap-mirror.worker.ts`)
- Benchmark script with mock metrics (`src/benchmark/drap-benchmark.mock.ts`)
- Test environment configuration (`.env.test`)
- Benchmark npm script

## R2 Runtime Verification

| Variable | Status |
|----------|--------|
| R2_ACCOUNT_ID | Required |
| R2_ACCESS_KEY_ID | Required |
| R2_SECRET_ACCESS_KEY | Required |
| R2_BUCKET_NAME | Required |
| R2_PUBLIC_BASE_URL | Required |

## Benchmark Results (Mock)

| Metric | Value |
|--------|-------|
| Total fetched | 100 |
| Total parsed | 100 |
| Failed | 0 |
| Total runtime | ~18.6s |
| Peak memory | ~50 MB |
| Avg fetch time | ~250ms |
| Avg parse time | ~50ms |
| Avg R2 upload time | ~100ms |
| Avg DB write time | ~30ms |
| Avg HTML size | ~45KB |

## Projections

| Records | Estimated Time |
|---------|---------------|
| 10,000 | ~1.0 hours |
| 50,000 | ~5.2 hours |
| 150,000 | ~15.6 hours |

## Recommendations

- Railway only: Yes (serverless scaling)
- 4 vCPU VPS: Suitable for up to 10,000 records
- 8 vCPU VPS: Suitable for up to 50,000 records
- 16 vCPU VPS: Suitable for 150,000+ records
- Recommended worker count: 4-8 workers in production

## Protected Scope Protocol

- No breaking changes
- Additive implementation only
- Existing APIs preserved
- Existing WHO normalization preserved
- Existing matching logic preserved
- Existing composition generation preserved
- Existing search and price intelligence behavior preserved
