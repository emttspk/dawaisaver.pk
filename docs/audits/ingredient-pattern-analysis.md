# Ingredient Pattern Analysis

Date: 2026-06-23
Source inputs: `docs/audits/molecule-salt-gap-analysis.md`, `docs/audits/molecule-salt-gap-analysis-top500.csv`.

## Executive summary

This review queue is constrained to the **862** unmatched ingredient strings from the prior salt-gap audit. Those strings account for **10,574** ingredient occurrences.

## Pattern statistics

| Pattern | Distinct strings | Occurrences | Examples |
| --- | --- | --- | --- |
| exact-normalization | 761 | 9554 | Atomoxetine hydrochloride eq. to Atomoxetine ; Enteric coated pellets of Esomeprazole Magnesium Trihydrate eq. to Esomeprazole |
| spelling_variant | 62 | 576 | GLIMEPRIDE+ PIOGLITAZONE ; Cefoparazone+Sulbactum |
| salt_variant | 15 | 174 | Adsorbed on Aluminum Phosphate, Al+++ ; Cefoperazone Sodium +Salbactum Sodium. |
| eq_to | 14 | 169 | Chlorhexidine Gluconate 7.1% w/w eq. to Chlorhexidine ; Orlistat immediate release pellets 50% w/w eq. to Orlistat |
| combination | 5 | 55 | Flucinolone Acetonide+ Hydroquinone + Tretinoin ; ? toxoid of tyep B, C and D Clostridium perfringens |
| descriptor_noise | 5 | 46 | Orlistat pellets 50% w/w ; 27mg rivastigmine base, in vivo release rate of 13.3mg/24hours |

## Recovery estimate

- Unmatched strings under review: **862**
- Auto-candidate strings (confidence >= 0.95): **823**
- Review-candidate strings (confidence >= 0.80): **857**
- Manual-review strings (confidence < 0.80): **5**
- Immediate product rows recoverable from auto-candidates only: **11,744 / 46,430 = 25.29%**
- Immediate composition signatures recoverable from auto-candidates only: **514 / 5,544 = 9.27%**
- If the full queue is approved, additional products recoverable: **34,686**
- If the full queue is approved, additional composition groups recoverable: **5,030**
- Final recovery after full approval: **100%** of observed composition rows and **100%** of composition signatures in scope.

## WHO importer outputs found

- `WHO data/who-molecule-mappings.json` exists locally and contains 10 canonical molecule keys with 50 total `pakistanNames` aliases.
- `WHO data/WHO ATC-DDD 2026-04-25.csv` exists locally and, when dry-run through the importer logic, yields 4,937 canonical molecules and 19,748 alias seeds.
- No persisted `molecule_aliases` / `atc_classifications` rows exist in the audited database snapshot.

## Top 100 unmatched ingredients

| Rank | Raw ingredient | Count | Suggested canonical molecule | Confidence | Pattern |
| --- | --- | --- | --- | --- | --- |
| 1 | Atomoxetine hydrochloride eq. to Atomoxetine | 225 | Atomoxetine hydrochloride eq. to Atomoxetine | 0.99 | exact-normalization |
| 2 | Enteric coated pellets of Esomeprazole Magnesium Trihydrate eq. to Esomeprazole | 188 | Enteric Coated Pellets of Esomeprazole Magnesium Trihydrate Eq. to Esomeprazole | 0.99 | exact-normalization |
| 3 | Artemether + Lumefantrine | 100 | Artemether + Lumefantrine | 0.99 | exact-normalization |
| 4 | Atomoxetine as hydrochloride | 87 | Atomoxetine as hydrochloride | 0.99 | exact-normalization |
| 5 | Tazobactam sodium eq to tazobactam | 87 | Tazobactam sodium eq to tazobactam | 0.99 | exact-normalization |
| 6 | Clavulanic potassium eq to clavulanic acid | 76 | Clavulanic potassium eq to clavulanic acid | 0.99 | exact-normalization |
| 7 | Ezetimibe + Simvastatin | 72 | Ezetimibe + Simvastatin | 0.99 | exact-normalization |
| 8 | Piperacillin (as sodium) | 66 | Piperacillin (as Sodium) | 0.99 | exact-normalization |
| 9 | Tazobactam (as sodium) | 66 | Tazobactam (as sodium) | 0.99 | exact-normalization |
| 10 | - | 61 | eq. to elemental Iron | 0.99 | exact-normalization |
| 11 | Cefepime hydrochloride with L-arginine eq. to Cefepime | 60 | Cefepime hydrochloride with L-arginine eq. to Cefepime | 0.99 | exact-normalization |
| 12 | Cefepime as HCl with L-arginine eq. to Cefipime | 58 | cefepime as HCL | 0.99 | exact-normalization |
| 13 | Alendronate (as sodium) | 56 | Alendronate(as Sodium) | 0.99 | exact-normalization |
| 14 | Doxazosin (as mesylate) | 55 | Doxazosin as Mesilate | 0.99 | exact-normalization |
| 15 | Sterile Ceftriaxone (as Sodium) | 48 | Sterile Ceftriaxone (as Sodium) | 0.99 | exact-normalization |
| 16 | Ceftazidime as pentahydrate with sodium carbonate | 45 | Ceftazidime as Ceftazidime Pentahydrate | 0.99 | exact-normalization |
| 17 | Sterile Cephradine Arginine eq. to Cephradine Base | 45 | Sterile Cephradine Arginine eq. to Cephradine Base | 0.99 | exact-normalization |
| 18 | Artemether + Lumifantrine | 44 | Artemether + Lumifantrine | 0.99 | exact-normalization |
| 19 | Tiotropium (as bromide monohydrate) | 42 | Tiotropium (as Bromide monohydrate) | 0.99 | exact-normalization |
| 20 | Bosentan Monohydrate eq to Bosentan | 41 | Bosentan monohydrate eq to Bosentan | 0.99 | exact-normalization |
| 21 | Esomeprazole enteric coated pellets (22.5% w/w) eq. to Esomeprazole | 40 | Esomeprazole enteric coated pellets (as Magnesium Trihydrate) | 0.99 | exact-normalization |
| 22 | Galantamine HBr eq to galantamine | 40 | Galantamine HBr eq to galantamine | 0.99 | exact-normalization |
| 23 | Ceftazidime as Pentahydrate buffered with sodium carbonate | 39 | Ceftazidime as Ceftazidime Pentahydrate | 0.99 | exact-normalization |
| 24 | Mupirocin(as calcium) | 38 | Mupirocin(as calcium dihydrate) | 0.99 | exact-normalization |
| 25 | Artemether+Lumefantrine | 37 | Artemether + Lumefantrine | 0.99 | exact-normalization |
| 26 | Salbactum (as Sodium) | 36 | Salbactum as Sodium | 0.99 | exact-normalization |
| 27 | Bosentan Monohydrate eq. to Bosentan | 34 | Bosentan monohydrate eq to Bosentan | 0.99 | exact-normalization |
| 28 | Levofloxacin(as Hemihydrate) | 34 | levofloxacin (as Hemihydrate) | 0.99 | exact-normalization |
| 29 | Ticarcillin disodium eq to Ticarcillin | 34 | Ticarcillin disodium eq to Ticarcillin | 0.99 | exact-normalization |
| 30 | Adsorbed on Aluminum Phosphate, Al+++ | 34 | Adsorbed on Aluminum Phosphate, Al+++ | 0.83 | salt_variant |
| 31 | Artemether +Lumefantrine | 33 | Artemether + Lumefantrine | 0.99 | exact-normalization |
| 32 | Bosentan as Monohydrate | 32 | Bosentan (as Monohydrate) | 0.99 | exact-normalization |
| 33 | Each ml contains: Lincomycin as HCl | 32 | Each ml contains: Lincomycin as HCl | 0.99 | exact-normalization |
| 34 | Olmesartan (as medoxomil) | 32 | Olmesartan (as medoxomil) | 0.99 | exact-normalization |
| 35 | Omeprazole (as enteric coated pellets 8.5% w/w) | 32 | Omeprazole as enteric coated pellets eq. to Omeprazole | 0.99 | exact-normalization |
| 36 | Salbactam (as Sodium Salt) | 32 | Salbactam (as Sodium Salt) | 0.99 | exact-normalization |
| 37 | GLIMEPRIDE+ PIOGLITAZONE | 32 | GLIMEPRIDE+ PIOGLITAZONE | 0.96 | spelling_variant |
| 38 | Alendronate (as Sodium) | 30 | Alendronate(as Sodium) | 0.99 | exact-normalization |
| 39 | Cefepime as HCl and L-Arginine eq. to Cefepime | 30 | cefepime as HCL | 0.99 | exact-normalization |
| 40 | Cefepime Hydrochloride with L Arginine eq. to Cefepime | 30 | Cefepime Hydrochloride with L Arginine eq. to Cefepime | 0.99 | exact-normalization |
| 41 | Cefquinome as Sulfate | 30 | Cefquinome as Sulfate | 0.99 | exact-normalization |
| 42 | Ceftriaxone(as sodium) | 30 | Ceftriaxone(as s0dium) | 0.99 | exact-normalization |
| 43 | Clemastine (as Hydrogen Fumarate) | 30 | Clemastine (as Hydrogen Fumarate) | 0.99 | exact-normalization |
| 44 | eq. to | 30 | eq. to elemental Iron | 0.99 | exact-normalization |
| 45 | Sterile Cefepime (as hydrochloride) | 30 | Sterile Cefepime (as hydrochloride) | 0.99 | exact-normalization |
| 46 | Sterile Cefotaxime Sodium eq. to Cefotaxime Base | 30 | Sterile Cefotaxime Sodium eq. to Cefotaxime Base | 0.99 | exact-normalization |
| 47 | . | 28 | eq. to elemental Iron | 0.99 | exact-normalization |
| 48 | Cefoperazone Sodium + Sulbactam Sodium | 28 | Cefoperazone Sodium + Sulbactam Sodium | 0.99 | exact-normalization |
| 49 | Cephradine with L-Arginine | 28 | Cephradine with L-Arginine eq. to Cephradine | 0.99 | exact-normalization |
| 50 | Chlorhexidine Gluconate 7.1% w/w eq. to Chlorhexidine | 28 | Chlorhexidine (as chlorhexidine digluconate solution 7.1%w/v) | 0.92 | eq_to |
| 51 | Atorvastatin(as Calcium Trihydrate) | 27 | Atorvastatin(calcium trihydrate) | 0.99 | exact-normalization |
| 52 | Azithromycin(as Dihydrate) | 27 | Azithromycin as dihydrate eq. Azithromycin | 0.99 | exact-normalization |
| 53 | Ceftraixone (as sodium) | 27 | Ceftraixone (as sodium) | 0.99 | exact-normalization |
| 54 | Clarithromycin (as 27.5% w/w taste masked granules) | 27 | Clarithromycin (as lactobionate) | 0.99 | exact-normalization |
| 55 | Iron-III-Hydroxide Polymaltose complex eq. to elemental Iron | 27 | Iron-III-hydroxide polymaltose complex eq. to Elemental Iron + Folic Acid | 0.99 | exact-normalization |
| 56 | Losartan Potassium + Hydrochlorothiazide | 27 | Losartan Potassium + Hydrochlorothiazide | 0.99 | exact-normalization |
| 57 | Rabeprazole(as sodium) | 27 | Rabeprazole (pellets) | 0.99 | exact-normalization |
| 58 | Cefoparazone+Sulbactum | 27 | Cefoparazone+Sulbactum | 0.96 | spelling_variant |
| 59 | cefoperazone (as sodium) +Sulbactam(as sodium) | 26 | cefoperazone + sulbactam | 0.99 | exact-normalization |
| 60 | Loratidine + Pseudoephedrine HCL | 26 | Loratidine + Pseudoephedrine HCL | 0.99 | exact-normalization |
| 61 | Orlistat pellets 50% w/w | 26 | Orlistat pellets 50% w/w | 0.79 | descriptor_noise |
| 62 | Alendronate as Sodium | 25 | Alendronate(as Sodium) | 0.99 | exact-normalization |
| 63 | Ceftazidime as Pentahydrate (Buffered with Sodium Bicarbonate) | 25 | Ceftazidime as Ceftazidime Pentahydrate | 0.99 | exact-normalization |
| 64 | Ceftazidime with Sodium Carbonate eq. to Ceftazidime sterile USP | 25 | Ceftazidime with Sodium Carbonate eq. to Ceftazidime sterile USP | 0.99 | exact-normalization |
| 65 | Eprosartan (as Mesylate) | 25 | Eprosartan (as Mesylate) | 0.99 | exact-normalization |
| 66 | Escitalopram(as Oxalate) | 25 | escitalopram as oxalate | 0.99 | exact-normalization |
| 67 | R/O water qs | 25 | R/O water qs | 0.96 | spelling_variant |
| 68 | Metoprolol as Succinate eq. to Metoprolol Tartrate | 24 | Metoprolol (as tartrate) | 0.99 | exact-normalization |
| 69 | Microencapsulated-ciprofloxacin eq. to Ciprofloxacin | 24 | Microencapsulated-ciprofloxacin eq. to Ciprofloxacin | 0.99 | exact-normalization |
| 70 | Salmeterol as xinafoate | 24 | Salmeterol (as xinafoate) | 0.99 | exact-normalization |
| 71 | Sterile Cefotaxime (as Sodium) | 24 | Sterile Cefotaxime (as Sodium) | 0.99 | exact-normalization |
| 72 | Morphine (Sulphate) | 23 | Morphine (Sulphate) | 0.99 | exact-normalization |
| 73 | Naftifine (as HCl) | 23 | Naftifine (as HCl) | 0.99 | exact-normalization |
| 74 | Omeprazole+Sodium bicarbonate | 23 | Omeprazole + Sodium Bicarbonate | 0.99 | exact-normalization |
| 75 | Artemthe/Lumefantrine | 22 | Artemthe/Lumefantrine | 0.96 | spelling_variant |
| 76 | Cefradine with L-Arginine | 21 | Cefradine with L-Arginine | 0.99 | exact-normalization |
| 77 | Ceftazidime as Pentahydrate and Sodium Carbonate | 21 | Ceftazidime as Ceftazidime Pentahydrate | 0.99 | exact-normalization |
| 78 | Salmeterol xinafoate eq. to Salmeterol | 21 | Salmeterol xinafoate eq. to Salmeterol | 0.99 | exact-normalization |
| 79 | Orlistat immediate release pellets 50% w/w eq. to Orlistat | 21 | orlistat | 0.92 | eq_to |
| 80 | Amlodipine + Atorvastatin | 20 | Amlodipine (as Besylate) + Atorvastatin (as Calcium Trihydrate) | 0.99 | exact-normalization |
| 81 | Cefazoline Sodium eq. to Cefazoline Base | 20 | Cefazoline Sodium eq. to Cefazoline Base | 0.99 | exact-normalization |
| 82 | Cefepime HCl with L-arginine eq. to Cefipime (anhydrous) | 20 | Cefepime HCl with L-Arginine eq. to Cefepime | 0.99 | exact-normalization |
| 83 | Cefepime with L-Arginine | 20 | Cefepime with L-Arginine eq. to Cefepime | 0.99 | exact-normalization |
| 84 | Cefixime(as Trihydrate) | 20 | cefixime as Trihydrate | 0.99 | exact-normalization |
| 85 | Ceftazidime Pentahydrate Sterile USP buffered with Sodium Carbonate Sterile eq. to Ceftazidime | 20 | Ceftazidime Pentahydrate Sterile USP buffered with Sodium Carbonate Sterile eq. to Ceftazidime | 0.99 | exact-normalization |
| 86 | Cofoperazone as Sodium | 20 | Cofoperazone as Sodium | 0.99 | exact-normalization |
| 87 | Corresponding to: | 20 | Corresponding to: | 0.99 | exact-normalization |
| 88 | Diclofenac Sodium (32% w/w enteric coated pellets) eq to Diclofenac Sodium | 20 | diclofenac sodium | 0.99 | exact-normalization |
| 89 | Metformin HCl + Pioglitazone as HCl | 20 | Metformin HCl + Pioglitazone as HCl | 0.99 | exact-normalization |
| 90 | Methylprednisolone (as sodium succinate) | 20 | Methylprednisolone (as sodium succinate) | 0.99 | exact-normalization |
| 91 | Nicotine Polacrilex eq. to Nicotine | 20 | Nicotine Polacrilex eq. to Nicotine | 0.99 | exact-normalization |
| 92 | Oprelvekin Recombinant Human Interleukin-11 (rHu1L - 11) | 20 | Oprelvekin Recombinant Human Interleukin-11 (rHu1L - 11) | 0.99 | exact-normalization |
| 93 | Piroxicam-Beta Cyclodextrine eq to piroxicam 20mg | 20 | Piroxicam-Beta Cyclodextrine eq to piroxicam 20mg | 0.99 | exact-normalization |
| 94 | Piroxicam(USP) | 20 | piroxicam | 0.99 | exact-normalization |
| 95 | Polyethylene(PU) Tape Benzalkonium Chloride Pad | 20 | Polyethylene(PU) Tape Benzalkonium Chloride Pad | 0.99 | exact-normalization |
| 96 | Salmeterol as Salmeterol xinafoate | 20 | Salmeterol (as xinafoate) | 0.99 | exact-normalization |
| 97 | Simvastatin + Ezetimibe | 20 | Simvastatin + Ezetimibe | 0.99 | exact-normalization |
| 98 | Valproate (as Sodium Salt) | 20 | Valproate (as Sodium Salt) | 0.99 | exact-normalization |
| 99 | Cefipime( as Cefipime HCL | 19 | Cefipime( as Cefipime HCL | 0.99 | exact-normalization |
| 100 | L-Arginine. | 19 | L-Arginine | 0.99 | exact-normalization |

## Recommendations

- Canonical molecule table should store one normalized molecule per row, with a stable key and no brand contamination.
- Synonym table should capture source alias, normalized alias, alias type, confidence, and evidence source.
- Salt, hydrate, eq-to, and spelling variants should be represented as auditable alias evidence rather than silently folded into the canonical row.
- Combination products should be promoted to composition-group candidates, not forced into single-molecule synonym rows.