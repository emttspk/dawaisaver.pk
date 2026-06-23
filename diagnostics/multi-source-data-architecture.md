# DawaiSaver Multi-Source Data Architecture Investigation

Date: 2026-06-23

Sources used:

- `diagnostics/catalogue-architecture-audit.md`
- `diagnostics/catalogue-refactor-plan.md`
- `diagnostics/data-readiness-audit.md`
- `diagnostics/molecule-normalization-investigation.md`
- `diagnostics/golden-catalogue-feasibility.md`

Scope:

- Investigation only.
- No implementation, code changes, schema changes, migrations, commits, builds, or pushes.
- DRAP is treated as one source among several, not the universal source of truth.

## Executive finding

DawaiSaver should move to a field-level multi-source model, not a source-level winner-takes-all model.

The right long-term architecture is:

`Source Observation` -> `Field Evidence` -> `Canonical Field` -> `Composition Group` -> `Brand Product` -> `Pack Variant` -> `Pack Price` -> `Customer View`

In that model:

- DRAP remains authoritative for regulated identity and registration facts.
- Pharmacy websites are authoritative for current market price and availability.
- Distributor catalogues are authoritative for commercial pack and listing data when DRAP is incomplete.
- Customer submissions are useful signals, never primary truth.
- Prescription OCR is a resolution input, not a source of truth.
- Internal analytics produces confidence, anomaly, and conflict signals only.

The current DRAP-only audits show that a single source cannot fully support the customer catalogue. Multi-source recovery is therefore necessary, but it must be field-specific.

## 1. Authoritative ownership for every field

### Principle

Each field should have one primary owner, a set of allowed secondary sources, and a fallback rule.

- Primary owner means the field should be taken from that source whenever available and trusted.
- Secondary sources may fill gaps or validate the primary source.
- Fallback rule decides what happens when sources disagree.

### Ownership summary

| Field | Primary owner | Secondary sources | Notes |
|---|---|---|---|
| Registration Number | DRAP | Distributor catalogue, OCR, customer submissions | Regulated identity. Never inferred from pharmacy listings. |
| Registration Status | DRAP | Distributor catalogue, OCR | Regulatory truth. |
| Registration Date | DRAP | Distributor catalogue, OCR | If DRAP missing, keep as unknown rather than guessed. |
| Brand Name | DRAP | Pharmacy, distributor, OCR, customer submissions | Brand names are commercially visible, but DRAP should anchor canonical brand identity. |
| Generic Name / Molecule | DRAP + canonical molecule rules | Distributor catalogue, OCR, pharmacy | DRAP text normalized through curated molecule rules. |
| Composition Group | DawaiSaver canonical layer | DRAP, pharmacy, distributor, OCR | Must be derived, not directly copied from a single source. |
| Strength | DRAP | Distributor catalogue, pharmacy, OCR | Use per-ingredient strength for combinations. |
| Dosage Form | DRAP | Pharmacy, distributor, OCR | Normalized controlled vocabulary. |
| Route of Administration | DRAP | OCR, distributor, pharmacy | Regulatory source should win when explicit. |
| Pack Size | Pharmacy/distributor | DRAP, OCR, customer submissions | DRAP is useful but incomplete; commercial sources are often better. |
| Pack Variant | DawaiSaver canonical layer | Pharmacy, distributor, OCR | Pack = presentation, count, volume, and unit semantics. |
| Market Price | Pharmacy | Distributor, customer submissions, internal analytics | Dynamic commercial truth. |
| Approved Price | DRAP | Distributor catalogue, OCR | Regulatory price, not market price. |
| Availability | Pharmacy | Distributor, OCR, customer submissions | Highly dynamic. |
| Manufacturer | Best available source | DRAP, distributor, pharmacy, OCR, customer submissions | Use the highest-confidence source with evidence. |
| Manufacturer Country | Manufacturer registry / DRAP / distributor | OCR, pharmacy | Usually derived from manufacturer master. |
| Images | Pharmacy | Distributor, OCR, customer submissions | Commercial presentation layer. |
| Therapeutic Category | WHO/ATC + DRAP mapping | Internal analytics, curated review | Not a customer-submitted truth field. |
| WHO ATC Code | WHO/ATC | DRAP mapping, internal analytics | External medical classification. |
| Source Status | Source system | Internal analytics | Reflects whether the record is active, missing, or stale. |
| Verification Status | DawaiSaver | Internal review, OCR, customer submissions | A confidence state, not a source fact. |
| Label Claim | DRAP / OCR | Distributor, customer submissions | Useful for validation and display only. |
| Images / Packaging Photos | Pharmacy / distributor / customer submissions | OCR | Evidence for pack validation. |
| Pharmacy City / Stock Location | Pharmacy | Distributor | Used for availability and local pricing. |
| Source Timestamp | Source system | Internal analytics | Needed for freshness and conflict resolution. |

## 2. Master field catalogue

The master field catalogue should be field-level, not table-level.

Each field needs:

- source of truth,
- allowed secondary sources,
- confidence score,
- freshness/refresh strategy.

### Master field catalogue

| Field | Source of truth | Secondary sources | Base confidence | Refresh strategy |
|---|---|---|---:|---|
| Registration Number | DRAP | Distributor, OCR | 1.00 | Refresh on DRAP import; revalidate when source changes. |
| Registration Status | DRAP | Distributor, OCR | 0.98 | Daily or per DRAP sync. |
| Registration Date | DRAP | Distributor, OCR | 0.96 | Monthly or on DRAP refresh. |
| Brand Name | DRAP | Pharmacy, distributor, OCR, customer submissions | 0.95 | Daily from commercial sources, weekly from DRAP. |
| Generic Name | DRAP-normalized molecule | Distributor, pharmacy, OCR | 0.97 | On import and whenever molecule rules change. |
| Canonical Molecule | DawaiSaver canonical layer | DRAP, WHO, curated review | 0.96 | Versioned rule refresh; review-driven. |
| Composition Group | DawaiSaver canonical layer | DRAP, OCR, pharmacy | 0.98 | Recompute on any ingredient or normalization change. |
| Strength | DRAP | Distributor, OCR, pharmacy | 0.95 | Refresh on import and OCR validation. |
| Dosage Form | DRAP | OCR, distributor, pharmacy | 0.95 | Refresh on import and normalization change. |
| Route of Administration | DRAP | OCR, distributor, pharmacy | 0.92 | Refresh on import and OCR validation. |
| Pack Size | Distributor/pharmacy | DRAP, OCR, customer submissions | 0.90 | Refresh daily for pharmacy and distributor, weekly for OCR/submissions. |
| Pack Variant | DawaiSaver canonical layer | Pharmacy, distributor, OCR | 0.96 | Recompute whenever pack or count changes. |
| Approved Price | DRAP | Distributor, OCR | 0.93 | Refresh on DRAP updates; treat as slowly changing regulatory value. |
| Market Price | Pharmacy | Distributor, customer submissions, internal analytics | 0.90 | Refresh frequently, ideally daily or near-real-time. |
| Availability | Pharmacy | Distributor, OCR, customer submissions | 0.88 | Refresh frequently, ideally multiple times per day. |
| Manufacturer | Best available source | DRAP, distributor, pharmacy, OCR | 0.86 | Refresh on evidence change; re-review conflicts. |
| Manufacturer Country | Manufacturer registry | DRAP, distributor, OCR | 0.85 | Refresh with manufacturer master updates. |
| Images | Pharmacy/distributor | OCR, customer submissions | 0.80 | Refresh when listing media changes. |
| Therapeutic Category | WHO/ATC | DRAP mapping, curated review | 0.94 | Refresh on WHO mapping updates. |
| Verification Status | DawaiSaver | Internal review, OCR, customer submissions | 0.90 | Refresh whenever confidence or evidence changes. |

## 3. Field conflict rules

Conflict rules should be field-aware, not generic.

### General rules

1. Regulated identity fields always prefer DRAP over commercial sources.
2. Commercial presentation fields prefer current pharmacy/distributor data over DRAP.
3. Customer submissions never override regulated identity by themselves.
4. OCR is evidence, not authority; OCR needs source corroboration.
5. When two sources disagree and no stronger source exists, preserve both values with confidence scores and route to review.

### Concrete conflict examples

| Conflict | Winner | Reason |
|---|---|---|
| Pharmacy says 10 tablets, DRAP says 20 tablets | Depends on field | For pack size, pharmacy wins if supported by listing evidence; for approved price, DRAP may still win. |
| Pharmacy says brand exists, DRAP has no brand | DRAP if registration record exists; otherwise review | Brand is commercial, but DRAP anchors regulated identity. |
| DRAP says approved price 95, pharmacy says market price 68 | Both kept | Approved price and market price are different fields. |
| OCR reads 625mg, DRAP says 500mg + 125mg | DRAP composition wins | OCR is evidence, not authority, unless corroborated by other sources. |
| Distributor shows manufacturer name variant, DRAP shows a different spelling | Best normalized evidence wins | Prefer the highest-confidence normalized manufacturer entity, not raw text. |
| Customer submission says medicine is same as another brand | Never wins alone | Must be validated by composition, strength, form, and route. |
| Pharmacy shows 2x10's and DRAP shows 20 tablets | Normalize to canonical pack variant | Both may represent the same canonical pack. |

### Specific priority by field

- Registration number: DRAP > OCR > distributor > pharmacy > customer.
- Composition and strength: DRAP > OCR corroboration > distributor > pharmacy > customer.
- Pack size: pharmacy/distributor > DRAP > OCR > customer, because pack is commercial packaging truth.
- Market price: pharmacy > distributor > OCR > customer.
- Approved price: DRAP > distributor > OCR.
- Manufacturer: best evidence wins, usually DRAP or distributor.

## 4. Confidence scoring model

Use three layers.

### Source confidence

Source confidence measures how trustworthy a source is for a specific field class.

Example starting values:

| Source | Regulated identity | Composition | Pack | Price | Availability |
|---|---:|---:|---:|---:|---:|
| DRAP | 1.00 | 0.97 | 0.70 | 0.95 for approved price | 0.40 |
| Pharmacy website | 0.60 | 0.55 | 0.90 | 0.98 for market price | 0.98 |
| Distributor catalogue | 0.75 | 0.70 | 0.92 | 0.85 | 0.80 |
| Customer submission | 0.30 | 0.25 | 0.35 | 0.20 | 0.25 |
| Prescription OCR | 0.65 | 0.60 | 0.70 | 0.20 | 0.10 |
| Internal analytics | 0.10 | 0.10 | 0.10 | 0.10 | 0.10 |

### Field confidence

Field confidence is the confidence assigned to a specific value after normalization.

Rules:

- exact match to primary source value gets high confidence,
- normalized value with corroboration gets medium-high confidence,
- OCR-only values are capped lower,
- customer-submitted values are always low unless corroborated.

Suggested score bands:

- 0.95 to 1.00: verified
- 0.80 to 0.9499: likely verified
- 0.60 to 0.7999: partially verified
- below 0.60: needs review

### Record confidence

Record confidence is the weighted aggregate of the most important fields.

Suggested weights:

- Composition group: 25%
- Strength: 15%
- Dosage form: 15%
- Route: 10%
- Registration number: 10%
- Manufacturer: 10%
- Pack size: 10%
- Price: 5%

A record is only customer-ready when:

- composition group confidence >= 0.95,
- strength confidence >= 0.90,
- dosage form confidence >= 0.90,
- route confidence >= 0.85,
- registration number confidence >= 0.95 for regulated views,
- pack confidence >= 0.85 for pack-aware comparison,
- price confidence >= 0.85 for customer comparison.

## 5. AI audit layer

The AI audit layer should detect issues, not silently repair them.

### Audit targets

- Wrong compositions
- Wrong strengths
- Duplicate products
- Incorrect pack sizes
- Invalid substitutions
- Salt normalization errors

### Audit signals

| Signal | Example | Action |
|---|---|---|
| Wrong composition | Brand OCR says one molecule, DRAP shows another | Quarantine and review. |
| Wrong strength | 500mg versus 650mg for same brand | Split into separate records. |
| Duplicate products | Same registration number and same pack repeated | Merge evidence, keep one canonical product. |
| Incorrect pack size | 10 tablets versus 20 tablets for same listing | Create separate pack variants, do not overwrite. |
| Invalid substitution | Pharmacy claims equivalent brand without matching composition | Reject equivalence. |
| Salt normalization error | Sodium salt stripped where it should not be | Mark as unsafe normalization. |

### AI role

The AI layer should:

- propose candidate matches,
- surface contradictions,
- rank likely canonical identities,
- explain why a field is uncertain,
- never auto-overwrite high-confidence regulated fields without review.

## 6. Customer-facing confidence indicators

The customer UI should explain trust level without exposing internal complexity.

### Proposed badges

| Badge | Meaning |
|---|---|
| Verified | Composition, strength, form, route, and registration are strongly confirmed. |
| Partially Verified | Core identity is likely correct, but one or more fields need caution. |
| Community Verified | Supported mainly by customer or OCR evidence, not strong source authority. |
| Needs Review | Not safe for automatic comparison. |

### Badge rules

- Verified requires DRAP or equivalent strong-source backing plus corroboration.
- Partially Verified is acceptable for browse/search, not for automatic savings claims.
- Community Verified may show as a suggestion, but not as authoritative.
- Needs Review should block automatic substitution and savings computation.

## 7. Can missing DRAP fields be recovered from pharmacy sources?

### Manufacturer

Yes, partially.

Pharmacy websites can often provide manufacturer names, but they are not always legally or consistently normalized.

Recommendation:

- use pharmacy manufacturer data as a secondary source,
- validate against distributor or DRAP when possible,
- store manufacturer as an entity with evidence links, not raw text only.

### Pack size

Yes, strongly.

Pharmacy and distributor listings are usually better than DRAP for current pack size.

Recommendation:

- treat pack size as commercial listing truth,
- normalize to canonical pack variants,
- keep source pack text as evidence.

### Market price

Yes, best recovered from pharmacy sources.

Recommendation:

- use pharmacy price as the customer comparison price,
- keep DRAP approved price as a separate regulatory field,
- never mix the two in the same comparison label.

### Images

Yes.

Pharmacy and distributor images are often the best available source.

Recommendation:

- store image provenance,
- OCR images for pack verification,
- use customer-submitted images only as low-confidence supplements.

### Availability

Yes, and pharmacy should be the primary source.

Recommendation:

- availability should be time-stamped,
- stale availability should decay quickly,
- if no recent refresh exists, show `unknown` rather than `available`.

## 8. Complete field ownership matrix

| Field group | Primary source | Secondary source | Confidence | Refresh |
|---|---|---|---:|---|
| Regulatory identity | DRAP | OCR, distributor | Very high | DRAP sync cadence |
| Molecule identity | DRAP + canonical rules | OCR, distributor, pharmacy | Very high | On rule/version change |
| Composition group | DawaiSaver canonical layer | DRAP, OCR, pharmacy | Very high | On any ingredient update |
| Strength | DRAP | OCR, distributor, pharmacy | High | On import and review |
| Dosage form | DRAP | OCR, pharmacy, distributor | High | On import and review |
| Route | DRAP | OCR, distributor, pharmacy | Medium-high | On import and review |
| Pack size | Pharmacy/distributor | DRAP, OCR | High | Frequent |
| Pack variant | DawaiSaver canonical layer | Pharmacy, distributor, OCR | High | On pack refresh |
| Approved price | DRAP | OCR, distributor | High | DRAP refresh cadence |
| Market price | Pharmacy | Distributor, OCR, customers | High | Frequent |
| Availability | Pharmacy | Distributor, OCR, customers | High | Frequent |
| Manufacturer | Best available source | DRAP, distributor, pharmacy, OCR, customers | Medium-high | On evidence change |
| Manufacturer country | Manufacturer registry / DRAP | Distributor, OCR | Medium | On manufacturer refresh |
| Images | Pharmacy | Distributor, OCR, customers | Medium | Frequent |
| Therapeutic category | WHO/ATC | DRAP mapping, analytics | High | On mapping update |
| Images / packaging proof | Pharmacy/distributor | OCR | Medium | Frequent |
| Customer submissions | Supplementary only | OCR can validate | Low | Continuous |
| OCR extractions | Evidence only | All source checks | Medium | On re-OCR |
| Internal analytics | No truth ownership | All | Very low | Continuous |

## 9. Estimated final catalogue completeness after adding pharmacy data

The expected result should be measured in two different ways.

### Customer-facing completeness

For the five golden catalogue identities and most commodity medicines, adding pharmacy data should raise customer-facing completeness from the current DRAP-only readiness of roughly 30% to about 70% to 85% for display, search, pack, price, and availability.

That estimate assumes:

- pack size comes reliably from pharmacy/distributor listings,
- market price comes from pharmacy listings,
- images come from commercial listings,
- DRAP remains the identity anchor.

### Regulatory completeness

Regulatory completeness will improve more slowly.

Expected range:

- roughly 60% to 75% for regulated display fields,
- lower for manufacturer and registration status if DRAP remains sparse,
- higher only when distributor/OCR evidence is repeatedly corroborated.

### Practical view

Adding pharmacy data will mostly solve:

- pack size,
- market price,
- availability,
- images,
- many brand/product presentation gaps.

It will only partially solve:

- manufacturer,
- registration metadata,
- approved price,
- route completeness.

## 10. Recommended implementation order

This should be phased so the catalogue does not become inconsistent while sources are added.

### Phase 1: Canonical field model

- Define the field ownership matrix.
- Build source provenance for every field.
- Separate regulated identity from commercial presentation.

### Phase 2: Field-level evidence store

- Store multiple observations per field.
- Preserve source text, normalized value, confidence, and timestamp.
- Never overwrite without retaining history.

### Phase 3: Canonical medicine identity

- Resolve molecule normalization.
- Build composition groups.
- Bind composition groups to brand products.
- Attach route, strength, and form.

### Phase 4: Pack and price normalization

- Normalize pack variants.
- Attach pack-specific prices.
- Separate approved price from market price.

### Phase 5: Confidence and audit layer

- Add AI anomaly detection.
- Add review queues.
- Add conflict explanations and evidence trails.

### Phase 6: Customer presentation

- Surface verification badges.
- Show brand, pack, price, and regulatory sections.
- Allow search by brand, generic, composition, strength, form, and route.

### Phase 7: OCR and customer feedback loop

- Add prescription OCR.
- Add customer submission review.
- Use feedback to improve weak fields, not to override regulated identity.

## Final recommendation

Recommended long-term DawaiSaver data model:

`Source Observation` -> `Field Evidence` -> `Canonical Field` -> `Canonical Molecule` -> `Composition Group` -> `Brand Product` -> `Pack Variant` -> `Pack Price` -> `Market Availability` -> `Savings Analysis`

Core rules:

- DRAP owns regulated identity.
- Pharmacy owns market truth.
- Distributor fills commercial gaps.
- OCR supports extraction and validation.
- Customer submissions are low-confidence evidence.
- Internal analytics only scores and audits.

The model should be field-first, evidence-preserving, and confidence-scored. That is the safest way to combine DRAP authority with commercial completeness without blurring regulated identity, pack truth, and market price.
