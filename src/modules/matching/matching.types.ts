export type MatchResultStatus =
  | "matched"
  | "possible_match"
  | "needs_review"
  | "unmatched";

export interface MatchCandidateInput {
  id?: string;
  productId?: string;
  canonicalProductId?: string;
  brandName?: string;
  genericName?: string;
  strength?: string;
  dosageForm?: string;
  manufacturer?: string;
  packSize?: string;
  registrationNumber?: string;
  medicineSignature?: string;
  sourceTable?: string;
  sourceRecordId?: string;
  metadata?: Record<string, unknown>;
}

export interface CanonicalMedicineInput extends MatchCandidateInput {
  canonicalName?: string;
}

export interface NormalizedMedicineIdentity {
  brandName: string;
  genericName: string;
  strength?: string;
  dosageForm?: string;
  manufacturer?: string;
  packSize?: string;
  registrationNumber?: string;
  medicineSignature: string;
}

export interface ConfidenceBreakdownDto {
  brandScore: number;
  genericScore: number;
  strengthScore: number;
  dosageFormScore: number;
  manufacturerScore: number;
  packSizeScore: number;
  registrationNumberScore: number;
  signatureScore: number;
  finalConfidence: number;
}

export interface MatchExplanationDto {
  whyMatched: string[];
  fieldsMatched: string[];
  fieldsDifferent: string[];
  confidenceBreakdown: ConfidenceBreakdownDto;
  reviewNotes?: string[];
}

export interface MatchReviewDto {
  productMatchId?: string;
  canonicalProductId?: string;
  reviewStatus: "PENDING" | "APPROVED" | "REJECTED" | "MERGED" | "SPLIT";
  reviewNotes?: string;
  confidenceBreakdown: ConfidenceBreakdownDto;
  explanation: MatchExplanationDto;
}

export interface MatchResultDto {
  source: NormalizedMedicineIdentity;
  canonical?: NormalizedMedicineIdentity;
  status: MatchResultStatus;
  confidence: number;
  explanation: MatchExplanationDto;
}

export interface DuplicateDetectionResult {
  duplicateBrands: string[];
  duplicateProducts: string[];
  duplicateManufacturers: string[];
  duplicateSignatures: string[];
}

export interface MatchingWeights {
  brand: number;
  generic: number;
  strength: number;
  dosageForm: number;
  manufacturer: number;
  packSize: number;
  registrationNumber: number;
  signature: number;
}

export const DEFAULT_MATCHING_WEIGHTS: MatchingWeights = {
  brand: 0.14,
  generic: 0.2,
  strength: 0.16,
  dosageForm: 0.1,
  manufacturer: 0.1,
  packSize: 0.05,
  registrationNumber: 0.1,
  signature: 0.15,
};
