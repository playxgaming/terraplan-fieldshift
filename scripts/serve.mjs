import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { dirname, extname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const outside = (root, target) => { const path = relative(root, target); return path === '..' || path.startsWith('../') || path.startsWith('..\\') || isAbsolute(path); };

export function createStaticServer(directory = resolve(projectRoot, 'dist')) {
  const root = realpath(directory);
  return createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cache-Control', 'no-cache');
    const fail = (status, message) => { response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end(request.method === 'HEAD' ? undefined : message); };
    if (!['GET', 'HEAD'].includes(request.method)) { response.setHeader('Allow', 'GET, HEAD'); fail(405, 'Only GET and HEAD are supported.'); return; }
    try {
      let path;
      try { path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); } catch { fail(400, 'Invalid URL encoding.'); return; }
      if (path.includes('\0') || path.split(/[\\/]/).some(part => part.startsWith('.'))) { fail(403, 'This path is unavailable.'); return; }
      const base = await root;
      let target = resolve(base, `.${path}`);
      if (outside(base, target)) { fail(403, 'This path is unavailable.'); return; }
      if ((await stat(target)).isDirectory()) target = resolve(target, 'index.html');
      target = await realpath(target);
      if (outside(base, target)) { fail(403, 'This path is unavailable.'); return; }
      const info = await stat(target);
      if (!info.isFile()) { fail(404, 'File not found.'); return; }
      response.writeHead(200, { 'Content-Type': types[extname(target).toLowerCase()] || 'application/octet-stream', 'Content-Length': info.size });
      response.end(request.method === 'HEAD' ? undefined : await readFile(target));
    } catch (error) {
      if (response.headersSent) { response.destroy(); return; }
      fail(['ENOENT', 'ENOTDIR'].includes(error.code) ? 404 : 500, 'File could not be served.');
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const index = process.argv.indexOf('--port');
  const port = Number(index < 0 ? process.env.PORT || 3000 : process.argv[index + 1]);
  if (!Number.isInteger(port) || port < 1 || port > 65535) { console.error('Choose a port from 1 to 65535 with --port NUMBER.'); process.exit(1); }
  const server = createStaticServer();
  server.on('error', error => { console.error(`Preview failed: ${error.message}`); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`TerraPlan preview: http://127.0.0.1:${port}`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
}
