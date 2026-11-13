/** Terms currently used in the app. The remaining climate glossary arrives in step 8. */
export const GLOSSARY = Object.freeze({
  flowering: Object.freeze({ title: 'Assumed flowering month', definition: 'TerraPlan estimates this month from the listed sowing month and crop duration using an illustrative rule. Actual flowering depends on the variety and conditions and has not been observed by this app.' }),
  heat_stress: Object.freeze({ title: 'Heat stress marker', definition: 'A marker for days above the crop-table heat threshold. The threshold is illustrative; the marker does not confirm crop damage at your field.' }),
  benefit: Object.freeze({ title: 'Benefit badge', definition: 'A match to a stated comparison rule using crop-table roles and assumptions. A badge describes a potential benefit; it is not a measured change at your field.' }),
  infiltration: Object.freeze({ title: 'Infiltration', definition: 'Water moving into the soil. A crop-role and cover comparison may suggest a potential benefit, but TerraPlan has not measured how fast water enters your soil.' }),
  priority: Object.freeze({ title: 'Priority weight', definition: 'How much importance you give a factor in the comparison. A zero weight leaves it out of the priority component; it does not turn off climate or water checks.' }),
  confidence: Object.freeze({ title: 'Confidence', definition: 'How complete and verified the inputs are under these rules. Low confidence means important uncertainties remain; even High does not guarantee that a crop will suit your field.' }),
  feasibility: Object.freeze({ title: 'Water feasibility', definition: 'A rule check comparing estimated usable water with crop water need. Passing this check does not confirm your actual water supply or establish local crop suitability.' }),
  effective_rain: Object.freeze({ title: 'Effective rain', definition: 'The portion of recorded rain the model treats as usable by a crop. TerraPlan uses an illustrative fraction; actual usable rain depends on soil, slope, timing and management.' }),
  dry_spell: Object.freeze({ title: 'Dry spell', definition: 'Consecutive days with less rain than the rule threshold. A missing day breaks the known run; it is not assumed dry.' }),
  heavy_rain: Object.freeze({ title: 'Heavy rain', definition: 'A day whose rainfall meets or exceeds the threshold used by these rules. Area rainfall may differ from rain at your field.' }),
  soil_wetness: Object.freeze({ title: 'Soil wetness', definition: 'A model estimate of how wet the soil is relative to its capacity. POWER uses the MERRA-2 model; this is not a direct satellite or field measurement.' }),
  resolution: Object.freeze({ title: 'Grid and resolution', definition: 'A dataset groups information into map cells that cover an area. A value for a large cell cannot describe every field within it.' }),
  'nitrogen-fixer': Object.freeze({ title: 'Nitrogen fixer', definition: 'A crop that can work with root microbes to add nitrogen to the soil. The amount depends on the variety, soil and management.' }),
  cover: Object.freeze({ title: 'Cover crop', definition: 'A crop that helps keep the soil surface covered. Coverage depends on growth and how crop residues are managed.' }),
  'deep-rooted': Object.freeze({ title: 'Deep-rooted crop', definition: 'A crop with roots that may reach deeper soil layers. Actual root depth depends on the soil and growing conditions.' }),
  'drought-tolerant': Object.freeze({ title: 'Drought-tolerant crop', definition: 'A crop that may cope better with periods of low water. It still needs enough water to establish and grow.' }),
  forage: Object.freeze({ title: 'Forage', definition: 'Plant material grown or used as feed for farm animals. A forage score here is an illustrative comparison, not an amount of animal feed.' }),
  organic_matter: Object.freeze({ title: 'Organic matter', definition: 'Material from plants and other living things that remains in the soil. The crop score is illustrative and does not replace a soil test.' }),
  erosion: Object.freeze({ title: 'Erosion control', definition: 'Keeping soil from being carried away by water or wind. Plant cover may help, depending on local conditions.' }),
  threshold: Object.freeze({ title: 'Temperature threshold', definition: 'A temperature limit used by the comparison rules to count unusually hot or cold days for a crop. The starter limits are illustrative and need local review.' }),
  coordinates: Object.freeze({ title: 'Latitude and longitude', definition: 'These coordinates identify a place on a map. Copy the coordinates for your field from a trusted map or ask someone locally to help find them.' }),
  hectare: Object.freeze({ title: 'Hectare', definition: 'A hectare is a unit for measuring land area. Use the area in hectares from your land records or ask your local agricultural officer to help convert it.' }),
  kharif: Object.freeze({ title: 'Kharif', definition: 'The main rainy-season cropping period. Local sowing and harvest dates depend on rain and the crop variety.' }),
  rabi: Object.freeze({ title: 'Rabi', definition: 'The cooler-season cropping period after the main rains. Crops may use stored soil water and extra irrigation.' }),
  zaid: Object.freeze({ title: 'Zaid', definition: 'The short summer cropping period between rabi and the next rainy season. A field may be left bare if water is limited.' }),
  irrigation: Object.freeze({ title: 'Irrigation in millimetres', definition: 'This is the depth of extra water spread across your field during a season, excluding rain. Ask your agricultural officer to help estimate how much your water source can supply.' }),
  kvk: Object.freeze({
    title: 'KVK',
    definition: 'A Krishi Vigyan Kendra is a local farm science centre. Ask its team or an agricultural officer to check whether an option suits your field.',
  }),
  rotation: Object.freeze({
    title: 'Crop rotation',
    definition: 'A crop rotation is the sequence of crops grown on the same field over different seasons. TerraPlan will compare your own sequence with alternatives.',
  }),
});

export function getGlossaryEntry(term) {
  return Object.hasOwn(GLOSSARY, term) ? GLOSSARY[term] : null;
}

export function openGlossary(term) {
  const entry = getGlossaryEntry(term);
  if (!entry) return false;
  document.getElementById('glossary-title').textContent = entry.title;
  document.getElementById('glossary-definition').textContent = entry.definition;
  document.getElementById('glossary-dialog').showModal();
  return true;
}
