# DawaiSaver Golden Catalogue Pipeline Design

Date: 2026-06-23

Sources used:

- `diagnostics/catalogue-architecture-audit.md`
- `diagnostics/catalogue-refactor-plan.md`
- `diagnostics/data-readiness-audit.md`
- `diagnostics/molecule-normalization-investigation.md`
- `diagnostics/golden-catalogue-feasibility.md`
- `diagnostics/multi-source-data-architecture.md`
- `diagnostics/pharmacy-data-recovery-investigation.md`
- `diagnostics/golden-catalogue-data-validation.md`

Scope:

- Design only.
- No implementation, code changes, schema changes, migrations, commits, builds, or pushes.
- MVP scope only:
  - Ibuprofen 400mg Tablet
  - Amoxicillin 500mg Capsule
  - Paracetamol 500mg Tablet
- Excluded for now:
  - Metformin
  - Amoxicillin + Clavulanic Acid

## Executive finding

The MVP pipeline should be a tightly controlled evidence pipeline, not a bulk catalogue import.

For the three MVP medicines, the safest flow is:

`DRAP -> Normalization -> Composition Group -> Pharmacy Matching -> Pack Normalization -> Price Matching -> Confidence Calculation -> Customer Record`

This pipeline is feasible because:

- the three medicines exist in DRAP sample groups,
- all three are structurally simpler than metformin or amoxicillin/clavulanate,
- pharmacy sources can recover missing pack and price data,
- the current normalization rules are good enough for these three groups with review.

The pipeline must remain review-gated until it proves that each stage preserves the same comparison identity:

`Composition + Strength + Form + Route`

Brand remains display-only, not comparison identity.

## 1. Complete data flow

```text
DRAP
 ->
Normalization
 ->
Composition Group
 ->
Pharmacy Matching
 ->
Pack Normalization
 ->
Price Matching
 ->
Confidence Calculation
 ->
Customer Record
```

### Flow goals

- Convert raw DRAP rows into canonical comparison groups.
- Enrich missing commercial fields from one pharmacy source.
- Preserve evidence at every step.
- Block unsafe comparison records before customer exposure.

## 2. Pipeline stage definitions

## Stage 1: DRAP ingest

### Input

- Raw DRAP detail pages and parsed DRAP rows.
- Registration number.
- Brand name.
- Composition text.
- Strength text.
- Dosage form.
- Route.
- Pack size.
- Approved price.
- Manufacturer fields where available.

### Output

- Staged DRAP record with raw and normalized source text.
- Field presence flags.
- Source evidence payload.

### Validation

- Registration number present.
- Brand present.
- At least one usable composition row.
- Dosage form present.
- Measured completeness against sample medicine rules.

### Failure modes

- composition missing,
- route missing,
- pack missing,
- textual approved price only,
- manufacturer missing,
- duplicate registration identity.

## Stage 2: Normalization

### Input

- DRAP staged record.
- Canonical molecule rules.
- dosage-form normalization rules.
- route normalization rules.
- strength parsing rules.

### Output

- normalized molecule names,
- normalized strength tokens,
- normalized form,
- normalized route,
- composition-row evidence,
- normalization confidence.

### Validation

- exact match or approved alias for molecule,
- strength parses to canonical token,
- dosage form maps to controlled vocabulary,
- route maps to controlled vocabulary,
- no brand contamination in molecule field,
- no silent drop of comparison-critical fields.

### Failure modes

- salt handling not authorized,
- spelling alias unresolved,
- strength ambiguous,
- route ambiguous,
- combination or release-type ambiguity.

## Stage 3: Composition Group

### Input

- normalized ingredient rows,
- normalized strength values,
- normalized dosage form,
- normalized route.

### Output

- canonical composition group,
- canonical signature,
- confidence score,
- comparison eligibility,
- list of linked DRAP source rows.

### Validation

- comparison identity must be unique,
- ingredient order must be deterministic,
- route must be present for customer-ready comparison,
- no brand, manufacturer, or price fields in the group identity,
- duplicate groups must be merged or quarantined.

### Failure modes

- missing route,
- wrong ingredient order,
- release form not separated,
- composition not equivalent,
- group too broad or too narrow.

## Stage 4: Pharmacy Matching

### Input

- validated composition group,
- pharmacy catalogue source,
- pharmacy brand pages,
- product titles,
- images,
- manufacturer text,
- price text,
- pack text.

### Output

- matched brand products,
- manufacturer evidence,
- commercial listing evidence,
- candidate pack variants,
- match confidence.

### Validation

- pharmacy title resolves to same composition group,
- strength and form match exactly,
- brand is a member of the group, not the identity,
- manufacturer evidence is consistent enough to display,
- product image supports the listing.

### Failure modes

- pharmacy brand is not exact equivalent,
- dosage form drift,
- strength mismatch,
- ambiguous salt naming,
- OCR or title contamination.

## Stage 5: Pack Normalization

### Input

- pharmacy product title,
- DRAP pack text,
- product image evidence,
- OCR pack text when available.

### Output

- normalized pack variant,
- unit count,
- presentation type,
- pack equivalence group,
- pack confidence.

### Validation

- pack count is explicitly normalized,
- `10 tablets` and `20 tablets` remain separate variants,
- `1x10's` may normalize to `10 tablets` only if evidence supports it,
- no overwrite of one pack by another,
- pack matches the product's dosage form.

### Failure modes

- ambiguous pack text,
- missing unit count,
- packaging image not legible,
- pharmacy pack differs from DRAP pack,
- unit conversion not safe.

## Stage 6: Price Matching

### Input

- normalized pack variant,
- pharmacy price,
- DRAP approved price,
- price snapshot evidence,
- city or pharmacy context.

### Output

- market price candidate,
- approved price candidate,
- pack-level price,
- unit price,
- price confidence.

### Validation

- price must belong to a pack variant,
- market price and approved price remain separate,
- pack-level price is numeric,
- price is comparable only within the same normalized pack basis,
- unit price is computed only from validated pack quantity.

### Failure modes

- price is text only,
- market price missing,
- pack size missing,
- approved price cannot be parsed,
- comparison would mix different pack sizes.

## Stage 7: Confidence Calculation

### Input

- DRAP confidence,
- normalization confidence,
- composition group confidence,
- pharmacy match confidence,
- pack confidence,
- price confidence.

### Output

- field confidence,
- record confidence,
- verification status,
- review state,
- customer-readiness flag.

### Validation

- every critical field has confidence,
- low-confidence fields are visible,
- record is blocked if a critical field falls below threshold,
- confidence cannot hide a missing route, pack, or price.

### Failure modes

- one strong field masking one weak field,
- customer-ready flag set too early,
- review state not propagated,
- price confidence higher than pack confidence.

## Stage 8: Customer Record

### Input

- approved or partially approved record,
- pack and price evidence,
- confidence state,
- review annotations.

### Output

- customer-facing catalogue record,
- brand list,
- pack list,
- price comparison,
- savings example,
- verification status.

### Validation

- header shows composition identity,
- comparison identity is the same as the approved composition group,
- brand list is evidence-linked,
- pack variants are explicit,
- savings only shown when pack basis is equivalent,
- verification status is shown to customer.

### Failure modes

- brand becomes the header,
- savings shown on non-equivalent packs,
- customer view hides unresolved fields,
- record exposed without review state.

## 3. Required admin reviews

### Review A: Molecule normalization review

- Approve molecule aliases for the three MVP medicines.
- Reject brand contamination.
- Approve salt and spelling variants only when explicit.

### Review B: Composition group review

- Confirm the exact group signature.
- Confirm route.
- Confirm ingredient order.
- Confirm release-type separation where relevant.

### Review C: Pharmacy match review

- Confirm pharmacy product maps to the same composition group.
- Confirm brand, strength, and form.
- Confirm manufacturer evidence.

### Review D: Pack review

- Confirm pack size.
- Confirm pack count normalization.
- Confirm pack variant separation.

### Review E: Price review

- Confirm pack-level market price.
- Confirm DRAP approved price separately.
- Confirm that price comparisons use equivalent packs.

### Review F: Final launch review

- Confirm customer readiness.
- Confirm no critical anomalies.
- Confirm comparison output matches the approved composition group.

## 4. Automatic vs manual decisions

### Automatic decisions

- exact molecule match,
- approved spelling alias,
- exact dosage-form normalization,
- exact route normalization,
- exact comparison identity construction,
- pack normalization when pattern is unambiguous,
- price capture when numeric and pack-linked,
- confidence aggregation.

### Manual decisions

- salt normalization edge cases,
- any ambiguous molecule alias,
- any uncertain pack text,
- any pharmacy match with weak evidence,
- any product with missing route,
- any record with release-type ambiguity,
- any record where price and pack evidence disagree,
- any record with low manufacturer confidence.

### Forced manual for MVP

- all final customer-visible records should receive at least one human approval pass before launch.

## 5. Confidence scoring checkpoints

### Checkpoint 1: DRAP completeness

- registration number
- brand
- composition
- strength
- dosage form
- route
- pack size
- approved price

Minimum:

- Paracetamol: 75%
- Ibuprofen: 85%
- Amoxicillin: 80%

### Checkpoint 2: Normalization confidence

- molecule normalization
- strength normalization
- form normalization
- route normalization

Minimum:

- 0.95 for automatic acceptance
- 0.80 to 0.9499 for review

### Checkpoint 3: Composition group confidence

- exact comparison identity,
- deterministic ordering,
- no brand contamination,
- route present.

Minimum:

- 0.95 for customer-ready comparison

### Checkpoint 4: Pharmacy match confidence

- same composition,
- same strength,
- same form,
- acceptable manufacturer evidence.

Minimum:

- 0.90 for launch

### Checkpoint 5: Pack confidence

- normalized count,
- pack equivalence,
- packaging evidence or exact title match.

Minimum:

- 0.85 for launch

### Checkpoint 6: Price confidence

- numeric price,
- pack-linked,
- comparable pack basis.

Minimum:

- 0.90 for launch

### Checkpoint 7: Record confidence

Suggested weight:

- composition group: 25%
- strength: 15%
- dosage form: 15%
- route: 10%
- pack: 15%
- price: 15%
- manufacturer: 5%

Launch threshold:

- 0.88 overall and no critical field below threshold.

## 6. Customer-ready criteria

A customer record is ready only if all of the following are true:

- composition group is approved,
- strength is approved,
- dosage form is approved,
- route is approved,
- at least one verified brand is linked,
- pack variant is normalized,
- market price is pack-linked,
- savings is calculated against an equivalent pack,
- verification status is displayed,
- no critical anomaly remains open.

### Critical field thresholds

- composition: 0.95+
- strength: 0.90+
- dosage form: 0.90+
- route: 0.85+
- pack: 0.85+
- price: 0.90+
- manufacturer: 0.70+ for display, 0.85+ for strong verification badge

## 7. Exact customer record structure

```json
{
  "composition": "Paracetamol",
  "strength": "500mg",
  "form": "Tablet",
  "brands": [
    {
      "brand": "Panadol",
      "manufacturer": "GlaxoSmithKline Pakistan",
      "registrationNumber": "DRAP-xxxx",
      "verificationStatus": "Verified"
    }
  ],
  "packVariants": [
    {
      "packSize": "10 tablets",
      "unitCount": 10,
      "unitType": "tablet",
      "marketPrice": 95,
      "priceBasis": "per pack",
      "unitPrice": 9.5
    }
  ],
  "marketPrices": [
    {
      "brand": "Panadol",
      "packSize": "10 tablets",
      "marketPrice": 95,
      "source": "Pharmacy Source",
      "confidence": 0.9
    }
  ],
  "savings": {
    "currentBrand": "Panadol",
    "cheapestEquivalentBrand": "Febrol",
    "saving": 27,
    "savingPercent": 28
  },
  "verificationStatus": "Partially Verified"
}
```

### Notes

- `composition` is the canonical molecule or molecule set for the approved MVP.
- `strength` and `form` define the comparison identity.
- `brands` may include more than one brand if the same group is validated.
- `packVariants` are always pack-specific.
- `marketPrices` must be pack-specific and numeric.
- `savings` must reference equivalent pack content only.

## 8. Exact admin review screens needed

### Screen 1: DRAP sample queue

- rows by medicine,
- field completeness,
- raw source preview,
- route/pack/price missing flags.

### Screen 2: Molecule approval screen

- molecule candidate,
- aliases,
- normalization rule,
- salt/spelling evidence,
- review decision.

### Screen 3: Composition group approval screen

- canonical signature,
- ingredient order,
- route,
- strength,
- comparison eligibility.

### Screen 4: Pharmacy match screen

- DRAP record,
- pharmacy listing,
- match confidence,
- manufacturer evidence,
- image evidence.

### Screen 5: Pack normalization screen

- pack text,
- normalized pack,
- count evidence,
- conflicting packs,
- approved pack variant.

### Screen 6: Price matching screen

- DRAP approved price,
- pharmacy market price,
- pack basis,
- unit price,
- savings candidate.

### Screen 7: Final launch review screen

- full record,
- confidence summary,
- open anomalies,
- approve / reject / defer.

## 9. Release checklist

### Data checklist

- [ ] DRAP sample records ingested.
- [ ] Canonical molecule approved.
- [ ] Composition group approved.
- [ ] Pharmacy match approved.
- [ ] Pack normalized.
- [ ] Pack price attached.
- [ ] Confidence above threshold.
- [ ] Manufacturer evidence linked.
- [ ] Customer view rendered.

### Safety checklist

- [ ] No missing route.
- [ ] No cross-strength substitution.
- [ ] No release-type confusion.
- [ ] No pack mismatch.
- [ ] No brand contamination in identity.
- [ ] No text-only price shown as market truth.
- [ ] No unresolved critical alert.

### Launch checklist

- [ ] Golden sample passes.
- [ ] Admin approvals complete.
- [ ] Customer record matches evidence.
- [ ] Comparison and savings outputs are pack-equivalent.
- [ ] Rollback path is defined.

## 10. Estimated implementation order

1. Build DRAP ingestion and normalization checkpoints for the three MVP medicines.
2. Approve canonical molecules and composition groups.
3. Connect one pharmacy source for product matching.
4. Normalize packs and attach pack prices.
5. Add confidence calculation and review gating.
6. Create customer-facing record structure.
7. Run golden sample validation.
8. Launch the MVP in shadow mode.
9. Promote to customer-visible MVP after review sign-off.

## 11. Estimated MVP scope

### In scope

- Ibuprofen 400mg Tablet
- Amoxicillin 500mg Capsule
- Paracetamol 500mg Tablet
- One pharmacy source
- Pack normalization
- Price matching
- Confidence badges
- Admin approval workflow

### Out of scope

- Metformin
- Amoxicillin + Clavulanic Acid
- distributor enrichment
- broad multi-source conflict resolution
- advanced AI audit automation
- marketplace-wide savings claims

## 12. Estimated development complexity

Overall complexity: medium-high.

Why:

- the identity model is clear,
- the three medicines are manageable,
- but the pipeline still needs evidence handling, pack normalization, confidence logic, and manual review workflows.

Estimated effort profile:

- normalization and composition grouping: medium,
- pharmacy matching: medium,
- pack normalization and price matching: medium-high,
- confidence and admin review surfaces: medium-high,
- customer record and launch controls: medium.

## Final recommendation

For the MVP medicines, the pipeline is ready to design and should be implemented as a review-gated evidence flow.

The pipeline should not attempt to solve metformin or amoxicillin/clavulanate yet.

## Recommended First MVP Medicines

1. Ibuprofen 400mg Tablet
2. Amoxicillin 500mg Capsule
3. Paracetamol 500mg Tablet

## Recommended First Pharmacy Source

1. Dawaai

Reason:

- it clearly exposes brand, pack size, price, and manufacturer on medicine pages and listings,
- it supports alternate brand discovery,
- it has enough catalogue structure to drive the first MVP matching loop.

## Recommended First Release Scope

- DRAP ingest for the three MVP medicines.
- Canonical molecule approval.
- Composition group approval.
- One-pharmacy matching.
- Pack normalization.
- Pack-linked price matching.
- Manual admin review for all launch records.
- Customer-facing record with verification status and savings.

## Go / No-Go Recommendation

Go, but only as a constrained shadow-to-MVP release.

The release is a:

- Go for the three medicines,
- No-Go for metformin and amoxicillin/clavulanate,
- No-Go for broad catalogue expansion until the admin review and confidence layers are live.
