import { strict as assert } from "node:assert";
import { PrescriptionItemMatcherService } from "../prescription-item-matcher.service";
import { PrescriptionParserService } from "../prescription-parser.service";
import { PrescriptionReviewService } from "../prescription-review.service";
import {
  sampleCanonicalCandidates,
  samplePrescriptionText,
} from "./sample-prescription.dataset";

describe("Prescription review workflow", () => {
  it("moves low-confidence items into review states", () => {
    const parser = new PrescriptionParserService();
    const matcher = new PrescriptionItemMatcherService();
    const reviewService = new PrescriptionReviewService();
    const parsed = parser.parse({ text: samplePrescriptionText } as any);
    const items = matcher.matchItems(parsed.lines, sampleCanonicalCandidates);
    const review = reviewService.reviewPrescription(items, {
      decision: "request_more_evidence",
      notes: "Need manual review.",
      itemConfirmations: [
        { itemId: "item-1", confirmed: true },
      ],
    });

    assert.equal(review.status, "needs_review");
    assert.equal(review.reviewRequired, true);
  });
});

