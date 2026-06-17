import { strict as assert } from "node:assert";
import { buildCompositionGroupResult, matchDrapCandidate, WhoMoleculeRecord } from "../drap.atc.helpers";
import { normalizeGenericName } from "../drap.normalizer";
import { DrapAtcMatchCandidate } from "../drap.types";

const molecules: WhoMoleculeRecord[] = [
  {
    id: "molecule-1",
    name: "Amoxicillin + Clavulanic Acid",
    normalizedName: "amoxicillin clavulanic acid",
    aliases: [
      { aliasName: "Co-Amoxiclav", normalizedAliasName: "co amoxiclav" },
    ],
    atcCodes: ["J01CR02"],
    therapeuticCategoryCodes: ["ATC_J"],
  },
  {
    id: "molecule-2",
    name: "Paracetamol",
    normalizedName: "paracetamol",
    aliases: [{ aliasName: "Acetaminophen", normalizedAliasName: "acetaminophen" }],
    atcCodes: ["N02BE01"],
    therapeuticCategoryCodes: ["ATC_N"],
  },
];

function candidate(genericName: string): DrapAtcMatchCandidate {
  return {
    productId: "product-1",
    brandName: "Sample",
    genericName,
    normalizedBrandName: "sample",
    normalizedGenericName: normalizeGenericName(genericName),
    normalizedStrength: "500 mg",
    normalizedDosageForm: "tablet",
    normalizedManufacturerName: "sample pharma",
  };
}

describe("DRAP ATC helpers", () => {
  it("matches exact, alias, normalized, and review candidates", () => {
    const exact = matchDrapCandidate(candidate("Amoxicillin + Clavulanic Acid"), molecules);
    const alias = matchDrapCandidate(candidate("Co-Amoxiclav"), molecules);
    const normalized = matchDrapCandidate(candidate("Amoxycillin + Clavulanic Acid"), molecules);
    const review = matchDrapCandidate(candidate("Mystery Molecule"), molecules);

    assert.equal(exact.matchMode, "exact_canonical");
    assert.equal(exact.confidenceScore, 1);
    assert.equal(alias.matchMode, "alias_match");
    assert.equal(alias.confidenceScore, 0.95);
    assert.equal(normalized.matchMode, "normalized_match");
    assert.equal(normalized.confidenceScore, 0.8);
    assert.equal(review.matchStatus, "unmatched");
  });

  it("builds stable composition signatures that keep different strengths apart", () => {
    const groupA = buildCompositionGroupResult(
      ["molecule-1", "molecule-3"],
      "Tablet",
      "tablet",
      [
        {
          productId: "product-a",
          canonicalGenericId: "molecule-1",
          canonicalGenericName: "Amoxicillin",
          ingredientOrder: 1,
          strengthValue: "500",
          strengthUnit: "mg",
        },
        {
          productId: "product-a",
          canonicalGenericId: "molecule-3",
          canonicalGenericName: "Clavulanic Acid",
          ingredientOrder: 2,
          strengthValue: "125",
          strengthUnit: "mg",
        },
      ],
    );

    const groupB = buildCompositionGroupResult(
      ["molecule-1", "molecule-3"],
      "Tablet",
      "tablet",
      [
        {
          productId: "product-b",
          canonicalGenericId: "molecule-1",
          canonicalGenericName: "Amoxicillin",
          ingredientOrder: 1,
          strengthValue: "875",
          strengthUnit: "mg",
        },
        {
          productId: "product-b",
          canonicalGenericId: "molecule-3",
          canonicalGenericName: "Clavulanic Acid",
          ingredientOrder: 2,
          strengthValue: "125",
          strengthUnit: "mg",
        },
      ],
    );

    assert.notEqual(groupA.signature, groupB.signature);
    assert.notEqual(groupA.moleculesHash, groupB.moleculesHash);
  });
});
