import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [products, manufacturers, pharmacies, prices, submissions, validations] = await Promise.all([
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.manufacturer.count({ where: { deletedAt: null } }),
      this.prisma.pharmacy.count({ where: { deletedAt: null } }),
      this.prisma.productPrice.count({ where: { deletedAt: null } }),
      this.prisma.submission.count({ where: { status: "PENDING_REVIEW" } }),
      this.prisma.ingredientReviewQueue.count({ where: { reviewStatus: "PENDING_AI" } }),
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

  async getScraperStatus() {
    const jobs = await this.prisma.crawlJob.findMany({
      where: { status: "PENDING_REVIEW" },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return jobs.map((job) => ({
      id: job.id,
      name: job.name,
      adapterName: job.adapterName,
      status: job.status,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
      errorMessage: job.errorMessage,
    }));
  }
}