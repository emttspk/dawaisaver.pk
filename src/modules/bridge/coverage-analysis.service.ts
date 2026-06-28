import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class CoverageAnalysisService {
  private readonly logger = new Logger(CoverageAnalysisService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateCoverageAnalysis(): Promise<void> {
    const [totalGenerics, bridges, aiSuggestions] = await Promise.all([
      this.prisma.generic.count({ where: { deletedAt: null } }),
      this.prisma.whoDrapBridge.findMany(),
      this.prisma.bridgeAiSuggestion.findMany(),
    ]);

    const matchMethods = {
      EXACT_NAME: 0, EXACT_INCHI: 0, FUZZY_NAME: 0, INCHI_FALLBACK: 0, ALIAS: 0, BP_USP_IP: 0,
      SALT: 0, HYDRATE: 0, ESTER: 0, APPROVED_BRIDGE: 0, AI_SUGGESTION: 0,
    };

    for (const bridge of bridges) {
      const method = bridge.matchMethod || "UNKNOWN";
      if (method in matchMethods) {
        matchMethods[method as keyof typeof matchMethods]++;
      }
    }

    const coverage = totalGenerics > 0 ? (bridges.length / totalGenerics) * 100 : 0;
    const avgConfidence = aiSuggestions.length > 0
      ? aiSuggestions.reduce((sum, s) => sum + Number(s.confidence || 0), 0) / aiSuggestions.length
      : 0;

    const report = `# Coverage Analysis

Generated: ${new Date().toISOString()}

## Match Breakdown

| Method | Count |
|--------|-------|
| Exact Name | ${matchMethods.EXACT_NAME} |
| Exact InChI | ${matchMethods.EXACT_INCHI} |
| Fuzzy Name | ${matchMethods.FUZZY_NAME} |
| InChI Fallback | ${matchMethods.INCHI_FALLBACK} |
| Alias | ${matchMethods.ALIAS} |
| BP/USP/IP | ${matchMethods.BP_USP_IP} |
| Salt | ${matchMethods.SALT} |
| Hydrate | ${matchMethods.HYDRATE} |
| Ester | ${matchMethods.ESTER} |
| Approved Bridge | ${matchMethods.APPROVED_BRIDGE} |
| AI Suggestion | ${matchMethods.AI_SUGGESTION} |

## Metrics

- Total Generics: ${totalGenerics}
- Bridged: ${bridges.length}
- Coverage: ${coverage.toFixed(2)}%
- Average Confidence: ${avgConfidence.toFixed(4)}
`;

    fs.writeFileSync(path.join(process.cwd(), "coverage-analysis.md"), report);
    this.logger.log("Coverage analysis generated");
  }

  async generateTopUnmatched(topN: number = 100): Promise<void> {
    const candidates = await this.prisma.generic.findMany({
      where: { deletedAt: null },
      select: { normalizedName: true },
      take: topN * 2,
    });

    const unmatched: Array<{ ingredient: string; count: number }> = [];

    for (const c of candidates) {
      const bridge = await this.prisma.whoDrapBridge.findFirst({
        where: { drapGenericId: c.normalizedName },
      });
      const ai = await this.prisma.bridgeAiSuggestion.findFirst({
        where: { ingredientText: c.normalizedName },
      });
      if (!bridge && !ai) {
        unmatched.push({ ingredient: c.normalizedName, count: 1 });
      }
    }

    const report = `# Top ${unmatched.length} Unmatched Ingredients

Generated: ${new Date().toISOString()}

${unmatched.slice(0, topN).map((u, i) => `${i + 1}. ${u.ingredient}`).join("\n")}
`;

    fs.writeFileSync(path.join(process.cwd(), `top-${topN}-unmatched.md`), report);
    this.logger.log(`Top ${topN} unmatched generated`);
  }

  async generateConfidenceConflicts(): Promise<void> {
    const conflicts = await this.prisma.bridgeAiSuggestion.groupBy({
      by: ["ingredientText"],
      where: {
        confidence: { lt: 0.8 },
        status: "PENDING",
      },
      _max: { confidence: true },
      orderBy: { _max: { confidence: "asc" } },
      take: 50,
    });

    const report = `# Confidence Conflicts

Generated: ${new Date().toISOString()}

${conflicts.map((c, i) => `${i + 1}. ${c.ingredientText} (confidence: ${c._max.confidence})`).join("\n")}
`;

    fs.writeFileSync(path.join(process.cwd(), "confidence-conflicts.md"), report);
    this.logger.log("Confidence conflicts generated");
  }
}