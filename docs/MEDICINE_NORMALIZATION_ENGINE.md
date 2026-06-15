# Medicine Normalization Engine

## Purpose

The medicine normalization engine converts messy medicine data into canonical signatures suitable for deduplication, equivalence mapping, search, and price comparison.

## Unified Medicine Signature

Example:

```text
amoxicillin_clavulanic_acid_625mg_tablet
```

## Normalized Dimensions

- brand name
- generic ingredient names
- strength
- dosage form
- pack size
- manufacturer
- route, where available
- registration number, where available

## Normalization Steps

1. Clean text and remove source-specific noise.
2. Resolve known aliases.
3. Parse strength and units.
4. Parse dosage form.
5. Normalize ingredient order.
6. Normalize manufacturer identity.
7. Generate canonical signature.
8. Match against existing products.
9. Assign confidence score.
10. Send ambiguous records to review.

## Duplicate Detection

Duplicate candidates are detected using:

- exact canonical signature match
- normalized brand and manufacturer match
- generic composition match
- pack and strength match
- fuzzy text similarity
- registration number match

## Confidence Bands

- 0.95 to 1.00: auto-match candidate, audit required
- 0.80 to 0.94: review recommended
- 0.50 to 0.79: provisional record
- below 0.50: unresolved record

## Medicine Matching Engine

The Medicine Matching Engine is the canonical identity layer for normalized medicine data.

Module:

- `src/modules/matching/`

Database tables:

- `canonical_products`
- `canonical_product_aliases`
- `product_matches`
- `match_reviews`
- `matching_rules`

Matching dimensions:

- brand name
- generic name
- strength
- dosage form
- manufacturer
- pack size
- registration number
- medicine signature

Match results:

- `matched`
- `possible_match`
- `needs_review`
- `unmatched`

See `docs/MEDICINE_MATCHING_ENGINE.md` for architecture, workflows, confidence rules, review workflow, and recovery procedures.
