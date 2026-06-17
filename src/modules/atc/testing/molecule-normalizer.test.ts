import { strict as assert } from "node:assert";
import { MoleculeNormalizationService } from "../molecule-normalizer.service";

describe("Molecule normalization", () => {
  it("normalizes WHO ATC synonym examples", () => {
    const service = new MoleculeNormalizationService();

    const vitaminD3 = service.normalize("Vitamin D3");
    assert.equal(vitaminD3.canonicalName, "Cholecalciferol");
    assert.equal(vitaminD3.normalizedGenericName, "cholecalciferol");

    const acetaminophen = service.normalize("Acetaminophen");
    assert.equal(acetaminophen.canonicalName, "Paracetamol");
    assert.equal(acetaminophen.normalizedGenericName, "paracetamol");

    const coAmoxiclav = service.normalize("Co-Amoxiclav");
    assert.equal(coAmoxiclav.canonicalName, "Amoxicillin + Clavulanic Acid");
    assert.equal(coAmoxiclav.normalizedGenericName, "amoxicillin clavulanic acid");
  });
});
