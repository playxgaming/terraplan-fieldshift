import {FIELD_CHOICES} from './field.mjs';

export const LABEL_LANGUAGES=Object.freeze({en:'English',hi:'हिन्दी · Hindi',gu:'ગુજરાતી · Gujarati',mr:'मराठी · Marathi'});
export const LABEL_STORAGE_KEY='terraplan.v3.labels';
const paths=['/','/field','/climate','/priorities','/compare','/whatif','/evidence'];
const crops=['rice','wheat','sorghum','bajra','maize','soybean','groundnut','chickpea','tur','moong','cotton','fodder'];
const catalog=(nav,names,bare)=>Object.freeze({nav:Object.freeze(Object.fromEntries(paths.map((path,i)=>[path,nav[i]]))),crops:Object.freeze(Object.fromEntries(crops.map((id,i)=>[id,names[i]]))),bare});
export const LABELS=Object.freeze({
  hi:catalog(['स्वागत','मेरा खेत','आपकी जलवायु','प्राथमिकताएँ','फसल चक्र की तुलना','अगर ऐसा हो तो?','साक्ष्य'],['धान','गेहूँ','रबी ज्वार','बाजरा','मक्का','सोयाबीन','मूंगफली','चना','अरहर (तूर)','मूंग','कपास','चारे की ज्वार'],'बिना फसल'),
  gu:catalog(['સ્વાગત','મારું ખેતર','તમારી આબોહવા','પ્રાથમિકતાઓ','પાક ફેરબદલીની તુલના','જો આવું થાય તો?','પુરાવા'],['ડાંગર','ઘઉં','રવી જુવાર','બાજરી','મકાઈ','સોયાબીન','મગફળી','ચણા','તુવેર','મગ','કપાસ','ચારા જુવાર'],'પાક વગર'),
  mr:catalog(['स्वागत','माझे शेत','तुमचे हवामान','प्राधान्ये','पीक फेरपालटीची तुलना','असे झाले तर?','पुरावे'],['भात','गहू','रब्बी ज्वारी','बाजरी','मका','सोयाबीन','भुईमूग','हरभरा','तूर','मूग','कापूस','चाऱ्याची ज्वारी'],'पीक नाही'),
});
export const validLanguage=value=>typeof value==='string' && Object.hasOwn(LABEL_LANGUAGES,value);

export function loadLabelLanguage(storage) {
  try {
    const bytes=storage.getItem(LABEL_STORAGE_KEY);
    if(bytes===null)return {language:'en',error:''};
    const record=JSON.parse(bytes);
    if(record?.version!==1 || !validLanguage(record.language))throw Error('invalid');
    return {language:record.language,error:''};
  } catch {return {language:'en',error:'Saved label language could not be read. English labels are shown; the old record is kept.'};}
}
export function saveLabelLanguage(storage,language) {
  if(!validLanguage(language))return 'Choose a supported label language.';
  try {storage.setItem(LABEL_STORAGE_KEY,JSON.stringify({version:1,language}));return '';}
  catch {return 'Labels changed in this tab, but the language could not be saved for reload.';}
}

const escapeRegex=text=>text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function matcher(rows) {
  const names=new Map([...FIELD_CHOICES.crop,...rows.map(row=>[row.id,row.name])].map(([id,name])=>[name,id]));
  const pattern=[...names.keys()].filter(Boolean).sort((a,b)=>b.length-a.length).map(escapeRegex).join('|');
  return {names,regex:new RegExp(`(?<![\\p{L}\\p{N}])(?:${pattern})(?![\\p{L}\\p{N}])`,'gu')};
}
export function cropLabels(text,language,rows=[]) {
  if(!LABELS[language])return text;
  const {names,regex}=matcher(rows);
  return text.replace(regex,name=>`${name} / ${LABELS[language].crops[names.get(name)]??name}`);
}

const ariaOriginal=new WeakMap();
/** Add native labels as text nodes; English and stable crop IDs remain intact. Idempotent. */
export function applyCropLabels(root,language,rows=[]) {
  root.querySelectorAll('[data-native-label]').forEach(node=>node.remove());
  for(const option of root.querySelectorAll('select[name^="rotation_"] option')) {
    option.dataset.englishLabel??=option.textContent;
    const native=option.value==='bare'?LABELS[language]?.bare:LABELS[language]?.crops[option.value];
    option.textContent=option.dataset.englishLabel+(native?' / '+native:'');
  }
  for(const element of root.querySelectorAll('[aria-label]')) {
    if(!ariaOriginal.has(element))ariaOriginal.set(element,element.getAttribute('aria-label'));
    element.setAttribute('aria-label',cropLabels(ariaOriginal.get(element),language,rows));
  }
  if(!LABELS[language])return;
  const {names,regex}=matcher(rows),doc=root.ownerDocument,walker=doc.createTreeWalker(root,4),nodes=[];
  while(walker.nextNode()) {
    const node=walker.currentNode;
    if(!node.parentElement.closest('option,script,style,.leaflet-container,[data-language-static]'))nodes.push(node);
  }
  for(const node of nodes) {
    const matches=[...node.data.matchAll(regex)];
    if(!matches.length)continue;
    const fragment=doc.createDocumentFragment();let last=0;
    for(const match of matches) {
      fragment.append(doc.createTextNode(node.data.slice(last,match.index)+match[0]));
      const native=LABELS[language].crops[names.get(match[0])];
      if(native) {const span=doc.createElement('span');span.dataset.nativeLabel='';span.lang=language;span.textContent=' / '+native;fragment.append(span);}
      last=match.index+match[0].length;
    }
    fragment.append(doc.createTextNode(node.data.slice(last)));node.replaceWith(fragment);
  }
}
