import { deterministicUuid } from '../utils/uuid-generator';
import type { PrismaService } from '../../../database/prisma.service';
import type { NormalizedJsonRecord, CompositionRow } from '../master-builder.types';

export class GenericBuilder {
  constructor(private readonly prisma: PrismaService) {}

  async build(record: NormalizedJsonRecord) {
    if (!record.compositionRows || record.compositionRows.length === 0) {
      return null;
    }

    const primaryGeneric = record.compositionRows[0].genericName;
    if (!primaryGeneric) {
      return null;
    }

    const normalizedName = this.normalizeName(primaryGeneric);
    const existing = await this.prisma.generic.findFirst({
      where: { normalizedName },
    });

    if (existing) {
      return existing;
    }

    const genericId = deterministicUuid(`generic:${normalizedName}`);

    return this.prisma.generic.create({
      data: {
        id: genericId,
        name: primaryGeneric,
        normalizedName,
        status: 'PENDING_REVIEW',
        confidenceScore: 0.9,
        sourceType: 'DRAP',
        sourceUrl: record.rawHtmlUrl,
        metadata: {
          registrationNumber: record.registrationNumber,
        },
      },
    });
  }

  private normalizeName(name: string): string {
    return name.toLowerCase().trim().replace(/\s+/g, ' ');
  }
}