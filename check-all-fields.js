const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const item = await p.importBatchItem.findFirst({
    where: {
      OR: [
        { rawData: { string_contains: '125254' } },
        { normalizedData: { string_contains: '125254' } }
      ]
    }
  });
  
  if (item) {
    const raw = item.rawData || {};
    console.log('rawData keys:', Object.keys(raw));
    console.log('finalUrl:', raw.finalUrl);
    console.log('requestUrl:', raw.requestUrl);
    console.log('htmlHash:', raw.htmlHash);
    
    // Check if there's a related archive or cache
    // Look for the raw HTML spool files
  }
  
  // Also check what the detail parser actually extracts
  // by looking at a few items with different manufacturers
  const withMfg = await p.importBatchItem.findMany({
    where: { 
      status: 'SAVED',
      normalizedData: { path: ['manufacturer'], not: undefined }
    },
    take: 5
  });
  console.log('\n=== Items WITH manufacturer field ===');
  console.log('Count:', withMfg.length);
  withMfg.forEach((s, i) => {
    console.log(`\nItem ${i+1}:`, s.normalizedData?.registrationNumber);
    console.log('  manufacturer:', s.normalizedData?.manufacturer);
    console.log('  brandName:', s.normalizedData?.brandName);
  });
  
  // Check if manufacturer is in any other field
  const allKeys = new Set();
  const sample = await p.importBatchItem.findMany({
    where: { status: 'SAVED' },
    take: 100
  });
  sample.forEach(s => {
    Object.keys(s.normalizedData || {}).forEach(k => allKeys.add(k));
  });
  console.log('\n=== All unique keys in normalizedData ===');
  console.log([...allKeys].join(', '));
  
  process.exit(0);
}
main();