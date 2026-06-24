const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  // Check what the data looks like in normalizedData
  const samples = await p.importBatchItem.findMany({
    where: { status: 'SAVED' },
    take: 5
  });
  
  console.log('=== Sample normalizedData keys ===');
  samples.forEach((s, i) => {
    const norm = s.normalizedData || {};
    console.log(`\nItem ${i+1} (row ${s.rowNumber}, reg ${norm.registrationNumber}):`);
    console.log('  Keys:', Object.keys(norm).join(', '));
    console.log('  brandName:', norm.brandName);
    console.log('  manufacturer:', norm.manufacturer);
    console.log('  manufacturerName:', norm.manufacturerName);
    console.log('  compositionRows count:', norm.compositionRows?.length);
    if (norm.compositionRows?.length > 0) {
      console.log('  First compositionRow keys:', Object.keys(norm.compositionRows[0]).join(', '));
      console.log('  First compositionRow:', JSON.stringify(norm.compositionRows[0]));
    }
  });
  
  // Count items with manufacturer field
  const withMfg = await p.importBatchItem.count({
    where: { 
      status: 'SAVED',
      normalizedData: { path: ['manufacturer'], not: '' }
    }
  });
  console.log(`\nItems with manufacturer field: ${withMfg}`);
  
  // Check if manufacturer is in compositionRows
  const sample2 = await p.importBatchItem.findFirst({
    where: { status: 'SAVED' }
  });
  console.log('\nFull normalizedData sample:');
  console.log(JSON.stringify(sample2.normalizedData, null, 2));
  
  process.exit(0);
}
main();