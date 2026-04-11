const http = require('http');
const path = require('path');
const url = require('url');
const fs = require('fs');

const logStream = fs.createWriteStream('api-debug.log', { flags: 'a' });
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  console.log(msg);
  logStream.write(line);
}

// Manual .env loader
if (fs.existsSync('.env')) {
  const envText = fs.readFileSync('.env', 'utf-8');
  envText.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      process.env[key.trim()] = valueParts.join('=').trim().replace(/^"(.*)"$/, '$1');
    }
  });
}

const PORT = 3001;

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  log(`[API] ${req.method} ${parsedUrl.pathname}`);

  let apiPath = parsedUrl.pathname;
  if (apiPath.startsWith('/api/')) {
    apiPath = apiPath.substring(5);
  }

  const filePath = path.join(__dirname, 'api', `${apiPath}.js`);

  if (fs.existsSync(filePath)) {
    try {
      delete require.cache[require.resolve(filePath)];
      const handler = require(filePath);
      
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        log(`[API] Body: ${body}`);
        if (body && req.headers['content-type']?.includes('application/json')) {
          try { req.body = JSON.parse(body); } catch(e) { log(`Body parse error: ${e.message}`); }
        }

        const vercelRes = {
          status: (code) => {
            res.statusCode = code;
            return vercelRes;
          },
          json: (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return vercelRes;
          },
          send: (data) => {
            res.end(data);
            return vercelRes;
          }
        };

        try {
          await handler(req, vercelRes);
        } catch (err) {
          log(`[API Error] in ${apiPath}: ${err.message}`);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Internal Server Error', details: err.message }));
        }
      });
    } catch (err) {
      log(`[API Error] Failed to load handler ${apiPath}: ${err.message}`);
      res.statusCode = 500;
      res.end(`Error loading handler: ${err.message}`);
    }
  } else {
    log(`[API Warning] 404 Not Found: ${filePath}`);
    res.statusCode = 404;
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  log(`📡 Local Payment API running at http://localhost:${PORT}`);
});
