# CURRENT UPDATE

Date: 2026-06-23
Project: DawaiSaver.pk
Update: AI Ingredient Review Engine Design

## Key findings

- Current unmatched-ingredient review queue contains 862 strings with 10,574 total occurrences.
- Confidence distribution is heavily concentrated in high-confidence rows: 823 auto-candidates, 34 review-candidates, and 5 manual-review items.
- The AI review design has been captured in `docs/audits/ai-ingredient-review-design.md`.
- The top 500 prioritized rows cover 80.51% of unmatched occurrences.
- WHO importer outputs remain the strongest alias seed source:
  - `WHO data/who-molecule-mappings.json`
  - `WHO data/WHO ATC-DDD 2026-04-25.csv`
- The WHO CSV import flow yields 4,937 canonical molecules and 19,748 alias seeds.
- The queue-scope recovery estimate still stands at 11,744 immediate product rows and 514 immediate composition signatures for auto-candidates.

## Notes

- No code, schema, or migration changes were made.
- Superseded notes archived at `docs/archive/who-catalog-recovery-analysis.md` and `docs/archive/CURRENT_UPDATE-2026-06-23-ai-ingredient-review-design.md`.
