# CURRENT UPDATE

Date: 2026-06-19
Project: DawaiSaver.pk
Mode: AGENT

## Summary

The repository contains the full catalog promotion pipeline and the restored Hetzner database is ready for a controlled catalog promotion run. DRAP execution remains frozen. WHO/ATC schema and import paths are preserved, but WHO/ATC loading is separate from `catalog:build`.

## Latest Finding

- The dry-run failed because `DATABASE_URL` was not set in the shell environment.
- The fix is to use a temporary shell-only `DATABASE_URL` pointing at the restored Coolify PostgreSQL database before running `catalog:build`.
- The password in the connection string must be URL-encoded if it contains reserved characters like `@` or `!`.

## DRAP Preservation

- Source path for imported DRAP records:
  `src/modules/drap/drap.importer.ts -> importBatch.create() -> importBatchItem.create()`
- Preserved fields in `import_batch_items` include:
  `raw_data`, `normalized_data`, `validation_data`, `status`, `product_id`, `manufacturer_id`, `confidence_score`, `source_type`, `source_url`, `metadata`
- Expected imported DRAP record total:
  about `394,068` rows in `import_batch_items`
- `import_batches.status = RUNNING` does not block catalog promotion because catalog build reads `import_batch_items` directly.

## WHO/ATC Preservation

- WHO/ATC-related Prisma models found:
  `AtcClassification`, `MoleculeAlias`, `CompositionGroup`, `CompositionGroupComposition`, `GenericAtcClassification`
- `src/modules/atc/atc.service.ts::importWhoAtcMaster()` persists WHO data into:
  `import_batches`, `import_batch_items`, `atc_classifications`, `therapeutic_categories`, `generics`, `molecule_aliases`
- `src/modules/drap/drap.service.ts::loadWhoMolecules()` reads WHO/ATC state from:
  `generics`, `molecule_aliases`, `atc_classifications`, `therapeutic_categories`
- `src/modules/drap/drap.service.ts::persistCompositionGroups()` writes:
  `composition_groups`, `composition_group_compositions`
- WHO/ATC data is preserved in schema and runtime code; if those tables are empty in the restored database, they require a separate WHO/ATC import path, not `catalog:build`.

## Catalog Readiness

- `npm run catalog:build` -> `ts-node -r dotenv/config src/cli/catalog.ts build`
- `npm run catalog:verify` -> `ts-node -r dotenv/config src/cli/catalog.ts verify`
- `npm run catalog:resume` -> `ts-node -r dotenv/config src/cli/catalog.ts resume`
- `src/cli/catalog.ts` calls `CatalogService.buildCatalog()`, `CatalogService.resumeCatalog()`, and `CatalogService.verifyCatalog()`
- Promotion order is:
  `import_batch_items -> manufacturers -> generics -> products -> product_compositions -> canonical_products -> canonical_product_aliases`
- Pipeline is resumable and idempotent because it uses `catalog_build_jobs.resume_token`, `currentImportBatchId`, `currentImportRowNumber`, and `currentProductId/currentProductCreatedAt`.
- No queue worker or cron processor is required for catalog promotion

## Safe Hetzner Sequence

1. Set the restored Coolify PostgreSQL `DATABASE_URL`
2. Confirm mirror freeze flags:
   `MIRROR_ENABLED=false`
   `MIRROR_MIGRATION_MODE=true`
3. Verify API container startup, health, and Prisma connectivity in Coolify.
4. Dry-run subset:
   `npm run catalog:build -- --dry-run --limit=1000 --batch-size=100 --no-report`
5. 1,000-row live validation:
   `npm run catalog:build -- --limit=1000 --batch-size=100 --no-report`
6. Full promotion:
   `npm run catalog:build -- --batch-size=500`
7. Verification:
   `npm run catalog:verify`
8. If interrupted, resume with:
   `npm run catalog:resume -- --job-id=<catalog_build_job_id>`

## Risks

- Running against the wrong `DATABASE_URL` would promote into the wrong database.
- WHO/ATC tables may need a separate import if they were not restored with the backup.
- A partial build can pause on the resume token, so the final job should be resumed rather than restarted if it is interrupted.
- WHO/ATC mappings are separate from catalog promotion, so they should not be expected to populate from `catalog:build`.

## Prisma DATABASE_URL Startup Failure Analysis

### Error
```
PrismaClientInitializationError:
Error validating datasource `db`:
the URL must start with the protocol `postgresql://` or `postgres://`
```

### Root Cause
The `PrismaService` extends `PrismaClient` and the parent constructor reads `process.env.DATABASE_URL` directly. This happens BEFORE `onModuleInit()` runs, meaning:
1. ConfigModule may not have loaded environment variables yet
2. The environment variable approach is fragile for Prisma initialization

### Code Fix Applied
Modified `src/database/prisma.service.ts` to:
1. Make `ConfigService` optional in constructor
2. Pass `datasourceUrl` directly to `PrismaClient` constructor from ConfigService or `process.env.DATABASE_URL`
3. Supports both NestJS DI and standalone CLI execution

**Final code:**
```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly configService?: ConfigService) {
    const databaseUrl = configService?.get<string>("database.url") ?? process.env.DATABASE_URL;
    super({ datasourceUrl: databaseUrl });
  }
  // ...
}
```

### Required Actions
1. **Verify Coolify environment variables**: Ensure `DATABASE_URL` is set in Coolify's environment settings
2. **Check password encoding**: Special characters (`@`, `!`, `#`, etc.) must be URL-encoded
3. **Re-deploy**: Deploy the updated container
4. **Monitor startup logs**: Check for Prisma connection success

## Coolify ARG Parsing Issue

### Problem
Coolify build log shows:
```
ARG DATABASE_URL=Value: postgresql://postgres:...
```

### Root Cause
Coolify prepends `Value: ` to environment variable values when setting them in the Docker build environment. This is a Coolify-specific behavior for how it handles environment variable exports.

### Code Fix Applied
Added `normalizeDatabaseUrl()` function in `src/database/prisma.service.ts` that strips the `Value: ` prefix:
```typescript
function normalizeDatabaseUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("Value: ")) {
    return url.slice(7);
  }
  return url;
}
```

### Required Actions
1. **Re-deploy**: Deploy the updated container

## Coolify Healthcheck Fix

### Problem
Coolify healthcheck fails with:
```
/bin/sh: curl: not found
```

### Root Cause
The Alpine-based Docker image doesn't include `curl`, which Coolify's healthcheck requires.

### Fix Applied
Added `RUN apk add --no-cache curl` to the Dockerfile runner stage.

### Image Impact
- Adds ~1-2MB to image size
- Required for Coolify healthcheck endpoint accessibility
