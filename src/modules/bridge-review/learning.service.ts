import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class BridgeLearningService {
  private readonly logger = new Logger(BridgeLearningService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processApprovedMappings(): Promise<number> {
    const approved = await this.prisma.bridgeAiSuggestion.findMany({
      where: {
        status: "APPROVED",
      },
    });

    let learned = 0;

    for (const suggestion of approved) {
      const existing = await this.prisma.molecule.findFirst({
        where: {
          normalizedName: {
            equals: suggestion.suggestedMolecule || "",
            mode: "insensitive",
          },
        },
      });

      if (existing && suggestion.variantType) {
        await this.prisma.ingredientVariant.create({
          data: {
            moleculeId: existing.id,
            variantType: suggestion.variantType,
            name: suggestion.ingredientText,
            normalizedName: this.normalizeVariant(suggestion.ingredientText, existing.normalizedName || ""),
            status: "ACTIVE",
            sourceType: "ADMIN_REVIEW",
          },
        });

        await this.prisma.bridgeAiSuggestion.update({
          where: { id: suggestion.id },
          data: {
            evidence: {
              learningProcessed: true,
              sourceSuggestionId: suggestion.id,
              learningSource: "APPROVED_MAPPING",
            } as any,
          },
        });

        learned++;
      }
    }

    this.logger.log(`Learning engine processed ${learned} approved mappings`);
    return learned;
  }

  private normalizeVariant(ingredient: string, parentMolecule: string): string {
    return ingredient
      .replace(new RegExp(`^${parentMolecule}\\s*`, "i"), "")
      .replace(/\s+/g, "_")
      .toLowerCase();
  }
}