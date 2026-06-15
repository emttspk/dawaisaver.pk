import { SearchRankingService } from "./search-ranking.service";
import {
  AlternativeResultDto,
  SearchableProduct,
} from "./search.types";

export class AlternativeSearchService {
  private readonly ranking = new SearchRankingService();

  findAlternatives(productId: string, products: SearchableProduct[]): AlternativeResultDto | undefined {
    const product = products.find((item) => item.id === productId || item.canonicalProductId === productId);
    if (!product) {
      return undefined;
    }

    const equivalentBrands = products.filter((item) =>
      item.id !== product.id &&
      (item.medicineSignature === product.medicineSignature ||
        product.equivalentBrandIds?.includes(item.id) ||
        item.equivalentBrandIds?.includes(product.id)),
    );
    const rankedEquivalent = this.ranking.rankProducts(
      { q: product.medicineSignature || product.genericName || product.brandName, limit: 20 },
      equivalentBrands,
    );
    const canonical = this.ranking.rankProducts({ q: product.brandName, limit: 1 }, [product])[0];

    return {
      canonicalProduct: canonical,
      equivalentBrands: rankedEquivalent,
      priceStatistics: {
        lowestPrice: minDefined([product.lowestPrice, ...equivalentBrands.map((item) => item.lowestPrice)]),
        averagePrice: avgDefined([product.averagePrice, ...equivalentBrands.map((item) => item.averagePrice)]),
        highestPrice: maxDefined([product.averagePrice, ...equivalentBrands.map((item) => item.averagePrice)]),
      },
      availability: {
        availabilityScore: avgDefined([product.availabilityScore, ...equivalentBrands.map((item) => item.availabilityScore)]),
        city: product.city,
      },
      confidenceScore: product.confidenceScore || 0,
    };
  }
}

function minDefined(values: Array<number | undefined>): number | undefined {
  const filtered = values.filter((value): value is number => typeof value === "number");
  return filtered.length ? Math.min(...filtered) : undefined;
}

function maxDefined(values: Array<number | undefined>): number | undefined {
  const filtered = values.filter((value): value is number => typeof value === "number");
  return filtered.length ? Math.max(...filtered) : undefined;
}

function avgDefined(values: Array<number | undefined>): number | undefined {
  const filtered = values.filter((value): value is number => typeof value === "number");
  return filtered.length ? filtered.reduce((sum, value) => sum + value, 0) / filtered.length : undefined;
}

