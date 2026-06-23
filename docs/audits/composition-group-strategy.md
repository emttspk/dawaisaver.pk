# Composition Group Strategy

Date: 2026-06-23
Scope: Phase 4 Catalog Intelligence - Composition Groups

## 1. Audit Results

### ingredient_aliases
| Metric | Value |
|--------|-------|
| Status | ✅ Populated |
| Source | Phase 3 review workflow |
| Purpose | Approved alias bridge for canonical molecule promotion |

### molecule_aliases
| Metric | Value |
|--------|-------|
| Status | ✅ Populated |
| Source | Mirrored from ingredient_aliases |
| Purpose | Legacy alias compatibility |

### generics
| Metric | Value |
|--------|-------|
| Status | ✅ Loaded |
| Count | 4,937 canonical molecules |
| Source | WHO ATC Master data |
| Purpose | Canonical generic molecule identity |

### products
| Metric | Value |
|--------|-------|
| Status | ✅ Exist in schema |
| Table | `products` |
| Fields | brandName, dosageForm, strengthText, compositions |
| Relation | compositions -> generic |

### product_compositions
| Metric | Value |
|--------|-------|
| Status | ✅ Exist in schema |
| Table | `product_compositions` |
| Fields | genericId, strengthValue, strengthUnit, strengthText, ingredientOrder |
| Relation | product -> generic |

## 2. Composition Group Strategy

### Grouping Rules
1. Same canonical molecule(s)
2. Same strength (numeric value + unit)
3. Same dosage form
4. Same route of administration (when available)

### Signature Algorithm
```
signature = v1|<ingredient@strength>[+<ingredient@strength>...]|<dosage_form>|<route>
```

### Normalization Process
1. Normalize generic name (lowercase, remove special chars)
2. Parse strength (value + unit)
3. Normalize dosage form (controlled vocabulary)
4. Normalize route (controlled vocabulary)
5. Sort ingredients alphabetically by name
6. Generate signature hash

### Controlled Vocabularies

**Dosage Forms:**
- tablet
- capsule
- syrup
- suspension
- drops
- cream
- ointment
- injection
- solution
- inhaler

**Routes:**
- oral
- intravenous
- intramuscular
- subcutaneous
- topical
- ophthalmic
- otic
- nasal
- inhalation
- rectal
- vaginal
- transdermal

## 3. Implementation

### Service Layer
- File: `src/modules/composition/composition.service.ts`
- Method: `generateCompositionGroups()`
- Logic: Group products by signature

### API Endpoints
- `POST /admin/composition/groups/generate` - Generate groups
- `GET /admin/composition/stats` - Get coverage metrics

### Database Tables
- `composition_groups` - Already exists
- `composition_group_compositions` - Already exists

## 4. Coverage Validation

### Metrics
| Metric | Status |
|--------|--------|
| Total Products | Need to count |
| Products with Compositions | Need to count |
| Products with Dosage Form | Need to count |
| Products Grouped | Need to count |
| Coverage % | Need to calculate |

### Validation Query
```sql
SELECT 
  COUNT(*) as total_products,
  COUNT(*) FILTER (WHERE dosage_form IS NOT NULL) as with_dosage_form,
  COUNT(*) FILTER (WHERE compositions IS NOT NULL) as with_compositions
FROM products;
```

## 5. Blocking Issues

1. **Missing compositionGroupId on Product**
   - Products need to reference composition groups
   - Schema needs migration to add this FK

2. **Missing normalized dosage form**
   - Products have `dosageForm` but need normalized version
   - Need normalization service

3. **Missing route field**
   - Not currently in Product schema
   - Need to add for complete signature

## 6. Recommendations

1. Add `compositionGroupId` to Product schema
2. Add `normalizedDosageForm` to Product schema
3. Add `route` to Product schema
4. Create normalization service for dosage forms
5. Update composition group generation to include route

---

## 7. Completion Status

| Task | Status |
|------|--------|
| Audit aliases | ✅ Complete |
| Strategy defined | ✅ Complete |
| Implementation created | ✅ Complete |
| Coverage validation | ⏳ Pending DB |
| Blocking issues identified | ✅ Complete |