export type CatalogBuildCommand = "build" | "resume" | "verify";

export type PackUnitType = "TABLET" | "CAPSULE" | "SYRUP" | "SUSPENSION" | "DROPS" | "CREAM" | "OINTMENT" | "INJECTION" | "AMPOULE" | "VIAL" | "INHALER" | "STRIP" | "BOTTLE" | "PACK" | "OTHER";

export interface NormalizedPack {
  unitCount: number;
  unitType: string;
  volumeMl?: number;
  weightG?: number;
  containerCount: number;
  normalizedPackLabel: string;
}

export interface CatalogBuildOptions {
  command: CatalogBuildCommand;
  jobId?: string;
  dryRun?: boolean;
  limit?: number;
  batchSize?: number;
  reportDir?: string;
  writeReports?: boolean;
}

export interface CatalogBuildSummary {
  jobId: string;
  status: string;
  phase: string;
  dryRun: boolean;
  batchSize: number;
  limit?: number;
  startedAt?: string;
  finishedAt?: string;
  counts: CatalogBuildCounts;
  validation: CatalogValidationReport;
  progress: CatalogProgressSnapshot;
}

export interface CatalogVerifySummary {
  generatedAt: string;
  counts: Record<string, number>;
  integrity: {
    productsWithManufacturer: number;
    productsWithComposition: number;
    canonicalProductsWithAliases: number;
    canonicalProductsWithProducts: number;
  };
  latestRun?: {
    jobId: string;
    status: string;
    phase: string;
    startedAt?: string;
    finishedAt?: string;
  };
}

export interface CatalogBuildCounts {
  importItemsScanned: number;
  importItemsPromoted: number;
  importItemsSkipped: number;
  manufacturersCreated: number;
  manufacturersReused: number;
  genericsCreated: number;
  genericsReused: number;
  productsCreated: number;
  productsUpdated: number;
  productCompositionsCreated: number;
  productCompositionsUpdated: number;
  canonicalProductsCreated: number;
  canonicalProductsUpdated: number;
  canonicalAliasesCreated: number;
  matchesCreated: number;
  matchReviewsCreated: number;
}

export interface CatalogValidationIssue {
  scope: "import_item" | "product" | "canonical_product";
  code: string;
  message: string;
  importBatchId?: string;
  importBatchItemId?: string;
  rowNumber?: number;
  productId?: string;
  canonicalProductId?: string;
}

export interface CatalogValidationReport {
  totalIssues: number;
  issues: CatalogValidationIssue[];
  warnings: string[];
}

export interface CatalogProgressSnapshot {
  phase: string;
  currentImportBatchId?: string;
  currentImportBatchCreatedAt?: string | Date;
  currentImportRowNumber?: number;
  currentProductId?: string;
  currentProductCreatedAt?: string | Date;
  processedImportItems: number;
  processedProducts: number;
}

export interface CatalogCompositionInput {
  ingredientOrder: number;
  genericName: string;
  normalizedGenericName: string;
  strengthText?: string;
  normalizedStrength?: string;
  strengthValue?: string;
  strengthUnit?: string;
}

export interface CatalogSourceRecord {
  sourceType: string;
  sourceUrl?: string | null;
  sourceTable: string;
  sourceRecordId: string;
  importBatchId: string;
  importBatchCreatedAt: Date;
  importBatchItemId: string;
  rowNumber: number;
  manufacturerName: string;
  normalizedManufacturerName: string;
  brandName: string;
  normalizedBrandName: string;
  genericName: string;
  normalizedGenericName: string;
  registrationNumber?: string;
  dosageForm?: string;
  normalizedDosageForm?: string;
  packSize?: string;
  strengthText?: string;
  normalizedStrength?: string;
  medicineSignature: string;
  canonicalName: string;
  confidenceScore: number;
  rawData: unknown;
  compositions: CatalogCompositionInput[];
  drapFields?: {
    companyAddress?: string;
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
    country?: string;
    manufacturingType?: string;
  };
  normalizedPack?: NormalizedPack;
}
