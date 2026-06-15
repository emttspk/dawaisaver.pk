import { strict as assert } from "node:assert";
import { DiscoveryModule } from "../discovery.module";
import {
  discoveryInputs,
  knownMedicines,
} from "./discovery.dataset";

export function runDiscoveryConfidenceTest(): void {
  const service = DiscoveryModule.createService();
  const result = service.discoverProduct(discoveryInputs[1], knownMedicines);

  assert.ok(result.candidate.sourceConfidence >= 0.7);
  assert.ok(result.candidate.evidenceConfidence >= 0.5);
  assert.ok(result.candidate.overallConfidence > 0.5);
}

describe("Discovery confidence", () => {
  it("combines source, evidence, and matching confidence", () => {
    runDiscoveryConfidenceTest();
  });
});
