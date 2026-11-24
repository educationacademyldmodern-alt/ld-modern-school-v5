/* V542: dashboard-only scope; no data calls and no permission changes. */
(()=>{'use strict';const D=document,W=window;
const root=()=>D.querySelector('#erpContent > :is(.ldm535PremiumDashboard,.ldmNewTeacher,.v114TeacherDash)');
const literal=/^\s*(?:window\.)?render\(\s*['"]([\w-]+)['"]\s*\)\s*;?\s*$/;
function sameScope(grid,attribute){const seen=new Set();for(const b of grid.querySelectorAll(':scope > button')){const key=attribute?b.getAttribute(attribute):literal.exec(b.getAttribute('onclick')||'')?.[1];if(!key||b.id||b.querySelector('[id]'))continue;const context=[...b.attributes].filter(a=>a.name.startsWith('data-')&&a.name!==attribute&&a.name!=='data-teacher-sector').map(a=>a.name+'='+a.value).sort().join('|');const identity=[key,context,b.hidden,b.disabled,b.getAttribute('onclick')||''].join('\u001f');if(seen.has(identity))b.remove();else seen.add(identity);}}
function apply(){queued=false;const r=root(),role=String(W.profile?.role||'').toLowerCase();if(r&&['admin','principal','super_admin','teacher'].includes(role)){
 const top=D.querySelector('#erp .erpTop');if(top){const native=top.querySelector('[data-ldm-appearance-open]:not(#ldm542ThemeFallback)');const fallback=top.querySelector('#ldm542ThemeFallback');if(native&&fallback)fallback.remove();else if(!native&&!fallback){const b=D.createElement('button');b.type='button';b.id='ldm542ThemeFallback';b.setAttribute('data-ldm-appearance-open','');b.textContent='◐ थीम / Theme';top.append(b);}}
 if(role==='teacher')r.querySelectorAll('.ldmTeacherModules').forEach(g=>sameScope(g));
 }
 // Parent actions are only equivalent within the SAME child's existing quick grid.
 // Parent callbacks can have child-specific closures; preserve unless exact inline handler is proven.
 D.querySelectorAll('#parentDashboard .v114PortalQuick').forEach(g=>sameScope(g));
}
let queued=false;function schedule(){if(queued)return;queued=true;(W.requestAnimationFrame||((f)=>Promise.resolve().then(f)))(apply);}
function start(){const host=D.getElementById('erpContent'),parent=D.getElementById('parentDashboard'),top=D.querySelector('#erp .erpTop');const o=new MutationObserver(schedule);for(const n of [host,parent,top])if(n)o.observe(n,{subtree:true,childList:true});schedule();}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',start,{once:true});else start();
W.LDM_DASHBOARD_V542=Object.freeze({version:'542',refresh:schedule});})();
