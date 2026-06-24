const {PrismaClient} = require('@prisma/client');
const {CatalogService} = require('./dist/modules/catalog/catalog.service');
const {mapImportBatchItemToCatalogRecord} = require('./dist/modules/catalog/catalog.mapper');
const p = new PrismaClient();

async function main() {
  // Get first SAVED item
  const item = await p.importBatchItem.findFirst({ where: { status: 'SAVED' } });
  
  // Try to map it
  const mapped = mapImportBatchItemToCatalogRecord({
    id: item.id,
    importBatchId: item.importBatchId,
    rowNumber: item.rowNumber,
    sourceType: item.sourceType,
    sourceUrl: item.sourceUrl,
    rawData: item.rawData,
    normalizedData: item.normalizedData,
    createdAt: new Date(),
  });
  
  console.log('Mapped record:', JSON.stringify(mapped, null, 2)?.slice(0, 1000));
  
  // Try to create manufacturer directly
  try {
    const mfg = await p.manufacturer.create({
      data: {
        name: mapped.record?.manufacturerName || 'Unknown',
        normalizedName: mapped.record?.normalizedManufacturerName || 'unknown',
        status: 'PENDING_REVIEW',
      },
      select: { id: true }
    });
    console.log('\nCreated manufacturer with ID:', mfg.id);
    
    // Now try to find a product with this manufacturerId
    const product = await p.product.findFirst({
      where: {
        deletedAt: null,
        manufacturerId: mfg.id,
      }
    });
    console.log('Found product:', product);
    
    // Clean up
    await p.manufacturer.delete({ where: { id: mfg.id } });
  } catch(e) {
    console.log('Error:', e.message);
  }
  
  process.exit(0);
}
main();