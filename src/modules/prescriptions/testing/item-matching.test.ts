import { strict as assert } from "node:assert";
import { PrescriptionItemMatcherService } from "../prescription-item-matcher.service";
import { PrescriptionParserService } from "../prescription-parser.service";
import { sampleCanonicalCandidates, samplePrescriptionText } from "./sample-prescription.dataset";

describe("Prescription item matching", () => {
  it("matches prescription lines to canonical products and flags review needs", () => {
    const parser = new PrescriptionParserService();
    const matcher = new PrescriptionItemMatcherService();
    const parsed = parser.parse({ text: samplePrescriptionText } as any);
    const matches = matcher.matchItems(parsed.lines, sampleCanonicalCandidates);

    assert.equal(matches.length, 2);
    assert.notEqual(matches[0].matchStatus, "unmatched");
    assert.ok(matches[0].confidenceScore >= 0.5);
    assert.ok(matches[0].rankedCandidates.length > 0);
    assert.ok(matches[0].alternativeOptions.length > 0);
  });
});
