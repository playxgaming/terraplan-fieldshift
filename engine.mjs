import { FIELD_CHOICES, FIELD_LIMITS, SEASONS } from './field.mjs';

/** Illustrative comparison rules, not yield or profit predictions. */
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
  priority_min: 0,
  priority_max: 5,
  priority_default: 3,
  priority_zero_score: 50,
  score_min: 0,
  score_max: 100,
  climate_mean_weight: 0.5,
  climate_min_weight: 0.5,
  climate_weight: 0.5,
  priority_weight: 0.5,
  benefit_water_ratio: 0.85,
  benefit_market_gain: 10,
  flowering_fraction: 0.6,
});

const COMPLETE_DAY_FIELDS = Object.freeze(['rain','t2m','tmax','tmin','gwetroot','gwettop']);
const completeClimateDay = row => Boolean(row && COMPLETE_DAY_FIELDS.every(key => typeof row[key] === 'number' && Number.isFinite(row[key]) && row[key] !== -999));

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
  let days = 0, missing = 0, rain = 0, heat = 0, cold = 0, heavy = 0, wetness = 0, dry = 0, dryMax = 0;
  for (let day = first; day <= last; day = new Date(day.getTime() + 86400000)) {
    const row = byDate.get(day.toISOString().slice(0,10));
    if (!completeClimateDay(row)) { missing++; dry = 0; continue; }
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

export const PRIORITIES = Object.freeze([
  { key: 'water', label: 'Water use', description: 'Give more weight to lower total crop water needs.' },
  { key: 'forage', label: 'Forage', description: 'Give more weight to crops that can provide animal feed.' },
  { key: 'n_fixation', label: 'Nitrogen fixation', description: 'Give more weight to crops with a nitrogen-fixing role.' },
  { key: 'erosion_cover', label: 'Erosion control', description: 'Give more weight to the illustrative soil-cover score.' },
  { key: 'organic_matter', label: 'Organic matter', description: 'Give more weight to the illustrative soil organic-matter score.' },
  { key: 'market', label: 'Market', description: 'Give more weight to the crop-table market score. No local price data are included.' },
].map(Object.freeze));

export const defaultPriorities = () => Object.fromEntries(PRIORITIES.map(({key}) => [key, MODEL.priority_default]));

export function validatePriorities(input) {
  const errors = {}, priorities = {};
  for (const { key } of PRIORITIES) {
    const value = input?.[key];
    if (!Number.isInteger(value) || value < MODEL.priority_min || value > MODEL.priority_max) errors[key] = `Choose a whole number from ${MODEL.priority_min} to ${MODEL.priority_max}.`;
    else priorities[key] = value;
  }
  return Object.keys(errors).length ? { valid: false, errors, priorities: null } : { valid: true, errors, priorities };
}

const clampScore = value => Math.max(MODEL.score_min, Math.min(MODEL.score_max, value));
const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;

/** Missing climate is unknown, never a zero-rain observation or a neutral fitted score. */
export function seasonFit(metrics, crop, irrigation) {
  const unknown = reason => ({ effective_rain: null, usable_water: null, water_fit: null, heat_fit: null, cold_fit: null,
    season_fit: null, water_gap: null, water_gap_ratio: null, feasible: null, reason });
  if (!metrics || !crop || crop.unavailable || !Number.isFinite(crop.water_need_mm) || crop.water_need_mm <= 0
    || !Number.isFinite(irrigation) || irrigation < FIELD_LIMITS.irrigation_mm.min || irrigation > FIELD_LIMITS.irrigation_mm.max) return unknown('Crop water need or irrigation is unavailable or outside its allowed range.');
  if (!Number.isInteger(metrics.days) || metrics.days <= 0 || !Number.isFinite(metrics.rain_mm) || metrics.rain_mm < 0
    || !Number.isInteger(metrics.heat_days) || metrics.heat_days < 0 || metrics.heat_days > metrics.days
    || !Number.isInteger(metrics.cold_days) || metrics.cold_days < 0 || metrics.cold_days > metrics.days) return unknown('No complete daily climate data are available for this crop window.');
  const effective_rain = metrics.rain_mm * MODEL.effective_rain_factor;
  const usable_water = effective_rain + irrigation;
  const water_fit = Math.min(MODEL.score_max, usable_water / crop.water_need_mm * MODEL.score_max);
  const heat_fit = MODEL.score_max * (1 - metrics.heat_days / metrics.days);
  const cold_fit = MODEL.score_max * (1 - metrics.cold_days / metrics.days);
  const water_gap = Math.max(0, crop.water_need_mm - usable_water);
  return { effective_rain, usable_water, water_fit, heat_fit, cold_fit, season_fit: mean([water_fit,heat_fit,cold_fit]),
    water_gap, water_gap_ratio: water_gap / crop.water_need_mm, feasible: water_gap <= MODEL.infeasible_gap * crop.water_need_mm,
    reason: metrics.missing ? 'Water and temperature fits use the available complete days only. Missing days lower confidence; the rain total is partial.' : '' };
}

function confidenceFor(rotation, field, metrics) {
  const reasons = [];
  let low = false, count = 0;
  for (const season of SEASONS) {
    const window = rotation.seasons[season];
    if (!window) continue;
    count++;
    const crop = window.crop, data = metrics[season];
    if (crop.unavailable) { low = true; reasons.push(`${season}: crop values or calendar are unavailable.`); continue; }
    if (crop.verified !== true) { low = true; reasons.push(`${crop.name}: crop values are unverified.`); }
    if (crop.regional_common !== true) { low = true; reasons.push(`${crop.name}: not listed as regionally common.`); }
    if (!crop.seasons.includes(season) || !crop.start_months.includes(window.start)) { low = true; reasons.push(`${crop.name}: outside its listed season or sowing months.`); }
    if (!data || data.days === 0 || data.missing === null || data.missing > 0) {
      low = true; reasons.push(`${season}: ${data?.missing ?? 'an unknown number of'} missing days, or no usable climate window.`);
    }
  }
  if (!count) { low = true; reasons.push('All seasons are Bare; there is no crop climate window to assess.'); }
  if (!low) reasons.push('Every crop window has complete daily data; all crop values are verified and listed as regionally common.');
  reasons.push(field.soil_tested ? 'A soil test report is available.' : 'Soil type only; no soil test report is available.');
  return { level: low ? 'Low' : field.soil_tested ? 'High' : 'Medium', reasons: [...new Set(reasons)] };
}

/** Compute weather-dependent values once; slider changes need only rankRotations(). */
export function prepareScoring(generated, field, climate) {
  const fitCache = new Map();
  const rows = generated.rotations.map(rotation => {
    const season_metrics = {}, season_fits = {};
    for (const season of SEASONS) {
      const window = rotation.seasons[season];
      if (!window) { season_metrics[season] = null; season_fits[season] = null; continue; }
      const key = JSON.stringify([season,window.crop.id,window.start_offset,window.end_offset,window.start,window.end]);
      if (!fitCache.has(key)) {
        const metrics = seasonClimate(climate,window);
        fitCache.set(key, { metrics, fit: seasonFit(metrics,window.crop,field.irrigation_mm[season]) });
      }
      const { metrics,fit } = fitCache.get(key);
      season_metrics[season] = metrics; season_fits[season] = fit;
    }
    const active = SEASONS.filter(season => rotation.seasons[season]);
    const known = active.every(season => !rotation.seasons[season].crop.unavailable);
    const water_need_mm = known ? active.reduce((sum,season) => sum + rotation.seasons[season].crop.water_need_mm,0) : null;
    const fits = active.map(season => season_fits[season].season_fit);
    const climate_fit = fits.length && fits.every(Number.isFinite)
      ? MODEL.climate_mean_weight * mean(fits) + MODEL.climate_min_weight * Math.min(...fits) : null;
    const failed = active.filter(season => season_fits[season].feasible === false);
    const feasible = failed.length ? false : active.length && active.every(season => season_fits[season].feasible === true) ? true : null;
    const feasibility_reasons = failed.map(season => `${season}: water gap ${Number(season_fits[season].water_gap.toFixed(2))} mm exceeds ${MODEL.infeasible_gap * 100}% of ${rotation.seasons[season].crop.water_need_mm} mm crop need.`);
    if (active.some(season => season_fits[season].feasible === null) || !active.length) feasibility_reasons.push('Water feasibility cannot be determined for every crop window.');
    const priority_values = Object.fromEntries(PRIORITIES.filter(({key}) => key !== 'water').map(({key}) => [key,
      known ? SEASONS.reduce((sum,season) => sum + (rotation.seasons[season]?.crop[key] ?? 0),0) / SEASONS.length * MODEL.score_max / CROP_SCHEMA.attribute_max : null]));
    return { ...rotation, season_metrics, season_fits, water_need_mm, climate_fit, priority_values, feasible, feasibility_reasons,
      feasibility_label: feasible === false ? 'Not feasible without extra water' : feasible === true ? 'Passes the water-gap rule' : 'Water feasibility unknown',
      confidence: confidenceFor(rotation,field,season_metrics),
      unscored_reasons: climate_fit === null ? ['A crop window or its climate fit is unavailable; no total score can be calculated.'] : [] };
  });
  const max_rotation_water_need = Math.max(0,...rows.map(row => row.water_need_mm ?? 0));
  const cover_possible = Object.fromEntries(SEASONS.map(season => [season,rows.some(row => (!row.is_current || !row.warnings.length)
    && row.seasons[season] && row.season_fits[season].water_fit !== null && row.season_fits[season].water_fit >= MODEL.cover_possible_fit)]));
  const rotations = rows.map(row => {
    const rule_reasons = [];
    const add = (code,delta,text) => rule_reasons.push({code,delta,text});
    SEASONS.forEach((season,index) => {
      const next = SEASONS[(index + 1) % SEASONS.length];
      const crop = row.seasons[season]?.crop, after = row.seasons[next]?.crop;
      const pair = `${season} → ${index === SEASONS.length - 1 ? 'next ' : ''}${next}`;
      if (crop && after && !crop.unavailable && !after.unavailable) {
        if (crop.family === after.family) add('same-family',-MODEL.penalty_same_family,`${pair}: ${crop.name} then ${after.name}: same family, pest cycle not broken (−${MODEL.penalty_same_family}).`);
        if (crop.heavy_feeder && after.roles.includes('nitrogen-fixer')) add('nitrogen-after-heavy',MODEL.bonus_nfixer_after_heavy,`${pair}: ${after.name} adds nitrogen after ${crop.name}, a crop with high nutrient demand (+${MODEL.bonus_nfixer_after_heavy}).`);
      }
      if (!row.seasons[season] && cover_possible[season]) add('bare-when-possible',-MODEL.penalty_bare_when_possible,`${season} is Bare while some allowed crop window reaches water fit ${MODEL.cover_possible_fit} or more (−${MODEL.penalty_bare_when_possible}).`);
    });
    return { ...row, priority_values: { ...row.priority_values, water: row.water_need_mm !== null && max_rotation_water_need > 0 ? clampScore(MODEL.score_max - row.water_need_mm / max_rotation_water_need * MODEL.score_max) : null },
      rule_adjust: rule_reasons.reduce((sum,reason) => sum + reason.delta,0), rule_reasons };
  });
  return { rotations, excluded: generated.excluded, max_rotation_water_need, cover_possible };
}

export function rankRotations(prepared, weights = defaultPriorities()) {
  const validation = validatePriorities(weights);
  if (!validation.valid) throw new RangeError('Priority weights must all be whole numbers from 0 to 5.');
  const weight_sum = Object.values(validation.priorities).reduce((sum,weight) => sum + weight,0);
  const scored = prepared.rotations.map(rotation => {
    const weighted = PRIORITIES.filter(({key}) => weights[key] > 0);
    const priority_score = weight_sum === 0 ? MODEL.priority_zero_score : weighted.every(({key}) => Number.isFinite(rotation.priority_values[key]))
      ? weighted.reduce((sum,{key}) => sum + weights[key] * rotation.priority_values[key],0) / weight_sum : null;
    const total = rotation.climate_fit !== null && priority_score !== null ? clampScore(MODEL.climate_weight * rotation.climate_fit + MODEL.priority_weight * priority_score + rotation.rule_adjust) : null;
    return { ...rotation, priority_score, total };
  });
  const ranked = scored.filter(rotation => !rotation.is_current).sort((a,b) => (b.total ?? -1) - (a.total ?? -1) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const eligible = ranked.filter(rotation => rotation.total !== null);
  const passing = eligible.filter(rotation => rotation.feasible === true), failing = eligible.filter(rotation => rotation.feasible === false);
  const options = [...passing,...failing].slice(0,2);
  return { current: scored.find(rotation => rotation.is_current) ?? null, ranked, options, weights: validation.priorities,
    excluded: prepared.excluded, max_rotation_water_need: prepared.max_rotation_water_need,
    selection_note: options.length < 2 ? 'Fewer than two scored alternatives are available; missing scores are not invented.' : passing.length < 2 ? 'Fewer than two alternatives pass the water-gap rule. The remaining place is filled by the highest-scoring infeasible alternative, with its warning kept.' : 'The two highest-scoring alternatives that pass the water-gap rule are selected for comparison.' };
}

export const scoreRotations = (generated,field,climate,weights = defaultPriorities()) => rankRotations(prepareScoring(generated,field,climate),weights);

/** Coverage count for benefit rules only; the month-by-month timeline is step 7. */
export function bareMonthCount(rotation) {
  const windows = SEASONS.map(season => rotation.seasons[season]).filter(Boolean);
  if (windows.some(window => !Number.isInteger(window.start_offset) || !Number.isInteger(window.end_offset)
    || window.start_offset < 0 || window.end_offset < window.start_offset || window.end_offset - window.start_offset >= 12)) return null;
  if (windows.length && Math.max(...windows.map(window => window.end_offset)) - Math.min(...windows.map(window => window.start_offset)) >= 12) return null;
  const covered = new Set();
  for (const window of windows) for (let month = window.start_offset; month <= window.end_offset; month++) covered.add(month % 12);
  return 12 - covered.size;
}

export function benefitBadges(rotation, current) {
  if (!rotation || !current) return [];
  const badges = [], crops = SEASONS.map(season => rotation.seasons[season]?.crop).filter(Boolean);
  const baseline = SEASONS.map(season => current.seasons[season]?.crop).filter(Boolean);
  const allKnown = [...crops,...baseline].every(crop => !crop.unavailable && typeof crop.family === 'string');
  const add = (key,label,explanation) => badges.push({key,label,explanation});
  if (Number.isFinite(rotation.water_need_mm) && Number.isFinite(current.water_need_mm) && current.water_need_mm > 0
    && rotation.water_need_mm <= MODEL.benefit_water_ratio * current.water_need_mm) add('water','💧 Less water',`Illustrative crop water need is ${rotation.water_need_mm} mm, at most ${MODEL.benefit_water_ratio * 100}% of the current ${current.water_need_mm} mm. This is not measured water saving.`);
  if (crops.some(crop => crop.roles?.includes('nitrogen-fixer'))) add('nitrogen','🌱 Adds nitrogen','Contains a crop tagged nitrogen-fixer. This is a crop-table role, not a measured increase in soil nitrogen.');
  const sameFamily = SEASONS.some((season,index) => {
    const a = rotation.seasons[season]?.crop, b = rotation.seasons[SEASONS[(index + 1) % SEASONS.length]]?.crop;
    return a && b && a.family === b.family;
  });
  if (allKnown && !sameFamily && crops.some(crop => !baseline.some(other => other.family === crop.family))) add('pest','🐛 Breaks pest cycle','No adjacent crop pair shares a family, including zaid → next kharif, and at least one family is new compared with current. This illustrative rule does not establish local pest control.');
  const bare = bareMonthCount(rotation), baselineBare = bareMonthCount(current);
  if (allKnown && bare !== null && baselineBare !== null && bare < baselineBare && crops.some(crop => crop.roles?.some(role => ['deep-rooted','cover'].includes(role)))) add('infiltration','🌧 Better infiltration',`Has a deep-rooted or cover crop and ${bare} assumed bare months versus ${baselineBare} for current. Infiltration itself has not been measured.`);
  const market = rotation.priority_values?.market, currentMarket = current.priority_values?.market;
  if (Number.isFinite(market) && Number.isFinite(currentMarket) && market >= currentMarket + MODEL.benefit_market_gain) add('market','₹ Market',`The illustrative market priority is at least ${MODEL.benefit_market_gain} points above current. No local price or profit data are included.`);
  return badges;
}

export function rotationAdvice(rotation, field, climate) {
  const gaps = [], checks = [];
  const unverified = [], unknown = [];
  for (const season of SEASONS) {
    const window = rotation.seasons[season];
    if (!window) continue;
    const crop = window.crop, metrics = rotation.season_metrics?.[season], fit = rotation.season_fits?.[season];
    if (crop.unavailable) unknown.push(crop.name);
    else if (!crop.verified) unverified.push(crop.name);
    if (metrics?.missing > 0) gaps.push(`${season}: ${metrics.missing} daily records are missing; rain is a partial total.`);
    else if (!metrics || metrics.missing === null || metrics.days === 0) gaps.push(`${season}: a complete climate window is unavailable.`);
    const month = Number.isInteger(window.start) ? new Date(Date.UTC(2000,window.start - 1,1)).toLocaleString('en',{month:'long',timeZone:'UTC'}) : 'your intended';
    checks.push(`Ask your KVK if ${crop.name} varieties suit ${month} sowing here.`);
    if (fit?.water_gap > 0) checks.push(`For ${season}, confirm whether an additional ${Number(fit.water_gap.toFixed(2))} mm beyond entered irrigation can be supplied. This gap uses illustrative crop need and area weather.`);
    if (crop.unavailable) checks.push(`Confirm ${crop.name} crop values and actual sowing/harvest dates before relying on a score.`);
  }
  if (unverified.length) gaps.push(`Unverified crop values: ${[...new Set(unverified)].join(', ')}.`);
  if (unknown.length) gaps.push(`Crop data are missing or invalid: ${[...new Set(unknown)].join(', ')}.`);
  if (!field.soil_tested) { gaps.push('Soil type was entered without a soil test report.'); checks.push('Get a soil test for nitrogen and organic carbon.'); }
  else checks.push('Review your soil test and these crop assumptions with your KVK or agricultural officer.');
  gaps.push(climate?.grid_note ?? 'POWER covers a coarse area grid; rain may differ at your field.');
  gaps.push('No local price data are included.');
  gaps.push('Sowing and harvest windows are crop-table assumptions, not dates reported from your field.');
  checks.push('Check local prices, varieties, seed availability and your water supply before changing the farm plan.');
  return { gaps: [...new Set(gaps)], checks: [...new Set(checks)] };
}

function timelineWindows(rotation) {
  let previous = null;
  return SEASONS.flatMap(season => {
    const window = rotation?.seasons?.[season];
    if (!window) return [];
    let start = window.start_offset, end = window.end_offset;
    if (!Number.isInteger(start) || !Number.isInteger(end)) {
      if (Number.isInteger(window.start) && window.start >= 1 && window.start <= 12 && Number.isInteger(window.end) && window.end >= 1 && window.end <= 12) {
        start = monthOffset(window.start);
        if (previous !== null) while (start < previous) start += 12;
        end = start + (window.end - window.start + 12) % 12;
      } else { start = null; end = null; }
    }
    const known = !window.crop.unavailable && Number.isInteger(start) && Number.isInteger(end) && start >= 0 && end >= start
      && end - start < CROP_SCHEMA.month_max && end < CROP_SCHEMA.month_max * SEASONS.length;
    if (known) previous = start;
    return [{season,crop:window.crop,start,end,known}];
  });
}

export function timelineWarnings(rotation) {
  return timelineWindows(rotation).flatMap(window => !window.known
    ? [`${window.season}: the calendar for ${window.crop.name} is unknown. Unoccupied months cannot be assumed Bare.`]
    : window.end >= 12 ? [`${window.crop.name} extends outside this June–May display. Later months are not wrapped into the start of the year.`] : []);
}

/** Pure June→May cells. Risk markers describe complete historical daily records, not forecasts. */
export function buildTimeline(rotation, climate) {
  const windows = timelineWindows(rotation);
  const weather = Number.isInteger(climate?.ag_year) && Array.isArray(climate.daily);
  const daily = new Map((weather ? climate.daily : []).map(row => [row.date,row]));
  const perWindow = windows.filter(window => window.known).map(window => {
    const monthly = new Map();
    for (let offset = window.start; offset <= window.end; offset++) monthly.set(offset, { days:0,missing:weather ? 0 : null,
      heat_days:weather && Number.isFinite(window.crop.heat_threshold_c) ? 0 : null,
      cold_days:weather && Number.isFinite(window.crop.cold_threshold_c) ? 0 : null,
      heavy_rain:weather ? 0 : null, dry_spells:[], flags:[] });
    const flowering = Number.isInteger(window.crop.duration_months) ? window.start + Math.floor(window.crop.duration_months * MODEL.flowering_fraction) : null;
    if (weather) {
      const first = new Date(Date.UTC(climate.ag_year,5 + window.start,1));
      const last = new Date(Date.UTC(climate.ag_year,5 + window.end + 1,0));
      let dry = [];
      const finishDry = () => {
        if (dry.length >= MODEL.vuln_dry_spell) {
          const spell = {start_date:dry[0],end_date:dry.at(-1),days:dry.length};
          // A qualifying run can cross a month boundary; mark every month it touches.
          for (const [offset,metrics] of monthly) {
            const start = new Date(Date.UTC(climate.ag_year,5 + offset,1)).toISOString().slice(0,10);
            const end = new Date(Date.UTC(climate.ag_year,5 + offset + 1,0)).toISOString().slice(0,10);
            if (spell.start_date <= end && spell.end_date >= start) metrics.dry_spells.push(spell);
          }
        }
        dry = [];
      };
      for (let day = first; day <= last; day = new Date(day.getTime() + 86400000)) {
        const date = day.toISOString().slice(0,10), row = daily.get(date);
        const offset = (day.getUTCFullYear() - climate.ag_year) * 12 + day.getUTCMonth() - 5;
        const metrics = monthly.get(offset);
        if (!completeClimateDay(row)) { metrics.missing++; finishDry(); continue; }
        metrics.days++;
        if (metrics.heat_days !== null && row.tmax > window.crop.heat_threshold_c) metrics.heat_days++;
        if (metrics.cold_days !== null && row.tmin < window.crop.cold_threshold_c) metrics.cold_days++;
        if (row.rain >= MODEL.heavy_rain_mm) metrics.heavy_rain++;
        if (row.rain < MODEL.dry_day_mm) dry.push(date);
        else finishDry();
      }
      finishDry();
    }
    for (const [offset,metrics] of monthly) {
      if (metrics.heat_days !== null && metrics.heat_days >= MODEL.vuln_heat_days) {
        metrics.flags.push('heat');
        if (offset === flowering) metrics.flags.push('heat at flowering');
      }
      if (metrics.cold_days !== null && metrics.cold_days >= MODEL.vuln_cold_days) metrics.flags.push('cold');
      if (metrics.dry_spells.length) metrics.flags.push('dry');
      if (metrics.heavy_rain !== null && metrics.heavy_rain >= MODEL.vuln_heavy_days) metrics.flags.push('flood');
      if (!metrics.days) { metrics.heat_days = null; metrics.cold_days = null; metrics.heavy_rain = null; }
    }
    return {...window,monthly,flowering};
  });
  const uncertain = windows.some(window => !window.known);
  return Array.from({length:12},(_,offset) => {
    const active = perWindow.filter(window => offset >= window.start && offset <= window.end);
    const assessments = active.map(window => ({season:window.season,crop:window.crop,...window.monthly.get(offset),assumed_flowering:offset === window.flowering}));
    const date = weather ? new Date(Date.UTC(climate.ag_year,5 + offset,1)) : null;
    return {month:calendarMonth(offset),year:date?.getUTCFullYear() ?? null,crop:active[0]?.crop ?? null,crops:active.map(window => window.crop),
      bare:active.length === 0 && !uncertain,unknown_calendar:uncertain,overlap:active.length > 1,
      flags:[...new Set(assessments.flatMap(assessment => assessment.flags))],assessments,
      days:assessments.length ? Math.max(...assessments.map(assessment => assessment.days)) : 0,
      missing:weather && assessments.length ? Math.max(...assessments.map(assessment => assessment.missing)) : null,
      data_status:!active.length ? uncertain ? 'unknown-calendar' : 'bare' : !weather ? 'not-loaded' : assessments.some(assessment => assessment.missing > 0) ? 'partial' : 'complete' };
  });
}
