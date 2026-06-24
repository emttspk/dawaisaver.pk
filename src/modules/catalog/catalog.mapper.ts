import {
  generateMedicineSignature,
  normalizeBrandName,
  normalizeDosageForm,
  normalizeGenericName,
  normalizeManufacturer,
  normalizeStrength,
} from "../drap/drap.normalizer";
import { DrapMirrorParsedRecord, DrapNormalizedRecord } from "../drap/drap.types";
import { CatalogCompositionInput, CatalogSourceRecord, CatalogValidationIssue } from "./catalog.types";

interface ImportBatchItemLike {
  id: string;
  importBatchId: string;
  rowNumber: number;
  sourceType: string;
  sourceUrl?: string | null;
  rawData: unknown;
  normalizedData: unknown;
  createdAt: Date;
}

export function mapImportBatchItemToCatalogRecord(item: ImportBatchItemLike): {
  record?: CatalogSourceRecord;
  issues: CatalogValidationIssue[];
} {
  const normalized = toRecord(item.normalizedData);

  if (looksLikeDrapNormalizedRecord(normalized)) {
    return mapDrapNormalizedRecord(item, normalized as DrapNormalizedRecord);
  }

  if (looksLikeDrapMirrorParsedRecord(normalized)) {
    return mapDrapMirrorParsedRecord(item, normalized as DrapMirrorParsedRecord);
  }

  return {
    issues: [
      {
        scope: "import_item",
        code: "UNSUPPORTED_NORMALIZED_SHAPE",
        message: "Import batch item does not contain a supported medicine payload.",
        importBatchId: item.importBatchId,
        importBatchItemId: item.id,
        rowNumber: item.rowNumber,
      },
    ],
  };
}

function mapDrapNormalizedRecord(
  item: ImportBatchItemLike,
  record: DrapNormalizedRecord,
): { record?: CatalogSourceRecord; issues: CatalogValidationIssue[] } {
  const manufacturerName = cleanText(record.manufacturerName);
  const brandName = cleanText(record.brandName);
  const normalizedBrandName = cleanText(record.normalizedBrandName) || normalizeBrandName(brandName);
  const genericName = cleanText(record.genericName);
  const normalizedGenericName = cleanText(record.normalizedGenericName) || normalizeGenericName(genericName);
  const dosageForm = cleanText(record.dosageForm) || undefined;
  const normalizedDosageForm = cleanText(record.normalizedDosageForm) || normalizeDosageForm(dosageForm);
  const strengthText = cleanText(record.strengthText) || undefined;
  const normalizedStrength = cleanText(record.normalizedStrength) || normalizeStrength(strengthText);
  const composition: CatalogCompositionInput = {
    ingredientOrder: 1,
    genericName,
    normalizedGenericName,
    strengthText,
    normalizedStrength,
    strengthValue: record.strengthValue,
    strengthUnit: record.strengthUnit,
  };

  if (!manufacturerName || !normalizedManufacturerName(manufacturerName)) {
    return {
      issues: [
        buildIssue(item, "MISSING_MANUFACTURER", "Manufacturer name is required.", "import_item"),
      ],
    };
  }

  if (!brandName || !normalizedBrandName || !genericName || !normalizedGenericName) {
    return {
      issues: [
        ...missingFieldIssues(item, {
          brandName,
          normalizedBrandName,
          genericName,
          normalizedGenericName,
        }),
      ],
    };
  }

  const signature = generateMedicineSignature({
    genericName: normalizedGenericName,
    strength: normalizedStrength,
    dosageForm: normalizedDosageForm,
  });

  return {
    record: {
      sourceType: item.sourceType,
      sourceUrl: item.sourceUrl || record.sourceUrl || null,
      sourceTable: "import_batch_items",
      sourceRecordId: item.id,
      importBatchId: item.importBatchId,
      importBatchCreatedAt: item.createdAt,
      importBatchItemId: item.id,
      rowNumber: item.rowNumber,
      manufacturerName,
      normalizedManufacturerName: normalizeManufacturer(manufacturerName),
      brandName,
      normalizedBrandName,
      genericName,
      normalizedGenericName,
      registrationNumber: cleanText(record.registrationNumber) || undefined,
      dosageForm,
      normalizedDosageForm,
      packSize: cleanText(record.packSize) || undefined,
      strengthText,
      normalizedStrength,
      medicineSignature: signature,
      canonicalName: brandName,
      confidenceScore: Number(record.confidenceScore || 0),
      rawData: record.raw,
      compositions: [composition],
    },
    issues: [],
  };
}

function mapDrapMirrorParsedRecord(
  item: ImportBatchItemLike,
  record: DrapMirrorParsedRecord,
): { record?: CatalogSourceRecord; issues: CatalogValidationIssue[] } {
  const manufacturerName = cleanText(record.manufacturer) || "Unknown Manufacturer";
  const brandName = cleanText(record.brandName || record.registrationNumber);
  const normalizedBrandName = normalizeBrandName(brandName);
  const dosageForm = cleanText(record.dosageForm) || undefined;
  const normalizedDosageForm = normalizeDosageForm(dosageForm);
  const rawCompositions = Array.isArray(record.compositionRows) ? record.compositionRows : [];
  const compositions = rawCompositions
    .map((composition, index) => normalizeComposition(composition, index + 1))
    .filter((composition): composition is CatalogCompositionInput => Boolean(composition));

  if (!manufacturerName || manufacturerName === "Unknown Manufacturer") {
    if (!cleanText(record.manufacturer)) {
      // Allow items without manufacturer - use placeholder
    }
  }

  if (!brandName || !normalizedBrandName) {
    return {
      issues: [buildIssue(item, "MISSING_BRAND", "Brand name is required.", "import_item")],
    };
  }

  if (compositions.length === 0) {
    return {
      issues: [
        buildIssue(item, "MISSING_COMPOSITION", "Composition rows are required to build products.", "import_item"),
      ],
    };
  }

  const normalizedGenericName = compositions.map((composition) => composition.normalizedGenericName).join(" + ");
  const genericName = compositions.map((composition) => composition.genericName).join(" + ");
  const normalizedStrength = compositions
    .map((composition) => composition.normalizedStrength || composition.strengthText || "")
    .filter(Boolean)
    .join(" + ") || undefined;
  const strengthText = compositions
    .map((composition) => composition.strengthText || "")
    .filter(Boolean)
    .join(" + ") || undefined;
  const signature = generateMedicineSignature({
    genericName: normalizedGenericName,
    strength: normalizedStrength,
    dosageForm: normalizedDosageForm,
  });

  return {
    record: {
      sourceType: item.sourceType,
      sourceUrl: item.sourceUrl || record.rawHtmlUrl || null,
      sourceTable: "import_batch_items",
      sourceRecordId: item.id,
      importBatchId: item.importBatchId,
      importBatchCreatedAt: item.createdAt,
      importBatchItemId: item.id,
      rowNumber: item.rowNumber,
      manufacturerName,
      normalizedManufacturerName: normalizeManufacturer(manufacturerName),
      brandName,
      normalizedBrandName,
      genericName,
      normalizedGenericName,
      registrationNumber: cleanText(record.registrationNumber) || undefined,
      dosageForm,
      normalizedDosageForm,
      packSize: cleanText(record.packSize) || undefined,
      strengthText,
      normalizedStrength,
      medicineSignature: signature,
      canonicalName: brandName,
      confidenceScore: 0.95,
      rawData: record,
      compositions,
    },
    issues: [],
  };
}

function normalizeComposition(
  composition: DrapMirrorParsedRecord["compositionRows"][number],
  ingredientOrder: number,
): CatalogCompositionInput | undefined {
  const genericName = cleanText(composition.genericName);
  const normalizedGenericName = normalizeGenericName(genericName);
  if (!genericName || !normalizedGenericName) {
    return undefined;
  }
  if (genericName.toLowerCase().includes("no composition data recorded")) {
    return undefined;
  }

  const strengthText = cleanText([composition.strength, composition.unit].filter(Boolean).join(" ")) || undefined;
  const normalizedStrength = normalizeStrength(strengthText);

  return {
    ingredientOrder,
    genericName,
    normalizedGenericName,
    strengthText,
    normalizedStrength,
    strengthValue: cleanText(composition.strength) || undefined,
    strengthUnit: cleanText(composition.unit) || undefined,
  };
}

function missingFieldIssues(
  item: ImportBatchItemLike,
  fields: Record<string, unknown>,
): CatalogValidationIssue[] {
  return Object.entries(fields)
    .filter(([, value]) => !value)
    .map(([field]) => buildIssue(item, `MISSING_${field.toUpperCase()}`, `${field} is required.`, "import_item"));
}

function buildIssue(
  item: ImportBatchItemLike,
  code: string,
  message: string,
  scope: CatalogValidationIssue["scope"],
): CatalogValidationIssue {
  return {
    scope,
    code,
    message,
    importBatchId: item.importBatchId,
    importBatchItemId: item.id,
    rowNumber: item.rowNumber,
  };
}

function normalizedManufacturerName(value: string): string {
  return normalizeManufacturer(value);
}

function looksLikeDrapNormalizedRecord(value: unknown): value is DrapNormalizedRecord {
  const record = toRecord(value);
  return typeof record.brandName === "string" && typeof record.genericName === "string" && typeof record.manufacturerName === "string";
}

function looksLikeDrapMirrorParsedRecord(value: unknown): value is DrapMirrorParsedRecord {
  const record = toRecord(value);
  return typeof record.registrationNumber === "string" && Array.isArray(record.compositionRows);
}

function cleanText(value?: string | null): string {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}
