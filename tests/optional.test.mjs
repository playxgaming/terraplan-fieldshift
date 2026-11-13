import test from 'node:test';
import assert from 'node:assert/strict';
import {LABELS,LABEL_LANGUAGES,LABEL_STORAGE_KEY,cropLabels,validLanguage,loadLabelLanguage,saveLabelLanguage} from '../labels.mjs';
import {FIELD_CHOICES} from '../field.mjs';
import {MAP,mapPoint,createFieldMap,loadLeaflet} from '../map.mjs';
import {expandPrintDetails,installPrintView} from '../print.mjs';
import {renderField} from '../views.mjs';
test('every regional catalog covers all stable crop IDs and routes, with safe English fallback',()=>{
 assert.deepEqual(Object.keys(LABEL_LANGUAGES),['en','hi','gu','mr']);
 for(const language of ['hi','gu','mr']){
  assert.equal(Object.keys(LABELS[language].nav).length,7);
  for(const [id] of FIELD_CHOICES.crop)assert(LABELS[language].crops[id]?.trim());
  const english='Groundnut, Wheat and Chickpea (chana)';const label=cropLabels(english,language);assert(label.includes(LABELS[language].crops.groundnut));assert(label.includes('Chickpea (chana)'));
  assert.equal(cropLabels('Wheatgrass',language),'Wheatgrass');
 }
 assert(!validLanguage('__proto__'));assert.equal(cropLabels('Wheat','bad'),'Wheat');
});
test('label preference writes its own versioned key and preserves corrupt/blocked records',()=>{
 const data=new Map([['terraplan.v3.field','field'],['terraplan.v3.whatif','scenario']]),storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};
 assert.equal(loadLabelLanguage(storage).language,'en');assert.equal(saveLabelLanguage(storage,'gu'),'');assert.equal(loadLabelLanguage(storage).language,'gu');
 assert.equal(data.get('terraplan.v3.field'),'field');assert.equal(data.get('terraplan.v3.whatif'),'scenario');
 const before=data.get(LABEL_STORAGE_KEY);assert(saveLabelLanguage(storage,'__proto__'));assert.equal(data.get(LABEL_STORAGE_KEY),before);
 data.set(LABEL_STORAGE_KEY,'corrupt');assert(loadLabelLanguage(storage).error);assert.equal(data.get(LABEL_STORAGE_KEY),'corrupt');
 assert(loadLabelLanguage({getItem:()=>{throw Error('blocked')}}).error);assert(saveLabelLanguage({setItem:()=>{throw Error('quota')}},'hi'));
});
test('map coordinates accept true zeros and finite bounds but reject missing and coercible numbers',()=>{
 assert.deepEqual(mapPoint({lat:'0',lon:0}),{lat:0,lon:0});assert.deepEqual(mapPoint({lat:-90,lon:180}),{lat:-90,lon:180});
 for(const value of ['',null,true,[],{},NaN,Infinity,90.1,-90.1])assert.equal(mapPoint({lat:value,lon:0}),null);
 assert.equal(mapPoint({lat:0,lon:180.1}),null);assert.equal(mapPoint(null),null);
 const html=renderField();assert.match(html,/data-open-map/);assert.match(html,/No map request is made until you open it/);assert(!html.includes('<script src='));
});
function fakeLeaflet(){
 const events={},status=[],picked=[],moves=[],pins=[];let removed=false;
 const latlng=(lat,lng)=>({lat,lng,wrap(){return this;}});
 const map={setView:()=>map,panTo:value=>moves.push(value),on:(key,callback)=>{events[key]=callback;},getCenter:()=>latlng(22.5,71),remove:()=>{removed=true;}};
 const L={map:()=>map,tileLayer:()=>({addTo(){return this;},on:(key,callback)=>{events[key]=callback;}}),circleMarker:(value)=>{const pin={value,remove(){this.removed=true;},addTo(){pins.push(this);return this;}};return pin;}};
 return {L,events,status,picked,moves,pins,latlng,removed:()=>removed};
}
test('map selection updates only callbacks, manual invalid coordinates clear pins, and disposal stops changes',async()=>{
 const fake=fakeLeaflet(),container={isConnected:true,ownerDocument:{}};
 const controller=await createFieldMap({container,point:{lat:0,lon:0},loader:async()=>fake.L,onPick:point=>fake.picked.push(point),onStatus:message=>fake.status.push(message)});
 assert.deepEqual(fake.pins[0].value,[0,0]);controller.chooseCentre();assert.deepEqual(fake.picked[0],{lat:22.5,lon:71});
 fake.events.click({latlng:fake.latlng(23,72)});assert.deepEqual(fake.picked[1],{lat:23,lon:72});
 controller.setPoint(null);assert(fake.pins.at(-1).removed);assert.match(fake.status.at(-1),/No valid field coordinates/);
 controller.setPoint({lat:90,lon:0});assert.match(fake.status.at(-1),/outside this map projection/);
 fake.events.tileerror();assert.match(fake.status.at(-1),/tiles are unavailable/);
 controller.destroy();controller.chooseCentre();fake.events.click({latlng:fake.latlng(1,1)});assert(fake.removed());assert.equal(fake.picked.length,2);
});
test('map loading failures are recoverable and detached routes never initialize a map',async()=>{
 const container={isConnected:true,ownerDocument:{}};
 await assert.rejects(createFieldMap({container,loader:async()=>{throw Error('offline');}}),/offline/);
 let release;const pending=createFieldMap({container,loader:()=>new Promise(resolve=>{release=resolve;})});
 container.isConnected=false;release({map:()=>{throw Error('stale map must not mount');}});assert.equal(await pending,null);
});
test('Leaflet loads only on request with integrity pins, shares one load, and retries failed loading',async()=>{
 const elements=[];let fail=true;
 const doc={defaultView:{L:{version:MAP.version}},createElement:tag=>({tag,remove(){this.removed=true;}}),head:{append(...nodes){elements.push(...nodes);queueMicrotask(()=>{if(fail)nodes[0].onerror();else nodes.forEach(node=>node.onload());});}}};
 await assert.rejects(loadLeaflet(doc),/Retry or enter coordinates/);assert(elements.every(node=>node.removed));
 fail=false;const first=loadLeaflet(doc),second=loadLeaflet(doc);assert.equal(first,second);assert.equal(await first,doc.defaultView.L);
 assert.equal(elements.length,4);for(const element of elements){assert.match(element.integrity,/^sha256-/);assert.equal(element.crossOrigin,'anonymous');}
});
test('print preparation is repeatable and restores disclosure state even after cancelling',()=>{
 const details=[{open:false},{open:true}],restore=expandPrintDetails(details);assert(details.every(row=>row.open));restore();assert.deepEqual(details.map(row=>row.open),[false,true]);
 const win=new EventTarget(),context={textContent:''},root={querySelectorAll:()=>details};
 const dispose=installPrintView(win,root,context,()=>'<field> · source and priorities');
 win.dispatchEvent(new Event('beforeprint'));win.dispatchEvent(new Event('beforeprint'));assert(details.every(row=>row.open));assert.equal(context.textContent,'<field> · source and priorities');
 win.dispatchEvent(new Event('afterprint'));assert.deepEqual(details.map(row=>row.open),[false,true]);dispose();win.dispatchEvent(new Event('beforeprint'));assert.equal(details[0].open,false);
});
