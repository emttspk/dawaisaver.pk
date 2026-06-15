import { strict as assert } from "node:assert";
import { MatchingModule } from "../matching.module";
import { sourceMedicines } from "./matching.dataset";

export function runDuplicateTest(): void {
  const service = MatchingModule.createService();
  const result = service.detectDuplicates(sourceMedicines);

  assert.ok(result.duplicateBrands.includes("lipiget"));
  assert.ok(result.duplicateManufacturers.includes("getz"));
  assert.ok(result.duplicateSignatures.includes("atorvastatin_20mg_tablet"));
  assert.ok(result.duplicateProducts.length > 0);
}

describe("Matching duplicate detection", () => {
  it("detects duplicate brands, manufacturers, signatures, and products", () => {
    runDuplicateTest();
  });
});
