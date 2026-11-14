import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadPriorities,savePriorities,PRIORITY_STORAGE_KEY} from '../priorities.mjs';
import {defaultPriorities} from '../engine.mjs';
import {annualHistoryChart} from '../charts.mjs';
import {renderEvidence,renderProjectReadiness} from '../views.mjs';
import {DEMO_FARM,loadClimate} from '../data.mjs';

test('priorities survive reload independently; invalid, corrupt and blocked writes preserve other records',()=>{
 const records=new Map([['terraplan.v3.field','saved farm'],['terraplan.v3.whatif','saved experiment']]);
 const storage={getItem:key=>records.get(key)??null,setItem:(key,value)=>records.set(key,value)};
 assert.deepEqual(loadPriorities(storage).priorities,defaultPriorities());
 const weights={...defaultPriorities(),water:5,market:0};assert.equal(savePriorities(storage,weights),'');assert.deepEqual(loadPriorities(storage).priorities,weights);
 const before=records.get(PRIORITY_STORAGE_KEY);assert(savePriorities(storage,{...weights,water:99}));assert.equal(records.get(PRIORITY_STORAGE_KEY),before);
 assert.equal(records.get('terraplan.v3.field'),'saved farm');assert.equal(records.get('terraplan.v3.whatif'),'saved experiment');
 records.set(PRIORITY_STORAGE_KEY,'broken');assert(loadPriorities(storage).error);assert.equal(records.get(PRIORITY_STORAGE_KEY),'broken');
 assert(loadPriorities({getItem:()=>{throw Error('blocked')}}).error);assert(savePriorities({setItem:()=>{throw Error('quota')}},weights));
});
test('weather evidence cannot display old-location numbers under a different field',async()=>{
 const fetcher=async url=>({ok:true,json:async()=>JSON.parse(await readFile(new URL('../data/'+new URL(url).pathname.split('/').at(-1),import.meta.url),'utf8'))});
 const data=await loadClimate(DEMO_FARM,{mode:'bundle',fetcher,agYear:2025});
 const state={status:'loaded',data};
 const matching=renderEvidence({field:DEMO_FARM,climateState:state});assert.match(matching,/Annual rain trend/);assert.match(matching,/history-chart/);
 const stale=renderEvidence({field:{...DEMO_FARM,lat:27.5},climateState:state});assert.match(stale,/withheld here/);assert(!stale.includes('Annual rain trend'));assert(!stale.includes(data.datasets[0].request_url.replaceAll('&','&amp;')));
 const expired=renderEvidence({field:DEMO_FARM,climateState:state,climateMatches:false});assert.match(expired,/different location or agricultural year/);
});
test('history charts keep genuine zero and missing-year breaks without NaN coordinates or mutation',()=>{
 const rows=[{year:2000,rain_mm:0},{year:2001,rain_mm:10},{year:2002,rain_mm:null},{year:2003,rain_mm:30},{year:2004,rain_mm:40}];
 const before=JSON.stringify(rows),html=annualHistoryChart(rows,'rain_mm');assert.match(html,/2000: 0.00 mm/);assert.equal((html.match(/<polyline/g)??[]).length,2);assert(!html.includes('NaN'));assert.equal(JSON.stringify(rows),before);
 assert.match(annualHistoryChart([{year:2000,rain_mm:null}],'rain_mm'),/not enough/);assert.equal(annualHistoryChart(rows,'unknown'),'');
 assert.match(annualHistoryChart([{year:2000,tmax_c:30},{year:2001,tmax_c:30}],'tmax_c'),/30.00/);
});
test('judging materials contain exactly seven slides, real team credits and explicit validation boundaries',async()=>{
 const pitch=await readFile(new URL('../pitch.html',import.meta.url),'utf8');assert.equal((pitch.match(/class="slide"/g)??[]).length,7);
 for(const name of ['AEGIS LABS','Sarvesh Sehra','Ayush Tyagi','Aditya Rathi','Arshi'])assert(pitch.includes(name));
 assert.match(pitch,/93.6 mm/);assert.match(pitch,/not yield or profit/);assert.match(pitch,/AI disclosure/);
 const status=renderProjectReadiness();assert.match(status,/unverified/);assert.match(status,/does not confirm registration/);assert.match(status,/pitch.html/);
});
