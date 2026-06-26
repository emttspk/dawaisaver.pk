import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaService } from '../database/prisma.service';
import { MasterBuilderService } from '../modules/master-builder/master-builder.service';

async function main(): Promise<void> {
  const prisma = new PrismaService();
  const service = new MasterBuilderService(prisma);
  const args = parseArgs(process.argv.slice(2));

  await prisma.$connect();

  try {
    console.log('Starting Master Builder...');
    const resumeRegistrations = args.resumeFrom
      ? extractFailedRegistrations(args.resumeFrom)
      : [];

    if (args.resumeFrom) {
      console.log(`Resuming from report: ${args.resumeFrom}`);
      if (resumeRegistrations.length === 0) {
        throw new Error(`No failed registrations found in resume report: ${args.resumeFrom}`);
      }
      console.log(`Retrying ${resumeRegistrations.length} failed records`);
    }

    const report = await service.build({
      registrationNumbers: resumeRegistrations.length > 0 ? resumeRegistrations : undefined,
    });

    const reportDir = process.env.REPORT_DIR || 'reports/generated/master-builder';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonPath = join(reportDir, `master-builder-${timestamp}.json`);
    const mdPath = join(reportDir, `master-builder-${timestamp}.md`);
    mkdirSync(reportDir, { recursive: true });

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

function parseArgs(argv: string[]): { resumeFrom?: string } {
  const resumeIndex = argv.indexOf('--resume-from');
  if (resumeIndex >= 0 && argv[resumeIndex + 1]) {
    return { resumeFrom: argv[resumeIndex + 1] };
  }

  const equalsArg = argv.find((arg) => arg.startsWith('--resume-from='));
  if (equalsArg) {
    return { resumeFrom: equalsArg.split('=', 2)[1] };
  }

  return {};
}

function extractFailedRegistrations(reportPath: string): string[] {
  const raw = readFileSync(reportPath, 'utf8');
  const report = JSON.parse(raw) as { errors?: string[]; failedRegistrations?: Array<{ registrationNumber?: string }> };

  if (Array.isArray(report.failedRegistrations) && report.failedRegistrations.length > 0) {
    return report.failedRegistrations
      .map((entry) => entry.registrationNumber?.trim())
      .filter((value): value is string => Boolean(value));
  }

  if (!Array.isArray(report.errors)) {
    return [];
  }

  const registrations = new Set<string>();
  const pattern = /Failed to process ([A-Za-z0-9_-]+)/;

  for (const entry of report.errors) {
    const match = entry.match(pattern);
    if (match?.[1]) {
      registrations.add(match[1]);
    }
  }

  return Array.from(registrations);
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

void main();
