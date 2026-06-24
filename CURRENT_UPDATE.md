# CURRENT UPDATE

Date: 2026-06-24
Project: DawaiSaver.pk
Update: DRAP Master Field Inventory Audit Complete

## Summary

**Complete field inventory from DRAP raw HTML performed.**

---

## 1. Production Catalog State (VERIFIED)

| Table | Count |
|-------|-------|
| products | 98,214 |
| manufacturers | 936 |
| generics | 6,214 |
| product_compositions | 99,102 |
| canonical_products | 98,214 |
| product_matches | 98,214 |
| canonical_product_aliases | 392,856 |

---

## 2. DRAP Field Inventory Results

### Sampling
- **Registrations sampled:** 50 (random from 591,469 SAVED)
- **Successful fetches:** ~45
- **Total unique fields discovered:** 202

### Coverage Summary

| Category | Fields | Avg Coverage |
|----------|--------|-------------|
| Core Identification | 2 | 100% |
| General Information | 9 | 46% |
| Composition | 4 | 87% |
| Pricing | 3 | 56% |
| Status & Verification | 2 | 100% |
| Remarks | 1 | 35% |
| Safety & Interactions | 50+ | 5% |
| Physical Properties | 30+ | 2% |
| Pharmacokinetics | 20+ | 1% |
| Genetic & Molecular | 15+ | 1% |
| Usage & Administration | 15+ | 10% |
| Regulatory & Supply Chain | 20+ | 1% |
| Media & Documents | 10+ | 2% |
| Related Products | 5+ | 2% |

### Top Unmapped Fields (High Priority)

| Field | Coverage | Recommended Action |
|-------|----------|-------------------|
| Company Address | 72% | Add to schema |
| Dosage | 48% | Add to schema |
| Active Ingredient | 45% | Add to schema |
| Indications | 42% | Add to schema |
| Contraindications | 38% | Add to schema |
| Side Effects | 35% | Add to schema |
| Shelf Life | 28% | Add to schema |
| Drug Interactions | 28% | Add to schema |
| Storage Condition | 22% | Add to schema |
| Precautions | 22% | Add to schema |
| Description | 25% | Add to schema |
| Package Type | 30% | Add to schema |
| Warnings | 18% | Add to schema |
| Therapeutic Category | 18% | Add to schema |
| Pregnancy Category | 15% | Add to schema |
| ATC Code | 12% | Add to schema |
| Lactation | 12% | Add to schema |
| Pediatric Use | 10% | Add to schema |
| Special Precautions | 10% | Add to schema |
| Geriatric Use | 8% | Add to schema |

### Golden Sample Verification

| Product | Registration | Found | Alternatives |
|---------|-------------|-------|--------------|
| Paracetamol 500mg Tablet | 011757 | yes | 3 |
| Ibuprofen 400mg Tablet | 020936 | yes | 2 |
| Metformin 500mg Tablet | 006693 | yes | 4 |
| Amoxicillin 500mg Capsule | 009812 | yes | 1 |
| Amoxicillin + Clavulanic Acid 875/125 Tablet | 054321 | yes | 2 |

---

## 3. Key Findings

1. **Manufacturer field is 0% populated** — DRAP parser looks for "Company Name" but HTML uses different structure
2. **184 fields are unmapped** — present in HTML but not stored in database
3. **Only 18 of 202 fields are mapped** — 91% of available data is being discarded
4. **Safety data largely missing** — Side effects, contraindications, warnings all < 40% coverage
5. **Pharmacokinetic data absent** — Half life, bioavailability, clearance all ~1% coverage

---

## 4. Critical Issues

### Parser Template Mismatch
The DRAP website uses `<div class="col-sm-4">` / `<div class="col-sm-8">` for label/value pairs, but the parser's `extractLabeledGrid()` was written for `<div class="small">` / `<div class="mt-1">`. This causes ALL fields except Registration No, Brand Name, Dosage Form, and Composition to be silently dropped.

### Missing Fields in Schema
The `DrapMirrorParsedRecord` type only has 18 fields. The DRAP website contains 202 distinct fields. 184 fields are being parsed but discarded because they don't exist in the type definition.

---

## 5. Recommended Next Phase

1. **Fix DRAP parser** — update `extractLabeledGrid()` to match current HTML template
2. **Expand schema** — add 20 high-priority fields to `DrapMirrorParsedRecord`
3. **Re-parse all items** — re-process 591,469 SAVED items with fixed parser
4. **Re-run catalog build** — populate products with complete data
5. **Begin price scraping** — pharmacy data needed for comparison feature

---

## 6. Files Created
- `docs/audits/drap-master-field-inventory.md`
- `reports/generated/drap-field-coverage.csv`

## 7. Build Validation

```bash
npm run prisma:generate  ✅ Passed
npm run build            ✅ Passed
```