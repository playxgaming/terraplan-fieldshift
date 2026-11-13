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
  return `<section class="welcome"><div class="welcome-copy"><p class="eyebrow">FOR SMALL FARMS IN WESTERN INDIA</p><h1>Your field.<br>Your next season.<br><em>Your decision.</em></h1><p class="welcome-purpose">Compare the crops you grow now with two alternatives, using NASA weather evidence and clearly stated rules.</p><p class="welcome-note">Start with your own field or explore an editable demo from Rajkot. Weather evidence and calculations will follow in later steps.</p><div class="welcome-actions"><button type="button" class="primary" data-navigate="/field">Start <span aria-hidden="true">→</span></button><button type="button" class="secondary" data-load-demo aria-describedby="demo-status">Load demo farm</button></div><p id="demo-status" class="small-note">The demo fills an editable field. Save it when you are ready.</p>${glossaryButton}</div><aside class="journey-card" aria-label="How planning will work"><span class="stage-label">Build status · step 3 of 12</span><h2>Start with the farm<br>you know.</h2><ol><li><span>01</span><div><strong>Describe your field</strong><p>Your soil, water and current crops.</p></div></li><li><span>02</span><div><strong>Look at the evidence</strong><p>Weather history and its limits.</p></div></li><li><span>03</span><div><strong>Compare your choices</strong><p>Your current plan and two alternatives.</p></div></li></ol><p class="journey-footnote">Scores will be relative comparisons from stated rules. They will not predict yield or profit.</p></aside></section>`;
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
  return `<article class="comparison-placeholder"><p class="column-label">${title}</p><h2>Not calculated yet</h2><p class="score-placeholder">No score or confidence label is available.</p><dl><div><dt>Why</dt><dd>The comparison rules are not connected yet.</dd></div><div><dt>Evidence (NASA numbers)</dt><dd>No NASA measurements are loaded.</dd></div><div><dt>Benefits</dt><dd>No benefit has been calculated.</dd></div><div><dt>Information gaps</dt><dd>Weather and scoring are still needed; review the field and crop assumptions below.</dd></div><div><dt>Check locally (KVK / agri officer)</dt><dd>Ask for local advice before changing your farm plan.</dd></div></dl></article>`;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function rotationDescription(rotation) {
  return SEASONS.map(season => `${season}: ${rotation.seasons[season] ? rotation.seasons[season].crop.name : 'Bare'}`).join(' · ');
}

function cropLoading(cropData) {
  if (cropData.status === 'loading') return '<p class="screen-status" role="status">Loading the bundled crop table…</p>';
  if (cropData.status === 'error') return '<p class="screen-status" role="alert">Crop data are unavailable. No alternatives have been generated.</p><button type="button" class="secondary" data-retry-crops>Retry loading crop data</button>';
  return '';
}

function renderGenerator(generated, cropData, field) {
  const loading = cropLoading(cropData);
  if (loading && !generated) return `<section class="generator-preview"><h2>Rotation generation</h2>${loading}<p><a href="#/evidence">See crop-data errors in Evidence</a></p></section>`;
  if (!field || !generated) return '<section class="generator-preview"><h2>Rotation generation</h2><p>Complete the field entries before generating crop sequences.</p><button type="button" class="secondary" data-navigate="/field">Go to My field</button></section>';
  const current = generated.rotations.find(rotation => rotation.is_current);
  const alternatives = generated.rotations.filter(rotation => !rotation.is_current);
  return `<section class="generator-preview"><span class="stage-label">Step 3 · calendar preview</span><h2>Your current rotation is kept.</h2>${loading}<p class="source-note">Source: rotation generator using ${cropData.status === 'error' ? 'your current field entries; crop data are unavailable' : 'the illustrative crop table and your current field entries'}. Calendar windows use the earliest listed sowing months, not dates reported by you. This is not a recommendation.</p>
    ${cropData.errors.length ? '<p class="screen-status">Crop data need attention. <a href="#/evidence">Read the errors in Evidence.</a></p>' : ''}
    <article class="current-rotation"><h3>Your current · retained for comparison</h3><p>${escapeHtml(rotationDescription(current))}</p>${current.warnings.length ? `<ul class="rotation-warnings">${current.warnings.map(reason => `<li>${escapeHtml(reason)}</li>`).join('')}</ul>` : '<p class="small-note">No calendar, soil or equipment warning from these illustrative rules. Water availability has not been checked.</p>'}</article>
    <p>${cropData.status === 'error' ? 'No alternative crop sequences can be generated until crop data load.' : `${alternatives.length} alternative crop sequences pass the calendar, soil and equipment rules. They have not been scored or checked against weather.`}</p>
    <details class="rotation-details"><summary>Generated sequences (${alternatives.length}) · unranked</summary><ol>${alternatives.map(rotation => `<li><p>${escapeHtml(rotationDescription(rotation))}</p><p class="small-note">${SEASONS.filter(season => rotation.seasons[season]).map(season => { const window = rotation.seasons[season]; return `${season}: ${MONTH_NAMES[window.start - 1]}–${MONTH_NAMES[window.end - 1]}`; }).join(' · ')}</p></li>`).join('')}</ol>${alternatives.length ? '' : '<p>No alternative sequence passes these rules.</p>'}</details>
    <details class="rotation-details"><summary>Excluded (${generated.excluded.length}) · with reasons</summary><ol>${generated.excluded.map(rotation => `<li><p>${escapeHtml(rotationDescription(rotation))}</p><ul>${rotation.reasons.map(reason => `<li>${escapeHtml(reason)}</li>`).join('')}</ul></li>`).join('')}</ol>${generated.excluded.length ? '' : '<p>No additional sequences were excluded.</p>'}</details>
    <p class="small-note">Excluded sequences remain visible with reasons. Warnings on your current rotation do not remove it. Option A/B selection and scores arrive in later steps.</p><a href="#/evidence">Review the crop assumptions and source labels</a></section>`;
}

export function renderCompare({ generated = null, cropData = { status: 'loading', crops: [], errors: [] }, field = null } = {}) {
  return pageHeading('05', 'Compare rotations', 'Your current rotation will stay visible beside two alternatives. Excluded choices will have reasons.')
    + `<p class="screen-status"><span class="status-dot" aria-hidden="true"></span>Scores and the three-column comparison are planned for steps 5–7. Generation below is unranked.</p><div class="comparison-grid">${['Your current', 'Option A', 'Option B'].map(comparisonPlaceholder).join('')}</div>${renderGenerator(generated, cropData, field)}<div class="page-actions">${glossaryButton}</div>`;
}

export function renderWhatIf() {
  return pageHeading('06', 'What if?', 'Explore how a change in rain, temperature or available water could affect the comparison.')
    + placeholder('10', 'Scenarios will stay separate from observations.', 'This page will add rain, temperature and irrigation controls, plus a comparison across four historical years. These will be experiments on past weather, not forecasts.');
}

function renderCropEvidence(cropData) {
  const errors = cropData.errors.length ? `<div class="crop-errors" role="alert"><h3>Crop rows skipped or unavailable</h3><ul>${cropData.errors.map(error => `<li>${error.row === null ? 'Crop file' : `Row ${error.row}`}${error.id ? ` (${escapeHtml(error.id)})` : ''}: ${error.messages.map(escapeHtml).join(' ')}</li>`).join('')}</ul></div>` : '';
  return `<section class="evidence-panel crop-evidence"><h2>Crop assumptions</h2><p>Every starter row is illustrative (AI-drafted, not verified). No crop values have been validated by local agronomists. Once confidence is calculated, all starter-based results will be Low because these rows are unverified.</p><div class="season-help" aria-label="Crop term explanations">${[['nitrogen-fixer','Nitrogen fixer'],['cover','Cover crop'],['deep-rooted','Deep-rooted'],['drought-tolerant','Drought-tolerant'],['forage','Forage'],['organic_matter','Organic matter'],['erosion','Erosion control'],['threshold','Temperature threshold']].map(([term,label]) => `<button type="button" class="glossary-link" data-glossary="${term}">${label}</button>`).join('')}</div>${cropLoading(cropData)}${errors}
    ${cropData.status === 'loaded' ? `<p class="source-note">Source: bundled data/crops.json, checked on load. Accepted rows: ${cropData.crops.length}. A valid schema does not mean the values are scientifically verified. Fodder means fodder sorghum.</p><div class="crop-cards">${cropData.crops.map(crop => `<details class="crop-card"><summary><span class="crop-initial" aria-hidden="true">${escapeHtml(crop.name[0])}</span>${escapeHtml(crop.name)} · ${crop.verified ? 'Source supplied' : 'Unverified'}</summary><p class="source-note"><strong>Source for all values in this row:</strong> ${escapeHtml(crop.source_note)}</p><dl>
    <div><dt>Crop ID / plant family</dt><dd>${escapeHtml(crop.id)} / ${escapeHtml(crop.family)}</dd></div>
    <div><dt>Listed seasons</dt><dd>${escapeHtml(crop.seasons.join(', '))}</dd></div>
    <div><dt>Listed sowing months / duration</dt><dd>${crop.start_months.map(month => MONTH_NAMES[month - 1]).join(', ')} / ${crop.duration_months} months</dd></div>
    <div><dt>Water need</dt><dd>${crop.water_need_mm} mm</dd></div>
    <div><dt>Heat / cold threshold</dt><dd>${crop.heat_threshold_c} / ${crop.cold_threshold_c} °C</dd></div>
    <div><dt>Listed soils / equipment</dt><dd>${escapeHtml(crop.soils.join(', '))} / ${escapeHtml(crop.equipment)}</dd></div>
    <div><dt>Crop roles</dt><dd>${escapeHtml(crop.roles.join(', ') || 'No role tag supplied')}</dd></div>
    <div><dt>High nutrient demand / regionally common</dt><dd>${crop.heavy_feeder ? 'Yes' : 'No'} / ${crop.regional_common ? 'Yes' : 'No'}</dd></div>
    ${[['forage','Animal feed'],['n_fixation','Nitrogen fixation'],['erosion_cover','Erosion control'],['organic_matter','Organic matter'],['market','Market']].map(([key,label]) => `<div><dt>${label} (illustrative scale)</dt><dd>${crop[key]} out of 10</dd></div>`).join('')}
    </dl><p>${escapeHtml(crop.how_it_helps_soil)}</p><p class="small-note">${crop.photo.url ? `Photo metadata supplied: ${escapeHtml(crop.photo.credit)} · ${escapeHtml(crop.photo.licence)}` : 'No crop photo is supplied. The initial is a placeholder.'}</p></details>`).join('')}</div>` : ''}
    <p class="small-note">Calendar filtering is implemented. Climate fit, water feasibility, scores, confidence and benefit calculations are not yet implemented.</p></section>`;
}

export function renderEvidence({ cropData = { status: 'loading', crops: [], errors: [] } } = {}) {
  return pageHeading('07', 'Evidence', 'See where the numbers come from, which rules are illustrative and what still needs checking.')
    + renderCropEvidence(cropData)
    + `<section class="evidence-panel"><span class="stage-label">Step 3 · weather and scoring pending</span><h2>No scientific results are loaded.</h2><div class="evidence-row"><h3>Weather history</h3><p>Not connected. Daily weather retrieval is planned for step 4.</p></div><div class="evidence-row"><h3>Long-term weather changes</h3><p>Not connected. Monthly records and trend calculations are planned for step 8.</p></div><div class="evidence-row"><h3>Satellite summaries</h3><p>Not loaded yet. The optional team-supplied dataset is planned for step 9.</p></div><div class="evidence-row"><h3>Crop values and formulas</h3><p>The crop table is validated on load and calendar sequences are generated. All starter values are illustrative and unverified. Weather-based scoring is not implemented yet.</p></div><div class="evidence-row"><h3>Validation boundary</h3><p>Future scores will compare stated rules. Local crop values still need agricultural review. No yield or profit predictions are made.</p></div></section>`;
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
