import {
  DrapNormalizedRecord,
  DrapRawRecord,
} from "./drap.types";

const DOSAGE_FORM_ALIASES: Record<string, string> = {
  tab: "tablet",
  tabs: "tablet",
  tablet: "tablet",
  tablets: "tablet",
  cap: "capsule",
  caps: "capsule",
  capsule: "capsule",
  capsules: "capsule",
  susp: "suspension",
  suspension: "suspension",
  syrup: "syrup",
  inj: "injection",
  injection: "injection",
  cream: "cream",
  ointment: "ointment",
  drops: "drops",
};

export class DrapNormalizer {
  normalizeRecords(records: DrapRawRecord[]): DrapNormalizedRecord[] {
    return records.map((record, index) => this.normalizeRecord(record, index + 1));
  }

  normalizeRecord(record: DrapRawRecord, rowNumber = 1): DrapNormalizedRecord {
    const brandName = this.pick(record, "brand_name", "brandName") || "";
    const genericName = this.pick(record, "generic_name", "genericName") || "";
    const strengthText = this.pick(record, "strength");
    const dosageForm = this.pick(record, "dosage_form", "dosageForm");
    const manufacturerName =
      this.pick(record, "manufacturer", "manufacturer_name") || "";
    const registrationNumber = this.pick(
      record,
      "registration_number",
      "registrationNumber",
    );
    const packSize = this.pick(record, "pack_size", "packSize");
    const sourceUrl = this.pick(record, "source_url");
    const normalizedBrandName = normalizeBrandName(brandName);
    const normalizedGenericName = normalizeGenericName(genericName);
    const normalizedStrength = normalizeStrength(strengthText);
    const normalizedDosageForm = normalizeDosageForm(dosageForm);
    const normalizedManufacturerName = normalizeManufacturer(manufacturerName);
    const parsedStrength = parseStrength(normalizedStrength);
    const medicineSignature = generateMedicineSignature({
      genericName: normalizedGenericName,
      strength: normalizedStrength,
      dosageForm: normalizedDosageForm,
    });

    return {
      rowNumber,
      raw: record,
      brandName: cleanDisplayText(brandName),
      normalizedBrandName,
      genericName: cleanDisplayText(genericName),
      normalizedGenericName,
      strengthText: cleanDisplayText(strengthText),
      normalizedStrength,
      strengthValue: parsedStrength?.value,
      strengthUnit: parsedStrength?.unit,
      dosageForm: cleanDisplayText(dosageForm),
      normalizedDosageForm,
      manufacturerName: cleanDisplayText(manufacturerName),
      normalizedManufacturerName,
      registrationNumber: cleanDisplayText(registrationNumber),
      packSize: cleanDisplayText(packSize),
      medicineSignature,
      confidenceScore: scoreRecordCompleteness({
        normalizedBrandName,
        normalizedGenericName,
        normalizedStrength,
        normalizedDosageForm,
        normalizedManufacturerName,
      }),
      sourceUrl: cleanDisplayText(sourceUrl),
    };
  }

  private pick(record: DrapRawRecord, ...keys: string[]): string | undefined {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === "string" && value.trim().length > 0) {
        return value;
      }
      if (typeof value === "number") {
        return String(value);
      }
    }

    return undefined;
  }
}

export function normalizeBrandName(value?: string): string {
  return normalizeName(value)
    .replace(/\b(tablet|tablets|capsule|capsules|syrup|injection)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeGenericName(value?: string): string {
  return normalizeName(value)
    .replace(/\+/g, " ")
    .replace(/\band\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeStrength(value?: string): string | undefined {
  const text = normalizeName(value)
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s*(mg|mcg|g|ml|iu|%)\b/g, "$1")
    .replace(/\bmilligram\b/g, "mg")
    .replace(/\bmicrogram\b/g, "mcg")
    .replace(/\s+/g, " ")
    .trim();

  return text || undefined;
}

export function normalizeDosageForm(value?: string): string | undefined {
  const text = normalizeName(value);
  if (!text) {
    return undefined;
  }

  return DOSAGE_FORM_ALIASES[text] || text;
}

export function normalizeManufacturer(value?: string): string {
  return normalizeName(value)
    .replace(/\b(private|pvt|limited|ltd|company|co)\b\.?/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function generateMedicineSignature(input: {
  genericName: string;
  strength?: string;
  dosageForm?: string;
}): string {
  return [input.genericName, input.strength, input.dosageForm]
    .filter(Boolean)
    .join(" ")
    .replace(/[^a-z0-9%]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeName(value?: string): string {
  return cleanDisplayText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9%/+.\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanDisplayText(value?: string): string {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseStrength(strength?: string): { value: string; unit: string } | undefined {
  if (!strength) {
    return undefined;
  }

  const match = strength.match(/([0-9]+(?:\.[0-9]+)?)\s*(mg|mcg|g|ml|iu|%)/i);
  if (!match) {
    return undefined;
  }

  return {
    value: match[1],
    unit: match[2].toLowerCase(),
  };
}

function scoreRecordCompleteness(parts: Record<string, string | undefined>): number {
  const required = [
    parts.normalizedBrandName,
    parts.normalizedGenericName,
    parts.normalizedDosageForm,
    parts.normalizedManufacturerName,
  ];
  const optional = [parts.normalizedStrength];
  const requiredScore = required.filter(Boolean).length / required.length;
  const optionalScore = optional.filter(Boolean).length / optional.length;

  return Number((requiredScore * 0.85 + optionalScore * 0.15).toFixed(4));
}

