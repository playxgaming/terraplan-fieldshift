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
