const crypto = require('crypto');
const https = require('https');
const zlib = require('zlib');

// Try a different segment - segment 2 which might have different data
const accountId = '85f6a6181b4653c2a45e69cb7ce8a474';
const accessKeyId = 'bc09e14230359b0d7d2f1e528d674a80';
const secretAccessKey = '04d3435d1c1b8cc23adf8f5bf8f9b6dc47204ddddd2dcf4a84c72cb5bc08a289';
const bucketName = 'dawaisaver-pk';
const key = 'drap/archive/04c2e697-9a0e-4b7c-a5de-100017f867f4/segment-000002-079850-080849.jsonl.gz';

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

function encodeKey(value) {
  return value
    .split('/')
    .filter(segment => segment.length > 0)
    .map(segment => encodeURIComponent(segment))
    .join('/');
}

async function downloadWithAuth() {
  const method = 'GET';
  const amzDate = toAmzDate(new Date());
  const dateStamp = amzDate.slice(0, 8);
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const encodedKey = encodeKey(key);
  
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
    `/${bucketName}/${encodedKey}`,
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
    path: `/${bucketName}/${encodedKey}`,
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
    
    if (result.status !== 200) {
      console.log('Error:', result.data.toString('utf8').substring(0, 500));
      return;
    }
    
    const decompressed = zlib.gunzipSync(result.data);
    const content = decompressed.toString();
    const lines = content.split('\n').slice(0, 20);
    
    let selfManufacturing = 0;
    let contractImport = 0;
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const record = JSON.parse(line);
          if (record.rawHtml) {
            const lowerHtml = record.rawHtml.toLowerCase();
            const hasSelfMfg = lowerHtml.includes('self manufacturing') || lowerHtml.includes('self-manufacturing');
            const hasContract = lowerHtml.includes('contract') || lowerHtml.includes('importer');
            
            if (hasSelfMfg) selfManufacturing++;
            if (hasContract) contractImport++;
            
            if (hasContract && !hasSelfMfg) {
              console.log('\n=== Contract/Import Registration:', record.registrationNumber, '===');
              // Look for company/manufacturer data
              const companyIdx = record.rawHtml.indexOf('Company Name');
              const addrIdx = record.rawHtml.indexOf('Company Address');
              if (companyIdx > 0) console.log('Company Name context:', record.rawHtml.substring(companyIdx, companyIdx + 300));
              if (addrIdx > 0) console.log('Company Address context:', record.rawHtml.substring(addrIdx, addrIdx + 300));
            }
          }
        } catch (e) {}
      }
    }
    
    console.log('\n\nSummary:');
    console.log('Self Manufacturing records:', selfManufacturing);
    console.log('Contract/Import records:', contractImport);
  } catch (e) {
    console.error('Error:', e.message);
  }
})();