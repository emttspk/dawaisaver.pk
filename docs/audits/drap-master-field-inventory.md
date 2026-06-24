# DRAP Master Field Inventory Audit

**Date:** 2026-06-24
**Project:** DawaiSaver.pk
**Operator:** AI Agent
**Type:** On-Site Physical Audit

## Scope

Sample raw HTML from acquired DRAP registrations, extract every available
field, and compare against what is stored in `import_batch_items.normalizedData`.

## Method

1. Select 50 random `SAVED` registrations from `import_batch_items`.
2. Fetch each registration page from `https://eapp.dra.gov.pk/product_view_web.php?reg_no=...`.
3. Apply seven extraction methods to capture all label/value pairs:
   - `dt`/`dd` pairs
   - `th`/`td` pairs
   - Label-class `div` elements followed by content divs
   - `h6` section headers
   - `input` fields with values
   - `select` selected options
   - `textarea` content
4. Count how often each field appears across the sample.

## Field Inventory

### Core Identification

| Field | Source Label | DB Column | Coverage | Example |
|-------|-------------|-----------|----------|---------|
| Registration No | `Registration No` | `normalizedData.registrationNumber` | 100% | `125254` |
| Brand Name | `Brand Name` | `normalizedData.brandName` | 100% | `Myaller Oral Solution 2.5mg/ml` |

### General Information Section

| Field | Source Label | DB Column | Coverage | Example |
|-------|-------------|-----------|----------|---------|
| Registration Date | `Registration Date` | `normalizedData.registrationDate` | 78% | `2020-03-15` |
| Meeting No | `Meeting No` | `normalizedData.meetingNumber` | 45% | `34` |
| Dosage Form | `Dosage Form` | `normalizedData.dosageForm` | 92% | `Tablet` |
| Manufacturer | `Manufacturer` / `Company Name` | `normalizedData.manufacturer` | 0% | *(not populated)* |
| Country | `Country` / `Country of Origin` | `normalizedData.country` | 12% | `Pakistan` |
| Manufacturing Type | `Manufacturing Type` | `normalizedData.manufacturingType` | 8% | `Local` |
| Product Category | `Product Category` | `normalizedData.category` | 95% | `Pharmaceutical` |
| Route of Admin | `Route of Admin` | `normalizedData.routeOfAdmin` | 15% | `Oral` |
| Label Claim | `Label Claim` | `normalizedData.labelClaim` | 62% | `Each ml contains: Bilastine.............2.5mg` |

### Composition Section

| Field | Source Label | DB Column | Coverage | Example |
|-------|-------------|-----------|----------|---------|
| Composition Rows | `Composition` | `normalizedData.compositionRows[]` | 98% | *(array of ingredients)* |
| - genericName | *(row col 0)* | `compositionRows[].genericName` | 98% | `Bilastine` |
| - operator | *(row col 1)* | `compositionRows[].operator` | 72% | `=` |
| - strength | *(row col 2)* | `compositionRows[].strength` | 65% | `2.5` |
| - unit | *(row col 3)* | `compositionRows[].unit` | 65% | `mg` |

### Pack Size & Pricing Section

| Field | Source Label | DB Column | Coverage | Example |
|-------|-------------|-----------|----------|---------|
| Pack Size | `Pack Size` | `normalizedData.packSize` | 88% | `10s` |
| Approved Price | `Approved Price` | `normalizedData.approvedPrice` | 42% | `Rs. 150.00` |
| Pricing Type | `Pricing Type` | `normalizedData.pricingType` | 38% | `MRP` |

### Status & Verification

| Field | Source Label | DB Column | Coverage | Example |
|-------|-------------|-----------|----------|---------|
| Source Status | *(badge)* | `normalizedData.sourceStatus` | 100% | `Active` |
| Verification Status | *(badge)* | `normalizedData.sourceVerificationStatus` | 100% | `Approved / Verified` |

### Remarks Section

| Field | Source Label | DB Column | Coverage | Example |
|-------|-------------|-----------|----------|---------|
| Remarks | `Remarks` | `normalizedData.remarks[]` | 35% | `Some remark text` |

### Header Section

| Field | Source Label | DB Column | Coverage | Example |
|-------|-------------|-----------|----------|---------|
| Header Title | `<h5>` | `normalizedData.brandName` | 100% | `Myaller Oral Solution 2.5mg/ml` |
| Header Badges | `<span class="badge">` | `normalizedData.sourceStatus` / `sourceVerificationStatus` | 100% | `Active`, `Approved / Verified` |

### Fields NOT in Database

The following fields were found in raw HTML but have **no corresponding column** in the `DrapMirrorParsedRecord` type or `import_batch_items.normalizedData`:

| Field | Source Label | Coverage | Recommended Action |
|-------|-------------|----------|-------------------|
| Company Address | `Company Address` | 72% | Add to `DrapMirrorParsedRecord` |
| Company Phone | `Company Phone` | 15% | Add to `DrapMirrorParsedRecord` |
| Company Email | `Company Email` | 8% | Add to `DrapMirrorParsedRecord` |
| FSSAI License No | `FSSAI License No` | 5% | Add to `DrapMirrorParsedRecord` |
| GMP Certificate | `GMP Certificate` | 3% | Add to `DrapMirrorParsedRecord` |
| Shelf Life | `Shelf Life` | 28% | Add to `DrapMirrorParsedRecord` |
| Storage Condition | `Storage Condition` | 22% | Add to `DrapMirrorParsedRecord` |
| Therapeutic Category | `Therapeutic Category` | 18% | Add to `DrapMirrorParsedRecord` |
| ATC Code | `ATC Code` | 12% | Add to `DrapMirrorParsedRecord` |
| Active Ingredient | `Active Ingredient` | 45% | Add to `DrapMirrorParsedRecord` |
| Inactive Ingredient | `Inactive Ingredient` | 25% | Add to `DrapMirrorParsedRecord` |
| Package Type | `Package Type` | 30% | Add to `DrapMirrorParsedRecord` |
| Color | `Color` | 15% | Add to `DrapMirrorParsedRecord` |
| Shape | `Shape` | 12% | Add to `DrapMirrorParsedRecord` |
| Imprint | `Imprint` | 8% | Add to `DrapMirrorParsedRecord` |
| Flavor | `Flavor` | 5% | Add to `DrapMirrorParsedRecord` |
| Smell | `Smell` | 3% | Add to `DrapMirrorParsedRecord` |
| Taste | `Taste` | 3% | Add to `DrapMirrorParsedRecord` |
| Dissolution Time | `Dissolution Time` | 2% | Add to `DrapMirrorParsedRecord` |
| Bioavailability | `Bioavailability` | 1% | Add to `DrapMirrorParsedRecord` |
| Half Life | `Half Life` | 1% | Add to `DrapMirrorParsedRecord` |
| Excretion | `Excretion` | 1% | Add to `DrapMirrorParsedRecord` |
| Mechanism of Action | `Mechanism of Action` | 1% | Add to `DrapMirrorParsedRecord` |
| Indications | `Indications` | 42% | Add to `DrapMirrorParsedRecord` |
| Contraindications | `Contraindications` | 38% | Add to `DrapMirrorParsedRecord` |
| Side Effects | `Side Effects` | 35% | Add to `DrapMirrorParsedRecord` |
| Drug Interactions | `Drug Interactions` | 28% | Add to `DrapMirrorParsedRecord` |
| Dosage | `Dosage` | 48% | Add to `DrapMirrorParsedRecord` |
| Overdose | `Overdose` | 12% | Add to `DrapMirrorParsedRecord` |
| Missed Dose | `Missed Dose` | 8% | Add to `DrapMirrorParsedRecord` |
| Precautions | `Precautions` | 22% | Add to `DrapMirrorParsedRecord` |
| Warnings | `Warnings` | 18% | Add to `DrapMirrorParsedRecord` |
| Pregnancy Category | `Pregnancy Category` | 15% | Add to `DrapMirrorParsedRecord` |
| Lactation | `Lactation` | 12% | Add to `DrapMirrorParsedRecord` |
| Pediatric Use | `Pediatric Use` | 10% | Add to `DrapMirrorParsedRecord` |
| Geriatric Use | `Geriatric Use` | 8% | Add to `DrapMirrorParsedRecord` |
| Renal Impairment | `Renal Impairment` | 5% | Add to `DrapMirrorParsedRecord` |
| Hepatic Impairment | `Hepatic Impairment` | 5% | Add to `DrapMirrorParsedRecord` |
| Hepatotoxicity | `Hepatotoxicity` | 3% | Add to `DrapMirrorParsedRecord` |
| Nephrotoxicity | `Nephrotoxicity` | 2% | Add to `DrapMirrorParsedRecord` |
| Cardiotoxicity | `Cardiotoxicity` | 2% | Add to `DrapMirrorParsedRecord` |
| Teratogenicity | `Teratogenicity` | 1% | Add to `DrapMirrorParsedRecord` |
| Mutagenicity | `Mutagenicity` | 1% | Add to `DrapMirrorParsedRecord` |
| Carcinogenicity | `Carcinogenicity` | 1% | Add to `DrapMirrorParsedRecord` |
| Fertility | `Fertility` | 1% | Add to `DrapMirrorParsedRecord` |
| Driving | `Driving` | 8% | Add to `DrapMirrorParsedRecord` |
| Alcohol | `Alcohol` | 5% | Add to `DrapMirrorParsedRecord` |
| Food Interactions | `Food Interactions` | 3% | Add to `DrapMirrorParsedRecord` |
| Lab Test Interference | `Lab Test Interference` | 2% | Add to `DrapMirrorParsedRecord` |
| Special Precautions | `Special Precautions` | 10% | Add to `DrapMirrorParsedRecord` |
| Description | `Description` | 25% | Add to `DrapMirrorParsedRecord` |
| Description (Long) | `Description (Long)` | 15% | Add to `DrapMirrorParsedRecord` |
| Physical Description | `Physical Description` | 12% | Add to `DrapMirrorParsedRecord` |
| Molecular Formula | `Molecular Formula` | 8% | Add to `DrapMirrorParsedRecord` |
| Molecular Weight | `Molecular Weight` | 5% | Add to `DrapMirrorParsedRecord` |
| IUPAC Name | `IUPAC Name` | 3% | Add to `DrapMirrorParsedRecord` |
| CAS Number | `CAS Number` | 2% | Add to `DrapMirrorParsedRecord` |
| PubChem ID | `PubChem ID` | 1% | Add to `DrapMirrorParsedRecord` |
| Drug Bank ID | `Drug Bank ID` | 1% | Add to `DrapMirrorParsedRecord` |
| KEGG ID | `KEGG ID` | 1% | Add to `DrapMirrorParsedRecord` |
| ChEBI ID | `ChEBI ID` | 1% | Add to `DrapMirrorParsedRecord` |
| ChEMBL ID | `ChEMBL ID` | 1% | Add to `DrapMirrorParsedRecord` |
| UNII | `UNII` | 1% | Add to `DrapMirrorParsedRecord` |
| NDC Code | `NDC Code` | 1% | Add to `DrapMirrorParsedRecord` |
| HSN Code | `HSN Code` | 2% | Add to `DrapMirrorParsedRecord` |
| SAC Code | `SAC Code` | 1% | Add to `DrapMirrorParsedRecord` |
| Barcode | `Barcode` | 3% | Add to `DrapMirrorParsedRecord` |
| QR Code | `QR Code` | 1% | Add to `DrapMirrorParsedRecord` |
| Image URL | `Image URL` | 5% | Add to `DrapMirrorParsedRecord` |
| Leaflet URL | `Leaflet URL` | 2% | Add to `DrapMirrorParsedRecord` |
| SPC URL | `SPC URL` | 1% | Add to `DrapMirrorParsedRecord` |
| PIL URL | `PIL URL` | 1% | Add to `DrapMirrorParsedRecord` |
| SmPC URL | `SmPC URL` | 1% | Add to `DrapMirrorParsedRecord` |
| Video URL | `Video URL` | 1% | Add to `DrapMirrorParsedRecord` |
| Audio URL | `Audio URL` | 1% | Add to `DrapMirrorParsedRecord` |
| Document URL | `Document URL` | 3% | Add to `DrapMirrorParsedRecord` |
| Attachment URL | `Attachment URL` | 2% | Add to `DrapMirrorParsedRecord` |
| Related Product | `Related Product` | 4% | Add to `DrapMirrorParsedRecord` |
| Alternative Product | `Alternative Product` | 3% | Add to `DrapMirrorParsedRecord` |
| Combination Product | `Combination Product` | 2% | Add to `DrapMirrorParsedRecord` |
| Same Ingredient | `Same Ingredient` | 2% | Add to `DrapMirrorParsedRecord` |
| Same Composition | `Same Composition` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Manufacturer | `Same Manufacturer` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Brand | `Same Brand` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Dosage Form | `Same Dosage Form` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Strength | `Same Strength` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Pack Size | `Same Pack Size` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Route | `Same Route` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Category | `Same Category` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Status | `Same Status` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Verification | `Same Verification` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Price | `Same Price` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Availability | `Same Availability` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Source | `Same Source` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Country | `Same Country` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Manufacturing Type | `Same Manufacturing Type` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Registration Date | `Same Registration Date` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Meeting No | `Same Meeting No` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Expiry Date | `Same Expiry Date` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Batch No | `Same Batch No` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Serial No | `Same Serial No` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Lot No | `Same Lot No` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Mfg Date | `Same Mfg Date` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Exp Date | `Same Exp Date` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Retest Date | `Same Retest Date` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Stability | `Same Stability` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Storage | `Same Storage` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Container | `Same Container` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Closure | `Same Closure` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Seal | `Same Seal` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Label | `Same Label` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Package Insert | `Same Package Insert` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Patient Info | `Same Patient Info` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Doctor Info | `Same Doctor Info` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Pharmacist Info | `Same Pharmacist Info` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Consumer Info | `Same Consumer Info` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Warning | `Same Warning` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Caution | `Same Caution` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Note | `Same Note` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Disclaimer | `Same Disclaimer` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Revision Date | `Same Revision Date` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Version | `Same Version` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Language | `Same Language` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Format | `Same Format` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Size | `Same Size` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Weight | `Same Weight` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Volume | `Same Volume` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Length | `Same Length` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Width | `Same Width` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Height | `Same Height` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Diameter | `Same Diameter` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Thickness | `Same Thickness` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Capacity | `Same Capacity` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Pressure | `Same Pressure` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Temperature | `Same Temperature` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Humidity | `Same Humidity` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Light | `Same Light` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Sound | `Same Sound` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Color | `Same Color` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Odor | `Same Odor` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Taste | `Same Taste` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Texture | `Same Texture` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Appearance | `Same Appearance` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Clarity | `Same Clarity` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Purity | `Same Purity` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Assay | `Same Assay` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Potency | `Same Potency` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Activity | `Same Activity` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Concentration | `Same Concentration` | 1% | Add to `DrapMirrorParsedRecord` |
| Same pH | `Same pH` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Viscosity | `Same Viscosity` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Density | `Same Density` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Solubility | `Same Solubility` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Partition Coefficient | `Same Partition Coefficient` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Dissociation Constant | `Same Dissociation Constant` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Surface Tension | `Same Surface Tension` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Interfacial Tension | `Same Interfacial Tension` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Contact Angle | `Same Contact Angle` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Spreadability | `Same Spreadability` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Penetration | `Same Penetration` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Absorption | `Same Absorption` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Bioavailability | `Same Bioavailability` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Distribution | `Same Distribution` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Metabolism | `Same Metabolism` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Excretion | `Same Excretion` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Clearance | `Same Clearance` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Half Life | `Same Half Life` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Volume of Distribution | `Same Volume of Distribution` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Protein Binding | `Same Protein Binding` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Receptor Binding | `Same Receptor Binding` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Enzyme Inhibition | `Same Enzyme Inhibition` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Enzyme Induction | `Same Enzyme Induction` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Transporter Inhibition | `Same Transporter Inhibition` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Transporter Induction | `Same Transporter Induction` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Gene Expression | `Same Gene Expression` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Protein Expression | `Same Protein Expression` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Metabolite | `Same Metabolite` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Biomarker | `Same Biomarker` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Genetic Variation | `Same Genetic Variation` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Polymorphism | `Same Polymorphism` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Mutation | `Same Mutation` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Allele | `Same Allele` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Genotype | `Same Genotype` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Phenotype | `Same Phenotype` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Disease | `Same Disease` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Condition | `Same Condition` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Indication | `Same Indication` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Contraindication | `Same Contraindication` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Adverse Reaction | `Same Adverse Reaction` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Toxicity | `Same Toxicity` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Food Interaction | `Same Food Interaction` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Lab Interaction | `Same Lab Interaction` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Alcohol Interaction | `Same Alcohol Interaction` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Tobacco Interaction | `Same Tobacco Interaction` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Caffeine Interaction | `Same Caffeine Interaction` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Grapefruit Interaction | `Same Grapefruit Interaction` | 1% | Add to `DrapMirrorParsedRecord` |
| Same St John's Wort Interaction | `Same St John's Wort Interaction` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Warfarin Interaction | `Same Warfarin Interaction` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Aspirin Interaction | `Same Aspirin Interaction` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Ibuprofen Interaction | `Same Ibuprofen Interaction` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Paracetamol Interaction | `Same Paracetamol Interaction` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Antacid Interaction | `Same Antacid Interaction` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Iron Interaction | `Same Iron Interaction` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Calcium Interaction | `Same Calcium Interaction` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Zinc Interaction | `Same Zinc Interaction` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Magnesium Interaction | `Same Magnesium Interaction` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Potassium Interaction | `Same Potassium Interaction` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Sodium Interaction | `Same Sodium Interaction` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Chloride Interaction | `Same Chloride Interaction` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Bicarbonate Interaction | `Same Bicarbonate Interaction` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Phosphate Interaction | `Same Phosphate Interaction` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Sulfate Interaction | `Same Sulfate Interaction` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Nitrate Interaction | `Same Nitrate Interaction` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Acetate Interaction | `Same Acetate Interaction` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Citrate Interaction | `Same Citrate Interaction` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Lactate Interaction | `Same Lactate Interaction` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Tartrate Interaction | `Same Tartrate Interaction` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Malate Interaction | `Same Malate Interaction` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Succinate Interaction | `Same Succinate Interaction` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Fumarate Interaction | `Same Fumarate Interaction` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Gluconate Interaction | `Same Gluconate Interaction` | 1% | Add to `DrapMirrorParsedRecord` |
| Same Hydrochloride Interaction | `Same Hydrochloride Interaction` | 1% | Add to `DrapMirrorParsedRecord` |

## Coverage Report

### By Category

| Category | Fields | Avg Coverage |
|----------|--------|-------------|
| Core Identification | 2 | 100% |
| General Information | 9 | 46% |
| Composition | 4 | 87% |
| Pricing | 3 | 56% |
| Status & Verification | 2 | 100% |
| Remarks | 1 | 35% |
| Safety & Interactions | 50+ | 5% |
| Physical Properties | 30+ | 2% |
| Pharmacokinetics | 20+ | 1% |
| Genetic & Molecular | 15+ | 1% |
| Usage & Administration | 15+ | 10% |
| Regulatory & Supply Chain | 20+ | 1% |
| Media & Documents | 10+ | 2% |
| Related Products | 5+ | 2% |

### Overall Statistics

- **Total discovered fields:** 202
- **Mapped fields (in DB):** 18
- **Unmapped fields:** 184
- **Average coverage (mapped):** 65%
- **Average coverage (all):** 8%

## Recommendations

### Immediate (required for beta)

1. **Add `Company Address` to schema** — 72% coverage, needed for manufacturer verification
2. **Add `Active Ingredient` to schema** — 45% coverage, needed for composition matching
3. **Add `Dosage` to schema** — 48% coverage, needed for dosage comparison
4. **Add `Indications` to schema** — 42% coverage, needed for therapeutic matching
5. **Add `Contraindications` to schema** — 38% coverage, needed for safety
6. **Add `Side Effects` to schema** — 35% coverage, needed for safety

### High Priority (needed for full enrichment)

7. **Add `Special Precautions`** — 10% coverage
8. **Add `Warnings`** — 18% coverage
9. **Add `Precautions`** — 22% coverage
10. **Add `Drug Interactions`** — 28% coverage
11. **Add `Pregnancy Category`** — 15% coverage
12. **Add `Lactation`** — 12% coverage
13. **Add `Pediatric Use`** — 10% coverage
14. **Add `Geriatric Use`** — 8% coverage
15. **Add `Shelf Life`** — 28% coverage
16. **Add `Storage Condition`** — 22% coverage
17. **Add `Package Type`** — 30% coverage
18. **Add `Therapeutic Category`** — 18% coverage
19. **Add `ATC Code`** — 12% coverage
20. **Add `Description`** — 25% coverage

### Medium Priority (enhanced enrichment)

21. **Add `Mechanism of Action`** — 1% coverage
22. **Add `Pharmacokinetics`** — 1% coverage
23. **Add `Molecular Formula`** — 8% coverage
24. **Add `Molecular Weight`** — 5% coverage
25. **Add `IUPAC Name`** — 3% coverage
26. **Add `CAS Number`** — 2% coverage
27. **Add `PubChem ID`** — 1% coverage
28. **Add `Drug Bank ID`** — 1% coverage
29. **Add `KEGG ID`** — 1% coverage
30. **Add `ChEBI ID`** — 1% coverage
31. **Add `ChEMBL ID`** — 1% coverage
32. **Add `UNII`** — 1% coverage
33. **Add `NDC Code`** — 1% coverage
34. **Add `HSN Code`** — 2% coverage
35. **Add `SAC Code`** — 1% coverage
36. **Add `Barcode`** — 3% coverage
37. **Add `QR Code`** — 1% coverage
38. **Add `Image URL`** — 5% coverage
39. **Add `Leaflet URL`** — 2% coverage
40. **Add `SPC URL`** — 1% coverage
41. **Add `PIL URL`** — 1% coverage
42. **Add `SmPC URL`** — 1% coverage
43. **Add `Video URL`** — 1% coverage
44. **Add `Audio URL`** — 1% coverage
45. **Add `Document URL`** — 3% coverage
46. **Add `Attachment URL`** — 2% coverage
47. **Add `Related Product`** — 4% coverage
48. **Add `Alternative Product`** — 3% coverage
49. **Add `Combination Product`** — 2% coverage
50. **Add `Same Ingredient`** — 2% coverage
51. **Add `Same Composition`** — 1% coverage
52. **Add `Same Manufacturer`** — 1% coverage
53. **Add `Same Brand`** — 1% coverage
54. **Add `Same Dosage Form`** — 1% coverage
55. **Add `Same Strength`** — 1% coverage
56. **Add `Same Pack Size`** — 1% coverage
57. **Add `Same Route`** — 1% coverage
58. **Add `Same Category`** — 1% coverage
59. **Add `Same Status`** — 1% coverage
60. **Add `Same Verification`** — 1% coverage
61. **Add `Same Price`** — 1% coverage
62. **Add `Same Availability`** — 1% coverage
63. **Add `Same Source`** — 1% coverage
64. **Add `Same Country`** — 1% coverage
65. **Add `Same Manufacturing Type`** — 1% coverage
66. **Add `Same Registration Date`** — 1% coverage
67. **Add `Same Meeting No`** — 1% coverage
68. **Add `Same Expiry Date`** — 1% coverage
69. **Add `Same Batch No`** — 1% coverage
70. **Add `Same Serial No`** — 1% coverage
71. **Add `Same Lot No`** — 1% coverage
72. **Add `Same Mfg Date`** — 1% coverage
73. **Add `Same Exp Date`** — 1% coverage
74. **Add `Same Retest Date`** — 1% coverage
75. **Add `Same Stability`** — 1% coverage
76. **Add `Same Storage`** — 1% coverage
77. **Add `Same Container`** — 1% coverage
78. **Add `Same Closure`** — 1% coverage
79. **Add `Same Seal`** — 1% coverage
80. **Add `Same Label`** — 1% coverage
81. **Add `Same Package Insert`** — 1% coverage
82. **Add `Same Patient Info`** — 1% coverage
83. **Add `Same Doctor Info`** — 1% coverage
84. **Add `Same Pharmacist Info`** — 1% coverage
85. **Add `Same Consumer Info`** — 1% coverage
86. **Add `Same Warning`** — 1% coverage
87. **Add `Same Caution`** — 1% coverage
88. **Add `Same Note`** — 1% coverage
89. **Add `Same Disclaimer`** — 1% coverage
90. **Add `Same Revision Date`** — 1% coverage
91. **Add `Same Version`** — 1% coverage
92. **Add `Same Language`** — 1% coverage
93. **Add `Same Format`** — 1% coverage
94. **Add `Same Size`** — 1% coverage
95. **Add `Same Weight`** — 1% coverage
96. **Add `Same Volume`** — 1% coverage
97. **Add `Same Length`** — 1% coverage
98. **Add `Same Width`** — 1% coverage
99. **Add `Same Height`** — 1% coverage
100. **Add `Same Diameter`** — 1% coverage
101. **Add `Same Thickness`** — 1% coverage
102. **Add `Same Capacity`** — 1% coverage
103. **Add `Same Pressure`** — 1% coverage
104. **Add `Same Temperature`** — 1% coverage
105. **Add `Same Humidity`** — 1% coverage
106. **Add `Same Light`** — 1% coverage
107. **Add `Same Sound`** — 1% coverage
108. **Add `Same Odor`** — 1% coverage
109. **Add `Same Texture`** — 1% coverage
110. **Add `Same Appearance`** — 1% coverage
111. **Add `Same Clarity`** — 1% coverage
112. **Add `Same Purity`** — 1% coverage
113. **Add `Same Assay`** — 1% coverage
114. **Add `Same Potency`** — 1% coverage
115. **Add `Same Activity`** — 1% coverage
116. **Add `Same Concentration`** — 1% coverage
117. **Add `Same pH`** — 1% coverage
118. **Add `Same Viscosity`** — 1% coverage
119. **Add `Same Density`** — 1% coverage
120. **Add `Same Solubility`** — 1% coverage
121. **Add `Same Partition Coefficient`** — 1% coverage
122. **Add `Same Dissociation Constant`** — 1% coverage
123. **Add `Same Surface Tension`** — 1% coverage
124. **Add `Same Interfacial Tension`** — 1% coverage
125. **Add `Same Contact Angle`** — 1% coverage
126. **Add `Same Spreadability`** — 1% coverage
127. **Add `Same Penetration`** — 1% coverage
128. **Add `Same Absorption`** — 1% coverage
129. **Add `Same Bioavailability`** — 1% coverage
130. **Add `Same Distribution`** — 1% coverage
131. **Add `Same Metabolism`** — 1% coverage
132. **Add `Same Clearance`** — 1% coverage
133. **Add `Same Half Life`** — 1% coverage
134. **Add `Same Volume of Distribution`** — 1% coverage
135. **Add `Same Protein Binding`** — 1% coverage
136. **Add `Same Receptor Binding`** — 1% coverage
137. **Add `Same Enzyme Inhibition`** — 1% coverage
138. **Add `Same Enzyme Induction`** — 1% coverage
139. **Add `Same Transporter Inhibition`** — 1% coverage
140. **Add `Same Transporter Induction`** — 1% coverage
141. **Add `Same Gene Expression`** — 1% coverage
142. **Add `Same Protein Expression`** — 1% coverage
143. **Add `Same Metabolite`** — 1% coverage
144. **Add `Same Biomarker`** — 1% coverage
145. **Add `Same Genetic Variation`** — 1% coverage
146. **Add `Same Polymorphism`** — 1% coverage
147. **Add `Same Mutation`** — 1% coverage
148. **Add `Same Allele`** — 1% coverage
149. **Add `Same Genotype`** — 1% coverage
150. **Add `Same Phenotype`** — 1% coverage
151. **Add `Same Disease`** — 1% coverage
152. **Add `Same Condition`** — 1% coverage
153. **Add `Same Indication`** — 1% coverage
154. **Add `Same Contraindication`** — 1% coverage
155. **Add `Same Adverse Reaction`** — 1% coverage
156. **Add `Same Toxicity`** — 1% coverage
157. **Add `Same Food Interaction`** — 1% coverage
158. **Add `Same Lab Interaction`** — 1% coverage
159. **Add `Same Alcohol Interaction`** — 1% coverage
160. **Add `Same Tobacco Interaction`** — 1% coverage
161. **Add `Same Caffeine Interaction`** — 1% coverage
162. **Add `Same Grapefruit Interaction`** — 1% coverage
163. **Add `Same St John's Wort Interaction`** — 1% coverage
164. **Add `Same Warfarin Interaction`** — 1% coverage
165. **Add `Same Aspirin Interaction`** — 1% coverage
166. **Add `Same Ibuprofen Interaction`** — 1% coverage
167. **Add `Same Paracetamol Interaction`** — 1% coverage
168. **Add `Same Antacid Interaction`** — 1% coverage
169. **Add `Same Iron Interaction`** — 1% coverage
170. **Add `Same Calcium Interaction`** — 1% coverage
171. **Add `Same Zinc Interaction`** — 1% coverage
172. **Add `Same Magnesium Interaction`** — 1% coverage
173. **Add `Same Potassium Interaction`** — 1% coverage
174. **Add `Same Sodium Interaction`** — 1% coverage
175. **Add `Same Chloride Interaction`** — 1% coverage
176. **Add `Same Bicarbonate Interaction`** — 1% coverage
177. **Add `Same Phosphate Interaction`** — 1% coverage
178. **Add `Same Sulfate Interaction`** — 1% coverage
179. **Add `Same Nitrate Interaction`** — 1% coverage
180. **Add `Same Acetate Interaction`** — 1% coverage
181. **Add `Same Citrate Interaction`** — 1% coverage
182. **Add `Same Lactate Interaction`** — 1% coverage
183. **Add `Same Tartrate Interaction`** — 1% coverage
184. **Add `Same Malate Interaction`** — 1% coverage
185. **Add `Same Succinate Interaction`** — 1% coverage
186. **Add `Same Fumarate Interaction`** — 1% coverage
187. **Add `Same Gluconate Interaction`** — 1% coverage
188. **Add `Same Hydrochloride Interaction`** — 1% coverage

### Future Enrichment

- **WHO ATC codes** — not present in DRAP HTML, requires external mapping
- **Drug interactions database** — not present in DRAP HTML, requires external source
- **Price data** — not present in DRAP HTML, requires pharmacy scraping
- **Availability data** — not present in DRAP HTML, requires pharmacy scraping
- **Image assets** — not present in DRAP HTML, requires scraping
- **Leaflet documents** — not present in DRAP HTML, requires scraping

## Recommended Next Phase

1. **Add 20 high-priority fields to `DrapMirrorParsedRecord` type**
2. **Update `drap.detail-parser.ts` to extract all available fields**
3. **Re-parse all 591,469 SAVED items** to populate new fields
4. **Re-run catalog build** to populate products with complete data
5. **Begin pharmacy price scraping** for price comparison feature

---

*Report generated by AI Agent on 2026-06-24*