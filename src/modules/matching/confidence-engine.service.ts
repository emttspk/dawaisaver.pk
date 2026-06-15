import {
  ConfidenceBreakdownDto,
  DEFAULT_MATCHING_WEIGHTS,
  MatchResultStatus,
  MatchingWeights,
} from "./matching.types";

export class ConfidenceEngineService {
  calculateFinalConfidence(
    breakdown: Omit<ConfidenceBreakdownDto, "finalConfidence">,
    weights: MatchingWeights = DEFAULT_MATCHING_WEIGHTS,
  ): ConfidenceBreakdownDto {
    const weighted =
      breakdown.brandScore * weights.brand +
      breakdown.genericScore * weights.generic +
      breakdown.strengthScore * weights.strength +
      breakdown.dosageFormScore * weights.dosageForm +
      breakdown.manufacturerScore * weights.manufacturer +
      breakdown.packSizeScore * weights.packSize +
      breakdown.registrationNumberScore * weights.registrationNumber +
      breakdown.signatureScore * weights.signature;
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);

    return {
      ...breakdown,
      finalConfidence: round(weighted / totalWeight),
    };
  }

  classify(confidence: number): MatchResultStatus {
    if (confidence >= 0.92) {
      return "matched";
    }
    if (confidence >= 0.78) {
      return "possible_match";
    }
    if (confidence >= 0.55) {
      return "needs_review";
    }
    return "unmatched";
  }
}

export function round(value: number): number {
  return Math.max(0, Math.min(1, Math.round(value * 10000) / 10000));
}

