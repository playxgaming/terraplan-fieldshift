import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildMonthlyTrend,slopePerDecade,parsePowerMonthly,parsePowerDaily,loadClimate,DEMO_FARM} from '../data.mjs';
import {generateRotations,seasonClimate} from '../engine.mjs';
import {renderClimate,renderTrendCards} from '../views.mjs';
import {getGlossaryEntry} from '../glossary.mjs';
const meta={PRECTOTCORR_SUM:{units:'mm'},T2M_MAX:{units:'C'}};
const rows=()=>[2000,2001,2003].flatMap(year=>Array.from({length:12},(_,m)=>({date:`${year}-${String(m+1).padStart(2,'0')}`,rain_sum:year-1990,tmax:20+(year-2000)*0.2})));
test('OLS uses actual years, preserves zero and requires two distinct finite points',()=>{
 assert.equal(slopePerDecade([[2000,10],[2003,16]]),20);
 assert.equal(slopePerDecade([[2000,0],[2001,0]]),0);
 for(const points of [[],[[2000,4]],[[2000,1],[2000,4]],[[2000,null],[2001,4]]])assert.equal(slopePerDecade(points),null);
});
test('annual trends require twelve unique valid months independently for rain and temperature',()=>{
 const raw=rows(), before=JSON.stringify(raw),t=buildMonthlyTrend(raw,meta);
 assert(Math.abs(t.rain_mm_per_decade-120)<1e-9);assert(Math.abs(t.tmax_c_per_decade-2)<1e-9);
 assert.deepEqual(t.rain_years,[2000,2001,2003]); assert.equal(t.annual[0].rain_mm,120); assert.equal(JSON.stringify(raw),before);
 raw[0].rain_sum=null; raw[12].tmax=-999;raw.push({...raw.at(-1)});
 const partial=buildMonthlyTrend(raw,meta);
 assert.deepEqual(partial.rain_years,[2001]);assert.deepEqual(partial.tmax_years,[2000]); assert.equal(partial.rain_mm_per_decade,null);
 assert.equal(buildMonthlyTrend(rows(),{}).rain_mm_per_decade,null);
});
test('monthly SUM unit discrepancy is disclosed; unsupported units cannot produce a trend',()=>{
 const t=buildMonthlyTrend(rows(),{...meta,PRECTOTCORR_SUM:{units:'mm/day'}});
 assert.match(t.unit_note,/discrepancy/);assert.equal(t.annual[0].rain_mm,120);
 assert.equal(buildMonthlyTrend(rows(),{...meta,PRECTOTCORR_SUM:{units:'inches'}}).rain_mm_per_decade,null);
 assert.equal(buildMonthlyTrend(rows(),{...meta,T2M_MAX:{units:'F'}}).tmax_c_per_decade,null);
 assert.equal(buildMonthlyTrend(null,meta).rain_mm_per_decade,null);
});
test('bundled monthly precipitation sums match all overlapping complete daily months without conversion',async()=>{
 const read=async name=>JSON.parse(await readFile(new URL(`../data/demo-power-${name}.json`,import.meta.url),'utf8'));
 const d=await read('daily'),m=await read('monthly');
 const daily=parsePowerDaily(d,'20220601','20260531'),monthly=parsePowerMonthly(m);
 let checked=0;
 for(const row of monthly){const days=daily.filter(day=>day.date.startsWith(row.date));const expected=new Date(Date.UTC(Number(row.date.slice(0,4)),Number(row.date.slice(5)),0)).getUTCDate();
 if(days.length===expected && days.every(day=>day.rain!==null)){assert(Math.abs(days.reduce((sum,day)=>sum+day.rain,0)-row.rain_sum)<0.02);checked++;}}
 assert.equal(checked,31);
 const climate=await loadClimate(DEMO_FARM,{agYear:2025,mode:'bundle',fetcher:async url=>({ok:true,json:async()=>String(url).includes('monthly')?m:d})});
 assert.equal(climate.monthly_trend.rain_years.length,34);assert(Number.isFinite(climate.monthly_trend.tmax_c_per_decade));
 const crops=JSON.parse(await readFile(new URL('../data/crops.json',import.meta.url),'utf8')),generated=generateRotations(crops,DEMO_FARM),current=generated.rotations.find(row=>row.is_current);
 const metrics=Object.fromEntries(['kharif','rabi','zaid'].map(s=>[s,seasonClimate(climate,current.seasons[s])]));
 const html=renderClimate({field:DEMO_FARM,generated,metrics,climateMatches:true,climateState:{data:climate,status:'loaded'}});
 assert.equal((html.match(/class="climate-card"/g)||[]).length,14);
 for(const term of ['rainfall','cold_stress','trend','data_types'])assert(getGlossaryEntry(term));
 assert.match(html,/34 complete years/);assert.match(html,/MERRA-2/);assert.match(html,/not volumetric water content or a satellite reading/);assert(!html.includes('scheduled for step 8'));
 assert.match(renderTrendCards(null),/Missing/);
});
