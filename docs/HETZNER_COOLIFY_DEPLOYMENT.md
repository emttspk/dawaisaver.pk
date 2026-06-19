# Hetzner Coolify Deployment

## Production Platform

- Hetzner VPS
- Coolify
- PostgreSQL 18
- Cloudflare R2
- Cloudflare DNS

## Runtime Model

- API service runs in Coolify on the Hetzner VPS.
- PostgreSQL runs as the production database on Hetzner.
- Cloudflare R2 stores persistent uploads and generated artifacts.
- Cloudflare DNS points the public domains to the current production endpoints.

## Required Environment Variables

```env
NODE_ENV=production
APP_PORT=3000
APP_HOST=0.0.0.0
APP_GLOBAL_PREFIX=api
CORS_ORIGINS=
DATABASE_URL=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=dawaisaver-pk
R2_PUBLIC_BASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
MIRROR_ENABLED=false
MIRROR_MIGRATION_MODE=true
```

## Deployment Steps

1. Build the application.
2. Run database migrations.
3. Start the API service in Coolify.
4. Verify `/health`, `/health/database`, and `/health/application`.
5. Verify the catalog pipeline commands against the restored database.

## Notes

- Do not use retired deployment files or settings for production.
- Keep generated reports out of source control.
- Use the catalog CLI for recovery and verification runs.
- Leave the mirror frozen until Hetzner migration verification is complete.
