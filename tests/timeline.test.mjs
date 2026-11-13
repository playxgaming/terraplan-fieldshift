import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildTimeline, timelineWarnings, generateRotations, scoreRotations } from '../engine.mjs';
import { DEMO_FARM, parsePowerDaily } from '../data.mjs';
import { renderTimeline, renderCompare } from '../views.mjs';

const crop = (id='test',extra={}) => ({id,name:id,duration_months:4,heat_threshold_c:35,cold_threshold_c:2,...extra});
const window = (start,end,plant=crop()) => ({crop:plant,start_offset:start,end_offset:end,start:(start+5)%12+1,end:(end+5)%12+1});
const rotation = (kharif=null,rabi=null,zaid=null) => ({id:'fixture',is_current:true,warnings:[],seasons:{kharif,rabi,zaid}});
function climate(year=2025,change=()=>({})) {
  const daily=[];
  for(let date=new Date(Date.UTC(year,5,1));date<new Date(Date.UTC(year+1,5,1));date=new Date(date.getTime()+86400000)) {
    daily.push({date:date.toISOString().slice(0,10),rain:10,t2m:25,tmax:30,tmin:10,gwetroot:0.5,gwettop:0.4,...change(date)});
  }
  return {ag_year:year,daily,source:'demo-bundle',retrieved_at:'2026-11-13T12:00:00Z'};
}
const cell = (cells,month) => cells.find(value=>value.month===month);

test('timeline has exactly twelve June-to-May cells with the right calendar years and known Bare months',()=>{
  const cells=buildTimeline(rotation(window(0,3),window(4,8,crop('winter',{duration_months:5}))),climate());
  assert.deepEqual(cells.map(value=>value.month),[6,7,8,9,10,11,12,1,2,3,4,5]);
  assert(cells.slice(0,7).every(value=>value.year===2025));
  assert(cells.slice(7).every(value=>value.year===2026));
  assert.deepEqual(cells.filter(value=>value.bare).map(value=>value.month),[3,4,5]);
  assert.equal(cell(cells,6).crop.id,'test');
  assert.equal(cell(cells,1).crop.id,'winter');
  assert(cells.filter(value=>value.bare).every(value=>value.crop===null && value.flags.length===0));
});

test('heat, cold and heavy rain markers use exact day-count and strict/inclusive weather thresholds',()=>{
  const data=climate(2025,date=>{
    const day=date.getUTCDate(),month=date.getUTCMonth()+1;
    if(month!==6)return {};
    return {tmax:day<=3?36:35,tmin:day<=2?1:2,rain:day===4?64.5:10};
  });
  const june=cell(buildTimeline(rotation(window(0,0,crop('one',{duration_months:1}))),data),6);
  assert.deepEqual(june.flags,['heat','heat at flowering','cold','flood']);
  assert.equal(june.assessments[0].heat_days,3);
  assert.equal(june.assessments[0].cold_days,2);
  assert.equal(june.assessments[0].heavy_rain,1);
  const below=climate(2025,date=>({tmax:date.getUTCMonth()===5 && date.getUTCDate()<=2?36:35,tmin:date.getUTCMonth()===5 && date.getUTCDate()===1?1:2,rain:64.49}));
  assert.deepEqual(cell(buildTimeline(rotation(window(0,0)),below),6).flags,[]);
});

test('heat at flowering requires heat in the assumed flowering month, including January after a November sowing',()=>{
  const plant=crop('winter',{duration_months:4});
  const data=climate(2025,date=>({tmax:[11,1].includes(date.getUTCMonth()+1) && date.getUTCDate()<=3?36:30}));
  const cells=buildTimeline(rotation(null,window(5,8,plant)),data);
  assert(cell(cells,11).flags.includes('heat'));
  assert(!cell(cells,11).flags.includes('heat at flowering'));
  assert(cell(cells,1).flags.includes('heat at flowering'));
  assert.equal(cell(cells,1).year,2026);
  assert(!cell(cells,2).flags.includes('heat at flowering'));
});

test('a qualifying dry run spanning months marks both months even if neither portion is ten days',()=>{
  const data=climate(2025,date=>{
    const key=date.toISOString().slice(0,10);
    return {rain:key>='2025-06-25'&&key<='2025-07-07'?0:10};
  });
  const cells=buildTimeline(rotation(window(0,1,crop('two',{duration_months:2}))),data);
  for(const month of [6,7]) {
    assert(cell(cells,month).flags.includes('dry'));
    assert.deepEqual(cell(cells,month).assessments[0].dry_spells,[{start_date:'2025-06-25',end_date:'2025-07-07',days:13}]);
  }
  assert(!cell(cells,8).flags.includes('dry'));
});

test('missing days and the 2.5 mm boundary break dry runs instead of acting like dry weather',()=>{
  for(const kind of ['absent','null','fill','boundary','other-parameter']) {
    const data=climate(2025,date=>({rain:date.toISOString().slice(0,10)>='2025-06-25'&&date.toISOString().slice(0,10)<='2025-07-07'?0:10}));
    const middle=data.daily.find(value=>value.date==='2025-07-01');
    if(kind==='absent')data.daily=data.daily.filter(value=>value!==middle);
    else if(kind==='null')middle.rain=null;
    else if(kind==='fill')middle.rain=-999;
    else if(kind==='boundary')middle.rain=2.5;
    else middle.t2m=null;
    const cells=buildTimeline(rotation(window(0,1)),data);
    assert(!cell(cells,6).flags.includes('dry'),kind);
    assert(!cell(cells,7).flags.includes('dry'),kind);
    assert.equal(cell(cells,7).missing,kind==='boundary'?0:1);
  }
});

test('dry spells stop at crop boundaries and Bare months never receive crop-weather flags',()=>{
  const data=climate(2025,()=>({rain:0,tmax:40,tmin:0}));
  const cells=buildTimeline(rotation(window(1,1,crop('july',{duration_months:1}))),data);
  assert.deepEqual(cell(cells,6).flags,[]);
  assert(cell(cells,6).bare);
  assert.equal(cell(cells,7).assessments[0].dry_spells[0].start_date,'2025-07-01');
  assert.equal(cell(cells,7).assessments[0].dry_spells[0].end_date,'2025-07-31');
  assert.deepEqual(cell(cells,8).flags,[]);
});

test('all-missing and unloaded weather stay unknown, while valid zero event counts remain zero',()=>{
  const row=rotation(window(0,0));
  const missing=cell(buildTimeline(row,{ag_year:2025,daily:[]}),6);
  assert.equal(missing.days,0);
  assert.equal(missing.missing,30);
  assert.equal(missing.assessments[0].heat_days,null);
  assert.equal(missing.assessments[0].heavy_rain,null);
  assert.deepEqual(missing.flags,[]);
  const unloaded=cell(buildTimeline(row,null),6);
  assert.equal(unloaded.year,null);
  assert.equal(unloaded.missing,null);
  assert.equal(unloaded.data_status,'not-loaded');
  const clear=cell(buildTimeline(row,climate()),6);
  assert.equal(clear.assessments[0].heat_days,0);
  assert.equal(clear.assessments[0].heavy_rain,0);
});

test('unknown crop calendars do not create false Bare months and overlapping current crops are both retained',()=>{
  const unknown=window(null,null,{id:'unknown',name:'Unknown',unavailable:true});
  unknown.start=null;unknown.end=null;
  const uncertain=buildTimeline(rotation(window(0,2),unknown),climate());
  assert(uncertain.every(value=>value.bare===false && value.unknown_calendar));
  assert.equal(cell(uncertain,3).crop,null);
  assert(timelineWarnings(rotation(null,unknown)).some(text=>text.includes('unknown')));
  const overlap=cell(buildTimeline(rotation(window(0,3,crop('first')),window(2,5,crop('second'))),climate()),8);
  assert.equal(overlap.overlap,true);
  assert.deepEqual(overlap.crops.map(value=>value.id),['first','second']);
  assert.equal(overlap.assessments.length,2);
  assert.equal(overlap.days,31,'Calendar days must not double-count overlapping crops');
});

test('windows in the following June are clipped, not wrapped onto the first June; legacy month bounds preserve order',()=>{
  const row=rotation(window(1,3,crop('summer')),window(5,8,crop('winter')),window(12,13,crop('later')));
  const cells=buildTimeline(row,climate());
  assert(cell(cells,6).bare);
  assert(!cells.some(value=>value.crops.some(crop=>crop.id==='later')));
  assert(timelineWarnings(row).some(text=>text.includes('not wrapped')));
  const legacy=structuredClone(row);
  for(const window of Object.values(legacy.seasons)){delete window.start_offset;delete window.end_offset;}
  assert.deepEqual(buildTimeline(legacy,climate()).map(value=>value.crops.map(crop=>crop.id)),cells.map(value=>value.crops.map(crop=>crop.id)));
});

test('February missing-day counts honor leap years',()=>{
  const row=rotation(null,window(8,8,crop('feb',{duration_months:1})));
  assert.equal(cell(buildTimeline(row,{ag_year:2023,daily:[]}),2).missing,29);
  assert.equal(cell(buildTimeline(row,{ag_year:2024,daily:[]}),2).missing,28);
});

test('timeline view has twelve native month disclosures, crop/Bare labels and explicit source/assumption explanations',()=>{
  const row=rotation(window(0,3));
  const html=renderTimeline(row,climate(),'Your current');
  assert.equal((html.match(/data-month=/g)??[]).length,12);
  assert.equal((html.match(/<details class="timeline-cell/g)??[]).length,12);
  assert(html.includes('timeline-bare'));
  assert(html.includes('scroll horizontally'));
  assert(html.includes('Assumed flowering'));
  assert(html.includes('Historical source: NASA POWER'));
  assert(html.includes('not forecasts or confirmed crop damage'));
  assert(html.includes('not confirmed flooding'));
  const unknown=renderTimeline(row,null);
  assert(unknown.includes('weather markers are unknown'));
});

test('actual demo timelines preserve scoring/selection and escaped text while adding twelve cells to every populated comparison',async()=>{
  const crops=JSON.parse(await readFile(new URL('../data/crops.json',import.meta.url),'utf8'));
  const payload=JSON.parse(await readFile(new URL('../data/demo-power-daily.json',import.meta.url),'utf8'));
  const data={...climate(),daily:parsePowerDaily(payload,'20220601','20260531'),grid_note:'NASA POWER area grid',soil_note:'MERRA-2 model'};
  const generated=generateRotations(crops,DEMO_FARM),scoring=scoreRotations(generated,DEMO_FARM,data);
  const before=JSON.stringify({data,scoring});
  const html=renderCompare({generated,scoring,field:DEMO_FARM,cropData:{status:'loaded',crops,errors:[]},climateState:{data},climateMatches:true});
  assert.equal((html.match(/data-month=/g)??[]).length,36);
  const current=buildTimeline(scoring.current,data);
  assert.deepEqual(current.filter(value=>value.bare).map(value=>value.month),[3,4,5]);
  assert(current.some(value=>value.flags.length));
  assert.equal(JSON.stringify({data,scoring}),before);
  const unsafe=rotation(window(0,0,crop('unsafe',{name:'<img src=x onerror=alert(1)>'})));
  const escaped=renderTimeline(unsafe,data);
  assert(!escaped.includes('<img src=x'));
  assert(escaped.includes('&lt;img'));
});
