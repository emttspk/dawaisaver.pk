import { deterministicUuid } from '../utils/uuid-generator';
import type { PrismaService } from '../../../database/prisma.service';
import type { ManufacturerBuilder } from './manufacturer.builder';
import type { GenericBuilder } from './generic.builder';
import type { CompositionBuilder } from './composition.builder';
import type { NormalizedJsonRecord } from '../master-builder.types';

export class ProductBuilder {
  constructor(
    private readonly prisma: PrismaService,
    private readonly manufacturerBuilder: ManufacturerBuilder,
    private readonly genericBuilder: GenericBuilder,
    private readonly compositionBuilder: CompositionBuilder
  ) {}

  async build(record: NormalizedJsonRecord, manufacturerId: string | null, genericId: string | null) {
    if (!record.registrationNumber) {
      return null;
    }

    const existing = await this.prisma.product.findFirst({
      where: { registrationNumber: record.registrationNumber },
    });

    if (existing) {
      return existing;
    }

    const productId = deterministicUuid(`product:${record.registrationNumber}`);
    const normalizedBrand = record.brandName ? this.normalizeName(record.brandName) : '';
    const signature = this.generateSignature(record);

    return this.prisma.product.create({
      data: {
        id: productId,
        manufacturerId: manufacturerId ?? undefined,
        brandName: record.brandName ?? '',
        normalizedBrand,
        displayName: record.brandName ?? '',
        dosageForm: record.dosageForm ?? undefined,
        normalizedForm: record.dosageForm ?? undefined,
        strengthText: this.extractStrengthText(record) ?? undefined,
        packSize: record.packSize ?? undefined,
        registrationNumber: record.registrationNumber,
        signature,
        status: 'PENDING_REVIEW',
        confidenceScore: 0.9,
        sourceType: 'DRAP',
        sourceUrl: record.rawHtmlUrl ?? undefined,
      },
    });
  }

  private normalizeName(name: string): string {
    return name.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  private generateSignature(record: NormalizedJsonRecord): string {
    const parts = [
      record.brandName,
      record.dosageForm,
      record.packSize,
      record.manufacturer,
    ];
    return parts.filter(Boolean).join(' | ');
  }

  private extractStrengthText(record: NormalizedJsonRecord): string | null {
    if (!record.compositionRows || record.compositionRows.length === 0) {
      return null;
    }
    return record.compositionRows.map(r => r.strength).filter(Boolean).join(', ');
  }
}