# DawaiSaver Golden Catalogue MVP Implementation Plan

Date: 2026-06-23

Basis for this plan:

- `diagnostics/catalogue-architecture-audit.md`
- `diagnostics/catalogue-refactor-plan.md`
- `diagnostics/data-readiness-audit.md`
- `diagnostics/molecule-normalization-investigation.md`
- `diagnostics/golden-catalogue-feasibility.md`
- `diagnostics/multi-source-data-architecture.md`
- `diagnostics/pharmacy-data-recovery-investigation.md`
- `diagnostics/golden-catalogue-data-validation.md`
- `diagnostics/golden-catalogue-pipeline-design.md`
- `diagnostics/mvp-source-validation.md`

Scope:

- Golden Catalogue MVP only.
- Medicines in scope:
  - Paracetamol 500mg Tablet
  - Ibuprofen 400mg Tablet
  - Amoxicillin 500mg Capsule
- Sources in scope:
  - DRAP for regulated identity
  - Dawaai for commercial enrichment
- No implementation yet.
- No schema changes in this step.
- No migrations in this step.
- No code changes in this step.

## 1. Current models to keep

Keep these concepts and data flows, but only in the roles below:

- DRAP raw import tables and ingestion jobs.
  - Keep them as the source of regulated identity, registration number, approved price, pack size, and official manufacturer details.
- Composition group model.
  - Keep it as the canonical comparison identity.
  - It becomes the authoritative join key for customer comparison.
- Brand product records.
  - Keep them as leaf commercial entities under a composition group.
- Pack variant and price concepts.
  - Keep them as the customer-facing commercial layer.
  - Prices must attach to pack variants, not to the comparison identity.
- Source evidence storage.
  - Keep all evidence, page captures, and traceable source references.
- Admin review and audit trail concepts.
  - Keep them to manage confidence and manual exception handling.
- Search infrastructure.
  - Keep it, but re-route its resolution flow to the canonical composition-group model.

## 2. Current models to deprecate or stop using for customer comparison

Deprecate these as comparison drivers:

- Brand-based medicine comparison.
- `Product.signature` or any signature that embeds brand or manufacturer as comparison identity.
- `CanonicalProduct` if it remains a brand-weighted identity rather than a composition-group identity.
- Equivalence groups that are not normalized by composition + strength + dosage form + route.
- Product-level price as the primary price entity.
- Any WHO/ATC mapping that mixes brand names into molecule or canonical molecule fields.
- Any search result ranking that treats brand name as the final comparison key.

Reason:

- These structures can still exist operationally, but they are not safe as the authoritative customer comparison model.

## 3. Target catalogue entity model

Target relationship chain:

`Generic Molecule -> Composition Group -> Strength + Dosage Form -> Brand Product -> Pack Variant -> Pack Price -> Savings Analysis`

Purpose and ownership:

- Generic Molecule
  - Purpose: normalized chemical identity.
  - Ownership: normalization layer.
- Composition Group
  - Purpose: authoritative comparison identity.
  - Ownership: catalogue core.
- Strength + Dosage Form
  - Purpose: distinguish exact therapeutic equivalents.
  - Ownership: composition group layer.
- Brand Product
  - Purpose: commercial product representation from a source.
  - Ownership: pharmacy / DRAP enrichment layer.
- Pack Variant
  - Purpose: exact sellable pack shape.
  - Ownership: commercial catalog layer.
- Pack Price
  - Purpose: current market or approved price for the pack variant.
  - Ownership: source-specific pricing layer.
- Savings Analysis
  - Purpose: compare equivalent pack variants and surface savings.
  - Ownership: comparison service.

Required relationships:

- A composition group can have many brand products.
- A brand product can have many pack variants.
- A pack variant can have many prices from different sources over time.
- Savings comparisons should only compare pack variants inside the same composition group, strength, dosage form, and route.

## 4. Proposed database changes

Planning only. No migration in this phase.

New structures likely needed:

- composition groups
- composition group ingredient members
- normalized generic molecules
- brand products
- pack variants
- pack prices
- source observations / evidence
- field confidence / verification state
- comparison runs / savings results
- admin review queue items

Modified structures likely needed:

- product identity tables to reference composition groups instead of brand signatures
- DRAP import tables to preserve regulated fields first-class
- search index tables / documents to include canonical comparison fields
- price tables to attach to pack variants rather than comparison entities

Deprecated structures likely needed:

- brand-based equivalence group tables or views
- product-level price-as-identity patterns

## 5. Required importer changes

DRAP importer:

- Preserve registration number as the regulated identity.
- Import and retain:
  - registration date
  - approved price
  - pack size
  - dosage form
  - route of administration
  - manufacturer
  - manufacturer country
  - meeting number where available
  - manufacturing type where available
  - source status and verification status
- Extract composition, strength, and dosage form into normalized comparison fields.
- Preserve raw text for auditability.

Dawaai importer:

- Capture:
  - brand
  - composition
  - strength
  - dosage form
  - manufacturer
  - pack size
  - market price
  - image availability
  - alternate brands
- Link Dawaai products to composition groups using normalized composition + strength + dosage form + route.
- Capture product-level evidence and price evidence separately.

Normalization responsibilities:

- Normalize strength strings.
- Normalize dosage-form labels.
- Normalize route labels.
- Normalize pack strings into structured pack variants.
- Prevent brand contamination from being promoted into canonical identity.

## 6. Required WHO / ATC cleanup

MVP rule:

- WHO / ATC data must not drive customer comparison.
- It can assist search and enrichment only after canonical normalization.

Cleanup plan:

- Remove or ignore brand names inside molecule mappings.
- Flag broad molecules for review.
- Flag duplicate mappings for manual resolution.
- Flag mappings where the source string collapses multiple distinct canonical molecules.
- Keep exact or high-confidence mappings only for enrichment.

Deferred work:

- Full WHO reconciliation is phase-2 work, not a launch blocker for the three-medicine MVP.

## 7. Required search changes

Search must resolve user input through a staged pipeline:

`Input -> Brand detection -> Generic resolution -> Composition group -> Equivalent products`

Required search modes:

- Brand search
- Generic search
- Composition search
- Strength search
- Dosage-form search
- Prescription text search
- Bill-entry search

Behavior:

- Brand inputs should resolve to their composition group, not stop at the brand.
- Generic inputs should resolve to one or more composition groups.
- Strength and dosage form should act as disambiguation filters.
- Comparison results should always be composition-group-driven.

## 8. Required API response structure

Search API should return:

- resolved input
- canonical composition group
- candidate brand products
- candidate pack variants
- confidence / verification state

Product API should return:

- regulated identity
- canonical composition group
- brand products
- pack variants
- prices
- evidence
- verification state

Comparison API should return:

- current product
- equivalent brands
- equivalent pack variants
- price ladder
- savings calculation
- confidence state

Savings API should return:

- comparison basis
- cheapest equivalent
- savings amount
- savings percentage
- pack equivalence proof

Example shape:

```json
{
  "query": "Ibuprofen 400mg Tablet",
  "resolved": {
    "composition": "Ibuprofen",
    "strength": "400mg",
    "dosageForm": "Tablet",
    "route": "Oral"
  },
  "brands": [],
  "packs": [],
  "prices": [],
  "verificationStatus": "Ready"
}
```

## 9. Required customer UI changes

Customer header:

- Show canonical composition identity, not brand name.
- Example: `Ibuprofen 400mg Tablet`

Required sections:

- Composition
- Therapeutic category
- Available brands
- Pack sizes
- Price comparison
- Savings analysis
- Regulatory information

UI behavior:

- Show brand products as alternatives under the same composition group.
- Show pack variants under each brand.
- Show price comparisons only for equivalent pack variants.
- Show verification status and source evidence indicators.

## 10. Golden sample test plan

Test 1: Paracetamol 500mg Tablet

- Confirm exact DRAP identity exists.
- Confirm exact Dawaai product exists.
- Confirm composition-group match succeeds.
- Confirm pack normalization succeeds.
- Confirm pack-linked price exists.
- Confirm savings analysis can be generated.

Test 2: Ibuprofen 400mg Tablet

- Confirm exact DRAP identity exists.
- Confirm exact Dawaai product exists.
- Confirm composition-group match succeeds.
- Confirm pack normalization succeeds.
- Confirm pack-linked price exists.
- Confirm alternate brand listing exists.

Test 3: Amoxicillin 500mg Capsule

- Confirm exact DRAP identity exists.
- Confirm exact Dawaai product exists.
- Confirm composition-group match succeeds.
- Confirm pack normalization succeeds.
- Confirm pack-linked price exists.
- Confirm savings analysis can be generated.

Acceptance rule:

- All three tests must pass before the MVP can be released.

## 11. Recommended MVP rollout sequence

Phase 1: Canonical identity runtime

- Composition group matching
- Strength normalization
- Dosage form normalization
- Route normalization

Phase 2: Commercial enrichment runtime

- Dawaai importer
- Pack variant normalization
- Pack-linked pricing
- Alternate-brand capture

Phase 3: Admin control plane

- Review queue
- Evidence viewer
- Confidence badges
- Exception handling

Phase 4: Customer comparison experience

- Search
- Comparison page
- Savings analysis
- Regulatory info display

Phase 5: Shadow validation and launch gate

- Run the three golden samples
- Confirm parity between source evidence and customer output
- Approve release only after admin review passes

## 12. Recommended MVP scope boundaries

In scope:

- DRAP identity
- Dawaai commercial enrichment
- Composition-group matching
- Pack normalization
- Pack-linked price
- Admin review
- Customer comparison page

Out of scope for this MVP:

- WHO enrichment as a launch dependency
- Distributor data
- Customer submissions
- Prescription OCR
- Marketplace-wide analytics
- Long-tail medicine categories beyond the three MVP medicines

## Final recommendation

Recommended architecture:

- Composition Group as the authoritative comparison identity
- Brand Product and Pack Variant as subordinate commercial layers
- Pack Price as the price-bearing entity
- DRAP as regulated identity source
- Dawaai as commercial enrichment source

Recommended rollout posture:

- Proceed with a constrained MVP implementation.
- Keep admin review mandatory until shadow validation passes.

Estimated implementation complexity:

- Medium, because the core change is architectural rather than purely UI.
- The highest-risk parts are normalization, pack linkage, and source conflict handling.
