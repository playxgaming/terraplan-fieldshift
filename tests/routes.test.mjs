import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ROUTES, resolveRoute, renderNotFound } from '../views.mjs';
import { getGlossaryEntry } from '../glossary.mjs';
import { generateRotations } from '../engine.mjs';
import { DEMO_FARM } from '../data.mjs';

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

test('comparison empty states keep all three places and the five explanation sections', () => {
  const html = resolveRoute('#/compare').render();
  for (const label of ['Your current', 'Option A', 'Option B', 'Why', 'Evidence (NASA numbers)', 'Benefits', 'Information gaps', 'Check locally (KVK / agri officer)']) assert(html.includes(label));
  assert.equal((html.match(/data-comparison=/g) || []).length, 3);
  assert.equal((html.match(/data-explanation=/g) || []).length, 15);
});

test('all screens share the persistent decision-support banner outside their route content', async () => {
  const shell = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(shell, /TerraPlan supports your decision\. It does not replace your judgment or local advice\./);
  assert.match(shell, /<main id="app" tabindex="-1"><\/main>/);
  assert(shell.indexOf('decision-banner') < shell.indexOf('<main'));
  assert.match(shell, /data-glossary="kvk"/);
  assert(shell.includes('Current / Option A / Option B comparison available'));
});

test('terms used in the scaffold have definitions and unsupported terms are rejected', () => {
  assert.match(getGlossaryEntry('kvk').definition, /Krishi Vigyan Kendra/);
  assert.match(getGlossaryEntry('rotation').definition, /sequence of crops/);
  assert.equal(getGlossaryEntry('__proto__'), null);
  assert.equal(getGlossaryEntry('unknown'), null);
});

test('unloaded comparison keeps current warnings and exclusions visible without inventing scores', async () => {
  const crops = JSON.parse(await readFile(new URL('../data/crops.json', import.meta.url), 'utf8'));
  const field = { ...DEMO_FARM, soil: 'sandy', current_rotation: {kharif:'rice',rabi:'wheat',zaid:null} };
  const generated = generateRotations(crops, field);
  const html = resolveRoute('#/compare').render({ generated, field, cropData: {crops,errors:[],status:'loaded'} });
  assert(html.includes('Current-rotation warnings'));
  assert(html.includes('Rice on sandy soil loses too much water'));
  assert(html.includes(`Excluded (${generated.excluded.length})`));
  assert(html.includes('Not scored'));
  assert(html.includes('matching field/weather inputs'));
  const failed = resolveRoute('#/compare').render({ generated:generateRotations([],field),field,cropData:{crops:[],errors:[],status:'error'} });
  assert(failed.includes('Current-rotation warnings'));
  assert(failed.includes('Crop data are unavailable'));
  assert(failed.includes('missing or invalid'));
});

test('Evidence reports skipped rows, escapes diagnostics and labels every starter row with its source', async () => {
  const crops = JSON.parse(await readFile(new URL('../data/crops.json', import.meta.url), 'utf8'));
  const html = resolveRoute('#/evidence').render({cropData:{crops,status:'loaded',errors:[{row:13,id:'<bad>',messages:['<script>bad</script>']}]}});
  assert.equal((html.match(/Source for all values in this row/g) ?? []).length, 12);
  assert.equal((html.match(/illustrative \(AI-drafted, not verified\)/g) ?? []).length, 13);
  assert(html.includes('Row 13 (&lt;bad&gt;)'));
  assert(!html.includes('<script>'));
  assert(html.includes('All starter-based results are Low'));
});
