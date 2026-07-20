const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables from a local .env file when present.
// Do NOT commit your real API key to source control. Use .env for local testing only.
try {
  require('dotenv').config();
} catch (e) {
  // dotenv is optional; if not installed, environment vars should already be set.
}

const PORT = process.env.PORT || 3000;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'bhavana@neualto.com';
const TO_EMAIL = 'bhavana@neualto.com';
const PUBLIC_ROOT = __dirname;

function buildSendGridPayload(data) {
  const messageBody = [
    `Name: ${data.fullName}`,
    `Email: ${data.workEmail}`,
    `Phone: ${data.phoneNumber}`,
    `Company: ${data.companyName}`,
    `Service: ${data.service}`,
    '',
    'Message:',
    data.message || ''
  ].join('\n');

  return {
    personalizations: [{
      to: [{ email: TO_EMAIL }],
      subject: `New DeltaMax Contact Form Submission from ${data.fullName}`
    }],
    from: { email: SENDGRID_FROM_EMAIL, name: 'DeltaMax Contact Form' },
    reply_to: { email: data.workEmail, name: data.fullName },
    content: [{
      type: 'text/plain',
      value: messageBody
    }]
  };
}

function sendSendGridEmail(payload) {
  return new Promise((resolve, reject) => {
    if (!SENDGRID_API_KEY) {
      reject(new Error('SendGrid API key is not configured. Set SENDGRID_API_KEY in your environment.'));
      return;
    }

    const body = JSON.stringify(payload);
    const options = {
      hostname: 'api.sendgrid.com',
      path: '/v3/mail/send',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let responseText = '';
      res.on('data', (chunk) => {
        responseText += chunk;
      });
      res.on('end', () => {
        // Helpful debug logging: we log status/response but never the API key.
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(responseText);
        } else {
          console.error(`SendGrid responded with ${res.statusCode}: ${responseText}`);
          reject(new Error(`SendGrid responded with ${res.statusCode}: ${responseText}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  switch (extension) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.js':
      return 'application/javascript; charset=utf-8';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.svg':
      return 'image/svg+xml';
    case '.json':
      return 'application/json; charset=utf-8';
    default:
      return 'application/octet-stream';
  }
}

function readStaticFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (error, data) => {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function createServer() {
  return http.createServer(async (req, res) => {
    const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (req.method === 'POST' && requestUrl.pathname === '/api/send-email') {
      try {
        const data = await parseJsonBody(req);
        // Minimal request logging for local debugging. Avoid logging the API key.
        console.log('POST /api/send-email from:', data.workEmail || 'unknown');
        const payload = buildSendGridPayload(data);
        await sendSendGridEmail(payload);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
      return;
    }

    let pathname = requestUrl.pathname;
    if (pathname === '/') {
      pathname = '/index.html';
    }

    const safePath = path.normalize(pathname).replace(/^\.{2,}/, '');
    const filePath = path.join(PUBLIC_ROOT, safePath);

    if (!filePath.startsWith(PUBLIC_ROOT)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    try {
      const fileData = await readStaticFile(filePath);
      res.writeHead(200, { 'Content-Type': getContentType(filePath) });
      res.end(fileData);
    } catch (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
    }
  });
}

if (require.main === module) {
  const server = createServer();
  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = {
  buildSendGridPayload,
  createServer,
  sendSendGridEmail
};
