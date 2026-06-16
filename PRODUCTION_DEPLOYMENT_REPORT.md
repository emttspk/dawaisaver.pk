# Production Deployment Report

## Date

2026-06-16

## Repository

- Remote: `git@github.com:emttspk/dawaisaver.pk.git`
- Branch: `main`
- Local HEAD: `943bdee`
- Push status: blocked by GitHub SSH public key rejection

## Railway

| Item | Status |
| --- | --- |
| Workspace | `emttspk's Projects` |
| Project | `dawaisaver.pk` |
| Project ID | `e38bb3da-7ab5-4654-b504-101e74c92d5b` |
| Environment | `production` |
| Service | `dawaisaver.pk` |
| Service ID | `d9fc0b7d-535b-4db4-b2eb-93dfc39d31c9` |
| Deployment | `6f0d22c0-fb6b-4b3d-93d8-a8048adc9adc` |
| Status | Online |

## Runtime Configuration

| Variable | Status |
| --- | --- |
| `DATABASE_URL` | Missing |
| `JWT_SECRET` | Present |
| `JWT_REFRESH_SECRET` | Present |
| `R2_ACCOUNT_ID` | Missing |
| `R2_BUCKET_NAME` | Missing |
| `R2_ACCESS_KEY_ID` | Missing |
| `R2_SECRET_ACCESS_KEY` | Missing |
| `R2_PUBLIC_BASE_URL` | Missing |

## Database

- Railway Postgres resource: not present in `railway status` resource list.
- `databaseConfigured`: false in Railway startup diagnostics.
- `npx prisma generate`: passed.
- `npx prisma migrate deploy`: blocked because `DATABASE_URL` is missing.
- Minimal beta seed dataset exists in `prisma/seed.ts`, but it was not applied to production because no database connection is configured.

## Health

| Endpoint | Local production-mode result without DB | Production evidence |
| --- | --- | --- |
| `/health` | HTTP 200, degraded | Requires DB restoration for full OK |
| `/health/database` | HTTP 200, error | Requires `DATABASE_URL` |
| `/health/application` | HTTP 200, ok | Railway healthcheck reached this path |

## Cloudflare R2

| Check | Result |
| --- | --- |
| Wrangler version | 4.100.0 |
| Cloudflare auth | Valid OAuth session |
| Account ID | Verified locally, not repeated in reports as a secret-adjacent identifier |
| Bucket `dawaisaver-pk` | Present |
| Remote object upload | Pass |
| Remote object readback | Pass |
| Remote object cleanup | Pass |
| Railway API R2 vars | Missing |

## Deployment Conclusion

The API deployment is online and observable. Production data workflows remain blocked by missing database configuration and missing R2 runtime credentials.
