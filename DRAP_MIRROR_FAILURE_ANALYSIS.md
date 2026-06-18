# DRAP Mirror Failure Analysis

## Date

2026-06-18

## Scope

Production DRAP mirror completion review for DawaiSaver.pk, using Railway CLI logs, Railway status JSON, application logs, and the live public API surface.

## Verified Railway Target

- Project: `dawaisaver.pk`
- Project ID: `e38bb3da-7ab5-4654-b504-101e74c92d5b`
- Environment: `production`
- Service: `dawaisaver.pk`
- Postgres: present and online

## Mirror Run Evidence

- Run ID: `dc30a1d4-bb6b-4bff-a967-047a45dfcb7a`
- Start time: `2026-06-18 13:54:49 UTC`
- End time: `2026-06-18 15:01:23 UTC`
- Worker count: `4`
- Target count: `50,000`
- Registration range: `041350-091349`

## Final Mirror Summary

| Metric | Value |
| --- | ---: |
| Fetched | 50,000 |
| Parsed / success | 46,430 |
| Failed | 3,570 |
| Duplicates | 0 |
| Retries | 0 |
| Success rate | 92.86% |

Worker breakdown from live logs:

- Worker 1: 12,500 fetched, 11,218 parsed, 1,282 failed
- Worker 2: 12,500 fetched, 12,023 parsed, 477 failed
- Worker 3: 12,500 fetched, 11,207 parsed, 1,293 failed
- Worker 4: 12,500 fetched, 11,982 parsed, 518 failed

## Failure Root Cause

The mirror did not fail at the fetch/retry layer. Live logs show `retries: 0` across all workers, so these failures were not driven by fetch retries or timeout recovery.

From the acquisition code, a row can be counted as failed when any of the following throws after fetch success:

- parser rejection of a non-product page
- missing registration number in the HTML
- record persistence failure
- archive write / upload failure

The code currently stores all row failures under the same row-level failure path and emits `DRAP_DETAIL_PARSE_FAILED` in `import_errors`, so the exact per-class breakdown cannot be proven without reading the protected row tables.

Best supported conclusion: the dominant failure mode is source-page/content failure during detail-page processing, not duplicate handling and not fetch retry exhaustion.

## Retry Safety

Failed registrations are safe to retry.

Reasoning:

- The acquisition path is idempotent by registration number.
- Product persistence uses upsert-style matching on registration number and signature.
- Composition rows are guarded by uniqueness checks.
- Duplicate rows are prevented within a run.

## Catalog Completeness

Mirror acquisition completeness is:

`46,430 / 50,000 = 92.86%`

That is the strongest verified completeness number available from the live run.

The public production search surface currently returns no results for known medicine queries such as `Panadol`, `Paracetamol`, and `Augmentin`, and generic search returns the same empty result shape. That strongly suggests the searchable catalog itself has not been materialized in production, even though the mirror acquisition batch completed.

Because the protected database row counts were not safely accessible from the current shell session, the exact production totals for:

- products
- manufacturers
- generics
- molecules
- composition groups
- ATC mappings

remain unverified here.

## Recommendation

**A. Retry failed registrations only**

Do not start a fresh crawl yet. The target range was fully processed, the failure rate is bounded, and the current evidence points to row-level source/content failures rather than a bad target range or duplicate-driven restart.

## Recovery Procedure

1. Retry the failed registrations from the same range.
2. Re-check the mirror status summary.
3. Verify whether the searchable catalog surface now returns products.
4. Only then decide whether a wider crawl or catalog rebuild is needed.
