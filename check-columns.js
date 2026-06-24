const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const item = await p.importBatchItem.findFirst({ take: 1 });
  console.log('Keys:', Object.keys(item));
  console.log('Sample:', JSON.stringify(item, null, 2)?.slice(0, 500));
  process.exit(0);
}
main();