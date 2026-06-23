import { Injectable } from "@nestjs/common";
import { SourceType } from "@prisma/client";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { normalizeKey } from "../atc/molecule-normalizer.service";
import { AtcService } from "../atc/atc.service";
import { PrismaService } from "../../database/prisma.service";
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
  constructor(
    private readonly repository: IngredientReviewRepository,
    private readonly prisma: PrismaService,
    private readonly atcService: AtcService,
  ) {}

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

  async listQueue(params: {
    limit: number;
    offset: number;
    search?: string;
    reviewStatus?: string;
    patternClass?: string;
    sourceType?: SourceType;
    minConfidence?: number;
    maxConfidence?: number;
  }) {
    return this.repository.listQueueItems(params);
  }

  async getQueueItem(id: string) {
    return this.repository.findQueueItem(id);
  }

  async approveQueueItem(id: string, notes?: string, actorId?: string) {
    return this.repository.approveQueueItem({
      queueId: id,
      notes,
      approvedById: actorId,
      sourceType: SourceType.ADMIN_REVIEW,
    });
  }

  async rejectQueueItem(id: string, notes?: string, actorId?: string) {
    return this.repository.rejectQueueItem({
      queueId: id,
      notes,
      rejectedById: actorId,
      sourceType: SourceType.ADMIN_REVIEW,
    });
  }

  async bulkApprove(ids: string[], notes?: string, actorId?: string) {
    return this.repository.bulkQueueAction({
      queueIds: ids,
      action: "approve",
      actorId,
      notes,
      sourceType: SourceType.ADMIN_REVIEW,
    });
  }

  async bulkReject(ids: string[], notes?: string, actorId?: string) {
    return this.repository.bulkQueueAction({
      queueIds: ids,
      action: "reject",
      actorId,
      notes,
      sourceType: SourceType.ADMIN_REVIEW,
    });
  }

  async getStats() {
    return this.repository.getStats();
  }

  async backfillFromAuditAssets() {
    const whoReport = await this.atcService.importWhoAtcMaster();
    const queueCsv = await readFile(join(process.cwd(), "docs", "audits", "ingredient-review-queue.csv"), "utf8");
    const rows = parseCsv(queueCsv).slice(1);
    let queueCount = 0;

    for (const row of rows) {
      const rawIngredient = String(row.raw_ingredient || "");
      const evaluation = await this.evaluate({
        rawIngredient,
        occurrenceCount: Number(row.occurrence_count || 1),
        sourceType: SourceType.ADMIN_IMPORT,
        sourceUrl: "docs/audits/ingredient-review-queue.csv",
      });

      await this.repository.upsertQueueItem({
        rawIngredient,
        normalizedIngredient: evaluation.normalizedIngredient,
        occurrenceCount: Number(row.occurrence_count || 1),
        patternClass: evaluation.patternClass,
        confidenceScore: evaluation.confidenceScore,
        reviewLane: evaluation.reviewLane,
        suggestedGenericId: evaluation.suggestedGenericId,
        suggestedCanonicalMolecule: evaluation.suggestedCanonicalMolecule,
        reasoning: evaluation.reasoning,
        sourceType: SourceType.ADMIN_IMPORT,
        sourceUrl: "docs/audits/ingredient-review-queue.csv",
      });
      queueCount += 1;
    }

    return {
      queueCount,
      whoCanonicalMolecules: whoReport.totalCanonicalMolecules,
      whoAliasSeeds: whoReport.totalAliases,
    };
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

function parseCsv(input: string): Array<Record<string, string>> {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  const headers = splitCsvLine(lines[0]).map((header) => header.trim());

  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return headers.reduce<Record<string, string>>((record, header, index) => {
      record[header] = values[index] || "";
      return record;
    }, {});
  });
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}
