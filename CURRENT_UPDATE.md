# CURRENT UPDATE

Date: 2026-06-20
Project: DawaiSaver.pk

## Production Verification

- `dawaisaver-admin.pages.dev` returns HTTP 200 and serves the current admin SPA shell.
- `dawaisaver-web.pages.dev` returns HTTP 404 at the root.
- `f537e17d.dawaisaver-web.pages.dev` returns HTTP 200 and serves the customer SPA shell.
- Cloudflare Pages project status shows both `dawaisaver-web` and `dawaisaver-admin` as Git-backed projects.
- The latest verified `main` commit deployed to the Pages frontends is `4087bfa842f23989088ce09824a835b0329d092f`.

## Frontend API Status

- The deployed admin and customer bundles still resolve API calls against `/api` by default when no absolute `VITE_API_URL` is embedded.
- The ignored admin env override currently points to `https://dawaisaverpk-production.up.railway.app/api`.
- `https://dawaisaver-admin.pages.dev/api/*` returns 404 from the Pages origin.
- `https://f537e17d.dawaisaver-web.pages.dev/api/*` falls back to the SPA shell instead of a live API response.
- Probing `api.dawaisaver-web.pages.dev`, `backend.dawaisaver-web.pages.dev`, `api.dawaisaver-admin.pages.dev`, and `backend.dawaisaver-admin.pages.dev` returned 404.
- Frontend routing is healthy, but the production API origin is still Railway-backed, not Coolify-backed.

## Backend and Mirror Status

- The live backend URL reachable from the deployed frontend config is `https://dawaisaverpk-production.up.railway.app/api`.
- `https://dawaisaverpk-production.up.railway.app/api/health`, `/api/health/application`, and `/api/health/database` all return Railway `502` responses with `Application failed to respond`.
- That means the backend deployment is reachable at the edge, but the application is not healthy enough to complete startup or answer health checks.
- Coolify backend deployment ownership could not be verified because the active production API target is still Railway-based and no SSH/Coolify host was discoverable in this workspace.
- DRAP mirror runtime could not be verified live because the backend health checks fail before the mirror endpoints can be queried.
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

- Completion percentage: 70%
- Remaining blockers: backend startup failure on the live Railway API target, live database connectivity proof on the deployed backend, live DRAP mirror verification, and migration of the active API target off Railway if Coolify is now the intended owner.
