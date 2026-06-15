import {
  SearchableProduct,
  SearchPopularitySignal,
  SearchSynonym,
} from "../search.types";

export const searchProducts: SearchableProduct[] = [
  {
    id: "canonical-augmentin",
    canonicalProductId: "canonical-augmentin",
    brandName: "Augmentin",
    genericName: "Amoxicillin Clavulanic Acid",
    manufacturer: "GlaxoSmithKline Pakistan",
    dosageForm: "tablet",
    strength: "625mg",
    registrationNumber: "DRAP-001",
    medicineSignature: "amoxicillin_clavulanic_acid_625mg_tablet",
    confidenceScore: 0.97,
    availabilityScore: 0.82,
    priceIntelligenceScore: 0.88,
    popularityScore: 72,
    lowestPrice: 370,
    averagePrice: 410,
    aliases: ["amox clav", "co-amoxiclav"],
    equivalentBrandIds: ["canonical-moxclav"],
  },
  {
    id: "canonical-moxclav",
    canonicalProductId: "canonical-moxclav",
    brandName: "Moxclav",
    genericName: "Amoxicillin Clavulanic Acid",
    manufacturer: "Searle",
    dosageForm: "tablet",
    strength: "625mg",
    registrationNumber: "DRAP-010",
    medicineSignature: "amoxicillin_clavulanic_acid_625mg_tablet",
    confidenceScore: 0.91,
    availabilityScore: 0.76,
    priceIntelligenceScore: 0.92,
    popularityScore: 40,
    lowestPrice: 310,
    averagePrice: 350,
    equivalentBrandIds: ["canonical-augmentin"],
  },
  {
    id: "canonical-nexum",
    canonicalProductId: "canonical-nexum",
    brandName: "Nexum",
    genericName: "Esomeprazole",
    manufacturer: "Getz Pharma",
    dosageForm: "capsule",
    strength: "40mg",
    registrationNumber: "DRAP-004",
    medicineSignature: "esomeprazole_40mg_capsule",
    confidenceScore: 0.94,
    availabilityScore: 0.7,
    priceIntelligenceScore: 0.8,
    popularityScore: 55,
    lowestPrice: 220,
    averagePrice: 260,
  },
];

export const searchSynonyms: SearchSynonym[] = [
  {
    term: "amoxicillin clavulanic acid",
    synonym: "co-amoxiclav",
  },
  {
    term: "esomeprazole",
    synonym: "ppi capsule",
  },
];

export const searchPopularity: SearchPopularitySignal[] = [
  {
    normalizedQuery: "augmentin",
    searchCount: 1200,
    trendingScore: 92,
  },
  {
    normalizedQuery: "amoxicillin clavulanic acid",
    searchCount: 900,
    trendingScore: 78,
  },
  {
    normalizedQuery: "karachi fever medicine",
    searchCount: 250,
    trendingScore: 45,
    city: "Karachi",
  },
];

