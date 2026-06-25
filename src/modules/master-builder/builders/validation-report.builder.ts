import type { MasterBuilderStats, MasterBuilderReport } from '../master-builder.types';

export class ValidationReportBuilder {
  static generateReport(stats: MasterBuilderStats, errors: string[], warnings: string[]): MasterBuilderReport {
    return {
      timestamp: new Date().toISOString(),
      stats,
      errors,
      warnings,
    };
  }

  static formatReport(report: MasterBuilderReport): string {
    const lines = [
      '=== Master Builder Validation Report ===',
      `Timestamp: ${report.timestamp}`,
      '',
      '--- Statistics ---',
      `JSON Processed: ${report.stats.jsonProcessed}`,
      `Products Created: ${report.stats.productsCreated}`,
      `Manufacturers Created: ${report.stats.manufacturersCreated}`,
      `Generics Created: ${report.stats.genericsCreated}`,
      `Compositions Created: ${report.stats.compositionsCreated}`,
      `Product Packs Created: ${report.stats.productPacksCreated}`,
      `Canonical Products Created: ${report.stats.canonicalProductsCreated}`,
      `Therapeutic Categories Created: ${report.stats.therapeuticCategoriesCreated}`,
      `ATC Classifications Created: ${report.stats.atcClassificationsCreated}`,
      `Duplicate Rate: ${(report.stats.duplicateRate * 100).toFixed(2)}%`,
      `Validation Failures: ${report.stats.validationFailures}`,
      '',
      '--- Confidence Distribution ---',
      `High (>=0.8): ${report.stats.confidenceDistribution.high}`,
      `Medium (0.5-0.8): ${report.stats.confidenceDistribution.medium}`,
      `Low (<0.5): ${report.stats.confidenceDistribution.low}`,
    ];

    if (report.errors.length > 0) {
      lines.push('', '--- Errors ---');
      lines.push(...report.errors);
    }

    if (report.warnings.length > 0) {
      lines.push('', '--- Warnings ---');
      lines.push(...report.warnings);
    }

    return lines.join('\n');
  }
}