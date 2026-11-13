import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MODEL, PRIORITIES, defaultPriorities, validatePriorities, seasonFit, prepareScoring, rankRotations, scoreRotations, generateRotations } from '../engine.mjs';
import { DEMO_FARM, parsePowerDaily } from '../data.mjs';
import { SEASONS } from '../field.mjs';
import { renderPriorities, renderEvidence } from '../views.mjs';

const crops = JSON.parse(await readFile(new URL('../data/crops.json',import.meta.url),'utf8'));
function crop(id,season,month,extra={}) {
  return { ...structuredClone(crops[0]), id,name:id,family:id,seasons:[season],start_months:[month],duration_months:1,water_need_mm:100,
    heat_threshold_c:35,cold_threshold_c:5,roles:[],heavy_feeder:false,verified:true,regional_common:true,
    forage:0,n_fixation:0,erosion_cover:0,organic_matter:0,market:0,...extra };
}
function rotation(id,slots,is_current=false) {
  return { id,is_current,warnings:[],seasons:Object.fromEntries(SEASONS.map((season,index)=>{
    const crop=slots[index];
    if(!crop)return [season,null];
    const month=crop.start_months[0], offset=(month-6+12)%12;
    return [season,{crop,start:month,end:month,start_offset:offset,end_offset:offset}];
  })) };
}
function climate(change=()=>({})) {
  const daily=[];
  for(let date=new Date('2025-06-01T00:00:00Z');date<new Date('2026-06-01T00:00:00Z');date=new Date(date.getTime()+86400000)) {
    daily.push({date:date.toISOString().slice(0,10),rain:0,t2m:25,tmax:25,tmin:15,gwetroot:0.5,gwettop:0.4,...change(date)});
  }
  return {ag_year:2025,daily};
}
const farm = extra=>({...structuredClone(DEMO_FARM),soil_tested:true,irrigation_mm:{kharif:100,rabi:100,zaid:100},...extra});
const generated = (...rotations)=>({rotations,excluded:[]});
const weights = key=>({...Object.fromEntries(PRIORITIES.map(({key})=>[key,0])),[key]:5});

test('per-season fit follows effective-rain, water, heat, cold and gap formulas exactly',()=>{
  const metrics={rain_mm:100,heat_days:3,cold_days:1,days:10,missing:0};
  const fit=seasonFit(metrics,{water_need_mm:100},35);
  assert.equal(fit.effective_rain,65);
  assert.equal(fit.usable_water,100);
  assert.equal(fit.water_fit,100);
  assert.equal(fit.heat_fit,70);
  assert.equal(fit.cold_fit,90);
  assert.equal(fit.season_fit,260/3);
  assert.equal(fit.water_gap,0);
  assert.equal(fit.feasible,true);
  assert.equal(seasonFit({...metrics,days:0},{water_need_mm:100},0).season_fit,null);
  assert.equal(seasonFit(metrics,{water_need_mm:100},1501).season_fit,null);
  assert.equal(seasonFit(metrics,{water_need_mm:100},-1).season_fit,null);
});

test('the weaker season pulls climate fit below a simple mean, and Bare is excluded from that fit',()=>{
  const k=crop('strong','kharif',6), r=crop('weak','rabi',7);
  const data=climate(date=>({tmax:date.getUTCMonth()===6?45:25}));
  const field=farm({irrigation_mm:{kharif:100,rabi:0,zaid:0}});
  const prepared=prepareScoring(generated(rotation('both',[k,r,null],true),rotation('one',[k,null,null])),field,data);
  const both=prepared.rotations[0], one=prepared.rotations[1];
  assert.equal(one.climate_fit,100);
  const fits=Object.values(both.season_fits).filter(Boolean).map(fit=>fit.season_fit);
  assert(Math.abs(both.climate_fit-50)<1e-10);
  assert(both.climate_fit<(fits[0]+fits[1])/2);
});

test('crop priorities average all three slots with Bare as zero; water uses the largest retained rotation need',()=>{
  const k=crop('a','kharif',6,{forage:9,n_fixation:6}),r=crop('b','rabi',7,{forage:9});
  const prepared=prepareScoring(generated(rotation('current',[k,r,null],true),rotation('single',[k,null,null])),farm(),climate());
  assert.equal(prepared.max_rotation_water_need,200);
  assert.equal(prepared.rotations[0].priority_values.forage,60);
  assert.equal(prepared.rotations[1].priority_values.forage,30);
  assert.equal(prepared.rotations[1].priority_values.n_fixation,20);
  assert.equal(prepared.rotations[0].priority_values.water,0);
  assert.equal(prepared.rotations[1].priority_values.water,50);
});

test('changing a priority reverses the ranking and all-zero weights produce the specified neutral component',()=>{
  const base=crop('current','kharif',6),feed=crop('feed','kharif',6,{forage:10}),market=crop('market','kharif',6,{market:10});
  const prepared=prepareScoring(generated(rotation('current',[base,null,null],true),rotation('feed',[feed,null,null]),rotation('market',[market,null,null])),farm(),climate());
  assert.equal(rankRotations(prepared,weights('forage')).ranked[0].id,'feed');
  assert.equal(rankRotations(prepared,weights('market')).ranked[0].id,'market');
  const zero=Object.fromEntries(PRIORITIES.map(({key})=>[key,0]));
  assert(rankRotations(prepared,zero).ranked.every(row=>row.priority_score===50 && row.total===75));
});

test('cyclic same-family penalties and nitrogen-after-heavy bonuses have explicit reasons',()=>{
  const k=crop('heavy','kharif',6,{family:'Poaceae',heavy_feeder:true});
  const r=crop('legume','rabi',7,{family:'Fabaceae',roles:['nitrogen-fixer']});
  const z=crop('fodder','zaid',8,{family:'Poaceae',heavy_feeder:true});
  const row=prepareScoring(generated(rotation('cycle',[k,r,z],true)),farm(),climate()).rotations[0];
  assert.equal(row.rule_adjust,-2);
  assert(row.rule_reasons.some(reason=>reason.code==='same-family' && reason.delta===-8 && reason.text.includes('next kharif')));
  assert(row.rule_reasons.some(reason=>reason.code==='nitrogen-after-heavy' && reason.delta===6));
  assert(row.rule_reasons.every(reason=>reason.text.length));
  const same=prepareScoring(generated(rotation('same',[k,{...r,family:'Poaceae',roles:[]},{...z,heavy_feeder:false}],true)),farm(),climate()).rotations[0];
  assert.equal(same.rule_adjust,-24);
  const bare=prepareScoring(generated(rotation('bare',[k,null,z],true)),farm(),climate()).rotations[0];
  assert.equal(bare.rule_reasons.filter(reason=>reason.code==='same-family').length,1);
});

test('Bare-season penalty uses the inclusive cover threshold and never uses a warned current crop as evidence of an allowed option',()=>{
  const k=crop('a','kharif',6),r=crop('b','rabi',7);
  const input=generated(rotation('current',[k,null,null],true),rotation('with-rabi',[k,r,null]));
  const atThreshold=prepareScoring(input,farm({irrigation_mm:{kharif:100,rabi:60,zaid:0}}),climate());
  assert.equal(atThreshold.cover_possible.rabi,true);
  assert.equal(atThreshold.rotations[0].rule_adjust,-6);
  const below=prepareScoring(input,farm({irrigation_mm:{kharif:100,rabi:59.99,zaid:0}}),climate());
  assert.equal(below.cover_possible.rabi,false);
  assert.equal(below.rotations[0].rule_adjust,0);
  const warned=rotation('warned',[null,r,null],true);warned.warnings=['Crop not suited to this soil'];
  const safe=prepareScoring(generated(warned,rotation('only-kharif',[k,null,null])),farm(),climate());
  assert.equal(safe.cover_possible.rabi,false);
});

test('exactly 40 percent water gap passes; any greater gap makes the rotation infeasible and keeps its reason',()=>{
  const metrics={rain_mm:0,heat_days:0,cold_days:0,days:30,missing:0};
  assert.equal(seasonFit(metrics,{water_need_mm:100},60).feasible,true);
  assert.equal(seasonFit(metrics,{water_need_mm:100},59.99).feasible,false);
  const row=prepareScoring(generated(rotation('current',[crop('a','kharif',6),crop('b','rabi',7),null],true)),farm({irrigation_mm:{kharif:100,rabi:59,zaid:0}}),climate()).rotations[0];
  assert.equal(row.feasible,false);
  assert.equal(row.feasibility_label,'Not feasible without extra water');
  assert(row.feasibility_reasons.some(reason=>reason.includes('rabi') && reason.includes('40%')));
});

test('comparison selection prefers passing alternatives, fills from infeasible ones if needed, and never repeats current or selects missing totals',()=>{
  const row=(id,is_current,fit,feasible)=>({id,is_current,climate_fit:fit,priority_values:Object.fromEntries(PRIORITIES.map(({key})=>[key,fit??100])),rule_adjust:0,feasible});
  const current=row('current',true,100,true),bad=row('bad',false,100,false),good=row('good',false,40,true),other=row('other',false,20,true),unknown=row('unknown',false,null,null);
  const result=rankRotations({rotations:[current,bad,good,other,unknown],excluded:[],max_rotation_water_need:100});
  assert.deepEqual(result.options.map(row=>row.id),['good','other']);
  assert.equal(result.ranked[0].id,'bad');
  assert.equal(result.ranked.at(-1).total,null);
  const fallback=rankRotations({rotations:[current,bad,good,unknown],excluded:[],max_rotation_water_need:100});
  assert.deepEqual(fallback.options.map(row=>row.id),['good','bad']);
  assert.match(fallback.selection_note,/warning kept/);
  assert.equal(rankRotations({rotations:[current,unknown],excluded:[],max_rotation_water_need:100}).options.length,0);
});

test('confidence explains High, Medium and every specified Low cause',()=>{
  const k=crop('verified','kharif',6);
  const make=(row,field=farm(),data=climate())=>prepareScoring(generated(row),field,data).rotations[0].confidence;
  assert.equal(make(rotation('current',[k,null,null],true)).level,'High');
  assert.equal(make(rotation('current',[k,null,null],true),farm({soil_tested:false})).level,'Medium');
  for(const patch of [{verified:false},{regional_common:false},{seasons:['rabi']},{start_months:[7]}]) {
    const changed=rotation('current',[{...k,...patch},null,null],true);
    changed.seasons.kharif.start=6;changed.seasons.kharif.end=6;changed.seasons.kharif.start_offset=0;changed.seasons.kharif.end_offset=0;
    const confidence=make(changed);
    assert.equal(confidence.level,'Low');
    assert(confidence.reasons.length>=2);
  }
  const missing=climate();missing.daily=missing.daily.filter(row=>row.date!=='2025-06-01');
  const result=make(rotation('current',[k,null,null],true),farm(),missing);
  assert.equal(result.level,'Low');
  assert(result.reasons.some(reason=>reason.includes('missing days')));
});

test('unknown crop windows and all-Bare plans retain current with null totals, not fabricated neutral scores',()=>{
  const k=crop('known','kharif',6);
  const missing=rotation('current',[k,null,null],true);
  missing.seasons.kharif.crop={id:'unknown',name:'Unknown crop',unavailable:true};
  missing.seasons.kharif.start=null;missing.seasons.kharif.end=null;missing.seasons.kharif.start_offset=null;missing.seasons.kharif.end_offset=null;
  for(const current of [missing,rotation('current',[null,null,null],true)]) {
    const result=scoreRotations(generated(current),farm(),climate());
    assert.equal(result.current.total,null);
    assert.equal(result.current.confidence.level,'Low');
    assert.equal(result.current.feasible,null);
    assert(result.current.unscored_reasons.length);
  }
});

test('score clamps and priority validation prevent out-of-range scores or invalid weights',()=>{
  const row=(id,climate_fit,rule_adjust)=>({id,is_current:false,climate_fit,rule_adjust,priority_values:Object.fromEntries(PRIORITIES.map(({key})=>[key,climate_fit])),feasible:true});
  const prepared={rotations:[row('high',100,6),row('low',0,-8)],excluded:[],max_rotation_water_need:100};
  assert.deepEqual(rankRotations(prepared).ranked.map(row=>row.total),[100,0]);
  assert(Object.values(defaultPriorities()).every(value=>value===3));
  for(const value of [NaN,Infinity,'3','',null,-1,6,1.5]) {
    const invalid={...defaultPriorities(),water:value};
    assert.equal(validatePriorities(invalid).valid,false);
    assert.throws(()=>rankRotations(prepared,invalid),RangeError);
  }
});

test('actual demo scoring is pure and every scored starter result has Low confidence with reasons',async()=>{
  const payload=JSON.parse(await readFile(new URL('../data/demo-power-daily.json',import.meta.url),'utf8'));
  const data={ag_year:2025,daily:parsePowerDaily(payload,'20220601','20260531')};
  const input=generateRotations(crops,DEMO_FARM);
  const before=JSON.stringify({input,data,field:DEMO_FARM});
  const result=scoreRotations(input,DEMO_FARM,data);
  assert.equal(JSON.stringify({input,data,field:DEMO_FARM}),before);
  assert.equal(result.current.id,input.rotations.find(row=>row.is_current).id);
  assert(result.current.total!==null);
  assert.equal(result.ranked.length,input.rotations.length-1);
  assert(result.ranked.every(row=>row.confidence.level==='Low' && row.confidence.reasons.some(reason=>reason.includes('unverified'))));
  assert(result.ranked.some(row=>row.feasible===false));
  assert(result.options.every(row=>row.id!==result.current.id));
  console.log(`Jaipur scoring: current ${result.current.total.toFixed(2)}, ${result.ranked.filter(row=>row.total!==null).length} scored alternatives, ${result.ranked.filter(row=>row.total===null).length} unavailable totals`);
});

test('priority view has six labelled ranges and preserves scores, unknowns, confidence and source labels in its preview',()=>{
  const input=generated(rotation('current',[crop('current','kharif',6),null,null],true),rotation('alternative',[crop('alternative','kharif',6),null,null]));
  const scoring=scoreRotations(input,farm(),climate());
  const html=renderPriorities({scoring,field:farm(),priorities:defaultPriorities()});
  assert.equal((html.match(/type="range"/g)??[]).length,6);
  for(const {key} of PRIORITIES)assert(html.includes(`for="priority-${key}"`));
  assert(html.includes('id="ranking-status"'));
  assert(html.includes('not yield or profit predictions'));
  assert(html.includes('Confidence: High'));
  assert(html.includes('Passes the water-gap rule'));
  assert(html.includes('Your current'));
  const evidence=renderEvidence();
  for(const key of Object.keys(MODEL))assert(evidence.includes(`<dt>${key}</dt>`));
});
