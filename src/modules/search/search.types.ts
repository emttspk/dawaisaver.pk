export interface SearchQuery {
  q: string;
  city?: string;
  limit?: number;
  filters?: Record<string, unknown>;
}

export interface SearchableProduct {
  id: string;
  canonicalProductId?: string;
  brandName: string;
  genericName?: string;
  manufacturer?: string;
  dosageForm?: string;
  strength?: string;
  packSize?: string;
  registrationNumber?: string;
  medicineSignature?: string;
  confidenceScore?: number;
  availabilityScore?: number;
  priceIntelligenceScore?: number;
  popularityScore?: number;
  lowestPrice?: number;
  averagePrice?: number;
  city?: string;
  aliases?: string[];
  equivalentBrandIds?: string[];
}

export interface SearchResultDto {
  id: string;
  canonicalProductId?: string;
  brandName: string;
  genericName?: string;
  manufacturer?: string;
  medicineSignature?: string;
  registrationNumber?: string;
  score: number;
  rankingFactors: Record<string, number>;
  confidenceScore?: number;
  availabilityScore?: number;
  lowestPrice?: number;
  averagePrice?: number;
}

export interface AutocompleteDto {
  suggestion: string;
  suggestionType: "brand" | "generic" | "manufacturer" | "signature" | "registration_number" | "city";
  score: number;
  entityId?: string;
}

export interface AlternativeResultDto {
  canonicalProduct: SearchResultDto;
  equivalentBrands: SearchResultDto[];
  priceStatistics?: {
    lowestPrice?: number;
    averagePrice?: number;
    highestPrice?: number;
  };
  availability?: {
    availabilityScore?: number;
    city?: string;
  };
  confidenceScore: number;
}

export interface TrendingResultDto {
  query: string;
  entityType: "product" | "generic" | "manufacturer" | "signature" | "alternative";
  searchCount: number;
  trendingScore: number;
  city?: string;
}

export interface SearchSynonym {
  term: string;
  synonym: string;
}

export interface SearchPopularitySignal {
  normalizedQuery: string;
  searchCount: number;
  trendingScore: number;
  city?: string;
}

