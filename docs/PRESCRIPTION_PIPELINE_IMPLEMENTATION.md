# Prescription Pipeline Implementation

## Architecture

The prescription processing pipeline is a backend-only flow that converts user-provided prescription text or mock uploads into reviewable prescription records, parsed medicine items, match results, and cost estimates.

Modules involved:

- `src/modules/prescriptions/`
- `src/modules/ocr/`
- `src/modules/matching/`
- `src/modules/price-intelligence/`

## Workflow

1. Accept plain text or mock upload input.
2. Extract text through the OCR abstraction when an image reference is supplied.
3. Parse the text into raw medicine lines.
4. Match each line against canonical medicine data.
5. Persist prescription items, processing jobs, and cost estimates.
6. Mark low-confidence items as review-required.
7. Return a structured result with safety warnings and savings estimates.

## Recovery Procedure

If prescription processing needs to be resumed after a failure:

- Re-read the persisted `prescriptions` row.
- Rehydrate the stored prescription items.
- Rebuild the cost-estimate context from price observations.
- Re-run the review workflow for unresolved items.
- Preserve audit logs and source attribution.

## Safety Rules

- Do not advise medicine replacement.
- Use the phrase: "Equivalent options with same active ingredient, strength, and dosage form."
- Flag high-risk medicines for manual review.
- Preserve OCR/text provenance and confidence scores.

