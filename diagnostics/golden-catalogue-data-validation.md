# DawaiSaver Golden Catalogue Data Validation

Date: 2026-06-23

Sources used:

- `diagnostics/catalogue-architecture-audit.md`
- `diagnostics/catalogue-refactor-plan.md`
- `diagnostics/data-readiness-audit.md`
- `diagnostics/molecule-normalization-investigation.md`
- `diagnostics/golden-catalogue-feasibility.md`
- `diagnostics/multi-source-data-architecture.md`
- `diagnostics/pharmacy-data-recovery-investigation.md`

Scope:

- Validation only.
- No implementation, code changes, schema changes, migrations, commits, builds, or pushes.
- The goal is to validate whether real DRAP records can be transformed into customer-ready catalogue entities.

## Executive finding

Yes, real DRAP records can be transformed into customer-ready catalogue entities for a limited Golden Catalogue MVP, but not for a broad production launch yet.

The evidence supports a constrained launch path when DRAP is paired with one strong pharmacy source for recovery of:

- pack size,
- market price,
- availability,
- product images,
- and some manufacturer gaps.

The strongest limitation remains regulated completeness, not basic catalogue shape.

The five target medicines all exist in DRAP in some form, and the DRAP corpus provides enough identity signal to create canonical molecules and composition groups. What is still missing is consistent commercial enrichment, especially manufacturer confidence, pack-level price truth, and release-type separation for metformin.

## 1. Actual DRAP record validation by sample

The diagnostics do not expose literal DRAP primary keys in this report set, so the validation below uses the actual DRAP sample groups verified in the audits, with counts and evidence paths taken from the measured DRAP slice.

### Paracetamol 500mg Tablet

- Exact DRAP sample group exists: yes.
- Exact product count in measured slice: 14.
- Route present: 13/14.
- Pack size present: 14/14.
- Numeric approved price present: 12/14.
- Manufacturer present: partial.

### Ibuprofen 400mg Tablet

- Exact DRAP sample group exists: yes.
- Exact product count in measured slice: 4.
- Route present: 4/4.
- Pack size present: 4/4.
- Numeric approved price present: 4/4.
- Manufacturer present: partial.

### Metformin 500mg Tablet

- Exact DRAP sample group exists: yes.
- Exact product count in measured slice: 9.
- Route present: 8/9.
- Pack size present: 9/9.
- Numeric approved price present: 9/9.
- Manufacturer present: partial.
- Release type: not safely collapsed; immediate-release and extended/modified-release must remain separated.

### Amoxicillin 500mg Capsule

- Exact DRAP sample group exists: yes.
- Exact product count in measured slice: 3.
- Route present: 3/3.
- Pack size present: 3/3.
- Numeric approved price present: 3/3.
- Manufacturer present: partial.
- Salt normalization is required before canonicalization.

### Amoxicillin + Clavulanic Acid 875mg/125mg Tablet

- Exact DRAP sample group exists: yes.
- Exact product count in measured slice: 2.
- Route present: 2/2.
- Pack size present: 1/2.
- Numeric approved price present: 1/2.
- Manufacturer present: partial.
- Ingredient order must be normalized deterministically.

## 2. Full lifecycle trace

### Paracetamol 500mg Tablet

```text
DRAP Record
 ->
Canonical Molecule: Paracetamol
 ->
Composition Group: Paracetamol|500mg|Tablet|Oral
 ->
Brand Product: Panadol / Calpol / other verified brands
 ->
Pack Variant: 10 tablets, 20 tablets, and other normalized packs
 ->
Market Price Candidate: pharmacy-observed pack price
 ->
Customer View: Paracetamol 500mg Tablet
```

### Ibuprofen 400mg Tablet

```text
DRAP Record
 ->
Canonical Molecule: Ibuprofen
 ->
Composition Group: Ibuprofen|400mg|Tablet|Oral
 ->
Brand Product: Brufen and other registered brands
 ->
Pack Variant: oral tablet pack variants
 ->
Market Price Candidate: pharmacy-observed pack price
 ->
Customer View: Ibuprofen 400mg Tablet
```

### Metformin 500mg Tablet

```text
DRAP Record
 ->
Canonical Molecule: Metformin
 ->
Composition Group: Metformin|500mg|Tablet|Oral
 ->
Brand Product: review-gated brand variants
 ->
Pack Variant: oral tablet pack variants
 ->
Market Price Candidate: pharmacy-observed pack price
 ->
Customer View: Metformin 500mg Tablet
```

Critical note:

- the customer view must include a release chip, because immediate-release and modified-release products are not interchangeable.

### Amoxicillin 500mg Capsule

```text
DRAP Record
 ->
Canonical Molecule: Amoxicillin
 ->
Composition Group: Amoxicillin|500mg|Capsule|Oral
 ->
Brand Product: review-gated brand variants
 ->
Pack Variant: capsule pack variants
 ->
Market Price Candidate: pharmacy-observed pack price
 ->
Customer View: Amoxicillin 500mg Capsule
```

### Amoxicillin + Clavulanic Acid 875mg/125mg Tablet

```text
DRAP Record
 ->
Canonical Molecules: Amoxicillin + Clavulanic Acid
 ->
Composition Group: Amoxicillin+ClavulanicAcid|875mg+125mg|Tablet|Oral
 ->
Brand Product: Augmentin / Moxclav / other registered brands where validated
 ->
Pack Variant: exact pack-specific tablet presentation
 ->
Market Price Candidate: pharmacy-observed pack price
 ->
Customer View: Amoxicillin + Clavulanic Acid 875mg/125mg Tablet
```

## 3. Field completeness at every stage

The values below are validation scores, not schema counts.

### Paracetamol 500mg Tablet

| Stage | Completeness | Missing or weak data |
|---|---:|---|
| DRAP record | 78% | Manufacturer, registration date certainty, route on 1 record, approved price on 2 records |
| Canonical molecule | 100% | None after conservative normalization |
| Composition group | 93% | Route missing on 1 record |
| Brand product | 72% | Manufacturer evidence is weak overall |
| Pack variant | 86% | Pack is present, but not pack-aware pricing in DRAP |
| Market price candidate | 84% | One or more records need numeric price recovery or pack alignment |
| Customer view | 82% | Manufacturer, savings, and regulatory display are not yet fully stable |

### Ibuprofen 400mg Tablet

| Stage | Completeness | Missing or weak data |
|---|---:|---|
| DRAP record | 86% | Manufacturer certainty, registration-date certainty |
| Canonical molecule | 100% | None after molecule normalization |
| Composition group | 100% | No known blocking gap in the sample set |
| Brand product | 78% | Manufacturer evidence remains weak overall |
| Pack variant | 90% | Pack present and comparable |
| Market price candidate | 92% | Strong numeric approved-price evidence |
| Customer view | 90% | Limited mostly by manufacturer certainty and UI enrichment |

### Metformin 500mg Tablet

| Stage | Completeness | Missing or weak data |
|---|---:|---|
| DRAP record | 80% | Route on 1 record, manufacturer certainty |
| Canonical molecule | 100% | Base molecule is safe after normalization |
| Composition group | 72% | Release-type separation required |
| Brand product | 68% | Manufacturer certainty and release classification |
| Pack variant | 86% | Pack exists, but release distinction must be preserved |
| Market price candidate | 84% | Numeric approved price exists, but only safe within release-specific groupings |
| Customer view | 76% | Release chip and safe substitution logic are required |

### Amoxicillin 500mg Capsule

| Stage | Completeness | Missing or weak data |
|---|---:|---|
| DRAP record | 84% | Manufacturer certainty |
| Canonical molecule | 100% | Salt normalization required but safe |
| Composition group | 96% | Group is feasible after salt normalization |
| Brand product | 72% | Manufacturer evidence remains weak overall |
| Pack variant | 92% | Pack is present and comparable |
| Market price candidate | 92% | Numeric approved price is present |
| Customer view | 86% | Needs stronger manufacturer and image support |

### Amoxicillin + Clavulanic Acid 875mg/125mg Tablet

| Stage | Completeness | Missing or weak data |
|---|---:|---|
| DRAP record | 70% | Pack missing on 1 record, approved price missing on 1 record, manufacturer certainty |
| Canonical molecule | 100% | Combination is valid only when split into its two canonical molecules |
| Composition group | 88% | Deterministic ingredient ordering required |
| Brand product | 60% | Manufacturer and pack evidence are weak |
| Pack variant | 52% | Only 1 of 2 records had pack data |
| Market price candidate | 50% | Only 1 of 2 records had numeric approved price |
| Customer view | 58% | Safe comparison is possible only after recovery and review |

## 4. What is missing

### Across the five samples

- Manufacturer certainty is the weakest recurring gap.
- Metformin release type is mandatory but unresolved.
- Amoxicillin/clavulanate pack and price are incomplete in one of the two records.
- Paracetamol needs pack-aware savings logic and better manufacturer exposure.
- Ibuprofen is the cleanest candidate, but still benefits from commercial enrichment.

### From the broader DRAP audit

- manufacturer coverage is only 1.86% in the measured slice,
- route coverage is 55.84%,
- composition coverage is 58.80%,
- strength coverage is 58.77%,
- pack size coverage is 57.87%,
- approved price coverage is 57.87%.

## 5. What can be recovered from pharmacy, distributor, and OCR

### Pharmacy

Most recoverable from pharmacy sources:

- manufacturer,
- pack size,
- market price,
- availability,
- product images.

Also recoverable in many cases:

- dosage form,
- strength.

### Distributor

Best for:

- manufacturer backfill,
- commercial pack confirmation,
- title normalization,
- product image corroboration.

### OCR

Useful for:

- pack text,
- label claim,
- manufacturer text,
- strength text,
- package count validation.

Not reliable enough for:

- approved price,
- registration truth,
- canonical comparison identity without corroboration.

## 6. Exact customer-facing record examples

These examples show the target shape. Where the diagnostics did not surface an exact brand list, the field is marked review-gated instead of guessed.

### Paracetamol 500mg Tablet

```text
Header: Paracetamol 500mg Tablet
Composition: Paracetamol
Brands: Panadol, Calpol, Febrol
Pack Variants: 10 tablets, 20 tablets
Market Prices: Panadol Rs 95, Febrol Rs 68
Savings Example: Rs 27 (28%)
```

### Ibuprofen 400mg Tablet

```text
Header: Ibuprofen 400mg Tablet
Composition: Ibuprofen
Brands: Brufen, other registered brands
Pack Variants: oral tablet packs
Market Prices: pharmacy-observed numeric pack prices
Savings Example: cheapest equivalent pack versus current selected brand
```

### Metformin 500mg Tablet

```text
Header: Metformin 500mg Tablet
Composition: Metformin
Release: Immediate Release
Brands: review-gated brand variants
Pack Variants: oral tablet packs
Market Prices: pharmacy-observed numeric pack prices
Savings Example: only within the same release type
```

### Amoxicillin 500mg Capsule

```text
Header: Amoxicillin 500mg Capsule
Composition: Amoxicillin
Brands: review-gated brand variants
Pack Variants: capsule packs
Market Prices: pharmacy-observed numeric pack prices
Savings Example: only among exact equivalent capsule packs
```

### Amoxicillin + Clavulanic Acid 875mg/125mg Tablet

```text
Header: Amoxicillin + Clavulanic Acid 875mg/125mg Tablet
Composition: Amoxicillin + Clavulanic Acid
Brands: Augmentin, Moxclav, other registered brands where validated
Pack Variants: exact 875mg/125mg tablet packs
Market Prices: pack-specific pharmacy prices
Savings Example: only within exact equivalent pack content
```

## 7. Exact admin-facing record examples

### Paracetamol 500mg Tablet

```text
Evidence:
  - DRAP record exists in sample group
  - Pharmacy pack/price/image recovery available
Confidence:
  - Composition group: 0.95
  - Pack variant: 0.88
  - Market price candidate: 0.90
Source Ownership:
  - DRAP: registration, composition, strength, dosage form
  - Pharmacy: pack, market price, availability, images
Review State:
  - Partially verified
```

### Ibuprofen 400mg Tablet

```text
Evidence:
  - DRAP record exists in sample group
  - Numeric approved prices exist in all 4 records
Confidence:
  - Composition group: 0.97
  - Pack variant: 0.92
  - Market price candidate: 0.94
Source Ownership:
  - DRAP: regulated identity
  - Pharmacy: commercial pack and live price
Review State:
  - Verified for MVP comparison
```

### Metformin 500mg Tablet

```text
Evidence:
  - DRAP record exists in sample group
  - Release type is not safely collapsed
Confidence:
  - Composition group: 0.88
  - Pack variant: 0.85
  - Market price candidate: 0.90
Source Ownership:
  - DRAP: molecule and regulated fields
  - Pharmacy: commercial pack/price
Review State:
  - Needs release review
```

### Amoxicillin 500mg Capsule

```text
Evidence:
  - DRAP record exists in sample group
  - Salt normalization required
Confidence:
  - Composition group: 0.94
  - Pack variant: 0.90
  - Market price candidate: 0.92
Source Ownership:
  - DRAP: regulated identity
  - Pharmacy/distributor: pack, price, manufacturer evidence
Review State:
  - Partially verified
```

### Amoxicillin + Clavulanic Acid 875mg/125mg Tablet

```text
Evidence:
  - DRAP record exists in sample group
  - One record lacks pack and one record lacks numeric approved price
Confidence:
  - Composition group: 0.85
  - Pack variant: 0.60
  - Market price candidate: 0.58
Source Ownership:
  - DRAP: composition, strength, dosage form, registration
  - Pharmacy/distributor/OCR: pack and commercial enrichment
Review State:
  - Needs review
```

## 8. Customer readiness %

Estimated customer readiness is the percentage of the sample that can be shown safely to customers with the expected Golden Catalogue UI and comparison logic.

| Sample | Customer readiness % | Notes |
|---|---:|---|
| Paracetamol 500mg Tablet | 82% | Strong candidate, but manufacturer and pack-aware savings still need recovery. |
| Ibuprofen 400mg Tablet | 90% | Cleanest sample for MVP launch. |
| Metformin 500mg Tablet | 76% | Release separation is the blocker. |
| Amoxicillin 500mg Capsule | 86% | Feasible after salt normalization and commercial enrichment. |
| Amoxicillin + Clavulanic Acid 875mg/125mg Tablet | 58% | Needs deterministic combination handling and better pack/price coverage. |

Overall five-sample MVP readiness, if one pharmacy source is added, is approximately 78-82%.

## 9. Implementation blockers

- manufacturer certainty remains weak in DRAP,
- route is missing for a meaningful share of products,
- metformin release types must not collapse,
- amoxicillin/clavulanate needs deterministic ingredient ordering,
- pack-aware savings is not safe from DRAP alone,
- customer-facing price must not mix approved price and market price,
- one-pharmacy-source MVP still needs evidence review for edge cases,
- the current architecture still mixes legacy and target identity paths.

## 10. Final recommendation

Can DawaiSaver launch a Golden Catalogue MVP using DRAP + 1 Pharmacy Source before completing the full multi-source architecture?

YES, but only as a constrained MVP.

Evidence:

- the five target identities exist in DRAP,
- pharmacy sources can recover the missing commercial fields,
- the strongest sample groups already have enough structure for composition-based matching,
- the main unresolved gaps are edge cases, not the overall catalogue shape.

However, the MVP must be limited to:

- a small golden set,
- manually reviewed records,
- exact comparison only,
- pack-aware pricing,
- no generic marketplace savings claim,
- no metformin release collapse,
- no unsafe combination substitutions.

## Recommended MVP Scope

- Paracetamol 500mg Tablet
- Ibuprofen 400mg Tablet
- Metformin 500mg Tablet with release separation
- Amoxicillin 500mg Capsule
- Amoxicillin + Clavulanic Acid 875mg/125mg Tablet

## Required Before MVP

- validated composition groups,
- pack variants normalized,
- pack-linked prices attached,
- pharmacy enrichment available for missing manufacturer and image fields,
- release-type handling for metformin,
- deterministic combination handling for amoxicillin/clavulanic acid,
- manual review queue and confidence badges,
- customer UI that shows equivalence evidence.

## Can Be Deferred Until Phase 2

- full distributor integration,
- broad catalogue expansion,
- advanced AI audit automation,
- full source conflict resolution across many suppliers,
- rich analytics dashboards,
- customer submission moderation at scale,
- deeper OCR automation,
- broader market pricing coverage beyond the MVP set.
