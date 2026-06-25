import type { PrismaService } from '../../../database/prisma.service';
import type { NormalizedJsonRecord } from '../master-builder.types';

export class TherapeuticCategoryBuilder {
  constructor(private readonly prisma: PrismaService) {}

  async build(record: NormalizedJsonRecord) {
    if (!record.therapeuticCategory) {
      return null;
    }

    const existing = await this.prisma.therapeuticCategory.findFirst({
      where: { name: { contains: record.therapeuticCategory, mode: 'insensitive' } },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.therapeuticCategory.create({
      data: {
        code: `TC${Date.now()}`,
        name: record.therapeuticCategory,
        status: 'ACTIVE',
        confidenceScore: 0.9,
        sourceType: 'DRAP',
      },
    });
  }
}