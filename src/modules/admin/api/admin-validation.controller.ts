import { Controller, Get, Patch, Param, Query, ParseUUIDPipe, Body } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { PrismaService } from "../../../database/prisma.service";

type CanonicalReviewQuery = {
  search?: string;
  ingredientCount?: string;
  dosageForm?: string;
  route?: string;
  strengthFilter?: string;
  manufacturer?: string;
  applicant?: string;
  approvalStatus?: string;
  limit?: string;
  offset?: string;
};

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

  @Get("canonical-medicines")
  @ApiOperation({ summary: "Get canonical medicines for review" })
  async getCanonicalMedicinesForReview(@Query() query: CanonicalReviewQuery) {
    const limit = clampInt(query.limit, 50, 1, 200);
    const offset = clampInt(query.offset, 0, 0, 1_000_000);

    const where: any = {
      deletedAt: null,
      ...(query.approvalStatus ? { status: query.approvalStatus } : {}),
    };

    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { canonicalName: { contains: search, mode: "insensitive" } },
        { medicineSignature: { contains: search, mode: "insensitive" } },
        { normalizedGeneric: { contains: search, mode: "insensitive" } },
        { normalizedBrand: { contains: search, mode: "insensitive" } },
      ];
    }

    if (query.dosageForm) {
      where.normalizedDosageForm = { contains: query.dosageForm, mode: "insensitive" };
    }

    const [total, items] = await Promise.all([
      this.prisma.canonicalProduct.count({ where }),
      this.prisma.canonicalProduct.findMany({
        where,
        include: {
          product: {
            include: {
              manufacturer: true,
              packs: true,
              compositions: { include: { generic: true } },
              therapeuticCategories: { include: { category: true } },
            },
          },
          aliases: true,
          reviews: { include: { reviewer: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
    ]);

    const enrichedItems = items.map((item) => ({
      ...item,
      ingredientCount: (item as any).product?.compositions?.length ?? 0,
      brandName: (item as any).product?.brandName ?? null,
      manufacturerName: (item as any).product?.manufacturer?.name ?? null,
    }));

    return {
      items: enrichedItems,
      total,
      limit,
      offset,
    };
  }

  @Get("canonical-medicines/:id")
  @ApiOperation({ summary: "Get canonical medicine detail" })
  async getCanonicalMedicineDetail(@Param("id", ParseUUIDPipe) id: string) {
    const canonical = await this.prisma.canonicalProduct.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            manufacturer: true,
            packs: true,
            compositions: { include: { generic: true } },
            therapeuticCategories: { include: { category: true } },
          },
        },
        aliases: true,
        matches: true,
        reviews: { include: { reviewer: true } },
      },
    });

    if (!canonical) {
      return null;
    }

    const product = (canonical as any).product;

    const linkedBrands = await this.prisma.product.findMany({
      where: {
        deletedAt: null,
        compositions: {
          some: {
            generic: {
              normalizedName: { in: product?.compositions?.map((c: any) => c.generic?.normalizedName) ?? [] },
            },
          },
        },
        OR: [
          { normalizedForm: product?.normalizedForm ?? undefined },
          { dosageForm: product?.dosageForm ?? undefined },
        ],
      },
      include: { manufacturer: true },
      take: 100,
    });

    const linkedRegistrations = product?.registrationNumber ? [product.registrationNumber] : [];

    const auditHistory = await this.prisma.auditLog.findMany({
      where: {
        entityType: "CanonicalProduct",
        entityId: id,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return {
      ...canonical,
      linkedBrands,
      linkedRegistrations,
      auditHistory,
      ingredientCount: product?.compositions?.length ?? 0,
    };
  }

  @Patch("canonical-medicines/:id/review")
  @ApiOperation({ summary: "Update canonical medicine review status" })
  async updateCanonicalReview(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: { reviewStatus: string; reviewerNotes?: string; reviewerId?: string },
  ) {
    const { reviewStatus, reviewerNotes, reviewerId } = body;

    const updated = await this.prisma.canonicalProduct.update({
      where: { id },
      data: {
        status: reviewStatus as any,
        ...(reviewerNotes ? { metadata: { ...(await this.getMetadata(id)), reviewerNotes } } : {}),
      },
    });

    if (reviewerId) {
      const match = await this.prisma.productMatch.findFirst({
        where: { canonicalProductId: id },
      });

      if (match) {
        await this.prisma.matchReview.create({
          data: {
            productMatchId: match.id,
            canonicalProductId: id,
            reviewerUserId: reviewerId,
            reviewStatus: reviewStatus as any,
            reviewNotes: reviewerNotes,
          },
        });
      }
    }

    await this.prisma.auditLog.create({
      data: {
        action: "REVIEW",
        entityType: "CanonicalProduct",
        entityId: id,
        reason: `Review status updated to ${reviewStatus}`,
        ...(reviewerNotes ? { metadata: { reviewerNotes } } : {}),
      },
    });

    return updated;
  }

  private async getMetadata(id: string): Promise<Record<string, unknown>> {
    const canonical = await this.prisma.canonicalProduct.findUnique({
      where: { id },
      select: { metadata: true },
    });
    return (canonical?.metadata as Record<string, unknown>) ?? {};
  }
}

function clampInt(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(String(value ?? fallback), 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}