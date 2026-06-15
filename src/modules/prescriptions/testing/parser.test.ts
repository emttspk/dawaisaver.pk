import { strict as assert } from "node:assert";
import { PrescriptionParserService } from "../prescription-parser.service";
import { samplePrescriptionText } from "./sample-prescription.dataset";

describe("Prescription parser", () => {
  it("extracts raw lines, names, dosage text, and quantities", () => {
    const parser = new PrescriptionParserService();
    const result = parser.parse({ text: samplePrescriptionText } as any);

    assert.equal(result.lines.length, 2);
    assert.equal(result.lines[0].parsedName, "amoxicillin clavulanic acid");
    assert.equal(result.lines[0].dosageText?.toLowerCase(), "625mg");
    assert.equal(result.lines[1].parsedName, "paracetamol");
  });
});
