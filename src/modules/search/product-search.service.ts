import { SearchRankingService } from "./search-ranking.service";
import {
  SearchableProduct,
  SearchPopularitySignal,
  SearchQuery,
  SearchResultDto,
} from "./search.types";

export class ProductSearchService {
  constructor(private readonly ranking = new SearchRankingService()) {}

  searchProducts(
    query: SearchQuery,
    products: SearchableProduct[],
    popularity: SearchPopularitySignal[] = [],
  ): SearchResultDto[] {
    const cityFiltered = query.city
      ? products.filter((product) => !product.city || product.city.toLowerCase() === query.city?.toLowerCase())
      : products;

    return this.ranking.rankProducts(query, cityFiltered, popularity);
  }
}

