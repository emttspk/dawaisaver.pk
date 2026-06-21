import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import {
  GoldenSampleCatalogue,
  GoldenSampleMolecule,
  GoldenSampleProduct,
  GoldenSampleCatalogue as CatalogueType,
  CatalogueBuildResult,
} from "./catalogue.types";

@Injectable()
export class CatalogueBuilderService {
  private readonly logger = new Logger(CatalogueBuilderService.name);

  constructor(private readonly prisma: PrismaService) {}

  async buildGoldenSampleCatalogue(): Promise<CatalogueBuildResult> {
    const molecules = await this.selectMolecules(10);
    const products = await this.selectProducts(50);
    const categories = await this.selectTherapeuticCategories(5);

    const totalMolecules = await this.countTotalMolecules();
    const totalProducts = await this.countTotalProducts();
    const totalCategories = await this.countTotalCategories();

    this.logger.log(
      `Catalogue built: ${molecules.length}/${totalMolecules} molecules, ${products.length}/${totalProducts} products, ${categories.length}/${totalCategories} categories`,
    );

    return {
      success: true,
      moleculesSelected: molecules.length,
      productsSelected: products.length,
      categoriesSelected: categories.length,
      totalAvailableMolecules: totalMolecules,
      totalAvailableProducts: totalProducts,
      completionPercentage: this.calculateCompletionPercentage(molecules.length, products.length, categories.length),
    };
  }

  async exportCatalogue(): Promise<CatalogueType> {
    const result = await this.buildGoldenSampleCatalogue();
    const molecules = await this.selectMolecules(10);
    const products = await this.selectProducts(50);
    const categories = await this.selectTherapeuticCategories(5);

    return {
      id: `catalogue-${new Date().toISOString().slice(0, 10)}`,
      name: "Golden Sample Catalogue",
      version: "1.0.0",
      generatedAt: new Date().toISOString(),
      molecules,
      products,
      therapeuticCategories: categories,
      summary: {
        totalMolecules: molecules.length,
        totalProducts: products.length,
        totalTherapeuticCategories: categories.length,
        completionPercentage: result.completionPercentage,
      },
    };
  }

  private async selectMolecules(limit: number): Promise<GoldenSampleMolecule[]> {
    const generics = await this.prisma.generic.findMany({
      where: { status: { in: ["ACTIVE", "VERIFIED", "PENDING_REVIEW"] } },
      orderBy: { createdAt: "asc" },
      take: limit,
      select: {
        id: true,
        name: true,
        normalizedName: true,
        atcClassifications: {
          take: 3,
          select: {
            atc: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return generics.map((g, index) => ({
      id: g.id,
      atcCode: g.atcClassifications[0]?.atc?.code || `A${String(index + 1).padStart(2, "0")}`,
      name: g.normalizedName || g.name,
      therapeuticCategory: g.atcClassifications[0]?.atc?.name || "Not classified",
      therapeuticCategoryId: g.atcClassifications[0]?.atc?.code || "",
    }));
  }

  private async selectProducts(limit: number): Promise<GoldenSampleProduct[]> {
    const products = await this.prisma.product.findMany({
      where: { status: { in: ["ACTIVE", "VERIFIED", "PENDING_REVIEW"] } },
      orderBy: { createdAt: "asc" },
      take: limit,
      include: {
        manufacturer: { select: { name: true, normalizedName: true } },
        compositions: {
          take: 3,
          include: {
            generic: { select: { normalizedName: true } },
          },
        },
        therapeuticCategories: {
          select: { category: { select: { name: true, code: true } } },
        },
        prices: { take: 5 },
      },
    });

    return products.map((p) => ({
      id: p.id,
      registrationNumber: p.registrationNumber || "",
      brandName: p.brandName,
      normalizedBrand: p.normalizedBrand || p.brandName,
      genericName: p.compositions[0]?.generic?.normalizedName || "",
      strengthText: p.strengthText || "",
      dosageForm: p.dosageForm || "",
      manufacturer: p.manufacturer?.normalizedName || p.manufacturer?.name || "",
      manufacturerId: p.manufacturerId ?? undefined,
      packSize: p.packSize || "",
      therapeuticCategories: p.therapeuticCategories.map((tc) => tc.category?.name || ""),
      compositionGroupSignature: this.buildSignature(p),
      alternativeBrands: [],
      priceComparison: p.prices.map((price) => ({
        pharmacy: price.pharmacyId || "N/A",
        price: price.price.toNumber(),
        availability: price.availability || "IN_STOCK",
      })),
    }));
  }

  private async selectTherapeuticCategories(limit: number): Promise<string[]> {
    const categories = await this.prisma.therapeuticCategory.findMany({
      where: { status: { in: ["ACTIVE", "VERIFIED", "PENDING_REVIEW"] } },
      orderBy: { createdAt: "asc" },
      take: limit,
      select: { name: true },
    });

    return categories.map((c) => c.name);
  }

  private async countTotalMolecules(): Promise<number> {
    return this.prisma.generic.count({
      where: { status: { in: ["ACTIVE", "VERIFIED", "PENDING_REVIEW"] } },
    });
  }

  private async countTotalProducts(): Promise<number> {
    return this.prisma.product.count({
      where: { status: { in: ["ACTIVE", "VERIFIED", "PENDING_REVIEW"] } },
    });
  }

  private async countTotalCategories(): Promise<number> {
    return this.prisma.therapeuticCategory.count({
      where: { status: { in: ["ACTIVE", "VERIFIED", "PENDING_REVIEW"] } },
    });
  }

  private buildSignature(product: {
    brandName: string;
    normalizedBrand: string | null;
    strengthText: string | null;
    dosageForm: string | null;
    compositions: Array<{ generic: { normalizedName: string } | null }>;
  }): string {
    const generics = product.compositions.map((c) => c.generic?.normalizedName || "").filter(Boolean);
    const strength = product.strengthText || "";
    const form = product.dosageForm || "";
    return `${product.normalizedBrand || product.brandName}|${generics.join("+")}|${strength}|${form}`;
  }

  private calculateCompletionPercentage(molecules: number, products: number, categories: number): number {
    const maxMolecules = 10;
    const maxProducts = 50;
    const maxCategories = 5;
    return Math.round((molecules / maxMolecules + products / maxProducts + categories / maxCategories) / 3 * 100);
  }
}