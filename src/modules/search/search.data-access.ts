import { PrismaService } from "../../database/prisma.service";
import { SearchableProduct, SearchPopularitySignal, SearchSynonym } from "./search.types";

export async function loadSearchableProducts(
  prisma: PrismaService,
  city?: string,
): Promise<SearchableProduct[]> {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    include: {
      manufacturer: true,
      compositions: {
        include: {
          generic: true,
        },
        orderBy: {
          ingredientOrder: "asc",
        },
      },
      priceStatistics: {
        orderBy: {
          calculatedAt: "desc",
        },
        take: 1,
      },
      cityPriceStatistics: {
        orderBy: {
          calculatedAt: "desc",
        },
        take: 1,
      },
      marketSignals: {
        orderBy: {
          calculatedAt: "desc",
        },
        take: 1,
      },
      availability: {
        orderBy: {
          capturedAt: "desc",
        },
        take: 1,
      },
      canonicalProduct: {
        include: {
          aliases: true,
        },
      },
      productMatches: {
        where: {
          matchStatus: "MATCHED" as any,
        },
        select: {
          canonicalProductId: true,
        },
      },
    },
  });

  return products
    .map((product: any) => mapSearchableProduct(product))
    .filter((product) => !city || !product.city || product.city.toLowerCase() === city.toLowerCase());
}

export async function loadSearchPopularity(
  prisma: PrismaService,
  city?: string,
  limit = 50,
): Promise<SearchPopularitySignal[]> {
  const rows = await prisma.searchPopularity.findMany({
    where: {
      ...(city ? { city } : {}),
    },
    orderBy: {
      trendingScore: "desc",
    },
    take: limit,
  });

  return rows.map((row: any) => ({
    normalizedQuery: row.normalizedQuery,
    searchCount: row.searchCount,
    trendingScore: toNumber(row.trendingScore),
    city: row.city || undefined,
  }));
}

export async function loadSearchSynonyms(prisma: PrismaService): Promise<SearchSynonym[]> {
  const rows = await prisma.searchSynonym.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  return rows.map((row: any) => ({
    term: row.term,
    synonym: row.synonym,
  }));
}

export async function recordSearchLog(
  prisma: PrismaService,
  query: string,
  city: string | undefined,
  resultCount: number,
  route = "/api/search",
): Promise<void> {
  await prisma.searchLog.create({
    data: {
      query,
      normalizedQuery: query.toLowerCase(),
      city,
      resultCount,
      sourceType: "SYSTEM",
      metadata: {
        route,
      },
    },
  });
}

export function mapSearchableProduct(product: any): SearchableProduct {
  const priceStatistic = product.priceStatistics[0];
  const cityStatistic = product.cityPriceStatistics[0];
  const signal = product.marketSignals[0];
  const availability = product.availability[0];
  const canonical = product.canonicalProduct;
  const genericName =
    product.compositions
      .map((composition: any) => composition.generic?.name)
      .filter((value: any): value is string => Boolean(value))
      .join(" + ") || undefined;

  return {
    id: product.id,
    canonicalProductId: canonical?.id,
    brandName: product.brandName,
    genericName,
    manufacturer: product.manufacturer?.name,
    dosageForm: product.dosageForm || product.normalizedForm || undefined,
    strength: product.strengthText || undefined,
    packSize: product.packSize || undefined,
    registrationNumber: product.registrationNumber || undefined,
    medicineSignature: canonical?.medicineSignature || product.signature || undefined,
    confidenceScore: toNumber(product.confidenceScore ?? canonical?.confidenceScore),
    availabilityScore: toNumber(
      priceStatistic?.availabilityScore ?? cityStatistic?.availabilityPercentage ?? availability?.confidenceScore,
    ),
    priceIntelligenceScore: toNumber(signal?.priceStabilityScore ?? signal?.confidenceScore ?? priceStatistic?.confidenceScore),
    lowestPrice: toNumber(priceStatistic?.lowestPrice ?? cityStatistic?.lowestObservedPrice),
    averagePrice: toNumber(priceStatistic?.averagePrice ?? cityStatistic?.averagePrice),
    city: cityStatistic?.city ?? availability?.city ?? undefined,
    aliases: canonical?.aliases.map((alias: any) => alias.aliasValue) ?? [],
    equivalentBrandIds: product.productMatches
      .map((match: any) => match.canonicalProductId || undefined)
      .filter((value: any): value is string => Boolean(value)),
  };
}

export function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "bigint") {
    return Number(value);
  }
  if (value && typeof value === "object" && "toString" in value) {
    return Number(String(value));
  }
  return 0;
}
