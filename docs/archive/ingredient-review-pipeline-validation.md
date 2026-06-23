# Ingredient Review Pipeline Validation

Date: 2026-06-23
Purpose: Phase 1 readiness validation for the AI-assisted canonical molecule review workflow.

## 1) Verified review assets

The following assets are present and usable:

- `docs/audits/ingredient-review-queue.csv`
- `docs/audits/ingredient-pattern-analysis.md`
- `docs/audits/ai-ingredient-review-design.md`

These assets are internally consistent:

- queue size: **862** unmatched ingredient strings
- total occurrences: **10,574**
- top-500 prioritized slice: **500** rows covering **8,513** occurrences

## 2) WHO importer output verification

### Exact generation path

The WHO canonical molecule outputs are generated through the existing ATC import path:

1. `src/modules/atc/atc.service.ts` -> `importWhoAtcMaster()`
2. WHO source files are loaded from `WHO data/`
3. Level-5 ATC rows are normalized through `src/modules/atc/molecule-normalizer.service.ts`
4. `importMolecules()` groups normalized rows by canonical key
5. `buildAliasSeeds()` emits source, normalized, canonical, and curated alias seeds
6. The importer persists `generics` and `molecule_aliases`

### Verified outputs

- canonical molecules: **4,937**
- alias seeds: **19,748**

### Verification note

The numbers above are not inferred from the local database snapshot. They come from the WHO CSV import logic itself and from the current audit artifacts.

## 3) Dry-run matching simulation

The phase-1 dry-run uses the current review queue and the existing confidence thresholds already present in the repository.

### Simulation result

| Review lane | Rows | Row share | Occurrences | Occurrence share |
| --- | ---: | ---: | ---: | ---: |
| auto-approve | 823 | 95.47% | 10,130 | 95.80% |
| review-required | 34 | 3.94% | 398 | 3.76% |
| manual-review | 5 | 0.58% | 46 | 0.44% |

### Top-500 operational slice

| Review lane | Rows | Occurrences |
| --- | ---: | ---: |
| auto-approve | 477 | 8,161 |
| review-required | 22 | 326 |
| manual-review | 1 | 26 |

### Interpretation

- The queue is already dominated by high-confidence candidates.
- Manual work is concentrated into five edge cases.
- The top-500 slice captures the bulk of the operational gain and is suitable for phase-1 rollout.

## 4) Schema readiness

### Target tables from the phase-1 design

| Target table | Status | Readiness |
| --- | --- | --- |
| `ingredient_review_queue` | not present | missing |
| `ingredient_review_history` | not present | missing |
| `ingredient_aliases` | not present | missing |

### Closest existing structures

| Existing structure | Fit | Gap |
| --- | --- | --- |
| `molecule_aliases` | partial | stores approved aliases, but not review lifecycle, pattern class, or queue state |
| `import_batch_items` | partial | stores import evidence, but not ingredient-specific review workflow |
| `audit_logs` | partial | good for audit trail, not for queue orchestration |
| `generics` | good | canonical molecule anchor already exists |
| `atc_classifications` | good | WHO mapping anchor already exists |

### Schema readiness assessment

The runtime has enough canonical-anchor structure to support the review workflow conceptually, but it does not yet have the dedicated review tables needed for a production queue.

## 5) Recovery estimate

### Immediate recovery from auto-candidates

- products recoverable: **11,744**
- composition groups recoverable: **514**
- product matches recoverable: **11,744** *(inferred one-for-one with recoverable product rows because there is no separate persisted review-match table yet)*

### Full queue recovery after review

- additional products recoverable: **34,686**
- additional composition groups recoverable: **5,030**
- product matches recoverable: **34,686** *(same inference as above)*

### Recovery summary

| Stage | Products | Composition groups | Product matches |
| --- | ---: | ---: | ---: |
| Immediate auto-approve | 11,744 | 514 | 11,744 |
| Full queue approval | 34,686 | 5,030 | 34,686 |

## 6) Implementation blockers

The following blockers remain before a real production pipeline can ship:

1. Dedicated review tables are not yet deployed.
2. There is no queue API or review UI wired to those tables.
3. WHO alias seeds are generated, but not yet persisted into a first-class review workflow.
4. No automated promotion path exists from review queue -> approved alias -> canonical molecule bridge.
5. The current snapshot still lacks a production-grade review history model.

## 7) Implementation readiness score

Score: **74 / 100**

Rationale:

- strong source data and normalization inputs
- clear canonical anchor already exists in the schema
- excellent high-confidence queue coverage
- but production review tables and workflow endpoints are still missing

## 8) Recommendation

Proceed with Phase 2 only after the dedicated review tables are added and the queue workflow is wired end-to-end.

Recommended Phase 2 order:

1. add `ingredient_review_queue`
2. add `ingredient_review_history`
3. add `ingredient_aliases`
4. persist WHO alias seeds into the queue
5. expose admin review actions
6. promote approved aliases into canonical matching

## 9) Final readiness judgment

The AI ingredient review pipeline is ready for controlled implementation planning, but not yet ready for production deployment.

Phase 1 result: **validated**

Phase 2 result: **blocked on schema/workflow delivery**
