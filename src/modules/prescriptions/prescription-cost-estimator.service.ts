import {
  PrescriptionCitySignal,
  PrescriptionCostEstimateResult,
  PrescriptionCostEstimationContext,
  PrescriptionItemCostEstimate,
  PrescriptionItemResult,
  PrescriptionPriceSignal,
  PrescriptionSafetyWarning,
} from "./prescription.types";
import { roundMoney, roundNumber } from "../price-intelligence/price-comparison.service";

export class PrescriptionCostEstimatorService {
  estimateCost(
    items: PrescriptionItemResult[],
    context: PrescriptionCostEstimationContext,
  ): PrescriptionCostEstimateResult {
    const itemEstimates = items.map((item) => this.estimateItem(item, context));
    const originalEstimatedCost = sum(itemEstimates.map((item) => item.originalEstimatedCost));
    const cheapestEquivalentCost = sum(itemEstimates.map((item) => item.cheapestEquivalentCost));
    const balancedOptionCost = sum(itemEstimates.map((item) => item.balancedOptionCost));
    const premiumOptionCost = sum(itemEstimates.map((item) => item.premiumOptionCost));
    const confidenceScore = average(itemEstimates.map((item) => item.confidenceScore));
    const reviewRequired = itemEstimates.some((item) => item.reviewRequired);

    return {
      city: context.city,
      itemEstimates,
      originalEstimatedCost: roundMoney(originalEstimatedCost),
      cheapestEquivalentCost: roundMoney(cheapestEquivalentCost),
      balancedOptionCost: roundMoney(balancedOptionCost),
      premiumOptionCost: roundMoney(premiumOptionCost),
      estimatedSaving: roundMoney(Math.max(0, originalEstimatedCost - cheapestEquivalentCost)),
      confidenceScore: roundNumber(confidenceScore, 4),
      reviewRequired,
      safetyWarnings: uniqueWarnings(items),
    };
  }

  estimateItem(
    item: PrescriptionItemResult,
    context: PrescriptionCostEstimationContext,
  ): PrescriptionItemCostEstimate {
    const matchedPriceSignals = this.findPriceSignals(item, context.priceSignals);
    const itemPrices = matchedPriceSignals.map((signal) => this.signalPrice(signal)).filter((price) => price > 0);
    const originalPrice = this.pickPrimaryPrice(item, matchedPriceSignals, context);
    const cheapestEquivalentCost = itemPrices.length > 0 ? Math.min(...itemPrices) : originalPrice;
    const balancedOptionCost = itemPrices.length > 0 ? median(itemPrices) : originalPrice;
    const premiumOptionCost = itemPrices.length > 0 ? Math.max(...itemPrices) : originalPrice * 1.15;
    const estimatedSaving = Math.max(0, originalPrice - cheapestEquivalentCost);
    const confidenceScore = roundNumber(
      Math.min(
        1,
        (item.confidenceScore + average(matchedPriceSignals.map((signal) => signal.confidenceScore ?? 0.5))) / 2,
      ),
      4,
    );

    return {
      lineNumber: item.lineNumber,
      rawText: item.rawText,
      matchedProductId: item.matchedProductId,
      canonicalProductId: item.canonicalProductId,
      originalEstimatedCost: roundMoney(originalPrice),
      cheapestEquivalentCost: roundMoney(cheapestEquivalentCost),
      balancedOptionCost: roundMoney(balancedOptionCost),
      premiumOptionCost: roundMoney(premiumOptionCost),
      estimatedSaving: roundMoney(estimatedSaving),
      confidenceScore,
      reviewRequired: item.reviewRequired || confidenceScore < 0.75,
      alternativeOptions: item.alternativeOptions,
    };
  }

  private pickPrimaryPrice(
    item: PrescriptionItemResult,
    matchedSignals: PrescriptionPriceSignal[],
    context: PrescriptionCostEstimationContext,
  ): number {
    const ordered = this.rankSignals(item, matchedSignals, context);
    const primary = ordered[0];
    if (!primary) {
      return this.fallbackCityPrice(context.citySignals, context.city, context.marketAverage);
    }

    return this.signalPrice(primary) || this.fallbackCityPrice(context.citySignals, context.city, context.marketAverage);
  }

  private rankSignals(
    item: PrescriptionItemResult,
    signals: PrescriptionPriceSignal[],
    context: PrescriptionCostEstimationContext,
  ): PrescriptionPriceSignal[] {
    const city = context.city?.trim().toLowerCase();
    return [...signals].sort((left, right) => {
      return scoreSignal(right, item, city) - scoreSignal(left, item, city);
    });
  }

  private findPriceSignals(
    item: PrescriptionItemResult,
    priceSignals: PrescriptionPriceSignal[],
  ): PrescriptionPriceSignal[] {
    const keys = new Set([
      item.matchedProductId,
      item.canonicalProductId,
      item.medicineSignature,
      ...item.rankedCandidates.map((candidate) => candidate.productId).filter(Boolean),
      ...item.rankedCandidates.map((candidate) => candidate.canonicalProductId).filter(Boolean),
    ]);

    return priceSignals.filter((signal) =>
      keys.has(signal.productId) ||
      keys.has(signal.canonicalProductId) ||
      keys.has(signal.medicineSignature),
    );
  }

  private fallbackCityPrice(
    citySignals: PrescriptionCitySignal[] = [],
    city?: string,
    marketAverage?: number,
  ): number {
    const normalizedCity = city?.trim().toLowerCase();
    const signal = citySignals.find((entry) => entry.city.trim().toLowerCase() === normalizedCity);
    if (signal?.averagePrice && signal.averagePrice > 0) {
      return signal.averagePrice;
    }
    if (signal?.lowestObservedPrice && signal.lowestObservedPrice > 0) {
      return signal.lowestObservedPrice;
    }
    if (marketAverage && marketAverage > 0) {
      return marketAverage;
    }
    return 0;
  }

  private signalPrice(signal: PrescriptionPriceSignal): number {
    return (
      signal.latestPrice ||
      signal.averagePrice ||
      signal.lowestPrice ||
      signal.highestPrice ||
      0
    );
  }
}

function scoreSignal(
  signal: PrescriptionPriceSignal,
  item: PrescriptionItemResult,
  city?: string,
): number {
  let score = 0;
  if (signal.productId && signal.productId === item.matchedProductId) {
    score += 3;
  }
  if (signal.canonicalProductId && signal.canonicalProductId === item.canonicalProductId) {
    score += 2.5;
  }
  if (signal.medicineSignature && signal.medicineSignature === item.medicineSignature) {
    score += 2;
  }
  if (city && signal.city && signal.city.trim().toLowerCase() === city) {
    score += 0.75;
  }
  score += signal.confidenceScore ?? 0.5;
  return score;
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function uniqueWarnings(items: PrescriptionItemResult[]): PrescriptionSafetyWarning[] {
  const warnings = new Set<PrescriptionItemResult["safetyWarnings"][number]>();
  for (const item of items) {
    for (const warning of item.safetyWarnings) {
      warnings.add(warning);
    }
  }
  return Array.from(warnings);
}
