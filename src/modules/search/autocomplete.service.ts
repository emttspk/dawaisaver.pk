import {
  AutocompleteDto,
  SearchableProduct,
  SearchPopularitySignal,
  SearchQuery,
  SearchSynonym,
} from "./search.types";
import { normalizeSearchText, similarity } from "./search.service";

export class AutocompleteService {
  autocomplete(
    query: SearchQuery,
    products: SearchableProduct[],
    synonyms: SearchSynonym[] = [],
    popularity: SearchPopularitySignal[] = [],
  ): AutocompleteDto[] {
    const normalized = normalizeSearchText(query.q);
    const suggestions = new Map<string, AutocompleteDto>();

    for (const product of products) {
      this.addSuggestion(suggestions, normalized, product.brandName, "brand", product.id, popularity);
      this.addSuggestion(suggestions, normalized, product.genericName, "generic", product.id, popularity);
      this.addSuggestion(suggestions, normalized, product.manufacturer, "manufacturer", product.id, popularity);
      this.addSuggestion(suggestions, normalized, product.medicineSignature, "signature", product.id, popularity);
      this.addSuggestion(suggestions, normalized, product.registrationNumber, "registration_number", product.id, popularity);
      for (const alias of product.aliases || []) {
        this.addSuggestion(suggestions, normalized, alias, "brand", product.id, popularity);
      }
    }

    for (const synonym of synonyms) {
      const term = normalizeSearchText(synonym.term);
      const synonymText = normalizeSearchText(synonym.synonym);
      if (term.includes(normalized) || synonymText.includes(normalized) || similarity(normalized, term) >= 0.72) {
        this.upsert(suggestions, synonym.synonym, {
          suggestion: synonym.synonym,
          suggestionType: "generic",
          score: 0.82,
        });
      }
    }

    return Array.from(suggestions.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, query.limit || 10);
  }

  private addSuggestion(
    suggestions: Map<string, AutocompleteDto>,
    query: string,
    value: string | undefined,
    suggestionType: AutocompleteDto["suggestionType"],
    entityId: string,
    popularity: SearchPopularitySignal[],
  ): void {
    if (!value) {
      return;
    }
    const normalizedValue = normalizeSearchText(value);
    const sim = similarity(query, normalizedValue);
    if (!normalizedValue.startsWith(query) && !normalizedValue.includes(query) && sim < 0.72) {
      return;
    }

    const boost = (popularity.find((item) => item.normalizedQuery === normalizedValue)?.trendingScore || 0) / 100;
    this.upsert(suggestions, value, {
      suggestion: value,
      suggestionType,
      entityId,
      score: Math.min(1, sim + boost * 0.1),
    });
  }

  private upsert(
    suggestions: Map<string, AutocompleteDto>,
    key: string,
    value: AutocompleteDto,
  ): void {
    const normalizedKey = normalizeSearchText(key);
    const existing = suggestions.get(normalizedKey);
    if (!existing || existing.score < value.score) {
      suggestions.set(normalizedKey, value);
    }
  }
}

