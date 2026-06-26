import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [
      products,
      manufacturers,
      ingredients,
      dosageForms,
      strengths,
      packs,
      routes,
      atcClassifications,
      therapeuticCategories,
      importBatches,
      importBatchItems,
    ] = await Promise.all([
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.manufacturerMaster.count({ where: { deletedAt: null } }),
      this.prisma.ingredientMaster.count({ where: { deletedAt: null } }),
      this.prisma.dosageFormMaster.count({ where: { deletedAt: null } }),
      this.prisma.strengthMaster.count({ where: { deletedAt: null } }),
      this.prisma.packMaster.count({ where: { deletedAt: null } }),
      this.prisma.routeMaster.count({ where: { deletedAt: null } }),
      this.prisma.atcMaster.count({ where: { deletedAt: null } }),
      this.prisma.therapeuticCategoryMaster.count({ where: { deletedAt: null } }),
      this.prisma.importBatch.count({ where: { deletedAt: null } }),
      this.prisma.importBatchItem.count({ where: { status: "SAVED" } }),
    ]);

    return {
      totalProducts: products,
      totalManufacturers: manufacturers,
      totalIngredients: ingredients,
      totalDosageForms: dosageForms,
      totalStrengths: strengths,
      totalPacks: packs,
      totalRoutes: routes,
      totalAtc: atcClassifications,
      totalTherapeuticCategories: therapeuticCategories,
      totalImportBatches: importBatches,
      totalNormalizedRecords: importBatchItems,
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