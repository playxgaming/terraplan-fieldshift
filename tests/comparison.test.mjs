import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { benefitBadges, bareMonthCount, rotationAdvice, generateRotations, scoreRotations, defaultPriorities } from '../engine.mjs';
import { DEMO_FARM, loadClimate } from '../data.mjs';
import { renderCompare, sortedRotationRows, tableDataFor, renderRotationsTable, ROTATION_SORT_COLUMNS } from '../views.mjs';

const crops=JSON.parse(await readFile(new URL('../data/crops.json',import.meta.url),'utf8'));
const daily=JSON.parse(await readFile(new URL('../data/demo-power-daily.json',import.meta.url),'utf8'));
const monthly=JSON.parse(await readFile(new URL('../data/demo-power-monthly.json',import.meta.url),'utf8'));
const climate=await loadClimate(DEMO_FARM,{agYear:2025,mode:'bundle',fetcher:async url=>({ok:true,json:async()=>String(url).includes('monthly')?monthly:daily})});
const generated=generateRotations(crops,DEMO_FARM);
const scoring=scoreRotations(generated,DEMO_FARM,climate);
const viewArgs={generated,field:DEMO_FARM,cropData:{status:'loaded',crops,errors:[]},scoring,climateState:{status:'loaded',data:climate},climateMatches:true};
const window=(name,family,roles,start=0,end=2)=>({crop:{id:name,name,family,roles,verified:false},start:6+start,end:6+end,start_offset:start,end_offset:end});
const row=(seasons,water=100,market=10)=>({seasons:{kharif:null,rabi:null,zaid:null,...seasons},water_need_mm:water,priority_values:{market}});
const keys=badges=>badges.map(badge=>badge.key);

test('water and market badges use inclusive exact thresholds and preserve explanatory text',()=>{
  const current=row({kharif:window('old','Poaceae',[])},100,10);
  const alternative=row({kharif:window('new','Malvaceae',[])},85,20);
  const badges=benefitBadges(alternative,current);
  assert(keys(badges).includes('water'));
  assert(keys(badges).includes('market'));
  assert(badges.every(badge=>badge.explanation.length>20));
  assert(!keys(benefitBadges({...alternative,water_need_mm:85.01},current)).includes('water'));
  assert(!keys(benefitBadges({...alternative,priority_values:{market:19.99}},current)).includes('market'));
  assert(!keys(benefitBadges({...alternative,water_need_mm:null},current)).includes('water'));
  assert(!keys(benefitBadges(alternative,{...current,water_need_mm:0})).includes('water'));
});

test('nitrogen and pest badges follow crop roles and cyclic family rules',()=>{
  const current=row({kharif:window('old','Poaceae',[])});
  const good=row({kharif:window('legume','Fabaceae',['nitrogen-fixer'])});
  assert(keys(benefitBadges(good,current)).includes('nitrogen'));
  assert(keys(benefitBadges(good,current)).includes('pest'));
  const cycle=row({kharif:window('one','Fabaceae',[]),rabi:window('two','Malvaceae',[],3,4),zaid:window('three','Fabaceae',[],5,6)});
  assert(!keys(benefitBadges(cycle,current)).includes('pest'),'Zaid to next Kharif is also consecutive');
  const unknown={...good,seasons:{...good.seasons,kharif:{...good.seasons.kharif,crop:{name:'unknown',unavailable:true}}}};
  assert(!keys(benefitBadges(unknown,current)).includes('pest'));
});

test('infiltration badge needs a cover/deep-rooted role and fewer unique bare months; unknown calendars cannot earn it',()=>{
  const current=row({kharif:window('old','Poaceae',[],0,2)});
  const covered=row({kharif:window('cover','Fabaceae',['cover'],0,4)});
  assert.equal(bareMonthCount(current),9);
  assert.equal(bareMonthCount(covered),7);
  assert(keys(benefitBadges(covered,current)).includes('infiltration'));
  assert(!keys(benefitBadges(row({kharif:window('no-role','Fabaceae',[],0,4)}),current)).includes('infiltration'));
  assert(!keys(benefitBadges(row({kharif:window('same-cover','Fabaceae',['cover'],0,2)}),current)).includes('infiltration'));
  const overlapping=row({kharif:window('a','A',[],0,3),rabi:window('b','B',[],2,5)});
  assert.equal(bareMonthCount(overlapping),6,'Overlaps must not count as extra covered months');
  const unavailable=row({kharif:{...window('unknown','A',[]),start_offset:null}});
  assert.equal(bareMonthCount(unavailable),null);
  assert(!keys(benefitBadges(covered,unavailable)).includes('infiltration'));
});

test('information gaps and local checks identify unverified data, missing days, soil and actual per-season water gaps',()=>{
  const current=structuredClone(scoring.current);
  current.season_metrics.kharif.missing=2;
  const result=rotationAdvice(current,DEMO_FARM,climate);
  assert(result.gaps.some(gap=>gap.includes('Unverified crop values')));
  assert(result.gaps.some(gap=>gap.includes('2 daily records')));
  assert(result.gaps.some(gap=>gap.includes('soil test')));
  assert(result.gaps.some(gap=>gap.includes('No local price')));
  assert(result.gaps.some(gap=>gap.includes('50 km')));
  assert(result.checks.some(check=>check.includes('Groundnut')&&check.includes('June sowing')));
  assert(result.checks.some(check=>check.includes('rabi')&&check.includes('248.48 mm')));
  assert(result.checks.some(check=>check.includes('nitrogen and organic carbon')));
});

test('actual demo displays current and two distinct selected alternatives, each with the five sections in order',()=>{
  const html=renderCompare(viewArgs);
  const columns=html.split(/<article class="comparison-column"/).slice(1);
  assert.equal(columns.length,3);
  const expected=['Why','Evidence (NASA numbers)','Benefits','Information gaps','Check locally (KVK / agri officer)'];
  for(const column of columns) {
    assert.deepEqual([...column.matchAll(/data-explanation="([^"]+)"/g)].slice(0,5).map(match=>match[1]),expected);
    assert(column.includes('Confidence: Low'));
    assert(column.includes('Initial placeholder'));
  }
  assert(html.includes('data-comparison="Your current"'));
  assert(html.includes('data-comparison="Option A"'));
  assert(html.includes('data-comparison="Option B"'));
  assert.equal(new Set([scoring.current.id,...scoring.options.map(row=>row.id)]).size,3);
  assert(html.includes('877.4 mm'));
  assert(html.includes('Root-zone wetness (model)'));
  assert(html.includes('Not feasible without extra water'));
  assert.equal((html.match(/class="timeline-strip"/g)??[]).length,3);
});

test('empty alternative slots explain missing results, and infeasible fallback labels remain visible',()=>{
  const one={...scoring,options:scoring.options.slice(0,1)};
  const html=renderCompare({...viewArgs,scoring:one});
  assert(html.includes('comparison-empty" data-comparison="Option B"'));
  assert(html.includes('No scored rotation is selected for this place'));
  const fallback=scoring.ranked.find(row=>row.feasible===false && row.total!==null);
  const withFallback=renderCompare({...viewArgs,scoring:{...scoring,options:[scoring.options[0],fallback]}});
  const optionB=withFallback.split('data-comparison="Option B"')[1];
  assert(optionB.includes('Not feasible without extra water'));
  assert(optionB.includes('water gap'));
});

test('current crop warnings and IDs survive missing crop data and missing weather',()=>{
  const field={...DEMO_FARM,soil:'sandy',current_rotation:{kharif:'rice',rabi:'wheat',zaid:null}};
  const missing=generateRotations(crops.filter(crop=>crop.id!=='rice'),field);
  const html=renderCompare({field,generated:missing,cropData:{status:'loaded',crops,errors:[]}});
  assert(html.includes('Current-rotation warnings'));
  assert(html.includes('rice'));
  assert(html.includes('missing or invalid'));
  assert(html.includes('Not scored'));
  assert(!html.includes('0 / 100'));
  assert.equal(tableDataFor(null,missing).ranked.length,missing.rotations.length-1);
});

test('all-rotations table retains every row, marks current/options and sorts without mutating selection',()=>{
  const data=tableDataFor(scoring,generated), before=JSON.stringify(scoring);
  const asc=sortedRotationRows(data,{key:'total',direction:'asc'}),desc=sortedRotationRows(data,{key:'total',direction:'desc'});
  const knownAsc=asc.filter(row=>row.total!==null).map(row=>row.total),knownDesc=desc.filter(row=>row.total!==null).map(row=>row.total);
  assert.deepEqual(knownAsc,[...knownAsc].sort((a,b)=>a-b));
  assert.deepEqual(knownDesc,[...knownDesc].sort((a,b)=>b-a));
  assert.equal(asc.at(-1).total,null);
  assert.equal(desc.at(-1).total,null);
  assert.equal(asc.length,84);
  assert.equal(new Set(asc.map(row=>row.id)).size,84);
  const html=renderRotationsTable(data,{key:'total',direction:'asc'});
  assert.equal((html.match(/<tr data-rotation-id=/g)??[]).length,84);
  assert(html.includes('aria-sort="ascending"'));
  assert(html.includes('scroll horizontally'));
  assert(html.includes('Your current'));
  assert(html.includes('Option A'));
  assert(html.includes('Option B'));
  assert.equal(JSON.stringify(scoring),before);
});

test('every supported table sort is stable and missing values stay last for numeric and confidence fields',()=>{
  const data=tableDataFor(scoring,generated);
  for(const column of ROTATION_SORT_COLUMNS)for(const direction of ['asc','desc']){
    const rows=sortedRotationRows(data,{key:column.key,direction});
    assert.equal(rows.length,84);
    assert.deepEqual(rows.map(row=>row.id),sortedRotationRows(data,{key:column.key,direction}).map(row=>row.id));
  }
  const unknown={...scoring.ranked[0],id:'unknown-confidence',confidence:undefined};
  const synthetic={...data,ranked:[unknown,...data.ranked]};
  assert.equal(sortedRotationRows(synthetic,{key:'confidence',direction:'desc'}).at(-1).id,'unknown-confidence');
});

test('comparison output escapes crop text and never fabricates photos, sources or a missing score',()=>{
  const changed=structuredClone(scoring);
  changed.current.seasons.kharif.crop.name='<img src=x onerror=alert(1)>';
  changed.current.warnings.push('<script>bad</script>');
  const html=renderCompare({...viewArgs,scoring:changed});
  assert(!html.includes('<img src=x'));
  assert(!html.includes('<script>'));
  assert(html.includes('&lt;img'));
  assert(!html.includes('<img class="comparison-crop-photo"'));
  assert(html.includes(climate.retrieved_at));
  assert(html.includes('Excluded (36)'));
});
