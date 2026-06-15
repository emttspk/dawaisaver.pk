import { MatchingService } from "../matching/matching.service";
import { MatchCandidateInput } from "../matching/matching.types";
import { PrescriptionParserService } from "./prescription-parser.service";
import { PrescriptionCostEstimatorService } from "./prescription-cost-estimator.service";
import { PrescriptionItemMatcherService } from "./prescription-item-matcher.service";
import { PrescriptionReviewInput, PrescriptionReviewResult, PrescriptionProcessingInput, PrescriptionProcessingResult, PrescriptionCostEstimateResult, PrescriptionCostEstimationContext } from "./prescription.types";
import { PrescriptionReviewService } from "./prescription-review.service";

export class PrescriptionsService {
  constructor(
    private readonly parser = new PrescriptionParserService(),
    private readonly itemMatcher = new PrescriptionItemMatcherService(new MatchingService()),
    private readonly costEstimator = new PrescriptionCostEstimatorService(),
    private readonly reviewService = new PrescriptionReviewService(),
  ) {}

  processPrescription(
    input: PrescriptionProcessingInput,
    canonicalCandidates: MatchCandidateInput[] = [],
  ): PrescriptionProcessingResult {
    const { rawText, lines } = this.parser.parse(input);
    const items = this.itemMatcher.matchItems(lines, canonicalCandidates);
    const safetyWarnings = Array.from(
      new Set(items.flatMap((item) => item.safetyWarnings)),
    );
    const confidenceScore = lines.length === 0
      ? 0
      : items.reduce((sum, item) => sum + item.confidenceScore, 0) / items.length;
    const reviewRequired = items.some((item) => item.reviewRequired) || confidenceScore < 0.75;

    return {
      rawText,
      rawLines: lines,
      items,
      safetyWarnings,
      reviewRequired,
      confidenceScore: Number(confidenceScore.toFixed(4)),
    };
  }

  estimateCost(
    items: PrescriptionProcessingResult["items"],
    context: PrescriptionCostEstimationContext,
  ): PrescriptionCostEstimateResult {
    return this.costEstimator.estimateCost(items, context);
  }

  reviewPrescription(items: PrescriptionProcessingResult["items"], review: PrescriptionReviewInput): PrescriptionReviewResult {
    return this.reviewService.reviewPrescription(items, review);
  }
}

