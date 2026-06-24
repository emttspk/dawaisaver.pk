const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  // Check if there's an archive table or raw HTML storage
  const tables = await p.$queryRaw`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE '%archive%' OR table_name LIKE '%raw%' OR table_name LIKE '%html%'
  `;
  console.log('Archive/Raw tables:', JSON.stringify(tables, null, 2));
  
  // Check import_batch metadata for archive info
  const batch = await p.importBatch.findFirst({
    where: { adapterType: 'drap-mirror' },
    orderBy: { createdAt: 'asc' }
  });
  
  if (batch) {
    console.log('\nFirst batch metadata:');
    console.log(JSON.stringify(batch.metadata, null, 2)?.slice(0, 2000));
    
    // Check if there's archive path info
    const meta = batch.metadata || {};
    const acq = meta.acquisition || {};
    console.log('\nArchive config:', JSON.stringify(acq.archive, null, 2));
  }
  
  process.exit(0);
}
main();