# CURRENT UPDATE

Date: 2026-06-20
Project: DawaiSaver.pk

## Production Verification

- `dawaisaver-admin.pages.dev` returns HTTP 200 and serves the current admin SPA shell.
- `dawaisaver-web.pages.dev` now returns HTTP 200 and serves the current customer SPA shell.
- Cloudflare Pages reports the latest production `main` deployment for `dawaisaver-web` as commit `f0b49bae93bbf0e2414214b50cf92db86d5a7c3a`.
- Cloudflare Pages reports the latest production `main` deployment for `dawaisaver-admin` as commit `a14dcbe34e9e3c3dc6f92fe8a5db997b24e28a6b`.
- The backend Coolify service is healthy at `http://yh5wt7bbkhqsjycey5df0lbe.178.105.221.236.sslip.io`.

## Frontend API Status

- The deployed web and admin bundles resolve API calls against `/api` by default when no absolute `VITE_API_URL` is embedded.
- `apps/admin/.env` has been cleaned up locally to avoid the retired Railway API host and now uses `/api`.
- The web frontend no longer carries the retired Railway target in source-controlled config.

## Backend and Mirror Status

- `GET /health` on the Coolify backend returns `application.status=ok` and `database.status=ok`.
- `GET /api/health` is not the backend route and returns 404.
- Protected DRAP mirror endpoints exist, but they require bearer authentication, so live runtime counters remain unverified from the current unauthenticated terminal context.

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
- Remaining blockers: obtain authenticated access to the DRAP mirror runtime if live counters are still required.
