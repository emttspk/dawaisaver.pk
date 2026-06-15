import { DrapNormalizer } from "./drap.normalizer";
import {
  DrapImportErrorDto,
  DrapImportItemStatus,
  DrapImportStatisticsDto,
  DrapImportSummaryDto,
  DrapNormalizedRecord,
  DrapPrismaClient,
  DrapRawRecord,
  DrapSourceConfig,
  DrapValidatedRecord,
  DrapValidationResult,
} from "./drap.types";

export class DrapImporter {
  private readonly normalizer = new DrapNormalizer();

  constructor(private readonly prisma: DrapPrismaClient) {}

  async import(config: DrapSourceConfig): Promise<DrapImportSummaryDto> {
    const startedAt = new Date();
    const sourceType = config.sourceType || "DRAP";
    const payload = await this.fetch(config);
    const rawRecords = await this.parse(config, payload);
    const normalizedRecords = this.normalizer.normalizeRecords(rawRecords);
    const validations = this.validate(normalizedRecords);
    const validRecords = normalizedRecords
      .map((record): DrapValidatedRecord => ({
        ...record,
        validation: validations.find((item) => item.rowNumber === record.rowNumber)!,
      }))
      .filter((record) => record.validation.valid);
    const errors = validations.flatMap((result) => result.errors);

    const batch = await this.prisma.importBatch.create({
      data: {
        sourceType,
        sourceUrl: config.sourceUrl,
        fileName: config.fileName,
        adapterType: config.adapterType,
        status: "RUNNING",
        totalRows: rawRecords.length,
        validRows: validRecords.length,
        invalidRows: errors.length,
        startedAt,
        confidenceScore: averageConfidence(normalizedRecords),
        metadata: config.metadata || {},
      },
    });

    const statistics = emptyStatistics();
    let savedRows = 0;
    let duplicateRows = 0;

    for (const record of normalizedRecords) {
      const validation = validations.find((item) => item.rowNumber === record.rowNumber)!;

      if (!validation.valid) {
        await this.saveImportItem(batch.id, record, "FAILED", sourceType, config.sourceUrl, validation);
        for (const error of validation.errors) {
          await this.saveImportError(batch.id, sourceType, config.sourceUrl, error);
        }
        continue;
      }

      const saveResult = await this.saveRecord(record, sourceType, config.sourceUrl, statistics);
      savedRows += saveResult.saved ? 1 : 0;
      duplicateRows += saveResult.duplicate ? 1 : 0;

      await this.saveImportItem(
        batch.id,
        record,
        saveResult.duplicate ? "DUPLICATE" : "SAVED",
        sourceType,
        config.sourceUrl,
        validation,
        saveResult.productId,
        saveResult.manufacturerId,
      );
    }

    const status = errors.length > 0 ? "COMPLETED_WITH_ERRORS" : "COMPLETED";
    const summary: DrapImportSummaryDto = {
      batchId: batch.id,
      status,
      adapterType: config.adapterType,
      sourceType,
      sourceUrl: config.sourceUrl,
      totalRows: rawRecords.length,
      validRows: validRecords.length,
      invalidRows: errors.length,
      duplicateRows,
      savedRows,
      errors,
      statistics: {
        ...statistics,
        duplicateRows,
      },
    };

    await this.prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status,
        duplicateRows,
        savedRows,
        finishedAt: new Date(),
        importReport: {
          summary,
          startedAt: startedAt.toISOString(),
          finishedAt: new Date().toISOString(),
        },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: "IMPORT",
        entityType: "import_batches",
        entityId: batch.id,
        reason: "DRAP import completed",
        status: "ACTIVE",
        sourceType,
        sourceUrl: config.sourceUrl,
        confidenceScore: averageConfidence(normalizedRecords),
        afterData: summary,
      },
    });

    return summary;
  }

  async fetch(config: DrapSourceConfig): Promise<string | Buffer> {
    if (config.fetcher) {
      return config.fetcher();
    }

    if (config.content) {
      return config.content;
    }

    throw new Error("DRAP source config requires content or fetcher.");
  }

  async parse(
    config: DrapSourceConfig,
    payload: string | Buffer,
  ): Promise<DrapRawRecord[]> {
    if (config.parser) {
      return config.parser(payload);
    }

    if (config.adapterType === "csv") {
      return parseCsv(String(payload));
    }

    if (config.adapterType === "html-table") {
      return parseHtmlTable(String(payload));
    }

    if (config.adapterType === "excel") {
      throw new Error(
        "Excel parsing requires an injected parser until the xlsx dependency is installed.",
      );
    }

    if (config.adapterType === "api") {
      return JSON.parse(String(payload)) as DrapRawRecord[];
    }

    throw new Error(`Unsupported DRAP adapter type: ${config.adapterType}`);
  }

  validate(records: DrapNormalizedRecord[]): DrapValidationResult[] {
    return records.map((record) => {
      const errors: DrapImportErrorDto[] = [];

      if (!record.normalizedBrandName) {
        errors.push({
          rowNumber: record.rowNumber,
          errorCode: "MISSING_BRAND_NAME",
          errorMessage: "Brand name is required.",
          rawData: record.raw,
        });
      }

      if (!record.normalizedGenericName) {
        errors.push({
          rowNumber: record.rowNumber,
          errorCode: "MISSING_GENERIC_NAME",
          errorMessage: "Generic name is required.",
          rawData: record.raw,
        });
      }

      if (!record.normalizedManufacturerName) {
        errors.push({
          rowNumber: record.rowNumber,
          errorCode: "MISSING_MANUFACTURER",
          errorMessage: "Manufacturer is required.",
          rawData: record.raw,
        });
      }

      if (!record.medicineSignature) {
        errors.push({
          rowNumber: record.rowNumber,
          errorCode: "MISSING_MEDICINE_SIGNATURE",
          errorMessage: "Medicine signature could not be generated.",
          rawData: record.raw,
        });
      }

      return {
        rowNumber: record.rowNumber,
        valid: errors.length === 0,
        errors,
      };
    });
  }

  private async saveRecord(
    record: DrapNormalizedRecord,
    sourceType: string,
    sourceUrl: string | undefined,
    statistics: DrapImportStatisticsDto,
  ): Promise<{ saved: boolean; duplicate: boolean; productId?: string; manufacturerId?: string }> {
    return this.prisma.$transaction(async (tx) => {
      let manufacturer = await tx.manufacturer.findFirst({
        where: {
          normalizedName: record.normalizedManufacturerName,
          deletedAt: null,
        },
      });

      if (manufacturer) {
        statistics.manufacturersReused += 1;
      } else {
        manufacturer = await tx.manufacturer.create({
          data: {
            name: record.manufacturerName,
            normalizedName: record.normalizedManufacturerName,
            status: "PENDING_REVIEW",
            confidenceScore: record.confidenceScore,
            sourceType,
            sourceUrl: sourceUrl || record.sourceUrl,
          },
        });
        statistics.manufacturersCreated += 1;
      }

      let generic = await tx.generic.findUnique({
        where: { normalizedName: record.normalizedGenericName },
      });

      if (generic) {
        statistics.genericsReused += 1;
      } else {
        generic = await tx.generic.create({
          data: {
            name: record.genericName,
            normalizedName: record.normalizedGenericName,
            status: "PENDING_REVIEW",
            confidenceScore: record.confidenceScore,
            sourceType,
            sourceUrl: sourceUrl || record.sourceUrl,
          },
        });
        statistics.genericsCreated += 1;
      }

      const existingProduct = await tx.product.findFirst({
        where: {
          OR: [
            record.registrationNumber
              ? { registrationNumber: record.registrationNumber }
              : undefined,
            {
              signature: record.medicineSignature,
              manufacturerId: manufacturer.id,
              normalizedBrand: record.normalizedBrandName,
            },
          ].filter(Boolean),
          deletedAt: null,
        },
      });

      const productData = {
        manufacturerId: manufacturer.id,
        brandName: record.brandName,
        normalizedBrand: record.normalizedBrandName,
        displayName: record.brandName,
        dosageForm: record.dosageForm,
        normalizedForm: record.normalizedDosageForm,
        strengthText: record.strengthText,
        packSize: record.packSize,
        registrationNumber: record.registrationNumber,
        signature: record.medicineSignature,
        status: "PENDING_REVIEW",
        confidenceScore: record.confidenceScore,
        sourceType,
        sourceUrl: sourceUrl || record.sourceUrl,
        metadata: {
          drap: record.raw,
        },
      };

      const product = existingProduct
        ? await tx.product.update({
            where: { id: existingProduct.id },
            data: productData,
          })
        : await tx.product.create({ data: productData });

      if (existingProduct) {
        statistics.productsUpdated += 1;
      } else {
        statistics.productsCreated += 1;
      }

      const existingComposition = await tx.productComposition.findFirst({
        where: {
          productId: product.id,
          genericId: generic.id,
          ingredientOrder: 1,
        },
      });

      if (!existingComposition) {
        await tx.productComposition.create({
          data: {
            productId: product.id,
            genericId: generic.id,
            ingredientOrder: 1,
            strengthValue: record.strengthValue,
            strengthUnit: record.strengthUnit,
            strengthText: record.strengthText,
            status: "PENDING_REVIEW",
            confidenceScore: record.confidenceScore,
            sourceType,
            sourceUrl: sourceUrl || record.sourceUrl,
          },
        });
        statistics.compositionsCreated += 1;
      }

      return {
        saved: true,
        duplicate: Boolean(existingProduct),
        productId: product.id,
        manufacturerId: manufacturer.id,
      };
    });
  }

  private async saveImportItem(
    batchId: string,
    record: DrapNormalizedRecord,
    status: DrapImportItemStatus,
    sourceType: string,
    sourceUrl?: string,
    validation?: DrapValidationResult,
    productId?: string,
    manufacturerId?: string,
  ): Promise<void> {
    await this.prisma.importBatchItem.create({
      data: {
        importBatchId: batchId,
        rowNumber: record.rowNumber,
        rawData: record.raw,
        normalizedData: record,
        validationData: validation,
        status,
        productId,
        manufacturerId,
        confidenceScore: record.confidenceScore,
        sourceType,
        sourceUrl: sourceUrl || record.sourceUrl,
      },
    });
  }

  private async saveImportError(
    batchId: string,
    sourceType: string,
    sourceUrl: string | undefined,
    error: DrapImportErrorDto,
  ): Promise<void> {
    await this.prisma.importError.create({
      data: {
        importBatchId: batchId,
        rowNumber: error.rowNumber,
        errorCode: error.errorCode,
        errorMessage: error.errorMessage,
        rawData: error.rawData,
        status: "ACTIVE",
        sourceType,
        sourceUrl,
      },
    });
  }
}

export function parseCsv(input: string): DrapRawRecord[] {
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
    return headers.reduce<DrapRawRecord>((record, header, index) => {
      record[header] = values[index] || "";
      return record;
    }, {});
  });
}

export function parseHtmlTable(input: string): DrapRawRecord[] {
  const rowMatches = input.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  const rows = rowMatches.map((row) =>
    (row.match(/<t[dh][\s\S]*?<\/t[dh]>/gi) || []).map((cell) =>
      cell.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    ),
  );

  if (rows.length < 2) {
    return [];
  }

  const headers = rows[0];
  return rows.slice(1).map((values) =>
    headers.reduce<DrapRawRecord>((record, header, index) => {
      record[header] = values[index] || "";
      return record;
    }, {}),
  );
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

function emptyStatistics(): DrapImportStatisticsDto {
  return {
    manufacturersCreated: 0,
    manufacturersReused: 0,
    genericsCreated: 0,
    genericsReused: 0,
    productsCreated: 0,
    productsUpdated: 0,
    compositionsCreated: 0,
    duplicateRows: 0,
  };
}

function averageConfidence(records: Array<{ confidenceScore: number }>): number {
  if (records.length === 0) {
    return 0;
  }

  const total = records.reduce((sum, record) => sum + record.confidenceScore, 0);
  return Number((total / records.length).toFixed(4));
}
