import { FIELD_CHOICES, FIELD_LIMITS, SEASONS, emptyField } from './field.mjs';

const glossaryButton = '<button type="button" class="glossary-link" data-glossary="rotation" aria-label="What is a crop rotation?">What is a rotation?</button>';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function pageHeading(number, title, description) {
  return `<header class="page-heading"><p class="eyebrow">YOUR PLANNING JOURNEY <span>${number} / 7</span></p><h1>${title}</h1><p class="page-description">${description}</p></header>`;
}

function placeholder(step, heading, description) {
  return `<section class="placeholder-panel"><span class="stage-label">Planned · step ${step}</span><h2>${heading}</h2><p>${description}</p><p class="availability">Not available yet. No result has been calculated.</p></section>`;
}

export function renderWelcome() {
  return `<section class="welcome"><div class="welcome-copy"><p class="eyebrow">FOR SMALL FARMS IN WESTERN INDIA</p><h1>Your field.<br>Your next season.<br><em>Your decision.</em></h1><p class="welcome-purpose">Compare the crops you grow now with two alternatives, using NASA weather evidence and clearly stated rules.</p><p class="welcome-note">Start with your own field or explore an editable demo from Rajkot. Weather evidence and calculations will follow in later steps.</p><div class="welcome-actions"><button type="button" class="primary" data-navigate="/field">Start <span aria-hidden="true">→</span></button><button type="button" class="secondary" data-load-demo aria-describedby="demo-status">Load demo farm</button></div><p id="demo-status" class="small-note">The demo fills an editable field. Save it when you are ready.</p>${glossaryButton}</div><aside class="journey-card" aria-label="How planning will work"><span class="stage-label">Build status · step 2 of 12</span><h2>Start with the farm<br>you know.</h2><ol><li><span>01</span><div><strong>Describe your field</strong><p>Your soil, water and current crops.</p></div></li><li><span>02</span><div><strong>Look at the evidence</strong><p>Weather history and its limits.</p></div></li><li><span>03</span><div><strong>Compare your choices</strong><p>Your current plan and two alternatives.</p></div></li></ol><p class="journey-footnote">Scores will be relative comparisons from stated rules. They will not predict yield or profit.</p></aside></section>`;
}

export function renderField({ draft = emptyField(), message = '', storageError = '' } = {}) {
  const error = id => `<span id="error-${id}" class="field-error" hidden></span>`;
  const input = (id, label, value, limit, help = '') => `<div class="form-control"><label for="${id}">${label}</label><input id="${id}" name="${id}" type="number" step="any" min="${limit.min}" max="${limit.max}" required value="${escapeHtml(value)}" aria-describedby="${help ? `${id}-help ` : ''}error-${id}">${help ? `<p id="${id}-help" class="input-help">${help}</p>` : ''}${error(id)}</div>`;
  const select = (id, label, value, options, prompt = 'Choose an option') => `<div class="form-control"><label for="${id}">${label}</label><select id="${id}" name="${id}" required aria-describedby="error-${id}"><option value="">${prompt}</option>${options.map(([key, text]) => `<option value="${key}"${value === key ? ' selected' : ''}>${text}</option>`).join('')}</select>${error(id)}</div>`;
  return pageHeading('02', 'My field', 'Start with your soil, water and the crops you already grow.')
    + `<div class="field-intro"><p><strong>Your entries, your device.</strong> This form saves on this browser only. Coordinates are not sent anywhere in this step.</p><button type="button" class="secondary" data-load-demo>Load demo farm</button></div>
    <p id="storage-error" class="storage-error" role="alert"${storageError ? '' : ' hidden'}>${escapeHtml(storageError)}</p>
    <p id="field-status" class="field-status" role="status">${escapeHtml(message)}</p>
    <form id="field-form" novalidate>
      <div id="field-errors" class="error-summary" role="alert" tabindex="-1" hidden></div>
      <fieldset><legend>1. Location and soil</legend><p class="fieldset-note">All fields are required. Leave the soil-report box unticked if you do not have a report.</p><div class="form-grid">
      <div class="form-control full-width"><label for="name">Field name</label><input id="name" name="name" type="text" maxlength="${FIELD_LIMITS.name_length}" required value="${escapeHtml(draft.name)}" aria-describedby="error-name">${error('name')}</div>
      ${input('lat', 'Latitude (degrees)', draft.lat, FIELD_LIMITS.lat, 'Use a minus sign south of the equator.')}
      ${input('lon', 'Longitude (degrees)', draft.lon, FIELD_LIMITS.lon, 'Use a minus sign west of Greenwich.')}
      ${input('area_ha', 'Field area (hectares)', draft.area_ha, FIELD_LIMITS.area_ha, `More than ${FIELD_LIMITS.area_ha.min} and up to ${FIELD_LIMITS.area_ha.max} hectares.`)}
      ${select('soil', 'Soil type', draft.soil, FIELD_CHOICES.soil)}
      <div class="form-control full-width"><label class="checkbox-label" for="soil_tested"><input id="soil_tested" name="soil_tested" type="checkbox"${draft.soil_tested ? ' checked' : ''} aria-describedby="error-soil_tested">I have a soil test report for this field</label>${error('soil_tested')}</div></div><div class="season-help"><button type="button" class="glossary-link" data-glossary="coordinates">What are latitude and longitude?</button><button type="button" class="glossary-link" data-glossary="hectare">What is a hectare?</button></div></fieldset>
      <fieldset><legend>2. Water and farm resources</legend><div class="form-grid">
      ${select('water_source', 'Main water source', draft.water_source, FIELD_CHOICES.water_source)}
      ${select('equipment', 'Available equipment', draft.equipment, FIELD_CHOICES.equipment)}
      ${select('market_access', 'Market access', draft.market_access, FIELD_CHOICES.market_access)}
      </div><p class="fieldset-note">Extra irrigation is water you can supply in addition to rain. Enter 0 if none is available.</p><div class="season-grid">
      ${SEASONS.map(season => input(`irrigation_${season}`, `${season[0].toUpperCase() + season.slice(1)} irrigation (mm)`, draft.irrigation_mm[season], FIELD_LIMITS.irrigation_mm)).join('')}
      </div><button type="button" class="glossary-link" data-glossary="irrigation">What does irrigation in mm mean?</button></fieldset>
      <fieldset><legend>3. Your current rotation</legend><p class="fieldset-note">Record what you actually grow. Choose Bare when you leave a season without a crop. These choices are not crop recommendations; suitability checks come later.</p><div class="season-grid">
      ${SEASONS.map(season => select(`rotation_${season}`, `${season[0].toUpperCase() + season.slice(1)} crop`, draft.current_rotation[season] === null ? 'bare' : draft.current_rotation[season], [['bare', 'Bare (no crop)'], ...FIELD_CHOICES.crop], 'Choose a crop or Bare')).join('')}
      </div><div class="season-help">${SEASONS.map(season => `<button type="button" class="glossary-link" data-glossary="${season}">What is ${season}?</button>`).join('')}${glossaryButton}</div></fieldset>
      <div class="page-actions"><button type="submit" class="primary">Save field</button><button type="button" class="secondary" data-navigate="/climate">Preview the climate page →</button></div>
      <p class="small-note">Save field to keep these entries after a reload. Climate data and crop comparisons are not connected yet.</p>
    </form>`;
}

export function renderClimate() {
  return pageHeading('03', 'Your climate (NASA)', 'Weather evidence will describe the area around your farm. It will not be a measurement from your own field.')
    + placeholder('4 and 8', 'Weather history is not connected yet.', 'This page will show observed rain, hot and cold days, dry periods and long-term changes. Missing data will be reported as missing.')
    + '<p class="source-note"><strong>Data source:</strong> not loaded. The scaffold makes no weather request.</p>';
}

export function renderPriorities() {
  return pageHeading('04', 'Priorities', 'Tell TerraPlan what matters to your farm before comparing choices.')
    + placeholder('5', 'Your priorities will guide the comparison.', 'Six adjustable priorities will be added with the scoring model. There are no active sliders or rankings in this scaffold.');
}

function comparisonPlaceholder(title) {
  return `<article class="comparison-placeholder"><p class="column-label">${title}</p><h2>Not calculated yet</h2><p class="score-placeholder">No score or confidence label is available.</p><dl><div><dt>Why</dt><dd>The comparison rules are not connected yet.</dd></div><div><dt>Evidence (NASA numbers)</dt><dd>No NASA measurements are loaded.</dd></div><div><dt>Benefits</dt><dd>No benefit has been calculated.</dd></div><div><dt>Information gaps</dt><dd>The field, crop table and weather are still needed.</dd></div><div><dt>Check locally (KVK / agri officer)</dt><dd>Ask for local advice before changing your farm plan.</dd></div></dl></article>`;
}

export function renderCompare() {
  return pageHeading('05', 'Compare rotations', 'Your current rotation will stay visible beside two alternatives. Excluded choices will have reasons.')
    + `<p class="screen-status"><span class="status-dot" aria-hidden="true"></span>Planned · steps 3–7. This is a page layout, not a set of recommendations.</p><div class="comparison-grid">${['Your current', 'Option A', 'Option B'].map(comparisonPlaceholder).join('')}</div><div class="page-actions">${glossaryButton}</div>`;
}

export function renderWhatIf() {
  return pageHeading('06', 'What if?', 'Explore how a change in rain, temperature or available water could affect the comparison.')
    + placeholder('10', 'Scenarios will stay separate from observations.', 'This page will add rain, temperature and irrigation controls, plus a comparison across four historical years. These will be experiments on past weather, not forecasts.');
}

export function renderEvidence() {
  return pageHeading('07', 'Evidence', 'See where the numbers come from, which rules are illustrative and what still needs checking.')
    + `<section class="evidence-panel"><span class="stage-label">Step 2 · scientific results pending</span><h2>No scientific results are loaded.</h2><div class="evidence-row"><h3>Weather history</h3><p>Not connected. Daily weather retrieval is planned for step 4.</p></div><div class="evidence-row"><h3>Long-term weather changes</h3><p>Not connected. Monthly records and trend calculations are planned for step 8.</p></div><div class="evidence-row"><h3>Satellite summaries</h3><p>Not loaded yet. The optional team-supplied dataset is planned for step 9.</p></div><div class="evidence-row"><h3>Crop values and formulas</h3><p>The crop table, its validation, the generator and scoring are not implemented in this step. No crop values are presented as verified.</p></div><div class="evidence-row"><h3>Validation boundary</h3><p>Future scores will compare stated rules. Local crop values still need agricultural review. No yield or profit predictions are made.</p></div></section>`;
}

export const ROUTES = Object.freeze([
  { path: '/', label: 'Welcome', render: renderWelcome },
  { path: '/field', label: 'My field', render: renderField },
  { path: '/climate', label: 'Your climate', render: renderClimate },
  { path: '/priorities', label: 'Priorities', render: renderPriorities },
  { path: '/compare', label: 'Compare rotations', render: renderCompare },
  { path: '/whatif', label: 'What if?', render: renderWhatIf },
  { path: '/evidence', label: 'Evidence', render: renderEvidence },
].map(Object.freeze));

export function resolveRoute(hash) {
  const path = hash === '' || hash === '#' ? '/' : hash.replace(/^#/, '');
  return ROUTES.find(route => route.path === path) ?? null;
}

export function renderNotFound() {
  return pageHeading('—', 'This page is not available.', 'Choose a page from the navigation or return to Welcome.')
    + '<button type="button" class="primary" data-navigate="/">Return to Welcome</button>';
}
