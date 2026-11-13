import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DATA_STATUS, DEMO_FARM } from '../data.mjs';

test('the one demo definition is Rajkot and includes the farmer current rotation', () => {
  assert.equal(DEMO_FARM.lat, 22.30);
  assert.equal(DEMO_FARM.lon, 70.80);
  assert.equal(DEMO_FARM.name, 'Demo farm, Rajkot');
  assert.deepEqual(DEMO_FARM.current_rotation, { kharif: 'groundnut', rabi: 'wheat', zaid: null });
  assert.deepEqual(DEMO_FARM.irrigation_mm, { kharif: 0, rabi: 150, zaid: 0 });
  assert(Object.isFrozen(DEMO_FARM));
  assert(Object.isFrozen(DEMO_FARM.current_rotation));
});

test('empty crop table and data placeholders do not masquerade as observations', async () => {
  const crops = JSON.parse(await readFile(new URL('../data/crops.json', import.meta.url), 'utf8'));
  assert.deepEqual(crops, []);
  for (const file of ['demo-power-daily.json', 'demo-power-monthly.json']) {
    const fixture = JSON.parse(await readFile(new URL(`../data/${file}`, import.meta.url), 'utf8'));
    assert.equal(fixture.status, 'not-loaded');
    assert.equal(fixture.properties, undefined);
    assert.match(fixture.note, /No .*NASA observations/);
  }
  assert(Object.values(DATA_STATUS).every(status => status === 'not-loaded'));
});
