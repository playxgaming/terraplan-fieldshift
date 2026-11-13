/** The single editable demo-field definition. No V2 data or network adapter is used. */
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
