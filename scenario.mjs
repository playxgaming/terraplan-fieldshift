import {validateScenario} from './engine.mjs';
export const SCENARIO_STORAGE_KEY='terraplan.v3.whatif';
export function loadScenario(storage) {
  try {
    const bytes=storage.getItem(SCENARIO_STORAGE_KEY);
    if(bytes===null)return {scenario:null,error:''};
    const record=JSON.parse(bytes),checked=validateScenario(record?.scenario);
    if(record?.version!==1 || !checked.valid)throw Error('invalid');
    return {scenario:checked.scenario,error:''};
  }catch{return {scenario:null,error:'Saved What-if settings could not be read. The old record is kept. Defaults are shown until you change or reset a setting.'};}
}
export function saveScenario(storage,scenario) {
  const checked=validateScenario(scenario);
  if(!checked.valid)return {saved:false,error:'What-if settings are invalid; the previous settings are kept.'};
  try{storage.setItem(SCENARIO_STORAGE_KEY,JSON.stringify({version:1,scenario:checked.scenario}));return {saved:true,error:''};}
  catch{return {saved:false,error:'What-if settings changed in this tab, but this browser could not save them for reload.'};}
}
