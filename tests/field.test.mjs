import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_FARM } from '../data.mjs';
import { FIELD_STORAGE_KEY, FIELD_STORAGE_VERSION, SEASONS, emptyField, validateField, loadField, saveField } from '../field.mjs';
import { renderField, renderWelcome } from '../views.mjs';

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}
const demo = () => structuredClone(DEMO_FARM);

test('valid fields normalize form strings, accept zero coordinates and preserve Bare as null', () => {
  const raw = demo();
  Object.assign(raw, { name: '  My field  ', lat: '0', lon: '-180', area_ha: '0.25' });
  raw.irrigation_mm = { kharif: '0', rabi: '1500', zaid: '2.5' };
  const result = validateField(raw);
  assert.equal(result.valid, true);
  assert.deepEqual(result.field, { ...raw, name: 'My field', lat: 0, lon: -180, area_ha: 0.25,
    irrigation_mm: { kharif: 0, rabi: 1500, zaid: 2.5 } });
  assert.equal(result.field.current_rotation.zaid, null);
  assert.equal(raw.lat, '0');
  assert.equal(DEMO_FARM.irrigation_mm.rabi, 150);
});

test('all numeric fields reject empty, nonfinite, coercible objects and out-of-range values', () => {
  const paths = [ ['lat', -91, 91], ['lon', -181, 181], ['area_ha', 0, 101],
    ...SEASONS.map(season => [`irrigation_${season}`, -1, 1501]) ];
  for (const [key, below, above] of paths) {
    for (const value of ['', ' ', 'NaN', NaN, Infinity, -Infinity, '1e999', null, undefined, false, [], [1], {}, '12abc', below, above]) {
      const field = demo();
      if (key.startsWith('irrigation_')) field.irrigation_mm[key.slice(11)] = value;
      else field[key] = value;
      const result = validateField(field);
      assert.equal(result.valid, false, `${key} accepted ${String(value)}`);
      assert(result.errors[key], `${key} needs a visible error`);
      assert.equal(result.field, null, 'invalid numbers must not escape as a field');
    }
  }
  for (const [lat, lon, area] of [[-90, -180, 100], [90, 180, 0.001]]) {
    assert(validateField({ ...demo(), lat, lon, area_ha: area }).valid);
  }
});

test('new fields require explicit entries and invalid select values are rejected', () => {
  const blank = validateField(emptyField());
  assert.equal(blank.valid, false);
  for (const key of ['name', 'lat', 'lon', 'area_ha', 'soil', 'water_source', 'equipment', 'market_access', ...SEASONS.map(season => `rotation_${season}`)]) assert(blank.errors[key]);
  for (const key of ['soil', 'water_source', 'equipment', 'market_access', 'soil_tested']) {
    const result = validateField({ ...demo(), [key]: 'unknown' });
    assert(result.errors[key]);
  }
  for (const season of SEASONS) {
    const field = demo();
    field.current_rotation[season] = 'not-a-crop';
    assert(validateField(field).errors[`rotation_${season}`]);
    field.current_rotation[season] = null;
    assert(validateField(field).valid, 'Bare is supported for every season');
  }
});

test('field round trip is versioned and never changes other stored state', () => {
  const scenario = JSON.stringify({ rain_pct: -25, temperature_c: 1.5, irrigation_mm: { rabi: 240 } });
  const storage = memoryStorage({ 'terraplan.v3.whatif': scenario, unrelated: 'keep me' });
  const saved = saveField(storage, demo());
  assert.equal(saved.error, '');
  const record = JSON.parse(storage.getItem(FIELD_STORAGE_KEY));
  assert.equal(record.version, FIELD_STORAGE_VERSION);
  assert.deepEqual(record.field, DEMO_FARM);
  assert.deepEqual(loadField(storage).field, DEMO_FARM);
  assert.equal(storage.getItem('terraplan.v3.whatif'), scenario);
  assert.equal(storage.getItem('unrelated'), 'keep me');
  assert.equal(storage.values.size, 3);
});

test('failed validation and failed loading leave the saved bytes and previous field intact', () => {
  const storage = memoryStorage();
  saveField(storage, demo());
  const previous = storage.getItem(FIELD_STORAGE_KEY);
  assert.equal(saveField(storage, { ...demo(), lat: '' }).valid, false);
  assert.equal(storage.getItem(FIELD_STORAGE_KEY), previous);
  for (const corrupt of ['{broken', 'null', '[]', '{"version":999}', JSON.stringify({ version: FIELD_STORAGE_VERSION, field: { ...demo(), lat: null } })]) {
    storage.setItem(FIELD_STORAGE_KEY, corrupt);
    const fallback = demo();
    const result = loadField(storage, fallback);
    assert.strictEqual(result.field, fallback);
    assert.match(result.error, /stored copy has been kept/);
    assert.equal(storage.getItem(FIELD_STORAGE_KEY), corrupt);
  }
});

test('blocked storage and quota errors produce recoverable messages rather than throw', () => {
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); } };
  assert.match(loadField(blocked).error, /Could not read/);
  const result = saveField(blocked, demo());
  assert.equal(result.valid, true);
  assert.match(result.error, /could not save/);
  assert.deepEqual(result.field, DEMO_FARM);
});

test('form safely renders saved names, labelled controls and explicit Bare choices', () => {
  const html = renderField({ draft: { ...demo(), name: '\"><img src=x onerror=alert(1)>' }, storageError: '<script>bad</script>' });
  assert(!html.includes('<img'));
  assert(!html.includes('<script>'));
  assert(html.includes('&lt;img'));
  for (const id of ['name', 'lat', 'lon', 'soil', 'soil_tested', 'area_ha', 'water_source', 'equipment', 'market_access', ...SEASONS.flatMap(season => [`irrigation_${season}`, `rotation_${season}`])]) {
    assert(html.includes(`for="${id}"`));
    assert(html.includes(`id="error-${id}"`));
  }
  assert.equal((html.match(/Bare \(no crop\)/g) ?? []).length, 3);
  assert(html.includes('value="bare" selected'));
  assert(renderWelcome().includes('data-run-demo'));
  assert(!renderWelcome().includes(' disabled'));
});
