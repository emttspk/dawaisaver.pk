import { Injectable } from "@nestjs/common";
import { SourceType } from "@prisma/client";
import { normalizeKey } from "../atc/molecule-normalizer.service";
import { classifyIngredientPattern, classifyReviewLane, normalizeIngredientText, scoreIngredientConfidence } from "./ingredient-review.patterns";
import {
  IngredientAliasPromotionInput,
  IngredientReviewEvaluation,
  IngredientReviewInput,
  IngredientReviewSimulationResult,
} from "./ingredient-review.types";
import { IngredientReviewRepository } from "./ingredient-review.repository";

@Injectable()
export class IngredientReviewService {
  constructor(private readonly repository: IngredientReviewRepository) {}

  async evaluate(input: IngredientReviewInput): Promise<IngredientReviewEvaluation> {
    const normalizedIngredient = normalizeIngredientText(input.rawIngredient);
    const patternClass = classifyIngredientPattern(input.rawIngredient);
    const candidate = await this.resolveCandidate(input.rawIngredient, normalizedIngredient, patternClass);
    const confidenceScore = scoreIngredientConfidence({
      patternClass,
      matchedBy: candidate?.matchedBy || "manual",
    });
    const reviewLane = classifyReviewLane(confidenceScore);

    return {
      ...input,
      normalizedIngredient,
      patternClass,
      suggestedCanonicalMolecule: candidate?.canonicalName || this.fallbackCanonicalName(input.rawIngredient, patternClass),
      suggestedGenericId: candidate?.genericId || null,
      confidenceScore,
      reviewLane,
      reasoning: this.buildReasoning(patternClass, candidate?.matchedBy || "manual"),
    };
  }

  async simulateDryRun(inputs: IngredientReviewInput[]): Promise<IngredientReviewSimulationResult> {
    const evaluations = await Promise.all(inputs.map((input) => this.evaluate(input)));
    return this.summarize(evaluations);
  }

  async upsertQueueItem(input: IngredientReviewInput): Promise<IngredientReviewEvaluation> {
    const evaluation = await this.evaluate(input);
    await this.repository.upsertQueueItem({
      ...input,
      normalizedIngredient: evaluation.normalizedIngredient,
      patternClass: evaluation.patternClass,
      confidenceScore: evaluation.confidenceScore,
      reviewLane: evaluation.reviewLane,
      suggestedGenericId: evaluation.suggestedGenericId,
      suggestedCanonicalMolecule: evaluation.suggestedCanonicalMolecule,
      reasoning: evaluation.reasoning,
    });
    return evaluation;
  }

  async promoteAlias(input: IngredientAliasPromotionInput): Promise<void> {
    const queue = input.queueId ? await this.repository.findQueueById(input.queueId) : null;

    await this.repository.promoteAlias(input);

    if (queue) {
      await this.repository.appendHistory({
        ingredientReviewQueueId: queue.id,
        previousStatus: queue.reviewStatus,
        newStatus: "APPROVED",
        previousSuggestedGenericId: queue.suggestedGenericId,
        newSuggestedGenericId: input.genericId,
        confidenceScore: input.confidenceScore,
        reasoning: `Promoted alias ${input.aliasValue} to canonical molecule.`,
        actorType: input.approvedById ? "HUMAN" : "SYSTEM",
        actorId: input.approvedById,
        sourceType: input.sourceType || SourceType.SYSTEM,
        sourceUrl: input.sourceUrl,
      });
    }
  }

  async syncWhoAliasSeedBundle(input: {
    genericId: string;
    canonicalName: string;
    aliases: Array<{
      aliasName: string;
      normalizedAliasName: string;
      aliasType: string;
      confidenceScore: number;
    }>;
    queueId?: string;
    sourceUrl?: string;
  }): Promise<number> {
    return this.repository.syncWhoAliasSeedBundle({
      genericId: input.genericId,
      aliases: input.aliases,
      queueId: input.queueId,
      sourceUrl: input.sourceUrl,
    });
  }

  async getQueueSummary(): Promise<Array<{ reviewStatus: string; count: number; occurrences: number }>> {
    return this.repository.listQueueSummary();
  }

  private async resolveCandidate(
    rawIngredient: string,
    normalizedIngredient: string,
    patternClass: ReturnType<typeof classifyIngredientPattern>,
  ): Promise<{ genericId: string; canonicalName: string; matchedBy: "generic" | "ingredient_alias" | "molecule_alias" } | null> {
    const lookupCandidates = this.buildLookupCandidates(rawIngredient, normalizedIngredient, patternClass);

    for (const candidate of lookupCandidates) {
      const match = await this.repository.findGenericCandidate(candidate);
      if (match) {
        return match;
      }
    }

    return null;
  }

  private buildLookupCandidates(
    rawIngredient: string,
    normalizedIngredient: string,
    patternClass: ReturnType<typeof classifyIngredientPattern>,
  ): string[] {
    const candidates = new Set<string>();
    const cleaned = rawIngredient.replace(/\s+/g, " ").trim();
    candidates.add(normalizeKey(cleaned));
    candidates.add(normalizedIngredient);

    const eqToSplit = cleaned.split(/\beq\.?\s*to\b/i);
    if (eqToSplit.length > 1) {
      candidates.add(normalizeKey(eqToSplit[eqToSplit.length - 1]));
    }

    const stripped = cleaned
      .replace(/\((as\s+)?(hydrochloride|hcl|sodium|potassium|mesylate|mesilate|fumarate|hydrogen fumarate|monohydrate|dihydrate|trihydrate|pentahydrate|hydrate)\)/gi, "")
      .replace(/\b(as\s+)?(hydrochloride|hcl|sodium|potassium|mesylate|mesilate|fumarate|hydrogen fumarate|monohydrate|dihydrate|trihydrate|pentahydrate|hydrate)\b/gi, "")
      .replace(/\b(sterile|enteric coated|pellets?|buffered|qs|contains?)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    candidates.add(normalizeKey(stripped));

    if (patternClass === "combination_product") {
      candidates.add(normalizeKey(cleaned.replace(/\s*(\+|and|with)\s*/gi, " + ")));
    }

    return Array.from(candidates).filter(Boolean);
  }

  private buildReasoning(
    patternClass: ReturnType<typeof classifyIngredientPattern>,
    matchedBy: "generic" | "ingredient_alias" | "molecule_alias" | "manual",
  ): string {
    if (matchedBy === "generic") {
      return `Direct canonical molecule match after ${patternClass} normalization.`;
    }

    if (matchedBy === "ingredient_alias") {
      return `Approved ingredient alias matched after ${patternClass} normalization.`;
    }

    if (matchedBy === "molecule_alias") {
      return `Legacy molecule alias matched after ${patternClass} normalization.`;
    }

    return `No reliable canonical candidate found; route to human review.`;
  }

  private fallbackCanonicalName(rawIngredient: string, patternClass: ReturnType<typeof classifyIngredientPattern>): string {
    if (patternClass === "eq_to") {
      const parts = rawIngredient.split(/\beq\.?\s*to\b/i);
      return parts[parts.length - 1].trim();
    }

    if (patternClass === "combination_product") {
      return rawIngredient.replace(/\s+/g, " ").trim().replace(/\s*(\+|and|with)\s*/gi, " + ");
    }

    return rawIngredient.replace(/\s+/g, " ").trim();
  }

  private summarize(evaluations: IngredientReviewEvaluation[]): IngredientReviewSimulationResult {
    const summary = {
      totalRows: evaluations.length,
      autoApproveRows: 0,
      reviewRequiredRows: 0,
      manualReviewRows: 0,
      totalOccurrences: 0,
      autoApproveOccurrences: 0,
      reviewRequiredOccurrences: 0,
      manualReviewOccurrences: 0,
    };

    for (const evaluation of evaluations) {
      const occurrences = evaluation.occurrenceCount || 1;
      summary.totalOccurrences += occurrences;

      if (evaluation.reviewLane === "AUTO_APPROVE") {
        summary.autoApproveRows += 1;
        summary.autoApproveOccurrences += occurrences;
      } else if (evaluation.reviewLane === "REVIEW_REQUIRED") {
        summary.reviewRequiredRows += 1;
        summary.reviewRequiredOccurrences += occurrences;
      } else {
        summary.manualReviewRows += 1;
        summary.manualReviewOccurrences += occurrences;
      }
    }

    return {
      ...summary,
      autoApproveShare: summary.totalRows === 0 ? 0 : summary.autoApproveRows / summary.totalRows,
      reviewRequiredShare: summary.totalRows === 0 ? 0 : summary.reviewRequiredRows / summary.totalRows,
      manualReviewShare: summary.totalRows === 0 ? 0 : summary.manualReviewRows / summary.totalRows,
      autoApproveOccurrenceShare: summary.totalOccurrences === 0 ? 0 : summary.autoApproveOccurrences / summary.totalOccurrences,
      reviewRequiredOccurrenceShare: summary.totalOccurrences === 0 ? 0 : summary.reviewRequiredOccurrences / summary.totalOccurrences,
      manualReviewOccurrenceShare: summary.totalOccurrences === 0 ? 0 : summary.manualReviewOccurrences / summary.totalOccurrences,
      evaluations,
    };
  }
}
