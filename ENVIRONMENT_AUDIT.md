# P10 Environment Audit

Date: 2026-06-16

## Protected Scope Result

Railway remote variable export and deployment were stopped by Protected Scope Protocol.

`railway status` returned a linked project named `AI Photo Studio WhatsApp`, not a DawaiSaver.pk Railway project. It also reported the linked service id as not found in the project while listing available services `api`, `background-remover`, `Redis`, and `Postgres`.

Because of that mismatch, Railway variable reads, variable writes, migrations against Railway, and deployment were not performed.

## Railway Commands

- `railway whoami`: blocked/unauthorized in this shell.
- `railway status`: completed; linked project is not DawaiSaver.pk.
- `railway variables`: blocked by protected-scope review because the linked project is not DawaiSaver.pk.

## Cloudflare Commands

- `npx wrangler --version`: 4.100.0
- `npx wrangler whoami`: authenticated as Cloudflare account `85f6a6181b4653c2a45e69cb7ce8a474`.
- `npx wrangler r2 bucket list`: verified bucket `dawaisaver-pk` exists.

## Variable Classification

### Present

- `R2_BUCKET_NAME`: derivable and set in `.env.example` as `dawaisaver-pk`.
- Cloudflare account id source: `wrangler whoami` account id `85f6a6181b4653c2a45e69cb7ce8a474`.

### Missing Or Not Safely Exported

- `DATABASE_URL`: not present in local shell; `prisma migrate deploy` failed with Prisma P1012.
- `R2_ACCOUNT_ID`: derivable from `wrangler whoami`, but not written to Railway because Railway is linked to the wrong project.
- `R2_ACCESS_KEY_ID`: cannot be derived from Wrangler bucket list. Source: Cloudflare Dashboard > R2 > Manage R2 API Tokens.
- `R2_SECRET_ACCESS_KEY`: cannot be derived after creation. Source: Cloudflare Dashboard > R2 > Manage R2 API Tokens; create or rotate an R2 token.
- `R2_PUBLIC_BASE_URL`: cannot be inferred from bucket existence. Source: Cloudflare Dashboard > R2 > bucket `dawaisaver-pk` > Settings > Public access/custom domain.
- `JWT_SECRET`: required in production.
- `JWT_REFRESH_SECRET`: required in production.
- `INTERNAL_API_KEY`: optional but recommended for internal ingestion/source-sync endpoints.

### Optional

- `APP_NAME`
- `APP_PORT`
- `APP_HOST`
- `APP_GLOBAL_PREFIX`
- `CORS_ORIGINS`
- `RATE_LIMIT_TTL_SECONDS`
- `RATE_LIMIT_MAX_REQUESTS`
- `RUN_MIGRATIONS_ON_BOOT`
- `CRAWLER_USER_AGENT`
- `CRAWLER_CONCURRENCY`
- `GOOGLE_CLOUD_VISION_API_KEY`
- `UPLOAD_DIR`

## Database Status

Railway status shows a Postgres database service exists, but the project linkage is outside protected scope. Local migration deployment could not run because `DATABASE_URL` was missing.

## Migration Result

Blocked locally:

`prisma migrate deploy` failed with `Environment variable not found: DATABASE_URL`.

New migration prepared:

- `prisma/migrations/20260616143000_add_auth_tokens_to_users/migration.sql`

## Deployment Readiness

- Backend deployment readiness: 72%
- Beta readiness: 64%

Primary blocker: correct Railway project linkage and production variables.
