import test from 'node:test';
import assert from 'node:assert/strict';
import { MODEL } from '../engine.mjs';

test('model configuration can be imported and serialized without browser globals', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(MODEL)), MODEL);
  assert(Object.values(MODEL).every(Number.isFinite));
  assert(Object.isFrozen(MODEL));
});

test('model limits use consistent percentage and nonnegative threshold ranges', () => {
  assert(MODEL.effective_rain_factor > 0 && MODEL.effective_rain_factor <= 1);
  assert(MODEL.infeasible_gap >= 0 && MODEL.infeasible_gap <= 1);
  assert(MODEL.cover_possible_fit >= 0 && MODEL.cover_possible_fit <= 100);
  assert(MODEL.heavy_rain_mm > MODEL.dry_day_mm);
  assert(Object.entries(MODEL).filter(([key]) => key.startsWith('vuln_')).every(([, value]) => Number.isInteger(value) && value > 0));
});
