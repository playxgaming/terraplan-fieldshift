// Stable field choices; agronomic assumptions live in data/crops.json.
export const SEASONS = Object.freeze(['kharif', 'rabi', 'zaid']);
export const FIELD_CHOICES = Object.freeze(Object.fromEntries(Object.entries({
  soil: [['black', 'Black'], ['loam', 'Loam'], ['sandy', 'Sandy'], ['clay', 'Clay'], ['red', 'Red']],
  water_source: [['rainfed', 'Rainfed'], ['well', 'Well'], ['canal', 'Canal'], ['borewell', 'Borewell']],
  equipment: [['basic', 'Basic tools'], ['machine', 'Machinery available']],
  market_access: [['local', 'Local market'], ['mandi', 'Mandi (wholesale farm market)'], ['contract', 'Contract buyer']],
  crop: [['rice', 'Rice'], ['wheat', 'Wheat'], ['sorghum', 'Rabi jowar (sorghum)'], ['bajra', 'Bajra (pearl millet)'], ['maize', 'Maize'], ['soybean', 'Soybean'], ['groundnut', 'Groundnut'], ['chickpea', 'Chickpea (chana)'], ['tur', 'Tur (pigeon pea)'], ['moong', 'Moong (mung bean)'], ['cotton', 'Cotton'], ['fodder', 'Fodder sorghum'], ['mustard', 'Indian mustard (sarson)'], ['barley', 'Barley (jau)'], ['clusterbean', 'Cluster bean (guar)']],
}).map(([key, rows]) => [key, Object.freeze(rows.map(row => Object.freeze(row)))])));

export const FIELD_LIMITS = Object.freeze({
  lat: Object.freeze({ min: -90, max: 90 }),
  lon: Object.freeze({ min: -180, max: 180 }),
  area_ha: Object.freeze({ min: 0, max: 100, exclusiveMin: true }),
  irrigation_mm: Object.freeze({ min: 0, max: 1500 }),
  name_length: 100,
});
export const FIELD_STORAGE_KEY = 'terraplan.v3.field';
export const FIELD_STORAGE_VERSION = 1;

export function emptyField() {
  return { name: '', lat: '', lon: '', soil: '', soil_tested: false, area_ha: '', water_source: '',
    irrigation_mm: { kharif: '', rabi: '', zaid: '' }, equipment: '', market_access: '',
    current_rotation: { kharif: '', rabi: '', zaid: '' } };
}

/** Normalize form numbers without converting missing values, booleans or objects into zero. */
export function validateField(input) {
  const errors = {};
  const raw = input && typeof input === 'object' ? input : {};
  const number = (value, key, limits, label) => {
    const numeric = typeof value === 'number' || (typeof value === 'string' && /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim()));
    const parsed = numeric ? Number(value) : NaN;
    if (!Number.isFinite(parsed) || parsed > limits.max || (limits.exclusiveMin ? parsed <= limits.min : parsed < limits.min)) {
      errors[key] = `${label}: enter a number ${limits.exclusiveMin ? 'greater than' : 'from'} ${limits.min} ${limits.exclusiveMin ? 'and up to' : 'to'} ${limits.max}.`;
    }
    return parsed;
  };
  const choice = (value, key) => {
    if (!FIELD_CHOICES[key].some(([id]) => id === value)) errors[key] = 'Choose one of the listed options.';
    return value;
  };
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (!name || name.length > FIELD_LIMITS.name_length) errors.name = `Enter a field name of 1–${FIELD_LIMITS.name_length} characters.`;
  if (typeof raw.soil_tested !== 'boolean') errors.soil_tested = 'Choose whether you have a soil test report.';
  const field = {
    name,
    lat: number(raw.lat, 'lat', FIELD_LIMITS.lat, 'Latitude'),
    lon: number(raw.lon, 'lon', FIELD_LIMITS.lon, 'Longitude'),
    soil: choice(raw.soil, 'soil'), soil_tested: raw.soil_tested,
    area_ha: number(raw.area_ha, 'area_ha', FIELD_LIMITS.area_ha, 'Field area'),
    water_source: choice(raw.water_source, 'water_source'),
    irrigation_mm: {}, equipment: choice(raw.equipment, 'equipment'),
    market_access: choice(raw.market_access, 'market_access'), current_rotation: {},
  };
  for (const season of SEASONS) {
    field.irrigation_mm[season] = number(raw.irrigation_mm?.[season], `irrigation_${season}`, FIELD_LIMITS.irrigation_mm, 'Extra irrigation');
    const crop = raw.current_rotation?.[season];
    if (crop !== null && !FIELD_CHOICES.crop.some(([id]) => id === crop)) errors[`rotation_${season}`] = 'Choose a crop or Bare (no crop).';
    field.current_rotation[season] = crop;
  }
  return Object.keys(errors).length ? { valid: false, errors, field: null } : { valid: true, errors, field };
}

/** Storage is injected so failures and preservation can be tested without browser globals. */
export function loadField(storage, previous = null) {
  try {
    const saved = storage.getItem(FIELD_STORAGE_KEY);
    if (saved === null) return { field: previous, error: '' };
    const record = JSON.parse(saved);
    if (record?.version !== FIELD_STORAGE_VERSION) throw new Error('Unsupported field version');
    const result = validateField(record.field);
    if (!result.valid) throw new Error('Invalid saved field');
    return { field: result.field, error: '' };
  } catch {
    return { field: previous, error: 'Could not read your saved field. The stored copy has been kept. Saving a valid field will replace it.' };
  }
}

export function saveField(storage, input) {
  const result = validateField(input);
  if (!result.valid) return { ...result, error: 'Check the highlighted fields. Your saved field has not changed.' };
  try {
    storage.setItem(FIELD_STORAGE_KEY, JSON.stringify({ version: FIELD_STORAGE_VERSION, field: result.field }));
    return { ...result, error: '' };
  } catch {
    return { ...result, error: 'Your browser could not save this field. Your entries are still here. Allow site storage or free some space, then try Save field again.' };
  }
}
