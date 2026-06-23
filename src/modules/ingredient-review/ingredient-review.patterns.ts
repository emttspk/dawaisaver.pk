import { normalizeGenericName, normalizeKey } from "../atc/molecule-normalizer.service";
import { IngredientPatternClass, IngredientReviewLane } from "./ingredient-review.types";

const DESCRIPTOR_PATTERNS = [
  /enteric coated/i,
  /sterile/i,
  /buffered/i,
  /pellets?/i,
  /% w\/w/i,
  /\bqs\b/i,
  /\bcontains?\b/i,
  /in vivo release rate/i,
  /adsorbed on/i,
  /qs/i,
];

const EQ_TO_PATTERNS = [
  /\beq\.?\s*to\b/i,
  /\beq to\b/i,
  /\bequivalent to\b/i,
  /\bcorresponding to\b/i,
];

const COMBINATION_PATTERNS = [/\+/, /\band\b/i, /\bwith\b/i];

const SALT_PATTERNS: Array<{ pattern: RegExp; label: IngredientPatternClass }> = [
  { pattern: /hydrochloride|\bhcl\b/i, label: "hydrochloride" },
  { pattern: /monohydrate|dihydrate|trihydrate|pentahydrate|hydrate/i, label: "hydrate" },
  { pattern: /mesylate|mesilate/i, label: "mesylate" },
  { pattern: /fumarate|hydrogen fumarate/i, label: "fumarate" },
  { pattern: /potassium/i, label: "potassium_salt" },
  { pattern: /sodium/i, label: "sodium_salt" },
  { pattern: /chloride|bromide|sulfate|sulphate|tartrate|succinate|oxalate|besylate|xinafoate/i, label: "salt_variant" },
];

export function normalizeIngredientText(value: string): string {
  return normalizeGenericName(value);
}

export function classifyIngredientPattern(value: string): IngredientPatternClass {
  const text = normalizeKey(value);

  if (!text || /^[\W_]+$/.test(text)) {
    return "descriptor_noise";
  }

  if (EQ_TO_PATTERNS.some((pattern) => pattern.test(text))) {
    return "eq_to";
  }

  if (COMBINATION_PATTERNS.some((pattern) => pattern.test(text))) {
    return "combination_product";
  }

  if (DESCRIPTOR_PATTERNS.some((pattern) => pattern.test(text))) {
    return "descriptor_noise";
  }

  for (const item of SALT_PATTERNS) {
    if (item.pattern.test(text)) {
      return item.label;
    }
  }

  const compact = text.replace(/\s+/g, "");
  if (compact.length > 0 && looksLikeSpellingVariant(text, compact)) {
    return "spelling_variant";
  }

  return "exact_normalization";
}

export function classifyReviewLane(confidenceScore: number): IngredientReviewLane {
  if (confidenceScore >= 0.95) {
    return "AUTO_APPROVE";
  }

  if (confidenceScore >= 0.8) {
    return "REVIEW_REQUIRED";
  }

  return "MANUAL_REVIEW";
}

export function scoreIngredientConfidence(params: {
  patternClass: IngredientPatternClass;
  matchedBy: "generic" | "ingredient_alias" | "molecule_alias" | "heuristic" | "manual";
}): number {
  if (params.matchedBy === "generic") {
    return 0.99;
  }

  if (params.matchedBy === "ingredient_alias") {
    return 0.985;
  }

  if (params.matchedBy === "molecule_alias") {
    return 0.975;
  }

  if (params.matchedBy === "heuristic") {
    switch (params.patternClass) {
      case "eq_to":
      case "salt_variant":
      case "hydrochloride":
      case "sodium_salt":
      case "potassium_salt":
      case "mesylate":
      case "fumarate":
      case "hydrate":
      case "combination_product":
        return 0.96;
      case "spelling_variant":
        return 0.92;
      case "descriptor_noise":
        return 0.86;
      default:
        return 0.9;
    }
  }

  return 0.35;
}

function looksLikeSpellingVariant(normalizedText: string, compactText: string): boolean {
  if (!normalizedText || compactText.length < 4) {
    return false;
  }

  return /[a-z]{3,}/.test(compactText) && /[0-9]/.test(normalizedText) === false && normalizedText.split(" ").length <= 4;
}
