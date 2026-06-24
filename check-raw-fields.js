const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  // Check rawData fields
  const samples = await p.importBatchItem.findMany({
    where: { status: 'SAVED' },
    take: 10
  });
  
  console.log('=== Checking rawData fields ===');
  samples.forEach((s, i) => {
    const raw = s.rawData || {};
    console.log(`\nItem ${i+1} (reg ${raw.registrationNumber}):`);
    console.log('  rawData keys:', Object.keys(raw).join(', '));
    console.log('  manufacturer:', raw.manufacturer);
    console.log('  companyName:', raw.companyName);
    console.log('  company:', raw.company);
    console.log('  manufacturerName:', raw.manufacturerName);
    
    // Check normalizedData
    const norm = s.normalizedData || {};
    console.log('  normalizedData.manufacturer:', norm.manufacturer);
    console.log('  normalizedData keys:', Object.keys(norm).join(', '));
  });
  
  process.exit(0);
}
main();