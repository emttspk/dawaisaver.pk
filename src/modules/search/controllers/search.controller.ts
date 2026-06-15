import { Controller, Get, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../../../database/prisma.service";
import { SearchService } from "../search.service";
import { AutocompleteRequestDto, SearchRequestDto, TrendingRequestDto } from "../dto/search-requests.dto";
import { loadSearchableProducts, loadSearchPopularity, loadSearchSynonyms, recordSearchLog } from "../search.data-access";

@ApiTags("Search")
@Controller("search")
export class SearchController {
  private readonly search = new SearchService();

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "Search canonical medicines." })
  @ApiOkResponse({ description: "Search results returned successfully." })
  async searchAll(@Query() query: SearchRequestDto) {
    const products = await loadSearchableProducts(this.prisma, query.city);
    const popularity = await loadSearchPopularity(this.prisma, query.city);
    await recordSearchLog(this.prisma, query.q, query.city, products.length);
    return this.search.search({ q: query.q, city: query.city, limit: query.limit }, products, popularity);
  }

  @Get("products")
  @ApiOperation({ summary: "Search products." })
  @ApiOkResponse({ description: "Product search results returned successfully." })
  async searchProducts(@Query() query: SearchRequestDto) {
    const products = await loadSearchableProducts(this.prisma, query.city);
    const popularity = await loadSearchPopularity(this.prisma, query.city);
    await recordSearchLog(this.prisma, query.q, query.city, products.length, "/api/search/products");
    return this.search.searchProducts({ q: query.q, city: query.city, limit: query.limit }, products, popularity);
  }

  @Get("generics")
  @ApiOperation({ summary: "Search generics." })
  @ApiOkResponse({ description: "Generic search results returned successfully." })
  async searchGenerics(@Query() query: SearchRequestDto) {
    const products = await loadSearchableProducts(this.prisma, query.city);
    await recordSearchLog(this.prisma, query.q, query.city, products.length, "/api/search/generics");
    return this.search.searchGenerics({ q: query.q, city: query.city, limit: query.limit }, products);
  }

  @Get("autocomplete")
  @ApiOperation({ summary: "Return search autocomplete suggestions." })
  @ApiOkResponse({ description: "Autocomplete suggestions returned successfully." })
  async autocomplete(@Query() query: AutocompleteRequestDto) {
    const products = await loadSearchableProducts(this.prisma, query.city);
    const synonyms = await loadSearchSynonyms(this.prisma);
    const popularity = await loadSearchPopularity(this.prisma, query.city);
    return this.search.autocomplete({ q: query.q, city: query.city, limit: query.limit }, products, synonyms, popularity);
  }

  @Get("trending")
  @ApiOperation({ summary: "Return trending search signals." })
  @ApiOkResponse({ description: "Trending signals returned successfully." })
  async trending(@Query() query: TrendingRequestDto) {
    const popularity = await loadSearchPopularity(this.prisma, query.city, query.limit || 20);
    return this.search.trending(popularity, query.limit || 20);
  }
}
