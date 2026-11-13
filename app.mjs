import { ROUTES, resolveRoute, renderNotFound } from './views.mjs';
import { openGlossary } from './glossary.mjs';
import { DEMO_FARM, loadCrops } from './data.mjs';
import { generateRotations } from './engine.mjs';
import { SEASONS, emptyField, loadField, saveField, validateField } from './field.mjs';

// Only this field-specific adapter touches storage; scenario keys are left alone.
const fieldStorage = {
  getItem: key => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
};
const restored = loadField(fieldStorage);
let fieldDraft = restored.field ?? emptyField();
let fieldMessage = restored.field ? 'Your saved field is loaded. Edit it and save again when ready.' : '';
let storageError = restored.error;
let cropData = { crops: [], errors: [], status: 'loading' };

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
  const generated = route?.path === '/compare' && field && cropData.status !== 'loading' ? generateRotations(cropData.crops, field) : null;
  app.innerHTML = route ? route.render({ draft: fieldDraft, message: fieldMessage, storageError, cropData, generated, field }) : renderNotFound();
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
  if (['#/compare', '#/evidence'].includes(window.location.hash)) render();
  cropData = await loadCrops();
  // Avoid replacing an in-progress field form or stealing focus when the file arrives.
  if (['#/compare', '#/evidence'].includes(window.location.hash)) render();
}
refreshCrops();
