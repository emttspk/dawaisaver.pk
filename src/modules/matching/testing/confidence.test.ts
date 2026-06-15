import { strict as assert } from "node:assert";
import { MatchingModule } from "../matching.module";
import {
  canonicalMedicines,
  sourceMedicines,
} from "./matching.dataset";

export function runConfidenceTest(): void {
  const service = MatchingModule.createService();
  const augmentin = service.match(sourceMedicines[0], canonicalMedicines[0]);
  const esomeprazole = service.match(sourceMedicines[1], canonicalMedicines[1]);
  const wrong = service.match(sourceMedicines[0], canonicalMedicines[2]);

  assert.equal(augmentin.status, "matched");
  assert.ok(augmentin.confidence >= 0.92);
  assert.ok(esomeprazole.confidence >= 0.78);
  assert.ok(wrong.confidence < 0.78);
  assert.ok(augmentin.explanation.fieldsMatched.includes("medicine_signature"));
}

describe("Matching confidence", () => {
  it("classifies strong and weak matches", () => {
    runConfidenceTest();
  });
});
