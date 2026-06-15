import {
  PriceChangeEventResult,
  PriceIntelligenceOptions,
  PriceSnapshotInput,
} from "./price-intelligence.types";
import { roundMoney, roundNumber } from "./price-comparison.service";

export class PriceChangeDetectorService {
  detectPriceChanges(
    snapshots: PriceSnapshotInput[],
    options: PriceIntelligenceOptions = {},
  ): PriceChangeEventResult[] {
    const significantThreshold = options.significantChangePercent ?? 15;
    const groups = groupByMarketKey(snapshots);
    const events: PriceChangeEventResult[] = [];

    for (const group of groups.values()) {
      const sorted = group
        .filter((snapshot) => Number.isFinite(snapshot.price) && snapshot.price > 0)
        .sort((a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime());

      for (let index = 0; index < sorted.length; index += 1) {
        const current = sorted[index];
        const previous = sorted[index - 1];
        const event = this.compare(current, previous, sorted.slice(0, index), significantThreshold);
        if (event) {
          events.push(event);
        }
      }
    }

    return events;
  }

  private compare(
    current: PriceSnapshotInput,
    previous: PriceSnapshotInput | undefined,
    history: PriceSnapshotInput[],
    significantThreshold: number,
  ): PriceChangeEventResult | undefined {
    if (!previous) {
      return {
        productId: current.productId,
        medicineSignature: current.medicineSignature,
        snapshotId: current.id,
        currentPrice: roundMoney(current.price),
        direction: "NEW",
        changeTypes: [],
        city: current.city,
        capturedAt: new Date(current.capturedAt).toISOString(),
        confidenceScore: current.confidenceScore ?? 0.8,
      };
    }

    const changeAmount = current.price - previous.price;
    const changePercent = previous.price === 0 ? undefined : (changeAmount / previous.price) * 100;
    const direction = changeAmount > 0 ? "INCREASE" : changeAmount < 0 ? "DECREASE" : "UNCHANGED";
    const historicalPrices = history.map((snapshot) => snapshot.price);
    const changeTypes: PriceChangeEventResult["changeTypes"] = [];

    if (direction === "INCREASE") {
      changeTypes.push("PRICE_INCREASE");
    }
    if (direction === "DECREASE") {
      changeTypes.push("PRICE_DECREASE");
    }
    if (historicalPrices.length > 0 && current.price < Math.min(...historicalPrices)) {
      changeTypes.push("NEW_LOW");
    }
    if (historicalPrices.length > 0 && current.price > Math.max(...historicalPrices)) {
      changeTypes.push("NEW_HIGH");
    }
    if (changePercent !== undefined && Math.abs(changePercent) >= significantThreshold) {
      changeTypes.push("SIGNIFICANT_CHANGE");
    }

    if (changeTypes.length === 0) {
      return undefined;
    }

    return {
      productId: current.productId,
      medicineSignature: current.medicineSignature,
      snapshotId: current.id,
      previousPrice: roundMoney(previous.price),
      currentPrice: roundMoney(current.price),
      changeAmount: roundMoney(changeAmount),
      changePercent: changePercent === undefined ? undefined : roundNumber(changePercent, 4),
      direction,
      changeTypes,
      city: current.city,
      capturedAt: new Date(current.capturedAt).toISOString(),
      confidenceScore: current.confidenceScore ?? 0.8,
    };
  }
}

function groupByMarketKey(snapshots: PriceSnapshotInput[]): Map<string, PriceSnapshotInput[]> {
  const groups = new Map<string, PriceSnapshotInput[]>();
  for (const snapshot of snapshots) {
    const key = [
      snapshot.productId || snapshot.medicineSignature || "unknown",
      snapshot.city || "all",
      snapshot.sourceProviderId || snapshot.sourceProviderCode || "unknown-source",
    ].join("|");
    groups.set(key, [...(groups.get(key) || []), snapshot]);
  }
  return groups;
}

