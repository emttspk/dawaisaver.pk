const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const batches = await prisma.importBatch.findMany({
    where: { adapterType: 'drap-mirror' },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      status: true,
      startedAt: true,
      finishedAt: true,
      createdAt: true,
      totalRows: true,
    },
  });
  console.log(JSON.stringify(batches, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });