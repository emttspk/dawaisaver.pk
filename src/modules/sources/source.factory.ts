import { PharmacySourceAdapter } from "./source.interfaces";
import {
  NormalizedSourcePrice,
  NormalizedSourceProduct,
  SourceAdapterContext,
  SourceRawPrice,
  SourceRawProduct,
} from "./source.types";
import {
  SourceRegistry,
  defaultSourceRegistry,
} from "./source.registry";

export class SourceFactory {
  constructor(private readonly registry: SourceRegistry = defaultSourceRegistry) {}

  async create(
    providerCode: string,
    context: SourceAdapterContext,
  ): Promise<PharmacySourceAdapter> {
    const adapter = this.registry.create(providerCode);
    await adapter.initialize(context);
    return adapter;
  }
}

export function normalizeSourceProduct(product: SourceRawProduct): NormalizedSourceProduct {
  const brandName = product.brandName || product.name;
  const normalizedBrand = matchBrand(brandName);
  const normalizedGeneric = product.genericName
    ? matchGeneric(product.genericName)
    : undefined;
  const normalizedStrength = product.strength
    ? matchStrength(product.strength)
    : undefined;
  const normalizedDosageForm = product.dosageForm
    ? matchDosageForm(product.dosageForm)
    : undefined;
  const medicineSignature = generateMedicineSignature({
    genericName: normalizedGeneric || normalizedBrand,
    strength: normalizedStrength,
    dosageForm: normalizedDosageForm,
  });

  return {
    externalProductId: product.externalProductId,
    brandName: cleanText(brandName),
    normalizedBrand,
    genericName: cleanText(product.genericName),
    normalizedGeneric,
    strengthText: cleanText(product.strength),
    normalizedStrength,
    dosageForm: cleanText(product.dosageForm),
    normalizedDosageForm,
    manufacturer: cleanText(product.manufacturer),
    packSize: cleanText(product.packSize),
    productUrl: cleanText(product.productUrl),
    medicineSignature,
    confidenceScore: scoreProduct({
      normalizedBrand,
      normalizedGeneric,
      normalizedStrength,
      normalizedDosageForm,
    }),
    raw: product.raw || product,
  };
}

export function normalizeSourcePrice(price: SourceRawPrice): NormalizedSourcePrice {
  return {
    externalProductId: price.externalProductId,
    productUrl: cleanText(price.productUrl),
    price: Number(price.price),
    currency: price.currency || "PKR",
    stockStatus: price.stockStatus || "UNKNOWN",
    city: cleanText(price.city),
    capturedAt: price.capturedAt || new Date().toISOString(),
    confidenceScore: Number.isFinite(Number(price.price)) ? 0.95 : 0.2,
    raw: price.raw || price,
  };
}

export function matchBrand(value?: string): string {
  return normalizeToken(value)
    .replace(/\b(tablet|tablets|capsule|capsules|syrup|injection|cream)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchGeneric(value?: string): string {
  return normalizeToken(value)
    .replace(/\+/g, " ")
    .replace(/\band\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchStrength(value?: string): string | undefined {
  const normalized = normalizeToken(value)
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s*(mg|mcg|g|ml|iu|%)\b/g, "$1")
    .replace(/\bmilligram\b/g, "mg")
    .replace(/\bmicrogram\b/g, "mcg")
    .trim();

  return normalized || undefined;
}

export function matchDosageForm(value?: string): string | undefined {
  const normalized = normalizeToken(value);
  const aliases: Record<string, string> = {
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

  return aliases[normalized] || normalized || undefined;
}

export function generateMedicineSignature(input: {
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

function normalizeToken(value?: string): string {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9%/+.\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanText(value?: string): string {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreProduct(parts: Record<string, string | undefined>): number {
  const required = [parts.normalizedBrand];
  const optional = [
    parts.normalizedGeneric,
    parts.normalizedStrength,
    parts.normalizedDosageForm,
  ];
  const requiredScore = required.filter(Boolean).length / required.length;
  const optionalScore = optional.filter(Boolean).length / optional.length;
  return Number((requiredScore * 0.7 + optionalScore * 0.3).toFixed(4));
}

