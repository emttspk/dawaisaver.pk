import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class CanonicalProductBuilderService {
  private readonly logger = new Logger(CanonicalProductBuilderService.name);

  constructor(private readonly prisma: PrismaService) {}

  async buildCanonicalProducts(forceRebuild = false): Promise<{ created: number; skipped: number }> {
    const bridges = await this.prisma.whoDrapBridge.findMany({
      where: {
        reviewStatus: "APPROVED",
      },
    });

    let created = 0;
    let skipped = 0;

    for (const bridge of bridges) {
      const molecule = bridge.whoMoleculeId
        ? await this.prisma.molecule.findUnique({ where: { id: bridge.whoMoleculeId } })
        : null;

      const signature = this.buildSignature(bridge.drapGenericId || "");

      const existing = await this.prisma.canonicalProduct.findFirst({
        where: { medicineSignature: signature },
      });

      if (existing) {
        skipped++;
        continue;
      }

      if (!bridge.drapGenericId) continue;

      await this.prisma.canonicalProduct.create({
        data: {
          canonicalName: molecule?.preferredName || molecule?.normalizedName || bridge.drapGenericId,
          normalizedBrand: "unbranded",
          normalizedGeneric: bridge.drapGenericId,
          medicineSignature: signature,
          status: "ACTIVE",
          sourceType: "SYSTEM",
          confidenceScore: bridge.confidenceScore || undefined,
        },
      });

      created++;
    }

    this.logger.log(`Built ${created} canonical products, skipped ${skipped} existing`);
    return { created, skipped };
  }

  private buildSignature(genericId: string): string {
    return genericId.toLowerCase().replace(/\s+/g, "_");
  }

  async generateReports(): Promise<void> {
    const [products, duplicates, orphans] = await Promise.all([
      this.prisma.canonicalProduct.findMany(),
      this.findDuplicates(),
      this.findOrphans(),
    ]);

    const report = `# Canonical Product Report

Generated: ${new Date().toISOString()}

## Summary

| Metric | Count |
|--------|-------|
| Canonical Products | ${products.length} |
| Duplicates Found | ${duplicates.length} |
| Orphans Found | ${orphans.length} |

## Duplicates

${duplicates.map(d => `- ${d.canonicalName}: ${d.duplicates.length} duplicates`).join("\n") || "None"}

## Orphans

${orphans.map(o => `- ${o.id}`).join("\n") || "None"}
`;

    fs.writeFileSync(path.join(process.cwd(), "canonical-product-report.md"), report);
    this.logger.log("Canonical product report generated");
  }

  private async findDuplicates() {
    const signatures = await this.prisma.canonicalProduct.groupBy({
      by: ["medicineSignature"],
      _count: true,
      having: {
        medicineSignature: {
          _count: { gt: 1 },
        },
      },
    });

    const duplicates = [];
    for (const sig of signatures) {
      const products = await this.prisma.canonicalProduct.findMany({
        where: { medicineSignature: sig.medicineSignature },
      });
      duplicates.push({
        canonicalName: products[0]?.canonicalName,
        duplicates: products,
      });
    }

    return duplicates;
  }

  private async findOrphans() {
    return this.prisma.canonicalProduct.findMany({
      where: { productId: null },
    });
  }

  async linkToProduction(): Promise<{ linked: number }> {
    const products = await this.prisma.canonicalProduct.findMany({
      where: { status: "ACTIVE" },
    });

    let linked = 0;

    for (const product of products) {
      const existingProduct = await this.prisma.product.findFirst();

      if (existingProduct && !product.productId) {
        await this.prisma.canonicalProduct.update({
          where: { id: product.id },
          data: { productId: existingProduct.id },
        });
        linked++;
      }
    }

    this.logger.log(`Linked ${linked} canonical products to existing products`);
    return { linked };
  }
}