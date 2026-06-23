import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../../../database/prisma.service";

@ApiTags("Canonical Products")
@Controller("canonical-products")
export class CanonicalProductsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(":id")
  @ApiOperation({ summary: "Get canonical product by ID" })
  @ApiParam({ name: "id", description: "Canonical Product ID" })
  @ApiOkResponse({ description: "Canonical product details returned successfully." })
  async getCanonicalProduct(@Param("id") id: string): Promise<any> {
    return this.prisma.canonicalProduct.findUnique({
      where: { id, deletedAt: null },
      include: {
        aliases: true,
        matches: {
          include: { sourceProduct: true },
        },
        product: true,
      },
    });
  }

  @Get()
  @ApiOperation({ summary: "List canonical products with filtering" })
  @ApiOkResponse({ description: "Canonical products list returned successfully." })
  async listCanonicalProducts(
    @Query("brand") brand?: string,
    @Query("generic") generic?: string,
    @Query("manufacturer") manufacturer?: string,
    @Query("signature") signature?: string,
    @Query("limit") limit = 50,
  ) {
    const where = {
      deletedAt: null,
      ...(brand ? { normalizedBrand: { contains: brand.toLowerCase() } } : {}),
      ...(generic ? { normalizedGeneric: { contains: generic.toLowerCase() } } : {}),
      ...(manufacturer ? { normalizedManufacturer: { contains: manufacturer.toLowerCase() } } : {}),
      ...(signature ? { medicineSignature: { contains: signature.toLowerCase() } } : {}),
    };

    return this.prisma.canonicalProduct.findMany({
      where,
      include: { aliases: true },
      take: Number(limit),
    });
  }
}