import {
  CanonicalMedicineInput,
  MatchCandidateInput,
} from "../matching.types";

export const canonicalMedicines: CanonicalMedicineInput[] = [
  {
    canonicalProductId: "canonical-augmentin",
    canonicalName: "Amoxicillin Clavulanic Acid 625mg Tablet",
    brandName: "Augmentin",
    genericName: "Amoxicillin + Clavulanic Acid",
    strength: "625 mg",
    dosageForm: "Tablet",
    manufacturer: "GlaxoSmithKline Pakistan",
    packSize: "14 tablets",
    registrationNumber: "DRAP-001",
  },
  {
    canonicalProductId: "canonical-esomeprazole",
    canonicalName: "Esomeprazole 40mg Capsule",
    brandName: "Nexum",
    genericName: "Esomeprazole",
    strength: "40 mg",
    dosageForm: "Capsule",
    manufacturer: "Getz Pharma",
    packSize: "14 capsules",
    registrationNumber: "DRAP-004",
  },
  {
    canonicalProductId: "canonical-atorvastatin",
    canonicalName: "Atorvastatin 20mg Tablet",
    brandName: "Lipiget",
    genericName: "Atorvastatin",
    strength: "20 mg",
    dosageForm: "Tablet",
    manufacturer: "Getz Pharma",
    packSize: "10 tablets",
    registrationNumber: "DRAP-005",
  },
];

export const sourceMedicines: MatchCandidateInput[] = [
  {
    id: "source-augmentin",
    brandName: "Augmentin Tablets",
    genericName: "Amoxicillin and Clavulanic Acid",
    strength: "625mg",
    dosageForm: "tab",
    manufacturer: "GSK Pakistan Pvt Ltd",
    packSize: "14 tablet",
    registrationNumber: "DRAP-001",
  },
  {
    id: "source-esomeprazole",
    brandName: "Nexum",
    genericName: "Esomeprazole",
    strength: "40 mg",
    dosageForm: "cap",
    manufacturer: "Getz Pharmaceuticals",
    packSize: "14 capsule",
    registrationNumber: "DRAP-004",
  },
  {
    id: "source-duplicate-atorvastatin",
    brandName: "Lipiget",
    genericName: "Atorvastatin",
    strength: "20 mg",
    dosageForm: "Tablet",
    manufacturer: "Getz Pharma",
    packSize: "10 tablets",
    registrationNumber: "DRAP-005",
  },
  {
    id: "source-duplicate-atorvastatin-2",
    brandName: "Lipiget",
    genericName: "Atorvastatin",
    strength: "20 mg",
    dosageForm: "Tablet",
    manufacturer: "Getz Pharma",
    packSize: "10 tablets",
    registrationNumber: "DRAP-005",
  },
];

