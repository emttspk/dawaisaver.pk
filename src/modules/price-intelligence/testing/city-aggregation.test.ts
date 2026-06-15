import { strict as assert } from "node:assert";
import { CityPriceAnalyticsService } from "../city-price-analytics.service";
import { samplePriceSnapshots } from "./sample-price.dataset";

export function runCityAggregationTest(): void {
  const service = new CityPriceAnalyticsService();
  const stats = service.getCityStatistics(samplePriceSnapshots);
  const karachi = stats.find((item) => item.city === "Karachi");
  const lahore = stats.find((item) => item.city === "Lahore");

  assert.equal(karachi?.lowestObservedPrice, 370);
  assert.equal(karachi?.highestObservedPrice, 420);
  assert.equal(lahore?.highestObservedPrice, 450);
}

describe("City price aggregation", () => {
  it("aggregates price statistics by city", () => {
    runCityAggregationTest();
  });
});
