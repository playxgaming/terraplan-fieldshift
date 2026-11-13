import { validateCrops } from './engine.mjs';

/** The single editable demo-field definition. No V2 data is used. */
export const DEMO_FARM = Object.freeze({
  name: 'Demo farm, Rajkot',
  lat: 22.30,
  lon: 70.80,
  soil: 'black',
  soil_tested: false,
  area_ha: 2,
  water_source: 'rainfed',
  irrigation_mm: Object.freeze({ kharif: 0, rabi: 150, zaid: 0 }),
  equipment: 'basic',
  market_access: 'local',
  current_rotation: Object.freeze({ kharif: 'groundnut', rabi: 'wheat', zaid: null }),
});

export const DATA_STATUS = Object.freeze({
  daily: 'not-loaded',
  monthly: 'not-loaded',
  satellite: 'not-loaded',
});

/** Only the bundled crop JSON is loaded here; no remote weather request is made. */
export async function loadCrops(fetcher = globalThis.fetch) {
  try {
    const response = await fetcher(new URL('./data/crops.json', import.meta.url));
    if (!response.ok) throw new Error('Crop file unavailable');
    const result = validateCrops(await response.json());
    return { ...result, status: result.crops.length ? 'loaded' : 'error' };
  } catch {
    return { crops: [], errors: [{ row: null, id: null, messages: ['Could not load the bundled crop file. Retry loading crop data.'] }], status: 'error' };
  }
}

export const POWER = Object.freeze({
  timeout_ms: 20_000,
  cache_version: 1,
  monthly_start: 1991, monthly_end: 2024,
  grid_note: 'NASA POWER ~0.5° × 0.625° grid (about 50 km). Area pattern, not a field measurement.',
  soil_note: 'POWER soil wetness comes from the MERRA-2 model, not directly from a satellite.',
  daily_parameters: Object.freeze({ rain: 'PRECTOTCORR', t2m: 'T2M', tmax: 'T2M_MAX', tmin: 'T2M_MIN', gwetroot: 'GWETROOT', gwettop: 'GWETTOP' }),
  monthly_parameters: Object.freeze({ rain_sum: 'PRECTOTCORR_SUM', tmax: 'T2M_MAX' }),
});

export function latestCompleteAgYear(date = new Date()) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) throw new Error('Invalid current date.');
  return date.getUTCFullYear() - (date.getUTCMonth() + 1 >= 7 ? 1 : 2);
}

export function powerPoint(field) {
  if (typeof field?.lat !== 'number' || !Number.isFinite(field.lat) || Math.abs(field.lat) > 90
    || typeof field?.lon !== 'number' || !Number.isFinite(field.lon) || Math.abs(field.lon) > 180) throw new Error('Valid latitude and longitude are required.');
  return { lat: Number(field.lat.toFixed(2)), lon: Number(field.lon.toFixed(2)) };
}

export function isDemoPoint(field) {
  try { const point = powerPoint(field), demo = powerPoint(DEMO_FARM); return point.lat === demo.lat && point.lon === demo.lon; }
  catch { return false; }
}

export function buildPowerRequests(field, agYear = latestCompleteAgYear()) {
  if (!Number.isInteger(agYear) || agYear < 1984 || agYear > 9998) throw new Error('Invalid agricultural year.');
  const point = powerPoint(field);
  const request = (kind, start, end, parameters) => {
    const url = new URL(`https://power.larc.nasa.gov/api/temporal/${kind}/point`);
    url.search = new URLSearchParams({ parameters: Object.values(parameters).join(','), community: 'AG', longitude: point.lon.toFixed(2), latitude: point.lat.toFixed(2), start, end, format: 'JSON' });
    return { kind, point, start, end, request_url: url.href };
  };
  return { ag_year: agYear, point,
    daily: request('daily', `${agYear - 3}0601`, `${agYear + 1}0531`, POWER.daily_parameters),
    monthly: request('monthly', String(POWER.monthly_start), String(POWER.monthly_end), POWER.monthly_parameters) };
}

function valueOrNull(value, fill, key) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value === -999 || value === fill) return null;
  if ((key === 'rain' || key === 'rain_sum') && value < 0) return null;
  if ((key === 'gwetroot' || key === 'gwettop') && (value < 0 || value > 1)) return null;
  return value;
}

function parametersFor(payload, kind) {
  const parameters = payload?.properties?.parameter;
  const required = kind === 'daily' ? POWER.daily_parameters : POWER.monthly_parameters;
  if (!parameters || Object.values(required).some(key => !parameters[key] || typeof parameters[key] !== 'object' || Array.isArray(parameters[key]))) throw new Error(`NASA ${kind} response is missing required parameters.`);
  return parameters;
}

function compactDate(value) {
  const compact = String(value).replaceAll('-', '');
  if (!/^\d{8}$/.test(compact)) throw new Error('Invalid requested date.');
  const date = new Date(`${compact.slice(0,4)}-${compact.slice(4,6)}-${compact.slice(6,8)}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10).replaceAll('-', '') !== compact) throw new Error('Invalid requested date.');
  return date;
}

/** One entry per requested day, including absent dates; never fill missing data with zero. */
export function parsePowerDaily(payload, start, end) {
  const parameters = parametersFor(payload, 'daily'), daily = [];
  const first = compactDate(start), last = compactDate(end);
  if (last < first || (last - first) / 86400000 > 2000) throw new Error('Invalid daily range.');
  for (let day = first; day <= last; day = new Date(day.getTime() + 86400000)) {
    const date = day.toISOString().slice(0,10), key = date.replaceAll('-', '');
    daily.push({ date, ...Object.fromEntries(Object.entries(POWER.daily_parameters).map(([name, parameter]) => [name, valueOrNull(parameters[parameter][key], payload.header?.fill_value, name)])) });
  }
  return daily;
}

/** Preserve raw monthly sum values and metadata; month 13 never enters the monthly series. */
export function parsePowerMonthly(payload, start = POWER.monthly_start, end = POWER.monthly_end) {
  const parameters = parametersFor(payload, 'monthly'), monthly = [];
  if (!Number.isInteger(Number(start)) || !Number.isInteger(Number(end)) || Number(end) < Number(start) || Number(end) - Number(start) > 100) throw new Error('Invalid monthly range.');
  for (let year = Number(start); year <= Number(end); year++) for (let month = 1; month <= 12; month++) {
    const key = `${year}${String(month).padStart(2,'0')}`;
    monthly.push({ date: `${year}-${String(month).padStart(2,'0')}`, ...Object.fromEntries(Object.entries(POWER.monthly_parameters).map(([name, parameter]) => [name, valueOrNull(parameters[parameter][key], payload.header?.fill_value, name)])) });
  }
  return monthly;
}

function validatePowerPayload(payload, request) {
  const rows = request.kind === 'daily' ? parsePowerDaily(payload, request.start, request.end) : parsePowerMonthly(payload, request.start, request.end);
  if (!rows.some(row => Object.entries(row).some(([key, value]) => key !== 'date' && value !== null))) throw new Error('NASA response contains no usable values for the requested range.');
  const coordinates = payload.geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2 || Math.abs(coordinates[0] - request.point.lon) > 0.000001 || Math.abs(coordinates[1] - request.point.lat) > 0.000001 || !coordinates.slice(0,2).every(Number.isFinite)) throw new Error('NASA response location does not match the requested field.');
  const start = request.kind === 'daily' ? request.start : `${request.start}0101`;
  const end = request.kind === 'daily' ? request.end : `${request.end}1231`;
  if (String(payload.header?.start) !== start || String(payload.header?.end) !== end) throw new Error('NASA response date range does not match the request.');
}

/** The timeout covers response headers AND body, even when a test/custom fetch ignores abort. */
export async function fetchPowerRecord(request, { fetcher = globalThis.fetch, timeoutMs = POWER.timeout_ms, now = () => new Date() } = {}) {
  const controller = new AbortController();
  let timer;
  try {
    const payload = await Promise.race([
      (async () => {
        const response = await fetcher(request.request_url, { signal: controller.signal });
        if (!response.ok) throw new Error(`NASA ${request.kind} request failed (${response.status ?? 'HTTP error'}).`);
        return response.json();
      })(),
      new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error(`NASA ${request.kind} request timed out.`)); }, timeoutMs); }),
    ]);
    validatePowerPayload(payload, request);
    return { version: POWER.cache_version, ...request, retrieved_at: now().toISOString(), payload, source: 'live', fallback_reason: '', cache_warning: '' };
  } finally { clearTimeout(timer); }
}

export function powerCacheKey(request) {
  return `terraplan.v3.power.v${POWER.cache_version}:${request.kind}:${request.point.lat.toFixed(2)},${request.point.lon.toFixed(2)}:${request.start}:${request.end}`;
}

function validateStoredRecord(record, request) {
  if (record?.version !== POWER.cache_version || record.kind !== request.kind || record.start !== request.start || record.end !== request.end
    || record.request_url !== request.request_url || record.point?.lat !== request.point.lat || record.point?.lon !== request.point.lon
    || typeof record.retrieved_at !== 'string' || !Number.isFinite(Date.parse(record.retrieved_at))) throw new Error('Stored NASA metadata do not match this request.');
  validatePowerPayload(record.payload, request);
}

async function bundledRecord(request, fetcher, reason) {
  if (!isDemoPoint(request.point)) throw new Error('There is no bundled weather file for this field.');
  const response = await fetcher(new URL(`./data/demo-power-${request.kind}.json`, import.meta.url));
  if (!response.ok) throw new Error('The bundled demo weather file could not be loaded.');
  const payload = await response.json();
  const record = { ...payload._terraplan, payload };
  validateStoredRecord(record, request);
  return { ...record, source: 'demo-bundle', fallback_reason: reason, cache_warning: '' };
}

async function loadPowerRecord(request, options) {
  const { storage, fetcher = globalThis.fetch, mode = 'auto' } = options;
  if (mode === 'bundle') return bundledRecord(request, fetcher, 'Bundled demo chosen; no NASA request was sent.');
  let failure;
  try {
    const record = await fetchPowerRecord(request, options);
    if (storage) try { storage.setItem(powerCacheKey(request), JSON.stringify(record)); }
    catch { record.cache_warning = 'Weather loaded, but this browser could not cache it.'; }
    return record;
  } catch (error) { failure = error.message; }
  if (storage) try {
    const cached = JSON.parse(storage.getItem(powerCacheKey(request)));
    validateStoredRecord(cached, request);
    return { ...cached, source: 'cache', fallback_reason: failure, cache_warning: '' };
  } catch { /* Keep an unreadable cache unchanged; try the location-specific bundle next. */ }
  try { return await bundledRecord(request, fetcher, failure); }
  catch { throw new Error(`${failure} No valid cache or matching demo bundle is available. Retry loading NASA climate.`); }
}

/** Daily data are essential; monthly failure is reported separately without losing daily data. */
export async function loadClimate(field, options = {}) {
  const now = options.now ?? (() => new Date());
  const requests = buildPowerRequests(field, options.agYear ?? latestCompleteAgYear(now()));
  const results = await Promise.allSettled([loadPowerRecord(requests.daily, options), loadPowerRecord(requests.monthly, options)]);
  if (results[0].status === 'rejected') throw results[0].reason;
  const dailyRecord = results[0].value;
  const monthlyRecord = results[1].status === 'fulfilled' ? results[1].value : null;
  const daily = parsePowerDaily(dailyRecord.payload, requests.daily.start, requests.daily.end);
  const complete = row => Object.keys(POWER.daily_parameters).every(key => row[key] !== null);
  const provenance = record => ({ kind: record.kind, source: record.source, request_url: record.request_url, retrieved_at: record.retrieved_at,
    start: record.start, end: record.end, fallback_reason: record.fallback_reason, parameters: record.payload.parameters ?? {}, time_standard: record.payload.header?.time_standard ?? 'Not supplied' });
  return {
    source: dailyRecord.source, retrieved_at: dailyRecord.retrieved_at, point: requests.point,
    request_urls: [requests.daily.request_url, requests.monthly.request_url],
    grid_note: POWER.grid_note, soil_note: POWER.soil_note, daily, ag_year: requests.ag_year,
    years_available: Array.from({length:4}, (_, index) => requests.ag_year - 3 + index).filter(year => daily.some(row => row.date >= `${year}-06-01` && row.date <= `${year + 1}-05-31` && complete(row))),
    missing_days: daily.filter(row => !complete(row)).length,
    monthly: monthlyRecord ? parsePowerMonthly(monthlyRecord.payload, requests.monthly.start, requests.monthly.end) : null,
    monthly_trend: monthlyRecord ? buildMonthlyTrend(parsePowerMonthly(monthlyRecord.payload, requests.monthly.start, requests.monthly.end), monthlyRecord.payload.parameters) : null,
    monthly_error: results[1].status === 'rejected' ? results[1].reason.message : '',
    datasets: [dailyRecord, monthlyRecord].filter(Boolean).map(provenance),
    warnings: [dailyRecord.cache_warning, monthlyRecord?.cache_warning].filter(Boolean),
  };
}

/** OLS against actual calendar years; no significance test or forecast is implied. */
export function slopePerDecade(points) {
  if (points.length < 2 || points.some(([x,y]) => !Number.isFinite(x) || !Number.isFinite(y))) return null;
  const meanX = points.reduce((s,p) => s+p[0],0)/points.length, meanY = points.reduce((s,p) => s+p[1],0)/points.length;
  const denominator = points.reduce((s,p) => s+(p[0]-meanX)**2,0);
  return denominator ? 10*points.reduce((s,p) => s+(p[0]-meanX)*(p[1]-meanY),0)/denominator : null;
}

export function buildMonthlyTrend(monthly, parameters = {}) {
  const valid = value => typeof value === 'number' && Number.isFinite(value) && value !== -999;
  // PRECTOTCORR_SUM is a monthly accumulation. Never multiply this SUM by days.
  // NASA's GIS product documents mm; the point API currently labels the same SUM mm/day.
  const rainUnit = parameters.PRECTOTCORR_SUM?.units;
  const rainAllowed = ['mm','mm/day'].includes(rainUnit);
  const heatAllowed = ['C','°C','degC'].includes(parameters.T2M_MAX?.units);
  const byDate = new Map(), duplicates = new Set();
  for (const row of monthly ?? []) if (/^\d{4}-(0[1-9]|1[0-2])$/.test(row.date)) {
    if (byDate.has(row.date)) duplicates.add(row.date);
    byDate.set(row.date,row);
  }
  const years = [...new Set([...byDate.keys()].map(date => Number(date.slice(0,4))))].sort((a,b)=>a-b);
  const annual = years.map(year => {
    const rows = Array.from({length:12},(_,i) => {
      const date = `${year}-${String(i+1).padStart(2,'0')}`;
      return duplicates.has(date) ? null : byDate.get(date);
    });
    return {year,rain_mm:rainAllowed && rows.every(row => valid(row?.rain_sum) && row.rain_sum >= 0) ? rows.reduce((sum,row)=>sum+row.rain_sum,0) : null,
      tmax_c:heatAllowed && rows.every(row => valid(row?.tmax)) ? rows.reduce((sum,row)=>sum+row.tmax,0)/12 : null};
  });
  const rainYears = annual.filter(row => row.rain_mm !== null).map(row=>row.year), heatYears = annual.filter(row=>row.tmax_c !== null).map(row=>row.year);
  return {annual,years,rain_years:rainYears,tmax_years:heatYears,
    rain_mm_per_decade:slopePerDecade(annual.filter(row=>row.rain_mm !== null).map(row=>[row.year,row.rain_mm])),
    tmax_c_per_decade:slopePerDecade(annual.filter(row=>row.tmax_c !== null).map(row=>[row.year,row.tmax_c])),
    unit_note:!rainAllowed ? 'Rain trend unavailable: unsupported or missing precipitation units.' : rainUnit === 'mm/day'
      ? 'Provider unit discrepancy: the point API labels PRECTOTCORR_SUM mm/day. This is the monthly SUM, used as mm without multiplying by days, following NASA POWER GIS metadata. Bundled overlapping months are checked against summed daily rain in tests.'
      : 'PRECTOTCORR_SUM is a monthly accumulation in mm; no multiplication by days.',
    method:'Annual rain = sum of 12 monthly accumulations; annual Tmax = mean of 12 monthly Tmax values. Each series omits a year if any of its months is missing. OLS slope against calendar year × 10; at least two complete years required. No statistical significance test is provided.'};
}
