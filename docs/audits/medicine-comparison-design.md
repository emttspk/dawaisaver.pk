# Medicine Comparison Design

Date: 2026-06-23
Scope: Phase 8 Medicine Comparison

## 1. Comparison Logic

### Eligibility
Products can only be compared when they belong to the same validated composition group:

- Same canonical composition
- Same per-ingredient strength
- Same dosage form and release characteristics
- Same route of administration

### Comparison Factors

| Factor | Weight | Description |
|--------|--------|-------------|
| Brand | 0.2 | Manufacturer brand strength |
| Generic | 0.3 | Generic name match |
| Strength | 0.3 | Per-ingredient strength match |
| Manufacturer | 0.2 | Manufacturer match |

## 2. Pack Eligibility

Direct pack savings require:
- Same normalized unit type
- Same normalized quantity or content
- Valid numeric prices
- Compatible availability and freshness rules

### Pack Normalization

| Presentation | Primary normalization |
|--------------|----------------------|
| Tablets | Count; cost per tablet |
| Capsules | Count; cost per capsule |
| Syrups | Bottle count and volume in ml; cost per ml |
| Drops | Bottle count and volume in ml; cost per ml |
| Creams | Tube/container count and weight in g; cost per g |
| Ointments | Tube/container count and weight in g; cost per g |
| Injections | Container count plus vial/ampoule type; cost per container |
| Vials | Vial count, volume/content where present; cost per vial |
| Ampoules | Ampoule count and volume; cost per ampoule |
| Inhalers | Device count and metered doses; cost per dose |

## 3. Savings Calculation

```
saving_amount = current_pack_price - cheapest_equivalent_pack_price
saving_percent = (saving_amount / current_pack_price) × 100
```

### Unit Price Rules

- Tablet/capsule: per item
- Liquid/drops: per ml
- Cream/ointment: per g
- Vial/ampoule: per container, with optional per ml
- Inhaler: per metered dose

## 4. Exceptions

- Different pack quantities may show unit-price comparison but not direct "you save" claims
- A normalized quantity projection may be shown only as a clearly labelled estimate
- Different routes, forms, release types, concentrations, or strengths are never substitutes
- Missing route or pack normalization disables savings
- Approved price is not automatically the current or cheapest market price
- Negative savings display as "current selection is cheapest"

## 5. API Endpoints

- `POST /api/catalogue/savings` - Calculate savings
- `GET /api/catalogue/groups/:id/compare` - Compare products in group

## 6. Completion Status

| Task | Status |
|------|--------|
| Define comparison logic | ✅ Complete |
| Implement eligibility rules | ⏳ Pending |
| Implement savings calculation | ⏳ Pending |
| Create design document | ✅ Complete |