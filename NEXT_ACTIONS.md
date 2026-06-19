# Next Actions

## Current Task

DawaiSaver Hetzner Migration Verification Phase.

## Completed

- Retired active legacy runtime references from the deployment and mirror execution path.
- Locked DRAP mirror execution behind `MIRROR_ENABLED=false` and `MIRROR_MIGRATION_MODE=true`.
- Updated deployment notes for Hetzner, Coolify, PostgreSQL 18, Cloudflare R2, and Cloudflare DNS.
- Added `COOLIFY_APP_DEPLOYMENT.md`, `COOLIFY_ENV_TEMPLATE.md`, and the migration checklist.
- Passed `npm run prisma:generate`.
- Passed `npm run build`.
- Passed `npm test -- --runInBand`.

## Next

1. Configure the Coolify API service using the documented build/start/env values.
2. Configure the Coolify admin service using the documented static deployment values.
3. Verify the live deployment keeps the DRAP mirror paused.
4. Keep catalog recovery deferred until the migration checkpoint is approved.

## Exact Next Prompt

Deploy the API and admin services in Coolify using the documented commands and environment variables, then verify the live deployment keeps `MIRROR_ENABLED=false` and `MIRROR_MIGRATION_MODE=true`.
