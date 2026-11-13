import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { POWER, DEMO_FARM, latestCompleteAgYear, buildPowerRequests, powerCacheKey, parsePowerDaily, parsePowerMonthly, fetchPowerRecord, loadClimate } from '../data.mjs';
import { seasonClimate } from '../engine.mjs';
import { renderClimate, renderEvidence } from '../views.mjs';

const json = async path => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const small = await json('./fixtures/power-small.json');
const bundles = { daily: await json('../data/demo-power-daily.json'), monthly: await json('../data/demo-power-monthly.json') };
const requests = buildPowerRequests(DEMO_FARM, 2025);
const now = () => new Date('2026-11-13T12:00:00Z');
function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: key => values.get(key) ?? null, setItem: (key,value) => values.set(key,value), values };
}
function fetcher({ offline = false, failMonthly = false, calls = [] } = {}) {
  return async url => {
    const value = String(url), remote = value.startsWith('https://power.larc.nasa.gov/');
    const kind = value.includes('monthly') ? 'monthly' : 'daily';
    calls.push({remote,kind});
    if ((remote && offline) || (kind === 'monthly' && failMonthly)) throw new Error('Test network unavailable');
    return { ok: true, json: async () => structuredClone(bundles[kind]) };
  };
}

test('agricultural year boundaries and request ranges follow the specification, with finite rounded coordinates', () => {
  for (const [date,year] of [['2026-01-01',2024],['2026-06-30',2024],['2026-07-01',2025],['2026-12-31',2025]]) assert.equal(latestCompleteAgYear(new Date(date)),year);
  const request = buildPowerRequests({...DEMO_FARM, lat:26.971,lon:75.381},2025);
  assert.equal(request.daily.start,'20220601');
  assert.equal(request.daily.end,'20260531');
  assert.equal(request.monthly.start,'1991');
  assert.equal(request.monthly.end,'2024');
  assert.equal(new URL(request.daily.request_url).searchParams.get('parameters'),Object.values(POWER.daily_parameters).join(','));
  assert.equal(new URL(request.monthly.request_url).searchParams.get('parameters'),'PRECTOTCORR_SUM,T2M_MAX');
  assert.equal(powerCacheKey(request.daily),powerCacheKey(requests.daily));
  assert.notEqual(powerCacheKey(request.daily),powerCacheKey(request.monthly));
  for (const lat of [NaN,Infinity,'22.3',null,91]) assert.throws(()=>buildPowerRequests({...DEMO_FARM,lat},2025));
});

test('daily parsing converts -999 and absent dates to null while preserving real zeros', () => {
  const daily = parsePowerDaily(small,'20250601','20250630');
  assert.equal(daily.length,30);
  assert.equal(daily[0].rain,0);
  assert.equal(daily[17].rain,null);
  assert.equal(daily[24].t2m,null);
  assert(Object.entries(daily[26]).filter(([key])=>key!=='date').every(([,value])=>value===null));
  assert.throws(()=>parsePowerDaily({},'20250601','20250630'),/parameters/);
  assert.throws(()=>parsePowerDaily(small,'20250230','20250301'),/date/);
  const modified=structuredClone(small);modified.properties.parameter.GWETROOT['20250601']=2;
  assert.equal(parsePowerDaily(modified,'20250601','20250601')[0].gwetroot,null);
});

test('known fixture yields exact seasonal metrics, missing counts and a 10-day dry spell', () => {
  const daily=parsePowerDaily(small,'20250601','20250630');
  const climate={ag_year:2025,daily};
  const window={start:6,end:6}, crop={heat_threshold_c:35,cold_threshold_c:2};
  const result=seasonClimate(climate,window,crop);
  assert.equal(result.rain_mm,205);
  assert.equal(result.heat_days,2);
  assert.equal(result.cold_days,1);
  assert.equal(result.heavy_rain,2);
  assert.equal(result.dry_spell_max,10);
  assert.equal(result.days,27);
  assert.equal(result.missing,3);
  assert(Math.abs(result.soil_wet_mean-13.7/27)<1e-12);
  assert.equal(result.start_date,'2025-06-01');
  assert.equal(result.end_date,'2025-06-30');
  assert.match(result.reason,/partial sum/);
  assert.equal(seasonClimate(climate,null,crop),null);
});

test('missing days break dry spells, all-missing metrics are null, and windows handle leap years and year wrapping', () => {
  const sample={date:'2025-06-01',rain:0,t2m:25,tmax:35,tmin:2,gwetroot:0.5,gwettop:0.4};
  const daily=Array.from({length:30},(_,i)=>({...sample,date:`2025-06-${String(i+1).padStart(2,'0')}`}));
  daily[14].rain=null;
  const crop={heat_threshold_c:35,cold_threshold_c:2};
  const result=seasonClimate({ag_year:2025,daily},{start:6,end:6},crop);
  assert.equal(result.dry_spell_max,15);
  assert.equal(result.days,29);
  assert.equal(result.heat_days,0);
  const absent=seasonClimate({ag_year:2023,daily:[]},{start:2,end:2},crop);
  assert.equal(absent.missing,29);
  assert.equal(absent.rain_mm,null);
  assert.equal(absent.dry_spell_max,null);
  const wrapped=seasonClimate({ag_year:2023,daily:[]},{start_offset:6,end_offset:8},crop);
  assert.equal(wrapped.start_date,'2023-12-01');
  assert.equal(wrapped.end_date,'2024-02-29');
  assert.equal(wrapped.missing,91);
  const beyond=seasonClimate({ag_year:2025,daily:[]},{start_offset:12,end_offset:12},crop);
  assert.equal(beyond.start_date,'2026-06-01');
  assert.equal(beyond.missing,30);
  assert.equal(seasonClimate({ag_year:2025,daily:[]},{start:null,end:null},crop).missing,null);
});

test('monthly parsing omits month 13, preserves raw sums and never treats missing as zero', () => {
  const payload={properties:{parameter:{PRECTOTCORR_SUM:{'202401':0,'202402':-999,'202413':9999},T2M_MAX:{'202401':30,'202413':999}}},header:{fill_value:-999}};
  const result=parsePowerMonthly(payload,2024,2024);
  assert.equal(result.length,12);
  assert.equal(result[0].rain_sum,0);
  assert.equal(result[1].rain_sum,null);
  assert(!result.some(row=>row.date.endsWith('-13')));
  assert.equal(result.at(-1).rain_sum,null);
});

test('live records are cached by location/range and cache fallback preserves original retrieval times and other state', async () => {
  const savedField='keep field', whatif='keep scenarios';
  const store=storage({'terraplan.v3.field':savedField,'terraplan.v3.whatif':whatif});
  const live=await loadClimate(DEMO_FARM,{agYear:2025,fetcher:fetcher(),storage:store,now});
  assert.equal(live.source,'live');
  assert.equal(live.daily.length,1461);
  assert.equal(live.monthly.length,408);
  assert.equal(live.monthly_trend.rain_years.length,34);
  assert.equal(live.retrieved_at,now().toISOString());
  assert.equal(live.datasets.length,2);
  const calls=[];
  const cached=await loadClimate(DEMO_FARM,{agYear:2025,fetcher:fetcher({offline:true,calls}),storage:store,now});
  assert.equal(cached.source,'cache');
  assert.equal(cached.retrieved_at,live.retrieved_at);
  assert(cached.datasets.every(dataset=>dataset.source==='cache' && dataset.fallback_reason));
  assert(calls.every(call=>call.remote),'Valid cache should avoid bundled fetches');
  assert.equal(store.getItem('terraplan.v3.field'),savedField);
  assert.equal(store.getItem('terraplan.v3.whatif'),whatif);
});

test('Jaipur loads from real bundles without NASA access, including explicit bundle-only mode', async () => {
  const calls=[];
  const offline=await loadClimate(DEMO_FARM,{agYear:2025,fetcher:fetcher({offline:true,calls}),storage:storage(),now});
  assert.equal(offline.source,'demo-bundle');
  assert.equal(offline.retrieved_at,bundles.daily._terraplan.retrieved_at);
  assert(offline.daily.some(row=>row.rain!==null));
  assert.deepEqual(offline.request_urls,[requests.daily.request_url,requests.monthly.request_url]);
  assert.equal(calls.filter(call=>call.remote).length,2);
  const explicitCalls=[];
  const explicit=await loadClimate(DEMO_FARM,{agYear:2025,mode:'bundle',fetcher:fetcher({calls:explicitCalls})});
  assert.equal(explicit.source,'demo-bundle');
  assert(explicitCalls.every(call=>!call.remote));
  assert.match(explicit.soil_note,/MERRA-2 model/);
});

test('wrong-location or wrong-range bundles and caches are rejected; corrupt cache bytes are preserved', async () => {
  const store=storage({[powerCacheKey(requests.daily)]:'{corrupt'});
  const result=await loadClimate(DEMO_FARM,{agYear:2025,fetcher:fetcher({offline:true}),storage:store});
  assert.equal(result.source,'demo-bundle');
  assert.equal(store.getItem(powerCacheKey(requests.daily)),'{corrupt');
  const calls=[];
  await assert.rejects(loadClimate({...DEMO_FARM,lat:20},{agYear:2025,fetcher:fetcher({offline:true,calls}),storage:storage()}),/No valid cache/);
  assert(calls.every(call=>call.remote),'Never attempt to serve the Jaipur bundle for another point');
  await assert.rejects(loadClimate(DEMO_FARM,{agYear:2024,mode:'bundle',fetcher:fetcher()}),/match/);
});

test('timeouts abort the request and cover slow body reads as well as slow headers', async () => {
  for (const slowBody of [false,true]) {
    let signal;
    const fetcher=async (_url,options)=>{signal=options.signal;return slowBody ? {ok:true,json:()=>new Promise(()=>{})} : new Promise(()=>{});};
    await assert.rejects(fetchPowerRecord(requests.daily,{fetcher,timeoutMs:5}),/timed out/);
    assert(signal.aborted);
  }
});

test('malformed live responses are rejected before caching and quota errors do not hide successfully loaded data', async () => {
  const malformed=structuredClone(bundles.daily);malformed.geometry.coordinates=[0,0];
  await assert.rejects(fetchPowerRecord(requests.daily,{fetcher:async()=>({ok:true,json:async()=>malformed})}),/location/);
  malformed.geometry.coordinates=[70.8];
  await assert.rejects(fetchPowerRecord(requests.daily,{fetcher:async()=>({ok:true,json:async()=>malformed})}),/location/);
  const blocked={getItem(){throw new Error('blocked');},setItem(){throw new Error('quota');}};
  const result=await loadClimate(DEMO_FARM,{agYear:2025,fetcher:fetcher(),storage:blocked,now});
  assert.equal(result.source,'live');
  assert(result.warnings.every(message=>message.includes('could not cache')));
  assert.equal(result.warnings.length,2);
});

test('monthly failure leaves daily data usable and is reported explicitly', async () => {
  const result=await loadClimate(DEMO_FARM,{agYear:2025,fetcher:fetcher({failMonthly:true}),now});
  assert.equal(result.source,'live');
  assert.equal(result.monthly,null);
  assert.match(result.monthly_error,/Retry/);
  assert.equal(result.datasets.length,1);
});

test('weather views distinguish missing values, partial totals, provenance and stale locations', async () => {
  const data=await loadClimate(DEMO_FARM,{agYear:2025,mode:'bundle',fetcher:fetcher()});
  const values=seasonClimate({ag_year:2025,daily:[]},{start:6,end:6},{heat_threshold_c:35,cold_threshold_c:2});
  const generated={rotations:[{is_current:true,seasons:{kharif:{crop:{name:'Test crop'}},rabi:null,zaid:null}}]};
  const html=renderClimate({field:DEMO_FARM,climateState:{status:'loaded',data},climateMatches:true,metrics:{kharif:values,rabi:null,zaid:null},generated});
  assert(html.includes('Missing'));
  assert(html.includes('Rain (partial total)'));
  assert(html.includes('MERRA-2 model'));
  assert(html.includes('bundled Jaipur records'));
  const stale=renderClimate({field:DEMO_FARM,climateState:{status:'loaded',data},climateMatches:false});
  assert(stale.includes('another location'));
  assert(!stale.includes('season-climate-grid'));
  const evidence=renderEvidence({climateState:{status:'loaded',data}});
  assert(evidence.includes(data.datasets[0].retrieved_at));
  assert(evidence.includes('Provider parameter metadata'));
  assert(evidence.includes('month-13 entries excluded'));
});
