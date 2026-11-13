import { FIELD_CHOICES, FIELD_LIMITS, SEASONS, emptyField } from './field.mjs';
import { isDemoPoint, POWER } from './data.mjs';
import { MODEL, PRIORITIES, defaultPriorities, benefitBadges, rotationAdvice } from './engine.mjs';

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
  return `<section class="welcome"><div class="welcome-copy"><p class="eyebrow">FOR SMALL FARMS IN WESTERN INDIA</p><h1>Your field.<br>Your next season.<br><em>Your decision.</em></h1><p class="welcome-purpose">Compare the crops you grow now with two alternatives, using NASA weather evidence and clearly stated rules.</p><p class="welcome-note">Start with your own field or explore an editable demo from Rajkot. NASA weather is available on the climate page; adjust priorities to explore the scoring preview.</p><div class="welcome-actions"><button type="button" class="primary" data-navigate="/field">Start <span aria-hidden="true">→</span></button><button type="button" class="secondary" data-load-demo aria-describedby="demo-status">Load demo farm</button></div><p id="demo-status" class="small-note">The demo fills an editable field. Save it when you are ready.</p>${glossaryButton}</div><aside class="journey-card" aria-label="How planning will work"><span class="stage-label">Build status · step 6 of 12</span><h2>Start with the farm<br>you know.</h2><ol><li><span>01</span><div><strong>Describe your field</strong><p>Your soil, water and current crops.</p></div></li><li><span>02</span><div><strong>Look at the evidence</strong><p>Weather history and its limits.</p></div></li><li><span>03</span><div><strong>Compare your choices</strong><p>Your current plan and two alternatives.</p></div></li></ol><p class="journey-footnote">Scores will be relative comparisons from stated rules. They will not predict yield or profit.</p></aside></section>`;
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
    <li>High confidence: complete windows, a soil test and all crops verified/regionally common. Medium: the same with soil type only. Low: missing weather, unavailable crop data, non-regional crops, off-season/start-month choices or unverified crop values. Reasons accompany every label.</li></ul><p>Benefit rules: water need ≤ ${MODEL.benefit_water_ratio * 100}% of current; a nitrogen-fixer role; no adjacent same-family pair plus a family new to current; a cover/deep-rooted role plus fewer assumed bare months; market priority ≥ current + ${MODEL.benefit_market_gain}. All use illustrative crop assumptions, not measured outcomes. Unknown calendars prevent a cover-month comparison.</p><p>Partial-data fits use complete days only and carry missing-day warnings. An unknown climate window is not assigned a neutral score. Every adjustment is listed with its reason in the ranking preview. Compare shows the current rotation and two derived alternatives with benefit rules, gaps and local checks. The timeline remains step 7.</p></section>`;
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

const listHtml = items => `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
const totalLabel = value => value == null ? 'Not scored' : `${Number(value.toFixed(2))} / 100`;

function cropSummary(rotation) {
  return `<ol class="comparison-crops">${SEASONS.map(season => {
    const window = rotation.seasons[season];
    if (!window) return `<li><span class="crop-initial" aria-hidden="true">—</span><div><strong>${season} · Bare</strong><p>No crop in this season.</p></div></li>`;
    const crop = window.crop, dates = window.start && window.end ? `${MONTH_NAMES[window.start - 1]}–${MONTH_NAMES[window.end - 1]}` : 'Calendar unavailable';
    const visual = crop.photo?.url ? `<img class="comparison-crop-photo" src="${escapeHtml(crop.photo.url)}" alt="${escapeHtml(crop.name)}" loading="lazy">` : `<span class="crop-initial" aria-hidden="true">${escapeHtml(crop.name[0])}</span>`;
    return `<li>${visual}<div><strong>${season} · ${escapeHtml(crop.name)}</strong><p>${dates} · assumed sowing–harvest window</p><p class="small-note">${crop.photo?.url ? `${escapeHtml(crop.photo.credit)} · ${escapeHtml(crop.photo.licence)}` : 'Initial placeholder; no crop photo supplied.'}</p></div></li>`;
  }).join('')}</ol>`;
}

function renderComparisonColumn(label,rotation,current,field,climate) {
  const section = (name,content) => `<section class="comparison-explanation" data-explanation="${escapeHtml(name)}"><h3>${name}</h3>${content}</section>`;
  if (!rotation) return `<article class="comparison-column comparison-empty" data-comparison="${label}"><h2>${label}</h2><p>Not available</p>
    ${section('Why','<p>No scored rotation is selected for this place. Fewer than two scored alternatives may be available, or matching field/weather inputs are still needed.</p>')}
    ${section('Evidence (NASA numbers)','<p>No crop window is selected here; no NASA numbers are shown.</p>')}
    ${section('Benefits','<p>No benefit badge is calculated for an empty place.</p>')}
    ${section('Information gaps','<p>A valid crop calendar and matching weather are needed before this place can be filled.</p>')}
    ${section('Check locally (KVK / agri officer)','<p>Ask your KVK about locally suitable crops and water availability. An empty place is not a crop recommendation.</p>')}</article>`;
  const badges = benefitBadges(rotation,current ?? rotation), advice = rotationAdvice(rotation,field,climate);
  const why = [rotation.is_current ? 'Your current rotation is the baseline and stays visible even when it breaks a rule.' : 'Selected using your current priority weights. Alternatives passing the water-gap rule are preferred; an infeasible fallback keeps its warning.'];
  if (rotation.total != null) why.push(`Relative total ${Number(rotation.total.toFixed(2))}: climate fit ${Number(rotation.climate_fit.toFixed(2))}, priority component ${Number(rotation.priority_score.toFixed(2))}, rule adjustment ${rotation.rule_adjust > 0 ? '+' : ''}${rotation.rule_adjust}. Source: illustrative comparison formulas.`);
  else why.push('Matching climate or crop data are missing; a total score is not invented.');
  why.push(...(rotation.rule_reasons ?? []).map(reason => reason.text));
  const evidence = climate && rotation.season_metrics ? `<p class="source-note">${sourceLabel(climate.source)} · ${escapeHtml(climate.retrieved_at)}. ${escapeHtml(climate.grid_note)}</p>${SEASONS.map(season => {
    if (!rotation.seasons[season]) return `<p>${season}: Bare; no crop-window climate metrics.</p>`;
    const values = rotation.season_metrics[season], fit = rotation.season_fits[season];
    return `<div class="comparison-season-evidence"><h4>${season}</h4><p>${values.start_date ? `${values.start_date}–${values.end_date}` : 'Calendar unavailable'}</p><dl>${[['Rain'+(values.missing?' (partial total)':''),metricValue(values.rain_mm,'mm')],['Heat / cold days',`${metricValue(values.heat_days)} / ${metricValue(values.cold_days)}`],['Longest known dry spell',metricValue(values.dry_spell_max,'days')],['Heavy-rain days',metricValue(values.heavy_rain,'days')],['Root-zone wetness (model)',metricValue(values.soil_wet_mean)],['Complete / missing days',`${values.days} / ${values.missing ?? 'unknown'}`]].map(([name,value]) => `<div><dt>${name}</dt><dd>${value}</dd></div>`).join('')}</dl><p class="small-note">Model-derived usable water ${metricValue(fit.usable_water,'mm')}; water gap ${metricValue(fit.water_gap,'mm')}. Rain fraction and crop need/temperature thresholds are illustrative; irrigation is your entry.</p></div>`;
  }).join('')}<p class="small-note">${escapeHtml(climate.soil_note)}</p>` : '<p>Matching NASA weather is not loaded, or crop-window metrics are unavailable. No weather value is shown as zero.</p>';
  return `<article class="comparison-column" data-comparison="${label}" data-rotation-id="${escapeHtml(rotation.id)}"><h2>${label}</h2>${cropSummary(rotation)}<div class="comparison-score"><strong>${totalLabel(rotation.total)}</strong><span>Relative score · illustrative rules</span></div><p class="feasibility-label">${escapeHtml(rotation.feasibility_label ?? 'Water feasibility unknown')}</p>
    <details class="comparison-confidence"><summary>Confidence: ${rotation.confidence?.level ?? 'Unavailable'} · reasons</summary>${rotation.confidence ? listHtml(rotation.confidence.reasons) : '<p>Confidence needs matching crop and climate inputs.</p>'}</details>
    ${(rotation.warnings ?? []).length ? `<div class="rotation-warnings" role="note"><strong>Current-rotation warnings</strong>${listHtml(rotation.warnings)}</div>` : ''}
    ${(rotation.feasibility_reasons ?? []).length ? `<div class="comparison-water-reasons">${listHtml(rotation.feasibility_reasons)}</div>` : ''}
    ${section('Why',listHtml(why))}
    ${section('Evidence (NASA numbers)',evidence)}
    ${section('Benefits',`<p class="small-note">Source: illustrative crop-table roles, attributes and calendar rules, compared with current. These are potential benefits, not measured outcomes.</p><div class="benefit-badges">${badges.map(badge => `<details class="benefit-badge"><summary title="${escapeHtml(badge.explanation)}">${badge.label}</summary><p>${escapeHtml(badge.explanation)}</p></details>`).join('')}</div>${badges.length ? '' : '<p>No badge meets the stated comparison rules with the available inputs.</p>'}`)}
    ${section('Information gaps',listHtml(advice.gaps))}
    ${section('Check locally (KVK / agri officer)',listHtml(advice.checks))}<div class="season-help"><button type="button" class="glossary-link" data-glossary="benefit">Benefit badges</button><button type="button" class="glossary-link" data-glossary="infiltration">Infiltration</button></div></article>`;
}

export const ROTATION_SORT_COLUMNS = Object.freeze([
  {key:'name',label:'Rotation'}, {key:'total',label:'Total'}, {key:'climate_fit',label:'Climate fit'},
  {key:'priority_score',label:'Priority score'}, {key:'water_need_mm',label:'Crop water need (mm)'},
  {key:'feasible',label:'Water check'}, {key:'confidence',label:'Confidence'},
].map(Object.freeze));

export function tableDataFor(scoring,generated) {
  if (scoring) return { ...scoring, has_scores:true };
  return generated ? {current:generated.rotations.find(row => row.is_current),ranked:generated.rotations.filter(row => !row.is_current),options:[],excluded:generated.excluded,has_scores:false} : null;
}

export function sortedRotationRows(data,sort = {key:'total',direction:'desc'}) {
  if (!data) return [];
  const key = ROTATION_SORT_COLUMNS.some(column => column.key === sort.key) ? sort.key : 'total';
  const direction = sort.direction === 'asc' ? 1 : -1;
  const value = row => key === 'name' ? rotationDescription(row).toLowerCase() : key === 'confidence' ? ({Low:0,Medium:1,High:2})[row.confidence?.level] ?? null : key === 'feasible' ? row.feasible == null ? null : Number(row.feasible) : row[key] ?? null;
  return [data.current,...data.ranked].filter(Boolean).sort((a,b) => {
    const left = value(a), right = value(b);
    if (left === null && right !== null) return 1;
    if (right === null && left !== null) return -1;
    return (left < right ? -1 : left > right ? 1 : 0) * direction || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  });
}

export function renderRotationsTable(data,sort = {key:'total',direction:'desc'}) {
  if (!data) return '<p>Complete your field to list retained rotations.</p>';
  const rows = sortedRotationRows(data,sort);
  return `<div class="rotations-table-scroll" role="region" aria-label="All rotations table, scroll horizontally on a small screen" tabindex="0"><table class="rotations-table"><caption>${rows.length} retained rotations, including current. ${data.has_scores ? 'Source: loaded NASA weather, your entries and illustrative crop/model values.' : 'Source: generated calendars and crop assumptions. Numerical scores await matching weather.'} Missing values stay last in either sort direction.</caption><thead><tr>${ROTATION_SORT_COLUMNS.map(column => `<th scope="col" aria-sort="${sort.key === column.key ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'}"><button type="button" data-sort-rotations="${column.key}">${column.label}${sort.key === column.key ? sort.direction === 'asc' ? ' ↑' : ' ↓' : ''}</button></th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr data-rotation-id="${escapeHtml(row.id)}"><th scope="row"><span>${row.is_current ? 'Your current' : data.options[0]?.id === row.id ? 'Option A' : data.options[1]?.id === row.id ? 'Option B' : 'Alternative'}</span>${escapeHtml(rotationDescription(row))}</th><td>${totalLabel(row.total)}</td><td>${metricValue(row.climate_fit)}</td><td>${metricValue(row.priority_score)}</td><td>${metricValue(row.water_need_mm)}</td><td>${escapeHtml(row.feasibility_label ?? 'Unknown')}</td><td>${row.confidence?.level ?? 'Unavailable'}</td></tr>`).join('')}</tbody></table></div>`;
}

export function renderCompare({ generated = null, cropData = {status:'loading',crops:[],errors:[]}, field = null, scoring = null, climateState = {data:null}, climateMatches = false, comparisonSort = {key:'total',direction:'desc'} } = {}) {
  const current = scoring?.current ?? generated?.rotations.find(row => row.is_current) ?? null;
  const climate = climateMatches ? climateState.data : null;
  const tableData = tableDataFor(scoring,generated), excluded = scoring?.excluded ?? generated?.excluded ?? [];
  return pageHeading('05','Compare rotations','Your current rotation stays visible beside two alternatives, with the evidence, trade-offs and checks behind each choice.')
    + `<p class="screen-status">${scoring ? escapeHtml(scoring.selection_note) : 'Scores and alternatives need a complete field, valid crop data and matching weather. Your current inputs stay visible below.'} Scores are relative comparisons from stated rules, not yield or profit predictions.</p>
    ${cropData.status !== 'loaded' ? cropLoading(cropData) : ''}${cropData.errors.length ? '<p class="screen-status">Some crop data are unavailable or invalid. <a href="#/evidence">See the errors in Evidence.</a></p>' : ''}
    <div class="page-actions"><button type="button" class="secondary" data-navigate="/field">Edit My field</button><button type="button" class="secondary" data-navigate="/climate">Load or review climate</button><button type="button" class="secondary" data-navigate="/priorities">Adjust priorities</button></div>
    ${scoring ? `<p class="source-note">Climate source: ${sourceLabel(climate.source)} · agricultural year ${climate.ag_year}–${climate.ag_year + 1}. Retrieved: ${escapeHtml(climate.retrieved_at)}. Weights: ${PRIORITIES.map(({key,label}) => `${label} ${scoring.weights[key]}`).join(' · ')}. Review crop assumptions and verification status on Evidence.</p>` : ''}
    <div class="comparison-grid">${renderComparisonColumn('Your current',current,current,field,climate)}${renderComparisonColumn('Option A',scoring?.options[0],current,field,climate)}${renderComparisonColumn('Option B',scoring?.options[1],current,field,climate)}</div>
    <details class="rotation-details" id="all-rotations"><summary>See all rotations · sortable table</summary><p id="table-sort-status" role="status">Select a column heading to change the sort.</p><div id="rotations-table-region">${renderRotationsTable(tableData,comparisonSort)}</div></details>
    <details class="rotation-details"><summary>Excluded (${excluded.length}) · with reasons</summary>${excluded.length ? `<ol>${excluded.map(row => `<li><p>${escapeHtml(rotationDescription(row))}</p>${listHtml(row.reasons)}</li>`).join('')}</ol>` : '<p>No excluded calendars are available for these inputs.</p>'}</details><p class="small-note">Crop windows use listed months, not actual dates reported by you. Timelines and vulnerable-window markers arrive in step 7.</p>`;
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
    <p class="small-note">Calendar filtering, climate fit, water feasibility, scores and confidence are implemented. Benefit badges and full comparison explanations are available on Compare.</p></section>`;
}

export function renderEvidence({ cropData = { status: 'loading', crops: [], errors: [] }, climateState = {status:'idle',data:null,error:''} } = {}) {
  return pageHeading('07', 'Evidence', 'See where the numbers come from, which rules are illustrative and what still needs checking.')
    + renderCropEvidence(cropData)
    + renderWeatherProvenance(climateState)
    + renderModelEvidence()
    + `<section class="evidence-panel"><span class="stage-label">Step 6 · full comparison</span><h2>Model and integration status</h2><div class="evidence-row"><h3>Weather history</h3><p>Daily POWER loading, caching and Rajkot fallback are available on the climate page. Loaded sources and request URLs appear above.</p></div><div class="evidence-row"><h3>Long-term weather changes</h3><p>Monthly records are fetched with provenance. Trend calculations and full climate cards are scheduled for step 8.</p></div><div class="evidence-row"><h3>Satellite summaries</h3><p>Not loaded yet. The optional team-supplied dataset is planned for step 9.</p></div><div class="evidence-row"><h3>Crop values and formulas</h3><p>The crop table is validated on load and calendar sequences are generated. All starter values are illustrative and unverified. The Priorities page scores retained rotations using loaded weather, your weights and the stated rules.</p></div><div class="evidence-row"><h3>Validation boundary</h3><p>Scores compare stated rules. Local crop values still need agricultural review. No yield or profit predictions are made.</p></div></section>`;
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
