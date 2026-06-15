import {
  DiscoveryInput,
  KnownMedicineIdentity,
} from "../discovery.types";

export const knownMedicines: KnownMedicineIdentity[] = [
  {
    id: "canonical-augmentin",
    brandName: "augmentin",
    genericName: "amoxicillin clavulanic acid",
    manufacturer: "glaxosmithkline pakistan",
    medicineSignature: "amoxicillin_clavulanic_acid_625mg_tablet",
    aliases: ["co amoxiclav"],
  },
];

export const discoveryInputs: DiscoveryInput[] = [
  {
    source: "search",
    sourceType: "SEARCH_QUERY",
    searchQuery: "new fever antibiotic 625",
    brandName: "Moxclav",
    genericName: "Amoxicillin + Clavulanic Acid",
    strength: "625 mg",
    dosageForm: "Tablet",
    manufacturer: "Searle",
    sourceUrl: "/api/search?q=moxclav",
  },
  {
    source: "pharmacy_snapshot",
    sourceType: "PHARMACY_SNAPSHOT",
    brandName: "Augmentin",
    genericName: "Amoxicillin Clavulanic Acid",
    strength: "625mg",
    dosageForm: "tab",
    manufacturer: "GSK Pakistan",
    medicineSignature: "amoxicillin_clavulanic_acid_625mg_tablet",
    sourceUrl: "https://mock.example/augmentin",
  },
];

