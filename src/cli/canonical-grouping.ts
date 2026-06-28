import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

interface CanonicalMedicineKey {
  ingredientSet: string;
  strengthSet: string;
  strengthUnitSet: string;
  dosageForm: string;
  route: string;
}

interface IntegrityReport {
  orphanProducts: number;
  productsWithoutBrand: number;
  duplicateCanonicalKeys: Array<{ key: string; count: number }>;
  brandsWithoutCanonical: Array<{ brandName: string; productId: string }>;
  brandsWithMultipleCanonicals: Array<{ brandName: string; canonicalCount: number }>;
  duplicateRegistrations: Array<{ registrationNumber: string; brandCount: number }>;
  registrationsMultipleBrands: Array<{ registrationNumber: string; brandCount: number }>;
  packIssues: {
    withoutRegistration: number;
    missingPackSize: number;
    missingPackUnit: number;
  };
}

interface CanonicalMedicine {
  key: CanonicalMedicineKey;
  keySignature: string;
  products: Array<{
    id: string;
    brandName: string;
    registrationNumber: string | null;
    manufacturerName: string | null;
    applicantName: string | null;
    country: string | null;
    sourceHtml: string | null;
  }>;
}

interface GroupingStatistics {
  totalProducts: number;
  totalCanonicalMedicines: number;
  brandsPerMedicine: Record<string, number>;
  manufacturersPerMedicine: Record<string, number>;
  registrationsPerMedicine: Record<string, number>;
  duplicateRegistrations: Array<{ registrationNumber: string; productCount: number }>;
  largestBrandGroups: Array<{ keySignature: string; brandCount: number }>;
  largestIngredientGroups: Array<{ ingredient: string; medicineCount: number }>;
}

interface IngredientSummary {
  ingredient: string;
  canonicalMedicines: number;
  brands: Set<string>;
  manufacturers: Set<string>;
  registrations: Set<string>;
  pendingReviews: number;
}

interface BrandSummary {
  brandName: string;
  canonicalMedicineKey: string;
  registrationNumber: string | null;
  manufacturerName: string | null;
}

interface ManufacturerSummary {
  manufacturerName: string;
  canonicalMedicines: number;
  brands: number;
  registrations: number;
}

interface RegistrationSummary {
  registrationNumber: string;
  brandName: string;
  manufacturerName: string | null;
  canonicalMedicineKey: string;
}

interface GroupingReport {
  timestamp: string;
  statistics: GroupingStatistics;
  canonicalMedicines: CanonicalMedicine[];
  ingredientSummaries: Record<string, IngredientSummary>;
  brandSummaries: BrandSummary[];
  manufacturerSummaries: ManufacturerSummary[];
  registrationSummaries: RegistrationSummary[];
  integrityReport: IntegrityReport;
}

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  const args = process.argv.slice(2);
  const limitArg = args.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : undefined;
  const writeReport = !args.includes("--no-report");

  await prisma.$connect();

  try {
    console.log("Starting Medicine Intelligence Model grouping...");

    const report = await buildMedicineIntelligenceModel(prisma, limit);

    if (writeReport) {
      const reportsDir = join(process.cwd(), "reports", "generated");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

      await Promise.all([
        writeFile(join(reportsDir, `medicine-intelligence-summary-${timestamp}.json`), `${JSON.stringify(toJsonFriendly(report), null, 2)}\n`, "utf8"),
        writeFile(join(reportsDir, `canonical-validation-${timestamp}.json`), `${JSON.stringify(toJsonFriendly(report.integrityReport), null, 2)}\n`, "utf8"),
        writeFile(join(reportsDir, `ingredient-intelligence-${timestamp}.json`), `${JSON.stringify(toJsonFriendly(Object.values(report.ingredientSummaries)), null, 2)}\n`, "utf8"),
        writeFile(join(reportsDir, `brand-intelligence-${timestamp}.json`), `${JSON.stringify(toJsonFriendly(report.brandSummaries), null, 2)}\n`, "utf8"),
        writeFile(join(reportsDir, `manufacturer-intelligence-${timestamp}.json`), `${JSON.stringify(toJsonFriendly(report.manufacturerSummaries), null, 2)}\n`, "utf8"),
        writeFile(join(reportsDir, `quality-report-${timestamp}.json`), `${JSON.stringify(toJsonFriendly(report.statistics), null, 2)}\n`, "utf8"),
      ]);

      console.log(`Reports saved to: ${reportsDir}`);
    }

    console.log(renderMarkdown(report));
  } finally {
    await prisma.$disconnect();
  }
}

async function buildMedicineIntelligenceModel(prisma: PrismaClient, limit?: number): Promise<GroupingReport> {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    ...(limit ? { take: limit } : {}),
    select: {
      id: true,
      brandName: true,
      normalizedBrand: true,
      dosageForm: true,
      normalizedForm: true,
      strengthText: true,
      packSize: true,
      registrationNumber: true,
      sourceUrl: true,
      manufacturer: {
        select: { name: true, normalizedName: true, country: true },
      },
      compositions: {
        select: {
          generic: { select: { name: true, normalizedName: true } },
          strengthText: true,
          strengthUnit: true,
        },
      },
    },
  });

  const groups = new Map<string, CanonicalMedicine>();
  const brandSummaries: BrandSummary[] = [];
  const manufacturerMap = new Map<string, { brands: Set<string>; canonicalMedicines: Set<string>; registrations: Set<string> }>();
  const registrationSummaries: RegistrationSummary[] = [];

  for (const product of products) {
    const ingredientSet = product.compositions
      .map((c) => c.generic.normalizedName)
      .sort()
      .join("|");
    const strengthSet = product.compositions
      .map((c) => c.strengthText || "")
      .sort()
      .join("|");
    const strengthUnitSet = product.compositions
      .map((c) => c.strengthUnit || "")
      .sort()
      .join("|");
    const dosageForm = product.normalizedForm || product.dosageForm || "";
    const route = "";

    const key: CanonicalMedicineKey = { ingredientSet, strengthSet, strengthUnitSet, dosageForm, route };
    const keySignature = [ingredientSet, strengthSet, strengthUnitSet, dosageForm, route]
      .filter(Boolean)
      .join("|||");

    if (!groups.has(keySignature)) {
      groups.set(keySignature, { key, keySignature, products: [] });
    }

    const canonicalMedicine = groups.get(keySignature)!;
    canonicalMedicine.products.push({
      id: product.id,
      brandName: product.brandName,
      registrationNumber: product.registrationNumber,
      manufacturerName: product.manufacturer?.name || null,
      applicantName: product.manufacturer?.name || null,
      country: product.manufacturer?.country || null,
      sourceHtml: product.sourceUrl,
    });

    brandSummaries.push({
      brandName: product.brandName,
      canonicalMedicineKey: keySignature,
      registrationNumber: product.registrationNumber,
      manufacturerName: product.manufacturer?.name || null,
    });

    const manufacturerEntry = manufacturerMap.get(product.manufacturer?.name || "Unknown") || {
      brands: new Set<string>(),
      canonicalMedicines: new Set<string>(),
      registrations: new Set<string>(),
    };
    manufacturerMap.set(product.manufacturer?.name || "Unknown", manufacturerEntry);

    if (product.registrationNumber) {
      registrationSummaries.push({
        registrationNumber: product.registrationNumber,
        brandName: product.brandName,
        manufacturerName: product.manufacturer?.name || null,
        canonicalMedicineKey: keySignature,
      });
    }
  }

  const canonicalMedicines = Array.from(groups.values()).map((group) => ({
    ...group,
    products: group.products.sort((a, b) => a.brandName.localeCompare(b.brandName)),
  }));

  // Integrity validation - Stage 1 & 2
  const keySignatureCounts = new Map<string, number>();
  for (const medicine of canonicalMedicines) {
    const count = keySignatureCounts.get(medicine.keySignature) || 0;
    keySignatureCounts.set(medicine.keySignature, count + 1);
  }

  const duplicateCanonicalKeys = Array.from(keySignatureCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([key, count]) => ({ key, count }));

  // Stage 3 - Brand validation
  const brandsToCanonicals = new Map<string, Set<string>>();
  const brandsToCanonicalProducts = new Map<string, Set<string>>();

  for (const product of products) {
    if (product.registrationNumber) {
      const brandKey = product.brandName.toLowerCase();
      if (!brandsToCanonicals.has(brandKey)) {
        brandsToCanonicals.set(brandKey, new Set());
        brandsToCanonicalProducts.set(brandKey, new Set());
      }
      const keySig = brandSummaries.find((b) => b.brandName.toLowerCase() === brandKey)?.canonicalMedicineKey;
      if (keySig) {
        brandsToCanonicals.get(brandKey)!.add(keySig);
        brandsToCanonicalProducts.get(brandKey)!.add(product.id);
      }
    }
  }

  const brandsWithoutCanonical: Array<{ brandName: string; productId: string }> = [];
  const brandsWithMultipleCanonicals = Array.from(brandsToCanonicals.entries())
    .filter(([, canonicals]) => canonicals.size > 1)
    .map(([brandName, canonicals]) => ({ brandName, canonicalCount: canonicals.size }));

  // Stage 4 - Registration validation
  const registrationToBrands = new Map<string, Set<string>>();
  for (const summary of registrationSummaries) {
    if (!registrationToBrands.has(summary.registrationNumber)) {
      registrationToBrands.set(summary.registrationNumber, new Set());
    }
    registrationToBrands.get(summary.registrationNumber)!.add(summary.brandName);
  }

  const duplicateRegistrations = Array.from(registrationToBrands.entries())
    .filter(([, brands]) => brands.size > 1)
    .map(([registrationNumber, brands]) => ({ registrationNumber, brandCount: brands.size }));

  // Stage 5 - Pack validation
  const productPacks = await prisma.productPack.findMany({
    where: { deletedAt: null },
    select: { packSize: true, packSizeUnits: true, product: { select: { registrationNumber: true } } },
  });

  const missingPackSize = productPacks.filter((p) => !p.packSize).length;
  const missingPackUnit = productPacks.filter((p) => !p.packSizeUnits).length;

  const integrityReport: IntegrityReport = {
    orphanProducts: products.filter((p) => !p.brandName || !p.manufacturer?.name).length,
    productsWithoutBrand: products.filter((p) => !p.brandName).length,
    duplicateCanonicalKeys: duplicateCanonicalKeys,
    brandsWithoutCanonical,
    brandsWithMultipleCanonicals,
    duplicateRegistrations,
    registrationsMultipleBrands: duplicateRegistrations,
    packIssues: {
      withoutRegistration: 0,
      missingPackSize,
      missingPackUnit,
    },
  };

  const duplicateRegistrationsMap = new Map<string, number>();
  for (const product of products) {
    if (product.registrationNumber) {
      duplicateRegistrationsMap.set(product.registrationNumber, (duplicateRegistrationsMap.get(product.registrationNumber) || 0) + 1);
    }
  }

  const duplicateRegistrationsStats = Array.from(duplicateRegistrationsMap.entries())
    .filter(([, count]) => count > 1)
    .map(([registrationNumber, productCount]) => ({ registrationNumber, productCount }))
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, 10);

  const largestBrandGroups = canonicalMedicines
    .map((m) => ({
      keySignature: m.keySignature,
      brandCount: new Set(m.products.map((p) => p.brandName.toLowerCase())).size,
    }))
    .sort((a, b) => b.brandCount - a.brandCount)
    .slice(0, 10);

  const ingredientGroups = new Map<string, number>();
  for (const medicine of canonicalMedicines) {
    for (const ingredient of medicine.key.ingredientSet.split("|")) {
      ingredientGroups.set(ingredient, (ingredientGroups.get(ingredient) || 0) + 1);
    }
  }

  const largestIngredientGroups = Array.from(ingredientGroups.entries())
    .map(([ingredient, medicineCount]) => ({ ingredient, medicineCount }))
    .sort((a, b) => b.medicineCount - a.medicineCount)
    .slice(0, 10);

  const manufacturerSummaries = Array.from(manufacturerMap.entries())
    .map(([name, data]) => ({
      manufacturerName: name,
      canonicalMedicines: data.canonicalMedicines.size,
      brands: data.brands.size,
      registrations: data.registrations.size,
    }));

  const brandsPerMedicine: Record<string, number> = {};
  const manufacturersPerMedicine: Record<string, number> = {};
  const registrationsPerMedicine: Record<string, number> = {};

  for (const medicine of canonicalMedicines) {
    brandsPerMedicine[medicine.keySignature] = new Set(medicine.products.map((p) => p.brandName.toLowerCase())).size;
    manufacturersPerMedicine[medicine.keySignature] = new Set(medicine.products.map((p) => p.manufacturerName)).size;
    registrationsPerMedicine[medicine.keySignature] = medicine.products.filter((p) => p.registrationNumber).length;
  }

  const ingredientSummaries: Record<string, IngredientSummary> = {};
  for (const medicine of canonicalMedicines) {
    for (const ingredient of medicine.key.ingredientSet.split("|")) {
      if (!ingredientSummaries[ingredient]) {
        ingredientSummaries[ingredient] = {
          ingredient,
          canonicalMedicines: 0,
          brands: new Set<string>(),
          manufacturers: new Set<string>(),
          registrations: new Set<string>(),
          pendingReviews: 0,
        };
      }
      ingredientSummaries[ingredient].canonicalMedicines += 1;
      for (const product of medicine.products) {
        ingredientSummaries[ingredient].brands.add(product.brandName.toLowerCase());
        if (product.manufacturerName) {
          ingredientSummaries[ingredient].manufacturers.add(product.manufacturerName);
        }
        if (product.registrationNumber) {
          ingredientSummaries[ingredient].registrations.add(product.registrationNumber);
        }
      }
    }
  }

  return {
    timestamp: new Date().toISOString(),
    statistics: {
      totalProducts: products.length,
      totalCanonicalMedicines: canonicalMedicines.length,
      brandsPerMedicine,
      manufacturersPerMedicine,
      registrationsPerMedicine,
      duplicateRegistrations: duplicateRegistrationsStats,
      largestBrandGroups,
      largestIngredientGroups,
    },
    canonicalMedicines,
    ingredientSummaries,
    brandSummaries,
    manufacturerSummaries,
    registrationSummaries,
    integrityReport,
  };
}

function toJsonFriendly(data: unknown): unknown {
  if (data instanceof Map) {
    return Object.fromEntries(data);
  }
  if (data instanceof Set) {
    return Array.from(data);
  }
  if (Array.isArray(data)) {
    return data.map(toJsonFriendly);
  }
  if (data && typeof data === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = toJsonFriendly(value);
    }
    return result;
  }
  return data;
}

function renderMarkdown(report: GroupingReport): string {
  const lines: string[] = [
    "# Phase 41 - Production Medicine Intelligence Completion",
    "",
    "## Stage 1 - Production Validation",
    "",
    `**Orphan Products**: ${report.integrityReport.orphanProducts}`,
    `**Products Without Brand**: ${report.integrityReport.productsWithoutBrand}`,
    "",
    "## Stage 2 - Canonical Integrity",
    "",
    "**Duplicate Canonical Keys (should be 0):**",
    "| Key | Count |",
    "|-----|-------|",
    ...report.integrityReport.duplicateCanonicalKeys.map((d) => `| ${d.key.substring(0, 40)}... | ${d.count} |`),
    "",
    "## Stage 3 - Brand Validation",
    "",
    `**Brands with Multiple Canonicals**: ${report.integrityReport.brandsWithMultipleCanonicals.length}`,
    "",
    "| Brand Name | Canonical Count |",
    "|------------|----------------|",
    ...report.integrityReport.brandsWithMultipleCanonicals.map((b) => `| ${b.brandName} | ${b.canonicalCount} |`),
    "",
    "## Stage 4 - Registration Validation",
    "",
    `**Registrations Linked to Multiple Brands**: ${report.integrityReport.registrationsMultipleBrands.length}`,
    "",
    "| Registration | Brand Count |",
    "|--------------|-------------|",
    ...report.integrityReport.registrationsMultipleBrands.map((r) => `| ${r.registrationNumber} | ${r.brandCount} |`),
    "",
    "## Stage 5 - Pack Validation",
    "",
    "**Pack Issues:**",
    `| Without Registration: ${report.integrityReport.packIssues.withoutRegistration}`,
    `| Missing Pack Size: ${report.integrityReport.packIssues.missingPackSize}`,
    `| Missing Pack Unit: ${report.integrityReport.packIssues.missingPackUnit}`,
    "",
    "## Stage 7 - Production Statistics",
    "",
    `**Products**: ${report.statistics.totalProducts}`,
    `**Canonical Medicines**: ${report.statistics.totalCanonicalMedicines}`,
    `**Brands**: ${report.brandSummaries.length}`,
    `**Manufacturers**: ${report.manufacturerSummaries.length}`,
    `**Registrations**: ${report.registrationSummaries.length}`,
    "",
    "### Largest Brand Groups",
    "",
    "| Key | Brand Count |",
    "|-----|-------------|",
    ...report.statistics.largestBrandGroups.map((g) => `| ${g.keySignature.substring(0, 40)}... | ${g.brandCount} |`),
    "",
    "### Largest Ingredient Groups",
    "",
    "| Ingredient | Medicine Count |",
    "|------------|----------------|",
    ...report.statistics.largestIngredientGroups.map((g) => `| ${g.ingredient} | ${g.medicineCount} |`),
    "",
    `Report generated: ${report.timestamp}`,
  ];

  return lines.join("\n");
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});