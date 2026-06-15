import {
  MatchCandidateInput,
  NormalizedMedicineIdentity,
} from "./matching.types";

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
};

export class SignatureGeneratorService {
  normalizeIdentity(input: MatchCandidateInput): NormalizedMedicineIdentity {
    const genericName = normalizeGeneric(input.genericName);
    const strength = normalizeStrength(input.strength);
    const dosageForm = normalizeDosageForm(input.dosageForm);

    return {
      brandName: normalizeBrand(input.brandName),
      genericName,
      strength,
      dosageForm,
      manufacturer: normalizeManufacturer(input.manufacturer),
      packSize: normalizePackSize(input.packSize),
      registrationNumber: normalizeRegistrationNumber(input.registrationNumber),
      medicineSignature: input.medicineSignature
        ? normalizeSignature(input.medicineSignature)
        : this.generateMedicineSignature({
            genericName,
            strength,
            dosageForm,
          }),
    };
  }

  generateMedicineSignature(input: {
    genericName?: string;
    strength?: string;
    dosageForm?: string;
  }): string {
    return [input.genericName, input.strength, input.dosageForm]
      .filter(Boolean)
      .join(" ")
      .replace(/[^a-z0-9%]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }
}

export function normalizeBrand(value?: string): string {
  return normalizeToken(value)
    .replace(/\b(tablet|tablets|capsule|capsules|syrup|injection|cream)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeGeneric(value?: string): string {
  return normalizeToken(value)
    .replace(/\+/g, " ")
    .replace(/\band\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeStrength(value?: string): string | undefined {
  const normalized = normalizeToken(value)
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s*(mg|mcg|g|ml|iu|%)\b/g, "$1")
    .replace(/\bmilligram\b/g, "mg")
    .replace(/\bmicrogram\b/g, "mcg")
    .trim();

  return normalized || undefined;
}

export function normalizeDosageForm(value?: string): string | undefined {
  const normalized = normalizeToken(value);
  return DOSAGE_FORM_ALIASES[normalized] || normalized || undefined;
}

export function normalizeManufacturer(value?: string): string | undefined {
  const normalized = normalizeToken(value)
    .replace(/\b(private|pvt|limited|ltd|company|co|pharmaceuticals|pharma)\b\.?/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return normalized || undefined;
}

export function normalizePackSize(value?: string): string | undefined {
  const normalized = normalizeToken(value)
    .replace(/\btablets\b/g, "tablet")
    .replace(/\bcapsules\b/g, "capsule")
    .trim();
  return normalized || undefined;
}

export function normalizeRegistrationNumber(value?: string): string | undefined {
  const normalized = normalizeToken(value).replace(/\s+/g, "").toUpperCase();
  return normalized || undefined;
}

function normalizeSignature(value: string): string {
  return normalizeToken(value).replace(/[^a-z0-9%]+/g, "_").replace(/^_+|_+$/g, "");
}

function normalizeToken(value?: string): string {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9%/+.\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

