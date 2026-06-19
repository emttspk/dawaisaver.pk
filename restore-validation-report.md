# Restore Validation Report

Date: 2026-06-19
Source backup: `D:\DawaiSaver.pk\backups\migration-20260618-215605`

## Target

- Workspace name: `Muhammad Nazim Saeed's Projects`
- Workspace ID: unavailable from CLI/API surface used in this run.
- Project name: `dawaisaver-pk`
- Project ID: `42823e2c-e9db-4669-9dd9-d7a22d0f0bcb`
- Environment: `production`
- Environment ID: `e1c3d223-85b1-4382-b04d-e45bebef0382`
- Database service name: `Postgres-_c2X`
- Database service ID: `2fe3d19a-b46f-414b-98fa-1f5bbe6e9eea`
- Database service instance ID: `b4807db5-814e-4697-8a92-9bad7944c546`
- Volume ID: `96fc480f-4438-4ca6-b4c7-5d51011c7fc4`
- Volume size: 500 MB

## Backup Verification

- `production.dump` exists.
- `schema.sql` exists.
- `data.sql` exists.
- SHA256 verification passed.
- Prior `pg_restore --list` verification artifact exists.
- R2 inventory exists with 510 objects and estimated size 183.0 MiB.
- API build passed with `npm.cmd run build`.

## Restore Result

Restore did not complete successfully on Railway.

What succeeded:

- Connected to target Railway PostgreSQL through `DATABASE_PUBLIC_URL`.
- Began `pg_restore` with PostgreSQL 18 client tools.
- Dropped/created schema objects.
- Began loading table data.

What failed:

- `pg_restore` failed while loading `public.import_batch_items`.
- Railway Postgres logs show `No space left on device` while writing WAL recovery files.
- The target Postgres service then closed connections during recovery.
- The Railway API surface checked in this run does not provide a direct size update input for the volume, so the 500 MB limit could not be increased in place from the available CLI/API.

## Table Count Verification

Target row count checks could not be run because the target database is not accepting connections after the disk-space failure.

Read-only evidence from `data.sql`:

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

- The schema uses `product_compositions`; no standalone `compositions` table was found.
- No literal `mirror` table name was found in the dump manifest.

## Health Checks

- API startup: not deployed.
- `/health/application`: not run.
- Database health: failed by implication because Postgres is not accepting connections.

## Smoke Tests

Not run because API deployment was not performed after the restore failure.

Pending smoke tests:

- Product search.
- Generic search.
- Medicine details.
- Admin login.
- Uploads.
- R2 access.

## Build Validation

- `npm.cmd run build`: passed.

## Remaining Work

- Continue on Railway only if a larger database volume can be provisioned through a supported path.
- Otherwise move to the Hetzner/Coolify restore plan in `migration-hetzner-coolify-plan.md`.
- Verify table counts from the restored target database after a successful restore.
- Copy application variables without printing values.
- Deploy API only.
- Run health checks and smoke tests.
- Do not switch DNS until explicit cutover approval.

## Percentages

- Restore success: 35% attempt progress, 0% usable target restore.
- Smoke test success: 0%.
- Cutover readiness: 25%.
