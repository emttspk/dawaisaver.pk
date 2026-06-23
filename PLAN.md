# DawaiSaver Catalogue Refactor Implementation Plan

Intended file: `diagnostics/catalogue-refactor-plan.md`

> Planning deliverable only. No repository file was created because active Plan Mode prohibits file writes.

## 1. Current Models To Keep

### Data models

| Model | Retained responsibility |
|---|---|
| `Generic` | Canonical generic molecule |
| `MoleculeAlias` | Valid generic synonyms and spelling variants only |
| `Manufacturer` | Manufacturer identity |
| `ManufacturerProfile` | Country and regulatory profile |
| `Product` | Regulated brand product, identified by DRAP registration number |
| `ProductComposition` | Imported composition evidence for a brand product |
| `CompositionGroup` | Authoritative comparison identity |
| `CompositionGroupComposition` | Ordered canonical ingredients and strengths |
| `ProductPack` | Independently purchasable pack variant |
| `ProductPackPrice` | Approved, retail, and observed prices for one pack |
| `AtcClassification` | WHO ATC hierarchy |
| `GenericAtcClassification` | Molecule-to-ATC mapping |
| `TherapeuticCategory` | Therapeutic classification |
| `ProductTherapeuticCategory` | Product/category evidence |
| `Pharmacy` | Pharmacy identity |
| Source-provider and sync models | Pharmacy/source ingestion |
| Import batches/items/errors | Import provenance and recovery |
| Match review and data-quality flags | Manual review workflow |
| Price history/anomaly models | Analytics after observations become pack-linked |
| Audit fields and soft-delete/status conventions | Governance and traceability |

### Services and logic

Retain:

- DRAP acquisition, raw archiving, retry, and import-batch infrastructure.
- DRAP detail parsing, extended to preserve all parsed fields.
- WHO ATC hierarchy import.
- Manufacturer and generic normalization foundations.
- Manual review, confidence, provenance, audit, and quality-flag services.
- Pharmacy/source synchronization infrastructure.
- Safety warnings and clinical switching disclaimers.
- Price analytics algorithms after their inputs are changed from product prices to pack prices.

### APIs

Retain authentication, OCR upload, prescription submission, search history, health, administration, and source-health endpoints. Their catalogue resolution internals must change, but their general responsibilities can remain.

---

## 2. Current Models To Deprecate

| Structure | Customer-comparison status | Reason |
|---|---|---|
| `CanonicalProduct` | Deprecate | Combines a group-level unique signature with brand, manufacturer, pack, and registration attributes |
| `CanonicalProductAlias` | Deprecate for resolution | Mixes brand, generic, pack, manufacturer, and signature aliases under one entity |
| `EquivalenceGroup` | Retire from customer comparison | Duplicates the authoritative role assigned to `CompositionGroup` |
| `ProductEquivalence` | Retire from customer comparison | Legacy membership path not consumed consistently |
| `Product.signature` | Transitional only | Free-text formats are inconsistent and omit route |
| Brand-prefixed signatures | Remove | Brand is never part of comparison identity |
| Product-level `packSize` | Transitional display only | Cannot represent multiple packs safely |
| Product-level `ProductPrice` | Stop using for savings | Price lacks a specific pack basis |
| Packless `PriceSnapshot` observations | Exclude from comparison | Cannot produce reliable unit prices or savings |
| Canonical-ID alternative links | Stop using | Existing links mix canonical and product identifiers |
| Golden exporter’s `brand|generic|strength|form` grouping | Replace | Creates separate groups per brand |

Legacy tables remain read-only during shadow validation and are retired only after reconciliation.

---

## 3. Target Catalogue Entity Model

```text
Generic Molecule
       │
       │ many-to-many through ordered ingredient rows
       ▼
Composition Group
(composition + strength + dosage form + route)
       │
       │ one-to-many
       ▼
Brand Product
(unique DRAP registration number)
       │
       │ one-to-many
       ▼
Pack Variant
(normalized purchasable quantity)
       │
       │ one-to-many
       ▼
Pack Price
(approved / retail / pharmacy-observed)
       │
       ▼
Savings Analysis
```

### Generic Molecule

- Purpose: canonical pharmaceutical ingredient.
- Owns canonical name, normalized key, legitimate aliases, and ATC mappings.
- Does not own brands, strengths, dosage forms, packs, or prices.

### Composition Group

- Purpose: authoritative customer-comparison identity.
- Owns dosage form, route, normalization version, signature, and ordered ingredient-strength rows.
- Has many brand products.
- Contains no brand, manufacturer, registration, pack, or price fields.

### Brand Product

- Purpose: one regulated DRAP product.
- Identity: unique DRAP registration number.
- Owns brand name, manufacturer, registration metadata, status, and source evidence.
- Belongs to exactly one validated composition group.
- Has many pack variants.

### Pack Variant

- Purpose: one independently purchasable presentation of a brand product.
- Owns normalized quantity, unit type, volume/weight where applicable, and display label.
- Has many price records.

### Pack Price

- Purpose: one price observation or regulatory price for one pack.
- Owns price type, amount, currency, source, pharmacy, dates, availability, and evidence.
- Never links directly to a composition group.

---

## 4. Proposed Database Changes

Planning only; migrations are not included.

### New structures

- `PriceType` enumeration:
  - `DRAP_APPROVED`
  - `RETAIL_LISTED`
  - `PHARMACY_OBSERVED`
- Normalization-version registry or immutable version field for composition signatures.
- Optional composition-group assignment audit/history table if assignment changes must be historically queryable.

### Modified tables

#### `composition_groups`

Add:

- `signature_version`
- `canonical_signature`
- `display_name`
- `normalized_dosage_form`
- `normalized_route`
- validation status and validation timestamp
- uniqueness on signature version + canonical signature

#### `composition_group_compositions`

Retain and enforce:

- canonical generic ID
- ingredient order
- normalized strength value
- normalized strength unit

Add where needed:

- numerator value/unit
- denominator value/unit for concentrations
- original strength text
- normalization confidence

#### `products`

Add:

- `composition_group_id`
- `registration_date`
- `route_of_administration`
- `meeting_number`
- `manufacturing_type`
- `source_status`
- `source_verification_status`

Constraints:

- Partial unique constraint on non-null DRAP registration number.
- Validated customer products must have a composition group.
- Product route must agree with the assigned group route.

#### `manufacturers`

Preserve manufacturer country as a first-class field and retain source provenance.

#### `product_packs`

Replace free-text-only identity with normalized fields:

- `normalized_label`
- `unit_count`
- `unit_type`
- `volume_ml`
- `weight_g`
- `container_count`
- `content_per_container`
- `content_unit`
- `cost_basis_unit`

Add a unique normalized pack key per product.

#### `product_pack_prices`

Add:

- `price_type`
- optional pharmacy ID
- optional source-provider ID
- numeric amount
- raw source price text
- effective date
- observation date
- availability
- source evidence and confidence

### Deprecated tables/columns

After cutover and retention approval:

- `canonical_products`
- `canonical_product_aliases`
- `equivalence_groups`
- `product_equivalence`
- product-level pack-size comparison use
- product-level price comparison use
- free-text signatures as customer identity

---

## 5. Data Migration Strategy

### Automatic migration eligibility

A product may be assigned automatically when:

- Registration number is present and unique.
- Every ingredient resolves to one reviewed canonical molecule.
- Every ingredient has parseable strength and unit.
- Dosage form maps to one controlled value.
- Route maps to one controlled value.
- Ingredient ordering can be canonicalized.
- No conflicting product exists under the same registration number.
- Overall mapping confidence is at least `0.98`.

Exact validated mappings remain automatic even when the brand name differs.

### Manual review conditions

Manual review is required for:

- Missing or conflicting registration number.
- Missing route, strength, unit, or dosage form.
- Multiple possible molecule mappings.
- Brand names found in molecule fields.
- Broad molecules such as “Insulin” or “Multivitamin.”
- Unparseable ratios, concentrations, salts, or release modifiers.
- Duplicate registration numbers with conflicting product data.
- Reversed or inconsistent combination ingredients that cannot be reconciled deterministically.
- Unparseable pack size.
- Price without a resolved pack.
- Existing legacy signatures that map to multiple target groups.

### Confidence thresholds

- `≥ 0.98`: automatic assignment, only if all required fields are present.
- `0.85–0.9799`: manual review.
- `< 0.85`: quarantined/unmatched.
- Missing comparison-critical fields always require review regardless of score.

### Validation process

1. Inventory all existing products and registration-number conflicts.
2. Normalize molecules, strengths, forms, and routes without writing customer-visible assignments.
3. Generate candidate composition groups.
4. Compare candidates with legacy signatures and composition evidence.
5. Review collisions, splits, and incomplete products.
6. Backfill product-to-group relationships.
7. Normalize packs independently.
8. Attach prices only after pack resolution.
9. Produce coverage and exception reports.
10. Enable customer comparison only for validated groups and packs.

Required reconciliation metrics:

- Products assigned to exactly one group.
- Products requiring review.
- Duplicate registration numbers.
- Groups created from more than one legacy signature.
- Legacy signatures split into multiple target groups.
- Packs parsed/unparsed.
- Prices attached/unattached.
- WHO mappings validated/unresolved.

---

## 6. DRAP Source Preservation Strategy

| Field | Classification | Target ownership |
|---|---|---|
| Registration Number | **Required** | Brand Product |
| Registration Date | **Optional first-class** | Brand Product |
| Approved Price | **Required first-class when published** | Pack Price |
| Pack Size | **Required for priced catalogue entry** | Pack Variant |
| Dosage Form | **Required** | Composition Group |
| Route Of Administration | **Required** | Composition Group and product evidence |
| Manufacturer | **Required** | Brand Product |
| Manufacturer Country | **Optional first-class** | Manufacturer |
| Meeting Number | **Optional first-class** | Brand Product |
| Manufacturing Type | **Optional first-class** | Brand Product |
| Source Status | **Required first-class** | Brand Product |
| Verification Status | **Required first-class** | Brand Product |

Archive only:

- Raw HTML.
- HTML hashes and acquisition timings.
- Unstructured remarks.
- Page fragments.
- Retry/debug information.
- Historical text that cannot be safely structured.

First-class fields must also retain source URL, observation/import timestamp, source version, and original text.

---

## 7. WHO / ATC Cleanup Strategy

### Invalid mappings to quarantine

The committed mapping artefact contains internally inconsistent examples, including:

- Folic Acid with an inconsistent ATC code/name.
- Oral Rehydration Salt mapped to an unrelated category label.
- Chlorophyll mapped to “Other antistaminics.”
- Broad category codes inconsistent with mapped molecule codes.

These mappings must not drive automatic comparison.

### Brand contamination to remove

Remove brands and product descriptions from molecule aliases, including examples such as:

- Panadol, Calpol, Amoxil, Humalog, Lantus, and Caltrate.
- “Calpol Infant,” “Insulin Injection,” and “Multivitamin Syrup.”

Brand aliases belong to Brand Product records.

### Broad molecules

Broad labels such as Insulin, Multivitamin, Vitamin B Complex, and Oral Rehydration Salt require precise canonical definitions. They must not imply interchangeability across different ingredient compositions, insulin types, concentrations, routes, or forms.

### Missing golden-sample mappings

Create reviewed canonical coverage for:

- Ibuprofen.
- Metformin.
- Clavulanic Acid.
- Amoxicillin + Clavulanic Acid combination handling.

### Cleanup workflow

1. Import an authoritative, versioned WHO ATC dataset.
2. Validate ATC hierarchy and parent relationships.
3. Separate canonical molecules, legitimate synonyms, brands, and product phrases.
4. Detect aliases assigned to multiple molecules.
5. Detect duplicate canonical keys and orphan codes.
6. Review broad or combination substances.
7. Version every mapping decision.
8. Prevent unresolved mappings from generating validated composition groups.

---

## 8. Composition Group Rules

### Authoritative identity

Comparison requires exact equality of:

- Canonical ingredients.
- Per-ingredient strengths.
- Dosage form, including release characteristics.
- Route of administration.

### Canonical signature

Format:

```text
v1|ingredient@strength[+ingredient@strength...]|dosage_form|route
```

Examples:

```text
v1|paracetamol@500mg|tablet|oral
v1|amoxicillin@875mg+clavulanic_acid@125mg|tablet|oral
```

The signature is an internal identity, not the customer display label.

### Ingredient ordering

- Sort by stable canonical molecule key, not source order, brand, or database UUID.
- Preserve source ingredient order separately for audit/display.
- Strength stays attached to its ingredient.
- Reversed source order must produce the same canonical signature.

### Strength normalization

- Store numeric value separately from normalized unit.
- Normalize equivalent mass units to a canonical unit.
- Preserve the original source text.
- Represent concentrations as numerator and denominator.
- Do not flatten `875mg + 125mg` into one ambiguous strength string.
- Release characteristics are part of form identity where clinically relevant.
- Unparseable strength requires review.

### Dosage-form normalization

Use a controlled vocabulary with explicit aliases:

- tablet
- capsule
- syrup
- suspension
- drops
- cream
- ointment
- injection
- solution
- inhaler

Preserve clinically significant modifiers:

- immediate release
- extended/modified release
- dispersible
- chewable
- enteric-coated
- topical versus ophthalmic/otic drops

### Route normalization

Controlled values include:

- oral
- intravenous
- intramuscular
- subcutaneous
- topical
- ophthalmic
- otic
- nasal
- inhalation
- rectal
- vaginal
- transdermal

Missing or ambiguous route blocks automatic comparison.

---

## 9. Pack Normalization Strategy

### Common fields

Every pack supports:

- `unit_count`
- `unit_type`
- `volume_ml`
- `weight_g`
- `container_count`
- normalized pack label
- original source text
- `cost_per_unit`

### Pack rules

| Presentation | Primary normalization |
|---|---|
| Tablets | Count; cost per tablet |
| Capsules | Count; cost per capsule |
| Syrups | Bottle count and volume in ml; cost per ml |
| Drops | Bottle count and volume in ml; cost per ml |
| Creams | Tube/container count and weight in g; cost per g |
| Ointments | Tube/container count and weight in g; cost per g |
| Injections | Container count plus vial/ampoule type; cost per container |
| Vials | Vial count, volume/content where present; cost per vial |
| Ampoules | Ampoule count and volume; cost per ampoule |
| Inhalers | Device count and metered doses; cost per dose |

Examples:

- `10 tablets` → count `10`, unit `tablet`.
- `2 × 10 capsules` → count `20`, unit `capsule`, original structure retained.
- `120 ml bottle` → volume `120`, unit `ml`.
- `5 ampoules × 2 ml` → container count `5`, content `2 ml`, total volume `10 ml`.
- `200-dose inhaler` → count `200`, unit `dose`.

Unparseable packs remain visible for regulatory reference but are excluded from savings.

---

## 10. Pricing Strategy

### Price types

- **Approved DRAP Price:** regulatory ceiling/reference for an exact pack.
- **Retail Listed Price:** non-pharmacy-specific market/list price for an exact pack.
- **Pharmacy Observed Price:** time-stamped price from a specific pharmacy/source for an exact pack.
- **Unit Price:** derived, never imported as the sole authoritative value.

### Price hierarchy

For purchase and savings:

1. Current, in-stock pharmacy-observed price.
2. Current retail-listed price when no observed price is available.
3. Approved price is displayed as regulatory reference and is not treated as a purchase price unless explicitly designated as purchasable evidence.

For display:

- Show all available types with labels.
- Show source and observation/effective date.
- Show stale or unavailable status.
- Preserve non-numeric DRAP values such as SRO references but exclude them from arithmetic.

### Unit-price rules

```text
cost_per_unit = pack_price / normalized_pack_quantity
```

Basis:

- Tablet/capsule: per item.
- Liquid/drops: per ml.
- Cream/ointment: per g.
- Vial/ampoule: per container, with optional per ml.
- Inhaler: per metered dose.

---

## 11. Savings Engine Rules

### Eligible comparison

Products can be compared only when they belong to the same validated composition group:

- Same canonical composition.
- Same per-ingredient strength.
- Same dosage form and release characteristics.
- Same route.

### Pack eligibility

Direct pack savings require:

- Same normalized unit type.
- Same normalized quantity or content.
- Valid numeric prices.
- Compatible availability and freshness rules.

Formula:

```text
saving_amount = current_pack_price - cheapest_equivalent_pack_price
saving_percent = saving_amount / current_pack_price × 100
```

### Exceptions

- Different pack quantities may show unit-price comparison but not direct “you save” claims.
- A normalized quantity projection may be shown only as a clearly labelled estimate, not as an actual pack purchase saving.
- Different routes, forms, release types, concentrations, or strengths are never substitutes.
- Missing route or pack normalization disables savings.
- Approved price is not automatically the current or cheapest market price.
- Negative savings display as “current selection is cheapest,” not a negative saving.

---

## 12. Customer Search Resolution Engine

```text
Customer Input
      │
      ▼
Parse brand / generic / composition / strength / form / route
      │
      ▼
Brand detection and alias resolution
      │
      ▼
Canonical molecule resolution
      │
      ▼
Composition-group candidate generation
      │
      ▼
Exact group or customer disambiguation
      │
      ▼
Brand products → packs → prices → savings
```

### Brand search

- Resolve brand alias to one or more registered products.
- Use registration number to identify the selected product.
- Return its composition group.
- Brand never becomes the comparison key.

### Generic search

- Resolve canonical molecule or valid generic alias.
- Return groups differentiated by strength, form, and route.

### Composition search

- Parse multiple ingredients and their strengths.
- Canonicalize ingredient order.
- Return exact and incomplete candidates separately.

### Prescription search

- Parse medicine name, strength, dosage form, route, and quantity.
- Resolve brand or generic.
- Require disambiguation when route/form is absent and multiple groups qualify.

### Pharmacy bill search

- Resolve brand and pack text.
- Match registration number when present.
- Resolve exact pack before calculating savings.

---

## 13. API Contract

### Search API

`GET /api/catalogue/search?q=Paracetamol+500mg+Tablet`

```json
{
  "query": {
    "raw": "Paracetamol 500mg Tablet",
    "parsed": {
      "ingredients": ["Paracetamol"],
      "strengths": ["500mg"],
      "dosageForm": "tablet",
      "route": null
    }
  },
  "resolutionStatus": "NEEDS_ROUTE_CONFIRMATION",
  "groups": [
    {
      "id": "group-id",
      "displayName": "Paracetamol 500mg Tablet",
      "route": "oral",
      "brandCount": 3,
      "lowestComparablePrice": 68
    }
  ]
}
```

### Product API

`GET /api/catalogue/products/{registrationNumber}`

```json
{
  "id": "product-id",
  "registrationNumber": "DRAP-123",
  "brandName": "Panadol",
  "manufacturer": {
    "id": "manufacturer-id",
    "name": "Example Manufacturer",
    "country": "Pakistan"
  },
  "compositionGroupId": "group-id",
  "registration": {
    "date": "2020-01-01",
    "status": "ACTIVE",
    "verificationStatus": "VERIFIED",
    "meetingNumber": "213",
    "manufacturingType": "Local"
  },
  "packs": []
}
```

### Comparison API

`GET /api/catalogue/groups/{groupId}`

```json
{
  "compositionGroup": {
    "id": "group-id",
    "signature": "v1|paracetamol@500mg|tablet|oral",
    "displayName": "Paracetamol 500mg Tablet",
    "route": "oral",
    "ingredients": [
      {
        "genericId": "generic-id",
        "name": "Paracetamol",
        "strengthValue": 500,
        "strengthUnit": "mg",
        "atcCodes": ["N02BE01"]
      }
    ],
    "therapeuticCategories": ["Analgesics"]
  },
  "brands": [
    {
      "productId": "product-id",
      "registrationNumber": "DRAP-123",
      "brandName": "Panadol",
      "manufacturer": "Example Manufacturer",
      "registrationStatus": "ACTIVE",
      "packs": [
        {
          "packId": "pack-id",
          "label": "10 Tablets",
          "unitCount": 10,
          "unitType": "tablet",
          "prices": []
        }
      ]
    }
  ]
}
```

### Savings API

`POST /api/catalogue/savings`

```json
{
  "currentPackId": "pack-panadol-10",
  "city": "Karachi"
}
```

```json
{
  "comparisonEligible": true,
  "comparisonBasis": {
    "compositionGroupId": "group-id",
    "packQuantity": 10,
    "packUnit": "tablet"
  },
  "current": {
    "brand": "Panadol",
    "pack": "10 Tablets",
    "price": 95
  },
  "cheapestEquivalent": {
    "brand": "Febrol",
    "pack": "10 Tablets",
    "price": 68
  },
  "savingAmount": 27,
  "savingPercent": 28.42,
  "currency": "PKR"
}
```

API errors must distinguish:

- ambiguous identity
- incomplete comparison fields
- unvalidated group
- non-equivalent pack
- missing numeric price
- stale price
- unavailable product

---

## 14. Customer UI Specification

### Header

Use composition identity:

> Paracetamol 500mg Tablet — Oral

Never use the brand as the page identity.

### Sections

1. **Composition**
   - Ingredient names.
   - Individual strengths.
   - Dosage form.
   - Route.

2. **Therapeutic Category**
   - Validated ATC code and category.

3. **Available Brands**
   - Brand.
   - Manufacturer.
   - Registration number/status.
   - Verification status.

4. **Pack Sizes**
   - Independently selectable packs.
   - Normalized quantity and unit.

5. **Price Comparison**
   - Pharmacy/source.
   - Pack price.
   - Unit price.
   - Availability.
   - Observation date.
   - Approved price reference.

6. **Savings Analysis**
   - Current brand and pack.
   - Cheapest equivalent brand and same-basis pack.
   - Amount and percentage saved.
   - Exact comparison basis.

7. **Regulatory Information**
   - Registration number/date.
   - Source and verification status.
   - Route.
   - Meeting number.
   - Manufacturing type.
   - Manufacturer country.

Ambiguous or incomplete inputs must show disambiguation choices instead of equivalence claims.

---

## 15. Shadow Migration Strategy

### Phase 1 — Build composition-group runtime

- Introduce authoritative normalization and relationships additively.
- Preserve existing customer behavior.
- Backfill groups, products, packs, and price links.
- Quarantine incomplete records.

### Phase 2 — Shadow validation

- Run old and new resolution paths for the same requests.
- Do not expose new results as authoritative.
- Record differences in group membership, alternatives, and cheapest prices.
- Review false merges, false splits, and missing pack links.

### Phase 3 — Golden sample testing

- Validate the five required identities end to end.
- Require exact composition/form/route separation.
- Validate pack and savings calculations.

### Phase 4 — Customer cutover

- Switch search, product details, alternatives, prescriptions, bills, and savings to composition-group APIs.
- Keep legacy IDs resolvable through compatibility redirects.
- Monitor unresolved and non-comparable responses.

### Phase 5 — Legacy retirement

- Stop legacy comparison writes.
- Retain history during an agreed audit period.
- Remove legacy customer reads only after reconciliation reaches acceptance thresholds.
- Drop legacy structures only through separately approved work.

---

## 16. Golden Sample Validation Plan

### Paracetamol 500mg Tablet

Required:

- Paracetamol canonical molecule and valid ATC mapping.
- 500mg strength.
- Tablet form.
- Oral route.
- Multiple brands and normalized packs.
- Pack-linked prices and registration metadata.

Expected UI:

- `Paracetamol 500mg Tablet — Oral`.
- Brand, pack, price, savings, and regulatory sections.

Expected comparison:

- Include only oral 500mg tablets.
- Exclude 650mg tablets, syrup, drops, injection, and non-oral forms.

### Ibuprofen 400mg Tablet

Required:

- Reviewed Ibuprofen molecule/ATC mapping.
- 400mg tablet, oral group.
- At least two registered brands and comparable packs.

Expected comparison:

- Include exact oral 400mg tablets.
- Exclude 200mg/600mg, suspension, gel, and topical products.

### Metformin 500mg Tablet

Required:

- Replace current unmatched mapping with reviewed canonical mapping.
- Identify release characteristics.
- Normalize oral route and packs.

Expected comparison:

- Immediate-release products compare only with immediate-release.
- Extended/modified-release products remain separate.

### Amoxicillin 500mg Capsule

Required:

- Reviewed Amoxicillin molecule/ATC mapping.
- 500mg capsule, oral group.
- Registered brands, packs, and prices.

Expected comparison:

- Exclude tablets, suspension, injection, and other strengths.

### Amoxicillin + Clavulanic Acid 875mg/125mg Tablet

Required:

- Two canonical molecules.
- Independent strengths: 875mg and 125mg.
- Tablet form and oral route.
- Deterministic ingredient ordering.
- Registered products and exact pack prices.

Expected comparison:

- Reversed source ingredient order resolves to the same group.
- Exclude 500mg/125mg, 625mg shorthand products unless composition proves equality, suspensions, and single-ingredient Amoxicillin.

### Golden acceptance criteria

- All input styles resolve to the same expected group.
- No cross-strength, form, route, or release-type alternatives.
- Every displayed price belongs to a pack.
- Direct savings use identical normalized pack content.
- Every brand has a unique registration number.
- WHO mappings are reviewed and brand-free.
- UI exposes the fields used to prove equivalence.

---

## 17. Risk Assessment

### Critical

- Incorrect molecule or ingredient-strength mapping causing unsafe alternatives.
- Missing route creating false equivalence.
- Packless prices producing false savings.
- Brand-contaminated WHO aliases.
- Duplicate DRAP registration numbers.
- Premature customer cutover before backfill validation.

### High

- Combination ingredients ordered inconsistently.
- Concentration or release modifiers lost during normalization.
- Product prices failing to resolve to packs.
- Legacy and new paths returning conflicting alternatives.
- Stale pharmacy prices presented as current.

### Medium

- Incomplete manufacturer/regulatory metadata.
- Pack descriptions requiring manual parsing.
- Search ambiguity increasing during stricter resolution.
- Historical analytics requiring recalculation.

### Low

- Existing audit, source, confidence, and review infrastructure is reusable.
- Existing composition, pack, and ATC models reduce structural implementation effort.

Mitigation requires shadow validation, strict eligibility rules, manual review, versioned normalization, and monitored cutover.

---

## 18. Final Recommendation

### Recommended architecture

Adopt `CompositionGroup` as the sole customer-comparison identity:

```text
Generic
→ CompositionGroupComposition
→ CompositionGroup
→ Product by DRAP registration number
→ ProductPack
→ ProductPackPrice
→ Savings
```

Route of administration must be included with composition, strength, and dosage form. Brands remain group members and never participate in equivalence identity.

### Recommended rollout sequence

1. Preserve and structure missing DRAP fields.
2. Clean and validate WHO/molecule mappings.
3. Establish versioned group signatures.
4. Backfill product-to-group assignments.
5. Normalize packs.
6. Attach prices to packs.
7. Implement group-based search/APIs.
8. Run shadow comparison.
9. Pass golden-sample acceptance.
10. Cut customer UI and savings to the new runtime.
11. Retire legacy comparison paths after monitoring.

### Estimated implementation phases

| Phase | Estimated duration | Complexity |
|---|---:|---|
| Data model and normalization design | 1–2 weeks | High |
| DRAP/WHO cleanup and importer adaptation | 2–4 weeks | Critical |
| Backfill, review tooling, and pack resolution | 3–6 weeks | Critical |
| Search, API, and savings runtime | 2–4 weeks | High |
| Customer UI | 2–3 weeks | Medium–High |
| Shadow validation and golden samples | 2–4 weeks | Critical |
| Cutover and legacy retirement | 1–3 weeks plus monitoring | High |

Overall estimated delivery: **13–26 engineering weeks**, depending on DRAP data quality, manual-review volume, and pack-price coverage.

Overall complexity: **Critical data refactor with high application impact**.

No implementation should begin until this architecture, comparison identity, field ownership, pack-equivalence policy, and rollout sequence receive explicit approval.
