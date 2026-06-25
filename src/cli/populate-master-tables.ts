import { PrismaService } from '../database/prisma.service';
import { deterministicUuid } from '../modules/master-builder/utils/uuid-generator';

interface BackfillStats {
  totalItems: number;
  itemsWithNormalizedData: number;
  itemsMissingFields: number;
  manufacturersCreated: number;
  manufacturersUpdated: number;
  genericsCreated: number;
  genericsUpdated: number;
  dosageFormsCreated: number;
  packsCreated: number;
  routesCreated: number;
  atcCodesCreated: number;
  therapeuticCategoriesCreated: number;
  errors: number;
}

async function main(): Promise<void> {
  console.log('\n=== RUNTIME VERIFICATION ===');
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL || 'NOT SET'}`);
  console.log(`Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`Port: ${process.env.DB_PORT || '5432'}`);
  console.log(`Database: ${process.env.DB_NAME || 'dawaisaver'}`);
  console.log(`Schema: ${process.env.DB_SCHEMA || 'public'}`);
  console.log(`Container hostname: ${process.env.HOSTNAME || require('os').hostname()}`);
  console.log(`Current git commit: ${getGitCommit()}`);
  console.log(`Current environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('===========================\n');

  const prisma = new PrismaService();
  await prisma.$connect();

  try {
    console.log('Starting master table population from existing normalized_data...\n');

    const stats: BackfillStats = {
      totalItems: 0,
      itemsWithNormalizedData: 0,
      itemsMissingFields: 0,
      manufacturersCreated: 0,
      manufacturersUpdated: 0,
      genericsCreated: 0,
      genericsUpdated: 0,
      dosageFormsCreated: 0,
      packsCreated: 0,
      routesCreated: 0,
      atcCodesCreated: 0,
      therapeuticCategoriesCreated: 0,
      errors: 0,
    };

    const limitArg = process.argv[2];
    const limit = limitArg ? parseInt(limitArg, 10) : 0;
    const batchSize = 500;

    stats.totalItems = await prisma.importBatchItem.count({
      where: { status: 'SAVED', deletedAt: null },
    });
    console.log(`Found ${stats.totalItems} SAVED records${limit > 0 ? ' (LIMITED)' : ''}\n`);

    const manufacturerCache = new Map<string, string>();
    const genericCache = new Map<string, string>();
    const dosageFormCache = new Map<string, string>();
    const packCache = new Map<string, string>();
    const routeCache = new Map<string, string>();
    const atcCache = new Map<string, string>();
    const therapeuticCategoryCache = new Map<string, string>();

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
        const normalizedData = item.normalizedData as Record<string, any> || {};
        
        if (!normalizedData || Object.keys(normalizedData).length === 0) {
          stats.errors++;
          continue;
        }

        stats.itemsWithNormalizedData++;

        const hasAllFields = normalizedData.registrationNumber && 
          normalizedData.dosageForm && 
          normalizedData.packSize && 
          normalizedData.routeOfAdmin && 
          normalizedData.atcCode && 
          normalizedData.manufacturer;

        if (!hasAllFields) {
          stats.itemsMissingFields++;
        }

        const manufacturerName = normalizedData.manufacturer;
        const genericName = normalizedData.compositions?.[0]?.genericName;
        const dosageForm = normalizedData.dosageForm;
        const packSize = normalizedData.packSize;
        const routeOfAdmin = normalizedData.routeOfAdmin;
        const atcCode = normalizedData.atcCode;
        const therapeuticCategory = normalizedData.therapeuticCategory;

        if (manufacturerName) {
          const normalizedManufacturer = normalizeString(manufacturerName);
          let manufacturerId = manufacturerCache.get(normalizedManufacturer);

          if (!manufacturerId) {
            const existing = await prisma.manufacturer.findFirst({
              where: { normalizedName: normalizedManufacturer },
            });
            if (existing) {
              manufacturerId = existing.id;
            } else {
              manufacturerId = deterministicUuid(`manufacturer:${normalizedManufacturer}`);
              await prisma.manufacturer.create({
                data: {
                  id: manufacturerId,
                  name: manufacturerName,
                  normalizedName: normalizedManufacturer,
                  country: normalizedData.country || null,
                  sourceType: 'DRAP',
                  sourceUrl: normalizedData.rawHtmlUrl || item.sourceUrl || null,
                  status: 'PENDING_REVIEW',
                  confidenceScore: 0.9,
                  metadata: { registrationNumber: normalizedData.registrationNumber },
                },
              });
              stats.manufacturersCreated++;
            }
          }
          manufacturerCache.set(normalizedManufacturer, manufacturerId);
        }

        if (genericName) {
          const normalizedGeneric = normalizeString(genericName);
          let genericId = genericCache.get(normalizedGeneric);

          if (!genericId) {
            const existing = await prisma.generic.findUnique({
              where: { normalizedName: normalizedGeneric },
            });
            if (existing) {
              genericId = existing.id;
            } else {
              genericId = deterministicUuid(`generic:${normalizedGeneric}`);
              await prisma.generic.create({
                data: {
                  id: genericId,
                  name: genericName,
                  normalizedName: normalizedGeneric,
                  status: 'PENDING_REVIEW',
                  confidenceScore: 0.9,
                  sourceType: 'DRAP',
                  sourceUrl: normalizedData.rawHtmlUrl || item.sourceUrl || null,
                  metadata: { registrationNumber: normalizedData.registrationNumber },
                },
              });
              stats.genericsCreated++;
            }
          }
          genericCache.set(normalizedGeneric, genericId);
        }

        if (dosageForm) {
          const normalizedForm = normalizeString(dosageForm);
          let formId = dosageFormCache.get(normalizedForm);

          if (!formId) {
            const existing = await prisma.dosageFormMaster.findFirst({
              where: { normalizedName: normalizedForm },
            });
            if (existing) {
              formId = existing.id;
            } else {
              formId = deterministicUuid(`dosageForm:${normalizedForm}`);
              await prisma.dosageFormMaster.create({
                data: {
                  id: formId,
                  name: dosageForm,
                  normalizedName: normalizedForm,
                  status: 'PENDING_REVIEW',
                  confidenceScore: 0.9,
                  sourceType: 'DRAP',
                  sourceUrl: normalizedData.rawHtmlUrl || item.sourceUrl || null,
                  metadata: { registrationNumber: normalizedData.registrationNumber },
                },
              });
              stats.dosageFormsCreated++;
            }
          }
          dosageFormCache.set(normalizedForm, formId);
        }

        if (packSize) {
          const normalizedPack = normalizeString(packSize);
          let packId = packCache.get(normalizedPack);

          if (!packId) {
            const existing = await prisma.packMaster.findFirst({
              where: { normalizedPackLabel: normalizedPack },
            });
            if (existing) {
              packId = existing.id;
            } else {
              packId = deterministicUuid(`pack:${normalizedPack}`);
              const unitCount = extractUnitCount(packSize);
              await prisma.packMaster.create({
                data: {
                  id: packId,
                  unitCount,
                  normalizedPackLabel: normalizedPack,
                  status: 'PENDING_REVIEW',
                  confidenceScore: 0.9,
                  sourceType: 'DRAP',
                  sourceUrl: normalizedData.rawHtmlUrl || item.sourceUrl || null,
                  metadata: { registrationNumber: normalizedData.registrationNumber },
                },
              });
              stats.packsCreated++;
            }
          }
          packCache.set(normalizedPack, packId);
        }

        if (routeOfAdmin) {
          const normalizedRoute = normalizeString(routeOfAdmin);
          let routeId = routeCache.get(normalizedRoute);

          if (!routeId) {
            const existing = await prisma.routeMaster.findFirst({
              where: { normalizedName: normalizedRoute },
            });
            if (existing) {
              routeId = existing.id;
            } else {
              routeId = deterministicUuid(`route:${normalizedRoute}`);
              await prisma.routeMaster.create({
                data: {
                  id: routeId,
                  name: routeOfAdmin,
                  normalizedName: normalizedRoute,
                  status: 'PENDING_REVIEW',
                  confidenceScore: 0.9,
                  sourceType: 'DRAP',
                  sourceUrl: normalizedData.rawHtmlUrl || item.sourceUrl || null,
                  metadata: { registrationNumber: normalizedData.registrationNumber },
                },
              });
              stats.routesCreated++;
            }
          }
          routeCache.set(normalizedRoute, routeId);
        }

        if (atcCode) {
          const normalizedAtc = normalizeString(atcCode);
          let atcId = atcCache.get(normalizedAtc);

          if (!atcId) {
            const existing = await prisma.atcMaster.findFirst({
              where: { code: normalizedAtc },
            });
            if (existing) {
              atcId = existing.id;
            } else {
              atcId = deterministicUuid(`atc:${normalizedAtc}`);
              await prisma.atcMaster.create({
                data: {
                  id: atcId,
                  code: normalizedAtc,
                  name: atcCode,
                  status: 'PENDING_REVIEW',
                  confidenceScore: 0.9,
                  sourceType: 'DRAP',
                  sourceUrl: normalizedData.rawHtmlUrl || item.sourceUrl || null,
                  metadata: { registrationNumber: normalizedData.registrationNumber },
                },
              });
              stats.atcCodesCreated++;
            }
          }
          atcCache.set(normalizedAtc, atcId);
        }

        if (therapeuticCategory) {
          const normalizedCategory = normalizeString(therapeuticCategory);
          let catId = therapeuticCategoryCache.get(normalizedCategory);

          if (!catId) {
            const existing = await prisma.therapeuticCategoryMaster.findFirst({
              where: { normalizedName: normalizedCategory },
            });
            if (existing) {
              catId = existing.id;
            } else {
              catId = deterministicUuid(`therapeuticCategory:${normalizedCategory}`);
              await prisma.therapeuticCategoryMaster.create({
                data: {
                  id: catId,
                  name: therapeuticCategory,
                  normalizedName: normalizedCategory,
                  status: 'PENDING_REVIEW',
                  confidenceScore: 0.9,
                  sourceType: 'DRAP',
                  sourceUrl: normalizedData.rawHtmlUrl || item.sourceUrl || null,
                  metadata: { registrationNumber: normalizedData.registrationNumber },
                },
              });
              stats.therapeuticCategoriesCreated++;
            }
          }
          therapeuticCategoryCache.set(normalizedCategory, catId);
        }

      } catch (error) {
        stats.errors++;
        console.error(`Error processing item ${item.id}:`, error);
      }
      }

      console.log(`Processed ${processed}/${limit > 0 ? limit : stats.totalItems} records`);
    }

    console.log('\n=== Master Table Population Report ===');
    console.log(`Total SAVED records: ${stats.totalItems}`);
    console.log(`Records with normalized_data: ${stats.itemsWithNormalizedData}`);
    console.log(`Records missing fields: ${stats.itemsMissingFields}`);
    console.log(`\n--- Manufacturers ---`);
    console.log(`Created: ${stats.manufacturersCreated}`);
    console.log(`Unique: ${manufacturerCache.size}`);
    console.log(`\n--- Generics ---`);
    console.log(`Created: ${stats.genericsCreated}`);
    console.log(`Unique: ${genericCache.size}`);
    console.log(`\n--- Dosage Forms ---`);
    console.log(`Created: ${stats.dosageFormsCreated}`);
    console.log(`Unique: ${dosageFormCache.size}`);
    console.log(`\n--- Packs ---`);
    console.log(`Created: ${stats.packsCreated}`);
    console.log(`Unique: ${packCache.size}`);
    console.log(`\n--- Routes ---`);
    console.log(`Created: ${stats.routesCreated}`);
    console.log(`Unique: ${routeCache.size}`);
    console.log(`\n--- ATC Codes ---`);
    console.log(`Created: ${stats.atcCodesCreated}`);
    console.log(`Unique: ${atcCache.size}`);
    console.log(`\n--- Therapeutic Categories ---`);
    console.log(`Created: ${stats.therapeuticCategoriesCreated}`);
    console.log(`Unique: ${therapeuticCategoryCache.size}`);
    console.log(`\n--- Errors ---`);
    console.log(`Failed: ${stats.errors}`);

  } finally {
    await prisma.$disconnect();
  }
}

function normalizeString(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, ' ');
}

function extractUnitCount(packSize: string): number | null {
  const match = packSize.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function getGitCommit(): string {
  try {
    const { execSync } = require('child_process');
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

main();
