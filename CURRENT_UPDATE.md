# CURRENT UPDATE

Date: 2026-06-20
Project: DawaiSaver.pk

## Production Verification

- `dawaisaver-admin.pages.dev` returns HTTP 200 and serves the current admin SPA shell.
- `dawaisaver-web.pages.dev` returns HTTP 404 at the root.
- `f537e17d.dawaisaver-web.pages.dev` returns HTTP 200 and serves the customer SPA shell.
- Cloudflare Pages project status shows both `dawaisaver-web` and `dawaisaver-admin` as Git-backed projects.
- The latest verified `main` commit pushed from this workspace is `68024914c1affbad21ccc960d698e880bbc615d5`.

## Frontend API Status

- The deployed admin and customer bundles still resolve API calls against `/api` by default when no absolute `VITE_API_URL` is embedded.
- The ignored admin env override has been cleaned up to `/api` so the workspace no longer carries the retired Railway API host.
- `https://dawaisaver-admin.pages.dev/api/*` returns 404 from the Pages origin.
- `https://f537e17d.dawaisaver-web.pages.dev/api/*` falls back to the SPA shell instead of a live API response.
- Probing `api.dawaisaver-web.pages.dev`, `backend.dawaisaver-web.pages.dev`, `api.dawaisaver-admin.pages.dev`, and `backend.dawaisaver-admin.pages.dev` returned 404.
- Frontend routing is healthy in the app bundles, but the production web root still does not serve a working production deployment and the backend origin is still undiscovered from the available evidence.

## Backend and Mirror Status

- The intended Coolify backend URL has not been discovered from the available terminal evidence.
- The retired Railway backend target previously referenced by the frontend has been removed from the workspace env, but live backend health still could not be verified because no Coolify host or SSH target was discovered.
- DRAP mirror runtime could not be verified live because there is still no reachable backend target to query.
- Local DRAP telemetry artifacts show prior mirror progress, but they are not a substitute for live production verification.

## Local Verification

- `node scripts/verify-migration-encoding.cjs` passed.
- `npm.cmd install` passed.
- `npx.cmd prisma generate` passed.
- `npm.cmd run build` passed.
- `npx.cmd prisma migrate deploy` passed against a disposable local PostgreSQL 18 database on `127.0.0.1:5434`.

## Documentation

- Archived obsolete verification notes to `archive/DRAP_DATABASE_VERIFICATION.sql`.
- `CURRENT_UPDATE*.md` is ignored in `.gitignore`, and there are no extra current-update snapshot files in the repo root.
- The ignored admin env file still contains a Railway production API URL, which is now a live deployment blocker and should be retired when the backend is moved off Railway.

## Progress

- Completion percentage: 75%
- Remaining blockers: discover the live Coolify backend URL, verify database connectivity on that backend, verify DRAP mirror runtime and progress, and bring `dawaisaver-web.pages.dev` back to HTTP 200.
