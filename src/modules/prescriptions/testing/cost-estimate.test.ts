import { strict as assert } from "node:assert";
import { PrescriptionCostEstimatorService } from "../prescription-cost-estimator.service";
import { PrescriptionItemMatcherService } from "../prescription-item-matcher.service";
import { PrescriptionParserService } from "../prescription-parser.service";
import {
  sampleCanonicalCandidates,
  sampleCitySignals,
  samplePriceSignals,
  samplePrescriptionText,
} from "./sample-prescription.dataset";

describe("Prescription cost estimate", () => {
  it("calculates original, cheapest, balanced, and premium options", () => {
    const parser = new PrescriptionParserService();
    const matcher = new PrescriptionItemMatcherService();
    const estimator = new PrescriptionCostEstimatorService();
    const parsed = parser.parse({ text: samplePrescriptionText } as any);
    const items = matcher.matchItems(parsed.lines, sampleCanonicalCandidates);
    const estimate = estimator.estimateCost(items, {
      city: "Karachi",
      priceSignals: samplePriceSignals,
      citySignals: sampleCitySignals,
      marketAverage: 515,
    });

    assert.equal(estimate.city, "Karachi");
    assert.ok(estimate.originalEstimatedCost > estimate.cheapestEquivalentCost);
    assert.ok(estimate.balancedOptionCost >= estimate.cheapestEquivalentCost);
    assert.ok(estimate.premiumOptionCost >= estimate.balancedOptionCost);
    assert.ok(estimate.estimatedSaving >= 0);
  });
});

