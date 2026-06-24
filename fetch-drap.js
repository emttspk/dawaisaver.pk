const https = require('https');
const http = require('http');
const fs = require('fs');

function fetch(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location).then(resolve).catch(reject);
      }
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

function stripTags(v) {
  return String(v || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function clean(v) {
  return String(v || '').replace(/^\uFEFF/, '').replace(/\u00a0/g, ' ').replace(/\r/g, '').replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
}

async function main() {
  const reg = process.argv[2] || '125254';
  const url = `https://eapp.dra.gov.pk/product_view_web.php?reg_no=${reg}`;
  
  try {
    const html = await fetch(url);
    console.log(`Fetched ${html.length} bytes for registration ${reg}`);
    
    // Save raw HTML
    fs.writeFileSync(`/tmp/drap-${reg}.html`, html);
    console.log(`Saved to /tmp/drap-${reg}.html`);
    
    // Extract all labeled fields using multiple methods
    const fields = {};
    
    // Method 1: col-sm-4 / col-sm-8 (current DRAP template)
    const colPattern = /<div class="col-sm-4[^"]*">([\s\S]*?)<\/div>\s*<div class="col-sm-8[^"]*">([\s\S]*?)<\/div>/gi;
    let m;
    while ((m = colPattern.exec(html)) !== null) {
      const label = clean(stripTags(m[1]));
      const value = clean(stripTags(m[2]));
      if (label && value) fields[label] = value;
    }
    
    // Method 2: small / mt-1 (old template)
    const smallPattern = /<div class="small[^"]*">([\s\S]*?)<\/div>\s*<div class="mt-1"[^>]*>([\s\S]*?)<\/div>/gi;
    while ((m = smallPattern.exec(html)) !== null) {
      const label = clean(stripTags(m[1]));
      const value = clean(stripTags(m[2]));
      if (label && value) fields[label] = value;
    }
    
    // Method 3: dt/dd
    const dtPattern = /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi;
    while ((m = dtPattern.exec(html)) !== null) {
      const label = clean(stripTags(m[1]));
      const value = clean(stripTags(m[2]));
      if (label && value) fields[label] = value;
    }
    
    // Method 4: th/td
    const thPattern = /<th[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/gi;
    while ((m = thPattern.exec(html)) !== null) {
      const label = clean(stripTags(m[1]));
      const value = clean(stripTags(m[2]));
      if (label && value) fields[label] = value;
    }
    
    // Method 5: b/strong followed by text
    const boldPattern = /<(?:b|strong)[^>]*>([\s\S]*?)<\/(?:b|strong)>[\s:]*([\s\S]*?)(?=<(?:b|strong|div|h6|br)|\n\n)/gi;
    while ((m = boldPattern.exec(html)) !== null) {
      const label = clean(stripTags(m[1]));
      const value = clean(stripTags(m[2]));
      if (label && value && label.length < 50) fields[label] = value;
    }
    
    // Method 6: h6 section headers
    const h6Pattern = /<h6[^>]*>([\s\S]*?)<\/h6>/gi;
    while ((m = h6Pattern.exec(html)) !== null) {
      const section = clean(stripTags(m[1]));
      if (section) fields[`SECTION: ${section}`] = '(section header)';
    }
    
    // Method 7: label/input
    const inputPattern = /<label[^>]*for="([^"]*)"[^>]*>([\s\S]*?)<\/label>[\s\S]*?<input[^>]*name="([^"]*)"[^>]*value="([^"]*)"/gi;
    while ((m = inputPattern.exec(html)) !== null) {
      const label = clean(stripTags(m[2]));
      const value = m[4];
      if (label && value) fields[label] = value;
    }
    
    // Method 8: any div with badge class
    const badgePattern = /<span class="badge[^"]*">([\s\S]*?)<\/span>/gi;
    let badgeIdx = 0;
    while ((m = badgePattern.exec(html)) !== null) {
      const badge = clean(stripTags(m[1]));
      if (badge) fields[`Badge_${badgeIdx++}`] = badge;
    }
    
    console.log(`\n=== Extracted ${Object.keys(fields).length} fields ===\n`);
    for (const [k, v] of Object.entries(fields)) {
      console.log(`${k}: ${v.substring(0, 100)}`);
    }
    
  } catch (e) {
    console.error('Error:', e.message);
  }
}

main();