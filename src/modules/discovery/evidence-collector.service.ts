import {
  DiscoveryEvidenceDto,
  DiscoveryInput,
} from "./discovery.types";

export class EvidenceCollectorService {
  collectEvidence(input: DiscoveryInput): DiscoveryEvidenceDto {
    const supportingFields = {
      brandName: input.brandName,
      genericName: input.genericName,
      strength: input.strength,
      dosageForm: input.dosageForm,
      manufacturer: input.manufacturer,
      packSize: input.packSize,
      registrationNumber: input.registrationNumber,
      medicineSignature: input.medicineSignature,
      searchQuery: input.searchQuery,
    };

    return {
      source: input.source,
      sourceType: input.sourceType,
      sourceUrl: input.sourceUrl,
      confidence: evidenceConfidence(supportingFields),
      captureDate: input.capturedAt || new Date().toISOString(),
      supportingFields,
      sourceRecordId: input.sourceRecordId,
    };
  }
}

function evidenceConfidence(fields: Record<string, unknown>): number {
  const values = Object.values(fields).filter(Boolean).length;
  return Math.round(Math.min(values / 8, 1) * 10000) / 10000;
}

