# Next Actions

## Current Task

DawaiSaver Infrastructure Consolidation and Catalog Recovery.

## Completed

- Removed Railway deployment config and superseded Railway reports.
- Updated the deployment docs to Hetzner/Coolify.
- Replaced old Railway API defaults in the frontends.
- Renamed the DRAP mirror bootstrap job to a platform-neutral name.
- Kept the catalog recovery pipeline and CLI in place.
- Passed `npm run build`.
- Passed `npm test -- --runInBand`.

## Next

1. Run the catalog CLI on Hetzner where `DATABASE_URL` is configured.
2. Start with a small dry-run subset:
   - `npm run catalog:build -- --dry-run --limit=25 --batch-size=25 --no-report`
3. Inspect the generated summary and validation output.
4. Resume the job to process the remaining backlog:
   - `npm run catalog:resume -- --job-id=<job-id>`
5. Verify row counts:
   - `manufacturers`
   - `generics`
   - `products`
   - `product_compositions`
   - `canonical_products`
   - `canonical_product_aliases`

## Exact Next Prompt

Run the new catalog recovery commands on the Hetzner host, starting with a dry-run subset and then resuming the same job until the backlog is complete. Confirm the final table counts and keep the generated reports.
