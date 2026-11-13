const glossaryButton = '<button type="button" class="glossary-link" data-glossary="rotation" aria-label="What is a crop rotation?">What is a rotation?</button>';

function pageHeading(number, title, description) {
  return `<header class="page-heading"><p class="eyebrow">YOUR PLANNING JOURNEY <span>${number} / 7</span></p><h1>${title}</h1><p class="page-description">${description}</p></header>`;
}

function placeholder(step, heading, description) {
  return `<section class="placeholder-panel"><span class="stage-label">Planned · step ${step}</span><h2>${heading}</h2><p>${description}</p><p class="availability">Not available yet. No result has been calculated.</p></section>`;
}

export function renderWelcome() {
  return `<section class="welcome"><div class="welcome-copy"><p class="eyebrow">FOR SMALL FARMS IN WESTERN INDIA</p><h1>Your field.<br>Your next season.<br><em>Your decision.</em></h1><p class="welcome-purpose">Compare the crops you grow now with two alternatives, using NASA weather evidence and clearly stated rules.</p><p class="welcome-note">A fresh V3 build. This first step sets up the pages. Field entry and calculations will follow.</p><div class="welcome-actions"><button type="button" class="primary" data-navigate="/field">Start <span aria-hidden="true">→</span></button><button type="button" class="secondary" disabled aria-describedby="demo-status">Load demo farm</button></div><p id="demo-status" class="small-note">Demo farm loading will be added in step 2.</p>${glossaryButton}</div><aside class="journey-card" aria-label="How planning will work"><span class="stage-label">Build status · step 1 of 12</span><h2>Start with the farm<br>you know.</h2><ol><li><span>01</span><div><strong>Describe your field</strong><p>Your soil, water and current crops.</p></div></li><li><span>02</span><div><strong>Look at the evidence</strong><p>Weather history and its limits.</p></div></li><li><span>03</span><div><strong>Compare your choices</strong><p>Your current plan and two alternatives.</p></div></li></ol><p class="journey-footnote">Scores will be relative comparisons from stated rules. They will not predict yield or profit.</p></aside></section>`;
}

export function renderField() {
  return pageHeading('02', 'My field', 'Start with your soil, water and the crops you already grow.')
    + placeholder('2', 'Your field comes first.', 'The next build step adds your field form, current-rotation choices, input validation and saving on this device.')
    + `<div class="page-actions">${glossaryButton}<button type="button" class="secondary" data-navigate="/climate">Preview the climate page →</button></div>`;
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
    + `<section class="evidence-panel"><span class="stage-label">Step 1 · honest placeholders</span><h2>No scientific results are loaded.</h2><div class="evidence-row"><h3>Weather history</h3><p>Not connected. Daily weather retrieval is planned for step 4.</p></div><div class="evidence-row"><h3>Long-term weather changes</h3><p>Not connected. Monthly records and trend calculations are planned for step 8.</p></div><div class="evidence-row"><h3>Satellite summaries</h3><p>Not loaded yet. The optional team-supplied dataset is planned for step 9.</p></div><div class="evidence-row"><h3>Crop values and formulas</h3><p>The crop table, its validation, the generator and scoring are not implemented in this step. No crop values are presented as verified.</p></div><div class="evidence-row"><h3>Validation boundary</h3><p>Future scores will compare stated rules. Local crop values still need agricultural review. No yield or profit predictions are made.</p></div></section>`;
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
