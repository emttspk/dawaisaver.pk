# CURRENT UPDATE

Date: 2026-06-19
Project: DawaiSaver.pk
Mode: AGENT

## Status

Production infrastructure is now treated as Hetzner VPS + Coolify + PostgreSQL 18 + Cloudflare R2 + Cloudflare DNS.

## What Changed

- Removed Railway deployment files and browserless validation artifacts.
- Replaced Railway-specific API defaults with platform-neutral defaults.
- Updated deployment docs to Hetzner/Coolify.
- Renamed the DRAP mirror bootstrap job to a platform-neutral name.
- Kept the catalog recovery pipeline and CLI in place.

## Verification

- `npm run prisma:generate` passed.
- `npm run build` passed.
- `npm test -- --runInBand` passed.

## Next Step On Hetzner

Run the catalog commands on the Hetzner host where `DATABASE_URL` is configured:

```bash
npm run catalog:verify
npm run catalog:build -- --dry-run --limit=25 --batch-size=25 --no-report
npm run catalog:resume -- --job-id=<job-id-from-build>
```

Then confirm the final row counts for:

- manufacturers
- generics
- products
- product_compositions
- canonical_products
- canonical_product_aliases
