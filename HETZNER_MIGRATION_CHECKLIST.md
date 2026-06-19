# Hetzner Migration Checklist

## Phase A: Deploy API

- [ ] Confirm Coolify project settings for the API service.
- [ ] Confirm `DATABASE_URL` targets PostgreSQL 18.
- [ ] Confirm `npm run build` succeeds in the deployment image.

## Phase B: Deploy Admin

- [ ] Confirm the admin frontend points at the Hetzner API base URL.
- [ ] Confirm the admin app builds and serves correctly.
- [ ] Confirm protected admin routes remain functional.

## Phase C: Verify DB

- [ ] Confirm PostgreSQL 18 is reachable from the deployed API.
- [ ] Confirm Prisma client generation succeeds.
- [ ] Confirm migrations apply cleanly.

## Phase D: Verify Authentication

- [ ] Confirm JWT secrets are present in Coolify.
- [ ] Confirm login and token refresh flows succeed.
- [ ] Confirm protected endpoints reject anonymous access.

## Phase E: Verify Cloudflare

- [ ] Confirm Cloudflare DNS points at the Hetzner deployment.
- [ ] Confirm public hostnames resolve correctly.
- [ ] Confirm TLS and origin routing are healthy.

## Phase F: Verify R2

- [ ] Confirm R2 credentials are configured in Coolify.
- [ ] Confirm uploads and retrievals succeed.
- [ ] Confirm metadata references persist in PostgreSQL only.

## Phase G: Verify DRAP Mirror Remains Paused

- [ ] Confirm `MIRROR_ENABLED=false`.
- [ ] Confirm `MIRROR_MIGRATION_MODE=true`.
- [ ] Confirm startup cannot launch mirror acquisition.
- [ ] Confirm admin-triggered mirror execution cannot run.
- [ ] Confirm worker and scheduled execution remain disabled.
- [ ] Confirm no new mirror batches start automatically.
