import { Controller, Get, Post, Patch, Param, Query, Body, ParseUUIDPipe } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam } from "@nestjs/swagger";
import { PrismaService } from "../../../database/prisma.service";
import { PriceVerificationStatus, SourceType, RecordStatus } from "@prisma/client";

@ApiTags("Admin Prices")
@Controller("admin/prices")
export class AdminPricesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "List prices for admin" })
  listPrices(
    @Query("sourceType") sourceType?: SourceType,
    @Query("verificationStatus") verificationStatus?: PriceVerificationStatus,
    @Query("limit") limit = 50,
  ) {
    return this.prisma.verifiedPrice.findMany({
      where: {
        ...(sourceType && { sourceType }),
        ...(verificationStatus && { verificationStatus }),
      },
      include: { product: true },
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    });
  }

  @Get("stats")
  @ApiOperation({ summary: "Get price statistics" })
  getPriceStats() {
    return this.prisma.$transaction([
      this.prisma.verifiedPrice.count(),
      this.prisma.productPrice.count(),
    ]);
  }

  @Patch(":id/approve")
  @ApiOperation({ summary: "Approve price" })
  @ApiParam({ name: "id" })
  approvePrice(@Param("id", ParseUUIDPipe) id: string, @Body() body: { notes?: string }) {
    return this.prisma.verifiedPrice.update({
      where: { id },
      data: {
        verificationStatus: "VERIFIED" as PriceVerificationStatus,
        reviewerById: "admin",
        reviewNotes: body.notes,
      },
    });
  }

  @Patch(":id/reject")
  @ApiOperation({ summary: "Reject price" })
  @ApiParam({ name: "id" })
  rejectPrice(@Param("id", ParseUUIDPipe) id: string, @Body() body: { notes?: string }) {
    return this.prisma.verifiedPrice.update({
      where: { id },
      data: {
        verificationStatus: "REJECTED" as PriceVerificationStatus,
        reviewerById: "admin",
        reviewNotes: body.notes,
      },
    });
  }
}