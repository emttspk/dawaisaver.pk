import {
  PriceSnapshotInput,
  ProductPriceStatistics,
} from "./price-intelligence.types";

export class PriceComparisonService {
  getProductStatistics(snapshots: PriceSnapshotInput[]): ProductPriceStatistics | undefined {
    const valid = snapshots.filter((snapshot) => Number.isFinite(snapshot.price) && snapshot.price > 0);
    if (valid.length === 0) {
      return undefined;
    }

    const sortedByPrice = [...valid].sort((a, b) => a.price - b.price);
    const sortedByDate = [...valid].sort(
      (a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime(),
    );
    const prices = sortedByPrice.map((snapshot) => snapshot.price);
    const averagePrice = average(prices);

    return {
      productId: valid[0].productId,
      medicineSignature: valid[0].medicineSignature,
      lowestPrice: roundMoney(prices[0]),
      highestPrice: roundMoney(prices[prices.length - 1]),
      averagePrice: roundMoney(averagePrice),
      medianPrice: roundMoney(median(prices)),
      latestPrice: roundMoney(sortedByDate[sortedByDate.length - 1].price),
      priceVariance: roundNumber(variance(prices, averagePrice), 4),
      availabilityScore: roundNumber(availabilityScore(valid), 4),
      sourceCount: uniqueCount(valid.map((snapshot) => snapshot.sourceProviderId || snapshot.sourceProviderCode)),
      sampleCount: valid.length,
      confidenceScore: confidence(valid.length, uniqueCount(valid.map((snapshot) => snapshot.sourceProviderId || snapshot.sourceProviderCode))),
      calculatedAt: new Date().toISOString(),
    };
  }
}

export function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

export function variance(values: number[], mean = average(values)): number {
  return average(values.map((value) => (value - mean) ** 2));
}

export function roundMoney(value: number): number {
  return roundNumber(value, 2);
}

export function roundNumber(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function uniqueCount(values: Array<string | undefined>): number {
  return new Set(values.filter(Boolean)).size;
}

function availabilityScore(snapshots: PriceSnapshotInput[]): number {
  const available = snapshots.filter((snapshot) =>
    snapshot.stockStatus === "IN_STOCK" || snapshot.stockStatus === "LIMITED",
  ).length;
  return available / snapshots.length;
}

function confidence(sampleCount: number, sourceCount: number): number {
  const sampleScore = Math.min(sampleCount / 10, 1);
  const sourceScore = Math.min(sourceCount / 3, 1);
  return roundNumber(sampleScore * 0.45 + sourceScore * 0.55, 4);
}

