export const MODEL_VERSION='2.0.0';
export const FAO='https://www.fao.org/4/S2022E/s2022e07.htm';
export const CALENDAR_SOURCE='https://ies.gov.in/arthapedia/concept/cropping-seasons-india-kharif-rabi';
export const crops={
 rice:{name:'Rice',family:'grass',water:575,waterRange:[450,700],heat:35,soils:['clay'],months:[6,7],legume:false,source:FAO},
 wheat:{name:'Wheat',family:'grass',water:550,waterRange:[450,650],heat:30,soils:['loam','clay'],months:[10,11],legume:false,source:FAO},
 millet:{name:'Pearl millet',family:'grass',water:550,waterRange:[450,650],heat:40,soils:['sandy','loam'],months:[6,7],legume:false,source:FAO},
 chickpea:{name:'Chickpea',family:'pulse',water:300,waterRange:null,heat:32,soils:['loam','clay'],months:[10,11],legume:true,source:null},
 maize:{name:'Maize',family:'grass',water:650,waterRange:[500,800],heat:35,soils:['loam'],months:[6,7],legume:false,source:FAO},
 mung:{name:'Mung bean',family:'pulse',water:300,waterRange:null,heat:35,soils:['loam','sandy'],months:[2,3,6,7],legume:true,source:null},
 sorghum:{name:'Sorghum',family:'grass',water:550,waterRange:[450,650],heat:39,soils:['loam','clay'],months:[6,7],legume:false,source:FAO}
};
export const rotations=[{id:'rice',pair:['rice','wheat'],label:'Reference baseline',color:'#baa769'},{id:'millet',pair:['millet','chickpea'],label:'Pulse diversification',color:'#79965b'},{id:'maize',pair:['maize','wheat'],label:'Cereal alternative',color:'#c28451'},{id:'sorghum',pair:['sorghum','chickpea'],label:'Heat-tolerant alternative',color:'#567e70'},{id:'mung',pair:['maize','mung'],label:'Calendar check example',color:'#8c8f73'}];
export const defaults={year:2024,firstMonth:6,secondMonth:11,firstIrrigation:200,secondIrrigation:200,priority:'balanced',rainChange:0,heatChange:0,secondRainChange:0,secondHeatChange:0};
export const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const clamp=v=>Math.max(0,Math.min(100,v));
const dayKey=d=>d.toISOString().slice(0,10).replaceAll('-','');
export const rotationName=r=>r.pair.map(k=>crops[k].name).join(' → ');
export function windowDates(year,month,length=4){const start=new Date(Date.UTC(year,month-1,1)),end=new Date(Date.UTC(year,month-1+length,0));return {start:dayKey(start),end:dayKey(end),year,month,length,label:`${months[month-1]} ${year} – ${months[end.getUTCMonth()]} ${end.getUTCFullYear()}`}}
export function summarize(data,win){
 const p=data?.properties?.parameter,fill=data?.header?.fill_value??-999;
 if(!p)throw Error('NASA response does not contain daily weather parameters.');
 const dates=[];let date=new Date(`${win.start.slice(0,4)}-${win.start.slice(4,6)}-${win.start.slice(6,8)}T00:00:00Z`);
 while(dayKey(date)<=win.end){dates.push(dayKey(date));date.setUTCDate(date.getUTCDate()+1)}
 const missing=dates.filter(k=>['PRECTOTCORR','T2M','T2M_MAX'].some(id=>!Number.isFinite(p[id]?.[k])||p[id][k]===fill||(id==='PRECTOTCORR'&&p[id][k]<0)));
 if(missing.length)throw Error(`${missing.length} of ${dates.length} days are missing or invalid in ${win.label}. Scores are unavailable for this window.`);
 const rain=dates.reduce((s,k)=>s+p.PRECTOTCORR[k],0),avg=dates.reduce((s,k)=>s+p.T2M[k],0)/dates.length;
 const monthly=[...new Set(dates.map(k=>k.slice(0,6)))].map(m=>{const ds=dates.filter(k=>k.startsWith(m));return {key:m,label:`${months[+m.slice(4)-1]} ${m.slice(0,4)}`,rain:ds.reduce((s,k)=>s+p.PRECTOTCORR[k],0),avg:ds.reduce((s,k)=>s+p.T2M[k],0)/ds.length}});
 return {rain,avg,maxima:dates.map(k=>p.T2M_MAX[k]),days:dates.length,monthly,window:win,completeness:100};
}
export function evaluate(record,field,settings){
 validateSettings(settings);validateField(field);
 const first=windowDates(settings.year,settings.firstMonth),secondWindow=windowDates(settings.year,settings.secondMonth);
 const weather=[summarize(record.data,first),summarize(record.data,secondWindow)];
 const weights=settings.priority==='water'?[.6,.2,.2]:settings.priority==='soil'?[.2,.6,.2]:[.35,.3,.35];
 const ranked=rotations.map(rotation=>{
  const [a,b]=rotation.pair.map(k=>crops[k]);const excluded=[];
  if(!a.months.includes(settings.firstMonth))excluded.push(`${a.name}: first-season start is outside this demo's Jun–Jul calendar.`);
  if(!b.months.includes(settings.secondMonth))excluded.push(`${b.name}: ${months[settings.secondMonth-1]} is outside its assumed planting window (${b.months.map(m=>months[m-1]).join(', ')}).`);
  if(secondWindow.start<=first.end)excluded.push('The two four-month growing windows overlap.');
  if(rotation.pair.includes('rice')&&field.soil==='sandy')excluded.push('Sandy soil is excluded for paddy rice in this illustrative model.');
  const seasons=[a,b].map((crop,i)=>{
   const w=weather[i],rainChange=i?settings.secondRainChange:settings.rainChange,heatChange=i?settings.secondHeatChange:settings.heatChange,irrigation=i?settings.secondIrrigation:settings.firstIrrigation;
   const supply=w.rain*(1+rainChange/100)*.65+irrigation,gap=Math.max(0,crop.water-supply),hotDays=w.maxima.filter(t=>t+heatChange>crop.heat).length;
   return {name:crop.name,water:clamp(supply/crop.water*100),heat:100*(1-hotDays/w.days),hotDays,days:w.days,supply,gap,demand:crop.water,threshold:crop.heat,window:w.window.label};
  });
  const soilScore=clamp(25+(a.soils.includes(field.soil)?20:0)+(b.soils.includes(field.soil)?15:0)+(b.legume?25:0)+(a.family!==b.family?15:0)-(crops[field.previous].family===a.family?15:0));
  const water=seasons.reduce((s,x)=>s+x.water,0)/2,heat=seasons.reduce((s,x)=>s+x.heat,0)/2;
  const score=Math.round(water*weights[0]+soilScore*weights[1]+heat*weights[2]);
  return {...rotation,score:excluded.length?null:score,eligible:!excluded.length,excluded,water,heat,soilScore,seasons,gap:seasons.reduce((s,x)=>s+x.gap,0),demand:a.water+b.water,volume:seasons.reduce((s,x)=>s+x.gap,0)*field.area*10};
 }).sort((a,b)=>Number(b.eligible)-Number(a.eligible)||(b.score??-1)-(a.score??-1)||a.demand-b.demand||a.id.localeCompare(b.id));
 return {ranked,weather,weights,modelVersion:MODEL_VERSION};
}
export function validateField(field){
 if(!field||typeof field.name!=='string'||field.name.trim().length<1||field.name.length>80)throw Error('Field name must contain 1–80 characters.');
 if(!Number.isFinite(field.lat)||Math.abs(field.lat)>90||!Number.isFinite(field.lon)||Math.abs(field.lon)>180)throw Error('Enter valid latitude and longitude.');
 if(!Number.isFinite(field.area)||field.area<=0||field.area>100000)throw Error('Field area must be between 0 and 100,000 hectares.');
 if(!['loam','clay','sandy'].includes(field.soil)||!Object.hasOwn(crops,field.previous))throw Error('Choose a supported soil texture and previous crop.');
 if(!Number.isFinite(field.irrigation)||field.irrigation<0||field.irrigation>1000)throw Error('Irrigation must be between 0 and 1,000 mm per season.');
 return field;
}
export function validateSettings(s){
 for(const [k,min,max] of [['year',2021,2024],['firstMonth',5,9],['secondMonth',9,12],['firstIrrigation',0,1000],['secondIrrigation',0,1000],['rainChange',-60,30],['secondRainChange',-60,30],['heatChange',0,5],['secondHeatChange',0,5]])if(!Number.isFinite(s[k])||s[k]<min||s[k]>max)throw Error(`Invalid ${k}.`);
 if(![s.year,s.firstMonth,s.secondMonth].every(Number.isInteger)||!['balanced','water','soil'].includes(s.priority))throw Error('Invalid calendar or scoring priority.');return s;
}
export function historicalRange(record,field,settings){return [2021,2022,2023,2024].map(year=>{try{return {year,result:evaluate(record,field,{...settings,year})}}catch(e){return {year,error:e.message}}})}
