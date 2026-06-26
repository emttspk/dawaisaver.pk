const https = require('https');
const zlib = require('zlib');

// Use the exact URL from the archive metadata (without bucket name in path)
const url = 'https://85f6a6181b4653c2a45e69cb7ce8a474.r2.cloudflarestorage.com/drap/archive/04c2e697-9a0e-4b7c-a5de-100017f867f4/segment-000001-078850-079849.jsonl.gz';

console.log('Fetching:', url);

https.get(url, (res) => {
  console.log('Status:', res.statusCode);
  const chunks = [];
  res.on('data', (chunk) => chunks.push(chunk));
  res.on('end', () => {
    const data = Buffer.concat(chunks);
    console.log('Data length:', data.length);
    
    try {
      const decompressed = zlib.gunzipSync(data);
      const lines = decompressed.toString().split('\n').slice(0, 5);
      
      for (const line of lines) {
        if (line.trim()) {
          const record = JSON.parse(line);
          console.log('\n=== Sample Record ===');
          console.log('registrationNumber:', record.registrationNumber);
          console.log('rawHtml exists:', !!record.rawHtml);
          if (record.rawHtml) {
            console.log('rawHtml length:', record.rawHtml.length);
            console.log('rawHtml preview:', record.rawHtml.substring(0, 1000));
          }
        }
      }
    } catch (e) {
      console.error('Error:', e.message);
      console.log('First 500 chars:', data.toString('utf8').substring(0, 500));
    }
  });
}).on('error', (e) => {
  console.error('Error:', e.message);
});