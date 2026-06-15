import { Controller, Get, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../../../database/prisma.service";
import { SearchService } from "../search.service";
import { AutocompleteRequestDto } from "../dto/search-requests.dto";
import { loadSearchableProducts, loadSearchPopularity, loadSearchSynonyms } from "../search.data-access";

@ApiTags("Search")
@Controller("search")
export class AutocompleteController {
  private readonly search = new SearchService();

  constructor(private readonly prisma: PrismaService) {}

  @Get("autocomplete")
  @ApiOperation({ summary: "Return autocomplete suggestions." })
  @ApiOkResponse({ description: "Autocomplete suggestions returned successfully." })
  async autocomplete(@Query() query: AutocompleteRequestDto) {
    const products = await loadSearchableProducts(this.prisma, query.city);
    const synonyms = await loadSearchSynonyms(this.prisma);
    const popularity = await loadSearchPopularity(this.prisma, query.city);
    return this.search.autocomplete({ q: query.q, city: query.city, limit: query.limit }, products, synonyms, popularity);
  }
}
