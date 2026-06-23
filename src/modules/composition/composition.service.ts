import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class CompositionService {
  constructor(private readonly prisma: PrismaService) {}

  async generateCompositionGroups() {
    const products = await this.prisma.product.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      include: {
        compositions: {
          where: { deletedAt: null },
          include: { generic: true },
          orderBy: { ingredientOrder: "asc" },
        },
      },
    });

    const groups = new Map<string, { signature: string; products: string[] }>();

    for (const product of products) {
      if (!product.compositions.length || !product.dosageForm) continue;

      const ingredientKeys = product.compositions
        .map((c) => `${c.generic.normalizedName}@${c.strengthText || ""}`)
        .sort()
        .join("|");

      const groupSignature = `${ingredientKeys}|dosage_form=${product.dosageForm}`;

      if (!groups.has(groupSignature)) {
        groups.set(groupSignature, { signature: groupSignature, products: [] });
      }
      groups.get(groupSignature)!.products.push(product.id);
    }

    return Array.from(groups.values());
  }

  async createCompositionGroup(input: {
    signature: string;
    moleculesHash: string;
    dosageForm: string;
    normalizedDosageForm: string;
    productIds: string[];
    genericIds: string[];
  }) {
    return this.prisma.compositionGroup.upsert({
      where: { signature: input.signature },
      update: {},
      create: {
        signature: input.signature,
        moleculesHash: input.moleculesHash,
        dosageForm: input.dosageForm,
        normalizedDosageForm: input.normalizedDosageForm,
        compositions: {
          create: input.genericIds.map((genericId, index) => ({
            genericId,
            ingredientOrder: index + 1,
          })),
        },
      },
    });
  }

  async getCompositionGroupStats() {
    const [totalProducts, compositionGroups] = await Promise.all([
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.compositionGroup.count({ where: { deletedAt: null } }),
    ]);

    return {
      totalProducts,
      compositionGroups,
      coveragePercent: 0,
    };
  }
}