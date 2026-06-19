import { Injectable } from "@nestjs/common";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { MatchingModule } from "../matching/matching.module";
import { assertMirrorExecutionAllowed } from "./drap.freeze";
import {
  buildCompositionGroupResult,
  matchDrapCandidate,
  WhoMoleculeRecord,
} from "./drap.atc.helpers";
import { DrapImporter } from "./drap.importer";
import { DrapNormalizer, normalizeBrandName, normalizeDosageForm, normalizeGenericName, normalizeManufacturer, normalizeStrength } from "./drap.normalizer";
import {
  DrapAtcMatchCandidate,
  DrapAtcMatchReport,
  DrapAtcMatchResult,
  DrapCompositionGroupResult,
  DrapDatasetInventoryItem,
  DrapImportSummaryDto,
} from "./drap.types";
import { canonicalMedicines, sourceMedicines } from "../matching/testing/matching.dataset";

interface DrapProductRow {
  id: string;
  brandName: string;
  normalizedBrand: string;
  dosageForm?: string | null;
  normalizedForm?: string | null;
  strengthText?: string | null;
  manufacturer?: { id: string; name: string | null; normalizedName: string | null } | null;
  compositions: Array<{
    ingredientOrder: number;
    strengthValue?: Prisma.Decimal | null;
    strengthUnit?: string | null;
    strengthText?: string | null;
    generic: {
      id: string;
      name: string;
      normalizedName: string;
    };
  }>;
}

@Injectable()
export class DrapService {
  private readonly importer: DrapImporter;

  constructor(private readonly prisma: PrismaService) {
    this.importer = new DrapImporter(prisma);
  }

  importFromSource(config: Parameters<DrapImporter["import"]>[0]): Promise<DrapImportSummaryDto> {
    assertMirrorExecutionAllowed();
    return this.importer.import(config);
  }

  async inspectDatasetInventory(rootDir = process.cwd()): Promise<DrapDatasetInventoryItem[]> {
    const samplePath = join(rootDir, "src", "modules", "drap", "samples", "drap.sample.csv");
    const matchingDatasetPath = join(
      rootDir,
      "src",
      "modules",
      "matching",
      "testing",
      "matching.dataset.ts",
    );

    const [sampleStats, matchingStats, sampleText] = await Promise.all([
      stat(samplePath),
      stat(matchingDatasetPath),
      readFile(samplePath, "utf8"),
    ]);

    return [
      {
        fileName: "src/modules/drap/samples/drap.sample.csv",
        source: "DRAP sample dataset",
        recordCount: countCsvRows(sampleText),
        lastUpdate: sampleStats.mtime.toISOString(),
        format: "csv",
      },
      {
        fileName: "src/modules/matching/testing/matching.dataset.ts",
        source: "Matching fixture sourceMedicines",
        recordCount: sourceMedicines.length,
        lastUpdate: matchingStats.mtime.toISOString(),
        format: "ts",
        notes: `Includes ${canonicalMedicines.length} canonical fixtures for comparison`,
      },
    ];
  }

  async matchAgainstWhoAtc(rootDir = process.cwd()): Promise<DrapAtcMatchReport> {
    const inventory = await this.inspectDatasetInventory(rootDir);
    const products = await this.loadDrapProducts();
    const molecules = await this.loadWhoMolecules();
    const matching = MatchingModule.createService();

    const results: DrapAtcMatchResult[] = [];
    const dataQualityFlags: DrapAtcMatchReport["dataQualityFlags"] = [];
    const therapeuticCategoryIds = new Set<string>();
    const manufacturerIds = new Set<string>();
    const compositionGroups = new Map<string, DrapCompositionGroupResult>();

    for (const product of products) {
      if (product.manufacturer?.id) {
        manufacturerIds.add(product.manufacturer.id);
      }

      const ingredientResults = product.compositions.map((composition) => {
        const candidate = this.toMatchCandidate(product, composition);
        const match = matchDrapCandidate(candidate, molecules);
        const genericScore = this.scoreGenericMatch(candidate, match, matching);

        if (!candidate.normalizedDosageForm) {
          dataQualityFlags.push({
            entityType: "product",
            entityId: product.id,
            flagType: "missing_dosage_form",
            severity: "medium",
            description: `Missing dosage form for ${candidate.brandName}`,
          });
        }

        if (!candidate.normalizedStrength) {
          dataQualityFlags.push({
            entityType: "product",
            entityId: product.id,
            flagType: "invalid_strength",
            severity: "medium",
            description: `Invalid or missing strength for ${candidate.genericName}`,
          });
        }

        if (!candidate.normalizedManufacturerName) {
          dataQualityFlags.push({
            entityType: "product",
            entityId: product.id,
            flagType: "unmatched_manufacturer",
            severity: "medium",
            description: `Manufacturer could not be matched for ${candidate.brandName}`,
          });
        }

        if (match.matchStatus === "unmatched") {
          dataQualityFlags.push({
            entityType: "product",
            entityId: product.id,
            flagType: "unknown_molecule",
            severity: "high",
            description: `No WHO ATC molecule match found for ${candidate.genericName}`,
          });
        }

        if (match.matchStatus === "ambiguous") {
          dataQualityFlags.push({
            entityType: "product",
            entityId: product.id,
            flagType: "duplicate_molecule",
            severity: "high",
            description: `Multiple WHO ATC molecules matched ${candidate.genericName}`,
          });
        }

        return {
          candidate,
          match,
          genericScore,
          composition,
        };
      });

      const productResult = this.aggregateProductResult(product, ingredientResults);
      results.push(productResult);

      if (productResult.matchStatus === "matched") {
        const categoryCodes = new Set(productResult.therapeuticCategoryCodes);
        for (const code of categoryCodes) {
          therapeuticCategoryIds.add(code);
        }
      }

      if (productResult.matchStatus === "matched") {
        const group = this.buildCompositionGroup(product, ingredientResults);
        compositionGroups.set(group.signature, group);
      }
    }

    const matchedProducts = results.filter((item) => item.matchStatus === "matched");
    const unmatchedProducts = results.filter((item) => item.matchStatus === "unmatched");
    const ambiguousMatches = results.filter((item) => item.matchStatus === "ambiguous");

    await this.persistMatchResults(results, dataQualityFlags);
    await this.persistTherapeuticCategories(results);
    await this.persistCompositionGroups(Array.from(compositionGroups.values()));

    return {
      batchId: undefined,
      inventory,
      matchedProductResults: matchedProducts,
      unmatchedProductResults: unmatchedProducts,
      ambiguousMatchResults: ambiguousMatches,
      dataQualityFlags,
      compositionGroups: Array.from(compositionGroups.values()),
      totalDrapProducts: results.length,
      matchedProducts: matchedProducts.length,
      unmatchedProducts: unmatchedProducts.length,
      ambiguousProducts: ambiguousMatches.length,
      compositionGroupsGenerated: compositionGroups.size,
      manufacturersIdentified: manufacturerIds.size,
      categoriesAssigned: therapeuticCategoryIds.size,
    };
  }

  private async loadDrapProducts(): Promise<DrapProductRow[]> {
    const products = await this.prisma.product.findMany({
      where: {
        deletedAt: null,
        sourceType: {
          in: ["DRAP", "DRAP_UPDATE"],
        },
      },
      include: {
        manufacturer: true,
        compositions: {
          include: {
            generic: true,
          },
          orderBy: {
            ingredientOrder: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return products as DrapProductRow[];
  }

  private async loadWhoMolecules(): Promise<WhoMoleculeRecord[]> {
    const generics = await this.prisma.generic.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        moleculeAliases: true,
        atcClassifications: {
          include: {
            atc: {
              include: {
                therapeuticCategory: true,
              },
            },
          },
        },
      },
    });

    return generics
      .filter((generic) => generic.moleculeAliases.length > 0 || generic.atcClassifications.length > 0)
      .map((generic) => ({
        id: generic.id,
        name: generic.name,
        normalizedName: generic.normalizedName,
        aliases: generic.moleculeAliases.map((alias) => ({
          aliasName: alias.aliasName,
          normalizedAliasName: alias.normalizedAliasName,
        })),
        atcCodes: generic.atcClassifications.map((classification) => classification.atc.code),
        therapeuticCategoryCodes: Array.from(
          new Set(
            generic.atcClassifications
              .map((classification) => classification.atc.therapeuticCategory?.code)
              .filter((value): value is string => Boolean(value)),
          ),
        ),
      }));
  }

  private toMatchCandidate(
    product: DrapProductRow,
    composition: DrapProductRow["compositions"][number],
  ): DrapAtcMatchCandidate {
    const strengthText =
      composition.strengthText ||
      formatStrength(composition.strengthValue, composition.strengthUnit) ||
      product.strengthText ||
      undefined;
    const dosageForm = product.dosageForm || product.normalizedForm || undefined;
    const manufacturerName = product.manufacturer?.name || undefined;

    return {
      productId: product.id,
      brandName: product.brandName,
      genericName: composition.generic.name,
      strength: strengthText,
      dosageForm,
      manufacturerName,
      normalizedBrandName: normalizeBrandName(product.brandName),
      normalizedGenericName: normalizeGenericName(composition.generic.name),
      normalizedStrength: normalizeStrength(strengthText),
      normalizedDosageForm: normalizeDosageForm(dosageForm),
      normalizedManufacturerName: normalizeManufacturer(manufacturerName),
    };
  }

  private scoreGenericMatch(
    candidate: DrapAtcMatchCandidate,
    match: DrapAtcMatchResult,
    matching: ReturnType<typeof MatchingModule.createService>,
  ): number {
    if (match.matchMode === "exact_canonical") {
      return 1;
    }

    if (match.matchMode === "alias_match") {
      return 0.95;
    }

    if (match.matchMode === "normalized_match") {
      return 0.8;
    }

    if (!match.canonicalGenericName) {
      return 0;
    }

    return matching.match(
      {
        brandName: candidate.brandName,
        genericName: candidate.genericName,
        strength: candidate.strength,
        dosageForm: candidate.dosageForm,
        manufacturer: candidate.manufacturerName,
      },
      {
        canonicalName: match.canonicalGenericName,
        brandName: candidate.brandName,
        genericName: match.canonicalGenericName,
        strength: candidate.strength,
        dosageForm: candidate.dosageForm,
        manufacturer: candidate.manufacturerName,
      },
    ).confidence;
  }

  private aggregateProductResult(
    product: DrapProductRow,
    ingredientResults: Array<{
      candidate: DrapAtcMatchCandidate;
      match: DrapAtcMatchResult;
      genericScore: number;
      composition: DrapProductRow["compositions"][number];
    }>,
  ): DrapAtcMatchResult {
    const confidenceScore =
      ingredientResults.length === 0
        ? 0
        : average(ingredientResults.map((item) => item.match.confidenceScore));
    const hasUnmatched = ingredientResults.some((item) => item.match.matchStatus === "unmatched");
    const hasAmbiguous = ingredientResults.some((item) => item.match.matchStatus === "ambiguous");
    const firstMatch = ingredientResults.find((item) => item.match.canonicalGenericId);
    const atcCodes = unique(
      ingredientResults.flatMap((item) => item.match.atcCodes),
    );
    const therapeuticCategoryCodes = unique(
      ingredientResults.flatMap((item) => item.match.therapeuticCategoryCodes),
    );

    return {
      productId: product.id,
      brandName: product.brandName,
      genericName: ingredientResults.map((item) => item.candidate.genericName).join(" + ") || "",
      canonicalGenericId: firstMatch?.match.canonicalGenericId,
      canonicalGenericName: firstMatch?.match.canonicalGenericName,
      canonicalGenericNormalizedName: firstMatch?.match.canonicalGenericNormalizedName,
      atcCodes,
      therapeuticCategoryCodes,
      matchMode: firstMatch?.match.matchMode || "manual_review",
      matchStatus: hasUnmatched ? "unmatched" : hasAmbiguous ? "ambiguous" : "matched",
      confidenceScore,
      reviewReason: hasUnmatched
        ? "one or more ingredients did not match WHO ATC"
        : hasAmbiguous
          ? "one or more ingredients need manual review"
          : undefined,
    };
  }

  private buildCompositionGroup(
    product: DrapProductRow,
    ingredientResults: Array<{
      candidate: DrapAtcMatchCandidate;
      match: DrapAtcMatchResult;
      genericScore: number;
      composition: DrapProductRow["compositions"][number];
    }>,
  ): DrapCompositionGroupResult {
    const canonicalGenericIds = ingredientResults
      .map((item) => item.match.canonicalGenericId)
      .filter((value): value is string => Boolean(value));

    return buildCompositionGroupResult(
      canonicalGenericIds,
      product.dosageForm || product.normalizedForm || "unknown",
      normalizeDosageForm(product.dosageForm || product.normalizedForm || undefined) || "unknown",
      ingredientResults.map((item) => ({
        productId: product.id,
        canonicalGenericId: item.match.canonicalGenericId || item.composition.generic.id,
        canonicalGenericName: item.match.canonicalGenericName || item.composition.generic.name,
        ingredientOrder: item.composition.ingredientOrder,
        strengthValue: item.composition.strengthText || formatStrength(item.composition.strengthValue, item.composition.strengthUnit),
        strengthUnit: item.composition.strengthUnit || undefined,
      })),
    );
  }

  private async persistMatchResults(
    results: DrapAtcMatchResult[],
    dataQualityFlags: DrapAtcMatchReport["dataQualityFlags"],
  ): Promise<void> {
    if (results.length === 0) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      for (const result of results) {
        const productMatch = await tx.productMatch.create({
          data: {
            sourceProductId: result.productId,
            sourceTable: "products",
            matchStatus:
              result.matchStatus === "matched"
                ? "MATCHED"
                : result.matchStatus === "ambiguous"
                  ? "POSSIBLE_MATCH"
                  : "UNMATCHED",
            brandScore: result.confidenceScore,
            genericScore: result.confidenceScore,
            strengthScore: result.confidenceScore,
            manufacturerScore: result.confidenceScore,
            signatureScore: result.confidenceScore,
            finalConfidence: result.confidenceScore,
            explanation: {
              matchMode: result.matchMode,
              reviewReason: result.reviewReason,
              atcCodes: result.atcCodes,
              therapeuticCategoryCodes: result.therapeuticCategoryCodes,
            } as unknown as Prisma.InputJsonValue,
            sourceType: "ADMIN_IMPORT",
            metadata: {
              atcMatch: result,
            } as unknown as Prisma.InputJsonValue,
          },
        });

        if (result.matchStatus === "ambiguous") {
          await tx.matchReview.create({
            data: {
              productMatchId: productMatch.id,
              reviewStatus: "PENDING",
              reviewNotes: result.reviewReason,
              explanation: result as unknown as Prisma.InputJsonValue,
              sourceType: "ADMIN_REVIEW",
              metadata: {
                atcMatch: result,
              } as unknown as Prisma.InputJsonValue,
            },
          });
        }

      }

      for (const flag of dataQualityFlags) {
        await tx.dataQualityFlag.create({
          data: {
            entityType: flag.entityType,
            entityId: flag.entityId,
            flagType: flag.flagType,
            severity: flag.severity,
            description: flag.description,
            sourceType: "ADMIN_IMPORT",
          },
        });
      }
    });
  }

  private async persistTherapeuticCategories(results: DrapAtcMatchResult[]): Promise<void> {
    const assignments = results
      .filter((result) => result.matchStatus === "matched")
      .flatMap((result) =>
      result.therapeuticCategoryCodes.map((code) => ({
        productId: result.productId,
        categoryCode: code,
        confidenceScore: result.confidenceScore,
      })),
      );

    if (assignments.length === 0) {
      return;
    }

    const categories = await this.prisma.therapeuticCategory.findMany({
      where: {
        code: {
          in: unique(assignments.map((assignment) => assignment.categoryCode)),
        },
      },
    });
    const categoryIdByCode = new Map(categories.map((category) => [category.code, category.id]));

    await this.prisma.$transaction(async (tx) => {
      for (const assignment of assignments) {
        const categoryId = categoryIdByCode.get(assignment.categoryCode);
        if (!categoryId) {
          continue;
        }

        const existing = await tx.productTherapeuticCategory.findUnique({
          where: {
            productId_categoryId: {
              productId: assignment.productId,
              categoryId,
            },
          },
        });

        if (!existing) {
          await tx.productTherapeuticCategory.create({
            data: {
              productId: assignment.productId,
              categoryId,
              primary: false,
              confidenceScore: assignment.confidenceScore,
              sourceType: "ADMIN_IMPORT",
            },
          });
        }
      }
    });
  }

  private async persistCompositionGroups(groups: DrapCompositionGroupResult[]): Promise<void> {
    if (groups.length === 0) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      for (const group of groups) {
        const existing = await tx.compositionGroup.findUnique({
          where: {
            signature: group.signature,
          },
        });

        const compositionGroup =
          existing ||
          (await tx.compositionGroup.create({
            data: {
              signature: group.signature,
              moleculesHash: group.moleculesHash,
              dosageForm: group.dosageForm,
              normalizedDosageForm: group.normalizedDosageForm,
              sourceType: "ADMIN_IMPORT",
            },
          }));

        if (!existing) {
          await tx.compositionGroupComposition.createMany({
            data: group.canonicalGenericIds.map((id, index) => ({
              compositionGroupId: compositionGroup.id,
              genericId: id,
              ingredientOrder: index + 1,
              sourceType: "ADMIN_IMPORT",
              confidenceScore: 1,
            })),
            skipDuplicates: true,
          });
        }
      }
    });
  }
}

function countCsvRows(input: string): number {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return Math.max(0, lines.length - 1);
}

function unique(values: Array<string | undefined | null>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value)))).sort();
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(4));
}

function formatStrength(value?: Prisma.Decimal | null, unit?: string | null): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const amount = String(value);
  return unit ? `${amount} ${unit}` : amount;
}
