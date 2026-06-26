const https = require('https');

const url = 'https://85f6a6181b4653c2a45e69cb7ce8a474.r2.cloudflarestorage.com/drap/archive/04c2e697-9a0e-4b7c-a5de-100017f867f4/segment-000001-078850-079849.jsonl.gz';

https.get(url, (res) => {
  const chunks = [];
  res.on('data', (chunk) => chunks.push(chunk));
  res.on('end', () => {
    const data = Buffer.concat(chunks);
    console.log('Content-Type:', res.headers['content-type']);
    console.log('Content-Length:', data.length);
    console.log('First 1000 chars:', data.toString('utf8').substring(0, 1000));
  });
}).on('error', (e) => {
  console.error('Error:', e.message);
});