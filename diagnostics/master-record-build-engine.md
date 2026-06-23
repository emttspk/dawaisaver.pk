# DawaiSaver Master Record Build Engine Design

Date: 2026-06-23

Basis used:

- `diagnostics/medicine-master-data-model.md`
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

## 1. Ingestion flow

The build engine converts source observations into approved Medicine Master Records using this pipeline:

`Source Observation -> Field Candidate -> Evidence -> Normalization -> Master Record`

Stage definitions:

- Source Observation
  - Raw input from DRAP, pharmacy, distributor, OCR, or customer evidence.
  - May be structured, semi-structured, or extracted from images.
- Field Candidate
  - A proposed value for a master field, attached to a source and timestamp.
- Evidence
  - Immutable proof that supports the candidate value.
- Normalization
  - Canonicalizing molecules, strength, dosage form, route, and pack.
- Master Record
  - The merged authoritative record used for publication decisions.

Engine rule:

- No source observation becomes a customer record until it has passed normalization and review gating.

## 2. Merge rules

### When to create a new master record

Create a new master record when:

- no existing composition group matches the normalized composition + strength + dosage form + route signature,
- or the record is a confirmed new regulated identity,
- or the source observation represents a new pack variant under an existing product family,
- or the source evidence is too ambiguous to safely merge.

### When to update an existing master record

Update an existing master record when:

- the composition group matches exactly,
- the regulated identity matches the same DRAP registration number,
- or the observation is a clearly higher-confidence source for a non-regulated commercial field.

### When to create a new composition group

Create a new composition group when:

- the canonical comparison signature is not already present,
- and the molecule / strength / dosage form / route combination is distinct,
- and the record does not collapse safely into an existing approved canonical identity.

### When to create a new pack variant

Create a new pack variant when:

- the brand product matches,
- the composition group matches,
- but the pack shape, unit count, or pack quantity differs,
- or the source introduces a new sellable pack configuration.

## 3. Conflict resolution

### Different manufacturer

Rules:

- If DRAP and pharmacy agree, keep the shared value.
- If DRAP has the regulated manufacturer and pharmacy differs, prefer DRAP for regulated identity and keep pharmacy as commercial evidence.
- If multiple pharmacy sources conflict, prefer the source with the best evidence and strongest recent validation.
- If conflict persists, flag for human review.

### Different pack size

Rules:

- Pack size is commercial truth, so pharmacy or distributor may override a stale DRAP pack value.
- If pack size mismatch changes the sellable unit, create a new pack variant rather than overwriting the existing one.
- If the mismatch is only a formatting difference, normalize it.

### Different strength

Rules:

- Strength is comparison-critical.
- If strength differs, do not merge into the same composition group.
- If strength was misread or presented in equivalent notation, normalize it only when equivalence is certain.
- Otherwise flag for manual review.

### Different route

Rules:

- Route is comparison-critical.
- Different routes create distinct comparison identities.
- Do not merge across route differences.
- If route is missing, infer only with high confidence; otherwise hold for review.

## 4. Confidence scoring engine

The scoring engine should track three levels:

- Source confidence
- Field confidence
- Record confidence

### Source confidence

Based on source type and evidence quality:

- DRAP: highest for regulated identity
- Pharmacy: highest for market pack and price
- Distributor: strong for pack and manufacturer
- OCR: medium, evidence-dependent
- Customer evidence: lowest until confirmed

### Field confidence

Field confidence combines:

- source confidence,
- recency,
- directness of evidence,
- agreement with other sources,
- normalization certainty.

### Record confidence

Record confidence is an aggregate of required field confidence values.

Publication guidance:

- Required fields must all exceed threshold.
- Any regulated-field conflict lowers record confidence sharply.
- Pack and price confidence are weighted heavily for customer-facing publication.

Suggested confidence bands:

- 95–100: publish-ready with minimal review
- 85–94: human review required
- 70–84: enrichment usable, not publishable
- below 70: draft only

## 5. Publication gates

What blocks publication:

- missing registration number,
- missing composition group,
- missing strength,
- missing dosage form,
- missing route,
- missing brand,
- missing pack variant,
- missing manufacturer,
- missing price,
- unresolved regulated conflict,
- confidence below threshold,
- no human approval,
- no evidence attached.

What triggers manual review:

- manufacturer conflict,
- pack-size conflict,
- strength ambiguity,
- route ambiguity,
- duplicate composition groups,
- suspicious price anomaly,
- broad molecule mapping,
- low-confidence OCR extraction,
- new pack variant with uncertain normalization,
- source disagreement on regulated identity.

## 6. Source-priority rules

Field-by-field ownership:

| Field | Priority 1 | Priority 2 | Priority 3 | Priority 4 | Priority 5 |
|---|---|---|---|---|---|
| Registration number | DRAP | OCR | Distributor | Pharmacy | Customer |
| Approved price | DRAP | OCR archive | None | None | None |
| Registration date | DRAP | OCR | Archive | None | None |
| Composition group | Canonical engine | DRAP | Pharmacy | Distributor | OCR |
| Generic molecule | Canonical engine | WHO | DRAP | Pharmacy | OCR |
| Strength | DRAP | Pharmacy | Distributor | OCR | Customer |
| Dosage form | DRAP | Pharmacy | OCR | Distributor | Customer |
| Route | DRAP | WHO | Pharmacy | OCR | Customer |
| Brand | Pharmacy | Distributor | DRAP | OCR | Customer |
| Manufacturer | Best available source | DRAP | Pharmacy | Distributor | OCR |
| Pack size | Pharmacy | Distributor | DRAP | OCR | Customer |
| Market price | Pharmacy | Distributor | OCR | Customer | None |
| Availability | Pharmacy | Distributor | OCR | Customer | None |
| Image evidence | Pharmacy | Distributor | OCR | Customer | None |
| Therapeutic category | WHO / ATC | Internal mapping | DRAP | Pharmacy | None |

Rule:

- Regulated fields always prefer DRAP first.
- Commercial fields always prefer live commercial sources first.
- Canonical identity always prefers the normalization engine over raw source labels.

## 7. Pack normalization engine

The pack normalizer must convert common pack expressions into structured fields.

Examples:

- `10 Tablets`
  - unit_count: 10
  - unit_type: tablet
  - pack_shape: single strip or pack
- `20 Tablets`
  - unit_count: 20
  - unit_type: tablet
  - pack_shape: single pack
- `2x10 Tablets`
  - unit_count: 20
  - package_count: 2
  - units_per_package: 10
  - unit_type: tablet
- `5x20 Capsules`
  - unit_count: 100
  - package_count: 5
  - units_per_package: 20
  - unit_type: capsule
- `120ml Syrup`
  - volume_ml: 120
  - unit_type: ml
  - dosage_form: syrup

Normalization rules:

- Preserve original text.
- Convert to canonical numeric fields.
- Keep unit type explicit.
- Do not merge packs that differ in sellable quantity.

Pack merge rule:

- If the normalized unit count differs, create a new pack variant.

## 8. Price update engine

When a new pharmacy price arrives:

1. Attach it to the matching pack variant.
2. Compare it against the latest active price for that pack.
3. Store the new price as a dated price event.
4. Preserve the full price history.
5. Mark the record for anomaly checks if the change exceeds thresholds.

History storage:

- Keep price timestamps.
- Keep source name.
- Keep source URL.
- Keep previous price.
- Keep discount metadata if present.

Anomaly detection:

- sudden large increase,
- sudden large decrease,
- mismatch with known pack size,
- per-unit price outside expected band,
- price that implies impossible discount,
- stale price older than acceptable freshness window.

Price rule:

- Price belongs to pack variant, not to the comparison identity.

## 9. AI audit integration

AI should act as follows:

- Merge
  - Only when the composition identity and pack logic are highly confident.
- Suggest
  - When confidence is moderate but not enough to auto-merge.
- Flag
  - When the system sees likely issues but cannot prove them.
- Reject
  - When the source contradicts critical regulated fields or creates a safety risk.

AI must automatically flag:

- duplicate products,
- wrong strengths,
- wrong compositions,
- wrong packs,
- wrong classifications,
- price anomalies.

AI must not auto-publish records with unresolved critical conflicts.

## 10. Admin review queue creation

Review tasks should be created when:

- a new composition group is formed,
- a new pack variant is proposed,
- DRAP and pharmacy conflict on regulated or critical fields,
- pack normalization confidence is low,
- price anomaly is detected,
- OCR evidence disagrees with structured source data,
- duplicate candidates are found,
- confidence is below publication threshold,
- a record is ready for final approval.

Task types:

- composition review,
- pack review,
- manufacturer review,
- price review,
- conflict resolution review,
- publication approval review.

## 11. Catalogue build lifecycle

Lifecycle states:

`Draft -> Enriched -> AI Reviewed -> Human Reviewed -> Approved -> Published`

State behavior:

- Draft
  - raw ingestion only.
- Enriched
  - source candidates attached and normalized.
- AI Reviewed
  - automated checks completed.
- Human Reviewed
  - reviewer confirmed or corrected the record.
- Approved
  - all required gates passed.
- Published
  - visible to customers.

Transition rules:

- Draft -> Enriched
  - at least one source observation matched.
- Enriched -> AI Reviewed
  - normalization complete.
- AI Reviewed -> Human Reviewed
  - review task resolved.
- Human Reviewed -> Approved
  - confidence and field completeness thresholds met.
- Approved -> Published
  - publication policy passes and no active blocking conflicts exist.

## 12. MVP workflow

### Paracetamol 500mg Tablet

Lifecycle trace:

1. DRAP observation arrives with regulated identity.
2. Dawaai observation confirms brand, pack, manufacturer, price, and image.
3. Normalizer creates canonical comparison identity:
   - `Paracetamol|500mg|Tablet|Oral`
4. Pack parser creates the matching pack variant.
5. Price engine stores the pack-linked price.
6. AI audit confirms no blocking conflicts.
7. Human reviewer approves the master record.
8. Record becomes publishable.

### Ibuprofen 400mg Tablet

Lifecycle trace:

1. DRAP observation arrives with regulated identity.
2. Dawaai observation confirms exact 400mg commercial product.
3. Normalizer creates canonical comparison identity:
   - `Ibuprofen|400mg|Tablet|Oral`
4. Pack parser normalizes `20x10's`.
5. Alternate brands are captured as equivalent commercial options.
6. Price engine stores pack-linked price evidence.
7. AI audit flags image limitations if present but no blocking identity conflict.
8. Human reviewer confirms publication readiness.

### Amoxicillin 500mg Capsule

Lifecycle trace:

1. DRAP observation arrives with regulated identity.
2. Dawaai observation confirms exact commercial product.
3. Normalizer resolves the canonical identity:
   - `Amoxicillin|500mg|Capsule|Oral`
4. Pack parser normalizes `5x20's`.
5. Price engine stores pack-linked price.
6. AI audit confirms normalization is acceptable.
7. Human reviewer approves the record.
8. Record becomes publishable.

## 13. Recommended catalogue build architecture

Recommended architecture:

- Source ingestion should remain multi-source.
- Master records should be the central build target.
- Composition groups should be the authoritative comparison identity.
- Pack variants should carry the commercial price.
- Human review should remain mandatory for publication.

Recommended automation level:

- High automation for ingestion, normalization, pack parsing, and candidate matching.
- Medium automation for conflict suggestions and duplicate detection.
- Low automation for final approval of regulated or ambiguous records.

Recommended manual review thresholds:

- any regulated field conflict,
- confidence below 85 for publication,
- any new composition group,
- any new pack variant with unclear parsing,
- any price anomaly above acceptable band,
- any source disagreement on strength, route, or dosage form,
- any record destined for customer publication.
