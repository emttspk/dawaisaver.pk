# CURRENT UPDATE

Date: 2026-06-19
Project: DawaiSaver.pk
Mode: AGENT

## Status

DRAP mirror acquisition is frozen. Production infrastructure is now treated as Hetzner VPS + Coolify + PostgreSQL 18 + Cloudflare R2 + Cloudflare DNS.

## What Changed

- Removed Railway deployment files and browserless validation artifacts.
- Replaced Railway-specific API defaults with platform-neutral defaults.
- Updated deployment docs to Hetzner/Coolify.
- Renamed the DRAP mirror bootstrap job to a platform-neutral name.
- Added `MIRROR_ENABLED=false` and `MIRROR_MIGRATION_MODE=true`.
- Added freeze guards to startup, worker, acquisition, and admin import paths.
- Kept the catalog recovery pipeline and CLI in place, but deferred execution.

## Verification

- `npm run prisma:generate` passed.
- `npm run build` passed.
- `npm test -- --runInBand` passed.

## Next Step On Hetzner

Verify the mirror stays paused and no new acquisition jobs start. Do not resume catalog recovery until migration verification is explicitly approved.
