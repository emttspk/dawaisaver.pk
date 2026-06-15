import { strict as assert } from "node:assert";
import { DiscoveryModule } from "../discovery.module";
import {
  discoveryInputs,
  knownMedicines,
} from "./discovery.dataset";

export function runCandidateGenerationTest(): void {
  const service = DiscoveryModule.createService();
  const result = service.discoverProduct(discoveryInputs[0], knownMedicines);

  assert.equal(result.candidate.normalizedBrand, "moxclav");
  assert.equal(result.candidate.medicineSignature, "amoxicillin_clavulanic_acid_625mg_tablet");
  assert.ok(result.evidence.confidence > 0);
}

describe("Discovery candidate generation", () => {
  it("generates provisional candidates and evidence", () => {
    runCandidateGenerationTest();
  });
});
