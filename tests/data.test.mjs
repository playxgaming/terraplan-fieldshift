import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DATA_STATUS, DEMO_FARM, loadCrops } from '../data.mjs';

test('the one demo definition is Jaipur and includes the farmer current rotation', () => {
  assert.equal(DEMO_FARM.lat, 26.97);
  assert.equal(DEMO_FARM.lon, 75.38);
  assert.equal(DEMO_FARM.name, 'Demo farm, Jobner · Jaipur');
  assert.deepEqual(DEMO_FARM.current_rotation, { kharif: 'bajra', rabi: 'wheat', zaid: null });
  assert.deepEqual(DEMO_FARM.irrigation_mm, { kharif: 0, rabi: 150, zaid: 0 });
  assert(Object.isFrozen(DEMO_FARM));
  assert(Object.isFrozen(DEMO_FARM.current_rotation));
});

test('crop assumptions are unverified and weather bundles retain NASA responses and provenance', async () => {
  const crops = JSON.parse(await readFile(new URL('../data/crops.json', import.meta.url), 'utf8'));
  assert.equal(crops.length, 15);
  for (const crop of crops) {
    assert.equal(crop.verified, false);
    assert(crop.source_note.includes('not verified') || crop.source_note.includes('not agronomist-verified'));
    if(crop.review)assert(crop.review.sources.length>=2);
    assert.equal(crop.photo.url, '');
  }
  for (const file of ['demo-power-daily.json', 'demo-power-monthly.json']) {
    const fixture = JSON.parse(await readFile(new URL(`../data/${file}`, import.meta.url), 'utf8'));
    assert(fixture.properties.parameter);
    assert.equal(fixture.header.fill_value, -999);
    assert.equal(fixture._terraplan.point.lat, DEMO_FARM.lat);
    assert.equal(fixture._terraplan.point.lon, DEMO_FARM.lon);
    assert.match(fixture._terraplan.request_url, /^https:\/\/power\.larc\.nasa\.gov\//);
    assert(Number.isFinite(Date.parse(fixture._terraplan.retrieved_at)));
  }
  assert(Object.values(DATA_STATUS).every(status => status === 'not-loaded'));
});

test('crop loader validates bundled rows, skips bad rows and reports failures without throwing', async () => {
  const crops = JSON.parse(await readFile(new URL('../data/crops.json', import.meta.url), 'utf8'));
  let requested;
  const result = await loadCrops(async url => { requested = url; return { ok: true, json: async () => [...crops, { id: 'bad' }] }; });
  assert.match(requested.pathname, /\/data\/crops\.json$/);
  assert.equal(result.status, 'loaded');
  assert.equal(result.crops.length, 15);
  assert.equal(result.errors[0].row, 16);
  for (const fetcher of [async () => { throw new Error('offline'); }, async () => ({ ok: false }), async () => ({ ok: true, json: async () => { throw new Error('bad JSON'); } })]) {
    const failure = await loadCrops(fetcher);
    assert.equal(failure.status, 'error');
    assert.equal(failure.crops.length, 0);
    assert.match(failure.errors[0].messages[0], /Retry/);
  }
});
