const {PrismaClient} = require('@prisma/client');
const {CatalogService} = require('./dist/modules/catalog/catalog.service');
const p = new PrismaClient();
const svc = new CatalogService(p);
svc.verifyCatalog().then(r => {
  console.log(JSON.stringify(r, null, 2));
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});