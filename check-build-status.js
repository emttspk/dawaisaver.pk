const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const jobs = await p.catalogBuildJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  jobs.forEach(j => {
    console.log(`Job ${j.id}: status=${j.status}, phase=${j.phase}, processed=${j.processedImportItems}, products=${j.productsCreated}, started=${j.startedAt}`);
  });
  
  // Check if any process is running the build
  const products = await p.product.count();
  const manufacturers = await p.manufacturer.count();
  const generics = await p.generic.count();
  console.log(`\nCurrent counts: products=${products}, manufacturers=${manufacturers}, generics=${generics}`);
  
  process.exit(0);
}
main();