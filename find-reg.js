const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const item = await p.importBatchItem.findFirst({
    where: {
      OR: [
        { rawData: { path: ['registrationNumber'], equals: '125254' } },
        { normalizedData: { path: ['registrationNumber'], equals: '125254' } }
      ]
    }
  });
  
  if (!item) {
    console.log('Not found by JSON path, trying LIKE search...');
    const all = await p.importBatchItem.findMany({
      where: {
        OR: [
          { rawData: { string_contains: '125254' } },
          { normalizedData: { string_contains: '125254' } }
        ]
      },
      take: 5
    });
    console.log('Found:', all.length);
    all.forEach(a => {
      console.log('\n=== Item ===');
      console.log('Status:', a.status);
      console.log('rawData:', JSON.stringify(a.rawData, null, 2)?.slice(0, 500));
      console.log('normalizedData:', JSON.stringify(a.normalizedData, null, 2)?.slice(0, 500));
    });
  } else {
    console.log('Found!');
    console.log('Status:', item.status);
    console.log('normalizedData:', JSON.stringify(item.normalizedData, null, 2));
  }
  
  process.exit(0);
}
main();