import { SourceType } from "@prisma/client";

export type IngredientReviewLane = "AUTO_APPROVE" | "REVIEW_REQUIRED" | "MANUAL_REVIEW";

export type IngredientPatternClass =
  | "exact_normalization"
  | "salt_variant"
  | "hydrate"
  | "hydrochloride"
  | "sodium_salt"
  | "potassium_salt"
  | "mesylate"
  | "fumarate"
  | "eq_to"
  | "spelling_variant"
  | "combination_product"
  | "descriptor_noise";

export interface IngredientReviewInput {
  rawIngredient: string;
  occurrenceCount?: number;
  sourceType?: SourceType;
  sourceUrl?: string;
}

export interface IngredientReviewEvaluation extends IngredientReviewInput {
  normalizedIngredient: string;
  patternClass: IngredientPatternClass;
  suggestedCanonicalMolecule: string | null;
  suggestedGenericId: string | null;
  confidenceScore: number;
  reviewLane: IngredientReviewLane;
  reasoning: string;
}

export interface IngredientReviewSimulationResult {
  totalRows: number;
  autoApproveRows: number;
  reviewRequiredRows: number;
  manualReviewRows: number;
  autoApproveShare: number;
  reviewRequiredShare: number;
  manualReviewShare: number;
  totalOccurrences: number;
  autoApproveOccurrences: number;
  reviewRequiredOccurrences: number;
  manualReviewOccurrences: number;
  autoApproveOccurrenceShare: number;
  reviewRequiredOccurrenceShare: number;
  manualReviewOccurrenceShare: number;
  evaluations: IngredientReviewEvaluation[];
}

export interface IngredientAliasPromotionInput {
  genericId: string;
  aliasValue: string;
  aliasType: string;
  confidenceScore?: number;
  sourceType?: SourceType;
  sourceUrl?: string;
  queueId?: string;
  approvedById?: string;
}

export interface WhoAliasSeedBundle {
  genericId: string;
  canonicalName: string;
  sourceUrl?: string;
  aliases: Array<{
    aliasName: string;
    normalizedAliasName: string;
    aliasType: string;
    confidenceScore: number;
  }>;
}
