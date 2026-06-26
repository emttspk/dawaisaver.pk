const crypto = require('crypto');
const https = require('https');

const accountId = '85f6a6181b4653c2a45e69cb7ce8a474';
const accessKeyId = 'bc09e14230359b0d7d2f1e528d674a80';
const secretAccessKey = '04d3435d1c1b8cc23adf8f5bf8f9b6dc47204ddddd2dcf4a84c72cb5bc08a289';
const bucketName = 'dawaisaver-pk';
const key = 'drap/archive/04c2e697-9a0e-4b7c-a5de-100017f867f4/segment-000001-078850-079849.jsonl.gz';

function sha256Hex(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function toAmzDate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

function getSigningKey(secretAccessKey, dateStamp, region, service) {
  const kDate = crypto.createHmac('sha256', `AWS4${secretAccessKey}`).update(dateStamp, 'utf8').digest();
  const kRegion = crypto.createHmac('sha256', kDate).update(region, 'utf8').digest();
  const kService = crypto.createHmac('sha256', kRegion).update(service, 'utf8').digest();
  return crypto.createHmac('sha256', kService).update('aws4_request', 'utf8').digest();
}

async function downloadWithAuth() {
  const method = 'GET';
  const amzDate = toAmzDate(new Date());
  const dateStamp = amzDate.slice(0, 8);
  const host = `${accountId}.r2.cloudflarestorage.com`;
  
  const headers = {
    host: host,
    'x-amz-content-sha256': sha256Hex(''),
    'x-amz-date': amzDate,
  };
  
  const canonicalHeaders = Object.entries(headers)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v.trim().replace(/\s+/g, ' ')}\n`)
    .join('');
  
  const signedHeaders = Object.keys(headers).sort().join(';');
  const canonicalRequest = [
    method,
    `/${bucketName}/${key.replace(/\//g, '%2F')}`,
    '',
    canonicalHeaders,
    signedHeaders,
    sha256Hex('')
  ].join('\n');
  
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(Buffer.from(canonicalRequest, 'utf8'))
  ].join('\n');
  
  const signingKey = getSigningKey(secretAccessKey, dateStamp, 'auto', 's3');
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign, 'utf8').digest('hex');
  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  const options = {
    hostname: host,
    path: `/${bucketName}/${key}`,
    method: method,
    headers: {
      'Authorization': authorization,
      'Host': host,
      'X-Amz-Date': amzDate,
      'X-Amz-Content-Sha256': sha256Hex('')
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, data: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  try {
    const result = await downloadWithAuth();
    console.log('Status:', result.status);
    console.log('Data length:', result.data.length);
    
    const zlib = require('zlib');
    const decompressed = zlib.gunzipSync(result.data);
    const lines = decompressed.toString().split('\n').slice(0, 3);
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const record = JSON.parse(line);
          console.log('\n=== Sample Record ===');
          console.log('registrationNumber:', record.registrationNumber);
          console.log('rawHtml exists:', !!record.rawHtml);
          if (record.rawHtml) {
            console.log('rawHtml length:', record.rawHtml.length);
            // Look for company/manufacturer info
            const companyMatch = record.rawHtml.match(/Company\s*[:\-]\s*([^<\n]+)/i);
            const manufacturerMatch = record.rawHtml.match(/Manufacturer\s*[:\-]\s*([^<\n]+)/i);
            const applicantMatch = record.rawHtml.match(/Applicant\s*[:\-]\s*([^<\n]+)/i);
            console.log('Company found:', companyMatch ? companyMatch[1].trim() : 'NOT FOUND');
            console.log('Manufacturer found:', manufacturerMatch ? manufacturerMatch[1].trim() : 'NOT FOUND');
            console.log('Applicant found:', applicantMatch ? applicantMatch[1].trim() : 'NOT FOUND');
          }
        } catch (e) {}
      }
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
})();