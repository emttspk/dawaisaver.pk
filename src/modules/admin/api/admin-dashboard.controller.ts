import { Controller, Get, Post, Patch, Param, Query, ParseUUIDPipe } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { PrismaService } from "../../../database/prisma.service";

@ApiTags("Admin Dashboard")
@Controller("admin/dashboard")
export class AdminDashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("stats")
  @ApiOperation({ summary: "Get dashboard statistics" })
  async getStats() {
    const [products, manufacturers, pharmacies, prices, submissions, validations] = await Promise.all([
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.manufacturer.count({ where: { deletedAt: null } }),
      this.prisma.pharmacy.count({ where: { deletedAt: null } }),
      this.prisma.productPrice.count({ where: { deletedAt: null } }),
      this.safeCount(() => this.prisma.submission.count({ where: { status: "PENDING_REVIEW" } })),
      this.safeCount(() => this.prisma.ingredientReviewQueue.count({ where: { reviewStatus: "PENDING_AI" } })),
    ]);

    return {
      totalProducts: products,
      totalManufacturers: manufacturers,
      totalPharmacies: pharmacies,
      totalPrices: prices,
      pendingSubmissions: submissions,
      pendingValidations: validations,
    };
  }

  private async safeCount(fn: () => Promise<number>): Promise<number> {
    try {
      return await fn();
    } catch {
      return 0;
    }
  }

  @Get("scraper/status")
  @ApiOperation({ summary: "Get scraper status" })
  async getScraperStatus() {
    const jobs = await this.prisma.crawlJob.findMany({
      where: { status: "PENDING_REVIEW" },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    return jobs;
  }
}
