import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../../../database/prisma.service";

@ApiTags("Products")
@Controller("products")
export class ProductsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(":id")
  @ApiOperation({ summary: "Get product by ID" })
  @ApiParam({ name: "id", description: "Product ID" })
  @ApiOkResponse({ description: "Product details returned successfully." })
  async getProduct(@Param("id") id: string): Promise<any> {
    return this.prisma.product.findUnique({
      where: { id, deletedAt: null },
      include: {
        manufacturer: true,
        compositions: {
          include: { generic: true },
          orderBy: { ingredientOrder: "asc" },
        },
        productMatches: {
          where: { matchStatus: "MATCHED" },
          include: { canonicalProduct: true },
        },
        canonicalProduct: true,
      },
    });
  }

  @Get()
  @ApiOperation({ summary: "List products with filtering" })
  @ApiOkResponse({ description: "Products list returned successfully." })
  async listProducts(
    @Query("brand") brand?: string,
    @Query("generic") generic?: string,
    @Query("manufacturer") manufacturer?: string,
    @Query("dosageForm") dosageForm?: string,
    @Query("strength") strength?: string,
    @Query("limit") limit = 50,
  ) {
    const where = {
      deletedAt: null,
      ...(brand ? { normalizedBrand: { contains: brand.toLowerCase() } } : {}),
      ...(generic ? { compositions: { some: { generic: { normalizedName: { contains: generic.toLowerCase() } } } } } : {}),
      ...(manufacturer ? { manufacturer: { normalizedName: { contains: manufacturer.toLowerCase() } } } : {}),
      ...(dosageForm ? { normalizedForm: { contains: dosageForm.toLowerCase() } } : {}),
      ...(strength ? { strengthText: { contains: strength } } : {}),
    };

    return this.prisma.product.findMany({
      where,
      include: {
        manufacturer: true,
        compositions: {
          include: { generic: true },
          orderBy: { ingredientOrder: "asc" },
        },
      },
      take: Number(limit),
    });
  }
}