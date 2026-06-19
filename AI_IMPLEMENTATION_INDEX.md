# AI Implementation Index

## Project

DawaiSaver.pk

## Current Phase

DawaiSaver Hetzner Migration Verification

## Current Status

Hetzner VPS, Coolify, PostgreSQL 18, Cloudflare R2, and Cloudflare DNS are now the production baseline. Legacy runtime dependencies have been retired from active paths, and the DRAP mirror remains frozen with `MIRROR_ENABLED=false` and `MIRROR_MIGRATION_MODE=true`.

## Completed

- Removed active legacy deployment and startup references from the live runtime path.
- Added freeze guards for startup, worker, job, acquisition, and admin-triggered DRAP execution.
- Updated docs for Hetzner/Coolify production verification.
- Added `COOLIFY_APP_DEPLOYMENT.md`, `COOLIFY_ENV_TEMPLATE.md`, and `HETZNER_MIGRATION_CHECKLIST.md`.
- Kept the catalog CLI, resumable job state, dry-run mode, and validation reporting in place.
- Verified `npm run prisma:generate`.
- Verified `npm run build`.
- Verified `npm test -- --runInBand`.

## Remaining Production Work

- Validate Coolify deployment settings and startup commands.
- Confirm PostgreSQL 18, Prisma, migration, and seed compatibility.
- Keep the mirror paused until the migration checkpoint is approved.
- Execute the Coolify deployment using the documented API and admin profiles.

## Next Recommended Task

1. Configure the Coolify API service with the documented build/start/environment values.
2. Configure the Coolify admin service with the documented static deployment values.
3. Confirm the DRAP mirror stays paused in startup, worker, and admin paths.
