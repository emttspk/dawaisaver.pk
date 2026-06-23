# CURRENT UPDATE

Date: 2026-06-23
Project: DawaiSaver.pk
Update: Ingredient Review Queue and Canonical Molecule Recovery Dataset

## Key findings

- Conservative unmatched ingredient review queue generated for 862 strings.
- Pattern analysis written to `docs/audits/ingredient-pattern-analysis.md`.
- Review queue written to `docs/audits/ingredient-review-queue.csv`.
- WHO importer artifacts discovered locally:
  - `WHO data/who-molecule-mappings.json`
  - `WHO data/WHO ATC-DDD 2026-04-25.csv`
- Immediate auto-candidate recovery covers 11,744 product rows and 514 composition signatures.

## Notes

- No code, schema, or migration changes were made.
- Superseded WHO recovery note archived at `docs/archive/who-catalog-recovery-analysis.md`.
