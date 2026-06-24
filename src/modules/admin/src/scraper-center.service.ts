import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";

@Injectable()
export class ScraperCenterService {
  constructor(private readonly prisma: PrismaService) {}

  async startScraper(adapterName: string) {
    const job = await this.prisma.crawlJob.create({
      data: {
        name: `Scrape ${adapterName}`,
        adapterName,
        status: "PENDING_REVIEW" as any,
      },
    });
    return { jobId: job.id, status: "started" };
  }

  async stopScraper(jobId: string) {
    await this.prisma.crawlJob.update({
      where: { id: jobId },
      data: { status: "ARCHIVED" as any },
    });
    return { status: "stopped" };
  }

  async pauseScraper(jobId: string) {
    await this.prisma.crawlJob.update({
      where: { id: jobId },
      data: { status: "PAUSED" as any },
    });
    return { status: "paused" };
  }

  async resumeScraper(jobId: string) {
    await this.prisma.crawlJob.update({
      where: { id: jobId },
      data: { status: "PENDING_REVIEW" as any },
    });
    return { status: "resumed" };
  }

  async getRunHistory(limit = 20) {
    return this.prisma.crawlJob.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async getErrorLogs() {
    return this.prisma.crawlJob.findMany({
      where: { errorMessage: { not: null } },
      orderBy: { createdAt: "desc" },
    });
  }

  async getCollectedPrices() {
    return this.prisma.priceSnapshot.count({
      where: { sourceType: "ONLINE_PHARMACY" },
    });
  }
}