const {PrismaClient} = require('@prisma/client');
const https = require('https');
const http = require('http');
const fs = require('fs');

const p = new PrismaClient();

function fetch(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function stripTags(v) {
  return String(v || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function cleanText(v) {
  return String(v || '').replace(/^\uFEFF/, '').replace(/\u00a0/g, ' ').replace(/\r/g, '').replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractAllFields(html) {
  const fields = {};
  
  // Method 1: div with badge/label patterns - look for dt/dd
  const dtPattern = /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi;
  let m;
  while ((m = dtPattern.exec(html)) !== null) {
    const label = cleanText(stripTags(m[1]));
    const value = cleanText(stripTags(m[2]));
    if (label && value) fields[label] = value;
  }
  
  // Method 2: th/td pairs
  const thPattern = /<th[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/gi;
  while ((m = thPattern.exec(html)) !== null) {
    const label = cleanText(stripTags(m[1]));
    const value = cleanText(stripTags(m[2]));
    if (label && value) fields[label] = value;
  }
  
  // Method 3: Look for all div pairs with label/value structure
  // DRAP uses various structures, let's capture all text near labels
  const labelPattern = /<(?:label|span|div)[^>]*class="[^"]*(?:small|label|field|caption|text-muted)[^"]*"[^>]*>([\s\S]*?)<\/?(?:label|span|div)>/gi;
  while ((m = labelPattern.exec(html)) !== null) {
    const label = cleanText(stripTags(m[1]));
    if (label && label.length > 1 && label.length < 50) {
      // Try to find the next text content after this label
      const afterLabel = html.slice(m.index + m[0].length, m.index + m[0].length + 500);
      const valueMatch = afterLabel.match(/<(?:div|span|td|p)[^>]*>([\s\S]*?)<\/(?:div|span|td|p)>/i);
      if (valueMatch) {
        const value = cleanText(stripTags(valueMatch[1]));
        if (value && value.length > 0 && value.length < 200) {
          fields[label] = value;
        }
      }
    }
  }
  
  // Method 4: h6 section headers - capture section names
  const h6Pattern = /<h6[^>]*>([\s\S]*?)<\/h6>/gi;
  while ((m = h6Pattern.exec(html)) !== null) {
    const section = cleanText(stripTags(m[1]));
    if (section) fields[`SECTION: ${section}`] = '(section header)';
  }
  
  // Method 5: input fields with values
  const inputPattern = /<input[^>]*name="([^"]*)"[^>]*value="([^"]*)"[^>]*\/?>/gi;
  while ((m = inputPattern.exec(html)) !== null) {
    const name = m[1];
    const value = m[2];
    if (name && value) fields[`INPUT: ${name}`] = value;
  }
  
  // Method 6: select/option selected values
  const selectPattern = /<select[^>]*name="([^"]*)"[\s\S]*?<option[^>]*selected[^>]*>([\s\S]*?)<\/option>/gi;
  while ((m = selectPattern.exec(html)) !== null) {
    const name = m[1];
    const value = cleanText(stripTags(m[2]));
    if (name && value) fields[`SELECT: ${name}`] = value;
  }
  
  // Method 7: textarea content
  const textareaPattern = /<textarea[^>]*name="([^"]*)"[^>]*>([\s\S]*?)<\/textarea>/gi;
  while ((m = textareaPattern.exec(html)) !== null) {
    const name = m[1];
    const value = cleanText(stripTags(m[2]));
    if (name && value) fields[`TEXTAREA: ${name}`] = value;
  }
  
  // Method 8: b/strong tags followed by colon and value
  const boldPattern = /<(?:b|strong)[^>]*>([\s\S]*?)<\/(?:b|strong)>[\s:]*([\s\S]*?)(?=<(?:b|strong|div|h6|br)|\n\n)/gi;
  while ((m = boldPattern.exec(html)) !== null) {
    const label = cleanText(stripTags(m[1]));
    const value = cleanText(stripTags(m[2]));
    if (label && value && label.length < 50) fields[label] = value;
  }
  
  return fields;
}

async function main() {
  // Get a diverse sample of registrations across the range
  const samples = await p.$queryRaw`
    SELECT DISTINCT registration_number 
    FROM import_batch_items 
    WHERE status = 'SAVED' 
    ORDER BY random() 
    LIMIT 50
  `;
  
  const regNumbers = samples.map(s => s.registration_number);
  console.log(`Sampling ${regNumbers.length} registrations...`);
  
  const allFields = {};
  let successCount = 0;
  let failCount = 0;
  
  for (const reg of regNumbers) {
    const url = `https://eapp.dra.gov.pk/product_view_web.php?reg_no=${reg}`;
    try {
      const html = await fetch(url);
      if (html.length < 1000) {
        failCount++;
        continue;
      }
      
      const fields = extractAllFields(html);
      successCount++;
      
      for (const [key, value] of Object.entries(fields)) {
        if (!allFields[key]) {
          allFields[key] = { count: 0, example: value, registrations: [] };
        }
        allFields[key].count++;
        if (allFields[key].registrations.length < 3) {
          allFields[key].registrations.push(reg);
        }
      }
      
      if (successCount % 10 === 0) {
        console.log(`  Progress: ${successCount} success, ${failCount} fail, ${Object.keys(allFields).length} unique fields`);
      }
      
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      failCount++;
    }
  }
  
  console.log(`\n=== RESULTS ===`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Total unique fields: ${Object.keys(allFields).length}`);
  
  const sorted = Object.entries(allFields)
    .sort((a, b) => b[1].count - a[1].count);
  
  console.log(`\n=== FIELD INVENTORY ===`);
  for (const [field, info] of sorted) {
    const pct = ((info.count / successCount) * 100).toFixed(1);
    const example = String(info.example || '').substring(0, 60);
    console.log(`${field}: ${info.count}/${successCount} (${pct}%) - e.g. "${example}"`);
  }
  
  const output = {
    sampled: regNumbers.length,
    success: successCount,
    failed: failCount,
    totalFields: Object.keys(allFields).length,
    fields: Object.fromEntries(sorted.map(([k, v]) => [k, { count: v.count, coverage: ((v.count / successCount) * 100).toFixed(1) + '%', example: String(v.example || '').substring(0, 100), sampleRegistrations: v.registrations }]))
  };
  fs.writeFileSync('D:/DawaiSaver.pk/reports/generated/drap-field-inventory.json', JSON.stringify(output, null, 2));
  console.log('\nSaved to reports/generated/drap-field-inventory.json');
  
  await p.$disconnect();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });