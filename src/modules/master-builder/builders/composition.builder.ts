import { deterministicUuid } from '../utils/uuid-generator';
import type { PrismaService } from '../../../database/prisma.service';
import type { NormalizedJsonRecord, CompositionRow } from '../master-builder.types';

export class CompositionBuilder {
  constructor(private readonly prisma: PrismaService) {}

  async build(record: NormalizedJsonRecord, productId: string | null, genericId: string | null) {
    if (!productId || !genericId || !record.compositionRows || record.compositionRows.length === 0) {
      return null;
    }

    const compositions: any[] = [];

    for (let i = 0; i < record.compositionRows.length; i++) {
      const row = record.compositionRows[i];
      const compositionId = deterministicUuid(
        `composition:${record.registrationNumber}:${genericId}:${i}`
      );

      const strengthParts = this.parseStrength(row.strength || '');
      const strengthValue = strengthParts.value ? parseFloat(strengthParts.value) : null;

      compositions.push({
        id: compositionId,
        product: { connect: { id: productId } },
        generic: { connect: { id: genericId } },
        ingredientOrder: i + 1,
        strengthValue,
        strengthUnit: strengthParts.unit,
        strengthText: row.strength,
        status: 'PENDING_REVIEW',
        confidenceScore: 0.9,
        sourceType: 'DRAP',
        sourceUrl: record.rawHtmlUrl,
        metadata: {
          registrationNumber: record.registrationNumber,
        },
      });
    }

    if (compositions.length === 0) {
      return null;
    }

    const created = await this.prisma.$transaction(
      compositions.map(({ id, product, generic, ...data }) =>
        this.prisma.productComposition.upsert({
          where: { id },
          create: {
            id,
            ...data,
            product,
            generic,
          },
          update: {
            ...data,
            product,
            generic,
          },
        }),
      ),
    );

    return created[0];
  }

  private parseStrength(strength: string): { value: string | null; unit: string | null } {
    const match = strength.match(/([\d.]+)\s*([a-zA-Z]*)/);
    if (match) {
      return { value: match[1], unit: match[2] || null };
    }
    return { value: null, unit: null };
  }
}
