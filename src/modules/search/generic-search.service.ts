import { SearchRankingService } from "./search-ranking.service";
import {
  SearchableProduct,
  SearchQuery,
  SearchResultDto,
} from "./search.types";

export class GenericSearchService {
  private readonly ranking = new SearchRankingService();

  searchGenerics(query: SearchQuery, products: SearchableProduct[]): SearchResultDto[] {
    return this.ranking.rankProducts(query, products.filter((product) => product.genericName), []);
  }
}

