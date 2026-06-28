import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class BridgeValidationService {
  private readonly logger = new Logger(BridgeValidationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateReport(): Promise<void> {
    const [molecules, variants, aiSuggestions] = await Promise.all([
      this.prisma.molecule.count(),
      this.prisma.ingredientVariant.count(),
      this.prisma.bridgeAiSuggestion.findMany(),
    ]);

    const [autoMatched, totalGenerics, bridgedGenerics, topUnmatched] = await Promise.all([
      this.prisma.whoDrapBridge.count({ where: { matchMethod: { in: ["EXACT_NAME", "EXACT_INCHI", "FUZZY_NAME", "INCHI_FALLBACK"] } } }),
      this.prisma.generic.count({ where: { deletedAt: null } }),
      this.prisma.whoDrapBridge.count(),
      this.getTopUnmatchedIngredients(),
    ]);

    const aiMatched = aiSuggestions.filter(s => s.status === "APPROVED").length;
    const rejected = aiSuggestions.filter(s => s.status === "REJECTED").length;
    const unknown = aiSuggestions.filter(s => s.status === "UNKNOWN").length;
    const pending = aiSuggestions.filter(s => s.status === "PENDING").length;

    const coverage = totalGenerics > 0 ? (bridgedGenerics / totalGenerics) * 100 : 0;

    const avgConfidence = aiSuggestions.length > 0
      ? aiSuggestions.reduce((sum, s) => sum + Number(s.confidence || 0), 0) / aiSuggestions.length
      : 0;

    const report = `# Bridge Validation Report

Generated: ${new Date().toISOString()}

## Summary

| Metric | Count |
|--------|-------|
| WHO Molecules | ${molecules} |
| Ingredient Variants | ${variants} |
| Auto Matched | ${autoMatched} |
| AI Matched | ${aiMatched} |
| Approved | ${aiMatched} |
| Rejected | ${rejected} |
| Unknown | ${unknown} |
| Pending Review | ${pending} |

## Coverage

- Total DRAP Generics: ${totalGenerics}
- Bridged Generics: ${bridgedGenerics}
- Coverage: ${coverage.toFixed(2)}%

## Confidence

- Average AI Confidence: ${avgConfidence.toFixed(4)}

## Top Unmatched Ingredients

${topUnmatched.map((u, i) => `${i + 1}. ${u.ingredient} (count: ${u.count})`).join("\n")}
`;

    const reportPath = path.join(process.cwd(), "bridge-validation-report.md");
    fs.writeFileSync(reportPath, report);
    this.logger.log(`Validation report generated: ${reportPath}`);
  }

  private async getTopUnmatchedIngredients(): Promise<Array<{ ingredient: string; count: number }>> {
    const candidates = await this.prisma.generic.groupBy({
      by: ["normalizedName"],
      where: { deletedAt: null },
      _count: true,
      orderBy: { _count: { normalizedName: "desc" } },
      take: 50,
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
        unmatched.push({ ingredient: c.normalizedName, count: c._count });
      }
    }

    return unmatched.slice(0, 20);
  }
}