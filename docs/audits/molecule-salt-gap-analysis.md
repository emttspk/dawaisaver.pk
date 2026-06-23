# Molecule ? Salt Mapping Coverage Analysis

Date: 2026-06-23
Scope: local database only, no code/schema changes, no assumptions, no hardcoded mappings.

## Executive finding

The local snapshot does not yet contain a persisted molecule catalogue layer. The curated tables that should hold canonical molecule, alias, ATC, and match data are empty, while the import corpus is populated. That means the current system cannot perform real salt-to-canonical molecule matching from stored catalogue data; recovery must be inferred from import strings only.

## 1) Current canonical molecule sources

| Table | Status | Rows | Notes |
| --- | --- | ---: | --- |
| `generics` | present | 0 | persisted catalogue/matching layer exists but is empty |
| `canonical_products` | present | 0 | persisted catalogue/matching layer exists but is empty |
| `canonical_product_aliases` | present | 0 | persisted catalogue/matching layer exists but is empty |
| `product_matches` | present | 0 | persisted catalogue/matching layer exists but is empty |
| `match_reviews` | present | 0 | persisted catalogue/matching layer exists but is empty |
| `equivalence_groups` | present | 0 | persisted catalogue/matching layer exists but is empty |
| `product_equivalence` | present | 0 | persisted catalogue/matching layer exists but is empty |
| `atc_classifications` | absent | 0 | no such table in the current database |
| `generic_atc_classifications` | absent | 0 | no such table in the current database |
| `generic_aliases` | absent | 0 | no such table in the current database |

## 2) Current DRAP composition sources

| Table | Status | Rows | Notes |
| --- | --- | ---: | --- |
| `products` | present | 0 | import rows exist, but normalized products/compositions are not populated |
| `product_compositions` | present | 0 | import rows exist, but normalized products/compositions are not populated |
| `import_batch_items` | present | 400276 | import rows exist, but normalized products/compositions are not populated |

## 3) Coverage statistics

- Total distinct ingredient strings in composition rows: **7,733**
- Matched by corpus-only normalization: **6,871** distinct strings (**88.85%**)
- Unmatched / manual-review strings: **862** distinct strings (**11.15%**)
- Ingredient-occurrence coverage: **375,386 / 385,960 = 97.26%**

Method counts:

- exact: **2,782**
- normalized: **4,089**
- alias: **0**
- manual: **862**

## 4) Product-level recovery estimate

- Import rows with composition data: **373,919**
- Rows fully recoverable with corpus-only normalization: **276,638 / 373,919 = 73.98%**
- Distinct registration numbers with composition data: **46,430**
- Distinct registration numbers fully recoverable: **34,454 / 46,430 = 74.21%**
- Unique recoverable composition signatures: **6,481**
- Total distinct observed composition signatures: **7,270**
- Signature recovery rate: **89.15%**

## 5) Top unmatched ingredient names

These are the highest-frequency ingredient strings that the corpus-only normalization pass could not safely collapse into a canonical molecule candidate without a manual review step. The current snapshot has no alias or ATC tables, so there is no persisted bridge layer to resolve them further.

| Rank | Ingredient name | Frequency | Suggested canonical molecule | Confidence | Match method |
| ---: | --- | ---: | --- | ---: | --- |
| 1 | Atomoxetine hydrochloride eq. to Atomoxetine | 225 | ? | 0.35 | manual |
| 2 | Enteric coated pellets of Esomeprazole Magnesium Trihydrate eq. to Esomeprazole | 188 | ? | 0.35 | manual |
| 3 | Artemether + Lumefantrine | 100 | ? | 0.30 | manual |
| 4 | Atomoxetine as hydrochloride | 87 | ? | 0.35 | manual |
| 5 | Tazobactam sodium eq to tazobactam | 87 | ? | 0.35 | manual |
| 6 | Clavulanic potassium eq to clavulanic acid | 76 | ? | 0.35 | manual |
| 7 | Ezetimibe + Simvastatin | 72 | ? | 0.30 | manual |
| 8 | Piperacillin (as sodium) | 66 | ? | 0.35 | manual |
| 9 | Tazobactam (as sodium) | 66 | ? | 0.35 | manual |
| 10 | - | 61 | ? | 0.35 | manual |
| 11 | Cefepime hydrochloride with L-arginine eq. to Cefepime | 60 | ? | 0.30 | manual |
| 12 | Cefepime as HCl with L-arginine eq. to Cefipime | 58 | ? | 0.30 | manual |
| 13 | Alendronate (as sodium) | 56 | ? | 0.35 | manual |
| 14 | Doxazosin (as mesylate) | 55 | ? | 0.35 | manual |
| 15 | Sterile Ceftriaxone (as Sodium) | 48 | ? | 0.35 | manual |
| 16 | Ceftazidime as pentahydrate with sodium carbonate | 45 | ? | 0.30 | manual |
| 17 | Sterile Cephradine Arginine eq. to Cephradine Base | 45 | ? | 0.35 | manual |
| 18 | Artemether + Lumifantrine | 44 | ? | 0.30 | manual |
| 19 | Tiotropium (as bromide monohydrate) | 42 | ? | 0.35 | manual |
| 20 | Bosentan Monohydrate eq to Bosentan | 41 | ? | 0.35 | manual |
| 21 | Esomeprazole enteric coated pellets (22.5% w/w) eq. to Esomeprazole | 40 | ? | 0.30 | manual |
| 22 | Galantamine HBr eq to galantamine | 40 | ? | 0.35 | manual |
| 23 | Ceftazidime as Pentahydrate buffered with sodium carbonate | 39 | ? | 0.30 | manual |
| 24 | Mupirocin(as calcium) | 38 | ? | 0.35 | manual |
| 25 | Artemether+Lumefantrine | 37 | ? | 0.30 | manual |
| 26 | Salbactum (as Sodium) | 36 | ? | 0.35 | manual |
| 27 | Adsorbed on Aluminum Phosphate, Al+++ | 34 | ? | 0.30 | manual |
| 28 | Bosentan Monohydrate eq. to Bosentan | 34 | ? | 0.35 | manual |
| 29 | Levofloxacin(as Hemihydrate) | 34 | ? | 0.35 | manual |
| 30 | Ticarcillin disodium eq to Ticarcillin | 34 | ? | 0.35 | manual |
| 31 | Artemether +Lumefantrine | 33 | ? | 0.30 | manual |
| 32 | Bosentan as Monohydrate | 32 | ? | 0.35 | manual |
| 33 | Each ml contains: Lincomycin as HCl | 32 | ? | 0.35 | manual |
| 34 | GLIMEPRIDE+ PIOGLITAZONE | 32 | ? | 0.30 | manual |
| 35 | Olmesartan (as medoxomil) | 32 | ? | 0.35 | manual |
| 36 | Omeprazole (as enteric coated pellets 8.5% w/w) | 32 | ? | 0.30 | manual |
| 37 | Salbactam (as Sodium Salt) | 32 | ? | 0.35 | manual |
| 38 | Alendronate (as Sodium) | 30 | ? | 0.35 | manual |
| 39 | Cefepime Hydrochloride with L Arginine eq. to Cefepime | 30 | ? | 0.30 | manual |
| 40 | Cefepime as HCl and L-Arginine eq. to Cefepime | 30 | ? | 0.30 | manual |
| 41 | Cefquinome as Sulfate | 30 | ? | 0.35 | manual |
| 42 | Ceftriaxone(as sodium) | 30 | ? | 0.35 | manual |
| 43 | Clemastine (as Hydrogen Fumarate) | 30 | ? | 0.35 | manual |
| 44 | Sterile Cefepime (as hydrochloride) | 30 | ? | 0.35 | manual |
| 45 | Sterile Cefotaxime Sodium eq. to Cefotaxime Base | 30 | ? | 0.35 | manual |
| 46 | eq. to | 30 | ? | 0.35 | manual |
| 47 | . | 28 | ? | 0.35 | manual |
| 48 | Cefoperazone Sodium + Sulbactam Sodium | 28 | ? | 0.30 | manual |
| 49 | Cephradine with L-Arginine | 28 | ? | 0.30 | manual |
| 50 | Chlorhexidine Gluconate 7.1% w/w eq. to Chlorhexidine | 28 | ? | 0.30 | manual |
| 51 | Atorvastatin(as Calcium Trihydrate) | 27 | ? | 0.35 | manual |
| 52 | Azithromycin(as Dihydrate) | 27 | ? | 0.35 | manual |
| 53 | Cefoparazone+Sulbactum | 27 | ? | 0.30 | manual |
| 54 | Ceftraixone (as sodium) | 27 | ? | 0.35 | manual |
| 55 | Clarithromycin (as 27.5% w/w taste masked granules) | 27 | ? | 0.30 | manual |
| 56 | Iron-III-Hydroxide Polymaltose complex eq. to elemental Iron | 27 | ? | 0.35 | manual |
| 57 | Losartan Potassium + Hydrochlorothiazide | 27 | ? | 0.30 | manual |
| 58 | Rabeprazole(as sodium) | 27 | ? | 0.35 | manual |
| 59 | Loratidine + Pseudoephedrine HCL | 26 | ? | 0.30 | manual |
| 60 | Orlistat pellets 50% w/w | 26 | ? | 0.30 | manual |
| 61 | cefoperazone (as sodium) +Sulbactam(as sodium) | 26 | ? | 0.30 | manual |
| 62 | Alendronate as Sodium | 25 | ? | 0.35 | manual |
| 63 | Ceftazidime as Pentahydrate (Buffered with Sodium Bicarbonate) | 25 | ? | 0.30 | manual |
| 64 | Ceftazidime with Sodium Carbonate eq. to Ceftazidime sterile USP | 25 | ? | 0.30 | manual |
| 65 | Eprosartan (as Mesylate) | 25 | ? | 0.35 | manual |
| 66 | Escitalopram(as Oxalate) | 25 | ? | 0.35 | manual |
| 67 | R/O water qs | 25 | ? | 0.30 | manual |
| 68 | Metoprolol as Succinate eq. to Metoprolol Tartrate | 24 | ? | 0.35 | manual |
| 69 | Microencapsulated-ciprofloxacin eq. to Ciprofloxacin | 24 | ? | 0.35 | manual |
| 70 | Salmeterol as xinafoate | 24 | ? | 0.35 | manual |
| 71 | Sterile Cefotaxime (as Sodium) | 24 | ? | 0.35 | manual |
| 72 | Morphine (Sulphate) | 23 | ? | 0.35 | manual |
| 73 | Naftifine (as HCl) | 23 | ? | 0.35 | manual |
| 74 | Omeprazole+Sodium bicarbonate | 23 | ? | 0.30 | manual |
| 75 | Artemthe/Lumefantrine | 22 | ? | 0.30 | manual |
| 76 | Cefradine with L-Arginine | 21 | ? | 0.30 | manual |
| 77 | Ceftazidime as Pentahydrate and Sodium Carbonate | 21 | ? | 0.30 | manual |
| 78 | Orlistat immediate release pellets 50% w/w eq. to Orlistat | 21 | ? | 0.30 | manual |
| 79 | Salmeterol xinafoate eq. to Salmeterol | 21 | ? | 0.35 | manual |
| 80 | Amlodipine + Atorvastatin | 20 | ? | 0.30 | manual |
| 81 | Cefazoline Sodium eq. to Cefazoline Base | 20 | ? | 0.35 | manual |
| 82 | Cefepime HCl with L-arginine eq. to Cefipime (anhydrous) | 20 | ? | 0.30 | manual |
| 83 | Cefepime with L-Arginine | 20 | ? | 0.30 | manual |
| 84 | Cefixime(as Trihydrate) | 20 | ? | 0.35 | manual |
| 85 | Ceftazidime Pentahydrate Sterile USP buffered with Sodium Carbonate Sterile eq. to Ceftazidime | 20 | ? | 0.30 | manual |
| 86 | Cofoperazone as Sodium | 20 | ? | 0.35 | manual |
| 87 | Corresponding to: | 20 | ? | 0.35 | manual |
| 88 | Diclofenac Sodium (32% w/w enteric coated pellets) eq to Diclofenac Sodium | 20 | ? | 0.30 | manual |
| 89 | Metformin HCl + Pioglitazone as HCl | 20 | ? | 0.30 | manual |
| 90 | Methylprednisolone (as sodium succinate) | 20 | ? | 0.35 | manual |
| 91 | Nicotine Polacrilex eq. to Nicotine | 20 | ? | 0.35 | manual |
| 92 | Oprelvekin Recombinant Human Interleukin-11 (rHu1L - 11) | 20 | ? | 0.35 | manual |
| 93 | Piroxicam(USP) | 20 | ? | 0.35 | manual |
| 94 | Piroxicam-Beta Cyclodextrine eq to piroxicam 20mg | 20 | ? | 0.35 | manual |
| 95 | Polyethylene(PU) Tape Benzalkonium Chloride Pad | 20 | ? | 0.35 | manual |
| 96 | Salmeterol as Salmeterol xinafoate | 20 | ? | 0.35 | manual |
| 97 | Simvastatin + Ezetimibe | 20 | ? | 0.30 | manual |
| 98 | Valproate (as Sodium Salt) | 20 | ? | 0.35 | manual |
| 99 | Betamethasone Dipropionate 0.064 % w/w eq. to Betamethasone | 19 | ? | 0.30 | manual |
| 100 | Cefipime( as Cefipime HCL | 19 | ? | 0.35 | manual |
| 101 | L-Arginine. | 19 | ? | 0.35 | manual |
| 102 | Pheniramine as Maleate | 19 | ? | 0.35 | manual |
| 103 | Vilanterol (As Trifenatate) | 19 | ? | 0.35 | manual |
| 104 | Alendronate as sodium………70mg | 18 | ? | 0.35 | manual |
| 105 | Attenuated avian infectious Bursal Disease Virus (intermediate strain) Taishu strain | 18 | ? | 0.35 | manual |
| 106 | CYD Dengue Virus Serotype 1 (Produced in Serum Free Vero Cells by Recombinant DNA Technology) | 18 | ? | 0.35 | manual |
| 107 | CYD Dengue Virus Serotype 2 (Produced in Serum Free Vero Cells by Recombinant DNA Technology) | 18 | ? | 0.35 | manual |
| 108 | CYD Dengue Virus Serotype 3 (Produced in Serum Free Vero Cells by Recombinant DNA Technology) | 18 | ? | 0.35 | manual |
| 109 | CYD Dengue Virus Serotype 4 (Produced in Serum Free Vero Cells by Recombinant DNA Technology) | 18 | ? | 0.35 | manual |
| 110 | Cefepime as HCl with L-Arginine | 18 | ? | 0.30 | manual |
| 111 | Cefiroxime as Axetil | 18 | ? | 0.35 | manual |
| 112 | Cefoparazone (as Sodium) | 18 | ? | 0.35 | manual |
| 113 | Cefoperazone + Sulbactam | 18 | ? | 0.30 | manual |
| 114 | Cefoperazone Sodium +Salbactum Sodium. | 18 | ? | 0.30 | manual |
| 115 | Clomiphne citrate. | 18 | ? | 0.35 | manual |
| 116 | Each tablet contains; Escitalopram as oxalate .. | 18 | ? | 0.35 | manual |
| 117 | Erythropoietin. | 18 | ? | 0.35 | manual |
| 118 | Fusidic Acid + Hydrocortisone Acetate | 18 | ? | 0.30 | manual |
| 119 | Glimepiride + Metformin | 18 | ? | 0.30 | manual |
| 120 | Indacaterol Maleate eq. to Indacaterol | 18 | ? | 0.35 | manual |
| 121 | Iron protein succinylate (eq. Iron (Fe+3) 40mg) | 18 | ? | 0.30 | manual |
| 122 | Iron-III Hydroxide Polymaltose complex eq. to Elemetal Iron + Folic acid | 18 | ? | 0.30 | manual |
| 123 | Naratriptan as HCl | 18 | ? | 0.35 | manual |
| 124 | Omeprazole + Sodium Bicarbonate | 18 | ? | 0.30 | manual |
| 125 | Rosuvastatin as Calcium/ Ezetimibe | 18 | ? | 0.30 | manual |
| 126 | Silicon Dioxide(Aerosil) | 18 | ? | 0.35 | manual |
| 127 | Sterile Capreomycin Sulphate eq to Capreomycin | 18 | ? | 0.35 | manual |
| 128 | Sterile Tazobactam Sodium eq.to Tazobactam | 18 | ? | 0.35 | manual |
| 129 | Sterile piperacillin sodium eq. to Piperacillin | 18 | ? | 0.35 | manual |
| 130 | Tetrahydrate cobalt (ii) acetate | 18 | ? | 0.35 | manual |
| 131 | Valsartan+Hydrochlorothiazide | 18 | ? | 0.30 | manual |
| 132 | azithromycinazithromycin as dihydrate | 18 | ? | 0.35 | manual |
| 133 | rBST (Recombinant Bovine Somatotropin) Lyophilized | 18 | ? | 0.35 | manual |
| 134 | Acefylline Piperazine 45mg + Diphenhydramine HCI 8mg | 17 | ? | 0.30 | manual |
| 135 | Cephradine Sterile with Arginine Sterile | 17 | ? | 0.30 | manual |
| 136 | Diloxanide Furoate ....250mg+ Metronidazole Benzoate equivalent to Metronidazole....200mg | 17 | ? | 0.30 | manual |
| 137 | Diptheria Toxoid and Tetanus Toxoid and Tetanus Toxoid | 17 | ? | 0.30 | manual |
| 138 | Each 5ml contains : Paracetamol / Dedtromethorphan HBr / Promethazine HCI.. | 17 | ? | 0.30 | manual |
| 139 | Each DS tablet contains:- Diloxanide Furoate + Metronidazole | 17 | ? | 0.30 | manual |
| 140 | Each tablet contains:- Diloxanide Furoate + Metronidazole | 17 | ? | 0.30 | manual |
| 141 | Elemental iron + Folic acid | 17 | ? | 0.30 | manual |
| 142 | Eprison (As HCL | 17 | ? | 0.35 | manual |
| 143 | Flucinolone Acetonide+ Hydroquinone + Tretinoin | 17 | ? | 0.30 | manual |
| 144 | Ibuprofen 100mg + Pseudoephedrine HCI 15mg | 17 | ? | 0.30 | manual |
| 145 | Inactivated Newcastle Disease NDV/Chicken/Egypt/11478AF/2011 (ND) | 17 | ? | 0.30 | manual |
| 146 | Metoprolol Succinate eq. to Metoprolol Tartate | 17 | ? | 0.35 | manual |
| 147 | Metronidazole (as Benzoate) + Furazolidone | 17 | ? | 0.30 | manual |
| 148 | Polio virus (Inactivated) | 17 | ? | 0.35 | manual |
| 149 | Sodium Cromoglycate /Tetrahydrozoline | 17 | ? | 0.30 | manual |
| 150 | Tamsulosin Hydrochloride SR pellets 0.2% w/w ≡Tamsulosin HCL | 17 | ? | 0.30 | manual |
| 151 | Tiotropium ( as bromide mono hydrate) | 17 | ? | 0.35 | manual |
| 152 | Tiotropium (as Bromide monohydrate) | 17 | ? | 0.35 | manual |
| 153 | aluminum phosphate gel eq. to Al+++ | 17 | ? | 0.30 | manual |
| 154 | meropenem(as meropenem trihydrate) | 17 | ? | 0.35 | manual |
| 155 | Atenolol. | 16 | ? | 0.35 | manual |
| 156 | Cefoperazone as sodium + Sulbactam | 16 | ? | 0.30 | manual |
| 157 | Each Capsule Contains: Lincomycine as HCl | 16 | ? | 0.35 | manual |
| 158 | Each capsule contains: Esomeprazole Magnesium Trihydrate enteric coated pellets eq. to Esomeprazole | 16 | ? | 0.35 | manual |
| 159 | Esomeprazole (as enteric coated pellets 22.5% w/w) | 16 | ? | 0.30 | manual |
| 160 | Glyceryl Trinitrate 2% with Lactose | 16 | ? | 0.30 | manual |
| 161 | Linezolid. | 16 | ? | 0.35 | manual |
| 162 | Live, frozen vaccine, Marek’s disease HVT strain and Newcastle disease virus Serotype 3, Live Marek’s disease Vector, for the active immunization of chickens against Marek’s disease and Newcastle dis | 16 | ? | 0.30 | manual |
| 163 | Lymecycline eq. to Tetracycline | 16 | ? | 0.35 | manual |
| 164 | Metronidazole+Diloxamide Furoate | 16 | ? | 0.30 | manual |
| 165 | Paracetamol + Caffeine + Chlorpheniramine Maleate | 16 | ? | 0.30 | manual |
| 166 | Pazopanib (As Hydrochloride) | 16 | ? | 0.35 | manual |
| 167 | Piroxcam (as Betadex) | 16 | ? | 0.35 | manual |
| 168 | Radeparzole as sodium | 16 | ? | 0.35 | manual |
| 169 | Recombinant Human Granulocyte Colony-Stimulating Factor (rhG-CSF) | 16 | ? | 0.35 | manual |
| 170 | Sterile Cefoperazone (as Sodium) | 16 | ? | 0.35 | manual |
| 171 | Vinorelbine Tartrate eq. to Vinorelbine | 16 | ? | 0.35 | manual |
| 172 | (III)Hydroxide Polymaltose Complex to Elemental Iron | 15 | ? | 0.35 | manual |
| 173 | ------- | 15 | ? | 0.35 | manual |
| 174 | -III Hydroxide Polymaltose complex equivalent to elemental Iron | 15 | ? | 0.35 | manual |
| 175 | A1+++ (as AIPO4) | 15 | ? | 0.30 | manual |
| 176 | Amlodipine(as Besylate) | 15 | ? | 0.35 | manual |
| 177 | Atorvastatin(as Calcium) | 15 | ? | 0.35 | manual |
| 178 | Azithromycine Dihydrate eq. to Azithromycin | 15 | ? | 0.35 | manual |
| 179 | Buspirone HCl eq to Buspirone | 15 | ? | 0.35 | manual |
| 180 | Cephradine with L-Arginine eq. to Cephradine | 15 | ? | 0.30 | manual |
| 181 | Dapagliflozin propanediol monohydrate eq. to Dapagliflozin | 15 | ? | 0.35 | manual |
| 182 | Dexketoprofen as Trometamol | 15 | ? | 0.35 | manual |
| 183 | Domeridone as Maleate | 15 | ? | 0.35 | manual |
| 184 | Doxazosin as Mesylate | 15 | ? | 0.35 | manual |
| 185 | Each 100ml contains: Chorphenamine Maleate ....100mg,Terpin hydrate ....200mg,Potassium bicarbonate .....2mg,Ammonium chloride.....500mg, Tincture senega.....1ml , Menthol.......20mg, Ephedrine HCI... | 15 | ? | 0.35 | manual |
| 186 | Each 5ml contains: Cefixime (as Trihydrate) | 15 | ? | 0.35 | manual |
| 187 | Each tablet contains: Betahistine (BP Specification) | 15 | ? | 0.35 | manual |
| 188 | Each1mlcontains:- (Cetirizine1.0mg) | 15 | ? | 0.35 | manual |
| 189 | Each20gmsContains:- (Diclofenacdiethylammoniumsalt 0.2494gms) | 15 | ? | 0.35 | manual |
| 190 | Each20gmsContains:- (PolymyxinB Sulphate10,000units, Bacitracinzinc500units) | 15 | ? | 0.35 | manual |
| 191 | Each2mlContains:- (AmikacinSulphate100mg) | 15 | ? | 0.35 | manual |
| 192 | Each2mlContains:- (Gentamycin80mg) | 15 | ? | 0.35 | manual |
| 193 | Each2mlContains:- (Kanamycine500mg) | 15 | ? | 0.35 | manual |
| 194 | Each2mlContains:- (TobramycinasSulphate20mg) | 15 | ? | 0.35 | manual |
| 195 | Each4mlContains:- (Kanamycine1.0gm) | 15 | ? | 0.35 | manual |
| 196 | Each5mlcontains:- (Famotidine10mg) | 15 | ? | 0.35 | manual |
| 197 | Each5mlcontains:- (Ibuprofen100mg) | 15 | ? | 0.35 | manual |
| 198 | Each5mlcontains:- (IronIII HydroxidePolyMaltose 50mg) | 15 | ? | 0.35 | manual |
| 199 | Each5mlcontains:- (MefenamicAcid50mg) | 15 | ? | 0.35 | manual |
| 200 | Each5mlcontains:- (PromethazineHCl25mg) | 15 | ? | 0.35 | manual |
| 201 | Each60mlContains:- (Minoxidil2%) | 15 | ? | 0.35 | manual |
| 202 | EachTabletcontains: (Pantoprazole40mg) | 15 | ? | 0.35 | manual |
| 203 | EachTabletcontains:- (Famotidine20mg) | 15 | ? | 0.35 | manual |
| 204 | EachTabletcontains:- (Fexofenadine120mg) | 15 | ? | 0.35 | manual |
| 205 | EachTabletcontains:- (Fexofenadine180mg) | 15 | ? | 0.35 | manual |
| 206 | EachTabletcontains:- (Ibuprofen200mg) | 15 | ? | 0.35 | manual |
| 207 | EachTabletcontains:- (Mecobalamine500mcg) | 15 | ? | 0.35 | manual |
| 208 | EachTabletcontains:- (MefenamicAcid500mg) | 15 | ? | 0.35 | manual |
| 209 | EachTabletcontains:- (Meloxicam15mg) | 15 | ? | 0.35 | manual |
| 210 | EachTabletcontains:- (Meloxicam7.5mg) | 15 | ? | 0.35 | manual |
| 211 | EachTabletcontains:- (Paracetamol500mg) | 15 | ? | 0.35 | manual |
| 212 | EachVialContains:- (CefotaximeSodium1.0gm) | 15 | ? | 0.35 | manual |
| 213 | EachVialContains:- (CefotaximeSodium250mg) | 15 | ? | 0.35 | manual |
| 214 | EachVialContains:- (Ceftazidime1.0gm) | 15 | ? | 0.35 | manual |
| 215 | EachVialContains:- (Ceftazidime250mg) | 15 | ? | 0.35 | manual |
| 216 | EachVialContains:- (Ceftazidime500mg) | 15 | ? | 0.35 | manual |
| 217 | EachVialContains:- (Cefuroxime1.5gm) | 15 | ? | 0.35 | manual |
| 218 | EachVialContains:- (Cefuroxime250mg) | 15 | ? | 0.35 | manual |
| 219 | EachVialContains:- (Cefuroxime750mg) | 15 | ? | 0.35 | manual |
| 220 | EachVialContains:- (Cepharadine1.0gm) | 15 | ? | 0.35 | manual |
| 221 | EachVialContains:- (Cepharadine250mg) | 15 | ? | 0.35 | manual |
| 222 | EachVialContains:- (Cepharadine500mg) | 15 | ? | 0.35 | manual |
| 223 | EachmlContains:- (Gentamycin40mg) | 15 | ? | 0.35 | manual |
| 224 | Eflornithine (as hydrochloride monohydrate)....11.5% (Equivalent to Eflornithine Hydrochloride (as m | 15 | ? | 0.35 | manual |
| 225 | Imatinib mesilate Eq. to Imatinib | 15 | ? | 0.35 | manual |
| 226 | Lidocain as hydrochloride | 15 | ? | 0.35 | manual |
| 227 | Lymecycline 408mg eq. to Tetracycline | 15 | ? | 0.35 | manual |
| 228 | Newcastle Disease Virus-Fusion(F) Protein | 15 | ? | 0.35 | manual |
| 229 | Pasireotide (as Pasireotide diaspartate) | 15 | ? | 0.35 | manual |
| 230 | Pioglitazone + Glimepiride | 15 | ? | 0.30 | manual |
| 231 | Sterile Cefoperazone Sodium eq. to Cefoperazone | 15 | ? | 0.35 | manual |
| 232 | Sterile Chloramphenicol Sodium Succinate eq. to Chloramphenicol Base | 15 | ? | 0.35 | manual |
| 233 | Sterile Sulbactum Sodium eq. to Sulbactum | 15 | ? | 0.35 | manual |
| 234 | Turkey Herpesvirus (HVT) | 15 | ? | 0.35 | manual |
| 235 | imidocarb as dipropionate | 15 | ? | 0.35 | manual |
| 236 | ron (III) hydroxide polymaltsoe complex eq. to elemental iron | 15 | ? | 0.35 | manual |
| 237 | Alendronate as sodium | 14 | ? | 0.35 | manual |
| 238 | Artemether/Lumefantrine | 14 | ? | 0.30 | manual |
| 239 | Bosentan (as Monohydrate) | 14 | ? | 0.35 | manual |
| 240 | Cefdroxil as (Monohydrate) USP | 14 | ? | 0.35 | manual |
| 241 | Cefepime HCl with L-Arginine eq. to Cefepime | 14 | ? | 0.30 | manual |
| 242 | Cefepime as HCl with L- Arginine | 14 | ? | 0.30 | manual |
| 243 | Cefoprazone + Sulbactum | 14 | ? | 0.30 | manual |
| 244 | Cefpirome sulphate with sodium carbonate eq to Cefpirome | 14 | ? | 0.30 | manual |
| 245 | Ceftazidime pentahydrate with sodium carbonate eq. to Ceftazidime | 14 | ? | 0.30 | manual |
| 246 | Clavulanic acid/ amoxicillin | 14 | ? | 0.30 | manual |
| 247 | Freeze Dried Avian Infectious Bronchitis Disease virus (Massachusetts H-120 Strain) not less than | 14 | ? | 0.35 | manual |
| 248 | Gadobutrol (equivalent to 604.72mg Gadobutrol) | 14 | ? | 0.35 | manual |
| 249 | Inactivated Hydropericardium syndrome virus (adenovirus) not less than | 14 | ? | 0.35 | manual |
| 250 | Iron Polymaltose + Folic acid | 14 | ? | 0.30 | manual |
| 251 | Levofloxacine (As hemihydrates | 14 | ? | 0.35 | manual |
| 252 | Levofloxacine (as Hemihydrate) | 14 | ? | 0.35 | manual |
| 253 | Prednisolone. | 14 | ? | 0.35 | manual |
| 254 | Salbactum as Sodium | 14 | ? | 0.35 | manual |
| 255 | Sterile Lyophilized Gemcitabine HCl eq. to Gemcitabine | 14 | ? | 0.35 | manual |
| 256 | Sterile clavulanate potassium eq. to clavulanic acid | 14 | ? | 0.35 | manual |
| 257 | Sterile ticarcillin sodium eq. to ticarcillin | 14 | ? | 0.35 | manual |
| 258 | Bovine Rhinotracheitis Virus (IBR) | 13 | ? | 0.35 | manual |
| 259 | Bovine Virus Diarrhea Virus (BVD) | 13 | ? | 0.35 | manual |
| 260 | Bovine respiratory syncytial Virus (BRSV) | 13 | ? | 0.35 | manual |
| 261 | Calcipotril Hydrate eq. to Calcipotriol (Anhydrous) | 13 | ? | 0.35 | manual |
| 262 | Carbopol (adjuvant 0.5%) | 13 | ? | 0.35 | manual |
| 263 | Control Released Pellets Containing Tamsulosin HCl eq. to Tamsulosin | 13 | ? | 0.35 | manual |
| 264 | ENROFLOXACIN, | 13 | ? | 0.35 | manual |
| 265 | Equine Influenza, strain A/Equi-2/Ohio/03 | 13 | ? | 0.30 | manual |
| 266 | Equine Influenza, strain Kentucky/95, subtype A2 | 13 | ? | 0.30 | manual |
| 267 | Equine Influenza, strain newmarket/2/93, subtype A2 | 13 | ? | 0.30 | manual |
| 268 | Ethylene diamine tetra acetic acid (chelating agent 14%) | 13 | ? | 0.35 | manual |
| 269 | Fluphenazine as Decanoate | 13 | ? | 0.35 | manual |
| 270 | Human Albumin (human plasma protein with at least 96% albumin) | 13 | ? | 0.30 | manual |
| 271 | Myxovirus parainfluenza3(PI3) | 13 | ? | 0.35 | manual |
| 272 | Sulbactam(as Sodium) | 13 | ? | 0.35 | manual |
| 273 | Alprazolam. | 12 | ? | 0.35 | manual |
| 274 | Artemether and Lumefantrine | 12 | ? | 0.30 | manual |
| 275 | Atorvastatin as Calcium Trihydrate + Ezetimibe | 12 | ? | 0.30 | manual |
| 276 | Bromocriptine as meshlate | 12 | ? | 0.35 | manual |
| 277 | Cefepime as HCl with Sterile Arginine | 12 | ? | 0.30 | manual |
| 278 | Cefoperazone As sodium + Sulbactum as Sodium | 12 | ? | 0.30 | manual |
| 279 | Cefoperazone sodium and Sulbactam Sodium | 12 | ? | 0.30 | manual |
| 280 | Dextropropoxyphene as HCL | 12 | ? | 0.35 | manual |
| 281 | Divalproex (as sodium) | 12 | ? | 0.35 | manual |
| 282 | Enteric coated pellets Duloxetine (as hydrochloride) | 12 | ? | 0.35 | manual |
| 283 | hiamine HCI (Vitamin B1) | 12 | ? | 0.35 | manual |
| 284 | Cyclobenzaprine as hydrochloride | 11 | ? | 0.35 | manual |
| 285 | Dorzolamide as HCL + Timolol as Maleate | 11 | ? | 0.30 | manual |
| 286 | Glucosamine Sulphate as Potassium Chloride + Chondroitin Sulphate as Sodium | 11 | ? | 0.30 | manual |
| 287 | 0.8% Mannitol Solution In Water For Injection. | 10 | ? | 0.35 | manual |
| 288 | 1-ethyl-6-fluoro-1, 4 dihydro-4-oxo-7-(-1-piperazinyl)-3-quinoline carboxylic acid. | 10 | ? | 0.35 | manual |
| 289 | 280mg of Extended Release granules of anhydrous Theophylline eq to 200mg of USP Anhydrous Theophylli | 10 | ? | 0.35 | manual |
| 290 | ? toxoid of tyep B, C and D Clostridium perfringens | 10 | ? | 0.30 | manual |
| 291 | ? toxoid of type B, C and D Clostridium perfringens | 10 | ? | 0.30 | manual |
| 292 | ?-keto analogue to isoleucine (calcium salt) | 10 | ? | 0.35 | manual |
| 293 | ?-keto analogue to leucine (calcium salt) | 10 | ? | 0.35 | manual |
| 294 | ?-keto analogue to methionine (calcium salt) | 10 | ? | 0.35 | manual |
| 295 | ?-keto analogue to phenylalanine (calcium salt) | 10 | ? | 0.35 | manual |
| 296 | Acepromazine as Maleate | 10 | ? | 0.35 | manual |
| 297 | Acetylsalicyclic Acid (Aspirin) | 10 | ? | 0.35 | manual |
| 298 | Ambroxol as HCl | 10 | ? | 0.35 | manual |
| 299 | Amlodipine (as Besylate) + Atorvastatin (as Calcium Trihydrate) | 10 | ? | 0.30 | manual |
| 300 | Anhydrous benzoyl peroxide (as hydrous benzoyl peroxide) | 10 | ? | 0.35 | manual |
| 301 | Artemether 20 + Lumefantrine 120mg | 10 | ? | 0.30 | manual |
| 302 | Artemether 40mg+ Lumefantrine 240mg | 10 | ? | 0.30 | manual |
| 303 | Artemether+ Lumefantrine | 10 | ? | 0.30 | manual |
| 304 | Atorvasatin as calcium trihydrate | 10 | ? | 0.35 | manual |
| 305 | Atorvastatin(as calcium trihydrated salt) | 10 | ? | 0.35 | manual |
| 306 | Avian Influenza Inactivated virus (H7 serotype) | 10 | ? | 0.35 | manual |
| 307 | Avian Influenza Inactivated virus (H9 serotype) | 10 | ? | 0.35 | manual |
| 308 | Azithromycine (as dihydrate) | 10 | ? | 0.35 | manual |
| 309 | B/Phuket/3073/2013 | 10 | ? | 0.30 | manual |
| 310 | Belimumab(Human IgG 1? monoclonal antibody) | 10 | ? | 0.35 | manual |
| 311 | Bosentan monohydrate eq to Bosentan | 10 | ? | 0.35 | manual |
| 312 | Bromocriptine (as mesylate) | 10 | ? | 0.35 | manual |
| 313 | CItirizine as HCL | 10 | ? | 0.35 | manual |
| 314 | Cefepime HCl eq to Cefepime with L-arginine | 10 | ? | 0.30 | manual |
| 315 | Cefepime as (Hcl) with L-Arginine) | 10 | ? | 0.30 | manual |
| 316 | Cefepime with L-Arginine eq. to Cefepime | 10 | ? | 0.30 | manual |
| 317 | Cefoperazone Sodium and Sulbactam Sodium (1:1) | 10 | ? | 0.30 | manual |
| 318 | Cefoperazone as Sodium+Sulbactam as Sodium | 10 | ? | 0.30 | manual |
| 319 | Cefoprazone (as sodium) | 10 | ? | 0.35 | manual |
| 320 | Cefpodoxime...(as Proxetil)....100mg | 10 | ? | 0.35 | manual |
| 321 | Cefpodoxime...(as Proxetil)....40mg | 10 | ? | 0.35 | manual |
| 322 | Cefprozol as Monohydrate | 10 | ? | 0.35 | manual |
| 323 | Ceftazidime Pentahydrate with Sodium Carbonate anhydrous | 10 | ? | 0.30 | manual |
| 324 | Ceftazidime Pentahydrate with sodium carbonate eq. to Ceftazidime | 10 | ? | 0.30 | manual |
| 325 | Cephradine D/S | 10 | ? | 0.30 | manual |
| 326 | Cephradine inj IV/IM | 10 | ? | 0.30 | manual |
| 327 | Certoparin Sodium (Anti-Xa) | 10 | ? | 0.35 | manual |
| 328 | Clomipramine as HCl | 10 | ? | 0.35 | manual |
| 329 | Cloprosterol Vet 263ug eq to Cloprostenol 250ug | 10 | ? | 0.35 | manual |
| 330 | Cryoprotectant No.1 + HVT / NDV and Rispens CV1988 strains | 10 | ? | 0.30 | manual |
| 331 | Cryoprotectant No.1 + HVT and Rispens CV1988 Strains | 10 | ? | 0.30 | manual |
| 332 | Dexamethasone(in the form of Disodium Salt) | 10 | ? | 0.35 | manual |
| 333 | Diclofenac sodium (as sustained release pellets 45% w/w) | 10 | ? | 0.30 | manual |
| 334 | Each 100ml Contains: Dextrose Monohydrate eq. to Anhydrous Dextrose | 10 | ? | 0.35 | manual |
| 335 | Each capsule contains: Diclofenac Sodium (enteric coated pellets) | 10 | ? | 0.35 | manual |
| 336 | Each chewable tablet contains: Iron (III) hydroxide polymaltose complex equivalent and Folic acid | 10 | ? | 0.30 | manual |
| 337 | Each chewable tablet contains: Montelukast (as Sodium)….4mg | 10 | ? | 0.35 | manual |
| 338 | Each film coated tablet contains: Escitalopram (as oxalate).....10mg | 10 | ? | 0.35 | manual |
| 339 | Each film coated tablet contains: Levocetirizine dihydrochloride….5mg (USP specifications) | 10 | ? | 0.35 | manual |
| 340 | Each film- coated tablet contains: Montelukast (as Sodium)….10mg | 10 | ? | 0.35 | manual |
| 341 | Each vial contains: Cefipime (as HCL)...1gm | 10 | ? | 0.35 | manual |
| 342 | Each vial contains: Cefoperazone (as sodium)...500mg Sulbactam ( as sodium)....500mg | 10 | ? | 0.35 | manual |
| 343 | Elemental Calcium (as Calcium Lactate Pentahydrate 134mg and TriCalcium Phosphate 300mg) | 10 | ? | 0.30 | manual |
| 344 | Emedastine (as difumerate) | 10 | ? | 0.35 | manual |
| 345 | Emedastine Difumerate eq. to Emedastine | 10 | ? | 0.35 | manual |
| 346 | Enteric Coated Pellets of Esomeprazole Magnesium Trihydrate Eq. to Esomeprazole | 10 | ? | 0.35 | manual |
| 347 | Enteric coated taste mask pellets of Clarithromycin eq. to Clarithromycin | 10 | ? | 0.35 | manual |
| 348 | Erlotinib Hcl Eq To Erlotinib | 10 | ? | 0.35 | manual |
| 349 | Esomeprazol manessium as trihydrate(Pellets) | 10 | ? | 0.35 | manual |
| 350 | Esomperazole (as magnesium trihydrate) enteric coated granules | 10 | ? | 0.35 | manual |
| 351 | Ferrous Fumarate / Folic Acid | 10 | ? | 0.30 | manual |
| 352 | Flumequine+Colistin Sulphate | 10 | ? | 0.30 | manual |
| 353 | Flupentixol (as dihydrochloride | 10 | ? | 0.35 | manual |
| 354 | Gastro resistant pellets of Esomeprazole magnesium trihydrate eq. to Esomeprazole (Pellets) | 10 | ? | 0.35 | manual |
| 355 | Ginseing extract eq. to Radix Panax C.A Meyer | 10 | ? | 0.35 | manual |
| 356 | Glycopyrronium Bromide 63mcg Eq. to Glycopyrronium | 10 | ? | 0.35 | manual |
| 357 | Gumbro (Winterfielf 2512 Bulk viral fluids) | 10 | ? | 0.35 | manual |
| 358 | Hydroquinone + Fluocinolone Acetonide+Tretinoin | 10 | ? | 0.30 | manual |
| 359 | IBDV (Lukert CEO Strain) | 10 | ? | 0.35 | manual |
| 360 | Ibuprofen/Pseudoephedrine HCl | 10 | ? | 0.30 | manual |
| 361 | Inactivated Pasteurella multiocida (Robert's strain) | 10 | ? | 0.35 | manual |
| 362 | Iohexol 755mg eq. to organic iodine | 10 | ? | 0.35 | manual |
| 363 | Ipratropium Bromide... 0.5218mg eq to Ipratropium. | 10 | ? | 0.35 | manual |
| 364 | Iron + Folic Acid | 10 | ? | 0.30 | manual |
| 365 | Lansoperazole pellets eq. to Lansoperazole | 10 | ? | 0.35 | manual |
| 366 | Levofloxacin(As hemihydrate) | 10 | ? | 0.35 | manual |
| 367 | Levofloxacin(as hemihydrate) | 10 | ? | 0.35 | manual |
| 368 | Losartan Potassium., Hydrochlorothiazide. | 10 | ? | 0.35 | manual |
| 369 | Lyophilized Powder/cake Warfarin Sodium | 10 | ? | 0.30 | manual |
| 370 | Meconazole (as nitrate) | 10 | ? | 0.35 | manual |
| 371 | Melitracen (as HCl) | 10 | ? | 0.35 | manual |
| 372 | Metoprolol (as tartrate) | 10 | ? | 0.35 | manual |
| 373 | Metronidazole(as Benzoate) | 10 | ? | 0.35 | manual |
| 374 | Minocylcin as HCl | 10 | ? | 0.35 | manual |
| 375 | Modified release pellets Tamsulosin hcl eq to Tamsulosin hcl | 10 | ? | 0.35 | manual |
| 376 | Molybdenum (molybdate) | 10 | ? | 0.35 | manual |
| 377 | NIB-88 Reassortant Derived from A/Switzerland/9715293/2013 | 10 | ? | 0.30 | manual |
| 378 | NYMC X-179A Reassortant Derived from A/California/7/2009 | 10 | ? | 0.30 | manual |
| 379 | Nalbuphene as HCL | 10 | ? | 0.35 | manual |
| 380 | Neomycin(in the form of sulphate) | 10 | ? | 0.35 | manual |
| 381 | Newcastle Disease Live Virus with a minimum infectious titer of 10 (6.5) D1E50 Gumboro Disease Live | 10 | ? | 0.30 | manual |
| 382 | Pancreatic digest of casein (USP) | 10 | ? | 0.35 | manual |
| 383 | Paracetamol + Caffeine + Codeine phosphate | 10 | ? | 0.30 | manual |
| 384 | Paracetamol+Orphenadrine citrate | 10 | ? | 0.30 | manual |
| 385 | Pentavalent Vaccine (DTwP – HB – Hib) | 10 | ? | 0.35 | manual |
| 386 | Permethrin 5% w/w/ | 10 | ? | 0.30 | manual |
| 387 | Phenosulfonphthalein (Ph.Eur/USP) | 10 | ? | 0.30 | manual |
| 388 | Phenoxymethylpenicillin 325mg/g eq to Potassium Phenoxymethylpenicillin | 10 | ? | 0.30 | manual |
| 389 | Piperazine (as Sulphate) | 10 | ? | 0.35 | manual |
| 390 | Piroxicam(as Betacyclodextrin) | 10 | ? | 0.35 | manual |
| 391 | Promethazine as HCL | 10 | ? | 0.35 | manual |
| 392 | Raloxifene as HCl | 10 | ? | 0.35 | manual |
| 393 | Rebeprazole as Sodium | 10 | ? | 0.35 | manual |
| 394 | Rosuvastatin(as calcium) | 10 | ? | 0.35 | manual |
| 395 | Salmeterol (as xinafoate) | 10 | ? | 0.35 | manual |
| 396 | Selegiline (as HCl) | 10 | ? | 0.35 | manual |
| 397 | Sodium chloride+Potassium chloride+Sodium citrate+Glucose anhydrous | 10 | ? | 0.30 | manual |
| 398 | Standard Cobre Venom (Naja-naja) | 10 | ? | 0.35 | manual |
| 399 | Sterile Cefepime (as HCl) with L-Arginine | 10 | ? | 0.30 | manual |
| 400 | Sulfadimerazine (as Sodium) | 10 | ? | 0.35 | manual |
| 401 | Sulfadoxine Pyrimethamine 500mg/25mg | 10 | ? | 0.30 | manual |
| 402 | Sustained release pellets of Venlafaxine hydrochloride eq. to Venlafaxine | 10 | ? | 0.35 | manual |
| 403 | Tenofovir as disoproxil fumarate | 10 | ? | 0.35 | manual |
| 404 | Tiotropium bromide monohydrate eq. to tiotropium | 10 | ? | 0.35 | manual |
| 405 | Tizinidine Sustained Release Pellets containing Tizanidine HCL eq to Tizanidine Base | 10 | ? | 0.35 | manual |
| 406 | Tobramycin and Dexamethasone | 10 | ? | 0.30 | manual |
| 407 | Trichlorfon/Metrifonate | 10 | ? | 0.30 | manual |
| 408 | Umeclidinium Eq to 74.2mcg of Umecidinium Bromide | 10 | ? | 0.35 | manual |
| 409 | VASTOR PLUS 10/10MG TABLET | 10 | ? | 0.30 | manual |
| 410 | Vortioxetine (As Hydrobromide) | 10 | ? | 0.35 | manual |
| 411 | calcium lactate gluconate+calcium carbonate+Ascorbic acid | 10 | ? | 0.30 | manual |
| 412 | cefoperazone sodium eq.to cefoperazone 1000mg + sulbactam sodium eq. to sulbactam 1000mg | 10 | ? | 0.30 | manual |
| 413 | cefoperazone sodium eq.to cefoperazone 500mg + sulbactam sodium eq. to sulbactam 500mg | 10 | ? | 0.30 | manual |
| 414 | citalopram(as HBr) | 10 | ? | 0.35 | manual |
| 415 | dl-α-tocopherol acetate (Ph. Eur.) | 10 | ? | 0.35 | manual |
| 416 | each 15ml contain iron protein succinylate 800mg eq to elemental iron 40mg | 10 | ? | 0.35 | manual |
| 417 | efoperazone as sodium | 10 | ? | 0.35 | manual |
| 418 | Aminosideine (Sulphate) | 9 | ? | 0.35 | manual |
| 419 | Anti-thymocyte Globulin (Equine) | 9 | ? | 0.35 | manual |
| 420 | Artemether/ Lumefantrine | 9 | ? | 0.30 | manual |
| 421 | Atorvastatin + Ezetimibe | 9 | ? | 0.30 | manual |
| 422 | Atorvatatin as Calcium | 9 | ? | 0.35 | manual |
| 423 | Attenuated canine adenovirus (CAV2) | 9 | ? | 0.35 | manual |
| 424 | Avian Infectious Bursal Disease Vaccine(Live) | 9 | ? | 0.35 | manual |
| 425 | Azithromycin( as Dihydrate) | 9 | ? | 0.35 | manual |
| 426 | Balloon Expandable Stainless Steel Stent. Poly Ethylene terephthalate (PET). | 9 | ? | 0.35 | manual |
| 427 | Brimonidine Tartrate…2mg eq. to Brimonidine…1.3mg | 9 | ? | 0.35 | manual |
| 428 | CLOSANTAL, | 9 | ? | 0.35 | manual |
| 429 | Cefepim (as HCL) | 9 | ? | 0.35 | manual |
| 430 | Cefepime HCI with L-arginine | 9 | ? | 0.30 | manual |
| 431 | Ceftriaxone(as Sodium) | 9 | ? | 0.35 | manual |
| 432 | Ciclopirox Olamine. | 9 | ? | 0.35 | manual |
| 433 | Cinacalcet (as HCl) | 9 | ? | 0.35 | manual |
| 434 | Ciprofloxacin( as HCl) | 9 | ? | 0.35 | manual |
| 435 | Citric acid+Sodium bicarbonate+Sodium citrate+Tartaric acid | 9 | ? | 0.30 | manual |
| 436 | Clotrimazole.. | 9 | ? | 0.35 | manual |
| 437 | Diclofenac Sodium Diethyl Ammonium eq.to Diclofenac Sodium 1% w/w | 9 | ? | 0.30 | manual |
| 438 | Domperidine as Maleate | 9 | ? | 0.35 | manual |
| 439 | EDS (127) | 9 | ? | 0.35 | manual |
| 440 | EDS Virus (127 Strain) | 9 | ? | 0.35 | manual |
| 441 | Each delivered dose contains (Beclomethasone dipropionate) | 9 | ? | 0.35 | manual |
| 442 | Each kg contains: | 9 | ? | 0.35 | manual |
| 443 | Each ml suspension contains: Humalin Insulin (rDNA)….100IU | 9 | ? | 0.35 | manual |
| 444 | Erythromcin ethylsuccinate eq to erythromycin | 9 | ? | 0.35 | manual |
| 445 | Human Insulin Regular 30% + NPH 70%....100IU | 9 | ? | 0.30 | manual |
| 446 | IBV (Mass): | 9 | ? | 0.35 | manual |
| 447 | Inactivated EDS,76 Virus... | 9 | ? | 0.35 | manual |
| 448 | Inactivated EDS,76 Virus........ | 9 | ? | 0.35 | manual |
| 449 | Inactivated IB Virus (H-120)......... | 9 | ? | 0.35 | manual |
| 450 | Inactivated ND Virus (BI) | 9 | ? | 0.35 | manual |
| 451 | Inactivated ND Virus (BI)......... | 9 | ? | 0.35 | manual |
| 452 | Irbesartan + Hydrochlorothiazide | 9 | ? | 0.30 | manual |
| 453 | Isotretinoin/ Erythromycin | 9 | ? | 0.30 | manual |
| 454 | Levamizole (as Hcl) | 9 | ? | 0.35 | manual |
| 455 | Levocitirizine (as 2HCl) | 9 | ? | 0.35 | manual |
| 456 | Lodoxamide as Tromethamine | 9 | ? | 0.35 | manual |
| 457 | Lyophilized omeprazole sodium eq. to omeprazole | 9 | ? | 0.35 | manual |
| 458 | Marek HVT Serotype with a minimum Ifectious titer of 5000 PFU | 9 | ? | 0.30 | manual |
| 459 | Mebeverine hydrochloride 80% w/w pellets eq to mebeverine | 9 | ? | 0.30 | manual |
| 460 | Newcastle disease virus, VG/GA strain | 9 | ? | 0.30 | manual |
| 461 | OlanzapOlanzapine (As Citrate)ine | 9 | ? | 0.35 | manual |
| 462 | Palonosetron as HCl | 9 | ? | 0.35 | manual |
| 463 | Palonosetron as HCl. | 9 | ? | 0.35 | manual |
| 464 | Patent Blue (E-131) | 9 | ? | 0.35 | manual |
| 465 | Phytonadione (Vit-K) | 9 | ? | 0.35 | manual |
| 466 | Quinine Bisulphate (as heptahydrate) | 9 | ? | 0.35 | manual |
| 467 | SB Marek Serotype with a minimum infectious titer of 3000 PFU | 9 | ? | 0.30 | manual |
| 468 | Selinium (As Sodium Selenite) | 9 | ? | 0.35 | manual |
| 469 | Sucrose / Gelatin stabilizer | 9 | ? | 0.30 | manual |
| 470 | Vinorelbine As Tartrate Eq. To Vinorelbine | 9 | ? | 0.35 | manual |
| 471 | ciprofloxacin(asHCl) | 9 | ? | 0.35 | manual |
| 472 | iron (III) Hydroxide Polymaltose Complex equivalent to elemental iron + Folic Acid | 9 | ? | 0.30 | manual |
| 473 | levofloxacin(as hemihydrate) | 9 | ? | 0.35 | manual |
| 474 | (DHP VACCINE) ATTENUATED CANINE DISTEMPER VIRUS CULTURE FLUID (TCO-D STRAIN) | 8 | ? | 0.35 | manual |
| 475 | (DHP VACCINE) Attenuated Canine Infectious Hepatitis virus culture fluid (TCO- H strain) | 8 | ? | 0.35 | manual |
| 476 | (DHP VACCINE) Attenuated Canine Parainfluenza virus culture fluid (CPIV-37 strain) | 8 | ? | 0.35 | manual |
| 477 | Alcohol 95% (V/V) | 8 | ? | 0.30 | manual |
| 478 | Aspirin....75mg/Clopidogrel as Bisulafte........75mg | 8 | ? | 0.30 | manual |
| 479 | Atracurium as Besylate | 8 | ? | 0.35 | manual |
| 480 | Bleomycin Sulphate eq. to Bleomycin | 8 | ? | 0.35 | manual |
| 481 | Calciferol (Vitamin D3) | 8 | ? | 0.35 | manual |
| 482 | Cefepime (as HCL ) with Sterile Arginine . | 8 | ? | 0.30 | manual |
| 483 | Cefixime(as Hydrate | 8 | ? | 0.35 | manual |
| 484 | Cefixime(as Hydrate. | 8 | ? | 0.35 | manual |
| 485 | Cefixme trihydrate eq.to Cefixime | 8 | ? | 0.35 | manual |
| 486 | Cefoperazone + Sulbactum | 8 | ? | 0.30 | manual |
| 487 | Cefoperazone(as Sodium) | 8 | ? | 0.35 | manual |
| 488 | Ciprofloxacine as HCL | 8 | ? | 0.35 | manual |
| 489 | Clarithromycin. | 8 | ? | 0.35 | manual |
| 490 | Clavulanate Potassium eq. to Clavulanic Acid | 8 | ? | 0.35 | manual |
| 491 | Clonastel (As Sodium) | 8 | ? | 0.35 | manual |
| 492 | Cobalt(Sulphate) | 8 | ? | 0.35 | manual |
| 493 | Dexamethasone / Neomycin | 8 | ? | 0.30 | manual |
| 494 | Dopamine as HCl | 8 | ? | 0.35 | manual |
| 495 | Each 2 ml contains: Adrenaline........0.001%w/v Lignocaine HCl.........2%w/v | 8 | ? | 0.30 | manual |
| 496 | Each 5ml contains; Trimethoprim / Sulphamethoxazole | 8 | ? | 0.30 | manual |
| 497 | Each film coated tablet contains:-Iron(III) Hydroxide Polymaltose complex eq.to Elemental Iron | 8 | ? | 0.35 | manual |
| 498 | Each tablet contains: Pioglitazone (as HCI)........15mg , Glimepiride..........1mg | 8 | ? | 0.35 | manual |
| 499 | Each tablet contains: Pioglitazone (asHCI) ............30mg , Glimepiride..........2mg | 8 | ? | 0.35 | manual |
| 500 | Enteric Coated pellets of Esomeprazole as Magnessium Trihydrate | 8 | ? | 0.35 | manual |

## 6) WHO ATC alias check

- ATC-related tables present in this database: **5**
- Result: there is no WHO ATC alias dataset in the current snapshot, so there are no salt names to inspect in ATC mappings.

## 7) Interpretation of bridge value

- Current persisted catalogue match rate: **0%** for this snapshot, because the canonical molecule / product matching tables are empty.
- After a salt?molecule bridge built from corpus-only normalization, the estimated ingredient-level coverage is **97.26%**.
- The estimated product-level recovery is **74.21%** of distinct registration-numbered products with composition data.
- Composition-group recovery is **89.15%** of observed signatures.

## 8) Recommended schema changes

These are recommendations only, not implementation steps:

- Add a first-class `canonical_molecules` table with one canonical row per normalized molecule.
- Add a `molecule_aliases` table with alias type, source, confidence, and review status.
- Add explicit salt/hydrate/ester bridge evidence so normalized candidates are auditable.
- Add `atc_classifications` and `generic_atc_classifications` tables, or an equivalent WHO mapping layer, if WHO enrichment is expected.
- Add persisted composition-signature storage so product equivalence is not inferred repeatedly from raw import payloads.
- Link composition records to canonical molecule IDs rather than free-text ingredient strings.

## 9) SQL queries used

### table_inventory

```sql
select table_name from information_schema.tables where table_schema='public' order by table_name;
```

### relevant_counts

```sql
select count(*) from generics; -- repeat for canonical_products, canonical_product_aliases, products, product_compositions, import_batch_items, product_matches, equivalence_groups, product_equivalence, match_reviews
```

### ingredient_counts

```sql
with rows as (
  select trim(comp->>'genericName') as generic_name,
         count(*) as freq
  from import_batch_items
  cross join lateral jsonb_array_elements(coalesce(normalized_data->'compositionRows','[]'::jsonb)) as comp
  where normalized_data ? 'compositionRows'
    and comp ? 'genericName'
    and trim(coalesce(comp->>'genericName','')) <> ''
    and trim(comp->>'genericName') <> 'No composition data recorded.'
  group by 1
)
select generic_name, freq
from rows
order by freq desc, generic_name;
```

### row_recoverability

```sql
select ibi.id,
       coalesce(ibi.normalized_data->>'registrationNumber','') as reg_no,
       coalesce(jsonb_agg(comp->>'genericName') filter (where comp ? 'genericName'), '[]'::jsonb) as ingredients
from import_batch_items ibi
left join lateral jsonb_array_elements(coalesce(ibi.normalized_data->'compositionRows','[]'::jsonb)) as comp on true
where normalized_data ? 'compositionRows'
group by ibi.id, reg_no;
```

### atc_presence

```sql
select table_name from information_schema.tables where table_schema='public' and table_name like '%atc%';
```
