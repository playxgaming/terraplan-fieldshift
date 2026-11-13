import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createStaticServer } from './serve.mjs';

test('preview serves app, module and NASA data with appropriate MIME types', async t => {
  const server = createStaticServer();
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  const page = await fetch(base); assert.equal(page.status, 200); assert.match(await page.text(), /TerraPlan/);
  const module = await fetch(`${base}/engine.mjs`); assert.equal(module.status, 200); assert.match(module.headers.get('content-type'), /javascript/);
  const data = await fetch(`${base}/data/pune-history.json`); assert.equal(data.status, 200); assert((await data.json()).data.properties.parameter.T2M);
  const head = await fetch(`${base}/index.html`, { method: 'HEAD' }); assert.equal(head.status, 200); assert.equal(await head.text(), '');
});

test('preview rejects unsupported methods, malformed paths and access outside static files', async t => {
  const server = createStaticServer();
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(base, { method: 'POST' })).status, 405);
  assert.equal((await fetch(`${base}/.env`)).status, 403);
  assert.equal((await fetch(`${base}/..%2fREADME.md`)).status, 403);
  assert.equal((await fetch(`${base}/%ZZ`)).status, 400);
  assert.equal((await fetch(`${base}/missing-file`)).status, 404);
});
