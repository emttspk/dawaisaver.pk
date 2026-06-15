# DRAP Import Module

## Purpose

The DRAP module imports medicine registration/product data into PostgreSQL through Prisma-compatible persistence.

## Files

- `drap.module.ts`: module entrypoint and factories
- `drap.service.ts`: service facade
- `drap.importer.ts`: fetch, parse, normalize, validate, save orchestration
- `drap.normalizer.ts`: normalization and medicine signature generation
- `drap.types.ts`: source adapter, DTO, import report, and persistence interfaces
- `samples/drap.sample.csv`: sample import dataset

## Architecture Diagram

```mermaid
flowchart LR
  Source[DRAP Source] --> Fetch[fetch]
  Fetch --> Parse[parse]
  Parse --> Normalize[normalize]
  Normalize --> Validate[validate]
  Validate --> Save[save]
  Save --> Batch[import_batches]
  Save --> Items[import_batch_items]
  Save --> Errors[import_errors]
  Save --> Catalog[manufacturers/generics/products/product_compositions]
  Save --> Audit[audit_logs]
```

## Sequence Diagram

```mermaid
sequenceDiagram
  participant Admin
  participant Service as DrapService
  participant Importer as DrapImporter
  participant Normalizer as DrapNormalizer
  participant DB as Prisma/PostgreSQL

  Admin->>Service: importFromSource(config)
  Service->>Importer: import(config)
  Importer->>Importer: fetch()
  Importer->>Importer: parse()
  Importer->>Normalizer: normalizeRecords()
  Importer->>Importer: validate()
  Importer->>DB: create import_batches
  Importer->>DB: upsert catalog records
  Importer->>DB: create import_batch_items
  Importer->>DB: create import_errors if needed
  Importer->>DB: create audit_logs IMPORT event
  Importer-->>Service: Import Summary DTO
```

## Test Plan

- Parse `samples/drap.sample.csv` with the CSV adapter.
- Verify three raw records are parsed.
- Verify generated signatures include:
  - `amoxicillin_clavulanic_acid_625mg_tablet`
  - `paracetamol_500mg_tablet`
  - `ibuprofen_400mg_tablet`
- Run import against a test PostgreSQL database after Prisma client generation.
- Verify created or reused records in:
  - `manufacturers`
  - `generics`
  - `products`
  - `product_compositions`
  - `import_batches`
  - `import_batch_items`
  - `audit_logs`
- Verify invalid rows are written to `import_errors`.

## Current Verification Limit

This workspace does not currently include `package.json`, installed dependencies, generated Prisma client, or a live PostgreSQL database, so runtime import verification is pending.

