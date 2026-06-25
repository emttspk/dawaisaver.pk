import type { PrismaService } from '../../../database/prisma.service';
import type { NormalizedJsonRecord } from '../master-builder.types';

export class ApplicantBuilder {
  constructor(private readonly prisma: PrismaService) {}

  async build(record: NormalizedJsonRecord) {
    if (!record.manufacturer) {
      return null;
    }

    return {
      name: record.manufacturer,
      country: record.country,
      address: record.companyAddress,
    };
  }
}