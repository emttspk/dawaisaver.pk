import { textSimilarity } from "./brand-matcher.service";

export class GenericMatcherService {
  matchGeneric(source?: string, canonical?: string): number {
    if (!source || !canonical) {
      return 0;
    }

    const sourceIngredients = ingredients(source);
    const canonicalIngredients = ingredients(canonical);
    const intersection = sourceIngredients.filter((item) => canonicalIngredients.includes(item)).length;
    const union = new Set([...sourceIngredients, ...canonicalIngredients]).size;
    const ingredientScore = union === 0 ? 0 : intersection / union;

    return Math.max(ingredientScore, textSimilarity(source, canonical));
  }
}

function ingredients(value: string): string[] {
  return value
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .sort();
}

