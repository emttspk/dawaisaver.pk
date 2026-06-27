import { PrismaService } from "../../database/prisma.service";
import { SearchableProduct, SearchPopularitySignal, SearchSynonym } from "./search.types";

export async function loadSearchableProducts(
  prisma: PrismaService,
  city?: string,
  limit = 100,
): Promise<SearchableProduct[]> {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    take: limit,
    select: {
      id: true,
      brandName: true,
      normalizedBrand: true,
      displayName: true,
      dosageForm: true,
      normalizedForm: true,
      strengthText: true,
      packSize: true,
      registrationNumber: true,
      signature: true,
      confidenceScore: true,
      sourceType: true,
      createdAt: true,
      manufacturer: {
        select: { name: true },
      },
      compositions: {
        select: {
          ingredientOrder: true,
          generic: { select: { name: true } },
        },
        orderBy: { ingredientOrder: "asc" },
      },
      canonicalProduct: {
        select: {
          id: true,
          medicineSignature: true,
          aliases: { select: { aliasValue: true } },
        },
      },
      productMatches: {
        where: { matchStatus: "MATCHED" },
        select: { canonicalProductId: true },
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
    availabilityScore: 0,
    priceIntelligenceScore: 0,
    lowestPrice: 0,
    averagePrice: 0,
    city: undefined,
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
