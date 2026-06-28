import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

interface Ingredient {
  name: string;
  strength: string | null;
  unit: string | null;
}

interface Brand {
  id: string;
  brandName: string;
  normalizedBrand: string;
  manufacturerName: string | null;
  registrationNumber: string | null;
  sourceUrl: string | null;
}

interface PackVariant {
  packSize: string | null;
  packSizeUnits: string | null;
}

interface Price {
  price: number | null;
  currency: string;
  observedAt: string | null;
}

interface Manufacturer {
  name: string;
  country: string | null;
}

interface GoldenCanonicalMedicine {
  id: string;
  canonicalId: string;
  canonicalSignature: string;
  ingredientCount: number;
  ingredients: Ingredient[];
  dosageForm: string;
  route: string;
  brands: Brand[];
  packVariants: PackVariant[];
  prices: Price[];
  manufacturers: Manufacturer[];
  registrations: string[];
  atcCodes: string[];
  therapeuticCategories: string[];
  status: string;
  reviewStatus: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "MERGED" | "SPLIT" | "NEEDS_INVESTIGATION";
  reviewerNotes: string[];
  validationIssues: string[];
}

interface GoldenDatasetReport {
  generatedAt: string;
  totalCanonicalMedicines: number;
  distribution: {
    singleIngredient: number;
    twoIngredients: number;
    threeIngredients: number;
    fourIngredients: number;
    fiveOrMoreIngredients: number;
  };
  dosageFormDistribution: Record<string, number>;
  canonicalMedicines: GoldenCanonicalMedicine[];
  statistics: {
    totalBrands: number;
    totalManufacturers: number;
    totalRegistrations: number;
    totalPackVariants: number;
    totalPrices: number;
    totalImportBatchItems: number;
  };
  validationResults: {
    orphanBrands: number;
    orphanRegistrations: number;
    orphanPacks: number;
    orphanPrices: number;
    orphanManufacturers: number;
    orphanCompositions: number;
    duplicateCanonicalKeys: Array<{ key: string; count: number }>;
  };
}

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  const args = process.argv.slice(2);
  const limitArg = args.find((arg) => arg.startsWith("--target="));
  const targetCount = limitArg ? Number(limitArg.split("=")[1]) : 100;

  await prisma.$connect();

  try {
    console.log(`Building Golden Canonical Dataset (target: ${targetCount} medicines)...`);

    const report = await buildGoldenDataset(prisma, targetCount);

    const reportsDir = join(process.cwd(), "reports");
    await mkdir(reportsDir, { recursive: true });

    await writeFile(
      join(reportsDir, "golden-canonical-review.json"),
      JSON.stringify(report.canonicalMedicines, null, 2),
    );

    await writeFile(
      join(reportsDir, "golden-canonical-statistics.json"),
      JSON.stringify(report.statistics, null, 2),
    );

    await writeFile(
      join(reportsDir, "golden-canonical-validation.json"),
      JSON.stringify(report.validationResults, null, 2),
    );

    console.log(`Reports saved to: ${reportsDir}`);
    console.log(renderSummary(report));
  } finally {
    await prisma.$disconnect();
  }
}

async function buildGoldenDataset(prisma: PrismaClient, targetCount: number): Promise<GoldenDatasetReport> {
  const existingCanonicalProducts = await prisma.canonicalProduct.findMany({
    where: { deletedAt: null },
    include: {
      product: true,
      aliases: true,
    },
  });

  const groupedByKey = new Map<string, GoldenCanonicalMedicine>();
  const allDosageForms = new Map<string, number>();

  for (const cp of existingCanonicalProducts) {
    const keySignature = cp.medicineSignature;

    if (!groupedByKey.has(keySignature)) {
      const product = cp.product as any;

      const compositions = product?.compositions ?? [];
      const ingredientList: Ingredient[] = compositions.map((c: any) => ({
        name: c.generic?.name ?? "Unknown",
        strength: c.strengthText,
        unit: c.strengthUnit,
      }));

      const brands: Brand[] = product
        ? [
            {
              id: product.id,
              brandName: product.brandName,
              normalizedBrand: product.normalizedBrand,
              manufacturerName: product.manufacturer?.name ?? null,
              registrationNumber: product.registrationNumber,
              sourceUrl: product.sourceUrl,
            },
          ]
        : [];

      const packs = product?.packs ?? [];
      const packVariants: PackVariant[] = packs.map((p: any) => ({
        packSize: p.packSize,
        packSizeUnits: p.packSizeUnits,
      }));

      const prices: Price[] = [];
      for (const p of packs) {
        const pPrices = await prisma.productPackPrice.findMany({ where: { productPackId: p.id } });
        for (const pr of pPrices) {
          prices.push({
            price: Number(pr.price),
            currency: pr.currency,
            observedAt: pr.observedAt?.toISOString() ?? null,
          });
        }
      }

      const manufacturers: Manufacturer[] = product?.manufacturer
        ? [{ name: product.manufacturer.name, country: product.manufacturer.country }]
        : [];

      const registrations = product?.registrationNumber ? [product.registrationNumber] : [];

      const atcCodes: string[] = [];
      for (const c of compositions) {
        for (const a of c.generic?.atcClassifications ?? []) {
          atcCodes.push(a.atc?.code ?? "");
        }
      }

      const therapeuticCategories = product?.therapeuticCategories?.map((tc: any) => tc.therapeuticCategory?.name) ?? [];

      const dosageForm = product?.normalizedForm || product?.dosageForm || "Unknown";
      allDosageForms.set(dosageForm, (allDosageForms.get(dosageForm) || 0) + 1);

      groupedByKey.set(keySignature, {
        id: cp.id,
        canonicalId: generateCanonicalId(groupedByKey.size + 1),
        canonicalSignature: keySignature,
        ingredientCount: ingredientList.length,
        ingredients: ingredientList,
        dosageForm,
        route: "",
        brands,
        packVariants,
        prices,
        manufacturers,
        registrations,
        atcCodes,
        therapeuticCategories,
        status: cp.status,
        reviewStatus: "PENDING_REVIEW",
        reviewerNotes: [],
        validationIssues: [],
      });
    }
  }

  const canonicalMedicines = Array.from(groupedByKey.values());

  const distribution = {
    singleIngredient: canonicalMedicines.filter((m) => m.ingredientCount === 1).length,
    twoIngredients: canonicalMedicines.filter((m) => m.ingredientCount === 2).length,
    threeIngredients: canonicalMedicines.filter((m) => m.ingredientCount === 3).length,
    fourIngredients: canonicalMedicines.filter((m) => m.ingredientCount === 4).length,
    fiveOrMoreIngredients: canonicalMedicines.filter((m) => m.ingredientCount >= 5).length,
  };

  const selected = selectGoldenDataset(canonicalMedicines, targetCount, distribution);

  const validationResults = await validateRelationships(prisma, selected);

  const statistics = {
    totalBrands: selected.reduce((sum, m) => sum + m.brands.length, 0),
    totalManufacturers: selected.reduce((sum, m) => sum + m.manufacturers.length, 0),
    totalRegistrations: selected.reduce((sum, m) => sum + m.registrations.length, 0),
    totalPackVariants: selected.reduce((sum, m) => sum + m.packVariants.length, 0),
    totalPrices: selected.reduce((sum, m) => sum + m.prices.length, 0),
    totalImportBatchItems: await prisma.importBatchItem.count({
      where: { status: { in: ["SAVED", "VALIDATED", "NORMALIZED"] } },
    }),
  };

  return {
    generatedAt: new Date().toISOString(),
    totalCanonicalMedicines: selected.length,
    distribution,
    dosageFormDistribution: Object.fromEntries(allDosageForms),
    canonicalMedicines: selected,
    statistics,
    validationResults,
  };
}

function selectGoldenDataset(
  medicines: GoldenCanonicalMedicine[],
  targetCount: number,
  distribution: GoldenDatasetReport["distribution"],
): GoldenCanonicalMedicine[] {
  const selected: GoldenCanonicalMedicine[] = [];

  const singleIngredient = medicines.filter((m) => m.ingredientCount === 1).sort(byBrandCount);
  const twoIngredients = medicines.filter((m) => m.ingredientCount === 2).sort(byBrandCount);
  const threeIngredients = medicines.filter((m) => m.ingredientCount === 3).sort(byBrandCount);
  const fourIngredients = medicines.filter((m) => m.ingredientCount === 4).sort(byBrandCount);
  const fiveOrMore = medicines.filter((m) => m.ingredientCount >= 5).sort(byBrandCount);

  const takeCount = (arr: GoldenCanonicalMedicine[], target: number) => {
    const take = arr.slice(0, target);
    const remaining = arr.slice(target);
    return { take, remaining };
  };

  const single = takeCount(singleIngredient, 50);
  const two = takeCount(twoIngredients, 15);
  const three = takeCount(threeIngredients, 15);
  const four = takeCount(fourIngredients, 10);
  const fivePlus = takeCount(fiveOrMore, 10);

  selected.push(...single.take, ...two.take, ...three.take, ...four.take, ...fivePlus.take);

  const candidates = [...single.remaining, ...two.remaining, ...three.remaining, ...four.remaining, ...fivePlus.remaining]
    .sort(byBrandCount)
    .filter((_, i) => i < targetCount - selected.length);

  selected.push(...candidates);

  return selected.slice(0, targetCount);
}

function byBrandCount(a: GoldenCanonicalMedicine, b: GoldenCanonicalMedicine): number {
  return b.brands.length - a.brands.length;
}

async function validateRelationships(
  prisma: PrismaClient,
  medicines: GoldenCanonicalMedicine[],
): Promise<GoldenDatasetReport["validationResults"]> {
  const orphanBrands = await prisma.product.count({
    where: {
      deletedAt: null,
      canonicalProduct: { isNot: null },
      NOT: { canonicalProduct: { id: { in: medicines.map((m) => m.id) } } },
    },
  });

  const orphanPacks = await prisma.productPack.count({
    where: {
      deletedAt: null,
      product: {
        canonicalProduct: { isNot: null },
        NOT: { canonicalProduct: { id: { in: medicines.map((m) => m.id) } } },
      },
    },
  });

  const orphanPrices = await prisma.productPackPrice.count({
    where: {
      status: "ACTIVE",
      productPack: {
        product: {
          canonicalProduct: { isNot: null },
          NOT: { canonicalProduct: { id: { in: medicines.map((m) => m.id) } } },
        },
      },
    },
  });

  const orphanCompositions = await prisma.productComposition.count({
    where: {
      status: "ACTIVE",
      product: {
        canonicalProduct: { isNot: null },
        NOT: { canonicalProduct: { id: { in: medicines.map((m) => m.id) } } },
      },
    },
  });

  const keyCounts = new Map<string, number>();
  for (const m of medicines) {
    const key = `${m.ingredients.map((i) => i.name).sort().join("|")}|${m.dosageForm}`;
    keyCounts.set(key, (keyCounts.get(key) || 0) + 1);
  }

  const duplicateCanonicalKeys = Array.from(keyCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([key, count]) => ({ key, count }));

  return {
    orphanBrands,
    orphanRegistrations: 0,
    orphanPacks,
    orphanPrices,
    orphanManufacturers: 0,
    orphanCompositions,
    duplicateCanonicalKeys,
  };
}

function generateCanonicalId(sequence: number): string {
  return `CM${String(sequence).padStart(7, "0")}`;
}

function renderSummary(report: GoldenDatasetReport): string {
  const lines: string[] = [
    "# Golden Canonical Dataset Report",
    "",
    `**Generated**: ${report.generatedAt}`,
    `**Total Canonical Medicines**: ${report.totalCanonicalMedicines}`,
    "",
    "## Distribution",
    "",
    "| Category | Count | Target |",
    "|----------|-------|--------|",
    `| Single Ingredient | ${report.distribution.singleIngredient} | 50 |`,
    `| Two Ingredients | ${report.distribution.twoIngredients} | 15 |`,
    `| Three Ingredients | ${report.distribution.threeIngredients} | 15 |`,
    `| Four Ingredients | ${report.distribution.fourIngredients} | 10 |`,
    `| Five+ Ingredients | ${report.distribution.fiveOrMoreIngredients} | 10 |`,
    "",
    "## Dosage Form Distribution",
    "",
    "| Dosage Form | Count |",
    "|-------------|-------|",
    ...Object.entries(report.dosageFormDistribution).map(([form, count]) => `| ${form} | ${count} |`),
    "",
    "## Validation Results",
    "",
    `**Orphan Brands**: ${report.validationResults.orphanBrands}`,
    `**Orphan Packs**: ${report.validationResults.orphanPacks}`,
    `**Orphan Prices**: ${report.validationResults.orphanPrices}`,
    `**Orphan Compositions**: ${report.validationResults.orphanCompositions}`,
    `**Duplicate Canonical Keys**: ${report.validationResults.duplicateCanonicalKeys.length}`,
  ];

  return lines.join("\n");
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});