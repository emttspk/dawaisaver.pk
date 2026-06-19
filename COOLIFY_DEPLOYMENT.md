# Coolify Deployment Guide

## Target Platform

- Hetzner VPS
- Coolify
- PostgreSQL 18
- Cloudflare R2
- Cloudflare DNS

## Runtime Baseline

- App entrypoint: `node dist/main.js`
- Build command: `npm run build`
- Prisma client generation: `npm run prisma:generate`
- Migration command: `npm run prisma:migrate`

## Environment Variables

Required production variables:

```env
DATABASE_URL=
NODE_ENV=production
APP_PORT=3000
APP_HOST=0.0.0.0
CORS_ORIGINS=
JWT_SECRET=
JWT_REFRESH_SECRET=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=dawaisaver-pk
R2_PUBLIC_BASE_URL=
MIRROR_ENABLED=false
MIRROR_MIGRATION_MODE=true
```

## Deployment Notes

- Keep the DRAP mirror paused during migration verification.
- Do not schedule acquisition jobs until the checkpoint is approved.
- Ensure `DATABASE_URL` points at the restored PostgreSQL 18 instance.
- Keep Cloudflare R2 credentials out of source control and inject them via Coolify secrets.

## Compatibility Notes

- PostgreSQL 18 is compatible with the current Prisma schema and existing migrations.
- The migrations use standard PostgreSQL features such as `jsonb`, `pgcrypto`, and GIN indexes.
- `prisma/seed.ts` uses Prisma Client only and does not depend on platform services.

## Validation Sequence

1. Run `npm run prisma:generate`.
2. Run `npm run build`.
3. Run `npm test -- --runInBand`.
4. Start the API in Coolify.
5. Verify `/health`, `/health/application`, and `/health/database`.
6. Confirm mirror status remains paused.

## Operational Guardrails

- Do not enable the mirror in Coolify until migration verification is complete.
- Do not point any background worker at DRAP acquisition until the freeze is lifted intentionally.
- Do not rely on retired deployment settings or retired environment variables.
