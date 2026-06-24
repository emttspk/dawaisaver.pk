const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  // Count total items
  const total = await p.importBatchItem.count();
  console.log('Total import_batch_items:', total);

  // Count by status
  const byStatus = await p.importBatchItem.groupBy({
    by: ['status'],
    _count: { id: true }
  });
  console.log('\nBy status:');
  byStatus.forEach(s => console.log(`  ${s.status}: ${s._count.id}`));

  // Count by source type
  const bySource = await p.importBatchItem.groupBy({
    by: ['sourceType'],
    _count: { id: true }
  });
  console.log('\nBy source type:');
  bySource.forEach(s => console.log(`  ${s.sourceType}: ${s._count.id}`));

  // Sample a few items to check data shape
  const samples = await p.importBatchItem.findMany({
    take: 3,
    include: { importBatch: { select: { adapterType: true, sourceType: true } } }
  });
  console.log('\nSample items:');
  samples.forEach(s => {
    const norm = s.normalizedData || {};
    console.log(`  Row ${s.rowNumber}: status=${s.status}, adapter=${s.importBatch?.adapterType}`);
    console.log(`    normalizedData keys: ${Object.keys(norm).join(', ')}`);
    if (norm.compositionRows) console.log(`    compositionRows: ${norm.compositionRows.length} rows`);
    if (norm.brandName) console.log(`    brandName: ${norm.brandName}`);
    if (norm.registrationNumber) console.log(`    registrationNumber: ${norm.registrationNumber}`);
  });

  // Check import batches
  const batchCount = await p.importBatch.count();
  console.log('\nTotal import_batches:', batchCount);

  const batchByAdapter = await p.importBatch.groupBy({
    by: ['adapterType'],
    _count: { id: true }
  });
  console.log('By adapter type:');
  batchByAdapter.forEach(b => console.log(`  ${b.adapterType}: ${b._count.id}`));

  // Check catalog build jobs
  const buildJobs = await p.catalogBuildJob.count();
  console.log('\nCatalog build jobs:', buildJobs);

  process.exit(0);
}
main();