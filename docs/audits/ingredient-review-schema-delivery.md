# Ingredient Review Schema Delivery

Date: 2026-06-23
Scope: Phase 2 backend readiness for the AI Ingredient Review workflow.

## 1) Current schema audit

Verified core catalogue anchors are present and usable:

- `generics`
- `molecule_aliases`
- `canonical_products`
- `product_matches`

The existing schema already gives us:

- canonical molecule identity via `generics`
- legacy alias compatibility via `molecule_aliases`
- product comparison history via `canonical_products` and `product_matches`

## 2) Delivered schema additions

The following workflow tables have been added to Prisma and the migration set:

- `ingredient_review_queue`
- `ingredient_review_history`
- `ingredient_aliases`

### Delivered model intent

| Table | Purpose |
| --- | --- |
| `ingredient_review_queue` | Current queue of unmatched ingredient strings, AI suggestions, confidence, and review status |
| `ingredient_review_history` | Immutable review audit trail |
| `ingredient_aliases` | Approved alias bridge for canonical molecule promotion |

## 3) Migration delivery

Migration file added:

- `prisma/migrations/20260623143000_add_ingredient_review_workflow/migration.sql`

### Migration contents

- creates `ingredient_review_queue`
- creates `ingredient_review_history`
- creates `ingredient_aliases`
- adds FKs to `generics`
- adds queue/history/alias indexes
- keeps alias promotion compatible with the existing legacy `molecule_aliases` path

## 4) Service layer delivery

Implemented backend layer:

- `src/modules/ingredient-review/ingredient-review.repository.ts`
- `src/modules/ingredient-review/ingredient-review.service.ts`
- `src/modules/ingredient-review/ingredient-review.patterns.ts`
- `src/modules/ingredient-review/ingredient-review.types.ts`
- `src/modules/ingredient-review/ingredient-review.module.ts`

### Delivered capabilities

- raw ingredient evaluation
- pattern classification
- confidence scoring
- review lane assignment
- queue upsert
- history append
- approved alias promotion
- WHO alias seed synchronization
- dry-run simulation summary

## 5) Alias promotion pipeline

Implemented flow:

`raw ingredient -> normalized ingredient -> pattern class -> confidence score -> review lane -> approved alias -> canonical molecule`

### Promotion behavior

- approved aliases are written to `ingredient_aliases`
- the same approved alias is mirrored to `molecule_aliases` for downstream compatibility
- optional queue history is recorded when a queue item is supplied

## 6) WHO alias integration path

The WHO output path remains unchanged and is still the source of truth for seed generation:

1. `src/modules/atc/atc.service.ts` -> `importWhoAtcMaster()`
2. WHO source files are loaded from `WHO data/`
3. `src/modules/atc/molecule-normalizer.service.ts` normalizes level-5 rows
4. `buildAliasSeeds()` emits alias seeds
5. importer persists canonical molecules and aliases

Verified outputs:

- canonical molecules: **4,937**
- alias seeds: **19,748**

## 7) Delivery blockers remaining

The backend is ready for the next admin phase, but a few items are still not delivered:

1. No admin UI screens yet.
2. No queue API/controller endpoints yet.
3. No scheduled backfill job is wired to populate the new queue at runtime.
4. No production database migration has been applied to the target environment yet.

## 8) Build status

Validation run:

- `npm run prisma:generate` ✅
- `npm run build` ✅

## 9) Readiness assessment

### Delivered

- schema
- migrations
- service layer
- alias promotion pipeline
- build validation

### Admin UI readiness

Ready to begin.

### Updated completion percentage

- Phase 2 backend completion: **84%**
- Admin workflow readiness: **ready**

## 10) Recommendation

Proceed to Phase 3 admin UI wiring only after the new review tables are migrated in the target environment.
