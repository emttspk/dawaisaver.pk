import { deterministicUuid } from '../utils/uuid-generator';
import type { PrismaService } from '../../../database/prisma.service';
import type { NormalizedJsonRecord } from '../master-builder.types';

export class ManufacturerBuilder {
  constructor(private readonly prisma: PrismaService) {}

  async build(record: NormalizedJsonRecord) {
    if (!record.manufacturer) {
      return null;
    }

    const normalizedName = this.normalizeName(record.manufacturer);
    const existing = await this.prisma.manufacturer.findFirst({
      where: { normalizedName },
    });

    if (existing) {
      return existing;
    }

    const manufacturerId = deterministicUuid(`manufacturer:${normalizedName}`);

    return this.prisma.manufacturer.create({
      data: {
        id: manufacturerId,
        name: record.manufacturer,
        normalizedName,
        country: record.country,
        sourceType: 'DRAP',
        sourceUrl: record.rawHtmlUrl,
        status: 'PENDING_REVIEW',
        confidenceScore: 0.9,
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