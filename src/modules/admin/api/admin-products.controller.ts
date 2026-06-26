import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Query, ParseUUIDPipe } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam } from "@nestjs/swagger";
import { PrismaService } from "../../../database/prisma.service";
import { RecordStatus, Prisma } from "@prisma/client";

@ApiTags("Admin Products")
@Controller("admin/products")
export class AdminProductsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "List all products for admin with pagination" })
  async listProducts(
    @Query("status") status?: RecordStatus,
    @Query("limit") limit = 50,
    @Query("offset") offset = 0,
    @Query("search") search?: string,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder: "asc" | "desc" = "desc",
  ) {
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(status && { status }),
      ...(search && { brandName: { contains: search, mode: "insensitive" } }),
    };

    const validSortFields = ["createdAt", "updatedAt", "brandName", "registrationNumber"];
    const orderByField = validSortFields.includes(sortBy || "") ? (sortBy as keyof Prisma.ProductOrderByWithRelationInput) : "createdAt";

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { manufacturer: true },
        take: Number(limit),
        skip: Number(offset),
        orderBy: { [orderByField]: sortOrder },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total, limit: Number(limit), offset: Number(offset) };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get product by ID with full details" })
  @ApiParam({ name: "id" })
  async getProduct(@Param("id", ParseUUIDPipe) id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id, deletedAt: null },
      include: {
        manufacturer: true,
        compositions: { 
          include: { generic: true },
        },
        prices: true,
        packs: true,
        canonicalProduct: {
          include: { aliases: true },
        },
      },
    });

    if (!product) return null;

    const compositions = product.compositions || [];
    return {
      id: product.id,
      brandName: product.brandName,
      normalizedBrand: product.normalizedBrand,
      displayName: product.displayName,
      dosageForm: product.dosageForm,
      normalizedForm: product.normalizedForm,
      strengthText: product.strengthText,
      packSize: product.packSize,
      registrationNumber: product.registrationNumber,
      signature: product.signature,
      status: product.status,
      confidenceScore: product.confidenceScore,
      sourceType: product.sourceType,
      sourceUrl: product.sourceUrl,
      metadata: product.metadata,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      manufacturer: product.manufacturer,
      compositions: compositions,
      prices: product.prices,
      packs: product.packs,
      canonicalProduct: product.canonicalProduct,
      genericName: compositions
        .map((c: any) => c.generic?.name)
        .filter((v: any) => Boolean(v))
        .join(" + "),
    };
  }

  @Patch(":id/publish")
  @ApiOperation({ summary: "Publish product" })
  publishProduct(@Param("id", ParseUUIDPipe) id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { status: "ACTIVE" },
    });
  }

  @Patch(":id/unpublish")
  @ApiOperation({ summary: "Unpublish product" })
  unpublishProduct(@Param("id", ParseUUIDPipe) id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { status: "INACTIVE" },
    });
  }

  @Delete(":id/archive")
  @ApiOperation({ summary: "Archive product" })
  archiveProduct(@Param("id", ParseUUIDPipe) id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  @Post()
  @ApiOperation({ summary: "Create new product" })
  createProduct(@Body() data: any) {
    return this.prisma.product.create({ data: { ...data, status: "PENDING_REVIEW" } });
  }
}