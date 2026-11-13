import { FIELD_CHOICES, FIELD_LIMITS, SEASONS, emptyField } from './field.mjs';
import { isDemoPoint, POWER } from './data.mjs';
import { MODEL, PRIORITIES, defaultPriorities, benefitBadges, rotationAdvice, buildTimeline, timelineWarnings, SCENARIO_LIMITS, defaultScenario } from './engine.mjs';

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
  return `<section class="welcome"><div class="welcome-copy"><p class="eyebrow">FOR SMALL FARMS IN WESTERN INDIA</p><h1>Your field.<br>Your next season.<br><em>Your decision.</em></h1><p class="welcome-purpose">Compare the crops you grow now with two alternatives, using NASA weather evidence and clearly stated rules.</p><p class="welcome-note">Start with your own field or explore an editable demo from Rajkot. NASA weather is available on the climate page; adjust priorities to explore the scoring preview.</p><div class="welcome-actions"><button type="button" class="primary" data-navigate="/field">Start <span aria-hidden="true">→</span></button><button type="button" class="secondary" data-load-demo aria-describedby="demo-status">Load demo farm</button></div><p id="demo-status" class="small-note">The demo fills an editable field. Save it when you are ready.</p>${glossaryButton}</div><aside class="journey-card" aria-label="How planning will work"><span class="stage-label">Build status · step 10 of 12</span><h2>Start with the farm<br>you know.</h2><ol><li><span>01</span><div><strong>Describe your field</strong><p>Your soil, water and current crops.</p></div></li><li><span>02</span><div><strong>Look at the evidence</strong><p>Weather history and its limits.</p></div></li><li><span>03</span><div><strong>Compare your choices</strong><p>Your current plan and two alternatives.</p></div></li></ol><p class="journey-footnote">Scores will be relative comparisons from stated rules. They will not predict yield or profit.</p></aside></section>`;
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

export function renderClimate({ field = null, climateState = {status:'idle',data:null,error:'',key:''}, climateMatches = false, metrics = null, generated = null, satelliteState = {status:'not-loaded',data:null,errors:[]} } = {}) {
  const heading = pageHeading('03', 'Your climate (NASA)', 'Weather evidence describes the area around your farm. It is not a measurement from your own field.');
  if (!field) return heading + '<section class="placeholder-panel"><h2>Your field is needed.</h2><p>Complete all field entries before loading weather.</p><button type="button" class="primary" data-navigate="/field">Go to My field</button></section>';
  const loading = climateMatches && climateState.status === 'loading';
  const climate = climateMatches ? climateState.data : null;
  const current = generated?.rotations.find(rotation => rotation.is_current);
  return heading + `<section class="climate-loader"><h2>Load weather for your field</h2><p>Load NASA climate sends your coordinates, rounded to two decimal places, to NASA POWER. Successful records are cached on this browser. If NASA is unavailable, the app tries the cache, then matching Rajkot demo files.</p><div class="welcome-actions"><button type="button" class="primary" data-load-climate="auto"${loading ? ' disabled' : ''}>${loading ? 'Loading NASA climate…' : climateMatches && climateState.status === 'error' ? 'Retry loading NASA climate' : 'Load NASA climate'}</button>${isDemoPoint(field) ? `<button type="button" class="secondary" data-load-climate="bundle"${loading ? ' disabled' : ''}>Use bundled demo data</button>` : ''}</div><p class="small-note">Bundled demo mode makes no NASA request. It needs the app files to be served locally or already available in your browser. Requests time out after ${POWER.timeout_ms / 1000} seconds.</p></section>
    ${loading ? '<p class="screen-status" role="status">Loading daily and monthly records. Fallback sources will be labelled.</p>' : ''}
    ${climateMatches && climateState.error ? `<p class="storage-error" role="alert">${escapeHtml(climateState.error)}</p>` : ''}
    ${!climateMatches && climateState.data ? '<p class="screen-status">The loaded weather belongs to another location or agricultural year. Load weather for your current field to see its metrics.</p>' : ''}
    ${climate ? `<section class="climate-preview"><span class="stage-label">POWER climate cards</span><h2>${sourceLabel(climate.source)}</h2><p>June ${climate.ag_year}–May ${climate.ag_year + 1}. Retrieved: <time>${escapeHtml(climate.retrieved_at)}</time>.</p><p>${escapeHtml(climate.grid_note)}</p><p>${escapeHtml(climate.soil_note)}</p>${climate.warnings.map(warning => `<p class="screen-status">${escapeHtml(warning)}</p>`).join('')}${climate.monthly_error ? `<p class="screen-status">Daily weather is available. Monthly history could not be loaded; see Evidence for details.</p>` : ''}
      <p class="source-note">These cards use your current crop windows. Crop dates and temperature thresholds are illustrative; confirm them locally.</p>${renderClimateCards(current,metrics,climate)}${renderTrendCards(climate)}
      <div class="season-help">${[['dry_spell','Dry spell'],['heavy_rain','Heavy rain'],['soil_wetness','Soil wetness'],['resolution','Grid and resolution']].map(([term,label]) => `<button class="glossary-link" type="button" data-glossary="${term}">${label}</button>`).join('')}</div><p class="small-note">The cards use your current crop windows; Bare seasons have no crop-specific metrics.</p><a href="#/evidence">See request URLs, retrieval times and data limitations</a></section>` : ''}${renderSatelliteCards(field,satelliteState,climate)}`;
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
    <li>High confidence: complete windows, a soil test and all crops verified/regionally common. Medium: the same with soil type only. Low: missing weather, unavailable crop data, non-regional crops, off-season/start-month choices or unverified crop values. Reasons accompany every label.</li></ul><p>Timeline rules: inside each crop window, monthly heat days ≥ ${MODEL.vuln_heat_days}, cold days ≥ ${MODEL.vuln_cold_days}, and heavy-rain days ≥ ${MODEL.vuln_heavy_days} produce markers. A known dry run ≥ ${MODEL.vuln_dry_spell} days marks every month it overlaps, and missing days break runs. Heat at flowering requires the heat marker and the assumed month start + floor(duration × ${MODEL.flowering_fraction}). The internal flood key means heavy rain, not observed field flooding. Unknown crop calendars are not assumed Bare, overlaps retain all crops, and months beyond May are not wrapped backward.</p><p>Benefit rules: water need ≤ ${MODEL.benefit_water_ratio * 100}% of current; a nitrogen-fixer role; no adjacent same-family pair plus a family new to current; a cover/deep-rooted role plus fewer assumed bare months; market priority ≥ current + ${MODEL.benefit_market_gain}. All use illustrative crop assumptions, not measured outcomes. Unknown calendars prevent a cover-month comparison.</p><p>Partial-data fits use complete days only and carry missing-day warnings. An unknown climate window is not assigned a neutral score. Every adjustment is listed with its reason in the ranking preview. Compare shows the current rotation and two derived alternatives with benefit rules, gaps and local checks. The June–May timeline shows historical weather markers and explicit calendar/missing-data gaps. What-if multiplies daily rain by (1 + rain_pct/100) and adds temperature_c to T2M, Tmax and Tmin, while preserving missing values and holding soil wetness unchanged. Experiment irrigation replaces seasonal irrigation in a copied field. Baseline current/A/B IDs are held fixed; each available historical year is rescored under the same settings. Best/worst use only available totals. No forecast or yield response is calculated.</p></section>`;
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

const TIMELINE_MARKERS = Object.freeze({
  heat: {icon:'♨',label:'Heat'},
  'heat at flowering': {icon:'✿',label:'Heat at flowering'},
  cold: {icon:'❄',label:'Cold'},
  dry: {icon:'☀',label:'Dry spell'},
  flood: {icon:'🌧',label:'Heavy rain'},
});
const cropTone = crop => [...(crop?.id ?? '')].reduce((sum,char) => sum + char.charCodeAt(0),0) % 6;

export function renderTimeline(rotation,climate,label = 'Rotation') {
  if (!rotation) return '';
  const cells = buildTimeline(rotation,climate), warnings = timelineWarnings(rotation);
  const marker = flag => `<span class="timeline-marker" data-weather-flag="${flag}"><span aria-hidden="true">${TIMELINE_MARKERS[flag].icon}</span> ${TIMELINE_MARKERS[flag].label}</span>`;
  return `<section class="timeline-panel"><h3>June–May crop timeline</h3><p class="source-note">${climate ? `Historical source: ${sourceLabel(climate.source)} · June ${climate.ag_year}–May ${climate.ag_year + 1}. Retrieved: ${escapeHtml(climate.retrieved_at)}.` : 'Calendar only. Matching weather is not loaded; weather markers are unknown.'} Crop dates, temperature thresholds and flowering month are illustrative assumptions.</p>
    <p class="timeline-help">Scroll sideways to see all 12 months. Open a month for counts and source notes. Hatching and the word Bare show known months without a crop; unknown calendars are labelled separately.</p>
    ${warnings.length ? `<div class="rotation-warnings">${listHtml(warnings)}</div>` : ''}
    <div class="timeline-strip" role="region" aria-label="${escapeHtml(label)} June to May timeline, scroll horizontally" tabindex="0">${cells.map(cell => {
      const cropNames = cell.crops.map(crop => crop.name).join(' + ');
      const state = cropNames || (cell.bare ? 'Bare' : 'Calendar unknown');
      const status = cell.bare ? 'No crop-specific weather check.' : cell.data_status === 'not-loaded' || !cell.crops.length ? 'Weather not assessed.' : cell.missing ? `${cell.missing} missing days.` : 'Complete daily records for the known crop windows.';
      return `<details class="timeline-cell ${cell.bare ? 'timeline-bare' : !cell.crops.length ? 'timeline-unknown' : `timeline-tone-${cropTone(cell.crop)}`}${cell.overlap ? ' timeline-overlap' : ''}" data-month="${cell.month}" data-calendar-state="${cell.bare ? 'bare' : cell.unknown_calendar ? 'uncertain' : 'crop'}"><summary aria-label="${escapeHtml(`${MONTH_NAMES[cell.month - 1]} ${cell.year ?? ''}: ${state}. ${cell.flags.map(flag => TIMELINE_MARKERS[flag].label).join(', ')}. ${cell.overlap ? 'Overlapping crops. ' : ''}${status}`)}"><span class="timeline-month">${MONTH_NAMES[cell.month - 1]}${cell.year ? `<small>${cell.year}</small>` : ''}</span><span class="timeline-crop">${escapeHtml(state)}</span>${cell.overlap ? '<span class="timeline-caution">Overlap</span>' : ''}${cell.unknown_calendar ? '<span class="timeline-caution">Calendar uncertain</span>' : ''}<span class="timeline-markers">${cell.flags.map(marker).join('')}</span>${cell.missing ? '<span class="timeline-caution">Missing data</span>' : ''}</summary>
      <div class="timeline-month-details"><p><strong>${MONTH_NAMES[cell.month - 1]} ${cell.year ?? '· year not loaded'}</strong> · ${escapeHtml(state)}</p><p>${status}</p>${cell.overlap ? '<p>More than one current crop occupies this month. Both are shown; confirm actual dates locally.</p>' : ''}${cell.unknown_calendar ? '<p>At least one crop calendar is unknown. Other empty-looking months are not assumed Bare.</p>' : ''}
      ${cell.assessments.map(assessment => `<div><h4>${assessment.season} · ${escapeHtml(assessment.crop.name)}</h4>${assessment.assumed_flowering ? '<p>Assumed flowering month: derived from listed duration, not a field observation.</p>' : ''}${cell.year ? `<p>Complete days used: ${assessment.days}; missing days: ${assessment.missing}.</p><p>Heat days: ${metricValue(assessment.heat_days)} above ${metricValue(assessment.crop.heat_threshold_c,'°C')}; cold days: ${metricValue(assessment.cold_days)} below ${metricValue(assessment.crop.cold_threshold_c,'°C')}. Crop temperature thresholds are illustrative.</p><p>Heavy-rain days: ${metricValue(assessment.heavy_rain)} at or above ${MODEL.heavy_rain_mm} mm. This is not confirmed flooding at your field.</p>${assessment.dry_spells.length ? `<ul>${assessment.dry_spells.map(spell => `<li>Known dry run: ${spell.start_date}–${spell.end_date} (${spell.days} days below ${MODEL.dry_day_mm} mm).</li>`).join('')}</ul>` : '<p>No qualifying dry run is established in the available complete-day records for this crop. Missing days break a run.</p>'}` : '<p>No matching daily weather is loaded. Missing weather is not treated as zero events.</p>'}</div>`).join('')}
      <p class="small-note">Only complete days, using the same six required parameters as the seasonal metrics, count toward markers. Markers describe historical area weather under these rules, not forecasts or confirmed crop damage.</p></div></details>`;
    }).join('')}</div><div class="timeline-legend" aria-label="Timeline marker legend">${Object.keys(TIMELINE_MARKERS).map(marker).join('')}</div>
    <p class="small-note">Heat ≥ ${MODEL.vuln_heat_days} days; cold ≥ ${MODEL.vuln_cold_days} days; known dry run ≥ ${MODEL.vuln_dry_spell} days; heavy rain ≥ ${MODEL.vuln_heavy_days} day per month inside the crop window. Heat at flowering also needs the assumed flowering month: sowing offset + floor(duration × ${MODEL.flowering_fraction}).</p>
    <div class="season-help"><button type="button" class="glossary-link" data-glossary="flowering">Assumed flowering</button><button type="button" class="glossary-link" data-glossary="heat_stress">Heat stress</button><button type="button" class="glossary-link" data-glossary="dry_spell">Dry spells</button></div></section>`;
}

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
    ${renderTimeline(rotation,climate,label)}
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
    <details class="rotation-details"><summary>Excluded (${excluded.length}) · with reasons</summary>${excluded.length ? `<ol>${excluded.map(row => `<li><p>${escapeHtml(rotationDescription(row))}</p>${listHtml(row.reasons)}</li>`).join('')}</ol>` : '<p>No excluded calendars are available for these inputs.</p>'}</details><p class="small-note">Crop windows use listed months, not actual dates reported by you. Timelines show assumed crop windows and historical weather thresholds; they do not predict future conditions.</p>`;
}

export function renderWhatIf({field=null,scenario=null,scenarioResult=null,scenarioError=''}={}) {
  const settings=scenario??defaultScenario(field);
  const slider=(key,label,value,limits,unit)=>`<div class="priority-control"><label for="scenario-${key}">${label}: <output id="scenario-value-${key}" for="scenario-${key}">${value}</output> ${unit}</label><input id="scenario-${key}" type="range" data-scenario="${key}" min="${limits.min}" max="${limits.max}" step="${limits.step}" value="${value}" aria-describedby="scenario-help scenario-error"></div>`;
  return pageHeading('06','What if?','Test the same current rotation and two baseline alternatives under changed historical conditions.')
    + `<section class="scenario-controls"><h2>Experiment settings</h2><p id="scenario-help">This is a sensitivity experiment, not a forecast. Rain changes by a percentage; added temperature applies to daily mean, maximum and minimum. Irrigation is an absolute seasonal amount and stays separate from your saved field.</p>${slider('rain_pct','Rain change',settings.rain_pct,SCENARIO_LIMITS.rain_pct,'%')}${slider('temperature_c','Added temperature',settings.temperature_c,SCENARIO_LIMITS.temperature_c,'°C')}${SEASONS.map(season=>slider('irrigation_'+season,season+' irrigation',settings.irrigation_mm[season],SCENARIO_LIMITS.irrigation_mm,'mm')).join('')}<p id="scenario-error" class="field-error" role="alert"></p><p id="scenario-storage" class="small-note" role="status">${escapeHtml(scenarioError)}</p><button type="button" class="secondary" data-reset-scenario>Reset experiment to current field</button><p class="small-note">Settings are saved separately in this browser. Saving a field does not reset them. Reset uses zero rain/temperature change and the current field irrigation. Missing weather stays missing. Soil wetness is held unchanged; no hydrology or yield response is simulated.</p><button type="button" class="glossary-link" data-glossary="sensitivity">What is sensitivity?</button></section><p id="scenario-status" class="field-status" role="status">${scenarioResult?'Experiment ready for the three baseline comparison places.':'Complete your field and load matching climate to calculate an experiment.'}</p><section id="scenario-results">${renderScenarioResults(scenarioResult)}</section>`;
}

export function renderScenarioResults(result) {
  if(!result)return '<p>No experiment score is available. Complete the field and load matching NASA weather first. Missing data are not treated as zero.</p><button type="button" class="secondary" data-navigate="/climate">Go to Your climate</button>';
  const labels=['Your current','Option A','Option B'];
  const score=value=>value==null?'Not scored':metricValue(value,'/ 100');
  return `<h2>Same plans, changed conditions</h2><p class="source-note">Historical source: ${sourceLabel(result.source)}. Retrieved ${escapeHtml(result.retrieved_at)}. June ${result.ag_year}–May ${result.ag_year+1}. Derived experiment: rain ${result.scenario.rain_pct}%, added temperature ${result.scenario.temperature_c} °C; irrigation ${SEASONS.map(season=>season+' '+result.scenario.irrigation_mm[season]+' mm').join(', ')}. Crop values and scoring rules are illustrative.</p><p>The current rotation and Options A/B come from the unmodified comparison for your current priorities. Their IDs stay fixed throughout this experiment and across historical years; alternative plans are not reselected to hide a worse result.</p><div class="comparison-grid">${result.columns.map((column,i)=>{
    if(!column)return `<article class="comparison-column"><h3>${labels[i]}</h3><p>No baseline alternative is available for this place.</p></article>`;
    const row=column.changed, delta=row?.total!=null && column.baseline.total!=null?row.total-column.baseline.total:null;
    return `<article class="comparison-column" data-scenario-rotation="${escapeHtml(column.baseline.id)}"><h3>${labels[i]}</h3><p>${escapeHtml(rotationDescription(column.baseline))}</p><p>Baseline: <strong>${score(column.baseline.total)}</strong></p><p>Experiment: <strong class="scenario-score">${score(row?.total)}</strong></p><p>Change: ${delta===null?'Unknown':(delta>0?'+':'')+metricValue(delta,'points')}</p><p>${escapeHtml(row?.feasibility_label??'Water feasibility unknown')}</p><p>Confidence: ${escapeHtml(row?.confidence?.level??'Unavailable')}</p>${row?listHtml([...row.confidence.reasons,...row.feasibility_reasons,...row.unscored_reasons]):''}</article>`;
  }).join('')}</div><h2>Four-year sensitivity</h2><p>Each available agricultural year uses the same plans, current priority weights and active experiment settings. This is four historical comparisons, not a four-year forecast. Best and worst mean score only; missing totals are excluded.</p><div class="table-scroll" role="region" aria-label="Four-year sensitivity scores" tabindex="0"><table class="rotations-table"><caption>Relative scores under the active experiment</caption><thead><tr><th scope="col">Agricultural year</th>${labels.map(label=>`<th scope="col">${label}</th>`).join('')}</tr></thead><tbody>${result.sensitivity.map(row=>`<tr><th scope="row">June ${row.year}–May ${row.year+1}</th>${row.rotations.map(rotation=>`<td>${score(rotation?.total)}${rotation?`<br>${escapeHtml(rotation.feasibility_label)}${rotation.season_metrics?'<br>Missing days: '+SEASONS.map(season=>rotation.season_metrics[season]?.missing??'no crop').join(' / '):''}`:''}</td>`).join('')}</tr>`).join('')}${['best','worst'].map(key=>`<tr><th scope="row">${key==='best'?'Best':'Worst'} available year</th>${result.extremes.map(item=>`<td>${item[key]?`${item[key].year}–${item[key].year+1}: ${score(item[key].score)}`:'Not scored'}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="small-note">A better score does not establish a better yield, profit or local suitability. Coarse weather, unverified crop values and calendar assumptions still apply. Confirm water supply with your KVK.</p>`;
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

export function renderEvidence({ cropData = { status: 'loading', crops: [], errors: [] }, climateState = {status:'idle',data:null,error:''}, field = null, satelliteState = {status:'not-loaded',data:null,errors:[]} } = {}) {
  return pageHeading('07', 'Evidence', 'See where the numbers come from, which rules are illustrative and what still needs checking.')
    + renderCropEvidence(cropData)
    + renderWeatherProvenance(climateState)
    + renderSatelliteCards(field,satelliteState,climateState.data)
    + renderModelEvidence()
    + (climateState.data ? renderTrendCards(climateState.data) : '')
    + `<section class="evidence-panel"><span class="stage-label">Step 10 · scenario sensitivity</span><h2>Model and integration status</h2><div class="evidence-row"><h3>Weather history</h3><p>Daily POWER loading, caching and Rajkot fallback are available on the climate page. Loaded sources and request URLs appear above.</p></div><div class="evidence-row"><h3>Long-term weather changes</h3><p>Monthly records are fetched with provenance. Annual aggregation and OLS trends are available on Your climate, with complete-year counts and source units.</p></div><div class="evidence-row"><h3>Satellite summaries</h3><p>Satellite cards validate the optional Rajkot summary file and show not loaded yet where sourced values are absent. Satellite values do not alter rotation scores.</p></div><div class="evidence-row"><h3>Crop values and formulas</h3><p>The crop table is validated on load and calendar sequences are generated. All starter values are illustrative and unverified. The Priorities page scores retained rotations using loaded weather, your weights and the stated rules.</p></div><div class="evidence-row"><h3>Validation boundary</h3><p>Scores compare stated rules. Local crop values still need agricultural review. No yield or profit predictions are made.</p></div></section>`;
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

function climateCard(title,value,meaning,source,term) {
  return `<article class="climate-card"><h4>${escapeHtml(title)}</h4><strong class="climate-value">${value}</strong><p>${escapeHtml(meaning)}</p><p class="source-note">${escapeHtml(source)}</p><button type="button" class="glossary-link" data-glossary="${term}">Explain ${escapeHtml(title.toLowerCase())}</button></article>`;
}

export function renderClimateCards(current,metrics,climate) {
  if (!current || !metrics) return '<p>Crop data are needed to calculate current crop windows.</p>';
  const source = `${sourceLabel(climate.source)} · ${climate.grid_note} Retrieved ${climate.retrieved_at}.`;
  return SEASONS.map(season => {
    const window=current.seasons[season], values=metrics[season];
    if (!window) return `<section class="season-climate"><h3>${season} · Bare</h3><p>No crop window; no crop-climate metrics calculated.</p></section>`;
    return `<section class="season-climate"><h3>${season} · ${escapeHtml(window.crop.name)}</h3><p>${escapeHtml(values.start_date ?? 'Calendar unavailable')} ${values.end_date ? 'to '+escapeHtml(values.end_date) : ''}</p><p>Complete days used: ${values.days}; missing days: ${values.missing ?? 'unknown'}. ${escapeHtml(values.reason ?? '')}</p><div class="climate-card-grid">${[
      [values.missing ? 'Rain (partial total)' : 'Season rainfall',metricValue(values.rain_mm,'mm'),values.missing ? 'Partial total over complete days; missing rain is not zero.' : 'Rain summed over this assumed crop window.','rainfall'],
      ['Heat days',metricValue(values.heat_days,'days'),`Days above ${window.crop.heat_threshold_c ?? 'unknown'} °C. Crop threshold is illustrative.`,'heat_stress'],
      ['Cold days',metricValue(values.cold_days,'days'),`Days below ${window.crop.cold_threshold_c ?? 'unknown'} °C. Crop threshold is illustrative.`,'cold_stress'],
      ['Longest known dry spell',metricValue(values.dry_spell_max,'days'),`Consecutive complete days below ${MODEL.dry_day_mm} mm. Missing days break runs.`,'dry_spell'],
      ['Heavy-rain days',metricValue(values.heavy_rain,'days'),`Days with at least ${MODEL.heavy_rain_mm} mm. This does not establish field flooding.`,'heavy_rain'],
      ['Root-zone soil wetness',metricValue(values.soil_wet_mean),'Mean model index from 0 to 1; not volumetric water content or a satellite reading.','soil_wetness'],
    ].map(([title,value,meaning,term])=>climateCard(title,value,meaning,source+(term==='soil_wetness'?' POWER/MERRA-2 model.':''),term)).join('')}</div></section>`;
  }).join('');
}

export function renderTrendCards(climate) {
  const trend=climate?.monthly_trend, dataset=climate?.datasets?.find(row=>row.kind==='monthly');
  const source=dataset ? `${sourceLabel(dataset.source)} · POWER monthly · ${POWER.grid_note} Retrieved ${dataset.retrieved_at}.` : 'NASA POWER monthly history not loaded.';
  const series=(years=[])=>years.length ? `${years.length} complete years: ${years.join(', ')}.` : 'No complete years available.';
  return `<section class="trend-panel"><h2>Long-term climate trends · 1991–2024</h2><p>Calendar-year history, separate from the June–May crop year. A positive slope means an increase in the fitted line; it does not describe every year or predict the next season.</p><div class="climate-card-grid">${climateCard('Annual rain trend',metricValue(trend?.rain_mm_per_decade,'mm/decade'),series(trend?.rain_years),source,'trend')}${climateCard('Annual maximum-temperature trend',metricValue(trend?.tmax_c_per_decade,'°C/decade'),'Trend in the annual mean of monthly maximum-temperature values. '+series(trend?.tmax_years),source,'trend')}</div>${trend ? `<p class="source-note">${escapeHtml(trend.unit_note)}</p><p>${escapeHtml(trend.method)}</p><p><a href="https://gis.earthdata.nasa.gov/portal/rest/services/POWER/POWER_MONTHLY_METEOROLOGY_LST/ImageServer/multiDimensionalInfo" target="_blank" rel="noopener noreferrer">NASA POWER monthly variable definitions</a></p><details><summary>Annual values used in trends</summary><div class="table-scroll" role="region" aria-label="Annual climate values" tabindex="0"><table class="rotations-table"><caption>Missing annual values are omitted from that trend</caption><thead><tr><th scope="col">Year</th><th scope="col">Rain (mm)</th><th scope="col">Mean Tmax (°C)</th></tr></thead><tbody>${trend.annual.map(row=>`<tr><th scope="row">${row.year}</th><td>${metricValue(row.rain_mm)}</td><td>${metricValue(row.tmax_c)}</td></tr>`).join('')}</tbody></table></div></details>` : '<p>Monthly history not loaded. No trend is assigned a zero value.</p>'}</section>`;
}

export function renderSatelliteCards(field,state={status:'not-loaded',data:null,errors:[]},climate=null) {
  const matched=field && isDemoPoint(field), data=matched ? state.data : null;
  const source=data ? `Team-supplied bundled satellite summaries · Rajkot only. Retrieved ${data.retrieved_at}.` : 'No sourced satellite summary loaded.';
  const rows=(values)=>Object.entries(values??{}).sort(([a],[b])=>a.localeCompare(b));
  const series=(values,label)=>`<dl>${rows(values).map(([date,value])=>`<div><dt>${escapeHtml(date)}</dt><dd>${metricValue(value)} ${escapeHtml(label)}</dd></div>`).join('')}</dl>`;
  const cards=[
    ['GRACE / GRACE-FO groundwater context','grace','~300 km (coarse)','Groundwater changes cannot be isolated from total water-storage changes using GRACE alone.', 'grace'],
    ['SMAP soil-moisture anomaly','smap','9 km','An anomaly compares with a reference baseline; baseline and units must be checked in the supplied note.', 'smap'],
    ['IMERG rain cross-check','imerg','0.1° (~10 km)','Two area products can disagree. Neither is a field rain gauge.', 'imerg'],
  ].map(([title,key,resolution,meaning,term])=>{
    const product=data?.[key];
    const usable=product && rows(key==='grace'?product.annual_lwe_cm:key==='smap'?product.monthly_anomaly:product.monthly_rain_mm).some(([,v])=>v!==null);
    let values='<strong>Not loaded yet</strong>';
    if (product && (usable || key==='grace' && product.trend_cm_per_year!==null)) {
      if (key==='grace') values=`<p>Water-storage trend: <strong>${metricValue(product.trend_cm_per_year,'cm/year')}</strong></p>${series(product.annual_lwe_cm,'cm liquid-water equivalent')}`;
      if (key==='smap') values=series(product.monthly_anomaly,product.unit || '(reported anomaly; units not supplied)');
      if (key==='imerg') values=`<div class="table-scroll" tabindex="0" role="region" aria-label="IMERG and POWER monthly rain"><table class="rotations-table"><caption>Monthly rain cross-check, both in mm</caption><thead><tr><th scope="col">Month</th><th scope="col">IMERG</th><th scope="col">POWER</th><th scope="col">IMERG − POWER</th></tr></thead><tbody>${rows(product.monthly_rain_mm).map(([date,value])=>{
        const days=climate?.daily?.filter(day=>day.date.startsWith(date))??[], [year,month]=date.split('-').map(Number), expected=new Date(Date.UTC(year,month,0)).getUTCDate();
        const power=days.length===expected && days.every(day=>typeof day.rain==='number' && Number.isFinite(day.rain) && day.rain>=0)?days.reduce((sum,day)=>sum+day.rain,0):null;
        return `<tr><th scope="row">${escapeHtml(date)}</th><td>${metricValue(value)}</td><td>${metricValue(power)}</td><td>${metricValue(value!==null && power!==null?value-power:null)}</td></tr>`;
      }).join('')}</tbody></table></div>`;
    }
    return `<article class="climate-card satellite-card"><h3>${title}</h3>${values}<p>${meaning}</p><p class="source-note">${escapeHtml(source)} Resolution: ${escapeHtml(product?.resolution??resolution)}. Area patterns, not field measurements.</p><p>${escapeHtml(product?.note??product?.power_vs_imerg_note??'')}</p><button type="button" class="glossary-link" data-glossary="${term}">Explain ${term.toUpperCase()}</button></article>`;
  }).join('');
  return `<section class="satellite-panel"><h2>Satellite evidence · Rajkot demo only</h2><p>${matched?'These optional summaries provide context and do not change rotation scores.':'This dataset is available only for the Rajkot demo location. No Rajkot satellite value is applied to your field.'}</p>${state.status==='loading'?'<p role="status">Checking bundled satellite summaries…</p>':''}${(state.errors??[]).map(error=>`<p class="small-note">${escapeHtml(error)}</p>`).join('')}<div class="climate-card-grid">${cards}</div>${data?`<p class="source-note">Source links for these bundled summaries:</p><ul>${data.sources.map(row=>`<li><a href="${escapeHtml(row.doi_or_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(row.name)}</a></li>`).join('')}</ul>`:''}<button type="button" class="glossary-link" data-glossary="data_types">Satellite, model and ground data</button></section>`;
}
