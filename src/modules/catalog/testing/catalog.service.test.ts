import { CatalogService } from "../catalog.service";
import { mapImportBatchItemToCatalogRecord } from "../catalog.mapper";

describe("Catalog mapper", () => {
  it("maps normalized DRAP rows into catalog source records", () => {
    const result = mapImportBatchItemToCatalogRecord({
      id: "item-1",
      importBatchId: "batch-1",
      rowNumber: 1,
      sourceType: "DRAP",
      sourceUrl: "https://example.test/item-1",
      rawData: {},
      normalizedData: {
        rowNumber: 1,
        raw: {},
        brandName: "Panadol",
        normalizedBrandName: "panadol",
        genericName: "Paracetamol",
        normalizedGenericName: "paracetamol",
        strengthText: "500 mg",
        normalizedStrength: "500_mg",
        dosageForm: "Tablet",
        normalizedDosageForm: "tablet",
        manufacturerName: "GlaxoSmithKline",
        normalizedManufacturerName: "glaxosmithkline",
        registrationNumber: "REG-1",
        packSize: "10 tablets",
        medicineSignature: "paracetamol_500_mg_tablet",
        confidenceScore: 0.98,
        sourceUrl: "https://example.test/item-1",
      },
      createdAt: new Date(),
    });

    expect(result.issues).toHaveLength(0);
    expect(result.record).toMatchObject({
      sourceTable: "import_batch_items",
      sourceRecordId: "item-1",
      manufacturerName: "GlaxoSmithKline",
      normalizedManufacturerName: "glaxosmithkline",
      brandName: "Panadol",
      normalizedBrandName: "panadol",
      genericName: "Paracetamol",
      normalizedGenericName: "paracetamol",
      medicineSignature: "paracetamol_500_mg_tablet",
    });
  });

  it("maps mirror parsed rows into catalog source records", () => {
    const result = mapImportBatchItemToCatalogRecord({
      id: "item-2",
      importBatchId: "batch-1",
      rowNumber: 2,
      sourceType: "DRAP",
      sourceUrl: "https://example.test/item-2",
      rawData: {},
      normalizedData: {
        registrationNumber: "REG-2",
        brandName: "Augmentin",
        dosageForm: "Tablet",
        compositionRows: [
          { genericName: "Amoxicillin", strength: "500", unit: "mg" },
          { genericName: "Clavulanic Acid", strength: "125", unit: "mg" },
        ],
        manufacturer: "GSK",
        packSize: "14 tablets",
        rawHtmlUrl: "https://example.test/raw-2",
      },
      createdAt: new Date(),
    });

    expect(result.issues).toHaveLength(0);
    expect(result.record?.compositions).toHaveLength(2);
    expect(result.record).toMatchObject({
      sourceRecordId: "item-2",
      manufacturerName: "GSK",
      brandName: "Augmentin",
      registrationNumber: "REG-2",
      dosageForm: "Tablet",
    });
  });
});

describe("Catalog verification", () => {
  it("summarizes table counts and integrity signals", async () => {
    const prismaMock = {
      manufacturer: { count: jest.fn().mockResolvedValue(4) },
      generic: { count: jest.fn().mockResolvedValue(8) },
      product: { count: jest.fn().mockResolvedValue(12) },
      productComposition: { count: jest.fn().mockResolvedValue(24) },
      canonicalProduct: { count: jest.fn().mockResolvedValue(6) },
      canonicalProductAlias: { count: jest.fn().mockResolvedValue(18) },
      catalogBuildJob: {
        findFirst: jest.fn().mockResolvedValue({
          id: "job-1",
          status: "COMPLETED",
          phase: "CANONICAL_PRODUCTS",
          startedAt: new Date("2026-06-19T00:00:00.000Z"),
          finishedAt: new Date("2026-06-19T01:00:00.000Z"),
        }),
      },
    };

    const service = new CatalogService(prismaMock as never);
    const report = await service.verifyCatalog();

    expect(report.counts).toMatchObject({
      manufacturers: 4,
      generics: 8,
      products: 12,
      productCompositions: 24,
      canonicalProducts: 6,
      canonicalAliases: 18,
    });
    expect(report.integrity).toMatchObject({
      productsWithManufacturer: 12,
      productsWithComposition: 12,
      canonicalProductsWithAliases: 6,
      canonicalProductsWithProducts: 6,
    });
    expect(report.latestRun).toMatchObject({
      jobId: "job-1",
      status: "COMPLETED",
      phase: "CANONICAL_PRODUCTS",
    });
  });
});
