import {
  SourceRawPrice,
  SourceRawProduct,
} from "../source.types";

const products: SourceRawProduct[] = [
  {
    externalProductId: "mock-aug-625",
    name: "Augmentin 625mg Tablet",
    brandName: "Augmentin",
    genericName: "Amoxicillin + Clavulanic Acid",
    strength: "625 mg",
    dosageForm: "Tablet",
    manufacturer: "GlaxoSmithKline Pakistan",
    packSize: "14 tablets",
    productUrl: "https://mock.example/products/augmentin-625",
  },
  {
    externalProductId: "mock-par-500",
    name: "Paracetamol 500mg Tablet",
    brandName: "Paracetamol",
    genericName: "Paracetamol",
    strength: "500 mg",
    dosageForm: "Tablet",
    manufacturer: "Mock Pharma",
    packSize: "20 tablets",
    productUrl: "https://mock.example/products/paracetamol-500",
  },
];

const prices: SourceRawPrice[] = [
  {
    externalProductId: "mock-aug-625",
    productUrl: "https://mock.example/products/augmentin-625",
    price: 415,
    currency: "PKR",
    stockStatus: "IN_STOCK",
    city: "Karachi",
    capturedAt: "2026-06-15T00:00:00.000Z",
  },
  {
    externalProductId: "mock-par-500",
    productUrl: "https://mock.example/products/paracetamol-500",
    price: 75,
    currency: "PKR",
    stockStatus: "LIMITED",
    city: "Lahore",
    capturedAt: "2026-06-15T00:00:00.000Z",
  },
];

export default {
  products,
  prices,
};

