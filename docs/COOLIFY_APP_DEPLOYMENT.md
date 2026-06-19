# Coolify App Deployment

## Scope

This document covers the Hetzner/Coolify deployment for:

- API service
- Admin service

## Platform Assumptions

- Hetzner VPS is the production host.
- Coolify manages the runtime processes.
- PostgreSQL 18 is the production database.
- Cloudflare DNS routes public traffic.
- Cloudflare R2 stores persistent uploaded files and generated artifacts.
- DRAP mirror execution remains frozen with `MIRROR_ENABLED=false` and `MIRROR_MIGRATION_MODE=true`.

## API Service

### Source Directory

- Repository root

### Install Command

```bash
npm ci
```

### Build Command

```bash
npm run prisma:generate && npm run build
```

### Start Command

```bash
npm run start
```

### Health Check Path

```text
/health/application
```

### Required Environment Variables

- `NODE_ENV=production`
- `APP_PORT=3000`
- `APP_HOST=0.0.0.0`
- `APP_GLOBAL_PREFIX=api`
- `CORS_ORIGINS=https://admin.example.com,https://api.example.com`
- `DATABASE_URL=postgresql://postgres:<password>@<host>:5432/dawaisaver?schema=public`
- `JWT_SECRET=<strong-secret>`
- `JWT_REFRESH_SECRET=<strong-secret>`
- `R2_ACCOUNT_ID=<cloudflare-account-id>`
- `R2_ACCESS_KEY_ID=<cloudflare-r2-access-key>`
- `R2_SECRET_ACCESS_KEY=<cloudflare-r2-secret-key>`
- `R2_BUCKET_NAME=dawaisaver-pk`
- `R2_PUBLIC_BASE_URL=https://<r2-public-domain>`
- `MIRROR_ENABLED=false`
- `MIRROR_MIGRATION_MODE=true`

### Optional Environment Variables

- `RUN_MIGRATIONS_ON_BOOT=false`
- `INTERNAL_API_KEY=<internal-key>`
- `GOOGLE_CLOUD_VISION_API_KEY=<google-vision-key>`
- `UPLOAD_DIR=uploads`

## Admin Service

### Source Directory

- `apps/admin`

### Install Command

```bash
npm ci
```

### Build Command

```bash
npm run build
```

### Start Command

- Preferred Coolify mode: static site deployment, no start command required
- If a process command is required by the platform, use:

```bash
npm run preview -- --host 0.0.0.0 --port 4173
```

### Health Check Path

```text
/
```

### Required Environment Variables

- `VITE_API_URL=https://api.example.com/api`

### Notes

- `VITE_API_URL` is a build-time variable for the admin bundle.
- If the admin app and API share the same origin, the app can rely on the default `/api` base path.

## PostgreSQL Startup Order

1. Start PostgreSQL 18.
2. Run `npm run prisma:generate`.
3. Run `npm run prisma:migrate`.
4. Start the API service.
5. Build and publish the admin service.

## Storage Paths

- API persistence should stay in PostgreSQL and Cloudflare R2.
- Local filesystem storage is ephemeral and should only be used for temporary build artifacts.
- No Coolify persistent volume is required for production uploads when R2 is configured correctly.

## Verification Checklist

- Confirm API health returns success at `/health/application`.
- Confirm database health returns success at `/health/database`.
- Confirm admin loads and can reach the API through the configured base URL.
- Confirm mirror status stays paused.
- Confirm catalog recovery stays deferred until explicitly approved.
