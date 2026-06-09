import http from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { execFileSync } from 'node:child_process';

mkdirSync('dist/assets', { recursive: true });
execFileSync(process.platform === 'win32' ? 'tsc.cmd' : 'tsc', ['-p', 'tsconfig.json'], { stdio: 'inherit' });
const root = process.cwd();
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.map':'application/json', '.json':'application/json; charset=utf-8', '.webmanifest':'application/manifest+json' };
const resolveFile = (urlPath) => {
  const clean = urlPath.replace(/^\/+/, '');
  if (clean === '') return join(root, 'public/index.html');
  if (clean === 'assets/styles.css') return join(root, 'src/styles.css');
  if (clean.startsWith('assets/')) return join(root, 'dist', clean);
  if (clean.startsWith('content/')) return join(root, 'public', clean);
  if (clean.startsWith('public/content/')) return join(root, clean);
  if (clean === 'config.js' || clean === 'manifest.webmanifest') return join(root, 'public', clean);
  return join(root, 'public/index.html');
};
const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/');
  const file = normalize(resolveFile(urlPath));
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) { res.writeHead(404); res.end('Not found'); return; }
  try {
    res.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream', 'Cache-Control':'no-store' });
    res.end(readFileSync(file));
  } catch {
    res.writeHead(500); res.end('Server error');
  }
});
server.listen(4173, () => console.log('TeaCloud dev server: http://localhost:4173'));
