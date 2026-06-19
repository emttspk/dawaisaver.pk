# Migration Environment Check

Date: 2026-06-19
Target Railway project: `dawaisaver-pk`
Project ID: `42823e2c-e9db-4669-9dd9-d7a22d0f0bcb`
Environment ID: `e1c3d223-85b1-4382-b04d-e45bebef0382`

## Summary

PostgreSQL service variables exist, but application variables were not copied because the database restore failed and API deployment was not safe to proceed. Secret values are intentionally omitted.

## Copied

- PostgreSQL service variables were created by Railway for `Postgres-_c2X`.
- `DATABASE_PUBLIC_URL`, `DATABASE_URL`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, and `PGDATABASE` were confirmed present without printing values.

## Pending Copy

- `APP_GLOBAL_PREFIX`
- `APP_HOST`
- `APP_NAME`
- `APP_PORT`
- `CORS_ORIGINS`
- `CRAWLER_CONCURRENCY`
- `CRAWLER_USER_AGENT`
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

- Workspace ID is unavailable from the successful CLI/API calls.
- `railway whoami` is unauthorized for the project token.
- Target Postgres restore is blocked by a 500 MB volume running out of disk space during WAL recovery.
- Railway volume size is not exposed in the checked create/update GraphQL inputs, so an in-place resize path is not available from this surface.
- API service variables are not copied.
- API service is not deployed.
- Wrangler CLI is not installed globally.

## Hetzner/Coolify Path

- Use this path if Railway cannot provide a larger database volume.
- Recommended minimum: 2 vCPU, 4 GB RAM, 40 GB SSD.
- Preferred: 4 vCPU, 8 GB RAM, 80 GB NVMe.
- Restore PostgreSQL first, then the API, and keep the source Railway untouched until validation is complete.

## Notes

- No secret values were written to this report.
- Source production database was not queried or modified.
- Backup files were not deleted or modified.
