/** Two terms used by the scaffold. The full glossary is part of build step 8. */
export const GLOSSARY = Object.freeze({
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
