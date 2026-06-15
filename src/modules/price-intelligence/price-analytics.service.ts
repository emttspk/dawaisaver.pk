import {
  MarketPriceSignal,
  PriceAnomalyResult,
  PriceIntelligenceOptions,
  PriceSnapshotInput,
  PriceTrendResult,
} from "./price-intelligence.types";
import {
  average,
  median,
  roundMoney,
  roundNumber,
  variance,
} from "./price-comparison.service";

export class PriceAnalyticsService {
  detectAnomalies(
    snapshots: PriceSnapshotInput[],
    options: PriceIntelligenceOptions = {},
  ): PriceAnomalyResult[] {
    const validPrices = snapshots
      .filter((snapshot) => Number.isFinite(snapshot.price) && snapshot.price > 0)
      .map((snapshot) => snapshot.price);
    const marketMedian = validPrices.length > 0 ? median(validPrices) : 0;
    const lowFactor = options.extremeLowFactor ?? 0.35;
    const highFactor = options.extremeHighFactor ?? 2.5;
    const duplicateWindowMinutes = options.duplicateWindowMinutes ?? 30;
    const anomalies: PriceAnomalyResult[] = [];
    const duplicateKeys = new Set<string>();

    for (const snapshot of snapshots) {
      const base = {
        productId: snapshot.productId,
        medicineSignature: snapshot.medicineSignature,
        snapshotId: snapshot.id,
        price: snapshot.price,
        city: snapshot.city,
        detectedAt: new Date().toISOString(),
        confidenceScore: snapshot.confidenceScore ?? 0.75,
      };

      if (!Number.isFinite(snapshot.price) || snapshot.price <= 0) {
        anomalies.push({
          ...base,
          anomalyType: "INVALID_PRICE",
          severityScore: 1,
        });
        continue;
      }

      if (marketMedian > 0 && snapshot.price < marketMedian * lowFactor) {
        anomalies.push({
          ...base,
          anomalyType: "SUSPICIOUS_DROP",
          expectedMin: roundMoney(marketMedian * lowFactor),
          expectedMax: roundMoney(marketMedian * highFactor),
          severityScore: roundNumber(1 - snapshot.price / marketMedian, 4),
        });
      }

      if (marketMedian > 0 && snapshot.price > marketMedian * highFactor) {
        anomalies.push({
          ...base,
          anomalyType: "SUSPICIOUS_SPIKE",
          expectedMin: roundMoney(marketMedian * lowFactor),
          expectedMax: roundMoney(marketMedian * highFactor),
          severityScore: roundNumber(snapshot.price / marketMedian - 1, 4),
        });
      }

      if (marketMedian > 0 && (snapshot.price < marketMedian * 0.2 || snapshot.price > marketMedian * 4)) {
        anomalies.push({
          ...base,
          anomalyType: "EXTREME_PRICING",
          expectedMin: roundMoney(marketMedian * 0.2),
          expectedMax: roundMoney(marketMedian * 4),
          severityScore: 1,
        });
      }

      const duplicateKey = [
        snapshot.productId || snapshot.medicineSignature,
        snapshot.sourceProviderId || snapshot.sourceProviderCode,
        snapshot.city,
        snapshot.price,
        bucketTime(snapshot.capturedAt, duplicateWindowMinutes),
      ].join("|");

      if (duplicateKeys.has(duplicateKey)) {
        anomalies.push({
          ...base,
          anomalyType: "DUPLICATE_PRICE",
          severityScore: 0.5,
        });
      }
      duplicateKeys.add(duplicateKey);
    }

    return anomalies;
  }

  getMarketSignals(snapshots: PriceSnapshotInput[]): MarketPriceSignal | undefined {
    const valid = snapshots.filter((snapshot) => Number.isFinite(snapshot.price) && snapshot.price > 0);
    if (valid.length === 0) {
      return undefined;
    }

    const prices = valid.map((snapshot) => snapshot.price).sort((a, b) => a - b);
    const marketAverage = average(prices);
    const marketVariance = variance(prices, marketAverage);
    const stability = marketAverage === 0 ? 0 : Math.max(0, 1 - Math.sqrt(marketVariance) / marketAverage);

    return {
      productId: valid[0].productId,
      medicineSignature: valid[0].medicineSignature,
      bestPrice: roundMoney(prices[0]),
      recommendedPrice: roundMoney(median(prices)),
      marketAverage: roundMoney(marketAverage),
      confidenceScore: roundNumber(Math.min(valid.length / 10, 1), 4),
      priceStabilityScore: roundNumber(stability, 4),
      city: valid[0].city,
      calculatedAt: new Date().toISOString(),
    };
  }

  getPriceTrend(snapshots: PriceSnapshotInput[], windowDays = 30): PriceTrendResult | undefined {
    const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
    const valid = snapshots
      .filter((snapshot) => Number.isFinite(snapshot.price) && snapshot.price > 0)
      .filter((snapshot) => new Date(snapshot.capturedAt).getTime() >= cutoff)
      .sort((a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime());

    if (valid.length === 0) {
      return undefined;
    }

    const prices = valid.map((snapshot) => snapshot.price);
    const startPrice = valid[0].price;
    const endPrice = valid[valid.length - 1].price;
    const direction = endPrice > startPrice ? "INCREASE" : endPrice < startPrice ? "DECREASE" : "UNCHANGED";
    const avg = average(prices);
    const volatilityScore = avg === 0 ? 0 : Math.min(1, Math.sqrt(variance(prices, avg)) / avg);

    return {
      productId: valid[0].productId,
      medicineSignature: valid[0].medicineSignature,
      city: valid[0].city,
      windowDays,
      startPrice: roundMoney(startPrice),
      endPrice: roundMoney(endPrice),
      minPrice: roundMoney(Math.min(...prices)),
      maxPrice: roundMoney(Math.max(...prices)),
      averagePrice: roundMoney(avg),
      direction,
      volatilityScore: roundNumber(volatilityScore, 4),
      confidenceScore: roundNumber(Math.min(valid.length / 8, 1), 4),
      calculatedAt: new Date().toISOString(),
    };
  }
}

function bucketTime(value: string | Date, windowMinutes: number): number {
  const ms = new Date(value).getTime();
  return Math.floor(ms / (windowMinutes * 60 * 1000));
}

