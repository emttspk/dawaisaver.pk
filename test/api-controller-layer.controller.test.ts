import { strict as assert } from "node:assert";
import { SearchController } from "../src/modules/search/controllers/search.controller";
import { PriceIntelligenceController } from "../src/modules/price-intelligence/controllers/price-intelligence.controller";
import { MatchingController } from "../src/modules/matching/controllers/matching.controller";
import { SourcesController } from "../src/modules/sources/controllers/sources.controller";
import { DrapImportController } from "../src/modules/drap/controllers/drap-import.controller";
import { DiscoveryReviewController } from "../src/modules/discovery/controllers/discovery-review.controller";
import { DrapService } from "../src/modules/drap/drap.service";

describe("API controller layer", () => {
  it("wraps search queries over the existing engine services", async () => {
    const prisma = {
      product: { findMany: jest.fn().mockResolvedValue([]) },
      searchPopularity: { findMany: jest.fn().mockResolvedValue([]) },
      searchSynonym: { findMany: jest.fn().mockResolvedValue([]) },
      searchLog: { create: jest.fn().mockResolvedValue({}) },
    } as any;

    const controller = new SearchController(prisma);
    const result = await controller.searchAll({ q: "Augmentin", limit: 10 });

    assert.deepEqual(result, []);
    assert.equal(prisma.searchLog.create.mock.calls.length, 1);
  });

  it("returns price intelligence for an empty snapshot set", async () => {
    const prisma = {
      priceSnapshot: { findMany: jest.fn().mockResolvedValue([]) },
    } as any;

    const controller = new PriceIntelligenceController(prisma);
    const result = await controller.getProductStatistics({ id: "2f8b7ed2-4d0d-4f42-bf3a-6a0e9f0c9caa" }, {});

    assert.equal(result.productId, "2f8b7ed2-4d0d-4f42-bf3a-6a0e9f0c9caa");
    assert.equal(result.snapshotsCount, 0);
  });

  it("evaluates matching candidates against canonical medicine data", async () => {
    const prisma = {
      canonicalProduct: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    } as any;

    const controller = new MatchingController(prisma);
    const result = await controller.evaluate({
      brandName: "Augmentin",
      genericName: "Amoxicillin + Clavulanic Acid",
      strength: "625mg",
      dosageForm: "Tablet",
      manufacturer: "GSK Pakistan",
      medicineSignature: "amoxicillin_clavulanic_acid_625mg_tablet",
    });

    assert.equal(result.status, "unmatched");
    assert.equal(result.confidence, 0);
  });

  it("returns source health summaries", async () => {
    const prisma = {
      sourceProvider: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    } as any;

    const controller = new SourcesController(prisma);
    const result = await controller.health();

    assert.deepEqual(result, []);
  });

  it("applies DRAP import orchestration through the importer", async () => {
    const importSpy = jest
      .spyOn(DrapService.prototype, "importFromSource")
      .mockResolvedValue({
        status: "COMPLETED",
        adapterType: "csv",
        sourceType: "DRAP",
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        duplicateRows: 0,
        savedRows: 0,
        errors: [],
        statistics: {
          manufacturersCreated: 0,
          manufacturersReused: 0,
          genericsCreated: 0,
          genericsReused: 0,
          productsCreated: 0,
          productsUpdated: 0,
          compositionsCreated: 0,
          duplicateRows: 0,
        },
      } as any);

    const prisma = {} as any;
    const controller = new DrapImportController(prisma);
    const result = await controller.import({
      adapterType: "csv",
      sourceType: "DRAP",
      sourceUrl: "https://example.com/drap.csv",
      fileName: "drap.csv",
      content: "brand_name,generic_name",
    });

    assert.equal(result.status, "COMPLETED");
    expect(importSpy).toHaveBeenCalledTimes(1);
  });

  it("applies discovery reviews and persists the review workflow", async () => {
    const prisma = {
      discoveryCandidate: {
        findUnique: jest.fn().mockResolvedValue({
          id: "candidate-1",
          candidateName: "Augmentin",
          normalizedBrand: "augmentin",
          normalizedGeneric: "amoxicillin clavulanic acid",
          normalizedStrength: "625mg",
          normalizedDosageForm: "tablet",
          normalizedManufacturer: "gsk",
          medicineSignature: "amoxicillin_clavulanic_acid_625mg_tablet",
          registrationNumber: "R-1",
          packSize: "10 tablets",
          discoveryStatus: "NEW",
          sourceConfidence: 0.9,
          matchingConfidence: 0.8,
          evidenceConfidence: 0.7,
          overallConfidence: 0.8,
          duplicateOfProductId: null,
          duplicateOfCanonicalProductId: null,
          metadata: {},
          evidence: [],
          reviews: [],
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      discoveryReview: {
        create: jest.fn().mockResolvedValue({}),
      },
    } as any;

    const controller = new DiscoveryReviewController(prisma);
    const result = await controller.review({
      candidateId: "candidate-1",
      decision: "approve",
      reviewNotes: "Looks good.",
    });

    assert.equal(result.discoveryStatus, "approved");
    assert.equal(prisma.discoveryReview.create.mock.calls.length, 1);
    assert.equal(prisma.discoveryCandidate.update.mock.calls.length, 1);
  });
});
