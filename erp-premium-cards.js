/* Presentation only: decorate existing launcher nodes, preserving actions and permission state. */
(()=>{'use strict';if(window.LDM_PREMIUM_CARDS)return;const D=document;
const known='.v90MonitorGrid,.ldmMasterGrid,.ldmTeacherModules,.v114QuickGrid,.v39QuickGrid,.v48ReportGrid,.futureGrid,.ldmCTModules,.v114PortalQuick,.v90Quick,.v185FrontActions,#r323ControlActions';
const palette=['#3558ed','#079e9b','#ad337f','#dd8a37','#08a878','#168ddd','#219d7a','#346edb','#6262d1','#ac754d'];
let queued=false;const observers=new Map();
const isEmoji=s=>/\p{Extended_Pictographic}/u.test(s)&&!/[A-Za-z\u0900-\u097f]/.test(s);
function identity(card){const code=card.getAttribute('onclick')||'';const title=card.querySelector('b,strong,h3,h4')?.textContent?.trim();return card.dataset.assignFunction||card.dataset.route||code.match(/render\(['"]([^'"]+)/)?.[1]||window.LDM_MANAGEMENT?.entries.find(e=>e.title===title)?.route||title||card.textContent.trim()}
function colour(key){const k=key.toLowerCase();if(/student|admission/.test(k))return 0;if(/teacher|staff/.test(k))return 1;if(/exam|paper/.test(k))return 2;if(/station|letter|form/.test(k))return 3;if(/fee|financ|balance|salary|account/.test(k))return 4;if(/time|bell|attendance|presence/.test(k))return 5;if(/teach|syllabus|plan/.test(k))return 6;if(/marks|result/.test(k))return 7;if(/id.?card|certificate/.test(k))return 8;if(/seat|desk|transport/.test(k))return 9;let h=0;for(const c of key)h=(h*31+c.codePointAt(0))>>>0;return h%palette.length}
function fallback(key){const k=key.toLowerCase();return /student|admission/.test(k)?'🎓':/teacher|staff/.test(k)?'👩‍🏫':/fee|financ|balance|salary/.test(k)?'💰':/exam|paper/.test(k)?'📝':/mark|result/.test(k)?'📑':/time|bell/.test(k)?'⏰':/teach|syllabus|plan/.test(k)?'📚':/id.?card/.test(k)?'🪪':/transport/.test(k)?'🚌':/seat|desk/.test(k)?'🪑':/attendance|presence/.test(k)?'📅':'🏫'}
function decorate(card){if(card.classList.contains('ldm3dCard'))return;
 if(card.hidden||card.classList.contains('hidden')||card.style.display==='none')return;
 const key=identity(card);let icon=card.querySelector('.v90MonitorIcon,:scope>i,:scope>svg,:scope>img');
 if(!icon)icon=[...card.children].find(e=>isEmoji(e.textContent.trim()));
 if(!icon){const text=[...card.childNodes].find(n=>n.nodeType===3&&isEmoji(n.textContent.trim()));if(text){icon=D.createElement('span');text.replaceWith(icon);icon.append(text)}}
 if(!icon){icon=D.createElement('span');icon.textContent=fallback(key);icon.classList.add('ldm3dAddedIcon');card.prepend(icon)}
 icon.classList.add('ldm3dIcon');icon.setAttribute('aria-hidden','true');
 const title=[...card.querySelectorAll('b,strong,h3,h4')].find(e=>e!==icon&&!icon.contains(e))||[...card.children].find(e=>e!==icon&&e.tagName==='SPAN'&&!e.querySelector('b,strong,small'));
 if(title)title.classList.add('ldm3dTitle');
 card.querySelectorAll('small').forEach(e=>e.classList.add('ldm3dSubtitle'));
 card.querySelectorAll('em').forEach(e=>e.classList.add('ldm3dBadge'));
 card.classList.add('ldm3dCard');card.style.setProperty('background',`radial-gradient(ellipse at 12% 0%,${palette[colour(key)]} 0%,transparent 78%),linear-gradient(145deg,${palette[colour(key)]},#10223e 96%)`,'important');
 // Existing gate badge has inline spacing; keep it below, not over the title.
 if(card.matches('.v102DashGate'))card.style.setProperty('padding-bottom','30px','important');
}
const candidates='[class*="Grid"],[class*="grid"],[class*="Modules"],[class*="Cards"]';
function apply(root){const groups=new Set(root.querySelectorAll(known));
 if(root.matches(known))groups.add(root);
 // Additional existing function registries: only homogeneous launcher grids, never data/form grids.
 const possible=[...root.querySelectorAll(candidates)];if(root.matches(candidates))possible.push(root);possible.forEach(g=>{
 if(g.closest('table,form,dialog,[role="dialog"],.ldm3dCard')||g.querySelector('input,select,textarea,table'))return;
 const kids=[...g.children].filter(e=>e.tagName!=='STYLE');if(kids.length&&kids.every(e=>e.matches('a[href],[role="button"],[onclick],[data-route]')&&!e.querySelector('button,input,select,textarea')&&(e.querySelector('b,strong,i,svg')||/render\(/.test(e.getAttribute('onclick')||''))))groups.add(g);
 });
 for(const grid of groups){if(grid.hidden||grid.classList.contains('hidden')||grid.style.display==='none')continue;const cards=[...grid.children].filter(e=>e.matches('button,a,[role="button"],[onclick]'));if(!cards.length)continue;
 grid.classList.add('ldm3dGrid');cards.forEach(decorate);
 const panel=grid.parentElement;if(panel?.matches('.v114ManagementPanel,.ldmMasterControl,.v39QuickPanel'))panel.classList.add('ldm3dPanel');
 }
}
const dirty=new Set();
function flush(){
 queued=false;const nodes=[...dirty];dirty.clear();
 for(const el of nodes)if(el.isConnected&&!nodes.some(parent=>parent!==el&&parent.contains(el)))apply(el);
}
function schedule(el){dirty.add(el);if(!queued){queued=true;requestAnimationFrame(flush)}}
function observe(records){
 for(const record of records){
  const parent=record.target;
  if(parent.nodeType!==1||parent.closest('.ldm3dCard'))continue;
  if(parent.matches(known+','+candidates)){schedule(parent);continue}
  for(const el of record.addedNodes)if(el.nodeType===1&&!el.matches('input,select,option,textarea,table,thead,tbody,tr,td,th'))schedule(el);
 }
}
function refresh(){
 for(const [root,observer] of observers)if(!root.isConnected){observer.disconnect();observers.delete(root)}
 for(const id of ['erpContent','parentDashboard']){
  const root=D.getElementById(id);if(!root)continue;
  if(!observers.has(root)){const observer=new MutationObserver(observe);observer.observe(root,{childList:true,subtree:true});observers.set(root,observer)}
  schedule(root);
 }
}
window.LDM_PREMIUM_CARDS=Object.freeze({refresh,version:'465'});if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
})();
