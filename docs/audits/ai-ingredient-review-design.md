# AI Ingredient Review Engine Design

Date: 2026-06-23
Inputs:
- `docs/audits/molecule-salt-gap-analysis.md`
- `docs/audits/ingredient-pattern-analysis.md`
- `docs/audits/ingredient-review-queue.csv`
- WHO importer outputs from `WHO data/WHO ATC-DDD 2026-04-25.csv`
- WHO normalization logic in `src/modules/atc/molecule-normalizer.service.ts`

## Executive summary

The current review queue is already small enough to operationalize with AI assistance.

- Unmatched ingredient strings in scope: **862**
- Total occurrences represented by those strings: **10,574**
- Auto-candidate rows: **823**
- Review-candidate rows: **34**
- Manual-review rows: **5**
- Top 500 prioritized rows: **500**
- Top 500 share of unmatched occurrences: **8,513 / 10,574 = 80.51%**

The WHO importer outputs are strong enough to seed the alias bridge:

- `WHO data/WHO ATC-DDD 2026-04-25.csv` dry-runs to **4,937 canonical molecules**
- The same import flow yields **19,748 alias seeds**
- `WHO data/who-molecule-mappings.json` is present as a small seed sample, but the CSV importer output is the meaningful production-scale source

## 1) Current review queue audit

### Queue status distribution

| Status | Rows | Share |
| --- | ---: | ---: |
| auto_candidate | 823 | 95.47% |
| review_candidate | 34 | 3.94% |
| manual_review | 5 | 0.58% |

### Confidence distribution

| Confidence | Rows |
| --- | ---: |
| 0.99 | 761 |
| 0.96 | 62 |
| 0.92 | 14 |
| 0.91 | 5 |
| 0.83 | 15 |
| 0.79 | 5 |

### Pattern distribution from the unmatched-ingredient audit

| Pattern | Distinct strings | Occurrences |
| --- | ---: | ---: |
| exact-normalization | 761 | 9,554 |
| spelling_variant | 62 | 576 |
| salt_variant | 15 | 174 |
| eq_to | 14 | 169 |
| combination | 5 | 55 |
| descriptor_noise | 5 | 46 |

### Prioritized top-500 slice

The operational candidate set is the first 500 ordered rows of `docs/audits/ingredient-review-queue.csv`.

| Metric | Value |
| --- | ---: |
| Candidate rows | 500 |
| Auto-candidate rows | 477 |
| Review-candidate rows | 22 |
| Manual-review rows | 1 |
| Average confidence | 0.9829 |
| Minimum confidence | 0.79 |
| Maximum confidence | 0.99 |
| Occurrence coverage | 80.51% |

### Top 25 exemplar candidates

| raw_ingredient | suggested_canonical_molecule | confidence | match_pattern | reasoning |
| --- | --- | ---: | --- | --- |
| Atomoxetine hydrochloride eq. to Atomoxetine | Atomoxetine | 0.99 | eq_to / salt_variant | Strip the equivalence phrase and normalize salt wording to one canonical molecule. |
| Enteric coated pellets of Esomeprazole Magnesium Trihydrate eq. to Esomeprazole | Esomeprazole | 0.99 | descriptor_noise / eq_to | Same active molecule, packaging descriptor noise, and an equivalence phrase. |
| Artemether + Lumefantrine | Artemether + Lumefantrine | 0.99 | combination | Combination product is already explicit and stable. |
| Atomoxetine as hydrochloride | Atomoxetine | 0.99 | salt_variant | Salt form is explicit and canonicalization is deterministic. |
| Tazobactam sodium eq to tazobactam | Tazobactam | 0.99 | eq_to / sodium_salt | Salt naming normalizes to the same active molecule bridge. |
| Clavulanic potassium eq to clavulanic acid | Clavulanic Acid | 0.99 | eq_to / potassium_salt | Potassium salt wording resolves to the canonical clavulanic acid bridge. |
| Ezetimibe + Simvastatin | Ezetimibe + Simvastatin | 0.99 | combination | Two active ingredients, no ambiguity. |
| Piperacillin (as sodium) | Piperacillin | 0.99 | sodium_salt | Salt notation normalization only. |
| Tazobactam (as sodium) | Tazobactam | 0.99 | sodium_salt | Salt notation normalization only. |
| - | Elemental Iron | 0.99 | descriptor_noise | Placeholder / malformed ingredient text should be normalized into the elemental-iron bridge. |
| Cefepime hydrochloride with L-arginine eq. to Cefepime | Cefepime | 0.99 | salt_variant / eq_to | Combination salt phrase collapses to the cefepime canonical bridge. |
| Cefepime as HCl with L-arginine eq. to Cefipime | Cefepime | 0.99 | spelling_variant / salt_variant | Typo and salt normalization both resolve to cefepime. |
| Alendronate (as sodium) | Alendronate | 0.99 | sodium_salt | Only punctuation and casing differ. |
| Doxazosin (as mesylate) | Doxazosin | 0.99 | mesylate | Salt spelling normalization resolves safely. |
| Sterile Ceftriaxone (as Sodium) | Ceftriaxone | 0.99 | salt_variant | Stable active ingredient, sterilization descriptor retained separately. |
| Ceftazidime as pentahydrate with sodium carbonate | Ceftazidime | 0.99 | hydrate | Hydrate normalization with a clear ceftazidime bridge. |
| Sterile Cephradine Arginine eq. to Cephradine Base | Cephradine | 0.99 | eq_to / salt_variant | Base-vs-salt mapping is explicit. |
| Artemether + Lumifantrine | Artemether + Lumefantrine | 0.99 | spelling_variant | Single spelling correction is sufficient. |
| Tiotropium (as bromide monohydrate) | Tiotropium | 0.99 | hydrate | Hydrate wording normalizes safely. |
| Bosentan Monohydrate eq to Bosentan | Bosentan | 0.99 | hydrate / eq_to | Hydrate bridge plus equivalence phrase. |
| Esomeprazole enteric coated pellets (22.5% w/w) eq. to Esomeprazole | Esomeprazole | 0.99 | descriptor_noise / eq_to | Strong evidence for the same molecule hidden behind formulation text. |
| Galantamine HBr eq to galantamine | Galantamine | 0.99 | salt_variant / eq_to | Known salt bridge with canonical galantamine. |
| Ceftazidime as Pentahydrate buffered with sodium carbonate | Ceftazidime | 0.99 | hydrate | Hydrate normalization, buffer text retained as metadata. |
| Mupirocin(as calcium) | Mupirocin | 0.99 | salt_variant / hydrate | Salt and hydrate wording are both normalizable. |
| Artemether+Lumefantrine | Artemether + Lumefantrine | 0.99 | combination | Separator normalization only. |

## 2) AI review workflow

### Input

Raw ingredient strings from DRAP import rows, WHO alias seeds, OCR extraction, pharmacy catalogs, and future distributor feeds.

### Output

For each raw ingredient:

- canonical molecule
- confidence score
- reasoning
- match pattern
- review status

### Workflow

1. Normalize punctuation, casing, separators, and stop-words.
2. Detect pattern class: salt, hydrate, eq-to, combination, spelling, descriptor noise, or unsafe/ambiguous.
3. Search canonical molecule candidates from:
   - WHO alias seeds
   - curated canonical molecule table
   - prior approved alias history
4. Score the candidate.
5. Route to one of three lanes:
   - auto-approve
   - AI-suggested + human spot-check
   - manual review
6. Persist the approved alias bridge and history row.

### Recommended review thresholds

| Confidence | Action |
| --- | --- |
| 0.95 to 1.00 | auto-approve |
| 0.90 to 0.94 | AI-suggested, human spot-check |
| 0.80 to 0.89 | human review required |
| below 0.80 | manual review only |

The current queue distribution supports those thresholds well: 823 of 862 rows are already above the auto-approve band.

## 3) Pattern classification design

| Pattern | Detection idea | Canonical handling |
| --- | --- | --- |
| salt_variant | salt tokens such as hydrochloride, sodium, potassium, mesylate, fumarate, sulfate | Map to the approved canonical molecule bridge and preserve the salt as alias evidence |
| hydrate | monohydrate, dihydrate, trihydrate, pentahydrate | Treat hydrate as a normalization attribute, not a separate medicine identity |
| hydrochloride | HCl / hydrochloride / hydrochloride salt variants | Collapse to the canonical molecule if the base is the same |
| sodium salt | as sodium / sodium salt | Same canonical molecule with salt evidence attached |
| potassium salt | as potassium / potassium salt | Same canonical molecule with salt evidence attached |
| mesylate | as mesylate / mesilate | Same canonical molecule with salt evidence attached |
| fumarate | as fumarate / hydrogen fumarate | Same canonical molecule with salt evidence attached |
| eq_to | eq. to / eq to / corresponding to / equivalent to | Split the active molecule from the comparison phrase |
| spelling_variant | obvious OCR or spelling error | Normalize only if confidence stays high |
| combination product | `+`, `and`, `with` between multiple actives | Promote to composition-group review, not single-molecule collapse |
| descriptor_noise | enteric coated, pellets, sterile, buffered, % w/w, "contains" boilerplate | Remove from molecule identity and retain as formulation metadata |

## 4) Proposed database design

No schema change is being implemented here. This is the target proposal only.

### `ingredient_review_queue`

Purpose: one current work item per unmatched ingredient.

Suggested fields:

- id
- raw_ingredient
- normalized_ingredient
- occurrence_count
- suggested_canonical_molecule_id
- suggested_canonical_molecule_name
- match_pattern
- confidence_score
- review_status
- source_system
- source_document
- model_version
- ai_reasoning
- created_at
- updated_at

### `ingredient_review_history`

Purpose: immutable audit trail for every review decision.

Suggested fields:

- id
- ingredient_review_queue_id
- previous_status
- new_status
- previous_suggestion
- new_suggestion
- confidence_score
- reasoning
- actor_type
- actor_id
- created_at

### `ingredient_aliases`

Purpose: approved synonym bridge between raw terms and canonical molecules.

Suggested fields:

- id
- canonical_molecule_id
- alias_text
- alias_normalized
- alias_type
- source_system
- source_document
- source_confidence
- approved_by
- approved_at
- created_at

### Suggested indexes

- `ingredient_review_queue(normalized_ingredient)`
- `ingredient_review_queue(confidence_score, review_status)`
- `ingredient_aliases(alias_normalized)`
- `ingredient_aliases(canonical_molecule_id, alias_type)`

## 5) Top 500 AI-review candidate plan

The top 500 candidate set is already ordered in `docs/audits/ingredient-review-queue.csv`.

Operationally, the AI review engine should:

- read the first 500 rows as the high-priority queue slice
- assign a pattern label
- generate a canonical suggestion
- write a reason string
- keep the original raw ingredient as immutable evidence

The first 500 rows are the high-value slice because they cover **80.51%** of the unmatched occurrences.

## 6) Recovery estimate

### Queue-scope recovery

| Stage | Products | Composition signatures | Notes |
| --- | ---: | ---: | --- |
| auto-candidate immediate recovery | 11,744 | 514 | high-confidence rows only |
| remaining after human approval | 34,686 | 5,030 | full queue approval completes the tail |
| total queue-scope recovery | 46,430 | 5,544 | full in-scope recovery after review |

### Practical AI impact

- The AI layer should remove almost all pure normalization work from human reviewers.
- Human work should concentrate on the 34 review-candidate rows and 5 manual edge cases.
- The biggest accuracy gain comes from making the alias bridge reviewable, versioned, and source-backed instead of relying on text heuristics alone.

### WHO alias seed impact

The WHO importer already generates **19,748 alias seeds** from the CSV normalization flow. Those seeds should be ingested as first-class alias candidates and ranked above ad hoc text matches when the evidence is strong.

Inference: once the WHO alias seeds are merged into the review workflow, a meaningful portion of the remaining 39 ambiguous rows should drop into the auto or review lane. Exact lift must be measured after ingestion because the current repository does not persist the WHO alias tables yet.

## 7) Recommended implementation roadmap

### Phase 1

- Add the review queue model and history trail.
- Ingest the existing 862 unmatched ingredients.
- Seed WHO alias candidates into the same workflow.

### Phase 2

- Add pattern classifier and confidence scorer.
- Add human review UI and approval actions.

### Phase 3

- Promote approved aliases into the canonical molecule bridge.
- Recompute match coverage and recovery metrics.

### Phase 4

- Use the alias bridge in downstream composition matching and catalogue comparison.

## 8) Final recommendation

Build the review engine as a conservative, auditable triage system:

- canonical molecule stays the identity anchor
- alias evidence stays versioned and reviewable
- salt, hydrate, spelling, and eq-to logic become AI-assisted suggestions rather than silent transforms
- combination products stay at composition-group level

This is enough to replace manual ingredient review safely without losing provenance.
