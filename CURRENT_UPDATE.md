# CURRENT UPDATE

Date: 2026-06-19
Project: DawaiSaver.pk
Mode: AGENT

## Status

Coolify deployment readiness has been documented for both the API and admin services. DRAP mirror execution is frozen by default, Hetzner/Coolify remains the production baseline, and PostgreSQL 18 compatibility has been verified at the repository level.

## What Changed

- Removed the remaining active legacy deployment references from runtime paths and deployment defaults.
- Kept mirror execution behind `MIRROR_ENABLED=false` and `MIRROR_MIGRATION_MODE=true`.
- Added freeze guards to startup, worker, acquisition, and admin-triggered DRAP import paths.
- Confirmed the catalog recovery pipeline remains implemented but intentionally paused.
- Added `COOLIFY_APP_DEPLOYMENT.md`, `COOLIFY_ENV_TEMPLATE.md`, and refreshed the Hetzner migration checklist.
- Removed superseded deployment note files.
- Tightened generated report ignore rules in `.gitignore`.

## Verification

- `npm run prisma:generate` passed.
- `npm run build` passed.
- `npm test -- --runInBand` passed.

## Next Step On Hetzner

Configure the Coolify API and admin services with the documented commands and environment variables, then verify the live deployment keeps the DRAP mirror paused.
