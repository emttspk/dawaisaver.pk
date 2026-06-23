# DawaiSaver Medicine Master Data Model

Date: 2026-06-23

Basis used:

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
- `diagnostics/mvp-implementation-plan.md`

## 1. Medicine Master Record

The Medicine Master Record is the authoritative pre-publication record for a medicine in DawaiSaver.

It is the single record that resolves:

- what the medicine is,
- how it should be normalized,
- what regulated identity it belongs to,
- which commercial products belong to it,
- which pack variants are valid,
- which prices are comparable,
- and whether it is ready to be published to customers.

It is not a raw import row and it is not a brand-only product page.

The Master Record sits between source ingestion and customer publication.

## 2. Field groups

### Identity

Fields that define what the medicine is in canonical form.

- Master record ID
- Registration number
- Generic molecule
- Canonical molecule
- Composition group
- Composition signature
- Strength
- Dosage form
- Route of administration
- Brand product link
- Pack variant link
- Manufacturer
- Manufacturer country

### Regulatory

Fields that define regulated status and official approval data.

- Registration date
- Approval status
- Approved price
- Meeting number
- Manufacturing type
- Registration validity / status
- Source status
- Verification status

### Commercial

Fields that define market-facing sellable reality.

- Pack size
- Pack variant
- Pack quantity
- Unit count
- Unit type
- Market price
- Pack price
- Availability
- Alternate brands
- Image availability

### Medical

Fields that define therapeutic meaning and clinical classification.

- Therapeutic category
- WHO molecule
- WHO ATC code
- Broad molecule flag
- Combination product flag
- Salt / hydrate / ester normalization flags

### Intelligence

Fields produced by DawaiSaver inference, matching, and audit logic.

- Canonical comparison identity
- Match confidence
- Field confidence
- Record confidence
- AI review flags
- Normalization notes
- Conflict notes
- Review priority

### Evidence

Fields that store proof and traceability.

- Source name
- Source URL
- Source document type
- Source extraction timestamp
- Source payload snapshot
- OCR text
- Image evidence
- Import batch ID
- Review history
- Reviewer comments

## 3. Field definitions

| Field | Description | Source of Truth | Secondary Sources | Confidence Score | Verification Method |
|---|---|---|---|---:|---|
| Registration number | Unique regulated identity for the product | DRAP | Import archives, packaging OCR | 100 | Exact DRAP match |
| Generic molecule | Normalized molecule name | Canonical normalization layer | DRAP, WHO, pharmacy | 95 | Molecule normalization rules + human review for edge cases |
| Canonical molecule | Final normalized molecule label | Canonical normalization layer | WHO, DRAP, pharmacy | 95 | Salt/hydrate/ester normalization + review threshold |
| Composition group | Authoritative comparison identity | Composition group engine | DRAP, pharmacy, distributor | 100 | Signature match: composition + strength + dosage form + route |
| Composition signature | Deterministic comparison key | Composition group engine | None | 100 | Signature generation and collision check |
| Strength | Numeric and unit strength, normalized | DRAP for regulated identity; pharmacy for commercial match | Pharmacy, OCR | 98 | Parse + unit normalization + equivalence validation |
| Dosage form | Tablet, capsule, syrup, etc. | DRAP | Pharmacy, distributor, OCR | 98 | Controlled vocabulary normalization |
| Route of administration | Oral, topical, injection, etc. | DRAP | WHO, pharmacy, OCR | 95 | Controlled vocabulary normalization + rule-based mapping |
| Brand product | Market brand tied to composition group | Pharmacy source | DRAP, distributor | 95 | Source page match + composition alignment |
| Manufacturer | Best available source by confidence | DRAP for regulated source; pharmacy if DRAP missing | Distributor, OCR, packaging | 90 | Evidence ranking + manual review for conflicts |
| Manufacturer country | Regulated or commercial origin country | DRAP | Distributor, packaging OCR | 90 | Structured source field or packaging evidence |
| Pack size | Sellable pack quantity and shape | Pharmacy for market pack; DRAP for approved pack | Distributor, OCR | 95 | Pack parsing and exact page evidence |
| Pack variant | Structured pack unit under a brand product | Pharmacy source | Distributor, OCR | 95 | Pack normalization rules + evidence |
| Pack quantity | Number of packs or strips | Pharmacy source | OCR, distributor | 95 | Structured pack parse |
| Unit count | Total sellable units in a pack | Pack parser | Pharmacy, OCR | 95 | Pack normalization calculation |
| Unit type | Tablet, capsule, ml, g, etc. | Pack parser | Pharmacy, OCR | 95 | Normalization rules |
| Market price | Current commercial price | Pharmacy | Distributor, customer submissions | 92 | Page capture + price extraction + time stamp |
| Pack price | Price attached to a specific pack variant | Pharmacy | Distributor, OCR | 95 | Pack-linked price evidence |
| Approved price | Regulated approved price | DRAP | OCR, internal archive | 100 | Exact DRAP record match |
| Availability | Whether product is currently buyable | Pharmacy | Distributor | 90 | Live listing confirmation |
| Alternate brands | Other brands in same composition group | Pharmacy | Distributor | 90 | Composition-group match + dedupe |
| Therapeutic category | Clinical grouping | WHO/ATC | DRAP, internal mapping | 85 | ATC mapping or approved therapeutic taxonomy |
| WHO molecule | WHO canonical molecule label | WHO / normalization layer | DRAP | 85 | Mapping table review |
| WHO ATC code | WHO ATC classification | WHO | Internal mapping | 90 | Exact mapping or reviewed mapping |
| Broad molecule flag | Indicates over-broad or unsafe mapping | AI audit layer | Human review | 100 | Rule-based audit |
| Combination product flag | Marks multi-ingredient products | Canonical composition engine | DRAP, OCR | 100 | Ingredient count detection |
| Match confidence | Confidence in source-to-master matching | AI scoring engine | Human review | 100 | Weighted evidence score |
| Record confidence | Overall publication confidence | AI scoring engine | Human review | 100 | Aggregated field confidence |
| Normalization notes | Why a field was normalized or flagged | AI audit layer | Human review | 100 | Stored audit reasoning |
| Conflict notes | Explanation of field conflicts | AI audit layer | Human review | 100 | Conflict log |
| Source URL | Traceable evidence URL | Source system | None | 100 | Direct evidence capture |
| Source payload snapshot | Raw source payload or scrape snapshot | Source system | Archive | 100 | Immutable evidence retention |
| OCR text | Extracted packaging text | OCR engine | Human review | 85 | OCR validation + source cross-check |
| Review history | Approval trail | Admin workflow | None | 100 | Immutable audit trail |

## 4. Field ownership hierarchy

Ownership priority by field:

| Field | Primary owner | Secondary owner(s) | Notes |
|---|---|---|---|
| Registration number | DRAP | OCR, archive | Never brand-derived |
| Approved price | DRAP | OCR, archive | Regulated price only |
| Registration date | DRAP | OCR, archive | Regulated metadata |
| Registration status | DRAP | OCR, archive | Regulated metadata |
| Composition group | DawaiSaver canonical engine | DRAP, pharmacy, distributor | Comparison identity must be canonical |
| Generic molecule | Canonical normalization layer | WHO, DRAP | Must be clean of brand contamination |
| Strength | DRAP for identity; pharmacy for market pack | OCR, distributor | Must align with composition group |
| Dosage form | DRAP | Pharmacy, OCR | Controlled vocabulary |
| Route | DRAP | WHO, pharmacy, OCR | Comparison rule includes route |
| Brand | Pharmacy | Distributor, OCR | Brand is commercial, not canonical identity |
| Manufacturer | Best available source | DRAP, pharmacy, distributor, OCR | Highest-confidence evidence wins |
| Pack size | Pharmacy | DRAP, distributor, OCR | Pack-linked commercial truth |
| Market price | Pharmacy | Distributor, OCR, customer submissions | Commercial truth |
| Availability | Pharmacy | Distributor | Live source first |
| Therapeutic category | WHO / ATC | Internal mapping | Enrichment field |
| Evidence metadata | Source evidence layer | None | Immutable traceability |

Hierarchy rule:

- Regulated identity fields always prefer DRAP.
- Commercial fields always prefer the best live commercial source.
- Canonical comparison identity always prefers DawaiSaver normalization over any single source label.
- When sources disagree, the higher-confidence source wins only if the field is not regulated or protected by DRAP.

## 5. Missing-field workflow

When a field is missing, the system should follow this order:

1. AI search.
   - Search normalized molecule, composition, pack, and brand patterns.
2. Pharmacy search.
   - Search Dawaai, Sehat, DVAGO, and similar sources for the same product family.
3. Distributor search.
   - Use distributor catalogues for pack and manufacturer recovery.
4. OCR search.
   - Read packaging images and labels for pack, manufacturer, and regulatory text.
5. Manual review.
   - If the field still cannot be resolved with sufficient confidence, queue it for human review.

Workflow rule:

- If a regulated field is missing, do not infer it from a lower-confidence commercial field without review.

## 6. AI audit layer

The AI audit layer should detect:

- duplicate products,
- wrong strengths,
- wrong compositions,
- wrong packs,
- wrong classifications,
- price anomalies,
- salt normalization errors,
- hydrate normalization errors,
- ester normalization errors,
- brand contamination in canonical fields,
- broad molecule collisions,
- invalid substitutions,
- pack-price mismatches.

Audit outputs:

- pass,
- warning,
- reject,
- manual review required.

The AI audit layer must never publish a product on its own.

## 7. Admin approval workflow

State machine:

`Draft -> Enriched -> AI Reviewed -> Human Reviewed -> Approved -> Published`

State definitions:

- Draft
  - Raw or partially ingested record.
- Enriched
  - Field enrichment completed from one or more sources.
- AI Reviewed
  - Automated checks completed and results attached.
- Human Reviewed
  - A reviewer has confirmed or corrected the record.
- Approved
  - The record meets publication policy.
- Published
  - The record is visible to customers.

Transition rules:

- Missing required fields block approval.
- Low-confidence conflicts block approval until human review.
- Publication requires both approval and a passing confidence threshold.

## 8. Catalogue categories

The master data layer should organize records into:

- Molecules
  - Normalized chemistry layer.
- Composition Groups
  - Authoritative comparison identities.
- Products
  - Brand-level commercial listings.
- Pack Variants
  - Pack-specific commercial sell units.
- Manufacturers
  - Brand or company source entities.
- Prices
  - Pack-linked price records.
- Sources
  - DRAP, pharmacy, distributor, OCR, customer submissions.
- Reviews
  - AI and human review records.

## 9. Customer publication rules

A product cannot be listed unless:

- required fields are complete,
- composition-group matching has succeeded,
- pack normalization has succeeded,
- confidence threshold has been met,
- human approval has been completed,
- evidence is attached,
- and the comparison identity is not brand-driven.

Required publication minimum for the MVP:

- registration number,
- composition group,
- strength,
- dosage form,
- route,
- brand,
- pack variant,
- price,
- manufacturer,
- verification status.

## 10. Future multi-source support

The master data model should accept these sources without changing the core identity logic:

- DRAP
- Dawaai
- Sehat
- DVAGO
- Distributor catalogues
- OCR from packaging
- Customer-submitted evidence

Source layering rule:

- DRAP owns regulated identity.
- Pharmacy sources own market availability and market price.
- Distributor sources fill pack and manufacturer gaps.
- OCR supports evidence recovery.
- Customer data is always lowest-confidence and review-gated.

## 11. Recommended master data architecture

Recommended shape:

`Source Observation -> Evidence -> Field Candidate -> Master Field -> Composition Group -> Brand Product -> Pack Variant -> Pack Price -> Customer Publication`

Why this works:

- It separates regulated identity from commercial reality.
- It keeps comparison deterministic.
- It supports source conflict resolution.
- It preserves evidence for audits.
- It allows product publication only after the record is sufficiently trusted.

## 12. Required fields

Required before customer publication:

- registration number
- canonical composition group
- strength
- dosage form
- route of administration
- brand
- pack variant
- manufacturer
- price
- verification status
- evidence reference

## 13. Optional fields

Optional for MVP publication, but useful for richer product intelligence:

- manufacturer country
- registration date
- approved price
- therapeutic category
- WHO molecule
- WHO ATC code
- image gallery
- alternate brands
- OCR annotations
- distributor listing references

## 14. Future fields

Fields that should be supported later, but are not launch blockers:

- availability by city
- stock level
- delivery ETA
- substitutions
- customer review signals
- pharmacy reliability score
- distributor reliability score
- price history
- promotion history
- marketplace ranking signals

## Final recommendation

Recommended master data architecture:

- Use a Medicine Master Record as the authoritative pre-publication layer.
- Make Composition Group the comparison truth.
- Make DRAP the regulated-identity truth.
- Make pharmacy sources the commercial truth for pack and price.
- Make evidence and review status mandatory for publication.

Required fields:

- registration number
- canonical composition group
- strength
- dosage form
- route
- brand
- pack variant
- manufacturer
- price
- verification status
- evidence link

Optional fields:

- manufacturer country
- registration date
- approved price
- therapeutic category
- WHO / ATC fields
- images
- alternate brands

Future fields:

- live availability
- price history
- substitutions
- distributor intelligence
- customer-derived signals
