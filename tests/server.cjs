// Dependency-free preview server: test the same security headers as Netlify.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../public');
const headers = {};
for (const line of fs.readFileSync(path.join(root, '_headers'), 'utf8').split('\n')) {
  const match = line.match(/^\s+([^:]+):\s*(.+)$/);
  if (match) headers[match[1].trim()] = match[2].trim();
}
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml'};
http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400); res.end(); return; }
  const filename = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!filename.startsWith(root + path.sep) || path.basename(filename) === '_headers') {
    res.writeHead(404, headers); res.end('Not found'); return;
  }
  fs.readFile(filename, (error, body) => {
    if (error) { res.writeHead(404, headers); res.end('Not found'); return; }
    res.writeHead(200, {...headers, 'Content-Type':mime[path.extname(filename)] || 'application/octet-stream'});
    res.end(req.method === 'HEAD' ? undefined : body);
  });
}).listen(4173, '127.0.0.1');
