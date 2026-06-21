export interface GoldenSampleMolecule {
  id: string;
  atcCode: string;
  name: string;
  ddd?: string;
  uom?: string;
  therapeuticCategory: string;
  therapeuticCategoryId: string;
}

export interface GoldenSampleProduct {
  id: string;
  registrationNumber: string;
  brandName: string;
  normalizedBrand: string;
  genericName: string;
  strengthText: string;
  dosageForm: string;
  manufacturer: string;
  manufacturerId?: string;
  packSize: string;
  pricePk?: number;
  therapeuticCategories: string[];
  compositionGroupSignature?: string;
  alternativeBrands: string[];
  priceComparison: {
    pharmacy: string;
    price: number;
    unitPrice?: number;
    availability: string;
  }[];
}

export interface GoldenSampleCatalogue {
  id: string;
  name: string;
  version: string;
  generatedAt: string;
  molecules: GoldenSampleMolecule[];
  products: GoldenSampleProduct[];
  therapeuticCategories: string[];
  summary: {
    totalMolecules: number;
    totalProducts: number;
    totalTherapeuticCategories: number;
    completionPercentage: number;
  };
}

export interface CatalogueBuildResult {
  success: boolean;
  moleculesSelected: number;
  productsSelected: number;
  categoriesSelected: number;
  totalAvailableMolecules: number;
  totalAvailableProducts: number;
  completionPercentage: number;
}