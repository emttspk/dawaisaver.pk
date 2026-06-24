import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { PrismaService } from "../../../database/prisma.service";

@ApiTags("Admin Reports")
@Controller("admin/reports")
export class AdminReportsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("daily")
  @ApiOperation({ summary: "Get daily report" })
  getDailyReport() {
    return this.prisma.auditLog.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      orderBy: { createdAt: "desc" },
    });
  }

  @Get("weekly")
  @ApiOperation({ summary: "Get weekly report" })
  getWeeklyReport() {
    return this.prisma.auditLog.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      orderBy: { createdAt: "desc" },
    });
  }

  @Get("monthly")
  @ApiOperation({ summary: "Get monthly report" })
  getMonthlyReport() {
    return this.prisma.auditLog.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      orderBy: { createdAt: "desc" },
    });
  }
}