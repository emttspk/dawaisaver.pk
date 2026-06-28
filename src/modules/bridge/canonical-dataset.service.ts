import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class CanonicalDatasetService {
  private readonly logger = new Logger(CanonicalDatasetService.name);

  constructor(private readonly prisma: PrismaService) {}

  async freezeCanonicalDataset(version: string = "1.0.0"): Promise<string> {
    const bridges = await this.prisma.whoDrapBridge.findMany({
      where: {
        reviewStatus: "APPROVED",
      },
    });

    const dataset = {
      version,
      createdAt: new Date().toISOString(),
      mappings: bridges.map(b => ({
        whoMoleculeId: b.whoMoleculeId,
        drapVariant: b.drapGenericId,
        matchMethod: b.matchMethod,
        confidence: b.confidenceScore?.toString(),
      })),
    };

    const datasetPath = path.join(process.cwd(), "canonical-dataset-v1.md");
    fs.writeFileSync(datasetPath, this.formatMarkdown(dataset));
    
    this.logger.log(`Canonical Dataset v${version} frozen: ${datasetPath}`);
    return datasetPath;
  }

  private formatMarkdown(dataset: any): string {
    return `# Canonical Dataset v${dataset.version}

Generated: ${dataset.createdAt}

| WHO Molecule ID | DRAP Variant | Match Method | Confidence |
|-----------------|--------------|--------------|------------|
${dataset.mappings.map((m: any) => `| ${m.whoMoleculeId} | ${m.drapVariant} | ${m.matchMethod} | ${m.confidence} |`).join("\n")}
`;
  }

  async generateProductionReport(executionTime: number): Promise<void> {
    const [molecules, totalGenerics, bridgedGenerics, aiPending] = await Promise.all([
      this.prisma.molecule.count(),
      this.prisma.generic.count({ where: { deletedAt: null } }),
      this.prisma.whoDrapBridge.count({ where: { reviewStatus: "APPROVED" } }),
      this.prisma.bridgeAiSuggestion.count({ where: { status: "PENDING" } }),
    ]);

    const coverage = totalGenerics > 0 ? (bridgedGenerics / totalGenerics) * 100 : 0;

    const report = `# Production Bridge Report

Generated: ${new Date().toISOString()}

## Execution

- Total Time: ${executionTime}ms

## Dataset

| Metric | Count |
|--------|-------|
| WHO Molecules | ${molecules} |
| DRAP Generics | ${totalGenerics} |
| Bridged | ${bridgedGenerics} |
| Coverage | ${coverage.toFixed(2)}% |
| AI Queue Size | ${aiPending} |

## Status

${coverage >= 95 ? "✅ Ready for Canonical Product Builder (Phase 51)" : "⚠️ Coverage below 95% - needs review"}
`;

    fs.writeFileSync(path.join(process.cwd(), "production-bridge-report.md"), report);
  }
}