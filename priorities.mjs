import {defaultPriorities,validatePriorities} from './engine.mjs';
export const PRIORITY_STORAGE_KEY='terraplan.v3.priorities';
export function loadPriorities(storage){
  try{
    const bytes=storage.getItem(PRIORITY_STORAGE_KEY);
    if(bytes===null)return {priorities:defaultPriorities(),error:''};
    const record=JSON.parse(bytes),checked=validatePriorities(record?.priorities);
    if(record?.version!==1 || !checked.valid)throw Error('invalid');
    return {priorities:checked.priorities,error:''};
  }catch{return {priorities:defaultPriorities(),error:'Saved priorities could not be read. Defaults are shown; the stored copy is kept until you change a weight or reset.'};}
}
export function savePriorities(storage,priorities){
  const checked=validatePriorities(priorities);
  if(!checked.valid)return 'Invalid priorities were not saved.';
  try{storage.setItem(PRIORITY_STORAGE_KEY,JSON.stringify({version:1,priorities:checked.priorities}));return '';}
  catch{return 'Priorities changed in this tab, but browser storage is unavailable. Reloading may lose these changes.';}
}
