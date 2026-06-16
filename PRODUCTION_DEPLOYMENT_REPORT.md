# Production Deployment Report

## Date

2026-06-16

## Deployment Status

Blocked before production mutation.

No production secrets, variables, database migrations, R2 objects, or Railway deployments were changed because the Railway CLI still resolves to the wrong project.

## Railway Status

Expected:

- Project: `dawaisaver.pk`
- Project ID: `e38bb3da-7ab5-4654-b504-101e74c92d5b`
- Service: `dawaisaver.pk`
- Environment: `production`

Actual `railway status`:

- Project: `AI Photo Studio WhatsApp`
- Project ID: `ad62f340-fcfd-4989-b5bb-18753b28d8c8`
- Service: `None`
- Environment: `production`

Relink command failed with `Unauthorized`.

## Variable Status

Production variable audit was not performed because Railway identity is not verified.

| Variable | Status |
| --- | --- |
| `DATABASE_URL` | Unverified |
| `JWT_SECRET` | Unverified |
| `JWT_REFRESH_SECRET` | Unverified |
| `R2_BUCKET_NAME` | Unverified |
| `R2_ACCOUNT_ID` | Unverified |
| `R2_ACCESS_KEY_ID` | Unverified |
| `R2_SECRET_ACCESS_KEY` | Unverified |
| `R2_PUBLIC_BASE_URL` | Unverified |
| `GOOGLE_CLOUD_VISION_API_KEY` | Unverified |

## Migration Status

- `npx prisma generate`: passed.
- `npx prisma migrate deploy`: not run because no verified production `DATABASE_URL` is available.
- Production migration status: blocked.

## R2 Status

- Wrangler CLI available through `npx wrangler` at version `4.100.0`.
- Wrangler account status: unauthenticated.
- Bucket access: blocked.
- Upload access: blocked.
- Public URL verification: blocked.

## Backend Deployment Status

- Local backend build: passed.
- Local backend tests: passed, 24 suites and 34 tests.
- `railway up`: not run because the CLI is linked to the wrong Railway project.
- `/health`: not verified against production.
- `/health/database`: not verified against production.
- `/api/docs`: not verified against production.

## Frontend Status

- `apps/web` production build: passed.
- `apps/admin` production build: passed.
- Cloudflare Pages deployment: prepared at build-output level only; not deployed because Wrangler is unauthenticated.
- Frontend environment variable required for deployment: `VITE_API_URL`.

## Security Status

| Control | Status |
| --- | --- |
| JWT access and refresh tokens | Implemented locally, production secrets unverified |
| Admin guards | Implemented |
| Internal guard | Implemented, production key unverified |
| CORS | Implemented, production origins unverified |
| Rate limiting | Implemented |
| Helmet | Implemented |

## Beta Dataset Status

Minimal closed-beta seed dataset added to `prisma/seed.ts` for medicines, manufacturers, generics, compositions, alternatives, and audit logging.

## Known Blockers

1. Railway project identity mismatch.
2. Unauthorized Railway relink attempt.
3. Production variables cannot be audited safely.
4. Production database migrations cannot run safely.
5. Backend deployment cannot run safely.
6. Wrangler is not authenticated for R2 or Pages checks.
