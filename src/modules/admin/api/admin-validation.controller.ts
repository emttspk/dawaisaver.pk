import { Controller, Get, Post, Patch, Param, Query, ParseUUIDPipe } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { PrismaService } from "../../../database/prisma.service";

@ApiTags("Admin Validation")
@Controller("admin/validation")
export class AdminValidationController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("ingredient-review")
  @ApiOperation({ summary: "Get ingredient review queue" })
  getIngredientReviewQueue(@Query("limit") limit = 50) {
    return this.prisma.ingredientReviewQueue.findMany({
      where: { reviewStatus: { in: ["PENDING_AI", "PENDING"] } },
      orderBy: { createdAt: "asc" },
      take: Number(limit),
    });
  }

  @Get("products")
  @ApiOperation({ summary: "Get product review queue" })
  getProductReviewQueue(@Query("limit") limit = 50) {
    return this.prisma.product.findMany({
      where: { status: "PENDING_REVIEW" },
      orderBy: { createdAt: "asc" },
      take: Number(limit),
    });
  }

  @Get("manufacturers")
  @ApiOperation({ summary: "Get manufacturer review queue" })
  getManufacturerReviewQueue(@Query("limit") limit = 50) {
    return this.prisma.manufacturer.findMany({
      where: { status: "PENDING_REVIEW" },
      orderBy: { createdAt: "asc" },
      take: Number(limit),
    });
  }

  @Get("prices")
  @ApiOperation({ summary: "Get price review queue" })
  getPriceReviewQueue(@Query("limit") limit = 50) {
    return this.prisma.verifiedPrice.findMany({
      where: { verificationStatus: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: Number(limit),
    });
  }

  @Get("ownership-claims")
  @ApiOperation({ summary: "Get ownership claims queue" })
  getOwnershipClaims(@Query("limit") limit = 50) {
    return this.prisma.verificationClaim.findMany({
      where: { status: "PENDING_REVIEW" },
      orderBy: { createdAt: "asc" },
      take: Number(limit),
    });
  }
}