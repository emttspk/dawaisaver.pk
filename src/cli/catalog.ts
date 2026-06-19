import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PrismaService } from "../database/prisma.service";
import { CatalogService } from "../modules/catalog/catalog.service";
import { CatalogBuildCommand, CatalogBuildOptions } from "../modules/catalog/catalog.types";

async function main(): Promise<void> {
  const { command, options } = parseArgs(process.argv.slice(2));
  const prisma = new PrismaService();
  const service = new CatalogService(prisma);

  await prisma.$connect();

  try {
    if (command === "verify") {
      const report = await service.verifyCatalog();
      if (options.writeReports !== false) {
        await writeGeneratedReport(command, report, options.reportDir);
      }
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
      return;
    }

    const summary =
      command === "resume"
        ? await service.resumeCatalog(options.jobId, options)
        : await service.buildCatalog({ ...options, command });

    if (options.writeReports !== false) {
      await writeGeneratedReport(command, summary, options.reportDir);
    }
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

function parseArgs(argv: string[]): { command: CatalogBuildCommand; options: CatalogBuildOptions } {
  const [first, ...rest] = argv;
  const command = normalizeCommand(first);
  const options: CatalogBuildOptions = {
    command,
    dryRun: false,
    writeReports: true,
  };

  for (const arg of rest) {
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg.startsWith("--job-id=")) {
      options.jobId = arg.split("=", 2)[1] || undefined;
      continue;
    }

    if (arg.startsWith("--limit=")) {
      options.limit = Number(arg.split("=", 2)[1]);
      continue;
    }

    if (arg.startsWith("--batch-size=")) {
      options.batchSize = Number(arg.split("=", 2)[1]);
      continue;
    }

    if (arg.startsWith("--report-dir=")) {
      options.reportDir = arg.split("=", 2)[1] || undefined;
      continue;
    }

    if (arg === "--no-report") {
      options.writeReports = false;
      continue;
    }
  }

  return { command, options };
}

function normalizeCommand(value?: string): CatalogBuildCommand {
  if (value === "resume" || value === "verify") {
    return value;
  }

  return "build";
}

async function writeGeneratedReport(
  command: CatalogBuildCommand,
  payload: unknown,
  reportDir?: string,
): Promise<void> {
  if (!reportDir) {
    reportDir = join(process.cwd(), "reports", "generated", "catalog");
  }

  await mkdir(reportDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const jsonPath = join(reportDir, `catalog-${command}-${timestamp}.json`);
  const mdPath = join(reportDir, `catalog-${command}-${timestamp}.md`);

  await writeFile(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await writeFile(mdPath, renderMarkdown(command, payload), "utf8");
}

function renderMarkdown(command: CatalogBuildCommand, payload: unknown): string {
  return ["# Catalog Report", "", `Command: \`${command}\``, "", "```json", JSON.stringify(payload, null, 2), "```", ""].join("\n");
}

void main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`);
  process.exitCode = 1;
});
