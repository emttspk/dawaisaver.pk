export type DiscoverySourceType =
  | "DRAP_IMPORT"
  | "PHARMACY_SNAPSHOT"
  | "SEARCH_QUERY"
  | "UNKNOWN_PRODUCT"
  | "BILL_IMPORT"
  | "PRESCRIPTION_IMPORT"
  | "ADMIN_IMPORT";

export type DiscoveryStatus =
  | "new"
  | "collecting_evidence"
  | "needs_review"
  | "approved"
  | "rejected"
  | "merged";

export type DiscoveryReviewDecision =
  | "approve"
  | "reject"
  | "merge"
  | "request_more_evidence";

export interface DiscoveryInput {
  source: string;
  sourceType: DiscoverySourceType;
  sourceUrl?: string;
  brandName?: string;
  genericName?: string;
  strength?: string;
  dosageForm?: string;
  manufacturer?: string;
  packSize?: string;
  registrationNumber?: string;
  medicineSignature?: string;
  searchQuery?: string;
  sourceRecordId?: string;
  capturedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface DiscoveryCandidateDto {
  id?: string;
  candidateName: string;
  normalizedBrand?: string;
  normalizedGeneric?: string;
  normalizedStrength?: string;
  normalizedDosageForm?: string;
  normalizedManufacturer?: string;
  medicineSignature?: string;
  registrationNumber?: string;
  packSize?: string;
  discoveryStatus: DiscoveryStatus;
  sourceConfidence: number;
  matchingConfidence: number;
  evidenceConfidence: number;
  overallConfidence: number;
  duplicateFlags: DuplicateDiscoveryFlags;
  metadata?: Record<string, unknown>;
}

export interface DiscoveryEvidenceDto {
  source: string;
  sourceType: DiscoverySourceType;
  sourceUrl?: string;
  confidence: number;
  captureDate: string;
  supportingFields: Record<string, unknown>;
  sourceRecordId?: string;
}

export interface DiscoveryReviewDto {
  candidateId?: string;
  decision: DiscoveryReviewDecision;
  reviewNotes?: string;
  mergeTargetCanonicalProductId?: string;
}

export interface DiscoveryConfidenceDto {
  sourceConfidence: number;
  matchingConfidence: number;
  evidenceConfidence: number;
  overallConfidence: number;
}

export interface DuplicateDiscoveryFlags {
  existingProductMatch: boolean;
  existingCanonicalProduct: boolean;
  existingAlias: boolean;
  existingSignature: boolean;
  matches: string[];
}

export interface KnownMedicineIdentity {
  id: string;
  brandName?: string;
  genericName?: string;
  manufacturer?: string;
  medicineSignature?: string;
  aliases?: string[];
}
