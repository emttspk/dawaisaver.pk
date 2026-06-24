const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  // Check for any existing products
  const products = await p.product.findMany({ take: 5 });
  console.log('Products:', products.length);
  products.forEach(pr => {
    console.log(`  ID: ${pr.id}, brandName: ${pr.brandName}, manufacturerId: ${pr.manufacturerId}`);
  });
  
  // Check manufacturers
  const mfgs = await p.manufacturer.findMany({ take: 5 });
  console.log('\nManufacturers:', mfgs.length);
  mfgs.forEach(m => {
    console.log(`  ID: ${m.id}, name: ${m.name}`);
  });
  
  // Check generics
  const gens = await p.generic.findMany({ take: 5 });
  console.log('\nGenerics:', gens.length);
  
  // Check canonical products
  const canon = await p.canonicalProduct.findMany({ take: 5 });
  console.log('\nCanonical products:', canon.length);
  
  // Check the catalog build job
  const job = await p.catalogBuildJob.findFirst({ orderBy: { createdAt: 'desc' } });
  if (job) {
    console.log('\nLatest build job:', job.id, 'status:', job.status);
  }
  
  process.exit(0);
}
main();