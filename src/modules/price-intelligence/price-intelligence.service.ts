import { CityPriceAnalyticsService } from "./city-price-analytics.service";
import { PriceAnalyticsService } from "./price-analytics.service";
import { PriceChangeDetectorService } from "./price-change-detector.service";
import { PriceComparisonService } from "./price-comparison.service";
import {
  CityPriceStatistics,
  MarketPriceSignal,
  PriceAnomalyResult,
  PriceChangeEventResult,
  PriceSnapshotInput,
  ProductPriceStatistics,
} from "./price-intelligence.types";

export class PriceIntelligenceService {
  constructor(
    private readonly comparison = new PriceComparisonService(),
    private readonly cityAnalytics = new CityPriceAnalyticsService(),
    private readonly analytics = new PriceAnalyticsService(),
    private readonly changeDetector = new PriceChangeDetectorService(),
  ) {}

  getProductStatistics(snapshots: PriceSnapshotInput[]): ProductPriceStatistics | undefined {
    return this.comparison.getProductStatistics(snapshots);
  }

  getCityStatistics(snapshots: PriceSnapshotInput[]): CityPriceStatistics[] {
    return this.cityAnalytics.getCityStatistics(snapshots);
  }

  getMarketSignals(snapshots: PriceSnapshotInput[]): MarketPriceSignal | undefined {
    return this.analytics.getMarketSignals(snapshots);
  }

  detectPriceChanges(snapshots: PriceSnapshotInput[]): PriceChangeEventResult[] {
    return this.changeDetector.detectPriceChanges(snapshots);
  }

  detectAnomalies(snapshots: PriceSnapshotInput[]): PriceAnomalyResult[] {
    return this.analytics.detectAnomalies(snapshots);
  }
}

