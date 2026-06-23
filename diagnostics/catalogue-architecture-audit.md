# DawaiSaver Catalogue Architecture Audit

Audit date: 2026-06-23  
Scope: repository schema, migrations, import/mapping services, search/comparison logic, prescription flow, pricing services, customer web UI, committed WHO mapping artefact, seed data, and committed catalogue export.  
Constraint: findings only; no implementation, schema, migration, build, database, or source-code changes were performed.

## Executive finding

Overall risk: **Critical**.

The repository contains most of the structural building blocks for a molecule-led catalogue, but the customer-facing runtime does not operate on a single, authoritative `Composition + Strength + Dosage Form` entity.

Three competing identity/grouping models coexist:

1. `Product.signature` / matching signatures: generic + strength + dosage form.
2. `CanonicalProduct`: one product/brand record with a unique medicine signature, plus brand, manufacturer, pack, and registration fields.
3. `CompositionGroup`: molecule ingredients + ingredient strengths + dosage form, with no brand/manufacturer/price fields.

The third model is closest to the target. It is populated only by the DRAP-to-WHO matching workflow, has no relationship to `Product`, and is not used by search, alternatives, pricing, prescriptions, catalogue export, or the customer UI. The active customer flow reads `Product`, `CanonicalProduct`, and price-statistic tables. The separate golden-sample exporter uses the incorrect signature `brand|generic|strength|dosageForm`.

The architecture therefore cannot yet guarantee that all accepted customer inputs normalize to one composition group and produce a complete, pack-aware, regulatory, savings-oriented brand comparison.

## 1. Current data inventory

Usage status meanings:

- **Active**: read or written by an application/runtime path.
- **Pipeline-only**: populated by an administrative/import path but not consumed by the customer catalogue.
- **Seed/legacy**: created by seed or older logic but not used by current customer comparison.
- **Schema-only**: declared/migrated but no application read/write usage was found.

### Core medicine and catalogue tables

| Table | Purpose | Primary key / identity | Principal relationships | Current usage |
|---|---|---|---|---|
| `manufacturers` | Manufacturer master | `id`; indexed normalized name, but no unique constraint | One-to-many `products`; optional `manufacturer_profiles`; import items | **Active** in DRAP/catalogue build and search |
| `generics` | Generic/molecule master | `id`; unique `normalized_name` | Product compositions, composition groups, ATC links, molecule aliases | **Active** |
| `products` | Brand product record | `id`; registration number is indexed but not unique | Manufacturer, compositions, prices, packs, categories, canonical row, matches | **Active; primary customer search entity** |
| `product_compositions` | Product ingredient and strength rows | `id`; unique product + generic + ingredient order | `products`, `generics` | **Active** |
| `equivalence_groups` | Older equivalence grouping | `id`; signature indexed, not unique | `product_equivalence` | **Seed/legacy**; populated by seed, not used by customer alternatives |
| `product_equivalence` | Product membership in older equivalence groups | `id`; unique product + group | Products and equivalence groups | **Seed/legacy** |
| `canonical_products` | Canonical matching target | `id`; unique `product_id`; unique `medicine_signature` | Optional one-to-one product, aliases, product matches | **Active**, but combines equivalence identity with brand/SKU attributes |
| `canonical_product_aliases` | Brand/generic/manufacturer/signature/registration/pack aliases | `id`; unique canonical product + alias type + normalized value | Canonical product | **Active** in build and search autocomplete |
| `product_matches` | Scored source-to-canonical match | `id` | Source product, canonical product, reviews | **Active**, also reused for WHO matching without a canonical product ID |
| `match_reviews` | Manual review of uncertain product matches | `id` | Product match, optional canonical/product references | **Active administrative support** |
| `composition_groups` | Molecule + strength + dosage-form group | `id`; unique `signature`; indexed `molecules_hash` | Ingredient rows only | **Pipeline-only**; no product membership and no customer consumer |
| `composition_group_compositions` | Ingredients/strengths in composition group | `id`; unique group + generic + order | Composition group and generic | **Pipeline-only** |
| `therapeutic_categories` | Therapeutic category hierarchy | `id`; unique code | ATC classifications and product-category links | **Active in ATC/import/export; absent from customer UI** |
| `product_therapeutic_categories` | Product/category assignment | composite product + category uniqueness | Product and category | **Pipeline-only/customer-unexposed** |
| `manufacturer_profiles` | Country, DRAP status, manufacturer metrics | `id`; unique manufacturer | Manufacturer | **Schema-only** |

### Pack and price tables

| Table | Purpose | Primary key / identity | Principal relationships | Current usage |
|---|---|---|---|---|
| `pharmacies` | Pharmacy master | `id` | Product prices and bills | **Active foundation** |
| `product_prices` | Observed price for a product/pharmacy/city | `id` | Product and optional pharmacy | **Active** in prescription price loading; not pack-linked |
| `product_packs` | Separate pack variants and unit conversion | `id` | Product and pack prices | **Schema-only** |
| `product_pack_prices` | Price attached to a specific pack | `id` | Product pack | **Schema-only** |
| `price_snapshots` | Online-pharmacy observations | `id` | Source provider and optional product | **Active** price-intelligence input; contains no pack ID/pack size |
| `price_change_events` | Price movement history | `id` | Snapshot, source provider, optional product | **Active price-intelligence support** |
| `product_availability` | Product/source/city availability | `id` | Product and source provider | **Active search signal** |
| `product_price_statistics` | Product-level aggregate prices | `id` | Product | **Active search signal** |
| `city_price_statistics` | City/product aggregate prices | `id` | Product | **Active search signal** |
| `market_price_signals` | Best/recommended/average product price signals | `id` | Product | **Active search/prescription signal** |
| `price_anomalies` | Price anomaly findings | `id` | Product/snapshot/source | **Active administrative support** |
| `price_trends` | Product/signature price trends | `id` | Optional product | **Active analytical support** |

### WHO/ATC mapping tables and artefacts

| Table / artefact | Purpose | Identity / relationships | Current usage |
|---|---|---|---|
| `atc_classifications` | WHO ATC hierarchy | `id`; unique ATC code; parent, import batch, therapeutic category | **Active ATC import and DRAP matching** |
| `generic_atc_classifications` | Generic-to-ATC many-to-many link | unique generic + ATC | **Active ATC import/matching** |
| `molecule_aliases` | Canonical/source/curated molecule aliases | `id`; unique generic + normalized alias + type | **Active matching support** |
| `WHO data/who-molecule-mappings.json` | Committed hand-built mapping sample | Object keyed by ten mapped molecules; five unmatched molecules | **Artefact only**; contains invalid and brand-contaminated data noted below |

No WHO CSV/XLSX/XML source file is currently present in the repository, although the adapter supports those formats and repository notes refer to a CSV that is absent.

### DRAP/import/source tables

| Table | Purpose | Primary key / identity | Principal relationships | Current usage |
|---|---|---|---|---|
| `import_batches` | DRAP, ATC, and other import run metadata | `id` | Items, errors, ATC rows | **Active** |
| `import_batch_items` | Raw and normalized import payloads | `id`; unique batch + row | Batch, optional product/manufacturer | **Active; effective DRAP staging table** |
| `import_errors` | Row-level import errors | `id` | Import batch | **Active import support** |
| `catalog_build_jobs` | Resumable import-to-catalogue build status | `id` | Cursor IDs only; no foreign keys | **Active catalogue build control** |
| `crawl_jobs` | Crawl run state | `id` | No catalogue FK | **Supporting/older acquisition layer** |
| `source_providers` | Online pharmacy/source registry | `id`; unique code | Config, sync, prices, availability | **Active** |
| `source_provider_configs` | Provider configuration | `id`; unique provider | Source provider | **Active** |
| `source_sync_jobs` | Provider sync execution | `id` | Provider and results | **Active** |
| `source_sync_results` | Per-product source sync result | `id` | Sync job and provider | **Active** |
| `source_health_logs` | Provider health observations | `id` | Source provider | **Active** |
| `data_sources` | General provenance/trust registry | `id` | No FK from products/prices | **Schema-only** |
| `data_quality_flags` | Entity-level mapping/quality issues | `id` | Logical entity reference only | **Active DRAP/ATC pipeline** |

There is no dedicated structured DRAP product table. DRAP detail data is staged in JSON fields on `import_batch_items`, archived externally when configured, and then projected selectively into the common catalogue tables.

## 2. Field inventory

| Required field | Classification | Finding |
|---|---|---|
| Registration Number | **Available** | `products.registration_number`, canonical product, aliases, source payload; indexed but not unique on products |
| Brand Name | **Available** | `products.brand_name`; central to current product/search presentation |
| Generic Name | **Available** | `generics.name` through `product_compositions`; also duplicated in price snapshot payloads |
| Composition | **Available** | Multi-row `product_compositions`; multi-row composition-group ingredients |
| Strength | **Available** | Product text plus per-ingredient value/unit/text; normalization is not sufficiently robust |
| Unit | **Available** | `product_compositions.strength_unit` and composition-group unit |
| Dosage Form | **Available** | Product raw/normalized fields and composition group form |
| Pack Size | **Partially Available** | Imported/stored as raw text on product; separate pack model exists but is unused and not populated |
| Manufacturer | **Available** | Product FK to manufacturer |
| Manufacturer Country | **Partially Available** | `manufacturers.country` and profile country exist; DRAP mirror catalogue mapping does not project parsed country |
| Registration Date | **Present In Source But Lost During Import** | DRAP parser and normalized JSON expose it; no structured product/catalogue field |
| Approved Price | **Present In Source But Lost During Import** | DRAP parser exposes `approvedPrice`; catalogue mapper and price tables do not preserve approved-price semantics |
| Route Of Administration | **Present In Source But Lost During Import** | Parsed as `routeOfAdmin`; no structured catalogue field |
| WHO ATC Code | **Available** | Structured ATC tables and generic links; committed sample mapping quality is unsafe |
| Therapeutic Category | **Available** | Category and product-category tables exist; customer APIs/UI do not return it |

Additional regulatory source fields currently retained only in import JSON/archive rather than structured catalogue fields include meeting number, pricing type, manufacturing type, source registration status, source verification status, label claim, and remarks.

## 3. Normalization audit

### Ability to distinguish target examples

The signature helpers include normalized generic, strength, and dosage form, so fully populated records can distinguish:

- Paracetamol 500 mg tablet from Paracetamol 650 mg tablet.
- Paracetamol tablet from syrup or injection.

This separation is conditional, not guaranteed.

### Risks

| Risk | Severity | Finding |
|---|---|---|
| Missing components are silently omitted from signatures | **Critical** | `generic`, `strength`, and `form` are filtered before joining. An incomplete record can receive an under-specified identity instead of being prevented from comparison. |
| No authoritative signature format | **Critical** | Seed/equivalence uses `paracetamol|500mg|tablet`; matching/catalogue uses `paracetamol_500mg_tablet`; golden export and committed WHO sample use brand-prefixed pipe signatures; composition groups use ingredient colon/pipe syntax. |
| Combination normalization loses explicit ingredient boundaries | **High** | Generic normalization replaces `+` and `and` with spaces. Ingredient rows exist, but general matching signatures flatten combination names and joined strengths into text. |
| Ingredient ordering is source-dependent | **High** | Composition-group signatures sort primarily by `ingredientOrder`, not a canonical molecule order. Equivalent combinations imported in reversed order can produce different signatures. |
| Strength parsing is single-match and vocabulary-limited | **High** | General parser extracts only the first numeric unit and supports a narrow unit set. Concentrations, ratios, `mg/5ml`, salts, release modifiers, and multiple strengths are not canonically modeled. |
| Dosage form vocabulary is narrow | **High** | Only a short alias map exists; modified-release forms, dispersible/chewable variants, route-specific forms, and many DRAP spellings remain arbitrary strings. |
| Canonical product identity is internally contradictory | **Critical** | `medicine_signature` is unique while the row also stores one brand, manufacturer, pack, and registration number. Multiple brands with the same target identity collapse onto the first canonical row. |
| Registration identity is weakly constrained | **High** | Product registration number is indexed but not unique; importer searches by it but the database permits duplicates. |
| Product-to-composition-group membership is absent | **Critical** | The correct group cannot enumerate its brand products, packs, or prices. |

Conclusion: the current system can represent the three Paracetamol examples as separate product signatures when every field is present and normalized consistently, but it cannot uniquely and safely enforce that distinction across all import and customer-input paths.

## 4. Composition group audit

### Structured `composition_groups`

- Brand name: **not present**.
- Manufacturer: **not present**.
- Price: **not present**.
- Ingredients, per-ingredient strength value/unit, and dosage form: **present**.

This table design matches the target principle, but it lacks product membership and is not used by customer features.

The generated signature resembles:

`Paracetamol:500:mg|dosage_form=tablet`

For combinations it produces one segment per ingredient followed by dosage form. This is semantically close to the target, but canonical ingredient order and strength formatting are not enforced.

### Other structures labelled or functioning as groups

- Golden-sample exporter: `brand|generic|strength|dosageForm` — **architecture issue; includes brand**.
- Committed WHO mapping artefact composition groups: `Amoxil|...`, `Panadol|...`, `Insulina|...` — **architecture issue; includes brand**.
- `canonical_products`: group-level unique medicine signature plus brand, manufacturer, pack, and registration — **architecture issue; group polluted by SKU fields**.
- Legacy `equivalence_groups`: signature excludes brand and is structurally acceptable, but is disconnected from current customer alternatives.

No composition group directly contains a manufacturer or price field. Manufacturer/pack contamination occurs in `canonical_products`; prices remain product-level but are not group/pack safe.

## 5. Product comparison audit

Exact current customer behavior:

1. Search loads every `Product`, its manufacturer/compositions, latest aggregate price signals, optional one-to-one canonical product, aliases, and matched canonical IDs.
2. Ranking scores brand, generic, manufacturer, medicine signature, and registration number. Brand receives the largest exact-match weight.
3. Alternative lookup selects the requested product by product ID or canonical ID.
4. Alternatives are products for which the medicine-signature strings are equal, or whose match ID arrays appear linked.
5. Price output is aggregate product lowest/average/highest, not a pack-matched comparison.

Classification: **B in intent, mixed/unsafe in execution**.

The primary alternative predicate is equality of a signature intended to encode `Composition + Strength + Dosage Form`, not equality of brand. However:

- It does not use the structured `composition_groups` table.
- Signature completeness and format are not enforced.
- Canonical records are brand-specific in their other fields.
- Match link arrays store canonical IDs while comparison checks product IDs, so link-based equivalence is inconsistent; signature equality is doing most of the useful work.
- Legacy `product_equivalence` memberships are ignored.
- Ranked output still favors brand identity and presents a brand as the canonical product.

## 6. Pack size audit

| Check | Finding |
|---|---|
| Is pack size stored? | **Yes, partially**: one raw `products.pack_size`; separate `product_packs` model exists |
| Is pack size imported? | **Yes** from normalized DRAP rows and mirror detail payloads when present |
| Is pack size normalized? | **Partially**: a text normalizer singularizes tablets/capsules for matching, but storage remains free text and no numeric parser is authoritative |
| Is pack size linked to price? | **Not in active paths**: `product_prices` and `price_snapshots` link to product, not pack; `product_pack_prices` is unused |

`Panadol 10 Tablets` and `Panadol 20 Tablets` cannot be reliably represented as two packs of one brand product in the active architecture. The importer product identity excludes pack when registration number matches and otherwise matches signature + manufacturer + brand, so a later pack can update/overwrite the single product pack-size field. Separate product rows could exist only incidentally, while canonical signature uniqueness would still collapse them. The schema-only pack tables could represent both variants but no importer, search, comparison, or UI path uses them.

## 7. Price model audit

| Capability | Status | Finding |
|---|---|---|
| Approved DRAP Price | **Missing from structured model** | Parsed from DRAP source but not mapped to a price record or typed approved-price field |
| Retail Price | **Available** | Product/pharmacy prices and online price snapshots exist |
| Future Pharmacy Price | **Supported at product level** | Pharmacy, provider, city, observation time, availability, and currency structures exist |
| Cost per unit/tablet/ml | **Partially supported in schema only** | `product_packs` has units, ml, conversion factor, and price per unit, but active prices are not pack-linked and no production calculation consumes it |

Current statistics aggregate all valid observations associated with a product. They do not verify common pack size or quantity before comparing. This can label a larger pack as more expensive or a smaller pack as cheapest without a unit-cost correction.

The prescription savings engine calculates absolute saving but does not expose percentage saving in its API/UI model. It can also mix product, canonical, and signature price signals without pack equivalence. Therefore the target `Rs 27 (28%)` claim is not safely supported.

## 8. WHO mapping audit

### Structured design

- WHO molecule/canonical generic: represented by `generics`, aliases, and ATC links.
- ATC code/hierarchy: represented by `atc_classifications`.
- Therapeutic category: represented and linkable to products.
- ATC import supports CSV/TXT/XLSX/XML and records source version/import batch.

### Committed `who-molecule-mappings.json` findings

- Ten mappings are stored in an object, five molecules are marked unmatched, three sample composition groups exist, and five therapeutic categories exist.
- `pakistanNames` mixes molecule spelling aliases with brand names such as Panadol, Calpol, Amoxil, Humalog, Lantus, Caltrate, and others. **High-risk brand/molecule contamination**.
- Some lists contain dosage-form/product phrases such as `Calpol Infant`, `Insulin Injection`, `Multivitamin Syrup`, and `Iron Syrup`, not molecule aliases.
- The three composition-group signatures are brand-prefixed. **Invalid for composition grouping**.
- Metformin is explicitly unmatched despite being one of the required golden samples.
- Ibuprofen and clavulanic-acid combination mapping are absent.
- Several mappings are internally inconsistent or implausible: Folic Acid code/name (`B01BB01`), oral rehydration salt mapped to “Amino acids and derivatives,” and Chlorophyll mapped to “Other antistaminics.”
- Category codes in the artefact are broad/non-product-level and do not consistently match the mapped ATC codes.
- Broad entries such as Insulin, Multivitamin, Vitamin B Complex, and Oral Rehydration Salt collapse clinically distinct substances/combinations and formulations.
- Brand aliases overlap across different mappings (`Vitamultin`, `Daily Care`), creating ambiguous lookup paths.
- No duplicate object keys are visible in the file, but semantic duplicate/overlap detection is absent and the object shape can silently overwrite duplicate keys during authoring/parsing.

Conclusion: the relational WHO/ATC design is usable, but the committed mapping sample is not safe as a canonical molecule source or automatic comparison authority.

## 9. Customer search audit

| Search mode | Status | Exact behavior / gap |
|---|---|---|
| Brand search | **Supported** | Exact/fuzzy brand scoring and autocomplete |
| Generic search | **Supported** | Concatenated composition generic names; separate generic endpoint uses product-derived names |
| Composition search | **Partially supported** | Combination text may match; no ingredient-aware query against composition groups |
| Strength search | **Partially supported** | Strength is searchable only as part of the medicine-signature text; no field filter/facet and search DTO has no strength parameter |
| Dosage-form search | **Partially supported** | Form is searchable only inside signature text; no field filter/facet and no dosage-form parameter |
| Registration search | **Supported** | Exact/fuzzy score and autocomplete type |
| Manufacturer search | **Supported** | Fuzzy scoring and autocomplete |

Brand-only input and generic-only input can return ranked products. A complete prescription/bill string can match signature text if its token normalization happens to match stored signature formatting. There is no explicit input-resolution stage that determines whether a token is a brand or generic, retrieves its compositions, then resolves exactly one composition group before comparison.

Autocomplete offers brand, generic, manufacturer, signature, and registration. It does not expose strength/form-specific structured suggestions. Search results omit strength, dosage form, and pack size even though the backend search model loads them.

## 10. UI model audit

Current medicine detail header is the **brand name**, with generic as secondary text. The target header is the composition identity, for example `Paracetamol 500mg Tablet`.

| Target section | Current UI | Gap |
|---|---|---|
| Composition | Generic name only | No ordered ingredient/strength composition display |
| Therapeutic Category | Absent | API search result also omits it |
| Available Brands | Separate alternatives cards | Not anchored to a displayed composition group; manufacturer/form/pack/registration omitted |
| Pack Sizes | Absent | No pack variants or pack-specific price |
| Price Comparison | Lowest/average product aggregates | No source/pharmacy rows, common-pack check, approved price, or unit price |
| Savings Analysis | Prescription report only | Medicine detail/alternatives lacks current vs cheapest amount and percentage |
| Regulatory Information | Registration number only | No registration status/date, approved price, route, source verification, or DRAP context |

The alternatives page states that equivalence requires same ingredient, strength, and form, but it does not display strength or dosage form, making the assertion unverifiable to the customer.

## 11. Golden sample readiness

The committed catalogue export is a synthetic/sample artefact, not evidence of production readiness: IDs and registration numbers are placeholders, repeated products use brand-prefixed group signatures, and the report claims unit-price readiness although the runtime exporter does not calculate `unitPrice`. It contains Paracetamol examples and Amoxicillin variants, but no Ibuprofen, Metformin, or clavulanic-acid combination products.

| Golden sample | Readiness | Missing fields / mapping / normalization / UI findings |
|---|---|---|
| Paracetamol 500mg Tablet | **Partial — High risk** | Seed has Panadol and Calpol with correct product signatures, but no pack-linked prices, approved price, regulatory status/date, route, or target UI. WHO artefact mixes brands into molecule aliases and includes brand-prefixed group. |
| Ibuprofen 400mg Tablet | **Partial — High risk** | Seed has Brufen with identity fields, but WHO artefact has no Ibuprofen mapping, no category/ATC readiness evidence, no prices or regulatory output, and no target composition-group UI. |
| Metformin 500mg Tablet | **Not ready — Critical** | No product in seed/export; WHO artefact explicitly marks Metformin `needs_mapping`; no demonstrated composition group, brand set, pack price, or UI output. |
| Amoxicillin 500mg Capsule | **Not ready — High** | Export includes Amoxicillin 500mg as Tablet and other Capsule strengths, not the exact requested identity; mapping aliases contain brands; no verified pack/regulatory/savings output. |
| Amoxicillin + Clavulanic Acid 875mg/125mg Tablet | **Not ready — Critical** | Curated name rule exists, but no golden product/export mapping; combination boundaries/order and dual-strength normalization are not authoritative; WHO artefact lacks clavulanic acid combination mapping; no group/product/pack/price/UI proof. |

## 12. Final gap report

### A. What already matches the target architecture

- Product and manufacturer are separate entities.
- Products support multiple composition rows with ingredient order and per-ingredient strength/unit.
- Generic/molecule, alias, WHO ATC, and therapeutic-category structures exist.
- Dosage form and strength participate in intended medicine signatures.
- A clean `composition_groups` schema excludes brand, manufacturer, and price.
- Retail/pharmacy price observation and analytics foundations exist.
- Regulatory registration number, product status, source provenance, confidence, and review structures exist.
- Customer search accepts brand and generic terms; prescription text parsing recognizes strength and dosage form.

### B. What partially matches

- Equivalence logic intends to use composition + strength + form but relies on inconsistent text signatures rather than one enforced group ID.
- Pack size is parsed and stored but remains a single free-text product property.
- Manufacturer country exists but is not consistently projected from DRAP mirror data.
- Price comparison and savings exist at product level but are not pack-normalized and do not expose percentage saving.
- WHO/ATC relational tables are sound in outline, while the committed mapping content is unsafe.
- Search can match strength/form inside signature text but cannot filter or resolve them structurally.
- Regulatory data is parsed but only registration number reaches the customer catalogue.

### C. What must change before implementation of the target model

These are architecture prerequisites, not implemented changes:

1. Establish one authoritative, versioned identity for ordered canonical composition + per-ingredient strength + normalized dosage form.
2. Make brand products members of that identity without storing brand/manufacturer/pack/registration on the group itself.
3. Separate a brand product from its pack variants and attach every comparable price to a specific pack/quantity/unit basis.
4. Remove brand/product phrases from molecule aliases and validate WHO ATC/category mappings against an authoritative source before automatic use.
5. Preserve source regulatory and approved-price fields in typed catalogue data rather than only JSON/archive payloads.
6. Require comparison-critical fields or route incomplete records to review; do not generate under-specified equivalence signatures.
7. Make search, prescription/bill resolution, alternatives, pricing, and UI consume the same composition-group identity.
8. Expose ingredient strength/form, manufacturer, packs, registration status, price basis, and savings calculation inputs in customer APIs so equivalence and savings are auditable.

### D. What can remain unchanged

- UUID primary keys, audit timestamps, soft-delete/status/confidence conventions.
- Manufacturer and generic master tables as base entities.
- Product composition row pattern, subject to canonical identity validation.
- WHO ATC hierarchy and many-to-many generic classification pattern.
- Import batch/raw/normalized/error provenance framework.
- Source-provider, pharmacy, city, price-history, anomaly, and aggregate-statistics foundations.
- Human review and data-quality flag mechanisms.
- Safety wording that advises clinical confirmation before switching.

### E. Risk register

| Risk | Level |
|---|---|
| Canonical product conflates equivalence group with brand/SKU attributes | **Critical** |
| Correct composition groups are disconnected from products and customer runtime | **Critical** |
| Pack-unaware prices can produce false cheapest/savings claims | **Critical** |
| Incomplete/inconsistent signatures can create false equivalence | **Critical** |
| WHO sample includes invalid mappings and brand contamination | **Critical** |
| Required combination golden sample lacks canonical mapping/readiness | **Critical** |
| Regulatory/approved-price fields are lost from structured catalogue | **High** |
| Search/UI cannot prove equivalence fields or show target catalogue layout | **High** |
| Manufacturer and registration uniqueness/data-quality constraints are weak | **High** |
| Legacy and duplicate grouping models create operational ambiguity | **High** |
| Existing provenance, review, and analytical foundations are reusable | **Low risk / positive** |

## Audit boundary

No live database connection was available in the audit environment (`DATABASE_URL` was absent), so row counts, deployed migration state, production data completeness, and live golden-sample responses could not be independently verified. “Current usage” above means usage evidenced by repository runtime code and committed artefacts. This limitation does not change the structural critical findings: the schema and active code paths themselves demonstrate the identity, product-group linkage, pack-price, mapping, search, and UI gaps.
