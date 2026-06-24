const {PrismaClient} = require('@prisma/client');

const p = new PrismaClient();

async function main() {
  const samples = await p.importBatchItem.findMany({
    where: { status: 'SAVED' },
    orderBy: { createdAt: 'desc' },
  });

  samples.sort(() => 0.5 - Math.random());

  const totalSamples = Math.min(10, samples.length);
  const selectedSamples = samples.slice(0, totalSamples);

  console.log(`Analyzing ${selectedSamples.length} sample records from ${samples.length} total SAVED items...\n`);

  const phase1Fields = [
    'companyAddress', 'activeIngredient', 'dosage', 'packageType',
    'therapeuticCategory', 'atcCode', 'indications', 'contraindications',
    'sideEffects', 'drugInteractions', 'precautions', 'warnings',
    'shelfLife', 'storageCondition', 'country', 'manufacturingType'
  ];

  const fieldCounts = {};
  const fieldValues = {};

  for (const item of selectedSamples) {
    const normalizedData = item.normalizedData || {};
    const regNum = normalizedData.registrationNumber || item.registrationNumber;

    console.log(`  ${regNum}:`);
    for (const field of phase1Fields) {
      const value = normalizedData[field];
      if (value && String(value).trim()) {
        const displayVal = String(value).substring(0, 60);
        console.log(`    ${field}: ${displayVal}`);
        fieldCounts[field] = (fieldCounts[field] || 0) + 1;
        if (!fieldValues[field]) fieldValues[field] = [];
        if (fieldValues[field].length < 3) fieldValues[field].push(`${regNum}:${displayVal}`);
      }
    }
    console.log('');
  }

  console.log(`\n=== FIELD PRESERVATION RESULTS ===\n`);
  console.log(`Phase 1 fields preserved from ${totalSamples} sample records:\n`);

  let preservedCount = 0;
  let missingCount = 0;

  for (const field of phase1Fields) {
    const count = fieldCounts[field] || 0;
    const pct = ((count / totalSamples) * 100).toFixed(1);
    const status = count > 0 ? 'PRESERVED' : 'MISSING';
    if (count > 0) preservedCount++;
    else missingCount++;
    console.log(`  ${field}: ${count}/${totalSamples} (${pct}%) [${status}]`);
    if (fieldValues[field]) {
      for (const ex of fieldValues[field]) {
        console.log(`    e.g. ${ex}`);
      }
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total Phase 1 fields: ${phase1Fields.length}`);
  console.log(`Preserved: ${preservedCount}`);
  console.log(`Missing: ${missingCount}`);
  console.log(`New coverage: ${((preservedCount / phase1Fields.length) * 100).toFixed(1)}%`);

  const totalOldFields = 18;
  const totalNewFields = totalOldFields + preservedCount;
  const remainingUnmapped = 202 - totalNewFields;
  console.log(`\nTotal mapped fields: ${totalOldFields} -> ${totalNewFields}`);
  console.log(`Remaining unmapped: ${remainingUnmapped}`);

  await p.$disconnect();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });