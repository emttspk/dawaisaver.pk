import { strict as assert } from "node:assert";
import { MatchingModule } from "../matching.module";

export function runCanonicalizationTest(): void {
  const service = MatchingModule.createService();

  assert.equal(
    service.generateMedicineSignature({
      genericName: "Amoxicillin + Clavulanic Acid",
      strength: "625 mg",
      dosageForm: "Tablet",
    }),
    "amoxicillin_clavulanic_acid_625mg_tablet",
  );
  assert.equal(
    service.generateMedicineSignature({
      genericName: "Esomeprazole",
      strength: "40 mg",
      dosageForm: "Capsule",
    }),
    "esomeprazole_40mg_capsule",
  );
  assert.equal(
    service.generateMedicineSignature({
      genericName: "Atorvastatin",
      strength: "20 mg",
      dosageForm: "Tablet",
    }),
    "atorvastatin_20mg_tablet",
  );
}

describe("Medicine canonicalization", () => {
  it("generates canonical medicine signatures", () => {
    runCanonicalizationTest();
  });
});
