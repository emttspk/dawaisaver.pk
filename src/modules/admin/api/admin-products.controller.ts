import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Query, ParseUUIDPipe } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam } from "@nestjs/swagger";
import { PrismaService } from "../../../database/prisma.service";
import { RecordStatus } from "@prisma/client";

@ApiTags("Admin Products")
@Controller("admin/products")
export class AdminProductsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "List all products for admin" })
  listProducts(
    @Query("status") status?: RecordStatus,
    @Query("limit") limit = 50,
    @Query("search") search?: string,
  ) {
    return this.prisma.product.findMany({
      where: {
        deletedAt: null,
        ...(status && { status }),
        ...(search && { brandName: { contains: search, mode: "insensitive" } }),
      },
      include: { manufacturer: true },
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get product by ID" })
  @ApiParam({ name: "id" })
  getProduct(@Param("id", ParseUUIDPipe) id: string) {
    return this.prisma.product.findUnique({
      where: { id, deletedAt: null },
      include: {
        manufacturer: true,
        compositions: { include: { generic: true } },
        prices: true,
        packs: true,
      },
    });
  }

  @Post()
  @ApiOperation({ summary: "Create new product" })
  createProduct(@Body() data: any) {
    return this.prisma.product.create({ data: { ...data, status: "PENDING_REVIEW" } });
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
}