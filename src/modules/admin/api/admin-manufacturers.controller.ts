import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { PrismaService } from "../../../database/prisma.service";

@ApiTags("Admin Manufacturers")
@Controller("admin/manufacturers")
export class AdminManufacturersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "List manufacturers" })
  listManufacturers(@Query("search") search?: string, @Query("limit") limit = 50) {
    return this.prisma.manufacturer.findMany({
      where: search ? { name: { contains: search, mode: "insensitive" } } : undefined,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    });
  }
}