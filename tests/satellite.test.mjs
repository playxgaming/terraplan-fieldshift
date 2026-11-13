import test from 'node:test';
import assert from 'node:assert/strict';
import {loadSatellite,validateSatellite,DEMO_FARM} from '../data.mjs';
import {renderSatelliteCards} from '../views.mjs';
const fixture=()=>({location:{lat:22.3,lon:70.8},retrieved_at:'2026-11-13T00:00:00Z',sources:[{name:'Synthetic test fixture',doi_or_url:'https://example.org/test'}],imerg:{resolution:'10 km',monthly_rain_mm:{'2025-06':0}},smap:{resolution:'9 km',monthly_anomaly:{'2025-06':-0.1}},grace:{resolution:'300 km',annual_lwe_cm:{2025:0},trend_cm_per_year:0}});
test('satellite loader treats absent, unavailable, malformed and empty manifests as not loaded',async()=>{
 for(const fetcher of [async()=>{throw Error('offline')},async()=>({ok:false}),async()=>({ok:true,json:async()=>({location:{lat:22.3,lon:70.8},imerg:null})})])assert.equal((await loadSatellite(fetcher)).status,'not-loaded');
 assert.equal(validateSatellite(null).data,null);
});
test('satellite provenance and location are mandatory and invalid products are skipped independently',()=>{
 const raw=fixture(),before=JSON.stringify(raw),state=validateSatellite(raw);
 assert.equal(state.status,'loaded');assert.equal(JSON.stringify(raw),before);state.data.imerg.monthly_rain_mm['2025-06']=1;assert.equal(raw.imerg.monthly_rain_mm['2025-06'],0);
 for(const changed of [{...raw,location:{lat:23,lon:70.8}},{...raw,retrieved_at:''},{...raw,sources:[]},{...raw,sources:[{name:'bad',doi_or_url:'javascript:alert(1)'}]}])assert.equal(validateSatellite(changed).data,null);
 raw.imerg.monthly_rain_mm['2025-13']=10;assert.equal(validateSatellite(raw).data.imerg,null);assert(validateSatellite(raw).data.smap);
 raw.smap.monthly_anomaly['2025-06']=-999;assert.equal(validateSatellite(raw).data.smap,null);
});
test('satellite view keeps zero values, missing cross-checks and non-demo location boundaries honest',()=>{
 const state=validateSatellite(fixture());
 const daily=Array.from({length:30},(_,i)=>({date:`2025-06-${String(i+1).padStart(2,'0')}`,rain:1}));
 const html=renderSatelliteCards(DEMO_FARM,state,{daily});assert.match(html,/-30/);assert.match(html,/0 cm\/year/);assert.match(html,/units not supplied/);
 assert(!html.includes('javascript:'));
 const partial=renderSatelliteCards(DEMO_FARM,state,{daily:daily.slice(1)});assert.match(partial,/<td>Missing<\/td>/);
 const other=renderSatelliteCards({...DEMO_FARM,lat:23},state,{daily});assert.match(other,/No Rajkot satellite value is applied/);assert(!other.includes('0 cm/year'));
 state.data.sources[0].name='<script>';assert(!renderSatelliteCards(DEMO_FARM,state).includes('<script>'));
 assert.match(renderSatelliteCards(DEMO_FARM),/Not loaded yet/);
});
