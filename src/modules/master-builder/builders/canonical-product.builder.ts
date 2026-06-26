import { deterministicUuid } from '../utils/uuid-generator';
import type { PrismaService } from '../../../database/prisma.service';
import type { ProductBuilder } from './product.builder';
import type { NormalizedJsonRecord } from '../master-builder.types';

export class CanonicalProductBuilder {
  constructor(private readonly prisma: PrismaService, private readonly productBuilder: ProductBuilder) {}

  async build(record: NormalizedJsonRecord, productId: string | null) {
    if (!productId) {
      return null;
    }

    const canonicalId = deterministicUuid(`canonical:${productId}`);
    const canonicalName = this.generateCanonicalName(record);
    const medicineSignature = this.generateMedicineSignature(record);

    return this.prisma.canonicalProduct.upsert({
      where: { productId },
      create: {
        id: canonicalId,
        productId,
        canonicalName,
        normalizedBrand: record.brandName ? record.brandName.toLowerCase() : '',
        normalizedGeneric: record.compositionRows?.[0]?.genericName?.toLowerCase() ?? '',
        normalizedStrength: record.compositionRows?.[0]?.strength ?? undefined,
        normalizedDosageForm: record.dosageForm?.toLowerCase() ?? undefined,
        normalizedManufacturer: record.manufacturer?.toLowerCase() ?? undefined,
        packSize: record.packSize ?? undefined,
        registrationNumber: record.registrationNumber ?? undefined,
        medicineSignature,
        status: 'PENDING_REVIEW',
        confidenceScore: 0.9,
        sourceType: 'DRAP',
        sourceUrl: record.rawHtmlUrl ?? undefined,
      },
      update: {
        canonicalName,
        normalizedBrand: record.brandName ? record.brandName.toLowerCase() : '',
        normalizedGeneric: record.compositionRows?.[0]?.genericName?.toLowerCase() ?? '',
        normalizedStrength: record.compositionRows?.[0]?.strength ?? undefined,
        normalizedDosageForm: record.dosageForm?.toLowerCase() ?? undefined,
        normalizedManufacturer: record.manufacturer?.toLowerCase() ?? undefined,
        packSize: record.packSize ?? undefined,
        registrationNumber: record.registrationNumber ?? undefined,
        medicineSignature,
        status: 'PENDING_REVIEW',
        confidenceScore: 0.9,
        sourceType: 'DRAP',
        sourceUrl: record.rawHtmlUrl ?? undefined,
      },
    });
  }

  private generateCanonicalName(record: NormalizedJsonRecord): string {
    const generic = record.compositionRows?.[0]?.genericName || '';
    const strength = record.compositionRows?.[0]?.strength || '';
    const form = record.dosageForm || '';
    return `${generic} ${strength} ${form}`.trim();
  }

  private generateMedicineSignature(record: NormalizedJsonRecord): string {
    const parts = [
      record.brandName?.toLowerCase(),
      record.compositionRows?.[0]?.genericName?.toLowerCase(),
      record.compositionRows?.[0]?.strength,
      record.dosageForm?.toLowerCase(),
      record.packSize,
      record.manufacturer?.toLowerCase(),
    ];
    return parts.filter(Boolean).join('|');
  }
}
