import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { PrismaService } from "../../../database/prisma.service";

@ApiTags("Admin Distributors")
@Controller("admin/distributors")
export class AdminDistributorsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "List distributors" })
  listDistributors(@Query("search") search?: string, @Query("limit") limit = 50) {
    return this.prisma.distributorProfile.findMany({
      where: search ? { distributorName: { contains: search, mode: "insensitive" } } : undefined,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    });
  }
}