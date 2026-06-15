import { Controller, Get, Param } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../../../database/prisma.service";
import { SearchService } from "../search.service";
import { AlternativeParamsDto } from "../dto/search-requests.dto";
import { loadSearchableProducts } from "../search.data-access";

@ApiTags("Search")
@Controller("search")
export class AlternativesController {
  private readonly search = new SearchService();

  constructor(private readonly prisma: PrismaService) {}

  @Get("alternatives/:id")
  @ApiOperation({ summary: "Return equivalent medicine alternatives." })
  @ApiParam({ name: "id", description: "Product ID" })
  @ApiOkResponse({ description: "Alternative results returned successfully." })
  async alternatives(@Param() params: AlternativeParamsDto) {
    const products = await loadSearchableProducts(this.prisma);
    return this.search.alternatives(params.id, products);
  }
}
