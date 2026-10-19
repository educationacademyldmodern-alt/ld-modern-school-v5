/* Paper work runs when visible. Synchronous capture/print and exit always flush drafts. */
(()=>{'use strict';const api=window.LDM_PAPER_FORM_V343;if(!api)return;
let saveTimer=null,savePending=false,lastKey='',disposed=false;const stats={layouts:0,hiddenSkips:0,cacheHits:0,draftWrites:0};
const saveBase=save;function flush(){clearTimeout(saveTimer);saveTimer=null;if(!savePending)return;savePending=false;saveBase();stats.draftWrites++}
save=function(){savePending=true;clearTimeout(saveTimer);saveTimer=setTimeout(flush,140)};
const layoutStyle=document.createElement('style');layoutStyle.textContent='#sheets,#sheets .sheet{contain:layout style}';document.head.append(layoutStyle);
const quickBase=quickUI;quickUI=function(){if(document.body.classList.contains('t350Simple'))return;return quickBase()};
const modelBase=modelMount;modelMount=function(){if(document.body.classList.contains('t350Simple')){$('modelPaperPanel')?.remove();return}return modelBase()};
const paginateBase=paginate;paginate=function(){clearTimeout(paginationTimer);const printing=window.__ldmPaperPrintPhase||window.matchMedia('print').matches;
if(disposed||state.studioSnapshot||(!printing&&document.body.dataset.paperView!=='preview')){stats.hiddenSkips++;return}
const key=JSON.stringify(state)+'|'+keyMode+'|'+!!printing+'|'+innerWidth+'|'+$('sheets').clientWidth+'|'+document.fonts.status;
if(lastKey===key){stats.cacheHits++;return}const result=paginateBase();lastKey=JSON.stringify(state)+'|'+keyMode+'|'+!!printing+'|'+innerWidth+'|'+$('sheets').clientWidth+'|'+document.fonts.status;stats.layouts++;return result};
const load=api.load;api.load=function(...args){disposed=false;lastKey='';clearTimeout(saveTimer);savePending=false;const result=load(...args);if(document.body.dataset.paperView!=='preview')$('sheets').replaceChildren();flush();return result};
for(const name of ['capture','ackRevision','ackSaved']){const base=api[name];api[name]=function(...args){try{return base.apply(this,args)}finally{flush()}}}
const imported=api.importContent;api.importContent=function(...args){disposed=false;lastKey='';const out=imported.apply(this,args);flush();return out};
const dispose=api.dispose;api.dispose=function(){flush();disposed=true;lastKey='';clearTimeout(paginationTimer);return dispose.apply(this,arguments)};
addEventListener('pagehide',flush);addEventListener('beforeunload',flush,{capture:true});document.addEventListener('visibilitychange',()=>{if(document.hidden)flush()});
window.LDM_PAPER_PERFORMANCE_V373={flush,stats:()=>({...stats}),invalidate:()=>{lastKey=''}};
})();
