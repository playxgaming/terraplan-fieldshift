import { FIELD_CHOICES, FIELD_LIMITS, SEASONS, emptyField } from './field.mjs';
import { isDemoPoint, POWER } from './data.mjs';
import { MODEL, PRIORITIES, defaultPriorities } from './engine.mjs';

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
  return `<section class="welcome"><div class="welcome-copy"><p class="eyebrow">FOR SMALL FARMS IN WESTERN INDIA</p><h1>Your field.<br>Your next season.<br><em>Your decision.</em></h1><p class="welcome-purpose">Compare the crops you grow now with two alternatives, using NASA weather evidence and clearly stated rules.</p><p class="welcome-note">Start with your own field or explore an editable demo from Rajkot. NASA weather is available on the climate page; adjust priorities to explore the scoring preview.</p><div class="welcome-actions"><button type="button" class="primary" data-navigate="/field">Start <span aria-hidden="true">→</span></button><button type="button" class="secondary" data-load-demo aria-describedby="demo-status">Load demo farm</button></div><p id="demo-status" class="small-note">The demo fills an editable field. Save it when you are ready.</p>${glossaryButton}</div><aside class="journey-card" aria-label="How planning will work"><span class="stage-label">Build status · step 5 of 12</span><h2>Start with the farm<br>you know.</h2><ol><li><span>01</span><div><strong>Describe your field</strong><p>Your soil, water and current crops.</p></div></li><li><span>02</span><div><strong>Look at the evidence</strong><p>Weather history and its limits.</p></div></li><li><span>03</span><div><strong>Compare your choices</strong><p>Your current plan and two alternatives.</p></div></li></ol><p class="journey-footnote">Scores will be relative comparisons from stated rules. They will not predict yield or profit.</p></aside></section>`;
}

export function renderField({ draft = emptyField(), message = '', storageError = '' } = {}) {
  const error = id => `<span id="error-${id}" class="field-error" hidden></span>`;
  const input = (id, label, value, limit, help = '') => `<div class="form-control"><label for="${id}">${label}</label><input id="${id}" name="${id}" type="number" step="any" min="${limit.min}" max="${limit.max}" required value="${escapeHtml(value)}" aria-describedby="${help ? `${id}-help ` : ''}error-${id}">${help ? `<p id="${id}-help" class="input-help">${help}</p>` : ''}${error(id)}</div>`;
  const select = (id, label, value, options, prompt = 'Choose an option') => `<div class="form-control"><label for="${id}">${label}</label><select id="${id}" name="${id}" required aria-describedby="error-${id}"><option value="">${prompt}</option>${options.map(([key, text]) => `<option value="${key}"${value === key ? ' selected' : ''}>${text}</option>`).join('')}</select>${error(id)}</div>`;
  return pageHeading('02', 'My field', 'Start with your soil, water and the crops you already grow.')
    + `<div class="field-intro"><p><strong>Your entries, your device.</strong> This form saves on this browser only. Coordinates go to NASA only when you choose Load NASA climate on the climate page.</p><button type="button" class="secondary" data-load-demo>Load demo farm</button></div>
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
      <p class="small-note">Save field to keep these entries after a reload. Load climate on the climate page, then open Priorities for the scoring preview.</p>
    </form>`;
}

const sourceLabel = source => ({ live: 'NASA POWER · live response', cache: 'NASA POWER · browser cache', 'demo-bundle': 'NASA POWER · bundled Rajkot records' })[source] ?? 'Not loaded';
const metricValue = (value, unit = '') => value === null || value === undefined ? 'Missing' : `${Number(value.toFixed(2))}${unit ? ` ${unit}` : ''}`;

function renderWeatherProvenance(climateState) {
  const climate = climateState.data;
  if (!climate) return `<section class="evidence-panel weather-provenance"><h2>Weather requests</h2><p>${climateState.status === 'loading' ? 'Loading weather records…' : 'No weather records have been loaded in this session.'}</p>${climateState.error ? `<p role="alert">${escapeHtml(climateState.error)}</p>` : ''}<p>${POWER.grid_note}</p><p>${POWER.soil_note}</p></section>`;
  return `<section class="evidence-panel weather-provenance"><h2>Weather requests and sources</h2><p>Loaded location: ${climate.point.lat}, ${climate.point.lon}. Agricultural year: June ${climate.ag_year}–May ${climate.ag_year + 1}.</p><p>${escapeHtml(climate.grid_note)}</p><p>${escapeHtml(climate.soil_note)}</p>
    ${climate.datasets.map(dataset => `<article><h3>${dataset.kind === 'daily' ? 'Daily weather' : 'Monthly history'} · ${sourceLabel(dataset.source)}</h3><p>Requested range: ${dataset.start}–${dataset.end}. Time standard: ${escapeHtml(dataset.time_standard)}. Retrieved: <time>${escapeHtml(dataset.retrieved_at)}</time>.</p><p><a href="${escapeHtml(dataset.request_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(dataset.request_url)}</a></p>${dataset.fallback_reason ? `<p>Fallback reason: ${escapeHtml(dataset.fallback_reason)}</p>` : ''}<details><summary>Provider parameter metadata</summary><ul>${Object.entries(dataset.parameters).map(([name, metadata]) => `<li>${escapeHtml(name)}: ${escapeHtml(metadata.longname)} · ${escapeHtml(metadata.units)}</li>`).join('')}</ul></details></article>`).join('')}
    ${climate.monthly_error ? `<p class="screen-status">Monthly history unavailable: ${escapeHtml(climate.monthly_error)}</p>` : ''}
    <p>Daily rows: ${climate.daily.length}. Rows with a missing required value: ${climate.missing_days}. Available agricultural years: ${climate.years_available.join(', ') || 'None'}.</p><p>Monthly series: ${climate.monthly ? `${climate.monthly.length} rows; annual month-13 entries excluded` : 'Missing'}. Raw monthly sums and provider units are preserved. Monthly trends are scheduled for step 8.</p>
    <p>Metric rules: sum daily rain; count maximum temperature above the crop heat threshold, minimum temperature below its cold threshold and rain ≥ ${MODEL.heavy_rain_mm} mm; longest consecutive run below ${MODEL.dry_day_mm} mm; mean root-zone wetness. Days with any missing required parameter are excluded from every metric and break dry spells. Partial rain totals are labelled. Crop temperature thresholds are illustrative.</p>
    <p>References: <a href="https://power.larc.nasa.gov/docs/services/api/temporal/daily/" target="_blank" rel="noopener noreferrer">NASA daily API</a> · <a href="https://power.larc.nasa.gov/docs/services/api/temporal/monthly/" target="_blank" rel="noopener noreferrer">NASA monthly API</a>.</p></section>`;
}

export function renderClimate({ field = null, climateState = {status:'idle',data:null,error:'',key:''}, climateMatches = false, metrics = null, generated = null } = {}) {
  const heading = pageHeading('03', 'Your climate (NASA)', 'Weather evidence describes the area around your farm. It is not a measurement from your own field.');
  if (!field) return heading + '<section class="placeholder-panel"><h2>Your field is needed.</h2><p>Complete all field entries before loading weather.</p><button type="button" class="primary" data-navigate="/field">Go to My field</button></section>';
  const loading = climateMatches && climateState.status === 'loading';
  const climate = climateMatches ? climateState.data : null;
  const current = generated?.rotations.find(rotation => rotation.is_current);
  return heading + `<section class="climate-loader"><h2>Load weather for your field</h2><p>Load NASA climate sends your coordinates, rounded to two decimal places, to NASA POWER. Successful records are cached on this browser. If NASA is unavailable, the app tries the cache, then matching Rajkot demo files.</p><div class="welcome-actions"><button type="button" class="primary" data-load-climate="auto"${loading ? ' disabled' : ''}>${loading ? 'Loading NASA climate…' : climateMatches && climateState.status === 'error' ? 'Retry loading NASA climate' : 'Load NASA climate'}</button>${isDemoPoint(field) ? `<button type="button" class="secondary" data-load-climate="bundle"${loading ? ' disabled' : ''}>Use bundled demo data</button>` : ''}</div><p class="small-note">Bundled demo mode makes no NASA request. It needs the app files to be served locally or already available in your browser. Requests time out after ${POWER.timeout_ms / 1000} seconds.</p></section>
    ${loading ? '<p class="screen-status" role="status">Loading daily and monthly records. Fallback sources will be labelled.</p>' : ''}
    ${climateMatches && climateState.error ? `<p class="storage-error" role="alert">${escapeHtml(climateState.error)}</p>` : ''}
    ${!climateMatches && climateState.data ? '<p class="screen-status">The loaded weather belongs to another location or agricultural year. Load weather for your current field to see its metrics.</p>' : ''}
    ${climate ? `<section class="climate-preview"><span class="stage-label">Step 4 · data preview</span><h2>${sourceLabel(climate.source)}</h2><p>June ${climate.ag_year}–May ${climate.ag_year + 1}. Retrieved: <time>${escapeHtml(climate.retrieved_at)}</time>.</p><p>${escapeHtml(climate.grid_note)}</p><p>${escapeHtml(climate.soil_note)}</p>${climate.warnings.map(warning => `<p class="screen-status">${escapeHtml(warning)}</p>`).join('')}${climate.monthly_error ? `<p class="screen-status">Daily weather is available. Monthly history could not be loaded; see Evidence for details.</p>` : ''}
      <p class="source-note">The crop windows and heat/cold thresholds below come from the illustrative crop table and your current rotation. Confirm actual sowing and harvest dates locally. These metrics are not scores or recommendations.</p><div class="season-climate-grid">${metrics && current ? SEASONS.map(season => {
        const window = current.seasons[season], values = metrics[season];
        if (!window) return `<article class="season-climate"><h3>${season} · Bare</h3><p>No crop window; no crop-climate metrics calculated.</p></article>`;
        return `<article class="season-climate"><h3>${season} · ${escapeHtml(window.crop.name)}</h3><p class="source-note">Source: ${sourceLabel(climate.source)}. Crop thresholds: illustrative.</p>${values.start_date ? `<p>${values.start_date}–${values.end_date}</p>` : ''}<dl>${[['rain_mm',values.missing ? 'Rain (partial total)' : 'Rain total','mm'],['heat_days','Hot days','days'],['cold_days','Cold days','days'],['dry_spell_max','Longest known dry spell','days'],['heavy_rain','Heavy-rain days','days'],['soil_wet_mean','Root-zone wetness (model)',''],['days','Complete days used','days'],['missing','Missing days','days']].map(([key,label,unit]) => `<div><dt>${label}</dt><dd>${metricValue(values[key],unit)}</dd></div>`).join('')}</dl>${values.reason ? `<p class="small-note">${escapeHtml(values.reason)}</p>` : ''}</article>`;
      }).join('') : '<p>Crop data are needed to calculate the current crop windows.</p>'}</div>
      <div class="season-help">${[['dry_spell','Dry spell'],['heavy_rain','Heavy rain'],['soil_wetness','Soil wetness'],['resolution','Grid and resolution']].map(([term,label]) => `<button class="glossary-link" type="button" data-glossary="${term}">${label}</button>`).join('')}</div><p class="small-note">Full climate cards and long-term trends are scheduled for step 8.</p><a href="#/evidence">See request URLs, retrieval times and data limitations</a></section>` : ''}`;
}

function scoreRow(rotation, current = false) {
  const score = value => value === null ? 'Not scored' : `${Number(value.toFixed(2))} / 100`;
  return `<article class="ranking-row${current ? ' ranking-current' : ''}" data-rotation-id="${escapeHtml(rotation.id)}"><h3>${current ? 'Your current · ' : ''}${escapeHtml(rotationDescription(rotation))}</h3><div class="score-line"><strong>Total: ${score(rotation.total)}</strong><span class="feasibility-label">${escapeHtml(rotation.feasibility_label)}</span><span>Confidence: ${rotation.confidence.level}</span></div>
    <p class="small-note">Climate fit: ${score(rotation.climate_fit)} · Priority score: ${score(rotation.priority_score)} · Rule adjustment: ${rotation.rule_adjust > 0 ? '+' : ''}${rotation.rule_adjust}</p>
    ${rotation.unscored_reasons.map(reason => `<p class="screen-status">${escapeHtml(reason)}</p>`).join('')}
    <details><summary>Reasons and season calculations</summary>
      <h4>Water feasibility</h4>${rotation.feasibility_reasons.length ? `<ul>${rotation.feasibility_reasons.map(reason => `<li>${escapeHtml(reason)}</li>`).join('')}</ul>` : '<p>Every active season passes the water-gap rule. This does not establish local suitability.</p>'}
      <h4>Confidence reasons</h4><ul>${rotation.confidence.reasons.map(reason => `<li>${escapeHtml(reason)}</li>`).join('')}</ul>
      <h4>Rule adjustments · illustrative</h4>${rotation.rule_reasons.length ? `<ul>${rotation.rule_reasons.map(reason => `<li>${escapeHtml(reason.text)}</li>`).join('')}</ul>` : '<p>No rule adjustment applies.</p>'}
      ${rotation.warnings.length ? `<h4>Current-rotation warnings</h4><ul>${rotation.warnings.map(reason => `<li>${escapeHtml(reason)}</li>`).join('')}</ul>` : ''}
      <h4>Per-season inputs and fits</h4>${SEASONS.map(season => {
        const fit = rotation.season_fits[season], data = rotation.season_metrics[season];
        return fit ? `<p>${season}: rain ${metricValue(data.rain_mm,'mm')}; ${data.days} complete days; missing ${data.missing ?? 'unknown'} days; effective rain ${metricValue(fit.effective_rain,'mm')}; usable water ${metricValue(fit.usable_water,'mm')}; water gap ${metricValue(fit.water_gap,'mm')}; water / heat / cold fit ${metricValue(fit.water_fit)} / ${metricValue(fit.heat_fit)} / ${metricValue(fit.cold_fit)}; season fit ${metricValue(fit.season_fit)}. ${escapeHtml(fit.reason)}</p>` : `<p>${season}: Bare; omitted from climate fit and counted as zero in crop-attribute priorities.</p>`;
      }).join('')}
    </details></article>`;
}

export function renderRankingPreview(scoring) {
  if (!scoring) return '<p>Complete the field entries and load matching weather on Your climate to calculate scores.</p><button type="button" class="secondary" data-navigate="/climate">Go to Your climate</button>';
  return `<h2>Ranking preview</h2><p class="source-note">Source: stated comparison formulas, loaded NASA POWER daily records, your irrigation entries and illustrative crop values. Scores are relative comparisons, not yield or profit predictions.</p><p>${escapeHtml(scoring.selection_note)}</p>
    ${scoring.current ? scoreRow(scoring.current,true) : ''}
    <h3 class="ranking-list-title">All alternatives · highest total score first</h3><p class="small-note">Infeasible alternatives stay visible with their label. Missing totals appear last and cannot fill comparison places. Confidence describes the inputs, not guaranteed crop suitability.</p>
    <ol class="ranking-list">${scoring.ranked.map(rotation => `<li>${scoreRow(rotation)}</li>`).join('')}</ol>${scoring.ranked.length ? '' : '<p>No alternative sequences are available.</p>'}
    <details class="rotation-details"><summary>Excluded (${scoring.excluded.length}) · with reasons</summary><ol>${scoring.excluded.map(rotation => `<li><p>${escapeHtml(rotationDescription(rotation))}</p><ul>${rotation.reasons.map(reason => `<li>${escapeHtml(reason)}</li>`).join('')}</ul></li>`).join('')}</ol></details>`;
}

export function renderPriorities({ priorities = defaultPriorities(), scoring = null, field = null, climateState = {data:null}, climateMatches = false } = {}) {
  return pageHeading('04', 'Priorities', 'Tell TerraPlan what matters to your farm. The relative ranking updates as you move a slider.')
    + `<div class="priority-layout"><section class="priority-panel"><h2>Your priorities</h2><p>Weights are your choices: ${MODEL.priority_min} means ignore this priority; ${MODEL.priority_max} gives it the most weight. These choices stay in this tab while you navigate. Reloading restores the default weights.</p><div class="priority-grid">${PRIORITIES.map(({key,label,description}) => `<div class="priority-control"><label for="priority-${key}">${label} <span><output id="weight-${key}" for="priority-${key}">${priorities[key]}</output> / ${MODEL.priority_max}</span></label><input type="range" id="priority-${key}" data-priority="${key}" min="${MODEL.priority_min}" max="${MODEL.priority_max}" step="1" value="${priorities[key]}" aria-describedby="help-${key} priority-error"><p id="help-${key}" class="input-help">${description}</p></div>`).join('')}</div><p id="priority-error" class="field-error" role="alert"></p><button type="button" class="secondary" data-reset-priorities>Reset priorities</button><p class="small-note">If all weights are zero, the priority component uses ${MODEL.priority_zero_score} / ${MODEL.score_max}; climate fit and rule adjustments still apply. Market scores are illustrative and contain no local price data.</p><div class="season-help">${[['priority','Priority weight'],['confidence','Confidence'],['feasibility','Water feasibility'],['effective_rain','Effective rain']].map(([term,label]) => `<button class="glossary-link" type="button" data-glossary="${term}">${label}</button>`).join('')}</div></section>
    <div class="ranking-column"><p id="ranking-status" class="field-status" role="status">${scoring ? 'Ranking is ready. Move a slider to update it.' : 'Load your field and matching climate data to calculate a ranking.'}</p>
    ${scoring && climateState.data ? `<p class="source-note">Climate source: ${sourceLabel(climateState.data.source)} · June ${climateState.data.ag_year}–May ${climateState.data.ag_year + 1}. Current starter-based scores have Low confidence because the crop values are unverified.</p>` : !field ? '<p class="screen-status">Complete your field entries first.</p>' : !climateMatches ? '<p class="screen-status">Matching weather is not loaded. Old weather from another point is not used.</p>' : ''}
    <section id="ranking-preview" class="ranking-preview">${renderRankingPreview(scoring)}</section></div></div>`;
}

function renderModelEvidence() {
  return `<section class="evidence-panel model-evidence"><h2>Scoring formulas and constants</h2><p>Source: the project specification. These are illustrative comparison rules, not a validated crop-yield or profit model. All starter crop values are unverified, so all starter-based confidence labels are Low.</p><dl class="model-constants">${Object.entries(MODEL).map(([key,value]) => `<div><dt>${key}</dt><dd>${value} · illustrative</dd></div>`).join('')}</dl>
    <ul class="formula-list"><li>Effective rain = rain × ${MODEL.effective_rain_factor}; usable water = effective rain + irrigation; water fit = min(${MODEL.score_max}, usable water ÷ crop water need × ${MODEL.score_max}).</li>
    <li>Heat fit = ${MODEL.score_max} × (1 − heat days ÷ complete days); cold fit = ${MODEL.score_max} × (1 − cold days ÷ complete days); season fit = mean(water fit, heat fit, cold fit).</li>
    <li>Climate fit = ${MODEL.climate_mean_weight} × mean(active season fits) + ${MODEL.climate_min_weight} × minimum(active season fits). Bare seasons are omitted. If any active window has no fit, the total is unavailable.</li>
    <li>Crop-attribute priority = sum of the attribute over all three slots ÷ 3 × 10. Bare slots count as 0. Water priority = ${MODEL.score_max} − total water need ÷ maximum rotation water need × ${MODEL.score_max}; the maximum covers all retained rotations, including the current one.</li>
    <li>Priority score = sum(weight × priority value) ÷ sum(weights); all-zero weights use ${MODEL.priority_zero_score}.</li>
    <li>Rule adjustment = −${MODEL.penalty_same_family} per consecutive same-family pair; +${MODEL.bonus_nfixer_after_heavy} per nitrogen fixer directly after a crop with high nutrient demand; −${MODEL.penalty_bare_when_possible} per Bare season where an allowed crop window could reach water fit ≥ ${MODEL.cover_possible_fit}. Adjacent pairs include zaid → next kharif; Bare breaks adjacency. Cover possibility is checked across retained, field-allowed calendars and is independent of priorities.</li>
    <li>Total = clamp(${MODEL.score_min}, ${MODEL.score_max}, ${MODEL.climate_weight} × climate fit + ${MODEL.priority_weight} × priority score + rule adjustment).</li>
    <li>Water gap = max(0, crop water need − usable water). A season fails if its gap exceeds ${MODEL.infeasible_gap * 100}% of need. Infeasible alternatives remain listed; comparison candidates prefer passing alternatives, then use the best infeasible ones if fewer than two pass. Missing totals are not selected.</li>
    <li>High confidence: complete windows, a soil test and all crops verified/regionally common. Medium: the same with soil type only. Low: missing weather, unavailable crop data, non-regional crops, off-season/start-month choices or unverified crop values. Reasons accompany every label.</li></ul><p>Partial-data fits use complete days only and carry missing-day warnings. An unknown climate window is not assigned a neutral score. Every adjustment is listed with its reason in the ranking preview. Full three-column explanations, benefits and local-check sections arrive in step 6.</p></section>`;
}

function comparisonPlaceholder(title) {
  return `<article class="comparison-placeholder"><p class="column-label">${title}</p><h2>Not calculated yet</h2><p class="score-placeholder">This column is not connected yet. Use Priorities for scores and confidence.</p><dl><div><dt>Why</dt><dd>Full explanations for this column arrive in step 6.</dd></div><div><dt>Evidence (NASA numbers)</dt><dd>Weather evidence is not connected to these comparison columns yet.</dd></div><div><dt>Benefits</dt><dd>No benefit has been calculated.</dd></div><div><dt>Information gaps</dt><dd>Review field, crop and weather assumptions. The full explanation layout arrives in step 6.</dd></div><div><dt>Check locally (KVK / agri officer)</dt><dd>Ask for local advice before changing your farm plan.</dd></div></dl></article>`;
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
    <article class="current-rotation"><h3>Your current · retained for comparison</h3><p>${escapeHtml(rotationDescription(current))}</p>${current.warnings.length ? `<ul class="rotation-warnings">${current.warnings.map(reason => `<li>${escapeHtml(reason)}</li>`).join('')}</ul>` : '<p class="small-note">No calendar, soil or equipment warning from these illustrative rules. This calendar preview does not check water availability; use Priorities after loading weather.</p>'}</article>
    <p>${cropData.status === 'error' ? 'No alternative crop sequences can be generated until crop data load.' : `${alternatives.length} alternative crop sequences pass the calendar, soil and equipment rules. No scores are displayed in this calendar preview. Open Priorities to calculate a ranking after loading matching weather.`}</p>
    <details class="rotation-details"><summary>Generated sequences (${alternatives.length}) · unranked</summary><ol>${alternatives.map(rotation => `<li><p>${escapeHtml(rotationDescription(rotation))}</p><p class="small-note">${SEASONS.filter(season => rotation.seasons[season]).map(season => { const window = rotation.seasons[season]; return `${season}: ${MONTH_NAMES[window.start - 1]}–${MONTH_NAMES[window.end - 1]}`; }).join(' · ')}</p></li>`).join('')}</ol>${alternatives.length ? '' : '<p>No alternative sequence passes these rules.</p>'}</details>
    <details class="rotation-details"><summary>Excluded (${generated.excluded.length}) · with reasons</summary><ol>${generated.excluded.map(rotation => `<li><p>${escapeHtml(rotationDescription(rotation))}</p><ul>${rotation.reasons.map(reason => `<li>${escapeHtml(reason)}</li>`).join('')}</ul></li>`).join('')}</ol>${generated.excluded.length ? '' : '<p>No additional sequences were excluded.</p>'}</details>
    <p class="small-note">Excluded sequences remain visible with reasons. Warnings on your current rotation do not remove it. The scoring preview is on Priorities; the full Option A/B display arrives in step 6.</p><a href="#/evidence">Review the crop assumptions and source labels</a></section>`;
}

export function renderCompare({ generated = null, cropData = { status: 'loading', crops: [], errors: [] }, field = null } = {}) {
  return pageHeading('05', 'Compare rotations', 'Your current rotation will stay visible beside two alternatives. Excluded choices will have reasons.')
    + `<p class="screen-status"><span class="status-dot" aria-hidden="true"></span>The three-column comparison is scheduled for step 6. The calendar list below is unranked; use Priorities for the scoring preview.</p><div class="comparison-grid">${['Your current', 'Option A', 'Option B'].map(comparisonPlaceholder).join('')}</div>${renderGenerator(generated, cropData, field)}<div class="page-actions">${glossaryButton}</div>`;
}

export function renderWhatIf() {
  return pageHeading('06', 'What if?', 'Explore how a change in rain, temperature or available water could affect the comparison.')
    + placeholder('10', 'Scenarios will stay separate from observations.', 'This page will add rain, temperature and irrigation controls, plus a comparison across four historical years. These will be experiments on past weather, not forecasts.');
}

function renderCropEvidence(cropData) {
  const errors = cropData.errors.length ? `<div class="crop-errors" role="alert"><h3>Crop rows skipped or unavailable</h3><ul>${cropData.errors.map(error => `<li>${error.row === null ? 'Crop file' : `Row ${error.row}`}${error.id ? ` (${escapeHtml(error.id)})` : ''}: ${error.messages.map(escapeHtml).join(' ')}</li>`).join('')}</ul></div>` : '';
  return `<section class="evidence-panel crop-evidence"><h2>Crop assumptions</h2><p>Every starter row is illustrative (AI-drafted, not verified). No crop values have been validated by local agronomists. All starter-based results are Low because these rows are unverified.</p><div class="season-help" aria-label="Crop term explanations">${[['nitrogen-fixer','Nitrogen fixer'],['cover','Cover crop'],['deep-rooted','Deep-rooted'],['drought-tolerant','Drought-tolerant'],['forage','Forage'],['organic_matter','Organic matter'],['erosion','Erosion control'],['threshold','Temperature threshold']].map(([term,label]) => `<button type="button" class="glossary-link" data-glossary="${term}">${label}</button>`).join('')}</div>${cropLoading(cropData)}${errors}
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
    <p class="small-note">Calendar filtering, climate fit, water feasibility, scores and confidence are implemented. Benefit badges and full comparison explanations arrive in step 6.</p></section>`;
}

export function renderEvidence({ cropData = { status: 'loading', crops: [], errors: [] }, climateState = {status:'idle',data:null,error:''} } = {}) {
  return pageHeading('07', 'Evidence', 'See where the numbers come from, which rules are illustrative and what still needs checking.')
    + renderCropEvidence(cropData)
    + renderWeatherProvenance(climateState)
    + renderModelEvidence()
    + `<section class="evidence-panel"><span class="stage-label">Step 5 · scoring preview</span><h2>Model and integration status</h2><div class="evidence-row"><h3>Weather history</h3><p>Daily POWER loading, caching and Rajkot fallback are available on the climate page. Loaded sources and request URLs appear above.</p></div><div class="evidence-row"><h3>Long-term weather changes</h3><p>Monthly records are fetched with provenance. Trend calculations and full climate cards are scheduled for step 8.</p></div><div class="evidence-row"><h3>Satellite summaries</h3><p>Not loaded yet. The optional team-supplied dataset is planned for step 9.</p></div><div class="evidence-row"><h3>Crop values and formulas</h3><p>The crop table is validated on load and calendar sequences are generated. All starter values are illustrative and unverified. The Priorities page scores retained rotations using loaded weather, your weights and the stated rules.</p></div><div class="evidence-row"><h3>Validation boundary</h3><p>Future scores will compare stated rules. Local crop values still need agricultural review. No yield or profit predictions are made.</p></div></section>`;
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
