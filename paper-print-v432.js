/* One imposed preview, shared by PDF and duplex print. No polling or network work. */
(()=>{'use strict';const api=window.LDM_PAPER_FORM_V343;if(!api)return;
const D=document,$=id=>D.getElementById(id);
const originalQuestion431=questionHTML;questionHTML=function(text,type){if(type===5)text=String(text).replace(/\s*\((?:true\s*\/\s*false|सही\s*\/\s*गलत|सत्य\s*\/\s*असत्य)\)\s*$/i,'');if((type===0||type===3&&/(?:निबंध|essay)/i.test(text))&&window.LDM_PAPER_STRUCTURE431){const M=window.LDM_PAPER_STRUCTURE431,p=M.pipeOptions(text)||M.options(text);if(p){type=0;text=M.legacyText({type:'mcq',text:p.text.replace(/\s*\/\s*$/,''),extra:p.options.map((v,i)=>'('+String.fromCharCode(97+i)+') '+v).join('\n')});}}return originalQuestion431(text,type)};
let disposed=false,lastKey='',running=false;
const stats={layouts:0,cacheHits:0,hiddenSkips:0};
function setup(){
 if(Number(state.printSetupVersion)<422||!state.printSetupVersion){state.printMode='auto';state.printDirection='landscape';state.layout='two';state.bookletCopies=1;state.printSetupVersion=422;}
 state.previewPrintOrder=true;
 if(!['serif','sans'].includes(state.paperFont423))state.paperFont423='serif';
 const lh=Number(state.paperLineHeight423);state.paperLineHeight423=Number.isFinite(lh)&&lh>=1&&lh<=2.5?lh:1.12;
 const fontValue=state.paperFont423==='sans'?"'LDM School Sans','LDM Deva',sans-serif":"'LDM School Serif','LDM Deva',serif";
 if(D.documentElement.style.getPropertyValue('--paper-font423')!==fontValue)D.documentElement.style.setProperty('--paper-font423',fontValue);
 if(D.documentElement.style.getPropertyValue('--paper-leading423')!==String(state.paperLineHeight423))D.documentElement.style.setProperty('--paper-leading423',state.paperLineHeight423);

}
const families={serif:'LDM School Serif',sans:'LDM School Sans'};let fontPromise=Promise.resolve(),fontKey='';
function readyFont(){const family=families[state.paperFont423]||families.serif;if(fontKey===family)return fontPromise;fontKey=family;
 fontPromise=Promise.all([D.fonts.load('11pt "'+family+'"'),D.fonts.load('700 11pt "'+family+'"'),D.fonts.load('11pt "LDM Deva"')]).then(()=>{lastKey='';window.LDM_PAPER_PERFORMANCE_V373?.invalidate?.();if(!disposed&&D.body.dataset.paperView==='preview')paginate();});return fontPromise;}
function controls(){
 let box=$('paperTypography423');const host=$('paperEasy410');
 if(host&&!box){box=D.createElement('fieldset');box.id='paperTypography423';box.innerHTML='<legend>पेपर फ़ॉन्ट और लाइन की दूरी</legend><label>फ़ॉन्ट <select id="paperFont423"><option value="serif">School Serif · पुस्तक जैसा</option><option value="sans">School Sans · साफ अक्षर</option></select></label><label>Line spacing <select id="paperSpacingPreset423"><option value="1">1.0 · कम दूरी</option><option value="1.15">1.15 · सामान्य</option><option value="1.3">1.3</option><option value="1.5">1.5</option><option value="2">2.0</option><option value="custom">अपनी दूरी / Custom</option></select><input id="paperSpacing423" type="number" min="1" max="2.5" step="0.05" inputmode="decimal" aria-label="Line spacing 1 to 2.5"></label>';host.append(box);
 $('paperFont423').onchange=e=>{state.paperFont423=e.target.value;changed();};
 $('paperSpacingPreset423').onchange=e=>{if(e.target.value==='custom'){$('paperSpacing423').focus();return;}state.paperLineHeight423=Number(e.target.value);changed();};
 $('paperSpacing423').onchange=e=>{const n=Number(e.target.value);if(!Number.isFinite(n)||n<1||n>2.5){syncTypography();return;}state.paperLineHeight423=Math.round(n*100)/100;changed();};
 }
 syncTypography();
 const choice=$('pe410Layout');if(choice)choice.value=state.printMode==='single'?state.printDirection:state.printMode;
 const order=$('pw371Order');if(order){order.textContent='आगे / पीछे का प्रिंट क्रम';order.onclick=()=>{api.preview();$('printMap422')?.scrollIntoView({block:'nearest'});};}
 pmSync();
}
function syncTypography(){if(!$('paperFont423'))return;$('paperFont423').value=state.paperFont423;$('paperSpacing423').value=state.paperLineHeight423;const v=String(state.paperLineHeight423);$('paperSpacingPreset423').value=['1','1.15','1.3','1.5','2'].includes(v)?v:'custom';}
function changed(){setup();lastKey='';window.LDM_PAPER_PERFORMANCE_V373?.invalidate?.();render();syncTypography();readyFont();}
const oldRender=render;render=function(){setup();const result=oldRender.apply(this,arguments);syncTypography();return result;};
const load=api.load;api.load=function(payload,ctx){disposed=false;lastKey='';const result=load.apply(this,arguments);setup();controls();readyFont();save();return result;};
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
  const help=D.createElement('p');const portrait=D.body.classList.contains('pmPortraitTwo')||(state.printMode==='single'&&state.printDirection==='portrait');help.textContent=(book?'Booklet • बीच से मोड़ें':state.printMode==='single'?'एक पूरा पेज': 'दो पूरी प्रतियाँ • बीच से काटें')+' • दोनों तरफ प्रिंट • Flip on '+(portrait?'long':'short')+' edge';
  map.append(help);
  for(const sheet of sheets){const row=D.createElement('div');row.textContent='शीट '+sheet.dataset.physical+' · '+sheet.dataset.side+' : '+[...sheet.children].map(n=>Number(n.dataset.page)?'पेज '+n.dataset.page:'खाली').join(' | ');map.append(row);}
  fit();controls();
 }finally{running=false;}
};
function fit(){const host=$('sheets');if(!host)return;const width=host.clientWidth;for(const sheet of host.children){const z=Math.min(1,Math.max(.1,(width-4)/(281*96/25.4)));if(state.printMode!=='single')sheet.style.zoom=z;}}
const priorReady=api.whenReady;api.whenReady=async function(){if(priorReady)await priorReady.apply(this,arguments);await readyFont();};
const print=api.print;api.print=async function(){await readyFont();await D.fonts.ready;if(!disposed)return print.apply(this,arguments);};
const dispose=api.dispose;api.dispose=function(){disposed=true;lastKey='';clearTimeout(paginationTimer);return dispose.apply(this,arguments);};
const style=D.createElement('style');style.textContent=`
#printMap422{font:13px/1.6 system-ui,'LDM Deva',sans-serif;margin:8px 0 14px;padding:10px 12px;background:#fff;border:1px solid #cad8e2;border-radius:9px;overflow-wrap:anywhere;color:#173c52}
#printMap422 p{margin:0 0 5px;font-weight:700}
#paperWorkspace371{position:relative!important;top:auto!important}
.sheet>.leaf{min-height:0;box-sizing:border-box}.leafContent{box-sizing:border-box}
.leaf .matchingQuestion .matchRow{grid-template-columns:24px minmax(0,1fr) 24px minmax(0,1fr) 30px}.leaf .qt{min-width:0}.leaf .qrow{align-items:start}.leaf .blockTitle{gap:6px}.leaf .blockTitle>span:first-child{min-width:0;overflow-wrap:anywhere}.leaf .blockTitle>span:last-child{flex-shrink:0}
#paperTypography423{display:flex;align-items:center;gap:10px;flex-wrap:wrap;border:1px solid #cedbe2;border-radius:9px;margin:0;padding:5px 9px 9px;max-width:100%;min-width:0}
#paperTypography423 legend{font-size:12px}#paperTypography423 input{width:70px;min-width:0;padding:8px;text-align:center}#paperTypography423 label{flex-wrap:wrap}
#sheets .leaf{font-family:var(--paper-font423)!important;line-height:var(--paper-leading423)!important;color:#000}
#sheets .leaf .paperSchool{font-family:var(--paper-font423)!important;font-weight:700;font-size:14pt;letter-spacing:0;line-height:1.1;text-transform:uppercase}
#sheets .leaf .paperTop{border:0;padding:2px 0 3px;text-align:center}
#sheets .leaf .paperExam{font:700 10pt/1.15 var(--paper-font423);margin:0}
#sheets .leaf .paperAddress{font:400 8pt/1.15 var(--paper-font423);margin:1px 0}
#sheets .leaf .meta{border:0;padding:3px 0;gap:1px 8px;line-height:var(--paper-leading423)}
#sheets .leaf .student{border:0;padding:3px 0;line-height:var(--paper-leading423)}
#sheets .leaf .instructions{padding:4px 0 3px;line-height:var(--paper-leading423)}
#sheets .leaf .instructions ol{margin:1px 0 0;padding-left:16px}
#sheets .leaf .blockTitle{background:#fff!important;color:#000;border:0;padding:2px 0;margin:4mm 0 2mm;line-height:var(--paper-leading423);font-weight:700}
#sheets .leaf .question{margin:0 0 2.7mm;line-height:var(--paper-leading423)}
#sheets .leaf .qrow{gap:5px;line-height:inherit}#sheets .leaf .qt{flex:1;line-height:inherit;white-space:normal}#sheets .leaf .mark{flex:0 0 auto;text-align:right;white-space:nowrap}
#sheets .leaf .options{margin:1.5mm 0 0 4mm;gap:1mm 4mm;line-height:inherit}
#sheets .leaf .leafFooter{font:400 7pt/1.2 var(--paper-font423);border:0;color:#222}
/* Reserve a physical footer gap; pagination measures this same content box. */
#sheets .leafContent{height:178mm}
#sheets .portrait .leafContent{height:262mm}
#sheets .leaf .matchHeads{background:transparent;border:0;padding:3px 0;gap:8px}
#sheets .leaf .matchRow,#sheets .leaf .keyRow,#sheets .leaf .review,#sheets .leaf .keyTitle,#sheets .leaf .compactHead{border:0;background:transparent}
#sheets .leaf .question,#sheets .leaf .matchingQuestion,#sheets .leaf .blockTitle{break-inside:avoid;page-break-inside:avoid}
#sheets .leaf .paperFoot{font-size:.8em;line-height:1.2;margin-top:7px;padding-top:4px;border:0}
/* V430: old V370 rules are !important; the final print style must win too.
   Scope this to decorative paper rules. Mathematical fraction/root lines,
   fill-in blanks and the physical cut/fold guide remain meaningful content. */
#sheets .sheet .leaf :is(.paperTop,.meta,.student,.blockTitle,.matchHeads,.matchRow,.leafFooter,.paperFoot,.compactHead,.keyTitle,.keyRow,.review,.answerSpace){border:0!important;outline:0!important;box-shadow:none!important;background-image:none!important}
#sheets .sheet .leaf *{font-family:inherit!important;line-height:var(--paper-leading423)!important}
#sheets .sheet .leaf .paperSchool{line-height:1.1!important}
#sheets .sheet .leaf .blockTitle{padding:2px 0!important;margin:4mm 0 2mm!important}
#sheets .sheet .leaf .matchHeads{grid-template-columns:24px minmax(0,1fr) 24px minmax(0,1fr) 30px!important}
#sheets .sheet .leaf .matchRow{grid-template-columns:24px minmax(0,1fr) 24px minmax(0,1fr) 30px!important}
#sheets .sheet .leaf .leafFooter{line-height:1.2!important}

body.pmPortraitTwo #sheets .sheet .leafContent{height:118mm!important}
body.pmSingleLandscape #sheets .sheet .leafContent{height:177mm!important}
#sheets .sheet .leaf .compactHead{display:none!important}
@media print{html[data-paper-unified] body[data-paper-view] :is(#paperWorkspace371,#paperSetup371,#paperEasy410,#t350Editor,#paperTypography370,#paperMasterTools,#paperTypography423,#printMap422,#pmSummary,#pageStatus,#pageIssue){display:none!important}html[data-paper-unified] body[data-paper-view]>main{display:block!important}#paperTypography423{display:none!important}#printMap422{display:none!important}#sheets>.sheet{zoom:1!important;transform:none!important}}
`;D.head.append(style);
setup();controls();readyFont();window.LDM_PAPER_PRINT_V422=window.LDM_PAPER_PRINT_V423=window.LDM_PAPER_PRINT_V426=window.LDM_PAPER_PRINT_V430=window.LDM_PAPER_PRINT_V431=window.LDM_PAPER_PRINT_V432={version:432,stats:()=>({...stats}),invalidate:()=>{lastKey='';window.LDM_PAPER_PERFORMANCE_V373?.invalidate?.();}};
})();
