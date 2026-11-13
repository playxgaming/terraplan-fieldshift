import { ROUTES, resolveRoute, renderNotFound, renderRankingPreview, renderRotationsTable, tableDataFor, ROTATION_SORT_COLUMNS } from './views.mjs';
import { openGlossary } from './glossary.mjs';
import { DEMO_FARM, loadSatellite, loadCrops, loadClimate, powerPoint, latestCompleteAgYear } from './data.mjs';
import { generateRotations, seasonClimate, defaultPriorities, PRIORITIES, validatePriorities, prepareScoring, rankRotations } from './engine.mjs';
import { SEASONS, emptyField, loadField, saveField, validateField } from './field.mjs';

// Field and weather adapters write only their own keys; scenario storage is left alone.
const fieldStorage = {
  getItem: key => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
};
const restored = loadField(fieldStorage);
let fieldDraft = restored.field ?? emptyField();
let fieldMessage = restored.field ? 'Your saved field is loaded. Edit it and save again when ready.' : '';
let storageError = restored.error;
let cropData = { crops: [], errors: [], status: 'loading' };
let climateState = { status: 'idle', data: null, error: '', key: '' };
let climateRequestId = 0;
let priorities = defaultPriorities();
let satelliteState = {status:'loading',data:null,errors:[]};
let scoringCache = null;
let comparisonSort = { key: 'total', direction: 'desc' };
const climateKey = field => JSON.stringify({ ...powerPoint(field), ag_year: latestCompleteAgYear() });

const app = document.getElementById('app');
const navigation = document.getElementById('primary-nav');
const menuButton = document.getElementById('menu-toggle');
const desktop = window.matchMedia('(min-width: 54rem)');
let menuOpen = false;

function syncMenu() {
  navigation.hidden = !desktop.matches && !menuOpen;
  menuButton.hidden = desktop.matches;
  menuButton.setAttribute('aria-expanded', String(!navigation.hidden));
  menuButton.textContent = menuOpen ? 'Close menu' : 'Menu';
}

function render({ focus = false } = {}) {
  const route = resolveRoute(window.location.hash);
  navigation.innerHTML = ROUTES.map(item => `<a href="#${item.path}"${route?.path === item.path ? ' aria-current="page"' : ''}>${item.label}</a>`).join('');
  const field = validateField(fieldDraft).field;
  const generated = ['/compare','/climate','/priorities'].includes(route?.path) && field && cropData.status !== 'loading' ? generateRotations(cropData.crops, field) : null;
  const climateMatches = Boolean(field && climateState.key === climateKey(field));
  const current = generated?.rotations.find(rotation => rotation.is_current);
  const metrics = route?.path === '/climate' && climateMatches && climateState.data && current
    ? Object.fromEntries(SEASONS.map(season => [season, seasonClimate(climateState.data, current.seasons[season])])) : null;
  const scoring = ['/priorities','/compare'].includes(route?.path) && field && generated && climateMatches && climateState.data && cropData.status === 'loaded' ? rankingFor(field,generated) : null;
  app.innerHTML = route ? route.render({ draft: fieldDraft, message: fieldMessage, storageError, cropData, generated, field, climateState, climateMatches, metrics, priorities, scoring, comparisonSort, satelliteState }) : renderNotFound();
  document.title = `TerraPlan V3 · ${route?.label ?? 'Page not found'}`;
  menuOpen = false;
  syncMenu();
  if (focus) {
    app.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }
}

menuButton.addEventListener('click', () => {
  menuOpen = !menuOpen;
  syncMenu();
});

desktop.addEventListener('change', () => {
  const moveFocus = !desktop.matches && navigation.contains(document.activeElement);
  menuOpen = false;
  syncMenu();
  if (moveFocus) menuButton.focus();
});

document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  app.focus();
});

document.addEventListener('click', event => {
  const sort = event.target.closest('[data-sort-rotations]');
  if (sort && ROTATION_SORT_COLUMNS.some(column => column.key === sort.dataset.sortRotations)) {
    const key = sort.dataset.sortRotations;
    comparisonSort = { key, direction: comparisonSort.key === key && comparisonSort.direction === 'desc' ? 'asc' : 'desc' };
    const field = validateField(fieldDraft).field;
    if (field) {
      const generated = generateRotations(cropData.crops,field);
      const scoring = climateState.key === climateKey(field) && climateState.data && cropData.status === 'loaded' ? rankingFor(field,generated) : null;
      document.getElementById('rotations-table-region').innerHTML = renderRotationsTable(tableDataFor(scoring,generated),comparisonSort);
      [...document.querySelectorAll('[data-sort-rotations]')].find(button => button.dataset.sortRotations === key)?.focus({preventScroll:true});
      document.getElementById('table-sort-status').textContent = `Sorted by ${ROTATION_SORT_COLUMNS.find(column => column.key === key).label}, ${comparisonSort.direction === 'asc' ? 'ascending' : 'descending'}. Missing values remain last.`;
    }
  }
  if (event.target.closest('[data-reset-priorities]')) {
    priorities = defaultPriorities();
    for (const {key} of PRIORITIES) {
      const input = document.getElementById(`priority-${key}`);
      input.value = String(priorities[key]);
      input.removeAttribute('aria-invalid');
      document.getElementById(`weight-${key}`).textContent = String(priorities[key]);
    }
    document.getElementById('priority-error').textContent = '';
    updatePriorityRanking();
  }
  const weather = event.target.closest('[data-load-climate]');
  if (weather) refreshClimate(weather.dataset.loadClimate);
  if (event.target.closest('[data-retry-crops]')) refreshCrops();
  if (event.target.closest('[data-load-demo]')) {
    fieldDraft = structuredClone(DEMO_FARM);
    fieldMessage = 'Demo farm, Rajkot is filled in. Review the entries, then choose Save field to keep them.';
    if (window.location.hash === '#/field') render({ focus: true });
    else window.location.hash = '#/field';
  }
  const glossary = event.target.closest('[data-glossary]');
  if (glossary) openGlossary(glossary.dataset.glossary);
  const action = event.target.closest('[data-navigate]');
  if (action) {
    const nextHash = `#${action.dataset.navigate}`;
    if (window.location.hash === nextHash) render({ focus: true });
    else window.location.hash = nextHash;
  }
});

function readFieldForm(form) {
  const values = new FormData(form);
  return {
    name: values.get('name'), lat: values.get('lat'), lon: values.get('lon'),
    soil: values.get('soil'), soil_tested: values.has('soil_tested'),
    area_ha: values.get('area_ha'), water_source: values.get('water_source'),
    equipment: values.get('equipment'), market_access: values.get('market_access'),
    irrigation_mm: Object.fromEntries(SEASONS.map(season => [season, values.get(`irrigation_${season}`)])),
    current_rotation: Object.fromEntries(SEASONS.map(season => {
      const value = values.get(`rotation_${season}`);
      return [season, value === 'bare' ? null : value];
    })),
  };
}

function rememberDraft(event) {
  if (event.target.form?.id !== 'field-form') return;
  fieldDraft = readFieldForm(event.target.form);
  fieldMessage = 'You have unsaved changes. Choose Save field to keep them.';
  document.getElementById('field-status').textContent = fieldMessage;
}
app.addEventListener('input', rememberDraft);
app.addEventListener('change', rememberDraft);
app.addEventListener('input', event => {
  const key = event.target.dataset.priority;
  if (!PRIORITIES.some(priority => priority.key === key)) return;
  const raw = event.target.value;
  const proposed = { ...priorities, [key]: raw.trim() === '' ? NaN : Number(raw) };
  const checked = validatePriorities(proposed);
  const error = document.getElementById('priority-error');
  if (!checked.valid) {
    error.textContent = checked.errors[key];
    event.target.setAttribute('aria-invalid','true');
    event.target.value = String(priorities[key]);
    return;
  }
  priorities = checked.priorities;
  event.target.removeAttribute('aria-invalid');
  error.textContent = '';
  document.getElementById(`weight-${key}`).textContent = String(priorities[key]);
  updatePriorityRanking();
});
app.addEventListener('submit', event => {
  if (event.target.id !== 'field-form') return;
  event.preventDefault();
  const form = event.target;
  fieldDraft = readFieldForm(form);
  const result = saveField(fieldStorage, fieldDraft);
  form.querySelectorAll('[aria-invalid]').forEach(control => control.removeAttribute('aria-invalid'));
  form.querySelectorAll('.field-error').forEach(error => { error.textContent = ''; error.hidden = true; });
  const summary = document.getElementById('field-errors');
  summary.replaceChildren();
  summary.hidden = result.valid;
  if (!result.valid) {
    const heading = document.createElement('p');
    heading.textContent = 'Field not saved. Check these entries:';
    const list = document.createElement('ul');
    for (const [id, message] of Object.entries(result.errors)) {
      const control = document.getElementById(id);
      control.setAttribute('aria-invalid', 'true');
      const error = document.getElementById(`error-${id}`);
      error.textContent = message;
      error.hidden = false;
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#${id}`;
      link.textContent = `${control.labels[0].textContent}: ${message}`;
      link.addEventListener('click', e => { e.preventDefault(); control.focus(); });
      item.append(link);
      list.append(item);
    }
    summary.append(heading, list);
    summary.focus();
    fieldMessage = result.error;
  } else if (result.error) {
    storageError = result.error;
    fieldMessage = 'Field not saved. Your edits remain available until you leave or reload this site.';
  } else {
    fieldDraft = result.field;
    storageError = '';
    fieldMessage = 'Field saved on this browser. You can safely reload this page.';
  }
  const storageNotice = document.getElementById('storage-error');
  storageNotice.textContent = storageError;
  storageNotice.hidden = !storageError;
  document.getElementById('field-status').textContent = fieldMessage;
});

document.getElementById('glossary-close').addEventListener('click', () => {
  document.getElementById('glossary-dialog').close();
});

window.addEventListener('hashchange', () => render({ focus: true }));
render();

async function refreshCrops() {
  cropData = { crops: [], errors: [], status: 'loading' };
  if (['#/compare', '#/climate', '#/evidence', '#/priorities'].includes(window.location.hash)) render();
  cropData = await loadCrops();
  // Avoid replacing an in-progress field form or stealing focus when the file arrives.
  if (['#/compare', '#/climate', '#/evidence', '#/priorities'].includes(window.location.hash)) render();
}
refreshCrops();

async function refreshClimate(mode) {
  const field = validateField(fieldDraft).field;
  if (!field) return;
  const requestId = ++climateRequestId;
  const key = climateKey(field);
  climateState = { status: 'loading', data: null, error: '', key };
  render();
  try {
    const data = await loadClimate(field, { mode, storage: fieldStorage });
    if (requestId !== climateRequestId) return;
    climateState = { status: 'loaded', data, error: '', key };
  } catch (error) {
    if (requestId !== climateRequestId) return;
    climateState = { status: 'error', data: null, error: error.message, key };
  }
  if (['#/climate', '#/evidence', '#/priorities', '#/compare'].includes(window.location.hash)) render();
}

function rankingFor(field,generated) {
  const fieldKey = JSON.stringify(field);
  if (!scoringCache || scoringCache.fieldKey !== fieldKey || scoringCache.crops !== cropData.crops || scoringCache.climate !== climateState.data) {
    scoringCache = { fieldKey, crops: cropData.crops, climate: climateState.data, prepared: prepareScoring(generated,field,climateState.data) };
  }
  return rankRotations(scoringCache.prepared,priorities);
}

function updatePriorityRanking() {
  const field = validateField(fieldDraft).field;
  const ready = field && climateState.key === climateKey(field) && climateState.data && cropData.status === 'loaded';
  if (!ready) {
    document.getElementById('ranking-status').textContent = 'Priorities updated. Complete your field and load matching climate data to calculate a ranking.';
    return;
  }
  const scoring = rankingFor(field,generateRotations(cropData.crops,field));
  // Keep range controls in place so dragging and keyboard focus are never interrupted.
  document.getElementById('ranking-preview').innerHTML = renderRankingPreview(scoring);
  document.getElementById('ranking-status').textContent = `Ranking updated. ${scoring.ranked.filter(row => row.total !== null).length} alternatives have a score. ${scoring.options[0] ? `First comparison candidate: ${SEASONS.map(season => scoring.options[0].seasons[season]?.crop.name ?? 'Bare').join(', ')}. ${scoring.options[0].feasibility_label}.` : 'No scored comparison candidate is available.'}`;
}

loadSatellite().then(result => {
  satelliteState = result;
  if (['#/climate','#/evidence'].includes(window.location.hash)) render();
});
