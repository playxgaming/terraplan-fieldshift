import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateCrops,generateRotations,scoreRotations} from '../engine.mjs';
import {validateField} from '../field.mjs';
import {DEMO_FARM,loadClimate} from '../data.mjs';
import {filterCatalogue,cropCard} from '../project.mjs';
const crops=JSON.parse(await readFile(new URL('../data/crops.json',import.meta.url),'utf8'));
const additions=['mustard','barley','clusterbean'];
test('regional additions are selectable, source-researched and explicitly unverified with valid references',()=>{
 assert.equal(crops.length,15);assert.deepEqual(validateCrops(crops).errors,[]);
 for(const id of additions){const crop=crops.find(row=>row.id===id);assert.equal(crop.verified,false);assert.equal(crop.regional_common,false);assert(crop.review.sources.length>=2);assert.match(crop.review.status,/agronomist validation pending/);assert.match(crop.review.assumptions_note,/illustrative/);
 assert(validateField({...DEMO_FARM,current_rotation:{...DEMO_FARM.current_rotation,[id==='clusterbean'?'kharif':'rabi']:id}}).valid);
 const broken=structuredClone(crop);broken.review.sources[0].url='javascript:alert(1)';assert.equal(validateCrops([broken]).crops.length,0);
 }
});
test('new rotations retain actual crops and source notes through scoring without promoting confidence',async()=>{
 const climate=await loadClimate(DEMO_FARM,{agYear:2025,mode:'bundle',fetcher:async u=>({ok:true,json:async()=>JSON.parse(await readFile(u,'utf8'))})});
 for(const id of additions){const field={...DEMO_FARM,current_rotation:{...DEMO_FARM.current_rotation,[id==='clusterbean'?'kharif':'rabi']:id}};const g=generateRotations(crops,field),s=scoreRotations(g,field,climate);assert.equal(s.current.confidence.level,'Low');assert(Object.values(s.current.seasons).some(slot=>slot?.crop.id===id));assert(Number.isFinite(s.current.total));}
 const g=generateRotations(crops,DEMO_FARM);assert.equal(g.rotations.length,141);assert.equal(g.excluded.length,57);
});
test('project gallery combines filters without changing crop inputs and handles empty matches safely',()=>{
 const before=JSON.stringify(crops);assert.equal(filterCatalogue(crops,{reviewedOnly:true}).length,3);assert.equal(filterCatalogue(crops,{reviewedOnly:true,season:'rabi'}).length,2);
 assert.equal(filterCatalogue(crops,{query:' GUaR '})[0].id,'clusterbean');assert.equal(filterCatalogue(crops,{query:'mustard',season:'kharif'}).length,0);assert.equal(JSON.stringify(crops),before);
 const html=cropCard({...crops.at(-1),name:'<script>alert(1)</script>'});assert(!html.includes('<script>'));assert.match(html,/&lt;script&gt;/);assert.match(html,/SOURCE-RESEARCHED/);assert.match(html,/Directorate of Pulses/);
});
