import { PrismaService } from '../database/prisma.service';
import { deterministicUuid } from '../modules/master-builder/utils/uuid-generator';

type AggregateBase = {
  id: string;
  name: string;
  normalizedKey: string;
  sourceType: string | null;
  sourceUrl: string | null;
  country: string | null;
  sourceCount: number;
  registrationNumbers: Set<string>;
};

interface PackAggregate extends AggregateBase {
  normalizedPackLabel: string;
  unitCount: number | null;
  unitType: string | null;
  volumeMl: string | null;
  weightG: string | null;
  containerCount: number | null;
}

interface StrengthAggregate extends AggregateBase {
  value: string | null;
  unit: string | null;
  normalizedValue: string;
}

interface PopulationStats {
  totalProducts: number;
  manufacturersCreated: number;
  manufacturersUpdated: number;
  ingredientsCreated: number;
  ingredientsUpdated: number;
  applicantsCreated: number;
  applicantsUpdated: number;
  dosageFormsCreated: number;
  dosageFormsUpdated: number;
  strengthsCreated: number;
  strengthsUpdated: number;
  packsCreated: number;
  packsUpdated: number;
  routesCreated: number;
  routesUpdated: number;
  atcCodesCreated: number;
  atcCodesUpdated: number;
  therapeuticCategoriesCreated: number;
  therapeuticCategoriesUpdated: number;
  errors: number;
}

async function main(): Promise<void> {
  console.log('\n=== PRODUCTION MASTER TABLE POPULATION ===');
  console.log(`DATABASE_URL: ${maskDatabaseUrl(process.env.DATABASE_URL || 'NOT SET')}`);
  console.log('============================================\n');

  const prisma = new PrismaService();
  await prisma.$connect();

  try {
    const stats: PopulationStats = {
      totalProducts: 0,
      manufacturersCreated: 0,
      manufacturersUpdated: 0,
      ingredientsCreated: 0,
      ingredientsUpdated: 0,
      applicantsCreated: 0,
      applicantsUpdated: 0,
      dosageFormsCreated: 0,
      dosageFormsUpdated: 0,
      strengthsCreated: 0,
      strengthsUpdated: 0,
      packsCreated: 0,
      packsUpdated: 0,
      routesCreated: 0,
      routesUpdated: 0,
      atcCodesCreated: 0,
      atcCodesUpdated: 0,
      therapeuticCategoriesCreated: 0,
      therapeuticCategoriesUpdated: 0,
      errors: 0,
    };

    const manufacturers = new Map<string, AggregateBase>();
    const ingredients = new Map<string, AggregateBase>();
    const applicants = new Map<string, AggregateBase>();
    const dosageForms = new Map<string, AggregateBase>();
    const strengths = new Map<string, StrengthAggregate>();
    const packs = new Map<string, PackAggregate>();
    const routes = new Map<string, AggregateBase>();
    const atcCodes = new Map<string, AggregateBase>();
    const therapeuticCategories = new Map<string, AggregateBase>();

    console.log('Reading products from catalog...\n');

    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      include: {
        manufacturer: true,
        compositions: { include: { generic: true } },
      },
    });

    stats.totalProducts = products.length;
    console.log(`Found ${products.length} products\n`);

    for (const product of products) {
      try {
        if (product.manufacturer) {
          addAggregate(manufacturers, product.manufacturer.name, product.manufacturer.country, product.registrationNumber);
        }

        for (const composition of product.compositions) {
          if (composition.generic) {
            addAggregate(ingredients, composition.generic.name);
          }
        }

        if (product.dosageForm) {
          addAggregate(dosageForms, product.dosageForm);
        }

        if (product.packSize) {
          const normalizedPackLabel = normalizeString(product.packSize);
          const existingPack = packs.get(normalizedPackLabel);
          if (existingPack) {
            existingPack.sourceCount++;
            if (product.registrationNumber) {
              existingPack.registrationNumbers.add(product.registrationNumber);
            }
          } else {
            const parsed = parsePackSize(product.packSize);
            packs.set(normalizedPackLabel, {
              id: deterministicUuid(`pack:${normalizedPackLabel}`),
              name: product.packSize,
              normalizedKey: normalizedPackLabel,
              sourceType: 'SYSTEM',
              sourceUrl: null,
              country: null,
              sourceCount: 1,
              registrationNumbers: new Set(product.registrationNumber ? [product.registrationNumber] : []),
              normalizedPackLabel,
              unitCount: parsed.unitCount,
              unitType: parsed.unitType,
              volumeMl: parsed.volumeMl,
              weightG: parsed.weightG,
              containerCount: parsed.containerCount,
            });
          }
        }

        if (product.strengthText) {
          const normalizedValue = normalizeString(product.strengthText);
          const existingStrength = strengths.get(normalizedValue);
          if (existingStrength) {
            existingStrength.sourceCount++;
            if (product.registrationNumber) {
              existingStrength.registrationNumbers.add(product.registrationNumber);
            }
          } else {
            strengths.set(normalizedValue, {
              id: deterministicUuid(`strength:${normalizedValue}`),
              name: product.strengthText,
              normalizedKey: normalizedValue,
              sourceType: 'SYSTEM',
              sourceUrl: null,
              country: null,
              sourceCount: 1,
              registrationNumbers: new Set(product.registrationNumber ? [product.registrationNumber] : []),
              value: product.strengthText,
              unit: null,
              normalizedValue,
            });
          }
        }
      } catch (error) {
        stats.errors++;
        console.error(`Error processing product ${product.id}:`, error);
      }
    }

    await persistReferenceTables(prisma, { manufacturers, ingredients, applicants, dosageForms, strengths, packs, routes, atcCodes, therapeuticCategories, stats });

    console.log('\n=== Master Table Population Report ===');
    console.log(`Total Products: ${stats.totalProducts}`);
    console.log(`\n--- Manufacturers ---`);
    console.log(`Created: ${stats.manufacturersCreated}`);
    console.log(`Updated: ${stats.manufacturersUpdated}`);
    console.log(`Unique: ${manufacturers.size}`);
    console.log(`\n--- Ingredients ---`);
    console.log(`Created: ${stats.ingredientsCreated}`);
    console.log(`Updated: ${stats.ingredientsUpdated}`);
    console.log(`Unique: ${ingredients.size}`);
    console.log(`\n--- Applicants ---`);
    console.log(`Created: ${stats.applicantsCreated}`);
    console.log(`Updated: ${stats.applicantsUpdated}`);
    console.log(`Unique: ${applicants.size}`);
    console.log(`\n--- Dosage Forms ---`);
    console.log(`Created: ${stats.dosageFormsCreated}`);
    console.log(`Updated: ${stats.dosageFormsUpdated}`);
    console.log(`Unique: ${dosageForms.size}`);
    console.log(`\n--- Strengths ---`);
    console.log(`Created: ${stats.strengthsCreated}`);
    console.log(`Updated: ${stats.strengthsUpdated}`);
    console.log(`Unique: ${strengths.size}`);
    console.log(`\n--- Packs ---`);
    console.log(`Created: ${stats.packsCreated}`);
    console.log(`Updated: ${stats.packsUpdated}`);
    console.log(`Unique: ${packs.size}`);
    console.log(`\n--- Routes ---`);
    console.log(`Created: ${stats.routesCreated}`);
    console.log(`Updated: ${stats.routesUpdated}`);
    console.log(`Unique: ${routes.size}`);
    console.log(`\n--- ATC Codes ---`);
    console.log(`Created: ${stats.atcCodesCreated}`);
    console.log(`Updated: ${stats.atcCodesUpdated}`);
    console.log(`Unique: ${atcCodes.size}`);
    console.log(`\n--- Therapeutic Categories ---`);
    console.log(`Created: ${stats.therapeuticCategoriesCreated}`);
    console.log(`Updated: ${stats.therapeuticCategoriesUpdated}`);
    console.log(`Unique: ${therapeuticCategories.size}`);
    console.log(`\n--- Errors ---`);
    console.log(`Failed: ${stats.errors}`);
  } finally {
    await prisma.$disconnect();
  }
}

function addAggregate(
  map: Map<string, AggregateBase>,
  label: string,
  country: string | null = null,
  registrationNumber: string | null = null,
): void {
  const normalizedKey = normalizeString(label);
  if (!normalizedKey) return;

  const existing = map.get(normalizedKey);
  if (existing) {
    existing.sourceCount++;
    if (registrationNumber) {
      existing.registrationNumbers.add(registrationNumber);
    }
    return;
  }

  map.set(normalizedKey, {
    id: deterministicUuid(normalizedKey),
    name: label,
    normalizedKey,
    sourceType: 'SYSTEM',
    sourceUrl: null,
    country,
    sourceCount: 1,
    registrationNumbers: new Set(registrationNumber ? [registrationNumber] : []),
  });
}

function parsePackSize(packSize: string): { unitCount: number | null; unitType: string | null; volumeMl: string | null; weightG: string | null; containerCount: number | null } {
  const unitCountMatch = packSize.match(/(\d+)\s*(?:container?s?|box|carton|strip|strip?s|tablet|s|ml|g|mg)?/i);
  const unitTypeMatch = packSize.match(/(tablet|strip|box|carton|container|ml|g|mg)/i);
  const volumeMatch = packSize.match(/(\d+(?:\.\d+)?)\s*ml/i);
  const weightMatch = packSize.match(/(\d+(?:\.\d+)?)\s*g/i);
  
  return {
    unitCount: unitCountMatch ? parseInt(unitCountMatch[1], 10) : null,
    unitType: unitTypeMatch ? unitTypeMatch[1].toLowerCase() : null,
    volumeMl: volumeMatch ? volumeMatch[1] : null,
    weightG: weightMatch ? weightMatch[1] : null,
    containerCount: null,
  };
}

function normalizeString(value: string | null | undefined): string {
  return String(value || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

function maskDatabaseUrl(value: string): string {
  if (!value || value === 'NOT SET') return value;
  try {
    const url = new URL(value);
    if (url.password) {
      url.password = '***';
    }
    return url.toString();
  } catch {
    return value.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
  }
}

async function persistReferenceTables(
  prisma: any,
  data: {
    manufacturers: Map<string, AggregateBase>;
    ingredients: Map<string, AggregateBase>;
    applicants: Map<string, AggregateBase>;
    dosageForms: Map<string, AggregateBase>;
    strengths: Map<string, StrengthAggregate>;
    packs: Map<string, PackAggregate>;
    routes: Map<string, AggregateBase>;
    atcCodes: Map<string, AggregateBase>;
    therapeuticCategories: Map<string, AggregateBase>;
    stats: PopulationStats;
  },
): Promise<void> {
  for (const item of data.manufacturers.values()) {
    const existing = await prisma.manufacturerMaster.findUnique({ where: { id: item.id } });
    await prisma.manufacturerMaster.upsert({
      where: { id: item.id },
      create: buildManufacturerData(item),
      update: buildManufacturerData(item, existing?.approvalStatus ?? undefined),
    });
    existing ? data.stats.manufacturersUpdated++ : data.stats.manufacturersCreated++;
  }

  for (const item of data.ingredients.values()) {
    const existing = await prisma.ingredientMaster.findUnique({ where: { id: item.id } });
    await prisma.ingredientMaster.upsert({
      where: { id: item.id },
      create: buildIngredientData(item),
      update: buildIngredientData(item, existing?.approvalStatus ?? undefined),
    });
    existing ? data.stats.ingredientsUpdated++ : data.stats.ingredientsCreated++;
  }

  for (const item of data.applicants.values()) {
    const existing = await prisma.applicantMaster.findUnique({ where: { id: item.id } });
    await prisma.applicantMaster.upsert({
      where: { id: item.id },
      create: buildApplicantData(item),
      update: buildApplicantData(item, existing?.approvalStatus ?? undefined),
    });
    existing ? data.stats.applicantsUpdated++ : data.stats.applicantsCreated++;
  }

  for (const item of data.dosageForms.values()) {
    const existing = await prisma.dosageFormMaster.findUnique({ where: { id: item.id } });
    await prisma.dosageFormMaster.upsert({
      where: { id: item.id },
      create: buildSimpleData(item),
      update: buildSimpleData(item, existing?.approvalStatus ?? undefined),
    });
    existing ? data.stats.dosageFormsUpdated++ : data.stats.dosageFormsCreated++;
  }

  for (const item of data.strengths.values()) {
    const existing = await prisma.strengthMaster.findUnique({ where: { id: item.id } });
    await prisma.strengthMaster.upsert({
      where: { id: item.id },
      create: buildStrengthData(item),
      update: buildStrengthData(item, existing?.approvalStatus ?? undefined),
    });
    existing ? data.stats.strengthsUpdated++ : data.stats.strengthsCreated++;
  }

  for (const item of data.packs.values()) {
    const existing = await prisma.packMaster.findUnique({ where: { id: item.id } });
    await prisma.packMaster.upsert({
      where: { id: item.id },
      create: buildPackData(item),
      update: buildPackData(item, existing?.approvalStatus ?? undefined),
    });
    existing ? data.stats.packsUpdated++ : data.stats.packsCreated++;
  }

  for (const item of data.routes.values()) {
    const existing = await prisma.routeMaster.findUnique({ where: { id: item.id } });
    await prisma.routeMaster.upsert({
      where: { id: item.id },
      create: buildSimpleData(item),
      update: buildSimpleData(item, existing?.approvalStatus ?? undefined),
    });
    existing ? data.stats.routesUpdated++ : data.stats.routesCreated++;
  }

  for (const item of data.atcCodes.values()) {
    const existing = await prisma.atcMaster.findUnique({ where: { id: item.id } });
    await prisma.atcMaster.upsert({
      where: { id: item.id },
      create: buildAtcData(item),
      update: buildAtcData(item, existing?.approvalStatus ?? undefined),
    });
    existing ? data.stats.atcCodesUpdated++ : data.stats.atcCodesCreated++;
  }

  for (const item of data.therapeuticCategories.values()) {
    const existing = await prisma.therapeuticCategoryMaster.findUnique({ where: { id: item.id } });
    await prisma.therapeuticCategoryMaster.upsert({
      where: { id: item.id },
      create: buildSimpleData(item),
      update: buildSimpleData(item, existing?.approvalStatus ?? undefined),
    });
    existing ? data.stats.therapeuticCategoriesUpdated++ : data.stats.therapeuticCategoriesCreated++;
  }
}

function buildManufacturerData(item: AggregateBase, approvalStatus?: string): any {
  return {
    id: item.id,
    name: item.name,
    normalizedName: item.normalizedKey,
    country: item.country,
    websiteUrl: null,
    status: 'PENDING_REVIEW',
    confidenceScore: 0.9,
    sourceType: 'SYSTEM',
    sourceUrl: item.sourceUrl,
    rawHtml: null,
    normalizedJson: null,
    validationStatus: null,
    approvalStatus: approvalStatus ?? 'PENDING',
    linkedRegistrations: item.registrationNumbers.size,
    metadata: {
      registrationNumbers: Array.from(item.registrationNumbers),
      sourceCount: item.sourceCount,
    },
  };
}

function buildIngredientData(item: AggregateBase, approvalStatus?: string): any {
  return {
    id: item.id,
    name: item.name,
    normalizedName: item.normalizedKey,
    whoMatched: null,
    whoCode: null,
    status: 'PENDING_REVIEW',
    confidenceScore: 0.9,
    sourceType: 'SYSTEM',
    sourceUrl: item.sourceUrl,
    rawHtml: null,
    normalizedJson: null,
    validationStatus: null,
    approvalStatus: approvalStatus ?? 'PENDING',
    linkedRegistrations: item.registrationNumbers.size,
    metadata: {
      registrationNumbers: Array.from(item.registrationNumbers),
      sourceCount: item.sourceCount,
    },
  };
}

function buildApplicantData(item: AggregateBase, approvalStatus?: string): any {
  return {
    id: item.id,
    name: item.name,
    normalizedName: item.normalizedKey,
    country: item.country,
    status: 'PENDING_REVIEW',
    confidenceScore: 0.9,
    sourceType: 'SYSTEM',
    sourceUrl: item.sourceUrl,
    rawHtml: null,
    normalizedJson: null,
    validationStatus: null,
    approvalStatus: approvalStatus ?? 'PENDING',
    linkedRegistrations: item.registrationNumbers.size,
    metadata: {
      registrationNumbers: Array.from(item.registrationNumbers),
      sourceCount: item.sourceCount,
    },
  };
}

function buildSimpleData(item: AggregateBase, approvalStatus?: string): any {
  return {
    id: item.id,
    name: item.name,
    normalizedName: item.normalizedKey,
    status: 'PENDING_REVIEW',
    confidenceScore: 0.9,
    sourceType: 'SYSTEM',
    sourceUrl: item.sourceUrl,
    rawHtml: null,
    normalizedJson: null,
    validationStatus: null,
    approvalStatus: approvalStatus ?? 'PENDING',
    linkedRegistrations: item.registrationNumbers.size,
    metadata: {
      registrationNumbers: Array.from(item.registrationNumbers),
      sourceCount: item.sourceCount,
    },
  };
}

function buildStrengthData(item: StrengthAggregate, approvalStatus?: string): any {
  return {
    id: item.id,
    value: item.value,
    unit: item.unit,
    normalizedValue: item.normalizedValue,
    status: 'PENDING_REVIEW',
    confidenceScore: 0.9,
    sourceType: 'SYSTEM',
    sourceUrl: item.sourceUrl,
    rawHtml: null,
    normalizedJson: null,
    validationStatus: null,
    approvalStatus: approvalStatus ?? 'PENDING',
    linkedRegistrations: item.registrationNumbers.size,
    metadata: {
      registrationNumbers: Array.from(item.registrationNumbers),
      sourceCount: item.sourceCount,
    },
  };
}

function buildPackData(item: PackAggregate, approvalStatus?: string): any {
  return {
    id: item.id,
    unitCount: item.unitCount,
    unitType: item.unitType,
    volumeMl: item.volumeMl,
    weightG: item.weightG,
    containerCount: item.containerCount,
    normalizedPackLabel: item.normalizedPackLabel,
    status: 'PENDING_REVIEW',
    confidenceScore: 0.9,
    sourceType: 'SYSTEM',
    sourceUrl: item.sourceUrl,
    rawHtml: null,
    normalizedJson: null,
    validationStatus: null,
    approvalStatus: approvalStatus ?? 'PENDING',
    linkedRegistrations: item.registrationNumbers.size,
    metadata: {
      registrationNumbers: Array.from(item.registrationNumbers),
      sourceCount: item.sourceCount,
    },
  };
}

function buildAtcData(item: AggregateBase, approvalStatus?: string): any {
  return {
    id: item.id,
    code: item.name.replace(/\s+/g, '').toUpperCase(),
    name: item.name,
    level: null,
    parentCode: null,
    status: 'PENDING_REVIEW',
    confidenceScore: 0.9,
    sourceType: 'SYSTEM',
    sourceUrl: item.sourceUrl,
    rawHtml: null,
    normalizedJson: null,
    validationStatus: null,
    approvalStatus: approvalStatus ?? 'PENDING',
    linkedRegistrations: item.registrationNumbers.size,
    metadata: {
      registrationNumbers: Array.from(item.registrationNumbers),
      sourceCount: item.sourceCount,
    },
  };
}

void main();