import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MODEL, validateCrops, generateRotations } from '../engine.mjs';
import { FIELD_CHOICES, SEASONS } from '../field.mjs';
import { DEMO_FARM } from '../data.mjs';

const crops = JSON.parse(await readFile(new URL('../data/crops.json', import.meta.url), 'utf8'));
const crop = overrides => ({ ...structuredClone(crops.find(row => row.id === 'chickpea')), ...overrides });
const field = overrides => ({ ...structuredClone(DEMO_FARM), ...overrides });
const sequence = rotation => SEASONS.map(season => rotation.seasons[season]?.crop.id ?? null);

test('model configuration can be imported and serialized without browser globals', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(MODEL)), MODEL);
  assert(Object.values(MODEL).every(Number.isFinite));
  assert(Object.isFrozen(MODEL));
});

test('starter crop table matches field IDs and passes schema validation without scientific verification', () => {
  const result = validateCrops(crops);
  assert.deepEqual(result.errors, []);
  assert.equal(result.crops.length, 12);
  assert.deepEqual(new Set(result.crops.map(row => row.id)), new Set(FIELD_CHOICES.crop.map(([id]) => id)));
  assert(result.crops.every(row => row.verified === false));
  assert.equal(result.crops.find(row => row.id === 'fodder').name, 'Fodder sorghum');
});

test('crop validation rejects missing keys, malformed lists, duplicates and invalid numeric types/ranges', () => {
  for (const key of Object.keys(crops[0])) {
    const broken = structuredClone(crops[0]);
    delete broken[key];
    const result = validateCrops([broken]);
    assert.equal(result.crops.length, 0, `Missing ${key} was accepted`);
    assert(result.errors[0].messages.length);
  }
  for (const patch of [
    { start_months: [0] }, { start_months: [13] }, { start_months: [6,6] }, { start_months: ['6'] },
    { seasons: ['winter'] }, { soils: ['unknown'] }, { roles: ['magic'] }, { roles: null },
    { duration_months: 0 }, { duration_months: 1.5 }, { duration_months: 13 },
    { water_need_mm: 0 }, { water_need_mm: '300' }, { water_need_mm: Infinity },
    { forage: -1 }, { market: 11 }, { n_fixation: NaN }, { erosion_cover: null },
    { cold_threshold_c: 40, heat_threshold_c: 35 }, { heat_threshold_c: '35' },
    { equipment: 'tractor' }, { verified: 'false' }, { photo: {} },
    { photo: {url:'javascript:alert(1)',credit:'x',licence:'x'} },
  ]) assert.equal(validateCrops([crop(patch)]).crops.length, 0, JSON.stringify(patch));
  for (const invalid of [null, {}, '', []]) assert(validateCrops(invalid).errors.length);
  const mixed = validateCrops([null, {id:'broken'}, crops[0], crops[0], crops[1]]);
  assert.deepEqual(mixed.crops.map(row => row.id), ['rice','wheat']);
  assert.equal(mixed.errors.length, 3);
  assert(mixed.errors.some(error => error.messages.includes('Duplicate crop id.')));
});

test('Jaipur generator prints count and every alternative is unique, non-overlapping and within 12 months', () => {
  const result = generateRotations(crops, DEMO_FARM);
  console.log(`Jaipur rotation count: ${result.rotations.length} retained (${result.rotations.filter(row => !row.is_current).length} alternatives), ${result.excluded.length} excluded`);
  assert(result.rotations.length > 2);
  assert.equal(result.rotations.filter(row => row.is_current).length, 1);
  const all = [...result.rotations, ...result.excluded];
  assert.equal(new Set(all.map(row => row.id)).size, all.length);
  for (const row of result.rotations.filter(row => !row.is_current)) {
    const windows = SEASONS.map(season => row.seasons[season]).filter(Boolean);
    const occupied = new Set();
    for (const window of windows) {
      assert(window.crop.seasons.includes(SEASONS.find(season => row.seasons[season] === window)));
      assert.equal(window.end_offset - window.start_offset + 1, window.crop.duration_months);
      for (let offset = window.start_offset; offset <= window.end_offset; offset++) {
        assert(!occupied.has(offset % 12), `Overlapping month in ${row.id}`);
        occupied.add(offset % 12);
      }
    }
    assert(windows.at(-1).end_offset < windows[0].start_offset + 12);
    assert(row.seasons.kharif || row.seasons.rabi);
  }
  assert(result.excluded.every(row => row.reasons.length && row.reasons.every(reason => typeof reason === 'string' && reason.length)));
});

test('generator finds the earliest complete calendar rather than rejecting a later valid start', () => {
  const fixture = [crop({id:'first', seasons:['kharif'],start_months:[7,6],duration_months:2}),
    crop({id:'second',seasons:['rabi'],start_months:[7,8],duration_months:2}),
    crop({id:'third',seasons:['zaid'],start_months:[10],duration_months:1})];
  const result = generateRotations(fixture, field({ current_rotation: {kharif:'first',rabi:'second',zaid:'third'} }));
  const current = result.rotations[0];
  assert.equal(current.seasons.kharif.start, 6);
  assert.equal(current.seasons.rabi.start, 8);
  assert.equal(current.seasons.zaid.start, 10);
  assert.deepEqual(current.warnings, []);
  assert.equal(result.rotations.filter(row => sequence(row).join() === 'first,second,third').length, 1);
  assert.deepEqual(generateRotations([...fixture].reverse(), field({ current_rotation: {kharif:'first',rabi:'second',zaid:'third'} })), result);
});

test('December-to-January windows wrap correctly and genuine overlap is excluded with a reason', () => {
  const fixture = [crop({id:'long',seasons:['kharif'],start_months:[11],duration_months:4}),
    crop({id:'late',seasons:['rabi'],start_months:[1],duration_months:2}),
    crop({id:'after',seasons:['zaid'],start_months:[3],duration_months:2})];
  const result = generateRotations(fixture, field({ current_rotation: {kharif:'long',rabi:null,zaid:'after'} }));
  const current = result.rotations[0];
  assert.equal(current.seasons.kharif.end, 2);
  assert.equal(current.seasons.zaid.start, 3);
  assert.deepEqual(current.warnings, []);
  const excluded = result.excluded.find(row => sequence(row).join() === 'long,late,after');
  assert(excluded.reasons.some(reason => /non-overlapping/.test(reason)));
});

test('calendar search backtracks and enforces the complete 12-month horizon', () => {
  const fixture = [crop({id:'first', seasons:['kharif'], start_months:[6,7], duration_months:1}),
    crop({id:'second', seasons:['rabi'], start_months:[9], duration_months:1}),
    crop({id:'third', seasons:['zaid'], start_months:[6], duration_months:1})];
  const farm = field({current_rotation:{kharif:'first',rabi:'second',zaid:'third'}});
  const result = generateRotations(fixture, farm);
  assert.equal(result.rotations[0].seasons.kharif.start, 7, 'June anchor fails, but July permits the following June');
  assert.equal(result.rotations[0].seasons.zaid.end_offset - result.rotations[0].seasons.kharif.start_offset, 11);
  const tooLong = generateRotations(fixture.map(row => row.id === 'third' ? {...row,duration_months:2} : row), farm).rotations[0];
  assert(tooLong.warnings.some(reason => /does not fit within 12 months/.test(reason)));
});

test('soil, rice-on-sand and machinery exclusions are explicit while current rule-breaking crops are retained', () => {
  const farm = field({soil:'sandy',equipment:'basic', current_rotation:{kharif:'rice',rabi:'chickpea',zaid:null}});
  const result = generateRotations(crops, farm);
  const current = result.rotations.find(row => row.is_current);
  assert.deepEqual(sequence(current), ['rice','chickpea',null]);
  assert(current.warnings.some(reason => /Rice on sandy/.test(reason)));
  assert(current.warnings.some(reason => /Not suited to sandy/.test(reason)));
  assert(current.warnings.some(reason => /Needs machinery/.test(reason)));
  assert(!result.excluded.some(row => row.id === current.id));
  assert(result.excluded.some(row => row.reasons.some(reason => /Rice on sandy/.test(reason))));
  assert(result.excluded.some(row => row.reasons.some(reason => /Needs machinery/.test(reason))));
  assert(result.excluded.some(row => row.reasons.some(reason => /Not suited to sandy/.test(reason))));
  assert(!result.rotations.filter(row => !row.is_current).some(row => Object.values(row.seasons).some(window => window?.crop.id === 'rice')));
});

test('current rotations survive overlap, off-season choices, all-Bare and missing/invalid crop rows', () => {
  const overlapping = generateRotations(crops, field({ current_rotation: {kharif:'cotton',rabi:'wheat',zaid:null} })).rotations[0];
  assert(overlapping.is_current);
  assert(overlapping.warnings.some(reason => /overlap/.test(reason)));
  const offSeason = generateRotations(crops, field({ current_rotation: {kharif:'wheat',rabi:null,zaid:null} })).rotations[0];
  assert(offSeason.warnings.some(reason => /outside its listed season/.test(reason)));
  const bare = generateRotations(crops, field({ current_rotation: {kharif:null,rabi:null,zaid:null} })).rotations[0];
  assert.deepEqual(sequence(bare), [null,null,null]);
  assert(bare.warnings.length);
  for (const table of [[], crops.filter(row => row.id !== 'bajra'), crops.map(row => row.id === 'bajra' ? {...row,water_need_mm:null} : row)]) {
    const result = generateRotations(table, DEMO_FARM);
    assert.equal(result.rotations.filter(row => row.is_current).length, 1);
    const current = result.rotations[0];
    assert.deepEqual(sequence(current), ['bajra','wheat',null]);
    assert(current.warnings.some(reason => /missing or invalid/.test(reason)));
    assert.equal(current.seasons.kharif.start, null);
  }
});

test('generator and crop validator never mutate their inputs or leak their mutable rows', () => {
  const input = structuredClone(crops), farm = field();
  const snapshot = JSON.stringify({input,farm});
  const result = generateRotations(input, farm);
  assert.equal(JSON.stringify({input,farm}), snapshot);
  result.rotations[0].seasons.kharif.crop.soils.push('bad');
  assert.equal(JSON.stringify({input,farm}), snapshot);
});

test('model limits use consistent percentage and nonnegative threshold ranges', () => {
  assert(MODEL.effective_rain_factor > 0 && MODEL.effective_rain_factor <= 1);
  assert(MODEL.infeasible_gap >= 0 && MODEL.infeasible_gap <= 1);
  assert(MODEL.cover_possible_fit >= 0 && MODEL.cover_possible_fit <= 100);
  assert(MODEL.heavy_rain_mm > MODEL.dry_day_mm);
  assert(Object.entries(MODEL).filter(([key]) => key.startsWith('vuln_')).every(([, value]) => Number.isInteger(value) && value > 0));
});
