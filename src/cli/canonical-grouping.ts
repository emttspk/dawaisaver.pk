import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

interface CanonicalMedicineKey {
  ingredientSet: string;     // sorted normalized generic names
  strengthSet: string;       // sorted strength values
  strengthUnitSet: string;     // sorted strength units
  dosageForm: string;          // normalized
  route: string;             // normalized (pending)
  packSize: string;            // normalized pack size
  packUnit: string;            // normalized pack unit
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
        writeFile(join(reportsDir, `canonical-summary-${timestamp}.json`), `${JSON.stringify(toJsonFriendly(report.canonicalMedicines), null, 2)}\n`, "utf8"),
        writeFile(join(reportsDir, `ingredient-summary-${timestamp}.json`), `${JSON.stringify(toJsonFriendly(Object.values(report.ingredientSummaries)), null, 2)}\n`, "utf8"),
        writeFile(join(reportsDir, `brand-summary-${timestamp}.json`), `${JSON.stringify(toJsonFriendly(report.brandSummaries), null, 2)}\n`, "utf8"),
        writeFile(join(reportsDir, `manufacturer-summary-${timestamp}.json`), `${JSON.stringify(toJsonFriendly(report.manufacturerSummaries), null, 2)}\n`, "utf8"),
        writeFile(join(reportsDir, `registration-summary-${timestamp}.json`), `${JSON.stringify(toJsonFriendly(report.registrationSummaries), null, 2)}\n`, "utf8"),
        writeFile(join(reportsDir, `grouping-statistics-${timestamp}.json`), `${JSON.stringify(report.statistics, null, 2)}\n`, "utf8"),
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
  const ingredientMap = new Map<string, IngredientSummary>();
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
    const packSize = product.packSize || "";
    const packUnit = "";

    const key: CanonicalMedicineKey = { ingredientSet, strengthSet, strengthUnitSet, dosageForm, route, packSize, packUnit };
    const keySignature = [ingredientSet, strengthSet, strengthUnitSet, dosageForm, route, packSize, packUnit]
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

  const duplicateRegistrationsMap = new Map<string, number>();
  for (const product of products) {
    if (product.registrationNumber) {
      duplicateRegistrationsMap.set(product.registrationNumber, (duplicateRegistrationsMap.get(product.registrationNumber) || 0) + 1);
    }
  }

  const duplicateRegistrations = Array.from(duplicateRegistrationsMap.entries())
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
      duplicateRegistrations,
      largestBrandGroups,
      largestIngredientGroups,
    },
    canonicalMedicines,
    ingredientSummaries,
    brandSummaries,
    manufacturerSummaries,
    registrationSummaries,
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
    "# Phase 37 - Medicine Intelligence Model",
    "",
    "## Stage 1 - Field Audit",
    "",
    "**Fields Available for Medicine Identification:**",
    "",
    "| Field | Schema Location | Status |",
    "|-------|-----------------|--------|",
    "| Ingredient | ProductComposition.generic.normalized_name | ✓ Available |",
    "| Strength | ProductComposition.strengthText | ✓ Available |",
    "| Strength Unit | ProductComposition.strengthUnit | ✓ Available |",
    "| Dosage Form | Product.normalizedForm/dosageForm | ✓ Available |",
    "| Route | ImportBatchItem.normalizedData.routeOfAdmin | ⏳ Pending |",
    "| Pack Size | Product.packSize | ✓ Available |",
    "| Pack Unit | ProductPack.packSizeUnits | ✓ Available |",
    "| Manufacturer | Manufacturer.name | ✓ Available |",
    "| Applicant | Manufacturer.name | ✓ Available (same as manufacturer) |",
    "| Registration | Product.registrationNumber | ✓ Available |",
    "| Brand | Product.brandName | ✓ Available |",
    "| Country | Manufacturer.country | ✓ Available |",
    "| ATC | AtcClassification.code | ✓ Via Generic |",
    "| Therapeutic Category | TherapeuticCategory.code | ✓ Via Product |",
    "",
    "## Stage 2 - Canonical Medicine Key Design",
    "",
    "**Key Composition (excludes Brand, Manufacturer, Registration):**",
    "- Ingredient Set (sorted)",
    "- Strength Set (sorted)",
    "- Strength Unit Set (sorted)",
    "- Dosage Form",
    "- Route",
    "- Pack Size",
    "- Pack Unit",
    "",
    "## Stage 5 - Verification Report",
    "",
    `**Products**: ${report.statistics.totalProducts}`,
    "",
    `**Canonical Medicines**: ${report.statistics.totalCanonicalMedicines}`,
    "",
    `**Brands**: ${report.brandSummaries.length}`,
    "",
    `**Manufacturers**: ${report.manufacturerSummaries.length}`,
    "",
    `**Registrations**: ${report.registrationSummaries.length}`,
    "",
    "### Duplicate Registrations",
    "",
    "| Registration Number | Product Count |",
    "|---------------------|---------------|",
    ...report.statistics.duplicateRegistrations.map((r) => `| ${r.registrationNumber} | ${r.productCount} |`),
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
    "|------------|--------------|",
    ...report.statistics.largestIngredientGroups.map((g) => `| ${g.ingredient} | ${g.medicineCount} |`),
    "",
    "## Stage 6 - Generated Reports",
    "",
    "- canonical-summary.json",
    "- ingredient-summary.json",
    "- brand-summary.json",
    "- manufacturer-summary.json",
    "- registration-summary.json",
    "- grouping-statistics.json",
    "",
    `Report generated: ${report.timestamp}`,
  ];

  return lines.join("\n");
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});