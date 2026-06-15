import { MatchingModule } from "../matching/matching.module";
import {
  DiscoveryCandidateDto,
  DiscoveryInput,
  DuplicateDiscoveryFlags,
  KnownMedicineIdentity,
} from "./discovery.types";

export class CandidateGeneratorService {
  private readonly matching = MatchingModule.createService();

  generateCandidate(
    input: DiscoveryInput,
    known: KnownMedicineIdentity[] = [],
  ): DiscoveryCandidateDto {
    const normalized = this.matching.normalize({
      brandName: input.brandName || input.searchQuery,
      genericName: input.genericName,
      strength: input.strength,
      dosageForm: input.dosageForm,
      manufacturer: input.manufacturer,
      packSize: input.packSize,
      registrationNumber: input.registrationNumber,
      medicineSignature: input.medicineSignature,
    });
    const duplicateFlags = this.detectDuplicates(normalized.medicineSignature, normalized.brandName, known);
    const sourceConfidence = scoreSource(input);
    const matchingConfidence = duplicateFlags.matches.length > 0 ? 0.75 : 0.25;
    const evidenceConfidence = sourceConfidence * 0.8;
    const overallConfidence = round(sourceConfidence * 0.35 + matchingConfidence * 0.25 + evidenceConfidence * 0.4);

    return {
      candidateName: input.brandName || input.genericName || input.searchQuery || normalized.medicineSignature || "unknown_product",
      normalizedBrand: normalized.brandName,
      normalizedGeneric: normalized.genericName,
      normalizedStrength: normalized.strength,
      normalizedDosageForm: normalized.dosageForm,
      normalizedManufacturer: normalized.manufacturer,
      medicineSignature: normalized.medicineSignature,
      registrationNumber: normalized.registrationNumber,
      packSize: normalized.packSize,
      discoveryStatus: overallConfidence >= 0.7 ? "needs_review" : "collecting_evidence",
      sourceConfidence,
      matchingConfidence,
      evidenceConfidence,
      overallConfidence,
      duplicateFlags,
      metadata: input.metadata,
    };
  }

  private detectDuplicates(
    signature: string | undefined,
    brand: string | undefined,
    known: KnownMedicineIdentity[],
  ): DuplicateDiscoveryFlags {
    const matches = known.filter((item) =>
      (signature && item.medicineSignature === signature) ||
      (brand && item.brandName?.toLowerCase() === brand) ||
      (brand && item.aliases?.map((alias) => alias.toLowerCase()).includes(brand)),
    );

    return {
      existingProductMatch: matches.length > 0,
      existingCanonicalProduct: matches.some((item) => item.id.startsWith("canonical")),
      existingAlias: matches.some((item) => item.aliases?.length),
      existingSignature: Boolean(signature && matches.some((item) => item.medicineSignature === signature)),
      matches: matches.map((item) => item.id),
    };
  }
}

function scoreSource(input: DiscoveryInput): number {
  const sourceBase: Record<string, number> = {
    DRAP_IMPORT: 0.95,
    PHARMACY_SNAPSHOT: 0.75,
    SEARCH_QUERY: 0.45,
    UNKNOWN_PRODUCT: 0.5,
    BILL_IMPORT: 0.65,
    PRESCRIPTION_IMPORT: 0.55,
    ADMIN_IMPORT: 0.9,
  };
  const fieldCount = [
    input.brandName,
    input.genericName,
    input.strength,
    input.dosageForm,
    input.manufacturer,
    input.registrationNumber,
    input.medicineSignature,
  ].filter(Boolean).length;
  return round((sourceBase[input.sourceType] || 0.4) * 0.75 + Math.min(fieldCount / 7, 1) * 0.25);
}

export function round(value: number): number {
  return Math.round(Math.max(0, Math.min(1, value)) * 10000) / 10000;
}

