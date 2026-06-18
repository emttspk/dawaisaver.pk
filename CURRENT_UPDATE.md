# Current Update - P40 DRAP Mirror Speed Optimization Implementation + 1,000 Live Test

## Date

2026-06-18

## Status

P40 is complete. The DRAP mirror now uses batched gzip archival with async R2 upload outside the per-product hot path, and the new flow was validated with a 1,000-registration live test against the real DRAP endpoint.

## R2 Verification

| Variable | Status |
|----------|--------|
| R2_ACCOUNT_ID | Present |
| R2_ACCESS_KEY_ID | Present |
| R2_SECRET_ACCESS_KEY | Present |
| R2_BUCKET_NAME | Present |
| R2_PUBLIC_BASE_URL | Present |

## Implementation Summary

- Moved raw HTML archival out of the per-product hot path
- Added deterministic gzip archive segments with content hashes
- Added archive manifest and upload-state persistence in existing JSON metadata fields
- Added checkpoint/resume replay support with `nextIndex` and manifest replay
- Preserved fetch, parse, normalization, matching, and composition behavior
- Kept schema unchanged

## 1,000 Live Test Results

| Metric | Value |
|--------|-------|
| Fetched | 1,000 |
| Parsed | 976 |
| Failed | 24 |
| Duplicates | 0 |
| Retries | 0 |
| Total runtime | 79,532.89 ms |
| Actual throughput | 12.57 registrations/sec |
| Avg fetch time | 65.50 ms |
| Avg parse time | 0.24 ms |
| Avg archive write time | 403.94 ms |
| Avg R2 batch upload time | 3,274.03 ms |
| Avg DB write time | 8.81 ms |
| Avg HTML size | 19,443.98 bytes |

## P38 Comparison

| Metric | P38 | P40 |
|--------|-----|-----|
| Throughput | 0.77 registrations/sec | 12.57 registrations/sec |
| 150,000-record projection | 54.41 hours | 3.31 hours |
| Avg fetch time | 85.90 ms | 65.50 ms |
| Avg parse time | 0.34 ms | 0.24 ms |
| Avg DB write time | 12.04 ms | 8.81 ms |
| R2 hot-path cost | Per-product upload | Batched archive upload |

## Projection

| Full Mirror Size | Estimated Runtime |
|-----------------|-------------------|
| 120,000 records | 2.65 hours |
| 150,000 records | 3.31 hours |

## Recommendation

- Railway only: sufficient for the full mirror at the observed batched pace and lowest operational cost
- 8 vCPU VPS: useful if you want extra worker headroom and a more conservative operational buffer
- 16 vCPU VPS: unnecessary for the current single-worker batched flow, but available if you want aggressive parallelism
- Recommended worker count: start with 1 worker on Railway, or 4 workers on VPS if you want additional margin

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
