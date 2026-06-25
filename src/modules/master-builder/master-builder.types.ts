export interface NormalizedJsonRecord {
  registrationNumber: string;
  brandName?: string;
  registrationDate?: string;
  meetingNumber?: string;
  dosageForm?: string;
  compositionRows: CompositionRow[];
  packSize?: string;
  approvedPrice?: string;
  pricingType?: string;
  manufacturer?: string;
  companyAddress?: string;
  country?: string;
  manufacturingType?: string;
  category?: string;
  sourceStatus?: string;
  sourceVerificationStatus?: string;
  routeOfAdmin?: string;
  labelClaim?: string;
  activeIngredient?: string;
  dosage?: string;
  packageType?: string;
  therapeuticCategory?: string;
  atcCode?: string;
  indications?: string;
  contraindications?: string;
  sideEffects?: string;
  drugInteractions?: string;
  precautions?: string;
  warnings?: string;
  shelfLife?: string;
  storageCondition?: string;
  remarks?: string[];
  rawHtmlUrl?: string;
}

export interface CompositionRow {
  genericName: string;
  operator?: string;
  strength?: string;
  unit?: string;
}

export interface MasterBuilderStats {
  jsonProcessed: number;
  productsCreated: number;
  manufacturersCreated: number;
  genericsCreated: number;
  compositionsCreated: number;
  productPacksCreated: number;
  canonicalProductsCreated: number;
  therapeuticCategoriesCreated: number;
  atcClassificationsCreated: number;
  duplicateRate: number;
  validationFailures: number;
  confidenceDistribution: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface MasterBuilderReport {
  timestamp: string;
  stats: MasterBuilderStats;
  errors: string[];
  warnings: string[];
}