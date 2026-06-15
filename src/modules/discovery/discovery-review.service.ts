import {
  DiscoveryCandidateDto,
  DiscoveryReviewDto,
} from "./discovery.types";

export class DiscoveryReviewService {
  applyReview(
    candidate: DiscoveryCandidateDto,
    review: DiscoveryReviewDto,
  ): DiscoveryCandidateDto {
    const statusByDecision = {
      approve: "approved",
      reject: "rejected",
      merge: "merged",
      request_more_evidence: "collecting_evidence",
    } as const;

    return {
      ...candidate,
      discoveryStatus: statusByDecision[review.decision],
      metadata: {
        ...(candidate.metadata || {}),
        review,
      },
    };
  }
}

