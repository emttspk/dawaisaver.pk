import {
  PrescriptionItemResult,
  PrescriptionReviewInput,
  PrescriptionReviewResult,
} from "./prescription.types";

export class PrescriptionReviewService {
  reviewPrescription(
    items: PrescriptionItemResult[],
    review: PrescriptionReviewInput,
  ): PrescriptionReviewResult {
    const confirmedCount = review.itemConfirmations?.filter((item) => item.confirmed).length || 0;
    const rejectedCount = review.itemConfirmations?.filter((item) => !item.confirmed).length || 0;
    const reviewRequired = review.decision === "request_more_evidence" || items.some((item) => item.reviewRequired);
    const status =
      review.decision === "approve"
        ? "approved"
        : review.decision === "reject"
          ? "rejected"
          : "needs_review";

    return {
      decision: review.decision,
      status,
      reviewRequired,
      notes: [review.notes, `confirmed:${confirmedCount}`, `rejected:${rejectedCount}`]
        .filter(Boolean)
        .join(" | "),
      itemConfirmations: review.itemConfirmations || [],
    };
  }

  applyItemConfirmation(item: PrescriptionItemResult, confirmed: boolean): PrescriptionItemResult {
    return {
      ...item,
      reviewRequired: !confirmed || item.reviewRequired,
      matchStatus: confirmed ? item.matchStatus : "needs_review",
    };
  }
}

