import {
  CityPriceStatistics,
  PriceSnapshotInput,
} from "./price-intelligence.types";
import {
  average,
  roundMoney,
  roundNumber,
  uniqueCount,
} from "./price-comparison.service";

export class CityPriceAnalyticsService {
  getCityStatistics(snapshots: PriceSnapshotInput[]): CityPriceStatistics[] {
    const groups = new Map<string, PriceSnapshotInput[]>();

    for (const snapshot of snapshots) {
      if (!snapshot.city || !Number.isFinite(snapshot.price) || snapshot.price <= 0) {
        continue;
      }

      const key = snapshot.city.trim().toLowerCase();
      groups.set(key, [...(groups.get(key) || []), snapshot]);
    }

    return Array.from(groups.entries()).map(([cityKey, group]) => {
      const prices = group.map((snapshot) => snapshot.price).sort((a, b) => a - b);
      const available = group.filter((snapshot) =>
        snapshot.stockStatus === "IN_STOCK" || snapshot.stockStatus === "LIMITED",
      ).length;
      const sourceCount = uniqueCount(group.map((snapshot) => snapshot.sourceProviderId || snapshot.sourceProviderCode));

      return {
        productId: group[0].productId,
        medicineSignature: group[0].medicineSignature,
        city: displayCity(group[0].city || cityKey),
        lowestObservedPrice: roundMoney(prices[0]),
        highestObservedPrice: roundMoney(prices[prices.length - 1]),
        averagePrice: roundMoney(average(prices)),
        availabilityPercentage: roundNumber(available / group.length, 4),
        sourceCount,
        sampleCount: group.length,
        confidenceScore: roundNumber(Math.min(group.length / 8, 1) * 0.4 + Math.min(sourceCount / 3, 1) * 0.6, 4),
        calculatedAt: new Date().toISOString(),
      };
    });
  }
}

function displayCity(city: string): string {
  return city
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

