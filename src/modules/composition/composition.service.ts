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

  async generateProductMatches() {
    const compositionGroups = await this.prisma.compositionGroup.findMany({
      where: { deletedAt: null },
      include: { compositions: true },
    });

    let matchesCreated = 0;

    for (const group of compositionGroups) {
      const products = await this.prisma.product.findMany({
        where: { deletedAt: null, status: "ACTIVE" },
        include: {
          compositions: {
            include: { generic: true },
          },
        },
      });

      const productMatches = products.filter((p) => {
        const ingredientKeys = p.compositions
          .map((c) => `${c.generic.normalizedName}@${c.strengthText || ""}`)
          .sort()
          .join("|");
        const groupSignature = `${ingredientKeys}|dosage_form=${p.dosageForm}`;
        return groupSignature === group.signature;
      });

      for (let i = 0; i < productMatches.length; i++) {
        const sourceProduct = productMatches[i];

        for (let j = i + 1; j < productMatches.length; j++) {
          const targetProduct = productMatches[j];

          const existingMatch = await this.prisma.productMatch.findFirst({
            where: {
              sourceProductId: sourceProduct.id,
              canonicalProductId: targetProduct.id,
            },
          });

          if (!existingMatch) {
            await this.prisma.productMatch.create({
              data: {
                sourceProductId: sourceProduct.id,
                canonicalProductId: targetProduct.id,
                matchStatus: "MATCHED",
                brandScore: 1,
                genericScore: 1,
                strengthScore: 1,
                manufacturerScore: 1,
                signatureScore: 1,
                finalConfidence: 1,
                explanation: { matchType: "composition_group_match" } as any,
                sourceType: "SYSTEM",
              },
            });
            matchesCreated++;
          }
        }
      }
    }

    return { matchesCreated };
  }

  async getProductMatchStats() {
    const [totalProducts, productMatches] = await Promise.all([
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.productMatch.count({ where: { deletedAt: null } }),
    ]);

    return {
      totalProducts,
      matchedProducts: productMatches,
      unmatchedProducts: 0,
      matchCoveragePercent: productMatches > 0 ? 100 : 0,
    };
  }
}