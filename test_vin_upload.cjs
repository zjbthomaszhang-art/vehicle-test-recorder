const http = require('http');
const fs = require('fs');

const filePath = 'D:\\HG\\SOS\\新车上线\\数据\\VINP0428.xlsx';
const fileContent = fs.readFileSync(filePath);
const boundary = 'FormBoundary7MA4YWxkTrZu0gW';
const CRLF = '\r\n';

const header = [
  '--' + boundary,
  'Content-Disposition: form-data; name="file"; filename="VINP0428.xlsx"',
  'Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '',
  ''
].join(CRLF);

const footer = CRLF + '--' + boundary + '--' + CRLF;

const body = Buffer.concat([
  Buffer.from(header),
  fileContent,
  Buffer.from(footer)
]);

const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/vin-rules/upload',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': body.length
  }
}, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      console.log('Response:', JSON.stringify(JSON.parse(d), null, 2));
    } catch (e) {
      console.log('Raw:', d);
    }
  });
});

req.on('error', e => console.error('Request error:', e.message));
req.write(body);
req.end();
