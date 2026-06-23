# Catalog Search Design

Date: 2026-06-23
Scope: Phase 7 Catalog Search

## 1. Search Pipeline Architecture

```
User Input
    │
    ▼
Parse (brand/generic/composition/strength/form/route)
    │
    ▼
Normalize (brand, generic, strength, form, route)
    │
    ▼
Resolve (brand → product, generic → composition group)
    │
    ▼
Return (products, groups, alternatives)
```

## 2. Search Fields

### Brand Search
- Normalize brand name
- Match against `products.normalizedBrand`
- Return product and canonical group

### Generic/Molecule Search
- Normalize generic name
- Match against `generics.normalizedName`
- Match against `ingredient_aliases.normalizedValue`
- Match against `molecule_aliases.normalizedAliasName`
- Return composition groups

### Salt Search
- Parse salt variants (HCl, Sodium, Potassium, etc.)
- Match against compositions

### Manufacturer Search
- Normalize manufacturer name
- Match against `manufacturers.normalizedName`

### Therapeutic Category Search
- Match against `therapeutic_categories.code`
- Match against `therapeutic_categories.name`

## 3. Normalization Rules

| Field | Normalization |
|-------|---------------|
| Brand | Lowercase, remove special chars, collapse spaces |
| Generic | Lowercase, remove salts, normalize spelling |
| Strength | Extract numeric value and unit |
| Dosage Form | Controlled vocabulary |
| Route | Controlled vocabulary |
| Manufacturer | Lowercase, remove special chars |

## 4. API Endpoints

- `GET /api/catalogue/search?q=<query>` - General search
- `GET /api/catalogue/brands` - Brand suggestions
- `GET /api/catalogue/molecules` - Molecule suggestions
- `GET /api/catalogue/categories` - Category suggestions

## 5. Completion Status

| Task | Status |
|------|--------|
| Design pipeline | ✅ Complete |
| Implement normalization | ⏳ Pending |
| Implement search API | ⏳ Pending |
| Create design document | ✅ Complete |