import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { PrismaService } from '../../database/prisma.service';
import { parseDrapMirrorPage } from '../../modules/drap/drap.detail-parser';
import type { NormalizedJsonRecord } from '../../modules/master-builder/master-builder.types';

interface ExtractionStats {
  totalSaved: number;
  processed: number;
  generated: number;
  skipped: number;
  failed: number;
  missingFields: number;
}

interface FailedRegistration {
  registrationNumber: string;
  error: string;
  rowNumber?: number;
}

export class JsonGeneratorService {
  private readonly prisma: PrismaService;
  private readonly dataPath: string;
  private stats: ExtractionStats;
  private failedRegistrations: FailedRegistration[];

  constructor(prisma: PrismaService, dataPath: string = 'data/json') {
    this.prisma = prisma;
    this.dataPath = dataPath;
    this.stats = {
      totalSaved: 0,
      processed: 0,
      generated: 0,
      skipped: 0,
      failed: 0,
      missingFields: 0,
    };
    this.failedRegistrations = [];
  }

  async generate(): Promise<void> {
    await mkdir(this.dataPath, { recursive: true });

    const savedItems = await this.prisma.importBatchItem.findMany({
      where: { status: 'SAVED', deletedAt: null },
      orderBy: { rowNumber: 'asc' },
    });

    this.stats.totalSaved = savedItems.length;
    console.log(`Found ${savedItems.length} SAVED records`);

    for (const item of savedItems) {
      this.stats.processed++;

      const registrationNumber = this.extractRegistrationNumber(item);
      if (!registrationNumber) {
        this.stats.failed++;
        this.failedRegistrations.push({
          registrationNumber: 'unknown',
          error: 'Missing registration number',
          rowNumber: item.rowNumber,
        });
        continue;
      }

      const jsonPath = join(this.dataPath, `${registrationNumber}.json`);
      if (await this.fileExists(jsonPath)) {
        this.stats.skipped++;
        continue;
      }

      try {
        const normalized = await this.extractToJson(item);
        await writeFile(jsonPath, JSON.stringify(normalized, null, 2), 'utf-8');
        this.stats.generated++;
      } catch (error) {
        this.stats.failed++;
        this.failedRegistrations.push({
          registrationNumber,
          error: error instanceof Error ? error.message : String(error),
          rowNumber: item.rowNumber,
        });
      }
    }

    await this.writeReports();
  }

  private extractRegistrationNumber(item: any): string | null {
    const rawData = item.rawData || {};
    const normalizedData = item.normalizedData || {};

    return (
      normalizedData.registrationNumber ||
      rawData['Registration No'] ||
      rawData['Registration Number'] ||
      rawData.registrationNumber ||
      null
    );
  }

  private async extractToJson(item: any): Promise<NormalizedJsonRecord> {
    const rawData = item.rawData || {};
    const normalizedData = item.normalizedData || {};
    const html = rawData.html || normalizedData.html || '';

    let parsed;
    if (html) {
      parsed = parseDrapMirrorPage(html, rawData.sourceUrl);
    } else {
      parsed = this.mapNormalizedToRecord(normalizedData);
    }

    return parsed;
  }

  private mapNormalizedToRecord(data: any): NormalizedJsonRecord {
    const compositionRows = this.extractCompositionRows(data);

    return {
      registrationNumber: data.registrationNumber || '',
      brandName: data.brandName,
      registrationDate: data.registrationDate,
      meetingNumber: data.meetingNumber,
      dosageForm: data.dosageForm,
      compositionRows,
      packSize: data.packSize,
      approvedPrice: data.approvedPrice,
      pricingType: data.pricingType,
      manufacturer: data.manufacturer,
      companyAddress: data.companyAddress,
      country: data.country,
      manufacturingType: data.manufacturingType,
      category: data.category,
      sourceStatus: data.sourceStatus,
      sourceVerificationStatus: data.sourceVerificationStatus,
      routeOfAdmin: data.routeOfAdmin,
      labelClaim: data.labelClaim,
      activeIngredient: data.activeIngredient,
      dosage: data.dosage,
      packageType: data.packageType,
      therapeuticCategory: data.therapeuticCategory,
      atcCode: data.atcCode,
      indications: data.indications,
      contraindications: data.contraindications,
      sideEffects: data.sideEffects,
      drugInteractions: data.drugInteractions,
      precautions: data.precautions,
      warnings: data.warnings,
      shelfLife: data.shelfLife || data.storageCondition,
      storageCondition: data.storageCondition,
      remarks: data.remarks,
      rawHtmlUrl: data.rawHtmlUrl,
    };
  }

  private extractCompositionRows(data: any): any[] {
    const compositions = data.compositions || [];
    return compositions.map((c: any) => ({
      genericName: c.genericName || c.generic || c.name || '',
      operator: c.operator,
      strength: c.strengthValue ? String(c.strengthValue) : c.strength,
      unit: c.strengthUnit || c.unit,
    }));
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await import('fs/promises').then(fs => fs.access(path));
      return true;
    } catch {
      return false;
    }
  }

  private async writeReports(): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      failedRegistrations: this.failedRegistrations,
    };

    const reportPath = join(process.cwd(), 'extraction-report.json');
    await writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');

    const failedPath = join(process.cwd(), 'failed-registrations.json');
    await writeFile(failedPath, JSON.stringify(this.failedRegistrations, null, 2), 'utf-8');

    console.log(`\n=== Extraction Report ===`);
    console.log(`Total SAVED records: ${this.stats.totalSaved}`);
    console.log(`JSON generated: ${this.stats.generated}`);
    console.log(`Skipped (existing): ${this.stats.skipped}`);
    console.log(`Failed: ${this.stats.failed}`);
    console.log(`Missing fields: ${this.stats.missingFields}`);
  }

  getStats(): ExtractionStats {
    return { ...this.stats };
  }
}