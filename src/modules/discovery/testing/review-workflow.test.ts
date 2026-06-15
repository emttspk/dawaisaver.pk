import { strict as assert } from "node:assert";
import { DiscoveryModule } from "../discovery.module";
import {
  discoveryInputs,
  knownMedicines,
} from "./discovery.dataset";

export function runDiscoveryReviewWorkflowTest(): void {
  const service = DiscoveryModule.createService();
  const candidate = service.generateCandidate(discoveryInputs[0], knownMedicines);
  const reviewed = service.review(candidate, {
    decision: "request_more_evidence",
    reviewNotes: "Need DRAP confirmation before approval.",
  });

  assert.equal(reviewed.discoveryStatus, "collecting_evidence");
  const metadata = reviewed.metadata as { review?: { decision?: string } };
  assert.equal(metadata.review?.decision, "request_more_evidence");
}

describe("Discovery review workflow", () => {
  it("applies review decisions to candidate status", () => {
    runDiscoveryReviewWorkflowTest();
  });
});
