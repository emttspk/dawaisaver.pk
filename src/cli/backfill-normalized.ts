import { PrismaService } from '../database/prisma.service';
import { mapImportBatchItemToCatalogRecord } from '../modules/catalog/catalog.mapper';

async function main(): Promise<void> {
  const prisma = new PrismaService();
  await prisma.$connect();

  try {
    console.log('Starting backfill of normalized_data...');
    
    const BATCH_SIZE = 100;
    let processed = 0;
    let updated = 0;
    let failed = 0;

    while (true) {
      const items = await prisma.importBatchItem.findMany({
        where: {
          status: 'SAVED',
          deletedAt: null,
        },
        orderBy: [{ importBatchId: 'asc' }, { rowNumber: 'asc' }],
        take: BATCH_SIZE,
        skip: processed,
      });

      if (items.length === 0) {
        console.log('No more items to process.');
        break;
      }

      for (const item of items) {
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
            failed++;
            console.warn(`Skipped item ${item.id}: validation issues`);
            continue;
          }

          const currentNormalized = (item.normalizedData as Record<string, unknown>) || {};
          const needsUpdate = !currentNormalized.medicineSignature || 
            !currentNormalized.routeOfAdmin ||
            !currentNormalized.atcCode ||
            !currentNormalized.applicant;

          if (needsUpdate) {
            await prisma.importBatchItem.update({
              where: { id: item.id },
              data: {
                normalizedData: mapped.record as unknown as object,
              },
            });
            updated++;
          }
          
          processed++;
        } catch (error) {
          failed++;
          console.error(`Failed to process item ${item.id}:`, error);
        }
      }

      console.log(`Processed ${processed}, Updated ${updated}, Failed ${failed}`);
    }

    console.log(`\n=== Final Statistics ===`);
    console.log(`Total processed: ${processed}`);
    console.log(`Records updated: ${updated}`);
    console.log(`Failures: ${failed}`);
  } finally {
    await prisma.$disconnect();
  }
}

main();