/** Native print only. Expand relevant explanations temporarily and restore after cancel/print. */
export function expandPrintDetails(details) {
  const state=Array.from(details,element=>[element,element.open]);
  for(const [element] of state)element.open=true;
  return ()=>{for(const [element,open] of state)element.open=open;};
}

export function installPrintView(win,root,contextElement,getContext) {
  let restore=null;
  const before=()=>{
    if(restore)return;
    contextElement.textContent=getContext();
    restore=expandPrintDetails(root.querySelectorAll('.comparison-confidence,.benefit-badge,.trend-panel > details,.compare-context'));
  };
  const after=()=>{restore?.();restore=null;};
  win.addEventListener('beforeprint',before);win.addEventListener('afterprint',after);
  return ()=>{after();win.removeEventListener('beforeprint',before);win.removeEventListener('afterprint',after);};
}
