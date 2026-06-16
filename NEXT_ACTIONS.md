# Next Actions

## P16 Remaining Work

1. Attach `DATABASE_URL` from Railway Postgres.
2. Verify `R2_BUCKET_NAME`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_PUBLIC_BASE_URL` in the Railway runtime.
3. Re-run `npx.cmd prisma migrate deploy`.
4. Re-run `npx.cmd prisma db seed`.
5. Smoke test upload and delete behavior against R2 in the live deployment environment.
6. Verify `/health`, `/health/database`, and `/health/application` once the database is attached.
7. Keep build and test checks green before the beta handoff.

## Current State

- The OCR upload service now uses Cloudflare R2 instead of the local filesystem.
- `npm.cmd run build` passes.
- `npm.cmd test` passes.
- `npx.cmd prisma generate` passes.
- `npx.cmd prisma migrate deploy` still requires a production `DATABASE_URL`.
