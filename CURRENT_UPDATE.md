# Current Update - P38 Live DRAP Verification Crawl

## Date

2026-06-18

## Status

P38 live DRAP verification crawl is complete. The run used the real DRAP endpoint, uploaded raw HTML to R2, and wrote structured rows into the local verification database.

## R2 Verification

| Variable | Status |
|----------|--------|
| R2_ACCOUNT_ID | Present |
| R2_ACCESS_KEY_ID | Present |
| R2_SECRET_ACCESS_KEY | Present |
| R2_BUCKET_NAME | Present |
| R2_PUBLIC_BASE_URL | Present |

## Live Crawl Results

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

## P37 Comparison

| P37 Projection | Value |
|----------------|-------|
| 10,000 records | 1.0 hours |
| 50,000 records | 5.2 hours |
| 150,000 records | 15.6 hours |

## Live Projection

| Full Mirror Size | Estimated Runtime |
|-----------------|-------------------|
| 150,000 records | 54.41 hours |

## Recommendation

- Railway only: Suitable for smaller checkpointed validations, not the full mirror at this live pace
- 4 vCPU VPS: Not recommended for the full mirror
- 8 vCPU VPS: Borderline for partial mirror work, still slow for the full mirror
- 16 vCPU VPS: Recommended among the listed options for the full mirror

## Validation

- Prisma format passed
- Prisma generate passed
- Build passed
- Tests passed

## Protected Scope Protocol

- No breaking changes
- No schema changes
- Existing APIs preserved
- Existing matching logic preserved
- Existing WHO normalization preserved
- Existing composition generation preserved
