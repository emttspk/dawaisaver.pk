import {
  SearchableProduct,
  SearchPopularitySignal,
  SearchQuery,
  SearchResultDto,
} from "./search.types";
import { normalizeSearchText, similarity } from "./search.service";

export class SearchRankingService {
  rankProducts(
    query: SearchQuery,
    products: SearchableProduct[],
    popularity: SearchPopularitySignal[] = [],
  ): SearchResultDto[] {
    const normalizedQuery = normalizeSearchText(query.q);

    return products
      .map((product) => this.scoreProduct(normalizedQuery, product, popularity))
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, query.limit || 20);
  }

  private scoreProduct(
    normalizedQuery: string,
    product: SearchableProduct,
    popularity: SearchPopularitySignal[],
  ): SearchResultDto {
    const brand = normalizeSearchText(product.brandName);
    const generic = normalizeSearchText(product.genericName);
    const manufacturer = normalizeSearchText(product.manufacturer);
    const signature = normalizeSearchText(product.medicineSignature);
    const registration = normalizeSearchText(product.registrationNumber);
    const popularityScore = product.popularityScore ?? popularity.find(
      (item) => item.normalizedQuery === brand || item.normalizedQuery === generic,
    )?.trendingScore ?? 0;

    const rankingFactors = {
      exactBrandMatch: brand === normalizedQuery ? 1 : 0,
      exactGenericMatch: generic === normalizedQuery ? 1 : 0,
      medicineSignatureMatch: signature === normalizedQuery ? 1 : 0,
      registrationNumberMatch: registration === normalizedQuery ? 1 : 0,
      textSimilarity: Math.max(
        similarity(normalizedQuery, brand),
        similarity(normalizedQuery, generic),
        similarity(normalizedQuery, manufacturer),
        similarity(normalizedQuery, signature),
        similarity(normalizedQuery, registration),
      ),
      popularityScore: clamp(popularityScore / 100),
      confidenceScore: product.confidenceScore ?? 0,
      availabilityScore: product.availabilityScore ?? 0,
      priceIntelligenceScore: product.priceIntelligenceScore ?? 0,
    };

    const score =
      rankingFactors.exactBrandMatch * 0.22 +
      rankingFactors.exactGenericMatch * 0.18 +
      rankingFactors.medicineSignatureMatch * 0.18 +
      rankingFactors.registrationNumberMatch * 0.1 +
      rankingFactors.textSimilarity * 0.12 +
      rankingFactors.popularityScore * 0.07 +
      rankingFactors.confidenceScore * 0.06 +
      rankingFactors.availabilityScore * 0.04 +
      rankingFactors.priceIntelligenceScore * 0.03;

    return {
      id: product.id,
      canonicalProductId: product.canonicalProductId,
      brandName: product.brandName,
      genericName: product.genericName,
      manufacturer: product.manufacturer,
      medicineSignature: product.medicineSignature,
      registrationNumber: product.registrationNumber,
      score: round(score),
      rankingFactors,
      confidenceScore: product.confidenceScore,
      availabilityScore: product.availabilityScore,
      lowestPrice: product.lowestPrice,
      averagePrice: product.averagePrice,
    };
  }
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function round(value: number): number {
  return Math.round(value * 10000) / 10000;
}

