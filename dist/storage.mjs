import {MODEL_VERSION,validateField,validateSettings,defaults,evaluate} from './engine.mjs';
export const STORAGE_KEY='terraplan.workspace.v2';
export function demoField(){return {id:'demo-pune',name:'Pune demo plot',lat:18.52,lon:73.86,area:2.5,soil:'loam',previous:'rice',irrigation:200,demo:true}}
export function emptyState(){return {schemaVersion:2,fields:[demoField()],activeFieldId:'demo-pune',plans:[],drafts:{'demo-pune':{...defaults}},compare:['millet','sorghum','rice']}}
export function readState(storage){try{const raw=storage.getItem(STORAGE_KEY);if(!raw)return {state:emptyState()};const state=JSON.parse(raw);if(state.schemaVersion!==2||!Array.isArray(state.fields)||!Array.isArray(state.plans)||state.fields.length>100||state.plans.length>100)throw Error('Unsupported workspace format.');state.fields.forEach(validateField);state.plans.forEach(validatePlan);if(state.fields.some(f=>typeof f.id!=='string'))throw Error('Invalid field identifier.');state.drafts=state.drafts||{};for(const draft of Object.values(state.drafts))validateSettings(draft);state.compare=Array.isArray(state.compare)?state.compare.filter(id=>['rice','millet','sorghum','maize','mung'].includes(id)).slice(0,3):['millet','sorghum','rice'];return {state}}catch(e){return {state:emptyState(),warning:'Saved workspace could not be read. The demo is available; the previous stored data have not been overwritten.'}}}
export function persist(storage,state){storage.setItem(STORAGE_KEY,JSON.stringify(state))}
export function makePlan(name,field,settings,record,result){return {schemaVersion:2,id:crypto.randomUUID(),name:name.trim(),createdAt:new Date().toISOString(),modelVersion:MODEL_VERSION,field:structuredClone(field),settings:structuredClone(settings),dataset:structuredClone(record),result:structuredClone(result)}}
export function validatePlan(plan){
 if(!plan||plan.schemaVersion!==2||plan.modelVersion!==MODEL_VERSION)throw Error('This plan format or model version is unsupported. Keep the original file for an older version.');
 if(typeof plan.name!=='string'||!plan.name.trim()||plan.name.length>80||typeof plan.id!=='string'||plan.id.length>100||!Number.isFinite(Date.parse(plan.createdAt)))throw Error('Plan metadata is invalid.');
 validateField(plan.field);validateSettings(plan.settings);
 if(!plan.dataset?.data?.properties?.parameter||typeof plan.dataset.request_url!=='string')throw Error('Plan does not contain a supported NASA record.');
 const url=new URL(plan.dataset.request_url);
 if(url.origin!=='https://power.larc.nasa.gov'||url.pathname!=='/api/temporal/daily/point'||Math.abs(Number(url.searchParams.get('latitude'))-plan.field.lat)>.0001||Math.abs(Number(url.searchParams.get('longitude'))-plan.field.lon)>.0001||!url.searchParams.has('latitude')||!url.searchParams.has('longitude'))throw Error('The NASA source request does not match the saved field coordinates.');
 plan.result=evaluate(plan.dataset,plan.field,plan.settings);return plan;
}
