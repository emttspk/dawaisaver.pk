import { BrandMatcherService, textSimilarity } from "./brand-matcher.service";
import { ConfidenceEngineService } from "./confidence-engine.service";
import { GenericMatcherService } from "./generic-matcher.service";
import { ManufacturerMatcherService } from "./manufacturer-matcher.service";
import {
  CanonicalMedicineInput,
  ConfidenceBreakdownDto,
  DuplicateDetectionResult,
  MatchCandidateInput,
  MatchExplanationDto,
  MatchResultDto,
  NormalizedMedicineIdentity,
} from "./matching.types";
import {
  normalizePackSize,
  SignatureGeneratorService,
} from "./signature-generator.service";
import { StrengthMatcherService } from "./strength-matcher.service";

export class MatchingService {
  constructor(
    private readonly signatures = new SignatureGeneratorService(),
    private readonly brandMatcher = new BrandMatcherService(),
    private readonly genericMatcher = new GenericMatcherService(),
    private readonly strengthMatcher = new StrengthMatcherService(),
    private readonly manufacturerMatcher = new ManufacturerMatcherService(),
    private readonly confidenceEngine = new ConfidenceEngineService(),
  ) {}

  match(
    sourceInput: MatchCandidateInput,
    canonicalInput?: CanonicalMedicineInput,
  ): MatchResultDto {
    const source = this.signatures.normalizeIdentity(sourceInput);
    if (!canonicalInput) {
      const breakdown = zeroBreakdown();
      return {
        source,
        status: "unmatched",
        confidence: 0,
        explanation: this.explain(source, undefined, breakdown),
      };
    }

    const canonical = this.signatures.normalizeIdentity(canonicalInput);
    const breakdown = this.score(source, canonical);
    const status = this.confidenceEngine.classify(breakdown.finalConfidence);

    return {
      source,
      canonical,
      status,
      confidence: breakdown.finalConfidence,
      explanation: this.explain(source, canonical, breakdown),
    };
  }

  normalize(input: MatchCandidateInput): NormalizedMedicineIdentity {
    return this.signatures.normalizeIdentity(input);
  }

  generateMedicineSignature(input: MatchCandidateInput): string {
    return this.signatures.normalizeIdentity(input).medicineSignature;
  }

  detectDuplicates(inputs: MatchCandidateInput[]): DuplicateDetectionResult {
    const normalized = inputs.map((input) => this.signatures.normalizeIdentity(input));
    return {
      duplicateBrands: duplicates(normalized.map((item) => item.brandName).filter(Boolean)),
      duplicateProducts: duplicates(normalized.map((item) => productKey(item)).filter(Boolean)),
      duplicateManufacturers: duplicates(normalized.map((item) => item.manufacturer).filter(Boolean) as string[]),
      duplicateSignatures: duplicates(normalized.map((item) => item.medicineSignature).filter(Boolean)),
    };
  }

  private score(
    source: NormalizedMedicineIdentity,
    canonical: NormalizedMedicineIdentity,
  ): ConfidenceBreakdownDto {
    const registrationNumberScore =
      source.registrationNumber && canonical.registrationNumber
        ? source.registrationNumber === canonical.registrationNumber
          ? 1
          : 0
        : 0;
    const signatureScore = source.medicineSignature === canonical.medicineSignature ? 1 : 0;
    const dosageFormScore = source.dosageForm && canonical.dosageForm
      ? source.dosageForm === canonical.dosageForm
        ? 1
        : textSimilarity(source.dosageForm, canonical.dosageForm)
      : 0;
    const packSizeScore = normalizePackSize(source.packSize) && normalizePackSize(canonical.packSize)
      ? normalizePackSize(source.packSize) === normalizePackSize(canonical.packSize)
        ? 1
        : textSimilarity(source.packSize, canonical.packSize)
      : 0;

    return this.confidenceEngine.calculateFinalConfidence({
      brandScore: this.brandMatcher.matchBrand(source.brandName, canonical.brandName),
      genericScore: this.genericMatcher.matchGeneric(source.genericName, canonical.genericName),
      strengthScore: this.strengthMatcher.matchStrength(source.strength, canonical.strength),
      dosageFormScore,
      manufacturerScore: this.manufacturerMatcher.matchManufacturer(source.manufacturer, canonical.manufacturer),
      packSizeScore,
      registrationNumberScore,
      signatureScore,
    });
  }

  private explain(
    source: NormalizedMedicineIdentity,
    canonical: NormalizedMedicineIdentity | undefined,
    confidenceBreakdown: ConfidenceBreakdownDto,
  ): MatchExplanationDto {
    if (!canonical) {
      return {
        whyMatched: [],
        fieldsMatched: [],
        fieldsDifferent: ["canonical_product_missing"],
        confidenceBreakdown,
        reviewNotes: ["No canonical product candidate was provided."],
      };
    }

    const checks: Array<[string, unknown, unknown, number]> = [
      ["brand", source.brandName, canonical.brandName, confidenceBreakdown.brandScore],
      ["generic", source.genericName, canonical.genericName, confidenceBreakdown.genericScore],
      ["strength", source.strength, canonical.strength, confidenceBreakdown.strengthScore],
      ["dosage_form", source.dosageForm, canonical.dosageForm, confidenceBreakdown.dosageFormScore],
      ["manufacturer", source.manufacturer, canonical.manufacturer, confidenceBreakdown.manufacturerScore],
      ["pack_size", source.packSize, canonical.packSize, confidenceBreakdown.packSizeScore],
      ["registration_number", source.registrationNumber, canonical.registrationNumber, confidenceBreakdown.registrationNumberScore],
      ["medicine_signature", source.medicineSignature, canonical.medicineSignature, confidenceBreakdown.signatureScore],
    ];
    const fieldsMatched = checks.filter(([, , , score]) => score >= 0.9).map(([field]) => field);
    const fieldsDifferent = checks.filter(([, , , score]) => score < 0.5).map(([field]) => field);
    const whyMatched = fieldsMatched.map((field) => `${field} matched with high confidence`);

    return {
      whyMatched,
      fieldsMatched,
      fieldsDifferent,
      confidenceBreakdown,
      reviewNotes: confidenceBreakdown.finalConfidence < 0.92
        ? ["Match should be reviewed before promotion to canonical identity."]
        : [],
    };
  }
}

function zeroBreakdown(): ConfidenceBreakdownDto {
  return {
    brandScore: 0,
    genericScore: 0,
    strengthScore: 0,
    dosageFormScore: 0,
    manufacturerScore: 0,
    packSizeScore: 0,
    registrationNumberScore: 0,
    signatureScore: 0,
    finalConfidence: 0,
  };
}

function duplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicate = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      duplicate.add(value);
    }
    seen.add(value);
  }
  return Array.from(duplicate).sort();
}

function productKey(item: NormalizedMedicineIdentity): string {
  return [
    item.brandName,
    item.genericName,
    item.strength,
    item.dosageForm,
    item.manufacturer,
    item.packSize,
  ].filter(Boolean).join("|");
}

