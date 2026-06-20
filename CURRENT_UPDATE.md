# CURRENT UPDATE

Date: 2026-06-20
Project: DawaiSaver.pk

## Production Verification

- `dawaisaver-admin.pages.dev` is healthy and serving the current admin SPA.
- `dawaisaver-web.pages.dev` is healthy and serving the current web SPA.
- Coolify backend is healthy at `http://yh5wt7bbkhqsjycey5df0lbe.178.105.221.236.sslip.io`.
- Backend `GET /health` now surfaces the deployment fingerprint in the response payload.
- Backend `GET /deploy-fingerprint` returns the deployed commit SHA `86edce2f2519be90b6bb78e0ae28df316587f25e` with source `SOURCE_COMMIT`.
- The deployed backend SHA matches the latest pushed `main` commit.

## Automation Verification

- GitHub -> Coolify deployment automation is verified end-to-end.
- The latest pushed commit on `main` is the commit currently deployed in production.
- Backend startup refreshed on redeploy, confirming the worker/service restarted successfully.

## Runtime Verification

- Backend database connectivity is healthy.
- DRAP mirror runtime is healthy and controllable.
- Protected DRAP controls remain functional after deployment.
- Scheduled background jobs remain available under the deployed runtime.

## Frontend and Routing

- The web frontend no longer references the retired Railway API in active configuration.
- Production frontend builds remain healthy after the deployment cleanup.

## Local Verification

- `node scripts/verify-migration-encoding.cjs` passed.
- `npm.cmd install` passed.
- `npx.cmd prisma generate` passed.
- `npm.cmd run build` passed.
- `npx.cmd prisma migrate deploy` passed against a disposable local PostgreSQL 18 database on `127.0.0.1:5434`.

## Documentation

- `CURRENT_UPDATE*.md` remains ignored in `.gitignore`.
- Obsolete markdown has already been archived under `docs/archive/`.
- No extra current-update snapshot files are present in the repository root.

## Progress

- Completion percentage: 100%
- Remaining blockers: none
