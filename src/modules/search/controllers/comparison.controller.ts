import { Controller, Get, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../../../database/prisma.service";

interface ComparisonItem {
  id: string;
  brandName: string;
  manufacturer?: string;
  packSize: string | null;
  price?: number | null;
  strength?: string | null;
  dosageForm?: string | null;
  savings?: number;
}

@ApiTags("Comparison")
@Controller("compare")
export class ComparisonController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("brands")
  @ApiOperation({ summary: "Compare brands by medicine signature or product IDs" })
  @ApiOkResponse({ description: "Brand comparison results returned successfully." })
  async compareBrands(
    @Query("signature") signature?: string,
    @Query("productId") productId?: string,
    @Query("limit") limit = 20,
  ) {
    if (!signature && !productId) {
      return { error: "Provide signature or productId parameter" };
    }

    const allProducts = signature
      ? await this.prisma.product.findMany({
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
            compositions: { include: { generic: true } },
          },
          take: Number(limit),
        })
      : productId
      ? await this.prisma.product.findMany({
          where: {
            productMatches: { some: { canonicalProduct: { id: productId } } },
          },
          include: {
            manufacturer: true,
            compositions: { include: { generic: true } },
          },
          take: Number(limit),
        })
      : [];

    const prices = await this.prisma.productPrice.findMany({
      where: { productId: { in: allProducts.map(p => p.id) } },
    });

    const priceMap = new Map(prices.map(p => [p.productId, Number(p.price)]));

    const comparison: ComparisonItem[] = allProducts.map(p => ({
      id: p.id,
      brandName: p.brandName,
      manufacturer: p.manufacturer?.name,
      packSize: p.packSize,
      price: priceMap.get(p.id),
      strength: p.strengthText,
      dosageForm: p.normalizedForm,
    }));

    const pricesArr = comparison.map(c => c.price || Infinity);
    const minPrice = Math.min(...pricesArr);

    comparison.forEach(c => {
      if (c.price && minPrice > 0 && isFinite(minPrice)) {
        c.savings = ((c.price - minPrice) / c.price) * 100;
      }
    });

    comparison.sort((a, b) => (a.price || Infinity) - (b.price || Infinity));

    return {
      products: comparison,
      cheapestBrand: comparison[0]?.brandName,
      potentialSavings: comparison.length > 1 ? comparison[comparison.length - 1]?.savings || 0 : 0,
    };
  }
}