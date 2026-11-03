import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const port = Number(process.env.PORT || 4176);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2'
};

const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const candidate = path.resolve(root, relative);
  const safe = candidate.startsWith(root) && fs.existsSync(candidate) && fs.statSync(candidate).isFile();
  const file = safe ? candidate : path.join(root, 'index.html');
  response.writeHead(200, {
    'Content-Type': types[path.extname(file)] || 'application/octet-stream',
    'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=3600' : 'no-cache'
  });
  fs.createReadStream(file).pipe(response);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Azure Palace: http://127.0.0.1:${port}/3`);
});
