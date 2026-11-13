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
  assert.match(shell, /Crop scoring is not implemented yet/);
});

test('terms used in the scaffold have definitions and unsupported terms are rejected', () => {
  assert.match(getGlossaryEntry('kvk').definition, /Krishi Vigyan Kendra/);
  assert.match(getGlossaryEntry('rotation').definition, /sequence of crops/);
  assert.equal(getGlossaryEntry('__proto__'), null);
  assert.equal(getGlossaryEntry('unknown'), null);
});

test('generation preview keeps current warnings and exclusions visible without scores or rankings', async () => {
  const crops = JSON.parse(await readFile(new URL('../data/crops.json', import.meta.url), 'utf8'));
  const field = { ...DEMO_FARM, soil: 'sandy', current_rotation: {kharif:'rice',rabi:'wheat',zaid:null} };
  const generated = generateRotations(crops, field);
  const html = resolveRoute('#/compare').render({ generated, field, cropData: {crops,errors:[],status:'loaded'} });
  assert(html.includes('Your current · retained for comparison'));
  assert(html.includes('Rice on sandy soil loses too much water'));
  assert(html.includes(`Excluded (${generated.excluded.length})`));
  assert(html.includes('unranked'));
  assert(html.includes('not been scored or checked against weather'));
  const failed = resolveRoute('#/compare').render({ generated:generateRotations([],field),field,cropData:{crops:[],errors:[],status:'error'} });
  assert(failed.includes('Your current · retained for comparison'));
  assert(failed.includes('crop data are unavailable'));
  assert(failed.includes('missing or invalid'));
});

test('Evidence reports skipped rows, escapes diagnostics and labels every starter row with its source', async () => {
  const crops = JSON.parse(await readFile(new URL('../data/crops.json', import.meta.url), 'utf8'));
  const html = resolveRoute('#/evidence').render({cropData:{crops,status:'loaded',errors:[{row:13,id:'<bad>',messages:['<script>bad</script>']}]}});
  assert.equal((html.match(/Source for all values in this row/g) ?? []).length, 12);
  assert.equal((html.match(/illustrative \(AI-drafted, not verified\)/g) ?? []).length, 13);
  assert(html.includes('Row 13 (&lt;bad&gt;)'));
  assert(!html.includes('<script>'));
  assert(html.includes('all starter-based results will be Low'));
});
