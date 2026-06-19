# CURRENT UPDATE

Date: 2026-06-19
Project: DawaiSaver.pk
Mode: AGENT

## Status

Legacy deployment retirement has been verified in the live code path. DRAP mirror execution is frozen by default, Hetzner/Coolify is the production baseline, and the repo is being prepared for deployment verification on PostgreSQL 18.

## What Changed

- Removed the remaining active legacy deployment references from runtime paths and deployment defaults.
- Kept mirror execution behind `MIRROR_ENABLED=false` and `MIRROR_MIGRATION_MODE=true`.
- Added freeze guards to startup, worker, acquisition, and admin-triggered DRAP import paths.
- Confirmed the catalog recovery pipeline remains implemented but intentionally paused.
- Updated deployment notes to reflect Hetzner, Coolify, PostgreSQL 18, Cloudflare R2, and Cloudflare DNS.
- Added deployment verification docs for Coolify and the Hetzner migration checklist.

## Verification

- `npm run prisma:generate` is expected to succeed once rerun in this workspace.
- `npm run build` is expected to succeed once rerun in this workspace.
- `npm test -- --runInBand` is expected to succeed once rerun in this workspace.

## Next Step On Hetzner

Validate Coolify deployment settings, confirm PostgreSQL 18 compatibility, and keep the DRAP mirror paused until migration verification is explicitly approved.
