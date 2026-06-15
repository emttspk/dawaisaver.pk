import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";
import { AutocompleteRequestDto, SearchRequestDto, TrendingRequestDto } from "../src/modules/search/dto/search-requests.dto";
import { PriceAnalyticsQueryDto } from "../src/modules/price-intelligence/dto/price-analytics.dto";
import { MatchingEvaluateDto } from "../src/modules/matching/dto/matching-evaluate.dto";
import { SourceSyncRequestDto } from "../src/modules/sources/dto/source-sync.dto";
import { DrapImportRequestDto } from "../src/modules/drap/dto/drap-import.dto";
import { DiscoveryReviewRequestDto } from "../src/modules/discovery/dto/discovery-requests.dto";

function isValid<T extends object>(Dto: new () => T, payload: Record<string, unknown>): boolean {
  const instance = plainToInstance(Dto, payload);
  return validateSync(instance as object).length === 0;
}

describe("API DTO validation", () => {
  it("accepts valid search requests", () => {
    expect(isValid(SearchRequestDto, { q: "Augmentin", city: "Karachi", limit: 10 })).toBe(true);
    expect(isValid(AutocompleteRequestDto, { q: "aug" })).toBe(true);
    expect(isValid(TrendingRequestDto, { limit: 20 })).toBe(true);
  });

  it("accepts price analytics queries", () => {
    expect(isValid(PriceAnalyticsQueryDto, { windowDays: 30, includeChanges: true, includeAnomalies: false })).toBe(true);
  });

  it("accepts matching and import DTOs", () => {
    expect(
      isValid(MatchingEvaluateDto, {
        brandName: "Augmentin",
        genericName: "Amoxicillin + Clavulanic Acid",
      }),
    ).toBe(true);
    expect(isValid(SourceSyncRequestDto, { providerCode: "dawaai" })).toBe(true);
    expect(isValid(DrapImportRequestDto, { adapterType: "csv", content: "brand_name,generic_name" })).toBe(true);
    expect(isValid(DiscoveryReviewRequestDto, { candidateId: "2f8b7ed2-4d0d-4f42-bf3a-6a0e9f0c9caa", decision: "approve" })).toBe(true);
  });

  it("rejects malformed payloads", () => {
    expect(isValid(SearchRequestDto, { city: "Karachi" })).toBe(false);
    expect(isValid(MatchingEvaluateDto, { canonicalProductId: "not-a-uuid" })).toBe(false);
  });
});
