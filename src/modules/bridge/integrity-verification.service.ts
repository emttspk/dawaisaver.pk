import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class IntegrityVerificationService {
  private readonly logger = new Logger(IntegrityVerificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async verifyIntegrity(): Promise<{
    duplicateCanonicalProducts: number;
    orphanVariants: number;
    orphanBridges: number;
  }> {
    const [duplicateCanonicalProducts, orphanVariants, orphanBridges] = await Promise.all([
      this.checkDuplicateCanonicalProducts(),
      this.checkOrphanVariants(),
      this.checkOrphanBridges(),
    ]);

    const report = `# Integrity Report

Generated: ${new Date().toISOString()}

## Issues Found

| Issue Type | Count |
|------------|-------|
| Duplicate Canonical Products | ${duplicateCanonicalProducts.length} |
| Orphan Variants | ${orphanVariants.length} |
| Orphan Bridges | ${orphanBridges.length} |

## Status

${this.allClean(duplicateCanonicalProducts, orphanVariants, orphanBridges)
      ? "All integrity checks passed"
      : "Some integrity issues require attention"}
`;

    fs.writeFileSync(path.join(process.cwd(), "integrity-report.md"), report);
    this.logger.log("Integrity report generated");

    return {
      duplicateCanonicalProducts: duplicateCanonicalProducts.length,
      orphanVariants: orphanVariants.length,
      orphanBridges: orphanBridges.length,
    };
  }

  private async checkDuplicateCanonicalProducts() {
    const duplicates = await this.prisma.canonicalProduct.groupBy({
      by: ["medicineSignature"],
      _count: true,
      having: { medicineSignature: { _count: { gt: 1 } } },
    });

    const result = [];
    for (const dup of duplicates) {
      const products = await this.prisma.canonicalProduct.findMany({
        where: { medicineSignature: dup.medicineSignature },
      });
      result.push(...products);
    }

    return result;
  }

  private async checkOrphanVariants() {
    const allVariants = await this.prisma.ingredientVariant.findMany();
    const orphanVariants: any[] = [];

    for (const variant of allVariants) {
      const molecule = await this.prisma.molecule.findUnique({
        where: { id: variant.moleculeId },
      });
      if (!molecule) {
        orphanVariants.push(variant);
      }
    }

    return orphanVariants;
  }

  private async checkOrphanBridges() {
    const bridges = await this.prisma.whoDrapBridge.findMany({
      where: {
        whoMoleculeId: null,
        drapGenericId: null,
      },
    });

    return bridges;
  }

  private allClean(...arrays: unknown[][]) {
    return arrays.every(arr => arr.length === 0);
  }
}