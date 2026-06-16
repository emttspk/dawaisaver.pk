import {
  AlternativeResultDto,
  AutocompleteDto,
  SearchableProduct,
  SearchPopularitySignal,
  SearchQuery,
  SearchResultDto,
  SearchSynonym,
  TrendingResultDto,
} from "./search.types";
import { AlternativeSearchService } from "./alternative-search.service";
import { AutocompleteService } from "./autocomplete.service";
import { GenericSearchService } from "./generic-search.service";
import { ProductSearchService } from "./product-search.service";

export class SearchService {
  constructor(
    private readonly productSearch = new ProductSearchService(),
    private readonly genericSearch = new GenericSearchService(),
    private readonly autocompleteSearch = new AutocompleteService(),
    private readonly alternativeSearch = new AlternativeSearchService(),
  ) {}

  search(
    query: SearchQuery,
    products: SearchableProduct[],
    popularity: SearchPopularitySignal[] = [],
  ): SearchResultDto[] {
    return this.productSearch.searchProducts(query, products, popularity);
  }

  searchProducts(
    query: SearchQuery,
    products: SearchableProduct[],
    popularity: SearchPopularitySignal[] = [],
  ): SearchResultDto[] {
    return this.productSearch.searchProducts(query, products, popularity);
  }

  searchGenerics(query: SearchQuery, products: SearchableProduct[]): SearchResultDto[] {
    return this.genericSearch.searchGenerics(query, products);
  }

  autocomplete(
    query: SearchQuery,
    products: SearchableProduct[],
    synonyms: SearchSynonym[] = [],
    popularity: SearchPopularitySignal[] = [],
  ): AutocompleteDto[] {
    return this.autocompleteSearch.autocomplete(query, products, synonyms, popularity);
  }

  alternatives(productId: string, products: SearchableProduct[]): AlternativeResultDto | undefined {
    return this.alternativeSearch.findAlternatives(productId, products);
  }

  trending(popularity: SearchPopularitySignal[], limit = 20): TrendingResultDto[] {
    return popularity
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit)
      .map((item) => ({
        query: item.normalizedQuery,
        entityType: "product",
        searchCount: item.searchCount,
        trendingScore: item.trendingScore,
        city: item.city,
      }));
  }
}

export function normalizeSearchText(value?: string): string {
  return String(value || "")
    .toLowerCase()
    .replace(/\u00a0/g, " ")
    .replace(/[^a-z0-9%+\s_-]/g, " ")
    .replace(/[_+-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function similarity(query: string, value: string): number {
  if (!query || !value) {
    return 0;
  }
  if (query === value) {
    return 1;
  }
  if (value.startsWith(query)) {
    return 0.9;
  }
  if (value.includes(query)) {
    return 0.75;
  }

  const distance = levenshtein(query, value);
  return Math.max(0, 1 - distance / Math.max(query.length, value.length));
}

function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return matrix[a.length][b.length];
}
