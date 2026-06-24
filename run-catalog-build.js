const {PrismaClient} = require('@prisma/client');
const {CatalogService} = require('./dist/modules/catalog/catalog.service');
const p = new PrismaClient();
const svc = new CatalogService(p);

async function main() {
  console.log('Starting catalog build...');
  const summary = await svc.buildCatalog({
    command: 'build',
    dryRun: false,
    batchSize: 500
  });
  console.log('Build complete!');
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

main().catch(e => {
  console.error('Build failed:', e.message);
  process.exit(1);
});