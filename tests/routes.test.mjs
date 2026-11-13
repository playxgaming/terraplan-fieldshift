import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ROUTES, resolveRoute, renderNotFound } from '../views.mjs';
import { getGlossaryEntry } from '../glossary.mjs';

test('all seven required routes resolve and return complete screen content', () => {
  assert.deepEqual(ROUTES.map(route => route.path), ['/', '/field', '/climate', '/priorities', '/compare', '/whatif', '/evidence']);
  for (const route of ROUTES) {
    assert.equal(resolveRoute(`#${route.path}`), route);
    const html = route.render();
    assert.match(html, /<h1>/);
    assert.equal((html.match(/<h1>/g) || []).length, 1);
    assert(!html.includes('undefined'));
  }
});

test('empty hashes show Welcome and unknown routes have a recoverable screen', () => {
  assert.equal(resolveRoute('').path, '/');
  assert.equal(resolveRoute('#').path, '/');
  assert.equal(resolveRoute('#/not-a-real-page'), null);
  assert.match(renderNotFound(), /Return to Welcome/);
  assert.match(renderNotFound(), /data-navigate="\/"/);
});

test('comparison placeholders keep the current rotation and required explanations visible', () => {
  const html = resolveRoute('#/compare').render();
  for (const label of ['Your current', 'Option A', 'Option B', 'Why', 'Evidence (NASA numbers)', 'Benefits', 'Information gaps', 'Check locally (KVK / agri officer)']) assert(html.includes(label));
  assert.equal((html.match(/Not calculated yet/g) || []).length, 3);
  assert.equal((html.match(/No score or confidence label is available/g) || []).length, 3);
});

test('all screens share the persistent decision-support banner outside their route content', async () => {
  const shell = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(shell, /TerraPlan supports your decision\. It does not replace your judgment or local advice\./);
  assert.match(shell, /<main id="app" tabindex="-1"><\/main>/);
  assert(shell.indexOf('decision-banner') < shell.indexOf('<main'));
  assert.match(shell, /data-glossary="kvk"/);
  assert.match(shell, /No crop scores or NASA measurements are loaded/);
});

test('terms used in the scaffold have definitions and unsupported terms are rejected', () => {
  assert.match(getGlossaryEntry('kvk').definition, /Krishi Vigyan Kendra/);
  assert.match(getGlossaryEntry('rotation').definition, /sequence of crops/);
  assert.equal(getGlossaryEntry('__proto__'), null);
  assert.equal(getGlossaryEntry('unknown'), null);
});
