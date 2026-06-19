# Restore Validation Report

Date: 2026-06-19
Source backup: `D:\DawaiSaver.pk\backups\migration-20260618-215605`

## Result

Target restore was not performed. Railway authentication failed before the target project and PostgreSQL service could be created.

## Verified Locally

- `production.dump` exists.
- `schema.sql` exists.
- `data.sql` exists.
- SHA256 verification passed for `production.dump`.
- Prior `pg_restore --list` verification artifact exists at `verification/pg-restore-list.txt`.
- R2 inventory exists with 510 objects and estimated size 183.0 MiB.
- API build passed with `npm.cmd run build`.

## Data Export Row Evidence

Read-only row counts from `data.sql`:

| Table | Rows in export |
| --- | ---: |
| `users` | 1 |
| `products` | 0 |
| `generics` | 0 |
| `product_compositions` | 0 |
| `canonical_products` | 0 |
| `discovery_candidates` | 0 |
| `import_batches` | 76 |
| `import_batch_items` | 400276 |

Notes:

- The schema contains `product_compositions`; no standalone `compositions` table was found.
- No literal `mirror` table name was found in the dump manifest. The closest migration evidence is import and DRAP/archive-related data.

## Target Verification Queries

Not run because the target database was not provisioned.

Required once Railway access works:

```sql
select count(*) from users;
select count(*) from products;
select count(*) from generics;
select count(*) from product_compositions;
select count(*) from import_batches;
select count(*) from import_batch_items;
```

## Smoke Tests

Not run because the API was not deployed to a new target.

Required smoke test list:

- Search products.
- Search generics.
- Medicine details.
- Admin login.
- R2 access.
- Uploads.
- Public API endpoints.
- `/health/application`.
- Database health endpoint.

## Readiness Review

- Estimated final cutover downtime after a validated target restore: 15-30 minutes.
- Rollback: keep source Railway services untouched, keep DNS pointed at current production until target validation passes, and revert DNS to source if target checks fail.
- DNS steps: lower TTL before cutover, switch only API/Web records after approval, monitor health and smoke tests, keep old target available through the rollback window.
- Remaining risks: invalid Railway access, missing target IDs, unavailable PostgreSQL client tools, unvalidated target environment variables, no live R2 credential check in this run.

## Percentages

- Restore success: 0% against the new target.
- Smoke test success: 0% against the new target.
- Cutover readiness: 20%.
