import { strict as assert } from "node:assert";
import { PriceIntelligenceModule } from "../price-intelligence.module";
import { samplePriceSnapshots } from "./sample-price.dataset";

export function runAnalyticsTest(): void {
  const service = PriceIntelligenceModule.createService();
  const stats = service.getProductStatistics(samplePriceSnapshots);
  const signals = service.getMarketSignals(samplePriceSnapshots);
  const anomalies = service.detectAnomalies(samplePriceSnapshots);

  assert.equal(stats?.lowestPrice, 370);
  assert.equal(stats?.highestPrice, 1200);
  assert.equal(stats?.latestPrice, 1200);
  assert.ok((stats?.sourceCount || 0) >= 4);
  assert.equal(signals?.bestPrice, 370);
  assert.ok(anomalies.some((item) => item.anomalyType === "INVALID_PRICE"));
  assert.ok(anomalies.some((item) => item.anomalyType === "DUPLICATE_PRICE"));
}

describe("Price analytics", () => {
  it("calculates product statistics, signals, and anomalies", () => {
    runAnalyticsTest();
  });
});
