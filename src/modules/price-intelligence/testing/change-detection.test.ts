import { strict as assert } from "node:assert";
import { PriceChangeDetectorService } from "../price-change-detector.service";
import { samplePriceSnapshots } from "./sample-price.dataset";

export function runChangeDetectionTest(): void {
  const detector = new PriceChangeDetectorService();
  const events = detector.detectPriceChanges(samplePriceSnapshots, {
    significantChangePercent: 10,
  });

  assert.ok(events.some((event) => event.changeTypes.includes("PRICE_DECREASE")));
  assert.ok(events.some((event) => event.changeTypes.includes("NEW_LOW")));
  assert.ok(events.some((event) => event.changeTypes.includes("SIGNIFICANT_CHANGE")));
}

describe("Price change detection", () => {
  it("detects decreases, new lows, and significant changes", () => {
    runChangeDetectionTest();
  });
});
