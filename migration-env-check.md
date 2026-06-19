# Migration Environment Check

Date: 2026-06-19
Target: new Railway project `DawaiSaver`

## Summary

No environment variables were copied to the new Railway target because Railway authentication failed before project creation. Secret values are intentionally omitted.

## Copied

None.

## Pending Copy

- `APP_GLOBAL_PREFIX`
- `APP_HOST`
- `APP_NAME`
- `APP_PORT`
- `CORS_ORIGINS`
- `CRAWLER_CONCURRENCY`
- `CRAWLER_USER_AGENT`
- `DATABASE_URL` from the new target PostgreSQL service only
- `DRAP_MIRROR_ARCHIVE_BATCH_SIZE`
- `DRAP_MIRROR_ARCHIVE_FALLBACK_BATCH_SIZE`
- `DRAP_MIRROR_ARCHIVE_SPOOL_DIR`
- `DRAP_MIRROR_ARCHIVE_UPLOAD_CONCURRENCY`
- `DRAP_MIRROR_AUTORUN`
- `DRAP_MIRROR_CHECKPOINT_EVERY`
- `DRAP_MIRROR_END_REGISTRATION`
- `DRAP_MIRROR_MAX_RETRIES`
- `DRAP_MIRROR_RUN_ID`
- `DRAP_MIRROR_START_REGISTRATION`
- `DRAP_MIRROR_TOTAL_REGISTRATIONS`
- `DRAP_MIRROR_WORKERS`
- `DRAP_SOURCE_URL`
- `GOOGLE_CLOUD_VISION_API_KEY`
- `INTERNAL_API_KEY`
- `JWT_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `JWT_REFRESH_SECRET`
- `JWT_SECRET`
- `R2_ACCESS_KEY_ID`
- `R2_ACCOUNT_ID`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_BASE_URL`
- `R2_SECRET_ACCESS_KEY`
- `RATE_LIMIT_MAX_REQUESTS`
- `RATE_LIMIT_TTL_SECONDS`
- `RUN_MIGRATIONS_ON_BOOT`
- `UPLOAD_DIR`
- `VITE_API_URL`

## Missing / Blocked

- Valid Railway API token for the target account.
- Workspace ID.
- Project ID.
- Environment ID.
- PostgreSQL service ID.
- New target `DATABASE_URL`.
- Local `pg_restore` and `psql` binaries in this shell.
- Wrangler CLI is not installed globally.

## Notes

- The backup inventory confirms these variable names existed in the migration package.
- Values were not written to this report.
- The source production database was not queried or modified.
