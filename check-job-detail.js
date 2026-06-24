const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const job = await p.catalogBuildJob.findUnique({
    where: { id: '5c5905c1-481b-4f61-a156-9313a7a05ec8' }
  });
  if (job) {
    console.log('Status:', job.status);
    console.log('Phase:', job.phase);
    console.log('Processed:', job.processedImportItems);
    console.log('Skipped:', job.skippedItems);
    console.log('Products created:', job.productsCreated);
    console.log('Error:', job.errorMessage);
    console.log('Validation report:', JSON.stringify(job.validationReport, null, 2));
    console.log('Progress report:', JSON.stringify(job.progressReport, null, 2));
  }
  process.exit(0);
}
main();