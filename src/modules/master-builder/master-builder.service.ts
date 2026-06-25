import { JsonReader } from './json-reader';
import { ManufacturerBuilder } from './builders/manufacturer.builder';
import { GenericBuilder } from './builders/generic.builder';
import { ProductBuilder } from './builders/product.builder';
import { CompositionBuilder } from './builders/composition.builder';
import { CanonicalProductBuilder } from './builders/canonical-product.builder';
import { ProductPackBuilder } from './builders/product-pack.builder';
import { SearchMetadataBuilder } from './builders/search-metadata.builder';
import { TherapeuticCategoryBuilder } from './builders/therapeutic-category.builder';
import { AtcClassificationBuilder } from './builders/atc-classification.builder';
import { ValidationReportBuilder } from './builders/validation-report.builder';
import { MasterBuilderStats, MasterBuilderReport, NormalizedJsonRecord } from './master-builder.types';
import { PrismaService } from '../../database/prisma.service';

export class MasterBuilderService {
  private readonly jsonReader: JsonReader;
  private readonly stats: MasterBuilderStats;

  constructor(
    private readonly prisma: PrismaService,
  ) {
    this.jsonReader = new JsonReader(process.env.JSON_DATA_PATH || 'data/json');
    this.stats = {
      jsonProcessed: 0,
      productsCreated: 0,
      manufacturersCreated: 0,
      genericsCreated: 0,
      compositionsCreated: 0,
      productPacksCreated: 0,
      canonicalProductsCreated: 0,
      therapeuticCategoriesCreated: 0,
      atcClassificationsCreated: 0,
      duplicateRate: 0,
      validationFailures: 0,
      confidenceDistribution: {
        high: 0,
        medium: 0,
        low: 0,
      },
    };
  }

  async build(): Promise<MasterBuilderReport> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const records = await this.jsonReader.readAll();
    this.stats.jsonProcessed = records.length;

    const manufacturerBuilder = new ManufacturerBuilder(this.prisma);
    const genericBuilder = new GenericBuilder(this.prisma);
    const compositionBuilder = new CompositionBuilder(this.prisma);
    const productBuilder = new ProductBuilder(this.prisma, manufacturerBuilder, genericBuilder, compositionBuilder);
    const productPackBuilder = new ProductPackBuilder(this.prisma, productBuilder);
    const canonicalProductBuilder = new CanonicalProductBuilder(this.prisma, productBuilder);
    const searchMetadataBuilder = new SearchMetadataBuilder(this.prisma, productBuilder);
    const therapeuticCategoryBuilder = new TherapeuticCategoryBuilder(this.prisma);
    const atcClassificationBuilder = new AtcClassificationBuilder(this.prisma);

    let totalConfidenceHigh = 0;
    let totalConfidenceMedium = 0;
    let totalConfidenceLow = 0;

    for (const record of records) {
      try {
        const manufacturer = await manufacturerBuilder.build(record);
        if (manufacturer) {
          this.stats.manufacturersCreated++;
        }

        const generic = await genericBuilder.build(record);
        if (generic) {
          this.stats.genericsCreated++;
        }

        const composition = await compositionBuilder.build(record, generic?.id ?? null);
        if (composition) {
          this.stats.compositionsCreated++;
        }

        const product = await productBuilder.build(record, manufacturer?.id ?? null, generic?.id ?? null);
        if (product) {
          this.stats.productsCreated++;
        }

        await productPackBuilder.build(record, product?.id ?? null);
        this.stats.productPacksCreated++;

        await canonicalProductBuilder.build(record, product?.id ?? null);
        this.stats.canonicalProductsCreated++;

        const therapeuticCategory = await therapeuticCategoryBuilder.build(record);
        if (therapeuticCategory) {
          this.stats.therapeuticCategoriesCreated++;
        }

        const atcClassification = await atcClassificationBuilder.build(record);
        if (atcClassification) {
          this.stats.atcClassificationsCreated++;
        }

        await searchMetadataBuilder.build(record, product?.id ?? null);

        const confidence = this.calculateConfidence(record);
        if (confidence >= 0.8) totalConfidenceHigh++;
        else if (confidence >= 0.5) totalConfidenceMedium++;
        else totalConfidenceLow++;

      } catch (error) {
        this.stats.validationFailures++;
        errors.push(`Failed to process ${record.registrationNumber}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    this.stats.confidenceDistribution = {
      high: totalConfidenceHigh,
      medium: totalConfidenceMedium,
      low: totalConfidenceLow,
    };

    this.stats.duplicateRate = records.length > 0
      ? (this.stats.productsCreated - (this.stats.productsCreated - this.stats.validationFailures)) / records.length
      : 0;

    return ValidationReportBuilder.generateReport(this.stats, errors, warnings);
  }

  private calculateConfidence(record: NormalizedJsonRecord): number {
    let score = 0;
    const fields = [
      record.registrationNumber,
      record.brandName,
      record.dosageForm,
      record.manufacturer,
    ];

    const filledFields = fields.filter(f => f && f.length > 0).length;
    score += filledFields / fields.length;

    if (record.compositionRows && record.compositionRows.length > 0) {
      score += 0.2;
    }

    return Math.min(1, score);
  }

  getStats(): MasterBuilderStats {
    return { ...this.stats };
  }
}