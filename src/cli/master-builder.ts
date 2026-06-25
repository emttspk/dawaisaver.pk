import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaService } from '../database/prisma.service';
import { MasterBuilderService } from '../modules/master-builder/master-builder.service';

async function main(): Promise<void> {
  const prisma = new PrismaService();
  const service = new MasterBuilderService(prisma);

  await prisma.$connect();

  try {
    console.log('Starting Master Builder...');
    const report = await service.build();

    const reportDir = process.env.REPORT_DIR || 'reports/generated/master-builder';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonPath = join(reportDir, `master-builder-${timestamp}.json`);
    const mdPath = join(reportDir, `master-builder-${timestamp}.md`);

    const jsonContent = JSON.stringify(report, null, 2);
    writeFileSync(jsonPath, jsonContent, 'utf8');
    writeFileSync(mdPath, renderMarkdown(report), 'utf8');

    console.log(renderMarkdown(report));
    console.log(`\nReport saved to: ${reportDir}`);
    process.exit(0);
  } catch (error) {
    console.error('Master Builder failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

function renderMarkdown(report: any): string {
  const lines = [
    '# Master Builder Validation Report',
    '',
    `**Timestamp**: ${report.timestamp}`,
    '',
    '## Statistics',
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| JSON Processed | ${report.stats.jsonProcessed} |`,
    `| Products Created | ${report.stats.productsCreated} |`,
    `| Manufacturers Created | ${report.stats.manufacturersCreated} |`,
    `| Generics Created | ${report.stats.genericsCreated} |`,
    `| Compositions Created | ${report.stats.compositionsCreated} |`,
    `| Product Packs Created | ${report.stats.productPacksCreated} |`,
    `| Canonical Products Created | ${report.stats.canonicalProductsCreated} |`,
    `| Therapeutic Categories Created | ${report.stats.therapeuticCategoriesCreated} |`,
    `| ATC Classifications Created | ${report.stats.atcClassificationsCreated} |`,
    `| Duplicate Rate | ${(report.stats.duplicateRate * 100).toFixed(2)}% |`,
    `| Validation Failures | ${report.stats.validationFailures} |`,
    '',
    '## Confidence Distribution',
    '',
    `| Level | Count |`,
    `|-------|-------|`,
    `| High (>=0.8) | ${report.stats.confidenceDistribution.high} |`,
    `| Medium (0.5-0.8) | ${report.stats.confidenceDistribution.medium} |`,
    `| Low (<0.5) | ${report.stats.confidenceDistribution.low} |`,
  ];

  if (report.errors.length > 0) {
    lines.push('', '## Errors', '', '```', report.errors.join('\n'), '```');
  }

  if (report.warnings.length > 0) {
    lines.push('', '## Warnings', '', '```', report.warnings.join('\n'), '```');
  }

  return lines.join('\n');
}

main();