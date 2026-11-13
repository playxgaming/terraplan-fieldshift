import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DEMO_FARM,loadClimate} from '../data.mjs';
import {generateRotations,scoreRotations,defaultPriorities,defaultScenario,validateScenario,applyScenario,evaluateScenario,SCENARIO_LIMITS} from '../engine.mjs';
import {SCENARIO_STORAGE_KEY,loadScenario,saveScenario} from '../scenario.mjs';
import {renderWhatIf,renderScenarioResults} from '../views.mjs';
const crops=JSON.parse(await readFile(new URL('../data/crops.json',import.meta.url),'utf8'));
const climate=await loadClimate(DEMO_FARM,{agYear:2025,mode:'bundle',fetcher:async url=>({ok:true,json:async()=>JSON.parse(await readFile(url,'utf8'))})});
const generated=generateRotations(crops,DEMO_FARM),weights=defaultPriorities();
const store=()=>{const data=new Map([['terraplan.v3.field','field unchanged']]);return {getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),data};};
test('scenario validation accepts exact bounds and rejects missing, coercible, nonfinite and out-of-range settings',()=>{
 for(const rain of [-50,30])assert(validateScenario({...defaultScenario(DEMO_FARM),rain_pct:rain,temperature_c:3}).valid);
 for(const bad of ['',null,true,[],{},NaN,Infinity,-51,31])assert(!validateScenario({...defaultScenario(DEMO_FARM),rain_pct:bad}).valid);
 for(const bad of [-0.1,3.1])assert(!validateScenario({...defaultScenario(DEMO_FARM),temperature_c:bad}).valid);
 for(const bad of ['',-1,1501])assert(!validateScenario({...defaultScenario(DEMO_FARM),irrigation_mm:{kharif:0,rabi:bad,zaid:0}}).valid);
 assert.equal(SCENARIO_LIMITS.irrigation_mm.max,1500);assert.equal(validateScenario(null).scenario,null);
});
test('perturbation scales rain, adds all temperatures and preserves missing, fill values, soil and original records',()=>{
 const input={daily:[{date:'2025-06-01',rain:10,tmax:40,tmin:20,t2m:30,gwetroot:0.4},{date:'2025-06-02',rain:null,tmax:-999,tmin:null,t2m:undefined}]};
 const before=JSON.stringify({input,field:DEMO_FARM});
 const changed=applyScenario(DEMO_FARM,input,{rain_pct:-50,temperature_c:3,irrigation_mm:{kharif:100,rabi:200,zaid:0}});
 assert.equal(changed.climate.daily[0].rain,5);for(const key of ['tmax','tmin','t2m'])assert.equal(changed.climate.daily[0][key],input.daily[0][key]+3);
 assert.equal(changed.climate.daily[1].rain,null);assert.equal(changed.climate.daily[1].tmax,-999);assert.equal(changed.climate.daily[1].t2m,undefined);
 assert.equal(changed.climate.daily[0].gwetroot,0.4);assert.equal(changed.field.irrigation_mm.rabi,200);assert.equal(JSON.stringify({input,field:DEMO_FARM}),before);
 assert.throws(()=>applyScenario(DEMO_FARM,input,{}),/Invalid/);
});
test('scenario persistence is versioned, keeps other keys and retains corrupt records with recoverable errors',()=>{
 const storage=store(),settings=defaultScenario(DEMO_FARM);assert.equal(loadScenario(storage).scenario,null);
 assert(saveScenario(storage,settings).saved);assert.deepEqual(loadScenario(storage).scenario,settings);
 assert.equal(storage.data.get('terraplan.v3.field'),'field unchanged');
 const good=storage.data.get(SCENARIO_STORAGE_KEY);assert(!saveScenario(storage,{}).saved);assert.equal(storage.data.get(SCENARIO_STORAGE_KEY),good);
 storage.data.set(SCENARIO_STORAGE_KEY,'bad bytes');assert(loadScenario(storage).error);assert.equal(storage.data.get(SCENARIO_STORAGE_KEY),'bad bytes');
 assert(loadScenario({getItem:()=>{throw Error('blocked')}}).error);assert(!saveScenario({setItem:()=>{throw Error('quota')}},settings).saved);
});
test('zero experiment matches baseline and holds the three IDs fixed across all four exact year recalculations',()=>{
 const before=JSON.stringify({generated,climate,field:DEMO_FARM}),settings=defaultScenario(DEMO_FARM);
 const result=evaluateScenario(generated,DEMO_FARM,climate,weights,settings);
 assert.equal(result.columns.length,3);assert.equal(result.sensitivity.length,4);
 for(const column of result.columns){assert.equal(column.changed.id,column.baseline.id);assert.equal(column.changed.total,column.baseline.total);}
 for(const row of result.sensitivity){const expected=scoreRotations(generated,DEMO_FARM,{...climate,ag_year:row.year},weights);const all=[expected.current,...expected.ranked];
 row.rotations.forEach((rotation,i)=>{assert.equal(rotation.id,result.columns[i].baseline.id);assert.equal(rotation.total,all.find(item=>item.id===rotation.id).total);});}
 for(let i=0;i<3;i++){const totals=result.sensitivity.map(row=>row.rotations[i].total).filter(Number.isFinite);assert.equal(result.extremes[i].best.score,Math.max(...totals));assert.equal(result.extremes[i].worst.score,Math.min(...totals));}
 assert.equal(JSON.stringify({generated,climate,field:DEMO_FARM}),before);
});
test('rain, heat and irrigation edits change scores without replacing baseline options or changing original scores',()=>{
 const base=scoreRotations(generated,DEMO_FARM,climate,weights),ids=[base.current,...base.options].map(row=>row.id);
 for(const settings of [{...defaultScenario(DEMO_FARM),rain_pct:-50},{...defaultScenario(DEMO_FARM),temperature_c:3},{...defaultScenario(DEMO_FARM),irrigation_mm:{kharif:500,rabi:500,zaid:0}}]){
 const result=evaluateScenario(generated,DEMO_FARM,climate,weights,settings);
 assert.deepEqual(result.columns.map(column=>column.changed.id),ids);assert(result.columns.some(column=>column.changed.total!==column.baseline.total));}
 assert.equal(scoreRotations(generated,DEMO_FARM,climate,weights).current.total,base.current.total);
});
test('missing historical weather stays unscored and cannot win best or worst year',()=>{
 const result=evaluateScenario(generated,DEMO_FARM,{...climate,daily:[],years_available:[2025]},weights,defaultScenario(DEMO_FARM));
 assert.equal(result.columns[0].changed.total,null);assert.equal(result.columns[1],null);assert.equal(result.extremes[0].best,null);assert.equal(result.extremes[0].worst,null);
 assert.match(renderScenarioResults(result),/Not scored/);
});
test('scenario view labels all controls, fixed plans, missing states and historical assumptions with escaped content',()=>{
 const html=renderWhatIf({field:DEMO_FARM});assert.equal((html.match(/data-scenario=/g)||[]).length,5);assert.match(html,/settings are saved separately/i);assert.match(html,/Missing data are not treated as zero/);
 const result=evaluateScenario(generated,DEMO_FARM,climate,weights,defaultScenario(DEMO_FARM));
 result.columns[0].baseline.seasons.kharif.crop.name='<script>bad</script>';
 const rendered=renderScenarioResults(result);assert(!rendered.includes('<script>'));assert.match(rendered,/Best available year/);assert.match(rendered,/not a four-year forecast/);assert.match(rendered,/IDs stay fixed/);
});
