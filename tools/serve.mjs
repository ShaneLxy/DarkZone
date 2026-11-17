import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const args = process.argv.slice(2);
const host = args.includes('--lan') ? '0.0.0.0' : '127.0.0.1';
const port = Number(process.env.PORT || 8088);
const root = path.resolve(import.meta.dirname, '../build/web-mobile');
if (!fs.existsSync(path.join(root, 'index.html'))) throw new Error('Build first: npm run build');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.wasm': 'application/wasm', '.bin': 'application/octet-stream' };
http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400).end(); return; }
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    fs.createReadStream(file).pipe(res);
  });
}).listen(port, host, () => console.log(`Blackout preview: http://127.0.0.1:${port}/ ${host === '0.0.0.0' ? '(LAN enabled)' : '(local only)'}`));
