export type SourceProviderCode =
  | "dawaai"
  | "sehat"
  | "dvago"
  | "servaid"
  | "online_pharmacy"
  | "api";

export type SourceProviderKind =
  | "DAWAAI"
  | "SEHAT"
  | "DVAGO"
  | "SERVAID"
  | "ONLINE_PHARMACY"
  | "API";

export type SourceSyncStatus =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "COMPLETED_WITH_ERRORS"
  | "FAILED";

export type StockStatus = "IN_STOCK" | "OUT_OF_STOCK" | "LIMITED" | "UNKNOWN";

export interface SourceProviderDefinition {
  code: SourceProviderCode | string;
  name: string;
  providerKind: SourceProviderKind;
  baseUrl?: string;
  adapterVersion: string;
  enabled: boolean;
  cityScope?: string[];
  metadata?: Record<string, unknown>;
}

export interface SourceAdapterContext {
  provider: SourceProviderDefinition;
  config?: Record<string, unknown>;
  logger?: Pick<Console, "info" | "warn" | "error">;
}

export interface SourceRawProduct {
  externalProductId?: string;
  name: string;
  brandName?: string;
  genericName?: string;
  strength?: string;
  dosageForm?: string;
  manufacturer?: string;
  packSize?: string;
  productUrl?: string;
  raw?: unknown;
}

export interface SourceRawPrice {
  externalProductId?: string;
  productUrl?: string;
  price: number;
  currency?: string;
  stockStatus?: StockStatus;
  city?: string;
  capturedAt?: string;
  raw?: unknown;
}

export interface SourceProductDetail extends SourceRawProduct {
  description?: string;
  images?: string[];
  categories?: string[];
}

export interface NormalizedSourceProduct {
  externalProductId?: string;
  brandName: string;
  normalizedBrand: string;
  genericName?: string;
  normalizedGeneric?: string;
  strengthText?: string;
  normalizedStrength?: string;
  dosageForm?: string;
  normalizedDosageForm?: string;
  manufacturer?: string;
  packSize?: string;
  productUrl?: string;
  medicineSignature: string;
  confidenceScore: number;
  raw: unknown;
}

export interface NormalizedSourcePrice {
  externalProductId?: string;
  productUrl?: string;
  price: number;
  currency: string;
  stockStatus: StockStatus;
  city?: string;
  capturedAt: string;
  confidenceScore: number;
  raw: unknown;
}

export interface SourceValidationError {
  externalProductId?: string;
  errorCode: string;
  errorMessage: string;
  rawData?: unknown;
}

export interface SourceValidationResult {
  valid: boolean;
  errors: SourceValidationError[];
}

export interface SourceHealthDto {
  providerCode: string;
  healthy: boolean;
  statusCode?: number;
  responseTimeMs?: number;
  checkedAt: string;
  message?: string;
}

export interface SyncResultDto {
  providerCode: string;
  status: SourceSyncStatus;
  totalProducts: number;
  matchedProducts: number;
  priceSnapshots: number;
  errorCount: number;
  startedAt: string;
  finishedAt: string;
  errors: SourceValidationError[];
}

export interface PriceSnapshotDto {
  providerCode: string;
  externalProductId?: string;
  productId?: string;
  brandName?: string;
  genericName?: string;
  medicineSignature?: string;
  price: number;
  currency: string;
  stockStatus: StockStatus;
  city?: string;
  capturedAt: string;
  confidenceScore: number;
  sourceUrl?: string;
}

export interface SourcePrismaClient {
  sourceSyncJob?: {
    create(args: unknown): Promise<{ id: string }>;
    update(args: unknown): Promise<unknown>;
  };
  sourceSyncResult?: {
    create(args: unknown): Promise<unknown>;
  };
  sourceHealthLog?: {
    create(args: unknown): Promise<unknown>;
  };
  priceSnapshot?: {
    create(args: unknown): Promise<{ id: string }>;
  };
  productAvailability?: {
    create(args: unknown): Promise<unknown>;
  };
  auditLog?: {
    create(args: unknown): Promise<unknown>;
  };
}

