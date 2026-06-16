# Next Actions

## Immediate Next Task

Beta Launch & User Acceptance Testing (P11).

## Completed

- ✅ Cloudflare R2 as Single Source of Truth (storage policy)
- ✅ Wrangler CLI verification (whoami, R2 bucket list)
- ✅ Repository migration to emttspk/dawaisaver.pk
- ✅ Build and tests pass (34/34)
- ✅ SSH verified and operational
- ✅ Git push verified
- ✅ Railway token configured
- ✅ Railway project linked

## Pending

- Configure DATABASE_URL
- JWT authentication implementation
- Admin guards implementation
- Frontend API integration
- Beta seed dataset preparation

## Preconditions

- Backend build passes ✅
- Tests pass (34/34) ✅
- R2 storage policy documented ✅

## Out of Scope

- Marketplace
- Warehouse fulfillment
# P10 Next Actions - 2026-06-16

1. Relink Railway to the correct DawaiSaver.pk project and API service.
2. Rerun `railway variables` only after the Railway project name and service are verified as DawaiSaver.pk.
3. Set production variables: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `R2_BUCKET_NAME`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_PUBLIC_BASE_URL`.
4. Run `prisma migrate deploy` against the verified DawaiSaver PostgreSQL database.
5. Deploy backend to Railway and frontend to Cloudflare Pages after scope verification.
# P10 Railway Link Repair Next Actions - 2026-06-16

1. Authenticate Railway CLI with a token/account that can access project `dawaisaver.pk` (`e38bb3da-7ab5-4654-b504-101e74c92d5b`).
2. Run `railway link --project e38bb3da-7ab5-4654-b504-101e74c92d5b --environment production --service dawaisaver.pk --workspace emttspk`.
3. Validate with `railway status --json`; project id must equal `e38bb3da-7ab5-4654-b504-101e74c92d5b`.
4. Only after validation, run `railway variables` and classify required variables.
5. Only after validation and variable audit, run migrations/deployments.

