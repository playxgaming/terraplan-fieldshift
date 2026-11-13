import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DEMO_FARM,DEMO_CONTEXT,loadClimate,isDemoPoint} from '../data.mjs';
import {generateRotations,scoreRotations} from '../engine.mjs';
import {buildDecisionBrief} from '../brief.mjs';
import {renderCompare,renderDemoContext} from '../views.mjs';
const crops=JSON.parse(await readFile(new URL('../data/crops.json',import.meta.url),'utf8'));
const fetcher=async url=>({ok:true,json:async()=>JSON.parse(await readFile(url,'utf8'))});
const climate=await loadClimate(DEMO_FARM,{agYear:2025,mode:'bundle',fetcher});
const generated=generateRotations(crops,DEMO_FARM),scoring=scoreRotations(generated,DEMO_FARM,climate);
const generatedAt='2026-11-13T18:30:00Z';
test('Jaipur demo uses freshly located Jobner weather and makes scenario assumptions explicit',()=>{
 assert.deepEqual(climate.point,{lat:26.97,lon:75.38});assert.equal(climate.daily.length,1461);assert.deepEqual(climate.years_available,[2022,2023,2024,2025]);
 assert.equal(DEMO_FARM.soil,'loam');assert.equal(DEMO_FARM.soil_tested,false);assert.equal(DEMO_FARM.water_source,'well');
 assert.deepEqual(DEMO_FARM.current_rotation,{kharif:'bajra',rabi:'wheat',zaid:null});assert.equal(isDemoPoint({lat:22.3,lon:70.8}),false);
 assert.match(DEMO_CONTEXT.soil_note,/scenario/);assert.match(DEMO_CONTEXT.region_note,/do not verify/);assert.equal(DEMO_CONTEXT.sources.length,2);
 for(const dataset of climate.datasets){const url=new URL(dataset.request_url);assert.equal(url.searchParams.get('latitude'),'26.97');assert.equal(url.searchParams.get('longitude'),'75.38');}
 const expected=[50.42505334138486,71.26031337224906,70.05564722475208];[scoring.current,...scoring.options].forEach((plan,i)=>assert(Math.abs(plan.total-expected[i])<1e-9));
 assert(scoring.options[0].season_fits.rabi.water_gap>0);assert.equal(scoring.options[0].feasible,true);
});
test('decision brief preserves exact baseline evidence, model assumptions and compared IDs without mutating state',()=>{
 const before=JSON.stringify({field:DEMO_FARM,climate,scoring});
 const brief=buildDecisionBrief({field:DEMO_FARM,climate,scoring,generatedAt});
 assert.equal(brief.schema,'terraplan.decision-brief.v1');assert.equal(brief.field.name,DEMO_FARM.name);assert.equal(brief.plans.length,3);
 [scoring.current,...scoring.options].forEach((plan,i)=>{assert.equal(brief.plans[i].id,plan.id);assert.equal(brief.plans[i].relative_score,plan.total);assert.equal(brief.plans[i].confidence.level,'Low');});
 assert(brief.historical_evidence.datasets.every(dataset=>dataset.request_url.includes('latitude=26.97')));
 assert.match(brief.limitations.join(' '),/shortfall/);assert.match(brief.purpose,/not yield, profit/);
 brief.field.irrigation_mm.rabi=999;brief.plans[0].seasons.kharif.crop.water_need_mm=999;
 assert.equal(JSON.stringify({field:DEMO_FARM,climate,scoring}),before);
});
test('decision brief rejects stale location and invalid inputs; missing plans and scores stay null',()=>{
 assert.throws(()=>buildDecisionBrief({field:DEMO_FARM,climate:{...climate,point:{lat:22.3,lon:70.8}},scoring,generatedAt}),/does not match/);
 assert.throws(()=>buildDecisionBrief({field:DEMO_FARM,climate,scoring,generatedAt:'invalid'}),/required/);
 const missing=scoreRotations(generated,DEMO_FARM,{...climate,daily:[]});const brief=buildDecisionBrief({field:DEMO_FARM,climate,scoring:missing,generatedAt});
 assert.equal(brief.plans[0].relative_score,null);assert.equal(brief.plans[1],null);assert.equal(brief.plans[2],null);
});
test('Jaipur context and comparison show local limitations, loading and recoverable errors safely',()=>{
 const html=renderDemoContext();assert.match(html,/Mustard, barley and cluster bean/);assert.match(html,/not a surveyed or university-endorsed farm/);assert.match(html,/2011/);assert.match(html,/2021/);
 const args={field:DEMO_FARM,generated,cropData:{crops,status:'loaded',errors:[]},climateMatches:true};
 assert.match(renderCompare({...args,climateState:{status:'loading',data:null}}),/Loading historical weather/);
 const failure=renderCompare({...args,climateState:{status:'error',data:null,error:'<script>network failed</script>'}});assert(!failure.includes('<script>'));assert.match(failure,/Retry weather/);
 const ready=renderCompare({...args,scoring,climateState:{status:'loaded',data:climate}});assert.match(ready,/data-download-brief/);assert.match(ready,/do not establish suitability/);
});
