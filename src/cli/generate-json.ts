import { PrismaService } from '../database/prisma.service';
import { JsonGeneratorService } from '../modules/master-builder/json-generator';

async function main(): Promise<void> {
  const prisma = new PrismaService();
  const service = new JsonGeneratorService(prisma);

  await prisma.$connect();

  try {
    console.log('Starting JSON generation from import_batch_items...');
    await service.generate();

    const stats = service.getStats();
    console.log('\n=== Final Statistics ===');
    console.log(`Total SAVED records: ${stats.totalSaved}`);
    console.log(`JSON generated: ${stats.generated}`);
    console.log(`Skipped (existing): ${stats.skipped}`);
    console.log(`Failed: ${stats.failed}`);
    process.exit(0);
  } catch (error) {
    console.error('JSON generation failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();