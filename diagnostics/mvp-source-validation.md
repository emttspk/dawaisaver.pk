# DawaiSaver MVP Source Validation

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
- `diagnostics/golden-catalogue-pipeline-design.md`

External source evidence inspected:

- [Dawaai Paracetamol 500mg Tab](https://dawaai.pk/medicine/panadol-5-24329.html)
- [Dawaai Paracetamol listing](https://dawaai.pk/all-medicines/p)
- [Dawaai Amoxil 500mg Cap](https://dawaai.pk/medicine/amoxil-500mg-100s-43573.html)
- [Dawaai Amoxicillin listing](https://dawaai.pk/all-medicines/a)
- [Dawaai Ibuprofen 400mg Tab](https://dawaai.pk/medicine/ibuprofen-7-35289.html)
- [Dawaai Ibuprofen listing](https://dawaai.pk/all-medicines/i)

Scope:

- Validation only.
- No implementation, code changes, schema changes, migrations, commits, builds, or pushes.
- Focused only on:
  - Ibuprofen 400mg Tablet
  - Amoxicillin 500mg Capsule
  - Paracetamol 500mg Tablet

## Executive finding

DRAP + Dawaai is enough to support all three MVP medicines with customer-ready evidence.

The previously blocking issue, Ibuprofen 400mg Tablet, is now resolved:

- Dawaai exposes the exact 400mg product page,
- the page source contains the exact 400mg identity,
- pack size metadata is present,
- pricing metadata is present,
- alternate 400mg brands are also visible.

Therefore the MVP set as defined is now supported by DRAP + Dawaai alone.

## 1. Actual Dawaai products matching each MVP medicine

### Paracetamol 500mg Tablet

Actual Dawaai product found:

- [Panadol 500mg Tab](https://dawaai.pk/medicine/panadol-5-24329.html)

Supporting Dawaai listing evidence:

- [Panadol listing on Dawaai A-Z](https://dawaai.pk/all-medicines/p)

Observed fields:

- Brand: GSK Consumer Healthcare.
- Composition: Paracetamol (500 mg).
- Strength: 500mg.
- Dosage form: Tablet.
- Pack size: 20 x 10's.
- Manufacturer: GSK Consumer Healthcare.
- Price: listed in Dawaai catalogue as a pack price; alternate-brand pricing and catalogue pricing are visible on the Dawaai product/listing pages.
- Image availability: yes.

### Ibuprofen 400mg Tablet

- [Ibuprofen 400mg Tab](https://dawaai.pk/medicine/ibuprofen-7-35289.html)
- [Ibuprofen listing on Dawaai A-Z](https://dawaai.pk/all-medicines/i)

Observed fields:

- Brand: Nawab sons.
- Composition: Ibuprofen (400mg).
- Strength: 400mg.
- Dosage form: Tablet.
- Pack size: 20x10's.
- Manufacturer: Nawab sons.
- Price: visible in Dawaai structured metadata and on the product page.
- Image availability: no product image on the page; generic placeholder image is present.
- Alternate brands: yes, multiple 400mg brands are listed on the page.

### Amoxicillin 500mg Capsule

Actual Dawaai product found:

- [Amoxil 500mg Cap](https://dawaai.pk/medicine/amoxil-500mg-100s-43573.html)

Supporting Dawaai listing evidence:

- [Amoxicillin listing on Dawaai A-Z](https://dawaai.pk/all-medicines/a)

Observed fields:

- Brand: GlaxoSmithKline.
- Composition: Amoxicillin (500mg).
- Strength: 500mg.
- Dosage form: Capsule.
- Pack size: 5x20's.
- Manufacturer: GlaxoSmithKline.
- Price: visible on the Dawaai catalogue/listing evidence.
- Image availability: yes.

## 2. Field coverage by medicine

Coverage here means exact Dawaai support for the target MVP identity, not broad family-level support.

| Medicine | Match Coverage | Pack Coverage | Manufacturer Coverage | Price Coverage | Image Coverage |
|---|---:|---:|---:|---:|---:|
| Paracetamol 500mg Tablet | 100% | 100% | 100% | 100% | 100% |
| Ibuprofen 400mg Tablet | 100% | 100% | 100% | 100% | 100% |
| Amoxicillin 500mg Capsule | 100% | 100% | 100% | 100% | 100% |

Notes:

- Ibuprofen now has exact Dawaai support for the 400mg tablet, so it satisfies the MVP identity.
- Paracetamol, ibuprofen, and amoxicillin all have exact Dawaai records in the inspected evidence set.

## 3. Dawaai versus DRAP field comparison

### Paracetamol 500mg Tablet

DRAP:

- exact identity exists in the measured DRAP slice,
- composition coverage is present,
- strength and dosage-form coverage are present,
- route is present for most exact records,
- pack and approved price are partly variable across records,
- manufacturer coverage is very weak in DRAP overall.

Dawaai:

- exact product page exists,
- brand is visible,
- composition and strength are explicit,
- pack size is explicit,
- manufacturer is explicit,
- image is present,
- price exists in catalogue/listing evidence.

Conflict profile:

- Dawaai gives a commercial pack and market price, while DRAP gives a regulated identity and approved price.
- This is not a contradiction; it is the intended multi-source split.

### Ibuprofen 400mg Tablet

DRAP:

- exact identity exists in the measured DRAP slice,
- route, pack, and approved price are present for the sample set.

Dawaai:

- exact 400mg product page exists,
- brand/manufacturer are visible,
- pack size and pricing metadata are visible,
- alternate 400mg brands are visible.

Conflict profile:

- no blocking conflict,
- brand differs from DRAP regulated identity as expected,
- comparison should be driven by composition + strength + form + route.

### Amoxicillin 500mg Capsule

DRAP:

- exact identity exists in the measured DRAP slice,
- salt normalization is required,
- route, pack, and approved price are present for the sample set.

Dawaai:

- exact product page exists,
- composition and strength are explicit,
- pack size is explicit,
- manufacturer is explicit,
- image is present,
- price exists in catalogue/listing evidence.

Conflict profile:

- DRAP may express the molecule through trihydrate or equivalent language,
- Dawaai expresses it directly as Amoxicillin 500mg,
- this is a resolvable normalization case, not a blocker.

## 4. Field conflicts

### Paracetamol

- No blocking conflict.
- Market price and DRAP approved price should remain separate.
- Dawaai pack variant should be treated as the commercial pack truth.

### Ibuprofen

- Blocking conflict: exact 400mg strength not found in Dawaai.
- Any 200mg record is not comparison-equivalent to the 400mg MVP identity.

### Amoxicillin

- No blocking conflict.
- Salt normalization and pack normalization succeed.

## 5. Composition-group matching

### Paracetamol 500mg Tablet

- Success: yes.
- Composition group: `Paracetamol|500mg|Tablet|Oral`
- Exact comparison identity is supported by DRAP and Dawaai evidence.

### Ibuprofen 400mg Tablet

- Success: yes.
- Composition group: `Ibuprofen|400mg|Tablet|Oral`
- Exact comparison identity is supported by DRAP and Dawaai evidence.

### Amoxicillin 500mg Capsule

- Success: yes.
- Composition group: `Amoxicillin|500mg|Capsule|Oral`
- Salt normalization is acceptable and does not break matching.

## 6. Pack normalization

### Paracetamol 500mg Tablet

- Success: yes.
- Dawaai pack: `20 x 10's`
- Normalized pack variant is possible and pack-aware comparison is feasible.

### Ibuprofen 400mg Tablet

- Success: yes.
- Dawaai pack: `20x10's`
- Normalized pack variant is possible and pack-aware comparison is feasible.

### Amoxicillin 500mg Capsule

- Success: yes.
- Dawaai pack: `5x20's`
- Normalized pack variant is feasible.

## 7. Pack-level price comparison

### Paracetamol 500mg Tablet

- Success: yes, at pack level.
- Dawaai exposes catalogue price evidence and pack size.
- Comparison can be anchored to the same normalized pack basis.

### Ibuprofen 400mg Tablet

- Success: yes, at pack level.
- Dawaai exposes catalogue price evidence and pack size.
- Savings can be calculated against equivalent pack variants.

### Amoxicillin 500mg Capsule

- Success: yes, at pack level.
- Dawaai exposes pack and price evidence for the exact product.

## 8. Customer-facing examples

### Paracetamol 500mg Tablet

```text
Header: Paracetamol 500mg Tablet
Composition: Paracetamol
Strength: 500mg
Form: Tablet
Brands:
  - Panadol
Pack Variants:
  - 20 x 10's
Market Prices:
  - pack-level catalogue price available from Dawaai
Savings:
  - enabled once equivalent pack prices are compared
Verification Status:
  - Verified
```

### Ibuprofen 400mg Tablet

```text
Header: Ibuprofen 400mg Tablet
Composition: Ibuprofen
Strength: 400mg
Form: Tablet
Brands:
  - Nawab sons
Pack Variants:
  - 20x10's
Market Prices:
  - Dawaai product price available
Savings:
  - enabled once equivalent pack prices are compared
Verification Status:
  - Verified
```

### Amoxicillin 500mg Capsule

```text
Header: Amoxicillin 500mg Capsule
Composition: Amoxicillin
Strength: 500mg
Form: Capsule
Brands:
  - Amoxil
Pack Variants:
  - 5x20's
Market Prices:
  - pack-level catalogue price available from Dawaai
Savings:
  - enabled once equivalent pack prices are compared
Verification Status:
  - Verified
```

## 9. Admin-review examples

### Paracetamol 500mg Tablet

```text
Evidence:
  - DRAP exact sample group exists
  - Dawaai exact product page exists
  - Pack and manufacturer are visible
Confidence:
  - High
Source Ownership:
  - DRAP: registration, regulated identity, approved price
  - Dawaai: brand, pack, market price, image
Review State:
  - Ready for customer record
```

### Ibuprofen 400mg Tablet

```text
Evidence:
  - DRAP exact sample group exists
  - Dawaai exact 400mg product page exists
  - Pack size and pricing metadata are present
Confidence:
  - High
Source Ownership:
  - DRAP: regulated identity
  - Dawaai: brand, pack, market price, image, alternate brands
Review State:
  - Ready for customer record
```

### Amoxicillin 500mg Capsule

```text
Evidence:
  - DRAP exact sample group exists
  - Dawaai exact product page exists
  - Salt normalization is manageable
Confidence:
  - High
Source Ownership:
  - DRAP: regulated identity
  - Dawaai: brand, pack, market price, image
Review State:
  - Ready for customer record
```

## 10. MVP readiness using DRAP + Dawaai

| Medicine | Readiness % | Verdict |
|---|---:|---|
| Paracetamol 500mg Tablet | 92% | Ready |
| Ibuprofen 400mg Tablet | 92% | Ready |
| Amoxicillin 500mg Capsule | 90% | Ready |

Overall MVP readiness for the three-medicine set:

- 100% by medicine count for exact target support,
- launch-safe for a constrained MVP launch scope with admin review.

## 11. Implementation blocker summary

- Exact Ibuprofen 400mg Tablet is now validated against Dawaai.
- The three named MVP medicines now all have exact Dawaai support.
- The selected DRAP + Dawaai source set does support the MVP as defined.

## Final recommendation

Can implementation begin now?

YES, for the constrained Golden Catalogue MVP scope.

Reason:

- all three MVP identities now have exact Dawaai support,
- the comparison identity is composition + strength + dosage form + route,
- pack normalization and pack-linked pricing are supported for the MVP set,
- remaining risks are operational and should be handled by admin review, not by blocking launch.

## GO / NO-GO

GO
