/** Terms currently used in the app. The remaining climate glossary arrives in step 8. */
export const GLOSSARY = Object.freeze({
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
