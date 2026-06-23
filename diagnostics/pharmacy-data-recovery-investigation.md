# DawaiSaver Pharmacy Data Recovery Investigation

Date: 2026-06-23

Sources used:

- `diagnostics/data-readiness-audit.md`
- `diagnostics/molecule-normalization-investigation.md`
- `diagnostics/golden-catalogue-feasibility.md`
- `diagnostics/multi-source-data-architecture.md`

External source evidence inspected:

- [Dawaai home](https://dawaai.pk/)
- [Dawaai medicines A-Z](https://dawaai.pk/all-medicines/a)
- [Dawaai product page](https://dawaai.pk/medicine/arnil-1-34352.html)
- [DVAGO home](https://www.dvago.pk/)
- [DVAGO Panadol product page](https://www.dvago.pk/p/panadol-500mg-tablets)
- [Sehat home](https://www.sehat.com.pk/)
- [Servaid home](https://www.servaid.com.pk/)
- [Servaid product page](https://www.servaid.com.pk/product/enfamil-a2-baby-milk-800-gms-700272)

Scope:

- Investigation only.
- No implementation, code changes, schema changes, migrations, commits, builds, or pushes.
- Focused on Pakistan pharmacy ecosystem.

## Executive finding

Yes, pharmacy and distributor data can realistically recover enough of the missing DRAP catalogue fields to support a customer-facing catalogue.

The recovery is strong for the commercial fields DawaiSaver currently lacks:

- manufacturer,
- pack size,
- market price,
- availability,
- product images.

It is also useful for validating dosage form and strength, but it should not replace DRAP for regulated identity fields such as registration number, registration status, and approved price.

The best long-term model is:

`DRAP` -> regulated identity

`Pharmacy` / `Distributor` -> pack, image, availability, market price, and commercial completeness

`OCR` / customer submissions -> evidence and gap-filling only

## 1. Top online pharmacy sources

The most evidence-backed Pakistan catalogue sources inspected for this investigation are:

| Source | What it clearly exposes | Strengths | Gaps |
|---|---|---|---|
| Dawaai | Brand, generic/composition text, pack size, manufacturer, price, product image, alternate brand suggestions | Strong catalogue pages and medicine detail pages; pack and price visible on listings; composition shown on detail pages | Images are not universal; some records are placeholder-heavy; explicit free-text search was not obvious in the static crawl, though A-Z browsing is strong |
| DVAGO | Brand, strength, pack size, price, product image, medicine search entry point | Explicit medicine search UI; product cards and product pages show pack + price; product images are visible | Manufacturer was not visible in the captured Panadol page; detail pages are more retail than regulatory |
| Sehat | Brand, manufacturer, pack size, price, product image | Product cards show manufacturer and price; filterable by manufacturer; strong commercial catalogue shape | Explicit free-text search was not visible in the extracted HTML; product discovery looked filter-driven in the crawl |
| Servaid | Brand/product name, manufacturer, pack size, price, product image | Product pages show manufacturer and pack price; home page shows trending search and category discovery | Medicine metadata is uneven across captured pages; search in the crawl was more browse/trending oriented |

Adjacent source found but not scored:

- DawaAsaan was reachable as a JS app shell only in this crawl, so it was not used as a scored evidence source.

## 2. Field availability by source

### Dawaai

- Brand availability: Yes.
- Generic availability: Yes, through composition text on detail pages.
- Manufacturer availability: Yes, on listings and product pages.
- Pack size availability: Yes.
- Market price availability: Yes.
- Product image availability: Yes, though some records show `no image`.
- Search capability: Strong browse capability via A-Z medicine catalogue; explicit search box was not confirmed in the captured text.

### DVAGO

- Brand availability: Yes.
- Generic availability: Partial, usually embedded in product titles and detail pages.
- Manufacturer availability: Partial, not visible in the Panadol capture used here.
- Pack size availability: Yes.
- Market price availability: Yes.
- Product image availability: Yes.
- Search capability: Yes, explicit medicine search entry is visible on the home page.

### Sehat

- Brand availability: Yes.
- Generic availability: Partial, mostly inferred from product title structure and catalog context.
- Manufacturer availability: Yes.
- Pack size availability: Yes.
- Market price availability: Yes.
- Product image availability: Yes.
- Search capability: Partial in the captured HTML, but filtering and catalog browsing are clearly present.

### Servaid

- Brand availability: Yes.
- Generic availability: Partial, mostly inferred from title/product description.
- Manufacturer availability: Yes.
- Pack size availability: Yes.
- Market price availability: Yes.
- Product image availability: Yes.
- Search capability: Partial in the crawl, with trending search and category navigation visible.

## 3. Field recovery matrix

Estimates below are for recovering missing DRAP catalogue fields by combining pharmacy and distributor data, not by relying on pharmacy data alone.

| Field | Recovery % | Confidence % | Difficulty | Notes |
|---|---:|---:|---|---|
| Manufacturer | 70-85% | 65-80% | High | Often present on Dawaai/Sehat/Servaid product pages and sometimes on packaging; still incomplete for obscure brands and poorly attributed products. |
| Pack Size | 90-96% | 85-93% | Medium | Strongly visible on Dawaai, DVAGO, Sehat, and Servaid; packaging images help validate ambiguous pack text. |
| Market Price | 95-99% | 90-97% | Low | Pharmacy sites are good price sources; this is the easiest commercial field to recover. |
| Availability | 95-99% | 88-96% | Low | Pharmacy stock and `Add to Cart` signals are usually available, but freshness decays quickly. |
| Product Images | 90-98% | 85-95% | Low | Most catalogue sources expose product images; some items still use placeholders. |
| Dosage Form | 95-99% | 92-97% | Low | Usually recoverable from title, category, or product page. |
| Strength | 92-98% | 90-96% | Low-Medium | Usually recoverable from title and pack card text; harder for combinations, liquids, and release-modified items. |

## 4. Matching feasibility

### Can pharmacy products be matched to Composition + Strength + Dosage Form using current normalization rules?

Yes, for the majority of mainstream medicines.

Why this is feasible:

- Dawaai product pages explicitly show brand, strength, dosage form, pack size, and composition text.
- DVAGO product cards show medicine name, strength, pack size, and price.
- Sehat product cards show medicine name, pack size, manufacturer, and price.
- Servaid product pages show product name, manufacturer, and pack price.
- The molecule normalization investigation showed that exact, spelling, salt, and hydrate normalization can cover most of the observed DRAP molecule variants, while combination products remain manageable if handled at composition-row level.

What still needs review:

- release-modified metformin,
- multi-ingredient combinations,
- salt-sensitive products,
- broad molecules such as insulin, vitamins, and biologics,
- ambiguous pack text,
- OCR-only extractions with low image quality.

### Practical matching estimate

- Standard oral solids: 85-95% matchable with current normalization plus review.
- Liquids and injectables: 75-90% matchable.
- Combination products: 70-85% matchable if ingredient splitting is preserved.
- Broad molecules / biologics / vaccines: not safely auto-matchable.

## 5. Pricing feasibility

### Can market prices be collected consistently?

Yes, mostly.

The inspected sources consistently expose price on product cards or product pages:

- Dawaai shows prices on medicine lists and detail pages.
- DVAGO shows prices on product cards and product pages.
- Sehat shows sale and regular prices on featured product cards.
- Servaid shows pack prices on product pages and related product lists.

### Can pack-level prices be collected?

Yes, usually.

Pack-level price is especially feasible when:

- the pack size is part of the product title,
- the product page shows a pack-specific price,
- the listing has a distinct pack variant,
- OCR or packaging images confirm the package count.

Practical estimate:

- pack-level price recovery from pharmacy/distributor sources: 85-95% for commonly listed products,
- confidence: 85-95%,
- hardest cases: bundle packs, ambiguous `1's` / `1 pack` entries, and products with only unit price but no explicit pack text.

### Pricing conclusion

Customer-facing market price is realistically recoverable.

DRAP approved price should still remain a separate regulated field, but it is not sufficient on its own for customer-facing savings.

## 6. Image feasibility

Yes, packaging images are highly useful for validating:

- pack size,
- manufacturer,
- brand.

Observed behavior in the sources:

- Dawaai and DVAGO expose product images for many items.
- Sehat product cards include image thumbnails.
- Servaid product pages and product cards also expose images.

What images can validate well:

- brand logo or brand naming,
- pack count,
- dosage form packaging,
- manufacturer or marketer name when printed clearly.

What images cannot always validate:

- registration number,
- approved price,
- exact route,
- every salt or hydrate variant,
- small-print strength on poor-quality images.

Practical estimate:

- image-assisted pack validation: 85-95%,
- image-assisted manufacturer validation: 60-80%,
- image-assisted brand validation: 90-98%.

## 7. Manufacturer recovery

Can manufacturer data be reconstructed from pharmacy sites, distributor catalogues, and packaging?

Yes, but not perfectly.

Most likely recovery path:

1. Use the explicit manufacturer field when the site exposes it.
2. Use distributor catalogue data when pharmacy data is missing.
3. Use product packaging images as corroborating evidence.
4. Keep uncertain cases for review rather than guessing.

Observed evidence:

- Dawaai listing pages show manufacturer names under products.
- Sehat product cards show manufacturer names.
- Servaid product pages show manufacturer names.
- DVAGO is strong on commerce data but did not expose manufacturer clearly in the captured Panadol page.

Estimated manufacturer recovery:

- from pharmacy sources alone: 55-75%,
- with distributor catalogues added: 70-85%,
- with packaging image verification: confidence improves, but some uncertainty remains.

Manufacturer should therefore be treated as:

- recoverable,
- but not fully authoritative outside DRAP/distributor evidence,
- and always evidence-linked.

## 8. Field recovery matrix with implementation difficulty

| Field | Best recovery source mix | Recovery % | Confidence % | Difficulty |
|---|---|---:|---:|---|
| Manufacturer | Pharmacy + distributor + packaging images | 70-85% | 65-80% | High |
| Pack Size | Pharmacy + distributor + images | 90-96% | 85-93% | Medium |
| Market Price | Pharmacy first, distributor second | 95-99% | 90-97% | Low |
| Availability | Pharmacy first, distributor second | 95-99% | 88-96% | Low |
| Product Images | Pharmacy + distributor | 90-98% | 85-95% | Low |
| Dosage Form | Pharmacy + DRAP normalization | 95-99% | 92-97% | Low |
| Strength | Pharmacy + DRAP normalization | 92-98% | 90-96% | Low-Medium |

## 9. Final catalogue completeness estimates

### After DRAP + Pharmacy

Estimated customer-facing completeness:

- 78-88% for a general medicine catalogue,
- 80-90% for the five golden sample medicines,
- 70-85% for regulatory-looking display completeness.

Why:

- pack, price, image, and availability gaps shrink sharply,
- manufacturer improves materially but remains incomplete,
- regulatory identity still depends on DRAP.

### After DRAP + Pharmacy + Distributor

Estimated customer-facing completeness:

- 88-95% for a general medicine catalogue,
- 90-96% for the five golden sample medicines,
- 75-88% for regulated fields and confidence-heavy display.

Why:

- distributor data fills many missing manufacturer and pack gaps,
- commercial listings improve confidence on product matching,
- the remaining ceiling is mostly regulated metadata and edge-case normalization.

### Important distinction

This is customer-facing completeness, not legal/regulatory completeness.

DRAP remains the source of truth for:

- registration number,
- registration status,
- approved price,
- regulatory dates,
- regulated identity.

## 10. Final recommendation

Use pharmacy and distributor data aggressively for recovery of commercial completeness, but never let them override DRAP for regulated identity.

Recommended field ownership in practice:

- DRAP owns registration, status, approved price, and canonical regulated identity.
- Pharmacy owns market price, availability, and most pack/display data.
- Distributor owns fallback pack and manufacturer evidence.
- Packaging images and OCR are validation layers.

## Final answer

Can pharmacy/distributor sources recover enough missing data to support a customer-facing catalogue?

YES.

Quantified estimate:

- manufacturer recovery: 70-85%,
- pack size recovery: 90-96%,
- market price recovery: 95-99%,
- availability recovery: 95-99%,
- product image recovery: 90-98%,
- dosage form recovery: 95-99%,
- strength recovery: 92-98%.

With DRAP + pharmacy data, DawaiSaver can realistically reach about 78-88% customer-facing completeness.

With DRAP + pharmacy + distributor data, that can rise to about 88-95%.

The remaining gaps are mostly regulated identity, edge-case normalization, and manufacturer certainty rather than basic catalogue completeness.
