import { FIELD_CHOICES, SEASONS } from './field.mjs';

/** Scoring is deliberately deferred to step 5. */
export const MODEL = Object.freeze({
  effective_rain_factor: 0.65,
  dry_day_mm: 2.5,
  heavy_rain_mm: 64.5,
  infeasible_gap: 0.40,
  cover_possible_fit: 60,
  penalty_same_family: 8,
  bonus_nfixer_after_heavy: 6,
  penalty_bare_when_possible: 6,
  vuln_heat_days: 3,
  vuln_cold_days: 2,
  vuln_dry_spell: 10,
  vuln_heavy_days: 1,
});

export const CROP_SCHEMA = Object.freeze({
  month_min: 1, month_max: 12, attribute_min: 0, attribute_max: 10,
  temperature_min: -100, temperature_max: 100,
  roles: Object.freeze(['nitrogen-fixer', 'cover', 'deep-rooted', 'drought-tolerant', 'forage']),
});

/** Reject entire bad rows; retain diagnostics with source row numbers for Evidence. */
export function validateCrops(input) {
  const crops = [], errors = [], seen = new Set();
  if (!Array.isArray(input)) return { crops, errors: [{ row: null, id: null, messages: ['Crop data must be a JSON array.'] }] };
  if (!input.length) return { crops, errors: [{ row: null, id: null, messages: ['The crop table is empty.'] }] };
  input.forEach((row, index) => {
    const messages = [];
    const object = row !== null && typeof row === 'object' && !Array.isArray(row);
    if (!object) { errors.push({ row: index + 1, id: null, messages: ['Crop row must be an object.'] }); return; }
    const text = key => {
      if (typeof row[key] !== 'string' || !row[key].trim()) messages.push(`${key} must be nonempty text.`);
    };
    for (const key of ['id', 'name', 'family', 'how_it_helps_soil', 'source_note']) text(key);
    if (typeof row.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(row.id)) messages.push('id must use lowercase letters, numbers or hyphens, starting with a letter.');
    if (seen.has(row.id)) messages.push('Duplicate crop id.');
    const list = (key, allowed, nonempty = true) => {
      if (!Array.isArray(row[key]) || (nonempty && !row[key].length)
        || new Set(row[key]).size !== row[key].length || row[key].some(value => !allowed(value))) messages.push(`${key} contains missing, repeated or unsupported values.`);
    };
    list('seasons', value => SEASONS.includes(value));
    list('start_months', value => Number.isInteger(value) && value >= CROP_SCHEMA.month_min && value <= CROP_SCHEMA.month_max);
    list('soils', value => FIELD_CHOICES.soil.some(([id]) => id === value));
    list('roles', value => CROP_SCHEMA.roles.includes(value), false);
    if (!Number.isInteger(row.duration_months) || row.duration_months < CROP_SCHEMA.month_min || row.duration_months > CROP_SCHEMA.month_max) messages.push('duration_months must be an integer from 1 to 12.');
    if (typeof row.water_need_mm !== 'number' || !Number.isFinite(row.water_need_mm) || row.water_need_mm <= 0) messages.push('water_need_mm must be a finite number greater than zero.');
    for (const key of ['heat_threshold_c', 'cold_threshold_c']) {
      if (typeof row[key] !== 'number' || !Number.isFinite(row[key]) || row[key] < CROP_SCHEMA.temperature_min || row[key] > CROP_SCHEMA.temperature_max) messages.push(`${key} must be a finite number from -100 to 100.`);
    }
    if (row.cold_threshold_c > row.heat_threshold_c) messages.push('cold_threshold_c must not exceed heat_threshold_c.');
    for (const key of ['forage', 'n_fixation', 'erosion_cover', 'organic_matter', 'market']) {
      if (typeof row[key] !== 'number' || !Number.isFinite(row[key]) || row[key] < CROP_SCHEMA.attribute_min || row[key] > CROP_SCHEMA.attribute_max) messages.push(`${key} must be a finite number from 0 to 10.`);
    }
    for (const key of ['heavy_feeder', 'regional_common', 'verified']) if (typeof row[key] !== 'boolean') messages.push(`${key} must be true or false.`);
    if (!FIELD_CHOICES.equipment.some(([id]) => id === row.equipment)) messages.push('equipment must be basic or machine.');
    if (!row.photo || typeof row.photo !== 'object' || ['url', 'credit', 'licence'].some(key => typeof row.photo[key] !== 'string')) messages.push('photo must contain url, credit and licence strings.');
    else if (row.photo.url && (!/^https:\/\//i.test(row.photo.url) || !row.photo.credit.trim() || !row.photo.licence.trim())) messages.push('A photo needs an HTTPS URL, credit and licence.');
    if (messages.length) errors.push({ row: index + 1, id: typeof row.id === 'string' ? row.id : null, messages });
    else { seen.add(row.id); crops.push(structuredClone(row)); }
  });
  return { crops, errors };
}

// Offset 0 is June, 6 is December, 7 is the following January. Endpoints are inclusive.
const monthOffset = month => (month - 6 + 12) % 12;
const calendarMonth = offset => (offset + 5) % 12 + 1;
const rotationId = sequence => `rotation:${JSON.stringify(sequence.map(crop => crop?.id ?? null))}`;

function windowFor(crop, offset) {
  const end = offset + crop.duration_months - 1;
  return { crop, start: calendarMonth(offset), end: calendarMonth(end), start_offset: offset, end_offset: end };
}

/** Lexicographic search in June→May order gives the earliest complete valid calendar. */
function earliestWindows(sequence, index = 0, windows = {}, first = null, previous = null) {
  if (index === SEASONS.length) return windows;
  const season = SEASONS[index], crop = sequence[index];
  if (!crop) return earliestWindows(sequence, index + 1, { ...windows, [season]: null }, first, previous);
  if (crop.unavailable) return null;
  for (const month of [...crop.start_months].sort((a, b) => monthOffset(a) - monthOffset(b))) {
    let offset = monthOffset(month);
    if (previous) while (offset < previous.start_offset) offset += 12;
    const window = windowFor(crop, offset);
    const anchor = first ?? offset;
    if ((previous && offset <= previous.end_offset) || window.end_offset >= anchor + 12) continue;
    const found = earliestWindows(sequence, index + 1, { ...windows, [season]: window }, anchor, window);
    if (found) return found;
  }
  return null;
}

/** A current plan must remain representable even when no valid calendar exists. */
function fallbackWindows(sequence) {
  let previous = null;
  return Object.fromEntries(SEASONS.map((season, index) => {
    const crop = sequence[index];
    if (!crop) return [season, null];
    if (crop.unavailable) return [season, { crop, start: null, end: null, start_offset: null, end_offset: null }];
    let offset = Math.min(...crop.start_months.map(monthOffset));
    if (previous !== null) while (offset < previous) offset += 12;
    previous = offset;
    return [season, windowFor(crop, offset)];
  }));
}

function fieldReasons(sequence, field) {
  const reasons = [];
  sequence.forEach(crop => {
    if (!crop || crop.unavailable) return;
    if (!crop.soils.includes(field.soil)) reasons.push(`${crop.name}: Not suited to ${field.soil} soil`);
    if (crop.id === 'rice' && field.soil === 'sandy') reasons.push('Rice on sandy soil loses too much water');
    if (crop.equipment === 'machine' && field.equipment === 'basic') reasons.push(`${crop.name}: Needs machinery you don't have`);
  });
  return [...new Set(reasons)];
}

function currentRotation(sequence, field) {
  const warnings = fieldReasons(sequence, field);
  sequence.forEach((crop, index) => {
    if (crop?.unavailable) warnings.push(`${SEASONS[index]}: crop data for ${crop.id} are missing or invalid; its calendar cannot be calculated.`);
    else if (crop && !crop.seasons.includes(SEASONS[index])) warnings.push(`${crop.name} is outside its listed season in ${SEASONS[index]}.`);
  });
  if (!sequence[0] && !sequence[1]) warnings.push('Kharif may be Bare only when Rabi has a crop. Your current rotation is retained.');
  const validWindows = earliestWindows(sequence);
  const seasons = validWindows ?? fallbackWindows(sequence);
  if (!validWindows && !sequence.some(crop => crop?.unavailable)) {
    const active = Object.values(seasons).filter(Boolean);
    if (active.some((window, index) => index > 0 && window.start_offset <= active[index - 1].end_offset)) warnings.push('Current crop windows overlap using the earliest listed start months. Confirm your actual sowing and harvest dates locally.');
    if (active.length && active.at(-1).end_offset >= active[0].start_offset + 12) warnings.push('The current crop sequence does not fit within 12 months from its first sowing.');
  }
  return { id: rotationId(sequence), seasons, is_current: true, warnings };
}

/** Pure calendar/soil/equipment filtering only. No weather, scores or feasibility claims. */
export function generateRotations(input, field) {
  const { crops } = validateCrops(input);
  const byId = new Map(crops.map(crop => [crop.id, crop]));
  const sequence = SEASONS.map(season => {
    const id = field.current_rotation?.[season];
    return id == null ? null : byId.get(id) ?? { id, name: id, unavailable: true };
  });
  const current = currentRotation(sequence, field);
  const rotations = [current], excluded = [];
  const candidates = SEASONS.map(season => [null, ...crops.filter(crop => crop.seasons.includes(season)).sort((a, b) => a.id.localeCompare(b.id))]);
  for (const kharif of candidates[0]) for (const rabi of candidates[1]) for (const zaid of candidates[2]) {
    const option = [kharif, rabi, zaid], id = rotationId(option);
    if (id === current.id) continue;
    const reasons = fieldReasons(option, field);
    if (!kharif && !rabi) reasons.push('Kharif may be Bare only when Rabi has a crop.');
    const windows = earliestWindows(option);
    if (!windows) reasons.push('No listed start months give non-overlapping crop windows within 12 months of the first sowing.');
    const rotation = { id, seasons: windows ?? fallbackWindows(option), is_current: false, warnings: [] };
    if (reasons.length) excluded.push({ ...rotation, reasons });
    else rotations.push(rotation);
  }
  return { rotations, excluded };
}

/** Conservative complete-day metrics: a missing input breaks a dry spell and is counted. */
export function seasonClimate(climate, window, crop = window?.crop) {
  if (!window) return null;
  const unavailable = reason => ({ rain_mm: null, heat_days: null, cold_days: null, dry_spell_max: null, heavy_rain: null,
    soil_wet_mean: null, days: 0, missing: null, start_date: null, end_date: null, reason });
  if (!Number.isInteger(climate?.ag_year) || !Array.isArray(climate.daily) || !crop || crop.unavailable
    || !Number.isFinite(crop.heat_threshold_c) || !Number.isFinite(crop.cold_threshold_c)) return unavailable('Crop or climate inputs are unavailable.');
  let start = window.start_offset, end = window.end_offset;
  if (!Number.isInteger(start) || !Number.isInteger(end)) {
    if (!Number.isInteger(window.start) || window.start < 1 || window.start > 12 || !Number.isInteger(window.end) || window.end < 1 || window.end > 12) return unavailable('The current crop has no known calendar window.');
    start = monthOffset(window.start);
    end = start + ((window.end - window.start + 12) % 12);
  }
  if (start < 0 || end < start || end - start >= 12 || end > 35) return unavailable('The crop calendar window is invalid.');
  const first = new Date(Date.UTC(climate.ag_year, 5 + start, 1));
  const last = new Date(Date.UTC(climate.ag_year, 5 + end + 1, 0));
  const byDate = new Map(climate.daily.map(row => [row.date, row]));
  const required = ['rain', 't2m', 'tmax', 'tmin', 'gwetroot', 'gwettop'];
  let days = 0, missing = 0, rain = 0, heat = 0, cold = 0, heavy = 0, wetness = 0, dry = 0, dryMax = 0;
  for (let day = first; day <= last; day = new Date(day.getTime() + 86400000)) {
    const row = byDate.get(day.toISOString().slice(0,10));
    if (!row || !required.every(key => typeof row[key] === 'number' && Number.isFinite(row[key]) && row[key] !== -999)) { missing++; dry = 0; continue; }
    days++; rain += row.rain; wetness += row.gwetroot;
    if (row.tmax > crop.heat_threshold_c) heat++;
    if (row.tmin < crop.cold_threshold_c) cold++;
    if (row.rain >= MODEL.heavy_rain_mm) heavy++;
    dry = row.rain < MODEL.dry_day_mm ? dry + 1 : 0;
    dryMax = Math.max(dryMax, dry);
  }
  return { rain_mm: days ? rain : null, heat_days: days ? heat : null, cold_days: days ? cold : null,
    dry_spell_max: days ? dryMax : null, heavy_rain: days ? heavy : null, soil_wet_mean: days ? wetness / days : null,
    days, missing, start_date: first.toISOString().slice(0,10), end_date: last.toISOString().slice(0,10),
    reason: missing ? 'Days with any missing required value are left out of every metric; missing days break dry spells. Rain is a partial sum when days are missing.' : '' };
}
