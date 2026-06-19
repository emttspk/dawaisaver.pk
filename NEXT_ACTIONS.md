# Next Actions

## Current Task

DawaiSaver Catalog Pipeline Recovery.

## Completed

- Implemented the resumable catalog promotion pipeline.
- Implemented the canonical product promotion pipeline.
- Added `catalog:build`, `catalog:resume`, and `catalog:verify`.
- Added catalog job persistence, progress tracking, and dry-run support.
- Added validation reporting and generated-report output.
- Passed `npm run build`.
- Passed `npm test -- --runInBand`.

## Next

1. Run the catalog CLI on Hetzner where `DATABASE_URL` is configured.
2. Start with a small dry-run subset:
   - `npm run catalog:build -- --dry-run --limit=25 --batch-size=25 --no-report`
3. Inspect the generated summary and validation output.
4. Resume the job to process the remaining backlog:
   - `npm run catalog:resume -- --job-id=<id>`
5. Verify row counts:
   - `manufacturers`
   - `generics`
   - `products`
   - `product_compositions`
   - `canonical_products`
   - `canonical_product_aliases`

## Exact Next Prompt

Run the new catalog recovery commands on the Hetzner host, starting with a dry-run subset and then resuming the same job until the backlog is complete. Confirm the final table counts and save the generated reports.
