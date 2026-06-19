# Hetzner/Coolify Restore Plan

Date: 2026-06-19
Source backup: `D:\DawaiSaver.pk\backups\migration-20260618-215605`

## Why This Path

The Railway restore failed because the target Postgres volume is 500 MB and ran out of disk space during WAL recovery. The Railway GraphQL API surface checked in this run does not expose a volume-size field in create/update inputs, so there is no clear in-place resize path available from the current CLI/API surface.

## Recommended Minimum Infrastructure

- Minimum: 2 vCPU, 4 GB RAM, 40 GB SSD.
- Preferred: 4 vCPU, 8 GB RAM, 80 GB NVMe.
- Database should have enough room for the dump, WAL, indexes, and temporary restore overhead.

## Restore Order

1. Provision Hetzner VM.
2. Install Docker and Coolify.
3. Create PostgreSQL service with persistent storage sized above the preferred minimum.
4. Restore `production.dump` into the new PostgreSQL service.
5. Run verification queries for `users`, `products`, `generics`, `product_compositions`, `import_batches`, and `import_batch_items`.
6. Copy application environment variables without printing values.
7. Deploy API only.
8. Verify `/health/application` and `/health/database`.
9. Run smoke tests.
10. Keep DNS pointed at source Railway until explicit cutover approval.

## Risks

- DNS propagation and cutover timing.
- PostgreSQL storage sizing if the imported data expands beyond the current estimate.
- R2 credentials and bucket access must be validated before user-facing traffic.

## Rollback

- Leave source Railway untouched.
- Keep the Railway project live until Hetzner validation passes.
- If restore or API validation fails, stop before DNS changes and fix the Hetzner stack in place.

## Notes

- Do not run seed, mirror, or import jobs during validation.
- Do not delete backup files.
- Do not modify the source production database.
