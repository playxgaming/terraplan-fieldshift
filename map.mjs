import {FIELD_LIMITS} from './field.mjs';

export const MAP=Object.freeze({version:'1.9.4',timeout_ms:10000,max_lat:85.05112878,
  css:'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',css_integrity:'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=',
  js:'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',js_integrity:'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=',
  tiles:'https://tile.openstreetmap.org/{z}/{x}/{y}.png'});

export function mapPoint(raw) {
  const point={};
  for(const key of ['lat','lon']) {
    const value=raw?.[key],numeric=typeof value==='number' || typeof value==='string' && /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim());
    if(!numeric || !Number.isFinite(Number(value)) || Number(value)<FIELD_LIMITS[key].min || Number(value)>FIELD_LIMITS[key].max)return null;
    point[key]=Number(value);
  }
  return point;
}

let libraryPromise=null;
export function loadLeaflet(doc=document) {
  if(libraryPromise)return libraryPromise;
  libraryPromise=new Promise((resolve,reject)=>{
    const css=doc.createElement('link'),js=doc.createElement('script');
    css.rel='stylesheet';css.href=MAP.css;css.integrity=MAP.css_integrity;css.crossOrigin='anonymous';
    js.src=MAP.js;js.integrity=MAP.js_integrity;js.crossOrigin='anonymous';
    let loaded=0,done=false;
    const finish=error=>{
      if(done)return;done=true;clearTimeout(timer);
      if(error){css.remove();js.remove();libraryPromise=null;reject(new Error('Map library could not be loaded. Retry or enter coordinates directly.'));}
      else resolve(doc.defaultView.L);
    };
    const success=()=>{if(++loaded===2)finish(doc.defaultView.L?.version===MAP.version?null:true);};
    css.onload=js.onload=success;css.onerror=js.onerror=()=>finish(true);
    const timer=setTimeout(()=>finish(true),MAP.timeout_ms);
    doc.head.append(css,js);
  });
  return libraryPromise;
}

/** User-triggered adapter. No field storage or NASA requests. Caller owns disposal on navigation. */
export async function createFieldMap({container,point,onPick,onStatus,loader=loadLeaflet}) {
  const L=await loader(container.ownerDocument);
  if(!container.isConnected)return null;
  const map=L.map(container,{scrollWheelZoom:false,worldCopyJump:true}).setView(point && Math.abs(point.lat)<=MAP.max_lat?[point.lat,point.lon]:[20.6,78.9],point && Math.abs(point.lat)<=MAP.max_lat?12:4);
  const tiles=L.tileLayer(MAP.tiles,{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
  let pin=null,destroyed=false;
  const setPoint=(raw,pan=true)=>{
    if(destroyed)return;
    const value=mapPoint(raw);
    if(pin){pin.remove();pin=null;}
    if(!value){onStatus('No valid field coordinates selected. Click the map, use its centre or enter coordinates directly.');return;}
    if(Math.abs(value.lat)>MAP.max_lat){onStatus('These coordinates are outside this map projection. They are kept in the form; use the coordinate inputs.');return;}
    pin=L.circleMarker([value.lat,value.lon],{radius:9,color:'#244938',weight:3,fillColor:'#fffdf1',fillOpacity:1,interactive:false}).addTo(map);
    if(pan)map.panTo([value.lat,value.lon]);
    onStatus(`Editable field pin: ${value.lat.toFixed(5)}, ${value.lon.toFixed(5)}. Coordinates are not saved until Save field.`);
  };
  const choose=latlng=>{
    if(destroyed)return;
    const wrapped=latlng.wrap(),value=mapPoint({lat:wrapped.lat,lon:wrapped.lng});
    if(!value || Math.abs(value.lat)>MAP.max_lat){onStatus('Choose a point within the map coverage or enter coordinates directly.');return;}
    setPoint(value,false);onPick(value);
  };
  map.on('click',event=>choose(event.latlng));
  tiles.on('tileerror',()=>!destroyed && onStatus('Some background tiles are unavailable. The pin and coordinate inputs still work; retry the map later.'));
  setPoint(point,false);
  return {setPoint,chooseCentre:()=>{if(!destroyed)choose(map.getCenter());},destroy:()=>{destroyed=true;map.remove();}};
}
