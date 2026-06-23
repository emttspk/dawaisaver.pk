# DawaiSaver Golden Catalogue Feasibility Investigation

Date: 2026-06-23

Sources used:

- `diagnostics/catalogue-architecture-audit.md`
- `diagnostics/catalogue-refactor-plan.md` from the prior planning discussion
- `diagnostics/data-readiness-audit.md`
- `diagnostics/molecule-normalization-investigation.md`

Scope:

- DRAP data only.
- WHO enrichment ignored.
- Findings only.
- No implementation, schema, migration, build, commit, or push activity.

## Executive finding

The DRAP corpus can support a constrained, manually validated golden catalogue for the five named medicines at the identity level, but it cannot yet support a safe customer-facing release as a complete Golden Catalogue.

The main reason is not molecule identity alone. The blockers are the missing or incomplete commercial and regulatory fields needed to make the customer experience trustworthy:

- manufacturer coverage is critically low overall,
- pack size is missing or not reliably normalizable for a large share of products,
- approved price is only partly structured,
- route and strength are missing for many records,
- metformin needs release-type separation,
- amoxicillin/clavulanate needs deterministic combination handling,
- savings cannot be treated as marketplace savings because DRAP does not provide market prices.

The short answer is:

NO, not for a production customer-facing Golden Catalogue yet.

It is feasible only as a limited shadow or manual-review catalogue.

## Evidence summary

From the DRAP readiness audit:

- 9,399 valid products were measured in the raw HTML slice.
- 5,527 had usable composition.
- 5,524 had usable strength.
- 9,140 had dosage form.
- 5,248 had route.
- 5,439 had pack size.
- 5,439 had approved price.
- 175 had manufacturer.
- 7,857 had registration date.

From the sample feasibility table in the readiness audit:

- Paracetamol 500mg Tablet: 14 exact products, 13 with route, 14 with pack, 12 with numeric approved price.
- Ibuprofen 400mg Tablet: 4 exact products, 4 with route, 4 with pack, 4 with numeric approved price.
- Metformin 500mg Tablet: 9 exact products, 8 with route, 9 with pack, 9 with numeric approved price, but release type needs separation.
- Amoxicillin 500mg Capsule: 3 exact products, 3 with route, 3 with pack, 3 with numeric approved price.
- Amoxicillin + Clavulanic Acid 875mg/125mg Tablet: 2 exact products, 2 with route, 1 with pack, 1 with numeric approved price.

From the molecule normalization investigation:

- DRAP molecule normalization is feasible with conservative rules.
- Exact and spelling normalization are safe.
- Salt and hydrate normalization need curated rules.
- Ester and broad-molecule cases require manual review.
- Combination products must be handled at composition-row level, not as a single molecule.

From the architecture audit:

- Comparison should be based on composition + strength + dosage form + route.
- Brand must not be the comparison identity.
- Pack-aware pricing is not active in the current customer flow.
- Product-level and canonical-product-level identity models still conflict with the target model.

## 1. Field inventory by sample

Status legend:

- Available: directly evidenced in the DRAP sample set.
- Partial: present for some records or present but not consistently safe.
- Derivable: can be inferred from other source fields or normalization, but not guaranteed.
- Missing: not reliably available for customer use.

### Paracetamol 500mg Tablet

| Field | Status | Evidence |
|---|---|---|
| Registration Number | Available | DRAP registration identity exists for the sample set. |
| Brand | Available | 14 exact products in the measured slice. |
| Composition | Available | Single-ingredient paracetamol group is present. |
| Strength | Available | 500mg identity is present in the group. |
| Dosage Form | Available | Tablet identity is present. |
| Route | Partial | 13 of 14 exact products had route. |
| Pack Size | Available | 14 of 14 exact products had pack size, but not every pack is equally clean. |
| Approved Price | Partial | 12 of 14 exact products had numeric approved price. |
| Manufacturer | Partial | Manufacturer coverage is critically low overall in DRAP. |
| Registration Date | Partial | Present overall in DRAP, but not sample-quantified in the diagnostics. |

### Ibuprofen 400mg Tablet

| Field | Status | Evidence |
|---|---|---|
| Registration Number | Available | DRAP registration identity exists for the sample set. |
| Brand | Available | 4 exact products in the measured slice. |
| Composition | Available | Ibuprofen identity is present. |
| Strength | Available | 400mg identity is present. |
| Dosage Form | Available | Tablet identity is present. |
| Route | Available | 4 of 4 exact products had route. |
| Pack Size | Available | 4 of 4 exact products had pack size. |
| Approved Price | Available | 4 of 4 exact products had numeric approved price. |
| Manufacturer | Partial | Manufacturer coverage is critically low overall in DRAP. |
| Registration Date | Partial | Present overall in DRAP, but not sample-quantified in the diagnostics. |

### Metformin 500mg Tablet

| Field | Status | Evidence |
|---|---|---|
| Registration Number | Available | DRAP registration identity exists for the sample set. |
| Brand | Available | 9 exact products in the measured slice. |
| Composition | Available | Metformin identity is present, but release types differ. |
| Strength | Available | 500mg identity is present. |
| Dosage Form | Available | Tablet identity is present. |
| Route | Partial | 8 of 9 exact products had route. |
| Pack Size | Available | 9 of 9 exact products had pack size. |
| Approved Price | Available | 9 of 9 exact products had numeric approved price. |
| Manufacturer | Partial | Manufacturer coverage is critically low overall in DRAP. |
| Registration Date | Partial | Present overall in DRAP, but not sample-quantified in the diagnostics. |

Critical note:

- Metformin cannot be launched as one undifferentiated group unless immediate-release, extended-release, and other release types remain separated.

### Amoxicillin 500mg Capsule

| Field | Status | Evidence |
|---|---|---|
| Registration Number | Available | DRAP registration identity exists for the sample set. |
| Brand | Available | 3 exact products in the measured slice. |
| Composition | Available | Amoxicillin identity is present. |
| Strength | Available | 500mg identity is present after salt normalization. |
| Dosage Form | Available | Capsule identity is present. |
| Route | Available | 3 of 3 exact products had route. |
| Pack Size | Available | 3 of 3 exact products had pack size. |
| Approved Price | Available | 3 of 3 exact products had numeric approved price. |
| Manufacturer | Partial | Manufacturer coverage is critically low overall in DRAP. |
| Registration Date | Partial | Present overall in DRAP, but not sample-quantified in the diagnostics. |

### Amoxicillin + Clavulanic Acid 875mg/125mg Tablet

| Field | Status | Evidence |
|---|---|---|
| Registration Number | Available | DRAP registration identity exists for the sample set. |
| Brand | Available | 2 exact products in the measured slice. |
| Composition | Available | Combination identity is present and must remain split by ingredient. |
| Strength | Available | 875mg and 125mg strengths are present as a paired identity. |
| Dosage Form | Available | Tablet identity is present. |
| Route | Available | 2 of 2 exact products had route. |
| Pack Size | Partial | Only 1 of 2 exact products had pack size. |
| Approved Price | Partial | Only 1 of 2 exact products had numeric approved price. |
| Manufacturer | Partial | Manufacturer coverage is critically low overall in DRAP. |
| Registration Date | Partial | Present overall in DRAP, but not sample-quantified in the diagnostics. |

Critical note:

- Source order must normalize deterministically so reversed ingredient order does not split the group.

## 2. What is missing

Across the five samples, the recurring missing or weak fields are:

- Manufacturer
- Registration Date at sample certainty level
- Pack Size for the combination sample
- Approved Price for some sample records
- Route for some sample records
- Release type for metformin

The broader catalogue gaps are worse than the five sample set:

- manufacturer coverage is only 1.86% in the measured slice,
- route coverage is 55.84%,
- composition coverage is 58.80%,
- strength coverage is 58.77%,
- pack size coverage is 57.87%,
- approved price coverage is 57.87%.

## 3. Can the missing fields be derived?

### Derivable with reasonable confidence

- Brand to composition resolution for known branded products, when the source row has enough generic text.
- Composition identity from canonical molecule normalization plus composition-row splitting.
- Strength normalization for the common single-strength cases.
- Dosage form normalization for the common tablet/capsule/injection families.
- Route normalization where the DRAP text is explicit.
- Pack normalization for common expressions such as `10's`, `14's`, `60ml`, and `1x10's`.

### Partially derivable

- Manufacturer can sometimes be normalized from variant spellings, but the source coverage is too low for a release-grade guarantee.
- Approved price can be carried forward when the DRAP page gives a numeric approved price, but textual entries like `As per SRO` are not a stable customer price basis.
- Registration date can be carried forward when present in source detail pages, but it is not yet a consistently projected catalogue field.

### Not safely derivable

- A clean customer savings figure from DRAP alone, because the DRAP corpus does not provide comparable market prices.
- Metformin release-type equivalence without explicit release handling.
- Pack-equivalent comparison when pack size is missing or ambiguous.
- A safe comparison for any row where route, strength, or form is incomplete.

## 4. Can comparison be generated using DRAP only?

### Short answer

Yes for a narrow, manually validated subset.
No for a broad customer-facing Golden Catalogue release.

### Why comparison is partially possible

The architecture and normalization audits show that comparison can be keyed by:

- composition,
- strength,
- dosage form,
- route.

The golden samples prove that the five target identities do exist in DRAP data, and the data readiness audit shows each one has at least some comparable product records.

### Why comparison is not production-safe yet

- The current runtime still mixes brand-led and product-led identity paths.
- Route is missing on many products outside the sample set.
- Metformin needs release separation.
- Amoxicillin + clavulanic acid needs deterministic combination handling.
- Pack-aware comparison is not available consistently.

### Sample verdicts

- Paracetamol 500mg Tablet: comparison possible with review.
- Ibuprofen 400mg Tablet: comparison possible.
- Metformin 500mg Tablet: comparison possible only if release type is split first.
- Amoxicillin 500mg Capsule: comparison possible after salt normalization.
- Amoxicillin + Clavulanic Acid 875mg/125mg Tablet: comparison possible if combination ordering and strength pairing are normalized.

## 5. Can savings be generated using DRAP approved prices only?

### Short answer

Only as an approved-price delta, not as a true customer savings engine.

### Findings

DRAP approved price can support a limited internal comparison among records that share the same normalized identity and a comparable pack basis.

It cannot yet support a reliable customer savings claim because:

- approved prices are not available for every record,
- some approved-price values are textual rather than numeric,
- prices are not attached to pack variants in the active customer flow,
- DRAP approved prices are not marketplace prices,
- equivalent pack content is not always normalized.

### Sample verdicts

- Paracetamol 500mg Tablet: possible only for subset records with numeric approved price and matched pack content.
- Ibuprofen 400mg Tablet: the best candidate for approved-price-only savings.
- Metformin 500mg Tablet: possible only after release-type separation.
- Amoxicillin 500mg Capsule: possible for exact comparable pack records.
- Amoxicillin + Clavulanic Acid 875mg/125mg Tablet: only partially possible because one record lacks pack and one lacks numeric approved price.

## 6. Proposed customer UI for each sample

The target UI should use the composition identity as the header, not the brand.

### Shared layout

Header:

- `Composition + Strength + Dosage Form`

Sections:

- Composition
- Therapeutic category
- Available brands
- Pack sizes
- Price comparison
- Savings analysis
- Regulatory information

### Paracetamol 500mg Tablet

Wireframe notes:

- Header: `Paracetamol 500mg Tablet`
- Brand list should show Panadol, Calpol, and other verified brands.
- The comparison block should exclude 650mg, syrup, injection, and non-oral forms.
- Regulatory block should surface registration number and date if available.
- Savings block should be labeled as DRAP approved-price comparison, not marketplace savings.

### Ibuprofen 400mg Tablet

Wireframe notes:

- Header: `Ibuprofen 400mg Tablet`
- Small but clean brand set.
- Comparison list should show exact oral 400mg tablet matches only.
- This is the cleanest of the five for an MVP comparison screen.

### Metformin 500mg Tablet

Wireframe notes:

- Header should include a release chip, such as `Immediate Release`, `Extended Release`, or `Modified Release`.
- The UI must not merge release types into one comparison group.
- If release type is unavailable, the record should fall back to review rather than showing an unsafe comparison.

### Amoxicillin 500mg Capsule

Wireframe notes:

- Header: `Amoxicillin 500mg Capsule`
- Show salt-normalized equivalence evidence if the source uses trihydrate or similar forms.
- Comparison list should exclude tablets, injections, and suspensions.

### Amoxicillin + Clavulanic Acid 875mg/125mg Tablet

Wireframe notes:

- Header: `Amoxicillin + Clavulanic Acid 875mg/125mg Tablet`
- Render both ingredients explicitly in the composition section.
- Preserve deterministic ingredient order.
- Show two strength tokens, not one merged strength label.
- Comparison should exclude 500mg/125mg and 625mg shorthand products unless the composition is proven equivalent.

## 7. Proposed API response shape

The API should expose one canonical payload per composition group, with brand products and pack variants nested under it.

### Shared response structure

```json
{
  "query": "Paracetamol 500mg Tablet",
  "resolvedIdentity": {
    "compositionGroup": "paracetamol",
    "strength": "500mg",
    "dosageForm": "tablet",
    "route": "oral"
  },
  "therapeuticCategory": "Analgesic/Antipyretic",
  "brands": [
    {
      "brandName": "Panadol",
      "manufacturer": "Example Pharma",
      "registrationNumber": "DRAP-xxxx",
      "registrationDate": "YYYY-MM-DD",
      "regulatoryStatus": "Registered",
      "packs": [
        {
          "packSize": "10 tablets",
          "approvedPrice": 95,
          "priceBasis": "DRAP approved price",
          "unitPrice": 9.5
        }
      ]
    }
  ],
  "comparison": {
    "currentBrand": "Panadol",
    "cheapestEquivalentBrand": "Febrol",
    "cheapestEquivalentPrice": 68,
    "saving": 27,
    "savingPercent": 28
  },
  "warnings": [
    "DRAP approved price only",
    "Manufacturer missing for some variants"
  ]
}
```

### Sample-specific API notes

Paracetamol:

- Include a warning when route or manufacturer is missing for some variants.

Ibuprofen:

- Can return a clean comparison payload when packs are aligned.

Metformin:

- Response must include a release-type field.

Amoxicillin:

- Response should include a salt-normalization note where the source text differs from canonical naming.

Amoxicillin + Clavulanic Acid:

- Response should expose both ingredient strengths separately.

## 8. Wireframe specification

The customer screen should read like a clinical comparison card, not a retail product page.

### Top band

- Canonical composition identity.
- Route chip.
- Release chip if applicable.
- Regulatory badge.

### Middle band

- Composition summary.
- Therapeutic category.
- Available brands.
- Brand cards with manufacturer and registration number.

### Lower band

- Pack cards.
- Approved-price comparison.
- Savings summary.
- Any missing-data warnings.

### Mobile behavior

- Keep the identity header pinned.
- Collapse brand cards into expandable rows.
- Show one pack card at a time by default.

### Desktop behavior

- Compare brands in a table.
- Place pack size and approved price in the same row.
- Highlight the cheapest equivalent pack.

## 9. Blockers preventing production release

- Manufacturer data is critically incomplete.
- Pack size is not reliable enough for all customer-visible records.
- Approved price is not uniformly numeric and pack-linked.
- Route is incomplete on many records.
- Metformin needs release separation.
- Combination products need deterministic ingredient-order normalization.
- Savings cannot be called marketplace savings without market prices.
- The current architecture still has brand-led and product-led identity paths competing with the target model.

## 10. Estimated percentage currently supportable

Two different estimates matter.

### Catalogue identity support

The five golden identities are present in the DRAP corpus in some form.

That means the identity layer is broadly supportable for the sample set.

### Customer-facing release support

For a production customer-facing launch, the current supportable share is much lower.

The best evidence-based estimate is:

- about 30% overall readiness for the broader DRAP catalogue,
- about 60% of the five-sample golden experience can be shown safely with manual validation,
- about 20.1% of DRAP products fall into theoretical approved-price comparison cells,
- about 0% of the full marketplace savings experience is ready from DRAP alone.

## Final answer

Can DawaiSaver launch a limited Golden Catalogue using DRAP data only?

NO.

Evidence:

- the five target identities exist, but not all of the required customer-facing fields are complete or stable,
- manufacturer coverage is critically low,
- pack and price handling are not reliable enough for every sample,
- metformin release type is unresolved,
- amoxicillin + clavulanic acid still needs deterministic combination handling,
- DRAP approved prices are not enough to support a true savings engine,
- the current architecture still does not fully center customer comparison on one authoritative composition-group identity.

The correct next step is a shadow or manually validated golden catalogue, not a customer-facing production launch.
