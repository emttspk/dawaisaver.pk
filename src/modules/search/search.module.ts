import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { AlternativesController } from "./controllers/alternatives.controller";
import { AutocompleteController } from "./controllers/autocomplete.controller";
import { SearchController } from "./controllers/search.controller";
import { AlternativeSearchService } from "./alternative-search.service";
import { AutocompleteService } from "./autocomplete.service";
import { GenericSearchService } from "./generic-search.service";
import { ProductSearchService } from "./product-search.service";
import { SearchRankingService } from "./search-ranking.service";
import { SearchService } from "./search.service";

@Module({
  imports: [DatabaseModule],
  controllers: [SearchController, AutocompleteController, AlternativesController],
})
export class SearchModule {
  static createService(): SearchService {
    const ranking = new SearchRankingService();
    return new SearchService(
      new ProductSearchService(ranking),
      new GenericSearchService(),
      new AutocompleteService(),
      new AlternativeSearchService(),
    );
  }
}

export * from "./alternative-search.service";
export * from "./autocomplete.service";
export * from "./generic-search.service";
export * from "./product-search.service";
export * from "./search-ranking.service";
export * from "./search.service";
export * from "./search.types";
