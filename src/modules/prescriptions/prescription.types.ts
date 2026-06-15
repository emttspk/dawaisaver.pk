import { ConfidenceBreakdownDto, MatchCandidateInput, MatchExplanationDto } from "../matching/matching.types";

export type PrescriptionItemMatchStatus = "matched" | "possible_match" | "needs_review" | "unmatched";

export type PrescriptionReviewDecision = "approve" | "reject" | "request_more_evidence";

export type PrescriptionSafetyWarning =
  | "INSULIN"
  | "THYROID_MEDICINE"
  | "ANTI_EPILEPSY_MEDICINE"
  | "BLOOD_THINNER"
  | "CANCER_MEDICINE"
  | "PSYCHIATRIC_MEDICINE"
  | "STEROID"
  | "PREGNANCY_RELATED_MEDICINE"
  | "CONTROLLED_MEDICINE";

export interface PrescriptionUserContext {
  userId?: string;
  age?: number;
  gender?: string;
  notes?: string;
}

export interface PrescriptionProcessingInput {
  imageReference?: string;
  manualText?: string;
  ocrText?: string;
  city?: string;
  userContext?: PrescriptionUserContext;
}

export interface PrescriptionRawLine {
  lineNumber: number;
  rawText: string;
  normalizedText: string;
  parsedName: string;
  dosageText?: string;
  quantity?: number;
  confidenceScore: number;
}

export interface PrescriptionAlternativeOption {
  productId?: string;
  canonicalProductId?: string;
  label: string;
  medicineSignature?: string;
  price?: number;
  confidenceScore: number;
}

export interface PrescriptionMatchScore {
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
  confidenceScore: number;
}

export interface PrescriptionItemResult {
  lineNumber: number;
  rawText: string;
  parsedName: string;
  dosageText?: string;
  quantity?: number;
  matchStatus: PrescriptionItemMatchStatus;
  confidenceScore: number;
  reviewRequired: boolean;
  matchedProductId?: string;
  canonicalProductId?: string;
  brandName?: string;
  genericName?: string;
  strength?: string;
  dosageForm?: string;
  manufacturer?: string;
  packSize?: string;
  registrationNumber?: string;
  medicineSignature?: string;
  safetyWarnings: PrescriptionSafetyWarning[];
  confidenceBreakdown: ConfidenceBreakdownDto;
  explanation: MatchExplanationDto;
  rankedCandidates: PrescriptionMatchScore[];
  alternativeOptions: PrescriptionAlternativeOption[];
}

export interface PrescriptionPriceSignal {
  productId?: string;
  canonicalProductId?: string;
  medicineSignature?: string;
  city?: string;
  lowestPrice?: number;
  highestPrice?: number;
  averagePrice?: number;
  latestPrice?: number;
  availabilityScore?: number;
  confidenceScore?: number;
  sourceCount?: number;
}

export interface PrescriptionCitySignal {
  city: string;
  lowestObservedPrice?: number;
  highestObservedPrice?: number;
  averagePrice?: number;
  availabilityPercentage?: number;
  sourceCount?: number;
  confidenceScore?: number;
}

export interface PrescriptionCostEstimationContext {
  city?: string;
  priceSignals: PrescriptionPriceSignal[];
  citySignals?: PrescriptionCitySignal[];
  marketAverage?: number;
}

export interface PrescriptionItemCostEstimate {
  lineNumber: number;
  rawText: string;
  matchedProductId?: string;
  canonicalProductId?: string;
  originalEstimatedCost: number;
  cheapestEquivalentCost: number;
  balancedOptionCost: number;
  premiumOptionCost: number;
  estimatedSaving: number;
  confidenceScore: number;
  reviewRequired: boolean;
  alternativeOptions: PrescriptionAlternativeOption[];
}

export interface PrescriptionCostEstimateResult {
  city?: string;
  itemEstimates: PrescriptionItemCostEstimate[];
  originalEstimatedCost: number;
  cheapestEquivalentCost: number;
  balancedOptionCost: number;
  premiumOptionCost: number;
  estimatedSaving: number;
  confidenceScore: number;
  reviewRequired: boolean;
  safetyWarnings: PrescriptionSafetyWarning[];
}

export interface PrescriptionReviewItemConfirmation {
  itemId: string;
  confirmed: boolean;
  notes?: string;
}

export interface PrescriptionReviewInput {
  decision: PrescriptionReviewDecision;
  notes?: string;
  itemConfirmations?: PrescriptionReviewItemConfirmation[];
}

export interface PrescriptionReviewResult {
  decision: PrescriptionReviewDecision;
  status: "approved" | "rejected" | "needs_review";
  reviewRequired: boolean;
  notes?: string;
  itemConfirmations: PrescriptionReviewItemConfirmation[];
}

export interface PrescriptionProcessingResult {
  rawText: string;
  rawLines: PrescriptionRawLine[];
  items: PrescriptionItemResult[];
  safetyWarnings: PrescriptionSafetyWarning[];
  reviewRequired: boolean;
  confidenceScore: number;
}

