import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../../../database/prisma.service";
import { loadSearchableProducts, loadSearchPopularity, loadSearchSynonyms } from "../../search/search.data-access";
import { SearchModule } from "../../search/search.module";

@ApiTags("Admin Search & Comparison")
@Controller("admin/search")
export class AdminSearchController {
  private readonly search = SearchModule.createService();

  constructor(private readonly prisma: PrismaService) {}

  @Get("medicine")
  @ApiOperation({ summary: "Admin medicine search" })
  async adminMedicineSearch(@Query("q") q: string, @Query("limit") limit = 20) {
    const products = await loadSearchableProducts(this.prisma);
    const popularity = await loadSearchPopularity(this.prisma);
    return this.search.search({ q, limit }, products, popularity);
  }

  @Get("products")
  @ApiOperation({ summary: "Admin product search" })
  async adminProductSearch(@Query("q") q: string, @Query("limit") limit = 20) {
    const products = await loadSearchableProducts(this.prisma);
    const popularity = await loadSearchPopularity(this.prisma);
    return this.search.searchProducts({ q, limit }, products, popularity);
  }

  @Get("generics")
  @ApiOperation({ summary: "Admin generic search" })
  async adminGenericSearch(@Query("q") q: string, @Query("limit") limit = 20) {
    const products = await loadSearchableProducts(this.prisma);
    return this.search.searchGenerics({ q, limit }, products);
  }

  @Get("autocomplete")
  @ApiOperation({ summary: "Admin autocomplete tester" })
  async adminAutocomplete(@Query("q") q: string, @Query("limit") limit = 10) {
    const products = await loadSearchableProducts(this.prisma);
    const synonyms = await loadSearchSynonyms(this.prisma);
    const popularity = await loadSearchPopularity(this.prisma);
    return this.search.autocomplete({ q, limit }, products, synonyms, popularity);
  }

  @Get("compare")
  @ApiOperation({ summary: "Admin brand comparison" })
  async adminCompare(@Query("signature") signature?: string) {
    if (!signature) return { error: "Provide signature parameter" };
    
    const products = await this.prisma.product.findMany({
      where: {
        productMatches: {
          some: {
            canonicalProduct: {
              medicineSignature: { contains: signature.toLowerCase() },
            },
          },
        },
      },
      include: {
        manufacturer: true,
        productMatches: { include: { canonicalProduct: true } },
      },
    });

    return products.map(p => ({
      id: p.id,
      brandName: p.brandName,
      manufacturer: p.manufacturer?.name,
      canonicalMatch: p.productMatches[0]?.canonicalProduct?.medicineSignature,
    }));
  }

  @Get("alternatives")
  @ApiOperation({ summary: "Admin alternatives lookup" })
  async adminAlternatives(@Query("id") id: string) {
    if (!id) return { error: "Provide product id" };
    
    const products = await loadSearchableProducts(this.prisma);
    return this.search.alternatives(id, products);
  }
}