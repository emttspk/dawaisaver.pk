import { PrismaService } from '../database/prisma.service';
import { mapImportBatchItemToCatalogRecord } from '../modules/catalog/catalog.mapper';
import { normalizePack } from '../modules/catalog/pack-normalizer';
import { deterministicUuid } from '../modules/master-builder/utils/uuid-generator';

type RegistrationSet = Set<string>;

interface AggregateBase {
  id: string;
  name: string;
  normalizedKey: string;
  sourceType: string | null;
  sourceUrl: string | null;
  country: string | null;
  sourceCount: number;
  registrationNumbers: RegistrationSet;
}

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
  totalItems: number;
  itemsWithNormalizedData: number;
  unsupportedItems: number;
  itemsMissingFields: number;
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
  console.log('\n=== RUNTIME VERIFICATION ===');
  console.log(`DATABASE_URL: ${maskDatabaseUrl(process.env.DATABASE_URL || 'NOT SET')}`);
  console.log(`PostgreSQL host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`Database: ${process.env.DB_NAME || 'dawaisaver'}`);
  console.log(`Schema: ${process.env.DB_SCHEMA || 'public'}`);
  console.log(`Container hostname: ${process.env.HOSTNAME || require('os').hostname()}`);
  console.log(`Current git commit: ${getGitCommit()}`);
  console.log(`Current branch: ${getGitBranch()}`);
  console.log(`Current user: ${process.env.USER || process.env.USERNAME || 'unknown'}`);
  console.log('===========================\n');

  const prisma = new PrismaService();
  await prisma.$connect();

  try {
    console.log('Starting master reference population from existing normalized_data...\n');

    const stats: PopulationStats = {
      totalItems: 0,
      itemsWithNormalizedData: 0,
      unsupportedItems: 0,
      itemsMissingFields: 0,
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

    const limitArg = process.argv[2];
    const limit = limitArg ? parseInt(limitArg, 10) : 0;
    const batchSize = 500;

    stats.totalItems = await prisma.importBatchItem.count({
      where: { status: 'SAVED', deletedAt: null },
    });
    console.log(`Found ${stats.totalItems} SAVED records${limit > 0 ? ' (LIMITED)' : ''}\n`);

    const manufacturers = new Map<string, AggregateBase>();
    const ingredients = new Map<string, AggregateBase>();
    const applicants = new Map<string, AggregateBase>();
    const dosageForms = new Map<string, AggregateBase>();
    const strengths = new Map<string, StrengthAggregate>();
    const packs = new Map<string, PackAggregate>();
    const routes = new Map<string, AggregateBase>();
    const atcCodes = new Map<string, AggregateBase>();
    const therapeuticCategories = new Map<string, AggregateBase>();

    let processed = 0;
    let offset = 0;

    while (true) {
      const remaining = limit > 0 ? Math.max(limit - processed, 0) : batchSize;
      const take = limit > 0 ? Math.min(batchSize, remaining) : batchSize;

      if (limit > 0 && processed >= limit) {
        break;
      }

      const savedItems = await prisma.importBatchItem.findMany({
        where: { status: 'SAVED', deletedAt: null },
        orderBy: { rowNumber: 'asc' },
        skip: offset,
        take,
      });

      if (savedItems.length === 0) {
        break;
      }

      offset += savedItems.length;

      for (const item of savedItems) {
        processed++;

        try {
          const mapped = mapImportBatchItemToCatalogRecord({
            id: item.id,
            importBatchId: item.importBatchId,
            rowNumber: item.rowNumber,
            sourceType: item.sourceType,
            sourceUrl: item.sourceUrl,
            rawData: item.rawData,
            normalizedData: item.normalizedData,
            createdAt: item.createdAt,
          });

          if (!mapped.record) {
            stats.unsupportedItems++;
            continue;
          }

          const record = mapped.record;
          stats.itemsWithNormalizedData++;

          const registrationNumber = normalizeRegistration(record.registrationNumber);
          if (!registrationNumber) {
            stats.itemsMissingFields++;
          }

          const sourceUrl = record.sourceUrl || item.sourceUrl || null;
          const country = record.country || null;
          const sourceType = record.sourceType || item.sourceType || null;

          if (record.manufacturerName) {
            addAggregate(manufacturers, record.manufacturerName, sourceType, sourceUrl, country, registrationNumber);
          }

          if (record.applicant) {
            addAggregate(applicants, record.applicant, sourceType, sourceUrl, country, registrationNumber);
          }

          const ingredientRows = record.compositions?.length ? record.compositions : record.genericName ? [{
            ingredientOrder: 1,
            genericName: record.genericName,
            normalizedGenericName: normalizeString(record.genericName),
            strengthText: record.strengthText,
            normalizedStrength: record.normalizedStrength,
            strengthValue: undefined,
            strengthUnit: undefined,
          }] : [];

          for (const composition of ingredientRows) {
            if (!composition.genericName) continue;
            addAggregate(ingredients, composition.genericName, sourceType, sourceUrl, country, registrationNumber);

            const strengthText = composition.strengthText || null;
            const unit = composition.strengthUnit || null;
            const normalizedValue = normalizeString(
              composition.normalizedStrength || strengthText || [composition.strengthValue, unit].filter(Boolean).join(' '),
            );

            if (normalizedValue) {
              const strengthId = deterministicUuid(`strength:${normalizedValue}`);
              const existingStrength = strengths.get(normalizedValue);
              if (existingStrength) {
                mergeAggregate(existingStrength, sourceType, sourceUrl, country, registrationNumber);
                if (!existingStrength.value && composition.strengthValue) existingStrength.value = composition.strengthValue;
                if (!existingStrength.unit && unit) existingStrength.unit = unit;
              } else {
                strengths.set(normalizedValue, {
                  id: strengthId,
                  name: strengthText || normalizedValue,
                  normalizedKey: normalizedValue,
                  sourceType,
                  sourceUrl,
                  country,
                  sourceCount: 1,
                  registrationNumbers: new Set(registrationNumber ? [registrationNumber] : []),
                  value: composition.strengthValue || strengthText,
                  unit,
                  normalizedValue,
                });
              }
            }
          }

          if (record.dosageForm) {
            addAggregate(dosageForms, record.dosageForm, sourceType, sourceUrl, country, registrationNumber);
          }

          const normalizedPack = record.normalizedPack || normalizePack(record.packSize);
          const packLabel = normalizedPack?.normalizedPackLabel || normalizeString(record.packSize || '');
          if (packLabel) {
            const existingPack = packs.get(packLabel);
            if (existingPack) {
              mergeAggregate(existingPack, sourceType, sourceUrl, country, registrationNumber);
              if (normalizedPack) {
                existingPack.unitCount ??= normalizedPack.unitCount;
                existingPack.unitType ??= normalizedPack.unitType;
                existingPack.volumeMl ??= normalizedPack.volumeMl != null ? String(normalizedPack.volumeMl) : null;
                existingPack.weightG ??= normalizedPack.weightG != null ? String(normalizedPack.weightG) : null;
                existingPack.containerCount ??= normalizedPack.containerCount;
              }
            } else {
              packs.set(packLabel, {
                id: deterministicUuid(`pack:${packLabel}`),
                name: record.packSize || packLabel,
                normalizedKey: packLabel,
                sourceType,
                sourceUrl,
                country,
                sourceCount: 1,
                registrationNumbers: new Set(registrationNumber ? [registrationNumber] : []),
                normalizedPackLabel: packLabel,
                unitCount: normalizedPack?.unitCount ?? null,
                unitType: normalizedPack?.unitType ?? null,
                volumeMl: normalizedPack?.volumeMl != null ? String(normalizedPack.volumeMl) : null,
                weightG: normalizedPack?.weightG != null ? String(normalizedPack.weightG) : null,
                containerCount: normalizedPack?.containerCount ?? null,
              });
            }
          }

          if (record.routeOfAdmin) {
            addAggregate(routes, record.routeOfAdmin, sourceType, sourceUrl, country, registrationNumber);
          }

          if (record.atcCode) {
            addAggregate(atcCodes, record.atcCode, sourceType, sourceUrl, country, registrationNumber, normalizeString(record.atcCode));
          }

          if (record.therapeuticCategory) {
            addAggregate(therapeuticCategories, record.therapeuticCategory, sourceType, sourceUrl, country, registrationNumber);
          }
        } catch (error) {
          stats.errors++;
          console.error(`Error processing item ${item.id}:`, error);
        }
      }

      console.log(`Processed ${processed}/${limit > 0 ? limit : stats.totalItems} records`);
    }

    await persistReferenceTables(prisma, {
      manufacturers,
      ingredients,
      applicants,
      dosageForms,
      strengths,
      packs,
      routes,
      atcCodes,
      therapeuticCategories,
      stats,
    });

    console.log('\n=== Master Table Population Report ===');
    console.log(`Total SAVED records: ${stats.totalItems}`);
    console.log(`Records with normalized_data: ${stats.itemsWithNormalizedData}`);
    console.log(`Unsupported normalized payloads: ${stats.unsupportedItems}`);
    console.log(`Records missing fields: ${stats.itemsMissingFields}`);
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

async function persistReferenceTables(
  prisma: PrismaService,
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

function addAggregate(
  map: Map<string, AggregateBase>,
  label: string,
  sourceType: string | null,
  sourceUrl: string | null,
  country: string | null,
  registrationNumber: string | null,
  normalizedOverride?: string,
): void {
  const normalizedKey = normalizedOverride || normalizeString(label);
  if (!normalizedKey) return;

  const existing = map.get(normalizedKey);
  if (existing) {
    mergeAggregate(existing, sourceType, sourceUrl, country, registrationNumber);
    return;
  }

  map.set(normalizedKey, {
    id: deterministicUuid(normalizedKey),
    name: label,
    normalizedKey,
    sourceType,
    sourceUrl,
    country,
    sourceCount: 1,
    registrationNumbers: new Set(registrationNumber ? [registrationNumber] : []),
  });
}

function mergeAggregate(
  aggregate: AggregateBase,
  sourceType: string | null,
  sourceUrl: string | null,
  country: string | null,
  registrationNumber: string | null,
): void {
  aggregate.sourceCount++;
  aggregate.sourceType ||= sourceType;
  aggregate.sourceUrl ||= sourceUrl;
  aggregate.country ||= country;
  if (registrationNumber) {
    aggregate.registrationNumbers.add(registrationNumber);
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
    sourceType: item.sourceType as any,
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
    sourceType: item.sourceType as any,
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
    sourceType: item.sourceType as any,
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
    sourceType: item.sourceType as any,
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
    sourceType: item.sourceType as any,
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
    sourceType: item.sourceType as any,
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
    sourceType: item.sourceType as any,
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

function normalizeString(value: string | null | undefined): string {
  return String(value || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

function normalizeRegistration(value: string | null | undefined): string | null {
  const normalized = String(value || '').trim();
  return normalized || null;
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

function getGitCommit(): string {
  try {
    const { execSync } = require('child_process');
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function getGitBranch(): string {
  try {
    const { execSync } = require('child_process');
    return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

main();
