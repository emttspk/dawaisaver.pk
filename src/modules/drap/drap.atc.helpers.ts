import { textSimilarity } from "../matching/brand-matcher.service";
import {
  DrapAtcMatchCandidate,
  DrapAtcMatchMode,
  DrapAtcMatchResult,
  DrapCompositionGroupResult,
} from "./drap.types";

export interface WhoMoleculeRecord {
  id: string;
  name: string;
  normalizedName: string;
  aliases: Array<{
    aliasName: string;
    normalizedAliasName: string;
  }>;
  atcCodes: string[];
  therapeuticCategoryCodes: string[];
}

export interface DrapCompositionIngredient {
  productId: string;
  canonicalGenericId: string;
  canonicalGenericName: string;
  ingredientOrder: number;
  strengthValue?: string | null;
  strengthUnit?: string | null;
}

export function matchDrapCandidate(
  candidate: DrapAtcMatchCandidate,
  molecules: WhoMoleculeRecord[],
): DrapAtcMatchResult {
  const exact = molecules.find(
    (molecule) => normalizeLookup(molecule.normalizedName) === normalizeLookup(candidate.normalizedGenericName),
  );
  if (exact) {
    return buildMatchResult(candidate, exact, "exact_canonical", 1);
  }

  const aliasMatches = molecules.filter((molecule) =>
    molecule.aliases.some(
      (alias) => normalizeLookup(alias.normalizedAliasName) === normalizeLookup(candidate.normalizedGenericName),
    ),
  );

  if (aliasMatches.length === 1) {
    return buildMatchResult(candidate, aliasMatches[0], "alias_match", 0.95);
  }

  if (aliasMatches.length > 1) {
    return buildAmbiguousResult(candidate, aliasMatches, "alias_match");
  }

  const ranked = molecules
    .map((molecule) => ({
      molecule,
      score: textSimilarity(candidate.normalizedGenericName, molecule.normalizedName),
    }))
    .sort((left, right) => right.score - left.score);

  const top = ranked[0];
  const second = ranked[1];

  if (top && top.score >= 0.8 && (!second || top.score - second.score >= 0.08)) {
    return buildMatchResult(candidate, top.molecule, "normalized_match", 0.8);
  }

  if (top && top.score >= 0.55) {
    return {
      ...buildMatchResult(candidate, top.molecule, "manual_review", roundConfidence(top.score)),
      matchStatus: "ambiguous",
      reviewReason: "normalized similarity requires manual review",
    };
  }

  return {
    productId: candidate.productId,
    brandName: candidate.brandName,
    genericName: candidate.genericName,
    atcCodes: [],
    therapeuticCategoryCodes: [],
    matchMode: "manual_review",
    matchStatus: "unmatched",
    confidenceScore: roundConfidence(top?.score || 0),
    reviewReason: "no WHO ATC molecule match found",
  };
}

export function buildCompositionGroupResult(
  canonicalGenericIds: string[],
  dosageForm: string,
  normalizedDosageForm: string,
  ingredients: DrapCompositionIngredient[],
): DrapCompositionGroupResult {
  const sortedIngredients = [...ingredients].sort((left, right) => {
    if (left.ingredientOrder !== right.ingredientOrder) {
      return left.ingredientOrder - right.ingredientOrder;
    }
    return left.canonicalGenericName.localeCompare(right.canonicalGenericName);
  });

  const signature = [
    ...sortedIngredients.map((ingredient) =>
      [
        ingredient.canonicalGenericName,
        ingredient.strengthValue || "",
        ingredient.strengthUnit || "",
      ]
        .filter(Boolean)
        .join(":"),
    ),
    `dosage_form=${normalizedDosageForm}`,
  ].join("|");

  const moleculesHash = [
    ...sortedIngredients.map((ingredient) =>
      [
        ingredient.canonicalGenericId,
        ingredient.strengthValue || "",
        ingredient.strengthUnit || "",
      ]
        .filter(Boolean)
        .join(":"),
    ),
    normalizedDosageForm,
  ].join("|");

  return {
    signature,
    moleculesHash,
    dosageForm,
    normalizedDosageForm,
    productIds: sortedIngredients.map((ingredient) => ingredient.productId),
    canonicalGenericIds: canonicalGenericIds.length
      ? canonicalGenericIds
      : sortedIngredients.map((ingredient) => ingredient.canonicalGenericId),
  };
}

function buildMatchResult(
  candidate: DrapAtcMatchCandidate,
  molecule: WhoMoleculeRecord,
  matchMode: DrapAtcMatchMode,
  confidenceScore: number,
): DrapAtcMatchResult {
  return {
    productId: candidate.productId,
    brandName: candidate.brandName,
    genericName: candidate.genericName,
    canonicalGenericId: molecule.id,
    canonicalGenericName: molecule.name,
    canonicalGenericNormalizedName: molecule.normalizedName,
    atcCodes: molecule.atcCodes,
    therapeuticCategoryCodes: molecule.therapeuticCategoryCodes,
    matchMode,
    matchStatus: matchMode === "manual_review" ? "ambiguous" : "matched",
    confidenceScore: roundConfidence(confidenceScore),
  };
}

function buildAmbiguousResult(
  candidate: DrapAtcMatchCandidate,
  molecules: WhoMoleculeRecord[],
  matchMode: DrapAtcMatchMode,
): DrapAtcMatchResult {
  const top = molecules[0];

  return {
    productId: candidate.productId,
    brandName: candidate.brandName,
    genericName: candidate.genericName,
    canonicalGenericId: top?.id,
    canonicalGenericName: top?.name,
    canonicalGenericNormalizedName: top?.normalizedName,
    atcCodes: top?.atcCodes || [],
    therapeuticCategoryCodes: top?.therapeuticCategoryCodes || [],
    matchMode,
    matchStatus: "ambiguous",
    confidenceScore: 0.8,
    reviewReason: "multiple WHO ATC molecules matched the generic name",
  };
}

function roundConfidence(value: number): number {
  return Math.max(0, Math.min(1, Math.round(value * 100) / 100));
}

function normalizeLookup(value: string): string {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
