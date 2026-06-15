export type StockStatus = "IN_STOCK" | "OUT_OF_STOCK" | "LIMITED" | "UNKNOWN";

export type PriceChangeType =
  | "PRICE_INCREASE"
  | "PRICE_DECREASE"
  | "NEW_LOW"
  | "NEW_HIGH"
  | "SIGNIFICANT_CHANGE";

export type PriceAnomalyType =
  | "EXTREME_PRICING"
  | "SUSPICIOUS_DROP"
  | "SUSPICIOUS_SPIKE"
  | "DUPLICATE_PRICE"
  | "INVALID_PRICE";

export interface PriceSnapshotInput {
  id?: string;
  productId?: string;
  sourceProviderId?: string;
  sourceProviderCode?: string;
  medicineSignature?: string;
  price: number;
  currency?: string;
  stockStatus?: StockStatus;
  city?: string;
  capturedAt: string | Date;
  confidenceScore?: number;
  sourceUrl?: string;
}

export interface ProductPriceStatistics {
  productId?: string;
  medicineSignature?: string;
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
  medianPrice: number;
  latestPrice: number;
  priceVariance: number;
  availabilityScore: number;
  sourceCount: number;
  sampleCount: number;
  confidenceScore: number;
  calculatedAt: string;
}

export interface CityPriceStatistics {
  productId?: string;
  medicineSignature?: string;
  city: string;
  lowestObservedPrice: number;
  highestObservedPrice: number;
  averagePrice: number;
  availabilityPercentage: number;
  sourceCount: number;
  sampleCount: number;
  confidenceScore: number;
  calculatedAt: string;
}

export interface PriceChangeEventResult {
  productId?: string;
  medicineSignature?: string;
  snapshotId?: string;
  previousPrice?: number;
  currentPrice: number;
  changeAmount?: number;
  changePercent?: number;
  direction: "INCREASE" | "DECREASE" | "UNCHANGED" | "NEW";
  changeTypes: PriceChangeType[];
  city?: string;
  capturedAt: string;
  confidenceScore: number;
}

export interface PriceAnomalyResult {
  productId?: string;
  medicineSignature?: string;
  snapshotId?: string;
  anomalyType: PriceAnomalyType;
  price?: number;
  expectedMin?: number;
  expectedMax?: number;
  severityScore: number;
  city?: string;
  detectedAt: string;
  confidenceScore: number;
}

export interface MarketPriceSignal {
  productId?: string;
  medicineSignature?: string;
  bestPrice: number;
  recommendedPrice: number;
  marketAverage: number;
  confidenceScore: number;
  priceStabilityScore: number;
  city?: string;
  calculatedAt: string;
}

export interface PriceTrendResult {
  productId?: string;
  medicineSignature?: string;
  city?: string;
  windowDays: number;
  startPrice?: number;
  endPrice?: number;
  minPrice?: number;
  maxPrice?: number;
  averagePrice?: number;
  direction: "INCREASE" | "DECREASE" | "UNCHANGED" | "NEW";
  volatilityScore: number;
  confidenceScore: number;
  calculatedAt: string;
}

export interface PriceIntelligenceOptions {
  significantChangePercent?: number;
  extremeLowFactor?: number;
  extremeHighFactor?: number;
  duplicateWindowMinutes?: number;
}

