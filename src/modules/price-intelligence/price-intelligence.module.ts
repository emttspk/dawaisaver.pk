import { CityPriceAnalyticsService } from "./city-price-analytics.service";
import { PriceAnalyticsService } from "./price-analytics.service";
import { PriceChangeDetectorService } from "./price-change-detector.service";
import { PriceComparisonService } from "./price-comparison.service";
import { PriceIntelligenceService } from "./price-intelligence.service";

export class PriceIntelligenceModule {
  static createService(): PriceIntelligenceService {
    return new PriceIntelligenceService(
      new PriceComparisonService(),
      new CityPriceAnalyticsService(),
      new PriceAnalyticsService(),
      new PriceChangeDetectorService(),
    );
  }
}

export * from "./city-price-analytics.service";
export * from "./price-analytics.service";
export * from "./price-change-detector.service";
export * from "./price-comparison.service";
export * from "./price-intelligence.service";
export * from "./price-intelligence.types";

