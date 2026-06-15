import { PrismaClient, SourceType, RecordStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.auditLog.create({
    data: {
      action: "CREATE",
      entityType: "seed",
      reason: "Initial seed structure placeholder",
      status: RecordStatus.ACTIVE,
      sourceType: SourceType.SYSTEM,
      confidenceScore: "1.0000",
      metadata: {
        note: "Replace this placeholder with verified reference data in a later phase.",
      },
    },
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });

