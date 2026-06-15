import { MatchingService } from "../matching/matching.service";
import { MatchCandidateInput, MatchResultDto } from "../matching/matching.types";
import {
  PrescriptionAlternativeOption,
  PrescriptionItemResult,
  PrescriptionMatchScore,
  PrescriptionRawLine,
  PrescriptionSafetyWarning,
} from "./prescription.types";
import { normalizeText } from "./prescription-parser.service";
import { SignatureGeneratorService } from "../matching/signature-generator.service";

const HIGH_RISK_TERMS: Array<[PrescriptionSafetyWarning, RegExp]> = [
  ["INSULIN", /\binsulin\b/i],
  ["THYROID_MEDICINE", /\b(levothyroxine|thyroxine|thyronorm)\b/i],
  ["ANTI_EPILEPSY_MEDICINE", /\b(carbamazepine|valproate|phenytoin|levetiracetam|lamotrigine)\b/i],
  ["BLOOD_THINNER", /\b(warfarin|apixaban|rivaroxaban|dabigatran|heparin|clopidogrel)\b/i],
  ["CANCER_MEDICINE", /\b(onc|cancer|chemotherapy|imatinib|methotrexate|tamoxifen)\b/i],
  ["PSYCHIATRIC_MEDICINE", /\b(sertraline|fluoxetine|quetiapine|olanzapine|risperidone|alprazolam)\b/i],
  ["STEROID", /\b(prednisone|prednisolone|dexamethasone|methylprednisolone|steroid)\b/i],
  ["PREGNANCY_RELATED_MEDICINE", /\b(prenatal|folic acid|iron\s+tablet|progesterone|hcg)\b/i],
  ["CONTROLLED_MEDICINE", /\b(tramadol|morphine|alprazolam|clonazepam|methylphenidate)\b/i],
];

export class PrescriptionItemMatcherService {
  constructor(
    private readonly matching = new MatchingService(),
    private readonly signatures = new SignatureGeneratorService(),
  ) {}

  matchItems(lines: PrescriptionRawLine[], candidates: MatchCandidateInput[] = []): PrescriptionItemResult[] {
    return lines.map((line) => this.matchLine(line, candidates));
  }

  matchLine(line: PrescriptionRawLine, candidates: MatchCandidateInput[] = []): PrescriptionItemResult {
    const source = this.toMatchCandidate(line);
    const rankedCandidates = candidates
      .map((candidate) => {
        const result: MatchResultDto = this.matching.match(source, candidate);
        return {
          candidate,
          result,
        };
      })
      .sort((left, right) => right.result.confidence - left.result.confidence);

    const best = rankedCandidates[0];
    const matchStatus = classifyMatch(best?.result.confidence || 0);
    const explanation = best?.result.explanation || this.matching.match(source, undefined).explanation;
    const warnings = detectSafetyWarnings(line.rawText, best?.result.canonical?.genericName, best?.result.canonical?.brandName);
    const reviewRequired = matchStatus !== "matched" || warnings.length > 0 || (best?.result.confidence || 0) < 0.85;

    return {
      lineNumber: line.lineNumber,
      rawText: line.rawText,
      parsedName: line.parsedName,
      dosageText: line.dosageText,
      quantity: line.quantity,
      matchStatus,
      confidenceScore: best?.result.confidence || 0,
      reviewRequired,
      matchedProductId: best?.candidate.productId || best?.candidate.id,
      canonicalProductId: best?.candidate.canonicalProductId || best?.candidate.id,
      brandName: best?.result.canonical?.brandName,
      genericName: best?.result.canonical?.genericName,
      strength: best?.result.canonical?.strength,
      dosageForm: best?.result.canonical?.dosageForm,
      manufacturer: best?.result.canonical?.manufacturer,
      packSize: best?.result.canonical?.packSize,
      registrationNumber: best?.result.canonical?.registrationNumber,
      medicineSignature:
        best?.result.canonical?.medicineSignature || source.medicineSignature || this.signatures.generateMedicineSignature(source),
      safetyWarnings: warnings,
      confidenceBreakdown: explanation.confidenceBreakdown,
      explanation,
      rankedCandidates: rankedCandidates.slice(0, 5).map((entry) => this.toScore(entry.candidate, entry.result)),
      alternativeOptions: rankedCandidates.slice(1, 4).map((entry) => this.toAlternative(entry.candidate, entry.result)),
    };
  }

  private toMatchCandidate(line: PrescriptionRawLine): MatchCandidateInput {
    const medicineSignature = this.signatures.generateMedicineSignature({
      genericName: line.parsedName,
      strength: line.dosageText,
      dosageForm: inferDosageForm(line.rawText),
    });

    return {
      id: `rx-${line.lineNumber}`,
      brandName: line.parsedName,
      genericName: line.parsedName,
      strength: line.dosageText,
      dosageForm: inferDosageForm(line.rawText),
      medicineSignature,
      sourceTable: "prescription_items",
      metadata: {
        rawText: line.rawText,
        lineNumber: line.lineNumber,
      },
    };
  }

  private toScore(candidate: MatchCandidateInput, result: MatchResultDto): PrescriptionMatchScore {
    return {
      productId: candidate.productId || candidate.id,
      canonicalProductId: candidate.canonicalProductId,
      brandName: candidate.brandName,
      genericName: candidate.genericName,
      strength: candidate.strength,
      dosageForm: candidate.dosageForm,
      manufacturer: candidate.manufacturer,
      packSize: candidate.packSize,
      registrationNumber: candidate.registrationNumber,
      medicineSignature: candidate.medicineSignature,
      confidenceScore: result.confidence,
    };
  }

  private toAlternative(candidate: MatchCandidateInput, result: MatchResultDto): PrescriptionAlternativeOption {
    return {
      productId: candidate.productId || candidate.id,
      canonicalProductId: candidate.canonicalProductId,
      label: [candidate.brandName, candidate.strength, candidate.dosageForm].filter(Boolean).join(" "),
      medicineSignature: candidate.medicineSignature,
      confidenceScore: result.confidence,
    };
  }
}

export function detectSafetyWarnings(
  rawText: string,
  genericName?: string,
  brandName?: string,
): PrescriptionSafetyWarning[] {
  const haystack = normalizeText([rawText, genericName, brandName].filter(Boolean).join(" "));
  const warnings = new Set<PrescriptionSafetyWarning>();

  for (const [warning, pattern] of HIGH_RISK_TERMS) {
    if (pattern.test(haystack)) {
      warnings.add(warning);
    }
  }

  return Array.from(warnings);
}

export function classifyMatch(confidence: number): PrescriptionItemResult["matchStatus"] {
  if (confidence >= 0.9) {
    return "matched";
  }
  if (confidence >= 0.75) {
    return "possible_match";
  }
  if (confidence > 0) {
    return "needs_review";
  }
  return "unmatched";
}

function inferDosageForm(rawText: string): string | undefined {
  const match = rawText.match(/\b(tablet|tab|capsule|cap|syrup|suspension|cream|ointment|injection|drop|drops|gel|solution|spray)\b/i);
  if (!match) {
    return undefined;
  }
  return match[1].toLowerCase();
}
