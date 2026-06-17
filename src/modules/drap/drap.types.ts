export type DrapAdapterType = "csv" | "excel" | "html-table" | "api";

export type DrapDatasetFormat = "csv" | "xlsx" | "xml" | "txt" | "ts";

export type DrapImportStatus =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "COMPLETED_WITH_ERRORS"
  | "FAILED";

export type DrapImportItemStatus =
  | "PENDING"
  | "VALIDATED"
  | "NORMALIZED"
  | "SAVED"
  | "DUPLICATE"
  | "FAILED";

export interface DrapSourceConfig {
  adapterType: DrapAdapterType;
  sourceType?: "DRAP" | "DRAP_UPDATE" | "ADMIN_IMPORT";
  sourceUrl?: string;
  fileName?: string;
  content?: string | Buffer;
  fetcher?: () => Promise<string | Buffer>;
  parser?: (payload: string | Buffer) => Promise<DrapRawRecord[]>;
  metadata?: Record<string, unknown>;
}

export interface DrapSourceAdapter {
  fetch(): Promise<string | Buffer>;
  parse(payload: string | Buffer): Promise<DrapRawRecord[]>;
  normalize(records: DrapRawRecord[]): Promise<DrapNormalizedRecord[]>;
  validate(records: DrapNormalizedRecord[]): Promise<DrapValidationResult[]>;
  save(records: DrapValidatedRecord[]): Promise<DrapImportSummaryDto>;
}

export interface DrapRawRecord {
  brand_name?: string;
  brandName?: string;
  generic_name?: string;
  genericName?: string;
  strength?: string;
  dosage_form?: string;
  dosageForm?: string;
  manufacturer?: string;
  manufacturer_name?: string;
  registration_number?: string;
  registrationNumber?: string;
  pack_size?: string;
  packSize?: string;
  source_url?: string;
  [key: string]: unknown;
}

export interface DrapNormalizedRecord {
  rowNumber: number;
  raw: DrapRawRecord;
  brandName: string;
  normalizedBrandName: string;
  genericName: string;
  normalizedGenericName: string;
  strengthText?: string;
  normalizedStrength?: string;
  strengthValue?: string;
  strengthUnit?: string;
  dosageForm?: string;
  normalizedDosageForm?: string;
  manufacturerName: string;
  normalizedManufacturerName: string;
  registrationNumber?: string;
  packSize?: string;
  medicineSignature: string;
  confidenceScore: number;
  sourceUrl?: string;
}

export interface DrapValidationResult {
  rowNumber: number;
  valid: boolean;
  errors: DrapImportErrorDto[];
}

export interface DrapValidatedRecord extends DrapNormalizedRecord {
  validation: DrapValidationResult;
}

export interface DrapImportSummaryDto {
  batchId?: string;
  status: DrapImportStatus;
  adapterType: DrapAdapterType;
  sourceType: string;
  sourceUrl?: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  savedRows: number;
  errors: DrapImportErrorDto[];
  statistics: DrapImportStatisticsDto;
}

export interface DrapImportStatisticsDto {
  manufacturersCreated: number;
  manufacturersReused: number;
  genericsCreated: number;
  genericsReused: number;
  productsCreated: number;
  productsUpdated: number;
  compositionsCreated: number;
  duplicateRows: number;
}

export interface DrapImportErrorDto {
  rowNumber?: number;
  errorCode: string;
  errorMessage: string;
  rawData?: unknown;
}

export interface DrapImportReport {
  summary: DrapImportSummaryDto;
  startedAt: string;
  finishedAt: string;
}

export interface DrapDatasetInventoryItem {
  fileName: string;
  source: string;
  recordCount: number;
  lastUpdate: string;
  format: DrapDatasetFormat;
  notes?: string;
}

export type DrapAtcMatchMode =
  | "exact_canonical"
  | "alias_match"
  | "normalized_match"
  | "manual_review";

export type DrapAtcMatchStatus = "matched" | "ambiguous" | "unmatched";

export type DrapDataQualityFlagType =
  | "unknown_molecule"
  | "duplicate_molecule"
  | "duplicate_brand"
  | "invalid_strength"
  | "missing_dosage_form"
  | "unmatched_manufacturer";

export interface DrapAtcMatchCandidate {
  productId: string;
  brandName: string;
  genericName: string;
  strength?: string;
  dosageForm?: string;
  manufacturerName?: string;
  normalizedBrandName: string;
  normalizedGenericName: string;
  normalizedStrength?: string;
  normalizedDosageForm?: string;
  normalizedManufacturerName?: string;
}

export interface DrapAtcMatchResult {
  productId: string;
  brandName: string;
  genericName: string;
  canonicalGenericId?: string;
  canonicalGenericName?: string;
  canonicalGenericNormalizedName?: string;
  atcCodes: string[];
  therapeuticCategoryCodes: string[];
  matchMode: DrapAtcMatchMode;
  matchStatus: DrapAtcMatchStatus;
  confidenceScore: number;
  reviewReason?: string;
}

export interface DrapAtcMatchStatistics {
  totalDrapProducts: number;
  matchedProducts: number;
  unmatchedProducts: number;
  ambiguousProducts: number;
  compositionGroupsGenerated: number;
  manufacturersIdentified: number;
  categoriesAssigned: number;
}

export interface DrapCompositionGroupResult {
  signature: string;
  moleculesHash: string;
  dosageForm: string;
  normalizedDosageForm: string;
  productIds: string[];
  canonicalGenericIds: string[];
}

export interface DrapAtcMatchReport extends DrapAtcMatchStatistics {
  batchId?: string;
  inventory: DrapDatasetInventoryItem[];
  matchedProductResults: DrapAtcMatchResult[];
  unmatchedProductResults: DrapAtcMatchResult[];
  ambiguousMatchResults: DrapAtcMatchResult[];
  dataQualityFlags: Array<{
    entityType: string;
    entityId: string;
    flagType: DrapDataQualityFlagType;
    severity: string;
    description: string;
  }>;
  compositionGroups: DrapCompositionGroupResult[];
}

export interface DrapPrismaTransactionClient {
  importBatch: {
    create(args: unknown): Promise<{ id: string }>;
    update(args: unknown): Promise<unknown>;
  };
  importBatchItem: {
    create(args: unknown): Promise<unknown>;
  };
  importError: {
    create(args: unknown): Promise<unknown>;
  };
  manufacturer: {
    findFirst(args: unknown): Promise<{ id: string } | null>;
    create(args: unknown): Promise<{ id: string }>;
  };
  generic: {
    findUnique(args: unknown): Promise<{ id: string } | null>;
    create(args: unknown): Promise<{ id: string }>;
  };
  product: {
    findFirst(args: unknown): Promise<{ id: string } | null>;
    create(args: unknown): Promise<{ id: string }>;
    update(args: unknown): Promise<{ id: string }>;
  };
  productComposition: {
    findFirst(args: unknown): Promise<{ id: string } | null>;
    create(args: unknown): Promise<{ id: string }>;
  };
  auditLog: {
    create(args: unknown): Promise<unknown>;
  };
}

export interface DrapPrismaClient extends DrapPrismaTransactionClient {
  $transaction<T>(callback: (tx: DrapPrismaTransactionClient) => Promise<T>): Promise<T>;
}
