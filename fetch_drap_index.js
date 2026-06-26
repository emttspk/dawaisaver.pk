const https = require('https');

const url = 'https://eapp.dra.gov.pk/WebProductIndex.php';

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Content length:', data.length);
    console.log('\n=== First 5000 chars ===');
    console.log(data.substring(0, 5000));
  });
}).on('error', (e) => {
  console.error('Error:', e.message);
});