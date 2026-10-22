/* One imposed preview, shared by PDF and duplex print. No polling or network work. */
(()=>{'use strict';const api=window.LDM_PAPER_FORM_V343;if(!api)return;
const D=document,$=id=>D.getElementById(id);let disposed=false,lastKey='',running=false;
const stats={layouts:0,cacheHits:0,hiddenSkips:0};
function setup(){
 if(Number(state.printSetupVersion)<422||!state.printSetupVersion){state.printMode='auto';state.printDirection='landscape';state.layout='two';state.bookletCopies=1;state.printSetupVersion=422;}
 state.previewPrintOrder=true;
}
function controls(){
 const choice=$('pe410Layout');if(choice)choice.value=state.printMode==='single'?state.printDirection:state.printMode;
 const order=$('pw371Order');if(order){order.textContent='आगे / पीछे का प्रिंट क्रम';order.onclick=()=>{api.preview();$('printMap422')?.scrollIntoView({block:'nearest'});};}
 pmSync();
}
const load=api.load;api.load=function(payload,ctx){disposed=false;lastKey='';const result=load.apply(this,arguments);setup();controls();save();return result;};
const base=paginate;
paginate=function(){
 clearTimeout(paginationTimer);
 const printing=!!window.__ldmPaperPrintPhase||matchMedia('print').matches;
 if(disposed||D.hidden&&!printing||!printing&&D.body.dataset.paperView!=='preview'){stats.hiddenSkips++;return;}
 if(running)return;
 setup();
 // Width changes only scale the same physical A4 sheet; they do not reflow questions.
 const key=JSON.stringify(state)+'|'+keyMode+'|'+D.fonts.status;
 if(lastKey===key&&$('sheets').children.length){stats.cacheHits++;if($('pmSummary')&&$('pageStatus'))$('pageStatus').textContent=$('pmSummary').textContent;fit();controls();return;}
 running=true;
 try{
  base();
  if($('sheets').children.length){lastKey=JSON.stringify(state)+'|'+keyMode+'|'+D.fonts.status;stats.layouts++;}
  let map=$('printMap422');if(!map){map=D.createElement('div');map.id='printMap422';map.setAttribute('role','status');$('pageStatus').after(map);}
  const sheets=[...$('sheets').children],book=sheets[0]?.classList.contains('pmBooklet');
  map.replaceChildren();
  const help=D.createElement('p');help.textContent=book?'Booklet • बीच से मोड़ें • दोनों तरफ प्रिंट • Flip on short edge':'दो पूरी प्रतियाँ • बीच से काटें • दोनों तरफ प्रिंट • Flip on short edge';
  map.append(help);
  for(const sheet of sheets){const row=D.createElement('div');row.textContent='शीट '+sheet.dataset.physical+' · '+sheet.dataset.side+' : '+[...sheet.children].map(n=>Number(n.dataset.page)?'पेज '+n.dataset.page:'खाली').join(' | ');map.append(row);}
  fit();controls();
 }finally{running=false;}
};
function fit(){const host=$('sheets');if(!host)return;const width=host.clientWidth;for(const sheet of host.children){const z=Math.min(1,Math.max(.1,(width-4)/(281*96/25.4)));if(state.printMode!=='single')sheet.style.zoom=z;}}
const dispose=api.dispose;api.dispose=function(){disposed=true;lastKey='';clearTimeout(paginationTimer);return dispose.apply(this,arguments);};
const style=D.createElement('style');style.textContent=`
#printMap422{font:13px/1.6 system-ui,'LDM Deva',sans-serif;margin:8px 0 14px;padding:10px 12px;background:#fff;border:1px solid #cad8e2;border-radius:9px;overflow-wrap:anywhere;color:#173c52}
#printMap422 p{margin:0 0 5px;font-weight:700}
#paperWorkspace371{position:relative!important;top:auto!important}
.sheet>.leaf{min-height:0;box-sizing:border-box}.leafContent{box-sizing:border-box}
.leaf .matchingQuestion .matchRow{grid-template-columns:24px minmax(0,1fr) 24px minmax(0,1fr) 30px}.leaf .qt{min-width:0}.leaf .qrow{align-items:start}.leaf .blockTitle{gap:6px}.leaf .blockTitle>span:first-child{min-width:0;overflow-wrap:anywhere}.leaf .blockTitle>span:last-child{flex-shrink:0}
@media print{#printMap422{display:none!important}#sheets>.sheet{zoom:1!important;transform:none!important}}
`;D.head.append(style);
setup();controls();window.LDM_PAPER_PRINT_V422={version:422,stats:()=>({...stats}),invalidate:()=>{lastKey='';window.LDM_PAPER_PERFORMANCE_V373?.invalidate?.();}};
})();
