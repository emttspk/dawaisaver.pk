import { MatchCandidateInput } from "../../matching/matching.types";
import { PrescriptionCitySignal, PrescriptionPriceSignal } from "../prescription.types";

export const samplePrescriptionText = [
  "Amoxicillin Clavulanic Acid 625mg tablet",
  "Paracetamol 500mg tablet",
].join("\n");

export const samplePrescriptionUploadText = [
  "Amoxicillin Clavulanic Acid 625mg tablet",
  "Paracetamol 500mg tablet",
].join("\n");

export const sampleCanonicalCandidates: MatchCandidateInput[] = [
  {
    id: "canonical-augmentin",
    productId: "product-augmentin",
    canonicalProductId: "canonical-augmentin",
    brandName: "Amoxicillin Clavulanic Acid",
    genericName: "amoxicillin clavulanic acid",
    strength: "625mg",
    dosageForm: "tablet",
    manufacturer: "gsk",
    packSize: "14 tablets",
    registrationNumber: "REG-001",
    medicineSignature: "amoxicillin_clavulanic_acid_625mg_tablet",
  },
  {
    id: "canonical-panadol",
    productId: "product-panadol",
    canonicalProductId: "canonical-panadol",
    brandName: "Paracetamol",
    genericName: "paracetamol",
    strength: "500mg",
    dosageForm: "tablet",
    manufacturer: "gsk",
    packSize: "10 tablets",
    registrationNumber: "REG-002",
    medicineSignature: "paracetamol_500mg_tablet",
  },
  {
    id: "canonical-amoclav",
    productId: "product-amoclav",
    canonicalProductId: "canonical-amoclav",
    brandName: "Amoclav",
    genericName: "amoxicillin clavulanic acid",
    strength: "625mg",
    dosageForm: "tablet",
    manufacturer: "local pharma",
    packSize: "14 tablets",
    registrationNumber: "REG-003",
    medicineSignature: "amoxicillin_clavulanic_acid_625mg_tablet",
  },
];

export const samplePriceSignals: PrescriptionPriceSignal[] = [
  {
    productId: "product-augmentin",
    canonicalProductId: "canonical-augmentin",
    medicineSignature: "amoxicillin_clavulanic_acid_625mg_tablet",
    city: "Karachi",
    lowestPrice: 980,
    highestPrice: 1300,
    averagePrice: 1120,
    latestPrice: 1200,
    availabilityScore: 0.82,
    confidenceScore: 0.88,
    sourceCount: 4,
  },
  {
    productId: "product-amoclav",
    canonicalProductId: "canonical-amoclav",
    medicineSignature: "amoxicillin_clavulanic_acid_625mg_tablet",
    city: "Karachi",
    lowestPrice: 840,
    highestPrice: 960,
    averagePrice: 900,
    latestPrice: 860,
    availabilityScore: 0.8,
    confidenceScore: 0.81,
    sourceCount: 3,
  },
  {
    productId: "product-panadol",
    canonicalProductId: "canonical-panadol",
    medicineSignature: "paracetamol_500mg_tablet",
    city: "Karachi",
    lowestPrice: 150,
    highestPrice: 210,
    averagePrice: 180,
    latestPrice: 175,
    availabilityScore: 0.94,
    confidenceScore: 0.9,
    sourceCount: 5,
  },
];

export const sampleCitySignals: PrescriptionCitySignal[] = [
  {
    city: "Karachi",
    lowestObservedPrice: 150,
    highestObservedPrice: 1300,
    averagePrice: 650,
    availabilityPercentage: 0.89,
    sourceCount: 12,
    confidenceScore: 0.86,
  },
];
