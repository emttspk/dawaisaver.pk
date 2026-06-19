# Next Actions

## Current Task

DawaiSaver Hetzner Migration Verification Phase.

## Completed

- Retired active legacy runtime references from the deployment and mirror execution path.
- Locked DRAP mirror execution behind `MIRROR_ENABLED=false` and `MIRROR_MIGRATION_MODE=true`.
- Updated deployment notes for Hetzner, Coolify, PostgreSQL 18, Cloudflare R2, and Cloudflare DNS.
- Added deployment guide and migration checklist documents.

## Next

1. Run `npm run prisma:generate`.
2. Run `npm run build`.
3. Run `npm test -- --runInBand`.
4. Verify Coolify deployment settings and PostgreSQL 18 compatibility.
5. Keep catalog recovery deferred until the migration checkpoint is approved.

## Exact Next Prompt

Verify Coolify deployment readiness on Hetzner, confirm PostgreSQL 18 and Prisma compatibility, and keep the DRAP mirror paused with `MIRROR_ENABLED=false` and `MIRROR_MIGRATION_MODE=true`.
