# Composition Group Generation

Date: 2026-06-23
Scope: Phase 4 Medicine Equivalence Intelligence

## 1) Approved aliases audit

### ingredient_aliases
- Table: `ingredient_review_queue` -> `ingredient_aliases`
- Purpose: Approved alias bridge for canonical molecule promotion
- Status: Populated via Phase 3 review workflow

### molecule_aliases
- Table: `molecule_aliases`
- Purpose: Legacy alias compatibility
- Population: Mirrored from ingredient_aliases promotion

### generics
- Table: `generics`
- Purpose: Canonical generic molecule identity
- WHO seed: 4,937 canonical molecules loaded

### WHO alias seeds
- Source: WHO ATC Master data
- Output: 19,748 alias seeds
- Integration path: `src/modules/atc/atc.service.ts` -> `importWhoAtcMaster()`

## 2) Composition group generation strategy

### Rules
- Same canonical molecule(s)
- Same strength
- Same dosage form

### Signature format
```
v1|ingredient@strength[+ingredient@strength...]|dosage_form|route
```

Example:
```
v1|paracetamol@500mg|tablet|oral
```

### Implementation
- Service: `CompositionService` in `src/modules/composition/composition.service.ts`
- Controller: `CompositionController` in `src/modules/composition/controllers/composition.controller.ts`
- Endpoint: `POST /admin/composition/groups/generate`

## 3) Product matching engine

### Inputs
- canonical molecule
- strength
- dosage form
- route

### Output
- `composition_group_id` on products

### Tables
- `product_matches` - Already exists in schema
- `composition_groups` - Already exists in schema
- `composition_group_compositions` - Already exists in schema

## 4) Canonical products generation

### Fields
- `canonical_name`
- `normalized_brand`
- `normalized_generic`
- `normalized_strength`
- `normalized_dosage_form`
- `normalized_manufacturer`
- `medicine_signature`
- `status`
- `confidence_score`
- `source_type`
- `source_url`
- `metadata`

### Implementation
- Table: `canonical_products`
- Already exists in schema (lines 1372-1406)

## 5) Coverage measurement

### Metrics
- Total products
- Products grouped
- Products unmatched
- Composition groups generated
- Match coverage %

### Endpoint
`GET /admin/composition/stats`

## 6) Build status

- Schema: Ready (composition_groups, product_matches, canonical_products exist)
- Service: Implemented
- Module: Created and integrated
- Build: Pending validation

## 7) Readiness assessment

### Delivered
- Composition group service
- Product matching logic
- Coverage metrics
- API endpoints

### Deployment checklist
- [ ] Run `npm run build`
- [ ] Deploy backend
- [ ] Run composition group generation job
- [ ] Verify coverage metrics

## 8) Completion percentage

Phase 4 composition groups + product matching: **75%** (service and schema ready, build pending)