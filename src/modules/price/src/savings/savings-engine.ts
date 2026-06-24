import { ProductPrice, PriceSnapshot, Product } from "@prisma/client";

export interface SavingsCalculationInput {
  productId: string;
  currentPrice: number;
  city?: string;
  equivalentProductIds: string[];
}

export interface SavingsResult {
  productId: string;
  currentPrice: number;
  cheapestEquivalentPrice: number | null;
  savingAmount: number | null;
  savingPercent: number | null;
  equivalentProducts: {
    productId: string;
    price: number;
    brandName: string;
  }[];
}

export class SavingsEngine {
  async calculateSavings(input: SavingsCalculationInput): Promise<SavingsResult> {
    const { productId, currentPrice, equivalentProductIds } = input;

    const equivalentPrices = await this.getEquivalentPrices(equivalentProductIds);

    const validPrices = equivalentPrices.filter((p) => p.price > 0);
    const cheapestPrice = validPrices.length > 0
      ? Math.min(...validPrices.map((p) => p.price))
      : null;

    let savingAmount: number | null = null;
    let savingPercent: number | null = null;

    if (cheapestPrice !== null && currentPrice > 0) {
      savingAmount = currentPrice - cheapestPrice;
      savingPercent = (savingAmount / currentPrice) * 100;
    }

    return {
      productId,
      currentPrice,
      cheapestEquivalentPrice: cheapestPrice,
      savingAmount,
      savingPercent,
      equivalentProducts: validPrices,
    };
  }

  async calculateBulkSavings(
    products: { productId: string; currentPrice: number; equivalentProductIds: string[] }[],
    allPrices: Map<string, number>,
  ): Promise<SavingsResult[]> {
    return Promise.all(
      products.map((p) => {
        const equivalentPrices: { productId: string; price: number; brandName: string }[] = [];
        for (const eqId of p.equivalentProductIds) {
          const price = allPrices.get(eqId);
          if (price !== undefined) {
            equivalentPrices.push({ productId: eqId, price, brandName: "" });
          }
        }

        const validPrices = equivalentPrices.filter((p) => p.price > 0);
        const cheapestPrice = validPrices.length > 0
          ? Math.min(...validPrices.map((p) => p.price))
          : null;

        let savingAmount: number | null = null;
        let savingPercent: number | null = null;

        if (cheapestPrice !== null && p.currentPrice > 0) {
          savingAmount = p.currentPrice - cheapestPrice;
          savingPercent = (savingAmount / p.currentPrice) * 100;
        }

        return {
          productId: p.productId,
          currentPrice: p.currentPrice,
          cheapestEquivalentPrice: cheapestPrice,
          savingAmount,
          savingPercent,
          equivalentProducts: validPrices,
        };
      }),
    );
  }

  private async getEquivalentPrices(productIds: string[]): Promise<{ productId: string; price: number; brandName: string }[]> {
    return [];
  }
}

export const savingsEngine = new SavingsEngine();