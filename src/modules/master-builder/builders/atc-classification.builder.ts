import type { PrismaService } from '../../../database/prisma.service';
import type { NormalizedJsonRecord } from '../master-builder.types';

export class AtcClassificationBuilder {
  constructor(private readonly prisma: PrismaService) {}

  async build(record: NormalizedJsonRecord) {
    if (!record.atcCode) {
      return null;
    }

    const existing = await this.prisma.atcClassification.findFirst({
      where: { code: record.atcCode },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.atcClassification.create({
      data: {
        code: record.atcCode,
        name: `ATC ${record.atcCode}`,
        level: this.calculateLevel(record.atcCode),
        status: 'ACTIVE',
        confidenceScore: 0.9,
        sourceType: 'DRAP',
      },
    });
  }

  private calculateLevel(code: string): number {
    const parts = code.split('.');
    return parts.length;
  }
}