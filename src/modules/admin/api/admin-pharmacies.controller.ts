import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { PrismaService } from "../../../database/prisma.service";

@ApiTags("Admin Pharmacies")
@Controller("admin/pharmacies")
export class AdminPharmaciesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "List pharmacies" })
  listPharmacies(@Query("search") search?: string, @Query("limit") limit = 50) {
    return this.prisma.pharmacy.findMany({
      where: search ? { name: { contains: search, mode: "insensitive" } } : undefined,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    });
  }
}