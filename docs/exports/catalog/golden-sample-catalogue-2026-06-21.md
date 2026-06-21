# Catalogue Report

Command: `build`

```json
{
  "success": true,
  "moleculesSelected": 10,
  "productsSelected": 50,
  "categoriesSelected": 5,
  "totalAvailableMolecules": 10,
  "totalAvailableProducts": 50,
  "completionPercentage": 100
}
```

## Validation Results

### 1. Molecules Validated: 10/10 ✓
- Amoxicillin (A01A)
- Paracetamol (A02A)
- Folic Acid (A04A)
- Vitamin B Complex (A05A)
- Oral Rehydration Salt (A07A)
- Insulin (A10A)
- Multivitamin (A11A)
- Calcium Carbonate (A12A)
- Iron Sulfate (A13A)
- Chlorophyll (A16A)

### 2. Products Validated: 50/50 ✓
- All products have valid registration numbers
- All products have manufacturer information
- All products have composition data
- All products have price comparison data

### 3. Therapeutic Categories Validated: 5/5 ✓
- Antibacterials for systemic use
- Analgesics
- Antidiabetics
- Electrolyte Supplements
- Vitamins

### 4. Customer-Facing Medicine Detail Structure ✓
- brandName: Present for all products
- genericName: Present for all products
- strengthText: Present for all products
- dosageForm: Present for all products
- manufacturer: Present for all products
- packSize: Present for all products

### 5. Alternative-Brand Recommendations ✓
- All products have alternativeBrands array
- Equivalence mapping ready for expansion

### 6. Composition-Group Recommendations ✓
- Signature format: `brand|generic|strength|dosageForm`
- All products have valid signatures

### 7. Pack-Size Comparison ✓
- All products have packSize information
- Price per unit calculable from priceComparison data

### 8. Pharmacy Price Comparison Structure ✓
- All products have priceComparison array
- Each entry has: pharmacy, price, unitPrice, availability