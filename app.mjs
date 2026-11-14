import {buildDecisionBrief} from './brief.mjs';
import {loadPriorities,savePriorities} from './priorities.mjs';
import {mountFieldScene} from './field-scene.mjs';
import {LABELS,validLanguage,loadLabelLanguage,saveLabelLanguage,applyCropLabels} from './labels.mjs';
import {mapPoint,createFieldMap} from './map.mjs';
import {installPrintView} from './print.mjs';
import {loadScenario,saveScenario} from './scenario.mjs';
import { ROUTES, resolveRoute, renderNotFound, renderRankingPreview, renderRotationsTable, tableDataFor, ROTATION_SORT_COLUMNS, renderScenarioResults } from './views.mjs';
import { openGlossary } from './glossary.mjs';
import { DEMO_FARM, loadSatellite, loadCrops, loadClimate, powerPoint, latestCompleteAgYear } from './data.mjs';
import { generateRotations, seasonClimate, defaultPriorities, PRIORITIES, validatePriorities, prepareScoring, rankRotations, defaultScenario, validateScenario, evaluateScenario } from './engine.mjs';
import { SEASONS, emptyField, loadField, saveField, validateField } from './field.mjs';

// Field and weather adapters write only their own keys; scenario storage is left alone.
const fieldStorage = {
  getItem: key => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
};
const restoredLabels = loadLabelLanguage(fieldStorage);
let labelLanguage = restoredLabels.language;
const restored = loadField(fieldStorage);
let fieldDraft = restored.field ?? emptyField();
let fieldMessage = restored.field ? 'Your saved field is loaded. Edit it and save again when ready.' : '';
let storageError = restored.error;
let cropData = { crops: [], errors: [], status: 'loading' };
let climateState = { status: 'idle', data: null, error: '', key: '' };
let climateRequestId = 0;
const restoredPriorities=loadPriorities(fieldStorage);
let priorities = restoredPriorities.priorities;
let priorityStorageError=restoredPriorities.error;
let satelliteState = {status:'loading',data:null,errors:[]};
const restoredScenario = loadScenario(fieldStorage);
let scenarioSettings = restoredScenario.scenario;
let scenarioError = restoredScenario.error;
let scenarioCache = null;
let scenarioTimer = null;
let scoringCache = null;
let comparisonSort = { key: 'total', direction: 'desc' };
const climateKey = field => JSON.stringify({ ...powerPoint(field), ag_year: latestCompleteAgYear() });

const app = document.getElementById('app');
const navigation = document.getElementById('primary-nav');
const menuButton = document.getElementById('menu-toggle');
const desktop = window.matchMedia('(min-width: 54rem)');
let menuOpen = false;
let mapController = null;
let disposeScene = ()=>{};
let mapRequest = 0;
const languageControl = document.getElementById('label-language');
languageControl.value = labelLanguage;
document.getElementById('label-status').textContent = restoredLabels.error;

function renderNavigation() {
  const route=resolveRoute(window.location.hash);
  navigation.replaceChildren(...ROUTES.map(item=>{
    const link=document.createElement('a');link.href='#'+item.path;
    if(route?.path===item.path)link.setAttribute('aria-current','page');
    const icon=document.createElement('span');icon.className='nav-icon';icon.setAttribute('aria-hidden','true');icon.innerHTML=navIcon(item.path);link.append(icon,document.createTextNode(item.label));
    const native=LABELS[labelLanguage]?.nav[item.path];
    if(native){const span=document.createElement('span');span.lang=labelLanguage;span.className='nav-native';span.textContent=native;link.append(span);}
    return link;
  }));
}
function localize(root=app) {applyCropLabels(root,labelLanguage,cropData.crops);}
languageControl.addEventListener('change',()=>{
  if(!validLanguage(languageControl.value)){languageControl.value=labelLanguage;return;}
  labelLanguage=languageControl.value;
  document.getElementById('label-status').textContent=saveLabelLanguage(fieldStorage,labelLanguage)||'Navigation and crop labels updated. Explanations remain in English.';
  renderNavigation();localize();
});

installPrintView(window,app,document.getElementById('print-context'),()=>{
  const field=validateField(fieldDraft).field;
  return `${document.title}. ${field?`${field.name} · ${field.lat}, ${field.lon} · ${field.area_ha} ha.`:'Field entries incomplete.'} Priority weights: ${PRIORITIES.map(row=>row.label+' '+priorities[row.key]).join(', ')}. Printed ${new Date().toLocaleString()}. ${window.location.href}`;
});
document.getElementById('print-page').addEventListener('click',()=>window.print());

function syncMenu() {
  navigation.hidden = !desktop.matches && !menuOpen;
  menuButton.hidden = desktop.matches;
  document.getElementById('page-tools').hidden = !desktop.matches && !menuOpen;
  menuButton.setAttribute('aria-expanded', String(!navigation.hidden));
  menuButton.textContent = menuOpen ? 'Close menu' : 'Menu';
}

function render({ focus = false } = {}) {
  const route = resolveRoute(window.location.hash);
  renderNavigation();
  const field = validateField(fieldDraft).field;
  const generated = ['/compare','/climate','/priorities','/whatif'].includes(route?.path) && field && cropData.status !== 'loading' ? generateRotations(cropData.crops, field) : null;
  const climateMatches = Boolean(field && climateState.key === climateKey(field));
  const current = generated?.rotations.find(rotation => rotation.is_current);
  const metrics = route?.path === '/climate' && climateMatches && climateState.data && current
    ? Object.fromEntries(SEASONS.map(season => [season, seasonClimate(climateState.data, current.seasons[season])])) : null;
  const scoring = ['/priorities','/compare'].includes(route?.path) && field && generated && climateMatches && climateState.data && cropData.status === 'loaded' ? rankingFor(field,generated) : null;
  const scenario = scenarioSettings ?? defaultScenario(field);
  const scenarioResult = route?.path === '/whatif' && field && generated && climateMatches && climateState.data && cropData.status === 'loaded' ? experimentFor(field,generated,scenario) : null;
  disposeScene();
  mapRequest++;
  mapController?.destroy();mapController=null;
  app.innerHTML = route ? route.render({ draft: fieldDraft, message: fieldMessage, storageError, cropData, generated, field, climateState, climateMatches, metrics, priorities, priorityStorageError, scoring, comparisonSort, satelliteState, scenario, scenarioResult, scenarioError }) : renderNotFound();
  localize();
  disposeScene=mountFieldScene(app);
  document.getElementById('route-crumb').textContent=route?.label??'Page not found';
  document.body.dataset.route=route?.path??'unknown';
  document.title = `TerraPlan V3 · ${route?.label ?? 'Page not found'}`;
  menuOpen = false;
  syncMenu();
  if (focus) {
    app.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }
}

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuOpen) { menuOpen = false; syncMenu(); menuButton.focus(); }
});

menuButton.addEventListener('click', () => {
  menuOpen = !menuOpen;
  syncMenu();
});

desktop.addEventListener('change', () => {
  const moveFocus = !desktop.matches && (navigation.contains(document.activeElement) || document.getElementById('page-tools').contains(document.activeElement));
  menuOpen = false;
  syncMenu();
  if (moveFocus) menuButton.focus();
});

document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  app.focus();
});

document.addEventListener('click', event => {
  const jump=event.target.closest('[data-jump-plan]');
  if(jump && ['Your current','Option A','Option B'].includes(jump.dataset.jumpPlan)){const column=[...document.querySelectorAll('[data-comparison]')].find(element=>element.dataset.comparison===jump.dataset.jumpPlan);if(column){column.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});const heading=column.querySelector('h2');heading.tabIndex=-1;heading.focus({preventScroll:true});}}
  if (event.target.closest('[data-open-map]')) openFieldMap();
  if (event.target.closest('[data-map-centre]')) mapController?.chooseCentre();
  if (event.target.closest('[data-map-recentre]')) mapController?.setPoint(mapPoint(readFieldForm(document.getElementById('field-form'))));
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
      localize(document.getElementById('rotations-table-region'));
      document.getElementById('table-sort-status').textContent = `Sorted by ${ROTATION_SORT_COLUMNS.find(column => column.key === key).label}, ${comparisonSort.direction === 'asc' ? 'ascending' : 'descending'}. Missing values remain last.`;
    }
  }
  if (event.target.closest('[data-reset-priorities]')) {
    priorities = defaultPriorities();
    persistPriorities();
    for (const {key} of PRIORITIES) {
      const input = document.getElementById(`priority-${key}`);
      input.value = String(priorities[key]);
      input.removeAttribute('aria-invalid');
      document.getElementById(`weight-${key}`).textContent = String(priorities[key]);
    }
    document.getElementById('priority-error').textContent = '';
    updatePriorityRanking();
  }
  if (event.target.closest('[data-reset-scenario]')) setScenario(defaultScenario(validateField(fieldDraft).field));
  const weather = event.target.closest('[data-load-climate]');
  if (weather) refreshClimate(weather.dataset.loadClimate);
  if (event.target.closest('[data-retry-crops]')) refreshCrops();
  if (event.target.closest('[data-run-demo]')) runDemo();
  if (event.target.closest('[data-restore-field]')) {
    const saved=loadField(fieldStorage);
    if(saved.field){
      fieldDraft=saved.field;storageError='';
      fieldMessage='Saved field restored as your draft. Priorities and What-if settings are unchanged. Load matching weather if the location changed.';
    }else{storageError=saved.error;fieldMessage=saved.error?'Your current draft is kept.':'No saved field is available. Your current draft is kept.';}
    render({focus:true});
  }
  if (event.target.closest('[data-download-brief]')) downloadBrief();
  if (event.target.closest('[data-load-demo]')) {
    fieldDraft = structuredClone(DEMO_FARM);
    fieldMessage = DEMO_FARM.name + ' is filled in as an editable scenario. Review the entries, then choose Save field to keep them.';
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
  if (event.type === 'change' && ['lat','lon'].includes(event.target.id)) mapController?.setPoint(mapPoint(fieldDraft));
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
  persistPriorities();
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
  if (['#/', '', '#/compare', '#/climate', '#/evidence', '#/priorities', '#/whatif'].includes(window.location.hash)) render();
  cropData = await loadCrops();
  // Avoid replacing an in-progress field form or stealing focus when the file arrives.
  if (['#/', '', '#/compare', '#/climate', '#/evidence', '#/priorities', '#/whatif'].includes(window.location.hash)) render();
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
  if (['#/climate', '#/evidence', '#/priorities', '#/compare', '#/whatif'].includes(window.location.hash)) render();
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
  localize(document.getElementById('ranking-preview'));
  document.getElementById('ranking-status').textContent = `Ranking updated. ${scoring.ranked.filter(row => row.total !== null).length} alternatives have a score. ${scoring.options[0] ? `First comparison candidate: ${SEASONS.map(season => scoring.options[0].seasons[season]?.crop.name ?? 'Bare').join(', ')}. ${scoring.options[0].feasibility_label}.` : 'No scored comparison candidate is available.'}`;
}

function persistPriorities(){
  priorityStorageError=savePriorities(fieldStorage,priorities);
  const status=document.getElementById('priority-storage');
  if(status)status.textContent=priorityStorageError || 'Priorities saved on this browser.';
}

loadSatellite().then(result => {
  satelliteState = result;
  if (['#/climate','#/evidence'].includes(window.location.hash)) render();
});

function experimentFor(field,generated,scenario) {
  const key=JSON.stringify({field,scenario,priorities});
  if(!scenarioCache || scenarioCache.key!==key || scenarioCache.crops!==cropData.crops || scenarioCache.climate!==climateState.data) {
    scenarioCache={key,crops:cropData.crops,climate:climateState.data,result:evaluateScenario(generated,field,climateState.data,priorities,scenario)};
  }
  return scenarioCache.result;
}

function setScenario(raw) {
  const checked=validateScenario(raw),error=document.getElementById('scenario-error');
  if(!checked.valid) {
    error.textContent='What-if settings were not changed. '+Object.values(checked.errors).join(' ');
    return;
  }
  scenarioSettings=checked.scenario;
  scenarioError=saveScenario(fieldStorage,scenarioSettings).error;
  document.getElementById('scenario-storage').textContent=scenarioError || 'What-if settings saved on this browser.';
  error.textContent='';
  for(const input of document.querySelectorAll('[data-scenario]')) {
    const key=input.dataset.scenario,value=key.startsWith('irrigation_')?scenarioSettings.irrigation_mm[key.slice(11)]:scenarioSettings[key];
    input.value=String(value);input.removeAttribute('aria-invalid');
    document.getElementById('scenario-value-'+key).textContent=String(value);
  }
  clearTimeout(scenarioTimer);
  document.getElementById('scenario-status').textContent='Updating the historical experiment…';
  scenarioTimer=setTimeout(()=>{
    if(window.location.hash!=='#/whatif')return;
    const field=validateField(fieldDraft).field;
    const ready=field && climateState.key===climateKey(field) && climateState.data && cropData.status==='loaded';
    const result=ready?experimentFor(field,generateRotations(cropData.crops,field),scenarioSettings):null;
    document.getElementById('scenario-results').innerHTML=renderScenarioResults(result);
    localize(document.getElementById('scenario-results'));
    document.getElementById('scenario-status').textContent=result?'Experiment updated. Scores: '+result.columns.map(column=>column?.changed?.total==null?'not scored':column.changed.total.toFixed(2)).join(', ')+'.':'Settings updated. Load matching field weather to calculate scores.';
  },120);
}
app.addEventListener('input',event=>{
  const key=event.target.dataset.scenario;
  if(!key)return;
  const current=scenarioSettings??defaultScenario(validateField(fieldDraft).field);
  const raw={...current,irrigation_mm:{...current.irrigation_mm}};
  if(key.startsWith('irrigation_') && SEASONS.includes(key.slice(11))) raw.irrigation_mm[key.slice(11)]=event.target.value;
  else if(['rain_pct','temperature_c'].includes(key))raw[key]=event.target.value;
  else return;
  setScenario(raw);
});

async function openFieldMap() {
  const container=document.getElementById('field-map'),button=document.querySelector('[data-open-map]');
  if(!container || button.disabled || mapController)return;
  const request=++mapRequest;
  button.disabled=true;button.textContent='Loading field map…';container.hidden=false;
  const status=document.getElementById('map-status');status.textContent='Loading optional map. Coordinate entry remains available.';
  try {
    const controller=await createFieldMap({container,point:mapPoint(readFieldForm(document.getElementById('field-form'))),
      onStatus:message=>{if(container.isConnected)status.textContent=message;},
      onPick:point=>{
        if(!container.isConnected)return;
        for(const key of ['lat','lon']){
          const input=document.getElementById(key);input.value=point[key].toFixed(5);input.dispatchEvent(new Event('input',{bubbles:true}));
        }
      }});
    if(request!==mapRequest || !container.isConnected){controller?.destroy();return;}
    mapController=controller;
    document.getElementById('map-actions').hidden=false;
    button.hidden=true;
  } catch(error) {
    if(request!==mapRequest || !container.isConnected)return;
    container.hidden=true;button.disabled=false;button.textContent='Retry field map';status.textContent=error.message;
  }
}

function navIcon(path){
  const paths={'/':'M3 10 12 3l9 7v10H6V10m3 10v-7h6v7','/field':'m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6m6-3v15m6-12v15','/climate':'M4 16a4 4 0 0 1 0-8 6 6 0 0 1 11-2 5 5 0 0 1 3 10M8 19v2m5-2v2m5-2v2','/priorities':'M5 3v18m7-18v18m7-18v18M2 8h6m1 8h6m1-10h6','/compare':'M3 4h7v16H3V4m11 0h7v16h-7V4M6 9h1m-1 5h1m10-5h1m-1 5h1','/whatif':'m7 3-4 4 4 4M3 7h11a6 6 0 0 1 0 12h-4m7-4 4 4-4 4','/evidence':'M3 4h7l2 2 2-2h7v16h-7l-2 2-2-2H3V4m9 2v16'};
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[path]??paths['/']}"/></svg>`;
}

async function runDemo(){
  fieldDraft=structuredClone(DEMO_FARM);
  fieldMessage='Jaipur–Jobner demo is an unsaved draft. Your saved field and What-if settings are unchanged.';
  window.location.hash='#/compare';
  await refreshClimate('bundle');
}
function downloadBrief(){
  const status=document.getElementById('brief-status');
  try{
    const field=validateField(fieldDraft).field;
    if(!field || climateState.key!==climateKey(field) || !climateState.data || cropData.status!=='loaded')throw new Error('Load matching weather and crop data before downloading a brief.');
    const scoring=rankingFor(field,generateRotations(cropData.crops,field));
    const brief=buildDecisionBrief({field,scoring,climate:climateState.data,generatedAt:new Date().toISOString()});
    const url=URL.createObjectURL(new Blob([JSON.stringify(brief,null,2)+'\n'],{type:'application/json'})),link=document.createElement('a');
    link.href=url;link.download=`terraplan-decision-${climateState.data.ag_year}.json`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    status.textContent='Decision brief downloaded locally. It includes your field coordinates, assumptions and source references.';
  }catch(error){status.textContent=error.message;}
}
