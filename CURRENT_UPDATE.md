# CURRENT UPDATE

Date: 2026-06-20
Project: DawaiSaver.pk
Mode: AGENT

## Migration Recovery

- Root cause 1: `prisma/migrations/20260617000000_add_medicine_master_data_structure/migration.sql` was saved with embedded NUL bytes, so Prisma passed a string with nulls to PostgreSQL and failed before executing the migration.
- Root cause 2: after re-encoding, the same migration still failed on the unquoted `primary` column in `product_therapeutic_categories`.
- Safe fix applied: re-encoded the migration SQL file as UTF-8 and quoted the reserved column as `"primary"` without changing the schema shape.
- Local validation result: the full migration chain replays successfully against a disposable PostgreSQL 18 container with raw `psql`.

## Live Verification Status

- `DATABASE_URL` is available in production, but this shell still cannot reach the Coolify/production terminal directly.
- Prisma CLI migration-history commands in this shell still return a generic `Schema engine error`, so production `migrate deploy` and `migrate status` remain unverified here.
- `mirror_runtime_control` is created successfully by the fixed migration chain in the disposable database.

## Notes

- `CURRENT_UPDATE.md` is a transient status file and should stay out of future commits once this recovery is complete.
- No production data was modified during the migration repairs.
