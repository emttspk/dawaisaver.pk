# AI Code Audit Report

## Date

2026-06-19

## Phase

DawaiSaver Hetzner Migration Verification

## Scope

Audit of Coolify deployment readiness, DRAP mirror freeze enforcement, PostgreSQL 18 compatibility, Prisma compatibility, seed compatibility, and remaining deployment references.

## Findings

| Area | Result | Evidence |
|------|--------|----------|
| Legacy runtime paths | Removed | `src/main.ts`, the DRAP worker, and the DRAP job path no longer auto-launch mirror execution |
| Mirror freeze | Pass | `MIRROR_ENABLED=false` and `MIRROR_MIGRATION_MODE=true` are wired into config and status reporting |
| Admin-triggered mirror launch | Blocked | `DrapService.importFromSource()` and the DRAP import controller now guard execution |
| Worker-triggered mirror launch | Blocked | `src/workers/drap-mirror.worker.ts` and `src/jobs/drap-mirror.job.ts` enforce the freeze guard |
| Deployment baseline | Updated | Docker, Compose, and docs now align to Hetzner/Coolify and PostgreSQL 18 |
| Prisma schema and migrations | Compatible | Migrations use standard PostgreSQL features already supported by PostgreSQL 18 |
| Seed path | Compatible | `prisma/seed.ts` uses Prisma Client only and does not depend on platform-specific services |
| Catalog recovery | Deferred | The build pipeline remains present but is intentionally not being executed yet |

## Coolify Deployment Values

### API Service

- Install Command: `npm ci`
- Build Command: `npm run prisma:generate && npm run build`
- Start Command: `npm run start`
- Health Check Path: `/health/application`
- Required Environment Variables: `NODE_ENV`, `APP_PORT`, `APP_HOST`, `APP_GLOBAL_PREFIX`, `CORS_ORIGINS`, `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_BASE_URL`, `MIRROR_ENABLED`, `MIRROR_MIGRATION_MODE`

### Admin Service

- Install Command: `npm ci`
- Build Command: `npm run build`
- Start Command: static site deployment preferred, or `npm run preview -- --host 0.0.0.0 --port 4173`
- Health Check Path: `/`
- Required Environment Variables: `VITE_API_URL` when the admin bundle cannot share the same origin as the API

## Conclusion

The repository no longer has an active legacy mirror execution path in the codebase. The production deployment posture is Hetzner plus Coolify with PostgreSQL 18, and the DRAP mirror remains paused until migration verification is approved. Coolify deployment inputs are now documented for both the API and admin services.
