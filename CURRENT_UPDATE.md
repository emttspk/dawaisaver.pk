# CURRENT UPDATE

Date: 2026-06-20
Project: DawaiSaver.pk

## Production Verification

- `dawaisaver-admin.pages.dev` returns HTTP 200 and serves the current admin SPA shell.
- `dawaisaver-web.pages.dev` now returns HTTP 200 and serves the current customer SPA shell.
- Cloudflare Pages reports the latest production `main` deployment for both `dawaisaver-web` and `dawaisaver-admin` as commit `a6e784d225beec91e2e483513dd85a2e03ca93bc`.
- The backend Coolify service is healthy at `http://yh5wt7bbkhqsjycey5df0lbe.178.105.221.236.sslip.io`.

## Frontend API Status

- The deployed web and admin bundles resolve API calls against `/api` by default when no absolute `VITE_API_URL` is embedded.
- `apps/admin/.env` has been cleaned up locally to avoid the retired Railway API host and now uses `/api`.
- The web frontend no longer carries the retired Railway target in source-controlled config.

## Backend and Mirror Status

- `GET /health` on the Coolify backend returns `application.status=ok` and `database.status=ok`.
- `GET /api/health` is not the backend route and returns 404.
- The Dockerfile and runtime startup path do not embed a git SHA or deployment fingerprint, so the exact backend commit cannot be independently extracted from the current public endpoint set.
- Protected DRAP mirror endpoints are authenticated and live.
- `admin/mirror/runtime` reports `state=running`, `envState=PAUSED`, `effectiveState=PAUSED`, `mirrorEnabled=false`, and `migrationMode=true`.
- `admin/mirror-status` reports `processed_count=46550`, `success_count=44221`, `failed_count=2329`, `worker_count=16`, `status=PAUSED`, and `success_rate=95`.
- `admin/mirror/archive-status` reports archive batches with healthy segment counts and no failed/pending segments in the latest snapshots.
- `POST /admin/mirror/resume` and `POST /admin/mirror/stop` both returned success.

## Web Fix Attempt

- Added missing Cloudflare Pages fallback files to `apps/web/public/`:
  - `_redirects`
  - `_headers`
  - `404.html`
- Rebuilt both frontend apps locally and confirmed both builds pass.
- Corrected the Cloudflare Pages web project configuration to build from `apps/web` with `npm run build` and `dist` output.
- Triggered a fresh Cloudflare Pages production deployment for `dawaisaver-web`, and the root now serves HTTP 200.

## Local Verification

- `node scripts/verify-migration-encoding.cjs` passed.
- `npm.cmd install` passed.
- `npx.cmd prisma generate` passed.
- `npm.cmd run build` passed.
- `npx.cmd prisma migrate deploy` passed against a disposable local PostgreSQL 18 database on `127.0.0.1:5434`.

## Documentation

- Archived obsolete verification notes to `docs/archive/`.
- `CURRENT_UPDATE*.md` is ignored in `.gitignore`, and there are no extra current-update snapshot files in the repo root.

## Progress

- Completion percentage: 95%
- Remaining blockers: surface a backend deploy fingerprint or commit SHA from a backend-side source if exact backend deployment provenance is still required.
