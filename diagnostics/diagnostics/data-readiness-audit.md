# DawaiSaver Data Readiness Audit

Intended file: `diagnostics/data-readiness-audit.md`

> The audit was completed read-only. Active Plan Mode prohibits creating the requested file, so no repository files were modified.

## Audit scope and limitations

Evidence examined:

- 60,000 unique archived DRAP registration probes covering `031350–091349`.
- Database backup: 55,829 unique successfully parsed registrations.
- Locally available raw-HTML measurement slice: 10,000 probes covering `031350–041349`.
- Valid products in measurement slice: 9,399.
- Failed/non-product probes: 601.
- Committed WHO mapping artefact.

Field-level results below use the 9,399-product raw-HTML slice. It is a contiguous operational sample, not a statistically randomized sample.

The saved parsed payload omits fields present in raw HTML. Measurements therefore extracted those fields directly from archived HTML.

## 1. DRAP Field Coverage

| Field | Total | Populated | Coverage |
|---|---:|---:|---:|
| Registration Number | 9,399 | 9,399 | 100.00% |
| Brand Name | 9,399 | 9,395 | 99.96% |
| Composition | 9,399 | 5,527 | 58.80% |
| Strength | 9,399 | 5,524 | 58.77% |
| Dosage Form | 9,399 | 9,140 | 97.24% |
| Route | 9,399 | 5,248 | 55.84% |
| Manufacturer | 9,399 | 175 | 1.86% |
| Manufacturer Country | 9,399 | 164 | 1.74% |
| Pack Size | 9,399 | 5,439 | 57.87% |
| Approved Price | 9,399 | 5,439 | 57.87% |
| Registration Date | 9,399 | 7,857 | 83.59% |

Findings:

- Registration, brand, and dosage form have strong coverage.
- Composition and route coverage are insufficient for universal automatic comparison.
- Manufacturer data is critically incomplete. DRAP pages expose it primarily for contract/import cases.
- “No composition data recorded,” `Nil`, and similar sentinel values were classified as missing.
- Approved-price coverage includes numeric prices and textual values such as `As per SRO`.

## 2. Composition Analysis

| Classification | Products | Percentage |
|---|---:|---:|
| Single ingredient | 4,851 | 51.61% |
| Multi ingredient | 676 | 7.19% |
| No usable composition | 3,872 | 41.20% |

Duplicate ingredient rows within a product were collapsed before classification.

### Top 100 compositions

| # | Composition | Products |
|---:|---|---:|
| 1 | Cephradine | 96 |
| 2 | Glimepiride | 95 |
| 3 | Clarithromycin | 72 |
| 4 | Diclofenac Sodium | 61 |
| 5 | Levofloxacin as Hemihydrate | 53 |
| 6 | Famotidine | 53 |
| 7 | Ofloxacin | 50 |
| 8 | Cefixime | 49 |
| 9 | Loratadine | 46 |
| 10 | Fexofenadine HCl | 46 |
| 11 | Meloxicam | 43 |
| 12 | Ciprofloxacin as HCl | 42 |
| 13 | Diclofenac Potassium | 40 |
| 14 | Gabapentin | 40 |
| 15 | Cefaclor | 39 |
| 16 | Domperidone | 38 |
| 17 | Metronidazole | 38 |
| 18 | Cefadroxil | 38 |
| 19 | Simvastatin | 38 |
| 20 | Mecobalamin | 36 |
| 21 | Fexofenadine Hydrochloride | 36 |
| 22 | Risperidone | 35 |
| 23 | Piroxicam | 34 |
| 24 | Levofloxacin | 34 |
| 25 | Mefenamic Acid | 32 |
| 26 | Clotrimazole | 31 |
| 27 | Paracetamol | 30 |
| 28 | Ceftriaxone as Sodium | 30 |
| 29 | Celecoxib | 30 |
| 30 | Tranexamic Acid | 29 |
| 31 | Fluconazole | 29 |
| 32 | Atenolol | 26 |
| 33 | Cephalexin | 26 |
| 34 | Ciprofloxacin | 25 |
| 35 | Ribavirin | 25 |
| 36 | Atorvastatin | 24 |
| 37 | Atorvastatin as Calcium Trihydrate | 24 |
| 38 | Ibuprofen | 24 |
| 39 | Albendazole | 24 |
| 40 | Montelukast | 23 |
| 41 | Naproxen Sodium | 23 |
| 42 | Candesartan Cilexetil | 22 |
| 43 | Carvedilol | 22 |
| 44 | Azithromycin as Dihydrate | 22 |
| 45 | Flurbiprofen | 22 |
| 46 | Topiramate | 21 |
| 47 | Losartan Potassium | 20 |
| 48 | Nimesulide | 20 |
| 49 | Roxithromycin | 20 |
| 50 | Cefaclor as Monohydrate | 19 |
| 51 | Ramipril | 19 |
| 52 | Olanzapine | 18 |
| 53 | Montelukast as Sodium | 18 |
| 54 | Cetirizine Dihydrochloride | 17 |
| 55 | Mecobalamine | 17 |
| 56 | Cefuroxime | 16 |
| 57 | Bisoprolol Fumarate | 16 |
| 58 | Montelukast Sodium | 16 |
| 59 | Alfacalcidol | 15 |
| 60 | Escitalopram as Oxalate | 15 |
| 61 | Lactulose | 15 |
| 62 | Iron III Hydroxide Polymaltose Complex | 15 |
| 63 | Metformin HCl | 14 |
| 64 | Fusidic Acid | 14 |
| 65 | Sparfloxacin | 14 |
| 66 | Lamotrigine | 14 |
| 67 | Escitalopram | 13 |
| 68 | Ebastine | 13 |
| 69 | Gatifloxacin | 13 |
| 70 | Levofloxacin Hemihydrate | 13 |
| 71 | Azithromycin | 13 |
| 72 | Valsartan | 13 |
| 73 | Pioglitazone HCl | 12 |
| 74 | Ceftazidime | 12 |
| 75 | Cefuroxime as Axetil | 12 |
| 76 | Moxifloxacin | 11 |
| 77 | Salbutamol as Sulphate | 11 |
| 78 | Amoxicillin as Trihydrate | 11 |
| 79 | Pefloxacin | 11 |
| 80 | Cetirizine 2HCl | 11 |
| 81 | Cefixime as Trihydrate | 11 |
| 82 | Citalopram as HBr | 10 |
| 83 | Cefadroxil as Monohydrate | 10 |
| 84 | Norfloxacin | 10 |
| 85 | Ceftriaxone | 10 |
| 86 | Ketoprofen | 10 |
| 87 | Levofloxacin Hemihydrate equivalent | 10 |
| 88 | Iron III Hydroxide Polymaltose Complex | 10 |
| 89 | Linezolid | 10 |
| 90 | Ketoconazole | 10 |
| 91 | Piracetam | 10 |
| 92 | Pyrimethamine + Sulfadoxine | 10 |
| 93 | Lansoprazole | 10 |
| 94 | Venlafaxine as HCl | 10 |
| 95 | Hydrochlorothiazide + Losartan Potassium | 10 |
| 96 | Sertraline | 10 |
| 97 | Cefotaxime as Sodium | 10 |
| 98 | Aspirin | 10 |
| 99 | Gliclazide | 10 |
| 100 | Fexofenadine | 10 |

Salt and spelling variants currently fragment otherwise related molecules.

## 3. Composition Group Estimate

### Full observed archive

- Registration probes: 60,000.
- Successfully parsed DRAP products: **55,829**.
- Failed/empty probes: 4,171.

### Detailed 9,399-product slice

| Identity level | Unique values |
|---|---:|
| Composition | 1,926 |
| Composition + Strength | 3,105 |
| Composition + Strength + Form | 3,418 |
| Composition + Strength + Form + Route | 3,373 |

The later counts exceed composition-only counts because a composition can occur in multiple strengths, forms, and routes.

Only 5,202 products—55.35%—had composition, strength, form, and route sufficient to generate the approved authoritative identity.

## 4. Dosage Form Analysis

- Valid populated products: 9,140.
- Distinct raw values: 119 after excluding `0`.
- Strong normalization candidates:
  - Tablet family: 4,455.
  - Injection family: 1,327.
  - Capsule family: 992.
  - Suspension family: 802.
  - Syrup family: 291.
  - Cream family: 237.
  - Drops family: 204.
  - Solution family: 129.
  - Ointment family: 80.

All observed values include:

`Tablet`, `Injection`, `Capsule`, `Suspension`, `Syrup`, `Cream`, `Eye drops`, `Powder`, `Film-coated tablet`, `Liquid`, `Syrup/Suspension`, `Ointment`, `Gel`, `Water Soluble Powder`, `Dry Powder For Suspension`, `Drops`, `Injectable`, `Infusion`, `Oral solution`, `vaccine`, `Lotion`, `Dry powder for injection`, `Solution`, `Drench`, `Ear drops`, `Bolus`, `Oral suspension`, `Oral powder`, `Chewable tablet`, `Nasal Solution`, `Inhalation solution`, `Dry Suspension`, `Powder for injecion`, `Freeze Dried Vaccine`, `Powder for Solution`, `Capsule; hard`, `Ophthalmic solution`, `Capsules`, `Oral liquid`, `Dry Powder Suspension`, `Dry Syrup`, `Dry powder injection`, `Elixir`, `Bandage`, `Ophthalmic Ointment`, `Paed Drops`, `Topical solution`, `Sachet`, `Sachet (Granules / powder)`, `pessaries`, `Powder and solvent for solution for injection`, `Orodispersible tablet`, `Suture`, `Extended Release Film coated tablet`, `Powder for oral suspension`, `Tulle`, `Dry powder for syrup`, `Ear/eye drops; solution`, `Ophthalmic Drops`, `Scrub`, `Concentrate for solution for infusion`, `Extended Release Tablet`, `Balm`, `Eye drops; suspension`, `Blood Bag`, `Solution for peritoneal dialysis`, `Lozenges`, `Oral water soluble powder for Solution`, `Vial`, `Ampoule`, `Dry Powder`, `Suppositories`, `Injectable Suspension`, `Liquid Suspension`, `Coated tablet`, `Pellets/Granules`, `Solution for injection`, `Granules`, `Feed Premix`, `Granules for oral suspension`, `Emulsion`, `Gastro-resistant tablet`, `Oral Drench`, `Enteric Coated Tablet`, `Vaginal tablet`, `Oral drops`, `Plaster`, `Syringe`, `Capsule; soft`, `Inhaler`, `Solution for Injection in a Pre-filled Pen`, `Powder for injection`, `Gauze`, `Injectable for Infusion`, `Powder for solution for injection`, `Powder and solvent for oral suspension`, `Vaginal gel`, `Ophthalmic suspension`, `topical cream`, `Liquids`, `Gastro-resistant coated tablet`, `Injectable Suspension for Injection`, `Oral Water Soluble Powder`, `Cotton Wool`, `Eye drops; solution`, `Vaginal capsule`, `Spray`, `Injectable Preparation (vial with solvent)`, `Modified-release tablet`, `Soft Gelatin Capsule`, `Rectal solution`, `Solvent`, `Oral drops; powder for suspension`, `External Preparation`, `Enema`, `Patch`, `Prefilled Syringe`, `Suspension for injection`, `Topical`.

Normalization must preserve release, route-specific, and presentation modifiers rather than collapsing every value to tablet/capsule/solution.

## 5. Route Analysis

- Populated valid routes: 5,248.
- Missing/invalid routes: 4,151.
- Distinct valid raw values: 31.

| Route | Products |
|---|---:|
| Oral | 4,065 |
| Topical | 236 |
| Intravenous | 214 |
| IM/IV | 204 |
| Intramuscular | 141 |
| Parenteral | 116 |
| Ophthalmic | 95 |
| Subcutaneous | 33 |
| Buccal | 25 |
| Oropharyngeal | 20 |
| Vaginal | 19 |
| Nasal | 15 |
| Auricular/Otic | 13 |
| Intravascular | 12 |
| Intracavernous | 7 |
| Rectal | 7 |
| Transdermal | 5 |
| Intraocular | 3 |
| Intraperitoneal | 3 |
| Infiltration | 2 |
| Intraspinal | 2 |
| Respiratory/Inhalation | 2 |
| Cutaneous | 1 |
| Enteral | 1 |
| Epidural | 1 |
| Intrauterine | 1 |
| Intraventricular | 1 |
| Not applicable | 1 |
| Occlusive dressing technique | 1 |
| Subarachnoid | 1 |
| Sublingual | 1 |

Normalization issues:

- `IM/IV` is a multi-route value and cannot be collapsed to one route.
- `Parenteral` is broader than a specific injection route.
- Ophthalmic, intraocular, otic, and topical must remain distinct.
- Missing route blocks automatic comparison.

## 6. Pack Size Analysis

| Classification | Products | Percentage of all products |
|---|---:|---:|
| Normalizable pack | 5,083 | 54.08% |
| Populated but not automatically normalizable | 356 | 3.79% |
| Missing/sentinel pack | 3,960 | 42.13% |

Among populated packs, **93.45%** appear mechanically normalizable.

Common formats:

- `10's` — 464.
- `60ml` — 346.
- `14's` — 230.
- `1x10's` — 215.
- `1x10s` — 161.
- `10s` — 152.
- `1's` — 135.
- `2x10's` — 126.
- `2x10s` — 96.
- `5ml` — 86.
- `120ml` — 83.
- `50ml` — 79.
- `100ml` — 76.
- `3x10's` — 72.
- `30ml` — 65.
- `20's` — 64.
- `10gm` — 51.
- `1 vial` — 26.

Prominent non-normalizable values:

- Bare counts such as `10`, `1`, `20`, and `30`.
- `Vial`, `PER VIAL`, and casing variants without count.
- `AS PER SRO`.
- Ambiguous values such as `120 MA`.
- Misspelled dose/actuation formats.
- Mixed expressions such as `2mlxs`.

Most populated formats are recoverable, but missing packs remain a critical ceiling.

## 7. Manufacturer Analysis

| Metric | Result |
|---|---:|
| Products with manufacturer | 175 |
| Products missing manufacturer | 9,224 |
| Unique normalized manufacturers | 90 |
| Duplicate normalized-name groups | 8 |
| Manufacturer-country coverage | 164 products |

Observed duplicate variants include:

- Highnoon Laboratories.
- Novamed Pharmaceuticals.
- LG Chem.
- Zhejiang Ruibang Laboratories.
- Shanxi Shuguang Pharmaceutical.
- Hebei Yuanzheng Pharmaceutical.
- Mediate Pharmaceuticals.
- Serum Institute of India.

Manufacturer completeness is **Critical**. The product page structure only exposes structured manufacturer/MAH information for a small subset. An additional DRAP manufacturer/registration-holder source is required.

## 8. WHO Mapping Readiness

Measured against the committed mapping artefact after excluding known brand aliases:

| Classification | Unique molecule strings | Percentage |
|---|---:|---:|
| Exact automatically mappable | 5 | 0.24% |
| Plausible manual-review candidates | 42 | 2.04% |
| Unmatched | 2,008 | 97.71% |
| Total source molecule strings | 2,055 | 100% |

Method:

- Automatic: exact canonical-name match.
- Manual review: a unique high-similarity candidate.
- Brand-contaminated aliases were not accepted.

Major fragmentation examples:

- Fexofenadine HCl / hydrochloride / base name.
- Levofloxacin / hemihydrate variants.
- Montelukast / sodium variants.
- Amoxicillin trihydrate expressions.
- Metformin HCl / hydrochloride.
- Mecobalamin / mecobalamine.

The committed WHO mapping sample is not adequate for migration or customer comparison.

## 9. Golden Sample Feasibility

Counts include exact single-ingredient matches except the required two-ingredient Amoxicillin/Clavulanate sample.

| Sample | Exact products | With route | With pack | Numeric approved price | Feasibility |
|---|---:|---:|---:|---:|---|
| Paracetamol 500mg Tablet | 14 | 13 | 14 | 12 | **Feasible after mapping/review** |
| Ibuprofen 400mg Tablet | 4 | 4 | 4 | 4 | **Feasible after WHO mapping** |
| Metformin 500mg Tablet | 9 | 8 | 9 | 9 | **Feasible; release type requires separation** |
| Amoxicillin 500mg Capsule | 3 | 3 | 3 | 3 | **Feasible after salt normalization** |
| Amoxicillin + Clavulanic Acid 875/125 Tablet | 2 | 2 | 1 | 1 | **Partially feasible** |

Notable findings:

- Paracetamol source data includes combination products with codeine/caffeine; these must not enter the single-ingredient group.
- Metformin immediate-release and extended/sustained-release records require distinct groups.
- Amoxicillin uses several trihydrate/equivalence expressions.
- The two Amoxicillin/Clavulanate products prove composition feasibility, but one has `Nil` pack and textual `As per SRO` price.
- Manufacturer data is absent for the displayed golden records in this slice.
- No market/pharmacy prices exist in the DRAP corpus, so customer savings cannot be validated from DRAP alone.

## 10. Final Readiness Score

### Component scores

| Dimension | Score | Basis |
|---|---:|---|
| Data Quality | **61.2%** | Mean required-field coverage |
| Mapping Quality | **1.3%** | Exact mappings plus half credit for reviewable mappings |
| Pack Quality | **54.1%** | Normalizable packs across all products |
| Savings Readiness | **0%** | No pack-linked market prices |
| Marketplace Readiness | **5%** | Strong registration identity, but manufacturer and commercial-price evidence are largely absent |

Weighted overall score:

```text
Data Quality       30% × 61.2
Mapping Quality    25% × 1.3
Pack Quality       20% × 54.1
Savings Readiness  15% × 0
Marketplace        10% × 5
--------------------------------
Overall readiness: 30.0%
```

### Regulatory-price potential

Within the measurement slice:

- 5,202 products had complete composition/strength/form/route identity.
- 3,961 also had a normalized pack and numeric approved price.
- 435 composition-group/pack cells contained at least two products.
- 1,890 products belonged to those potentially comparable cells.

This represents **20.1%** theoretical approved-price comparison coverage, not marketplace savings readiness.

## Final finding

Real DRAP data can support a composition-group catalogue for a meaningful subset, including all five golden identities. It cannot yet support safe catalogue-wide comparison or savings.

Primary blockers:

1. WHO mapping coverage: Critical.
2. Missing composition: Critical.
3. Missing route: Critical.
4. Missing manufacturer: Critical.
5. Missing pack for 42.13% of products: High.
6. No pack-linked pharmacy market prices: Critical.
7. Parsed payload loses fields available in raw HTML: High.
8. Strength, salt, concentration, and release normalization: High.

Overall readiness: **30% — not ready for customer cutover; suitable for a constrained, manually validated golden catalogue and shadow migration only.**