import { Controller, Get, Post, Patch, Param, Query, ParseUUIDPipe } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { PrismaService } from "../../../database/prisma.service";
import { RecordStatus } from "@prisma/client";

@ApiTags("Admin Scraper")
@Controller("admin/scraper")
export class AdminScraperController {
  constructor(private readonly prisma: PrismaService) {}

  @Post("jobs/:id/start")
  @ApiOperation({ summary: "Start scraper job" })
  startJob(@Param("id", ParseUUIDPipe) id: string) {
    return this.prisma.crawlJob.update({
      where: { id },
      data: { status: "PENDING" as RecordStatus },
    });
  }

  @Post("jobs/:id/pause")
  @ApiOperation({ summary: "Pause scraper job" })
  pauseJob(@Param("id", ParseUUIDPipe) id: string) {
    return this.prisma.crawlJob.update({
      where: { id },
      data: { status: "RUNNING" as RecordStatus },
    });
  }

  @Post("jobs/:id/resume")
  @ApiOperation({ summary: "Resume scraper job" })
  resumeJob(@Param("id", ParseUUIDPipe) id: string) {
    return this.prisma.crawlJob.update({
      where: { id },
      data: { status: "PENDING" as RecordStatus },
    });
  }

  @Post("jobs/:id/stop")
  @ApiOperation({ summary: "Stop scraper job" })
  stopJob(@Param("id", ParseUUIDPipe) id: string) {
    return this.prisma.crawlJob.update({
      where: { id },
      data: { status: "ARCHIVED" as RecordStatus },
    });
  }

  @Get("jobs")
  @ApiOperation({ summary: "Get scraper run history" })
  getRunHistory(@Query("limit") limit = 20) {
    return this.prisma.crawlJob.findMany({
      orderBy: { createdAt: "desc" },
      take: Number(limit),
    });
  }

  @Get("errors")
  @ApiOperation({ summary: "Get scraper error logs" })
  getErrorLogs() {
    return this.prisma.crawlJob.findMany({
      where: { errorMessage: { not: null } },
      orderBy: { createdAt: "desc" },
    });
  }

  @Get("prices-collected")
  @ApiOperation({ summary: "Get collected prices count" })
  getCollectedPrices() {
    return this.prisma.priceSnapshot.count({
      where: { sourceType: "ONLINE_PHARMACY" },
    });
  }
}