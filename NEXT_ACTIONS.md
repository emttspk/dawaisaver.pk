# Next Actions

## P16 Remaining Work

1. Attach `DATABASE_URL` from Railway Postgres.
2. Confirm the Railway Postgres service is linked to the API service.
3. Verify `R2_BUCKET_NAME`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_PUBLIC_BASE_URL` in the runtime environment.
4. Run `npx.cmd prisma generate`.
5. Run `npx.cmd prisma migrate deploy`.
6. Run `npx.cmd prisma db seed`.
7. Verify `/health`, `/health/database`, and `/health/application`.
8. Run `npm.cmd run build` and `npm.cmd test`.

## Current State

- OCR uploads now use Cloudflare R2 instead of local filesystem writes.
- Prisma client generation passes.
- Build and tests pass.
- The remaining production blocker is runtime database attachment and confirmation of the R2 variables.
