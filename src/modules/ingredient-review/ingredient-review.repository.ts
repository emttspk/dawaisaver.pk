import { Injectable } from "@nestjs/common";
import { IngredientAlias, IngredientReviewHistory, IngredientReviewQueue, Prisma, SourceType } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { normalizeKey } from "../atc/molecule-normalizer.service";
import { IngredientAliasPromotionInput, IngredientReviewInput } from "./ingredient-review.types";

@Injectable()
export class IngredientReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findQueueById(id: string): Promise<IngredientReviewQueue | null> {
    return this.prisma.ingredientReviewQueue.findUnique({ where: { id } });
  }

  async findGenericCandidate(normalizedIngredient: string): Promise<
    | { genericId: string; canonicalName: string; matchedBy: "generic" | "ingredient_alias" | "molecule_alias" }
    | null
  > {
    const generic = await this.prisma.generic.findFirst({
      where: {
        OR: [
          { normalizedName: normalizedIngredient },
          { name: { equals: normalizedIngredient, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true },
    });

    if (generic) {
      return {
        genericId: generic.id,
        canonicalName: generic.name,
        matchedBy: "generic",
      };
    }

    const ingredientAlias = await this.prisma.ingredientAlias.findFirst({
      where: { normalizedValue: normalizedIngredient },
      include: { generic: { select: { id: true, name: true } } },
    });

    if (ingredientAlias) {
      return {
        genericId: ingredientAlias.generic.id,
        canonicalName: ingredientAlias.generic.name,
        matchedBy: "ingredient_alias",
      };
    }

    const moleculeAlias = await this.prisma.moleculeAlias.findFirst({
      where: { normalizedAliasName: normalizedIngredient },
      include: { generic: { select: { id: true, name: true } } },
    });

    if (moleculeAlias) {
      return {
        genericId: moleculeAlias.generic.id,
        canonicalName: moleculeAlias.generic.name,
        matchedBy: "molecule_alias",
      };
    }

    return null;
  }

  async upsertQueueItem(input: IngredientReviewInput & {
    normalizedIngredient: string;
    patternClass: string;
    confidenceScore: number;
    reviewLane: string;
    suggestedGenericId: string | null;
    suggestedCanonicalMolecule: string | null;
    reasoning: string;
  }): Promise<IngredientReviewQueue> {
    const existing = await this.prisma.ingredientReviewQueue.findUnique({
      where: { normalizedIngredient: input.normalizedIngredient },
    });

    const occurrenceCount = (existing?.occurrenceCount || 0) + (input.occurrenceCount || 1);

    return this.prisma.ingredientReviewQueue.upsert({
      where: { normalizedIngredient: input.normalizedIngredient },
      create: {
        rawIngredient: input.rawIngredient,
        normalizedIngredient: input.normalizedIngredient,
        occurrenceCount,
        matchPattern: input.patternClass,
        confidenceScore: new Prisma.Decimal(input.confidenceScore),
        reviewStatus: input.reviewLane,
        aiReasoning: input.reasoning,
        suggestedGenericId: input.suggestedGenericId,
        resolvedGenericId: input.reviewLane === "AUTO_APPROVE" ? input.suggestedGenericId : undefined,
        sourceType: input.sourceType || SourceType.SYSTEM,
        sourceUrl: input.sourceUrl,
      },
      update: {
        rawIngredient: input.rawIngredient,
        occurrenceCount,
        matchPattern: input.patternClass,
        confidenceScore: new Prisma.Decimal(input.confidenceScore),
        reviewStatus: input.reviewLane,
        aiReasoning: input.reasoning,
        suggestedGenericId: input.suggestedGenericId,
        sourceType: input.sourceType || SourceType.SYSTEM,
        sourceUrl: input.sourceUrl,
        resolvedGenericId: input.reviewLane === "AUTO_APPROVE" ? input.suggestedGenericId : undefined,
      },
    });
  }

  async appendHistory(input: {
    ingredientReviewQueueId: string;
    previousStatus?: string | null;
    newStatus: string;
    previousSuggestedGenericId?: string | null;
    newSuggestedGenericId?: string | null;
    confidenceScore?: number;
    reasoning?: string | null;
    actorType?: string | null;
    actorId?: string | null;
    sourceType?: SourceType | null;
    sourceUrl?: string | null;
  }): Promise<IngredientReviewHistory> {
    return this.prisma.ingredientReviewHistory.create({
      data: {
        ingredientReviewQueueId: input.ingredientReviewQueueId,
        previousStatus: input.previousStatus || null,
        newStatus: input.newStatus,
        previousSuggestedGenericId: input.previousSuggestedGenericId || null,
        newSuggestedGenericId: input.newSuggestedGenericId || null,
        confidenceScore: input.confidenceScore == null ? undefined : new Prisma.Decimal(input.confidenceScore),
        reasoning: input.reasoning || null,
        actorType: input.actorType || null,
        actorId: input.actorId || null,
        sourceType: input.sourceType || SourceType.SYSTEM,
        sourceUrl: input.sourceUrl || null,
      },
    });
  }

  async promoteAlias(input: IngredientAliasPromotionInput): Promise<IngredientAlias> {
    const normalizedValue = normalizeKey(input.aliasValue);
    const confidenceScore = input.confidenceScore == null ? new Prisma.Decimal(1) : new Prisma.Decimal(input.confidenceScore);

    const alias = await this.prisma.ingredientAlias.upsert({
      where: {
        genericId_normalizedValue_aliasType: {
          genericId: input.genericId,
          normalizedValue,
          aliasType: input.aliasType,
        },
      },
      create: {
        ingredientReviewQueueId: input.queueId,
        genericId: input.genericId,
        aliasValue: input.aliasValue,
        normalizedValue,
        aliasType: input.aliasType,
        status: "ACTIVE",
        confidenceScore,
        sourceType: input.sourceType || SourceType.SYSTEM,
        sourceUrl: input.sourceUrl,
        approvedAt: new Date(),
        approvedById: input.approvedById,
      },
      update: {
        ingredientReviewQueueId: input.queueId,
        aliasValue: input.aliasValue,
        confidenceScore,
        sourceType: input.sourceType || SourceType.SYSTEM,
        sourceUrl: input.sourceUrl,
        approvedAt: new Date(),
        approvedById: input.approvedById,
      },
    });

    await this.prisma.moleculeAlias.upsert({
      where: {
        genericId_normalizedAliasName_aliasType: {
          genericId: input.genericId,
          normalizedAliasName: normalizedValue,
          aliasType: input.aliasType,
        },
      },
      create: {
        genericId: input.genericId,
        aliasName: input.aliasValue,
        normalizedAliasName: normalizedValue,
        aliasType: input.aliasType,
        confidenceScore,
        sourceType: input.sourceType || SourceType.SYSTEM,
        sourceUrl: input.sourceUrl,
      },
      update: {
        aliasName: input.aliasValue,
        confidenceScore,
        sourceType: input.sourceType || SourceType.SYSTEM,
        sourceUrl: input.sourceUrl,
      },
    });

    return alias;
  }

  async syncWhoAliasSeedBundle(input: {
    genericId: string;
    aliases: Array<{
      aliasName: string;
      normalizedAliasName: string;
      aliasType: string;
      confidenceScore: number;
    }>;
    queueId?: string;
    sourceUrl?: string;
  }): Promise<number> {
    let processed = 0;

    for (const alias of input.aliases) {
      await this.promoteAlias({
        genericId: input.genericId,
        aliasValue: alias.aliasName,
        aliasType: alias.aliasType,
        confidenceScore: alias.confidenceScore,
        sourceType: SourceType.ADMIN_IMPORT,
        sourceUrl: input.sourceUrl,
        queueId: input.queueId,
      });
      processed += 1;
    }

    return processed;
  }

  async listQueueSummary(): Promise<Array<{ reviewStatus: string; count: number; occurrences: number }>> {
    const rows = await this.prisma.ingredientReviewQueue.findMany({
      select: {
        reviewStatus: true,
        occurrenceCount: true,
      },
    });

    const summary = new Map<string, { count: number; occurrences: number }>();

    for (const row of rows) {
      const current = summary.get(row.reviewStatus) || { count: 0, occurrences: 0 };
      current.count += 1;
      current.occurrences += row.occurrenceCount;
      summary.set(row.reviewStatus, current);
    }

    return Array.from(summary.entries()).map(([reviewStatus, stats]) => ({
      reviewStatus,
      count: stats.count,
      occurrences: stats.occurrences,
    }));
  }
}
