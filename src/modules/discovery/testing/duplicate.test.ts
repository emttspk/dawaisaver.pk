import { strict as assert } from "node:assert";
import { DiscoveryModule } from "../discovery.module";
import {
  discoveryInputs,
  knownMedicines,
} from "./discovery.dataset";

export function runDiscoveryDuplicateTest(): void {
  const service = DiscoveryModule.createService();
  const result = service.generateCandidate(discoveryInputs[1], knownMedicines);

  assert.equal(result.duplicateFlags.existingCanonicalProduct, true);
  assert.equal(result.duplicateFlags.existingSignature, true);
  assert.ok(result.duplicateFlags.matches.includes("canonical-augmentin"));
}

describe("Discovery duplicate detection", () => {
  it("detects duplicate canonical products and signatures", () => {
    runDiscoveryDuplicateTest();
  });
});
