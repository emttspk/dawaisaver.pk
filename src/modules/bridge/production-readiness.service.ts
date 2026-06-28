import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class CanonicalProductBuilderDesignService {
  private readonly logger = new Logger(CanonicalProductBuilderDesignService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateReadinessReport(): Promise<void> {
    const [molecules, bridges, aiPending, aiApproved] = await Promise.all([
      this.prisma.molecule.count(),
      this.prisma.whoDrapBridge.count({ where: { reviewStatus: "APPROVED" } }),
      this.prisma.bridgeAiSuggestion.count({ where: { status: "PENDING" } }),
      this.prisma.bridgeAiSuggestion.count({ where: { status: "APPROVED" } }),
    ]);

    const totalGenerics = await this.prisma.generic.count({ where: { deletedAt: null } });
    const coverage = totalGenerics > 0 ? (bridges / totalGenerics) * 100 : 0;

    const report = `# Production Readiness Final Report

Generated: ${new Date().toISOString()}

## Bridge Status

| Metric | Count |
|--------|-------|
| WHO Molecules | ${molecules} |
| Approved Bridges | ${bridges} |
| Total DRAP Generics | ${totalGenerics} |
| Coverage | ${coverage.toFixed(2)}% |
| AI Pending | ${aiPending} |
| AI Approved | ${aiApproved} |

## Readiness

${coverage >= 95 ? "Ready for Canonical Product Builder Phase 52" : "Coverage at " + coverage.toFixed(2) + "% - needs review"}

## Design Complete

- Canonical identity design documented
- Product signature design documented
- Brand/registration linkage design documented
- Migration strategy documented

## No Schema Changes Required
`;

    fs.writeFileSync(path.join(process.cwd(), "production-readiness-final.md"), report);
    this.logger.log("Production readiness report generated");
  }
}