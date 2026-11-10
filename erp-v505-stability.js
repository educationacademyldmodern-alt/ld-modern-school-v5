/* V505 stability: DOM-only. No network calls, SQL, authorization bypass, or background polling. */
(()=>{'use strict';if(window.LDM_V505_STABILITY)return;
const D=document,W=window,$=id=>D.getElementById(id);
const admin=()=>['admin','principal','super_admin'].includes(String(W.profile?.role||'').toLowerCase());
let scheduled=false;
function cleanNotice(){
 const host=$('erpContent');if(!host)return;
 // A single marksheet refresh must not render repeated identical status notices.
 const nodes=[...host.querySelectorAll('.ldmInlineStatus')].filter(n=>
   /marksheet_center\s*[•·]\s*डेटा अपडेट किया गया/.test(n.textContent||''));
 if(nodes.length>1)nodes.slice(0,-1).forEach(n=>n.remove());
 const exact='✓ marksheet_center • डेटा अपडेट किया गया';
 const duplicateLeaves=[...host.querySelectorAll('div,p,span')].filter(n=>n.children.length===0&&
   String(n.textContent||'').replace(/\s+/g,' ').trim()===exact);
 for(let i=1;i<duplicateLeaves.length;i++)duplicateLeaves[i].hidden=true;
 // Do not touch other success notices/errors: multiple actions can be legitimate.
}
function stableDashboard(){
 const root=$('erpContent')?.querySelector('.ldmRootAdminDash');
 if(!root||!admin()||String(W.__v90Route||'dashboard')!=='dashboard')return;
 // Canonical order survives legacy modules that prepend their own dashboard cards.
 const hero=root.querySelector(':scope > #ldm500Hero'),controls=root.querySelector(':scope > #r323AdminControl');
 if(hero&&root.firstElementChild!==hero)root.prepend(hero);
 if(hero&&controls&&hero.nextElementSibling!==controls)hero.after(controls);
 if(!$('v233Greeting'))W.ldmV233InstallDashboard?.();
 // Greeting is not a disposable popup. Existing canonical renderer owns its content.
 const greeting=$('v233Greeting');if(greeting){
   if(greeting.hidden)greeting.hidden=false;
   if(greeting.getAttribute('aria-hidden')==='true')greeting.removeAttribute('aria-hidden');
   if(greeting.style.display==='none')greeting.style.removeProperty('display');
   if(greeting.style.visibility==='hidden')greeting.style.removeProperty('visibility');
 }
}
function correct(){scheduled=false;cleanNotice();stableDashboard()}
function queue(){if(!scheduled){scheduled=true;W.requestAnimationFrame(correct)}}
function init(){const host=$('erpContent');if(!host)return;
 const observer=new MutationObserver(records=>{
   if(records.some(r=>
      (r.type==='attributes'&&r.target.id==='v233Greeting')||
      (r.type==='characterData'&&r.target.parentElement?.matches?.('.ldmInlineStatus'))||
      [...r.removedNodes].some(n=>n.nodeType===1&&(n.id==='v233Greeting'||n.querySelector?.('#v233Greeting')))||
      [...r.addedNodes].some(n=>n.nodeType===1&&
        (n.matches?.('.ldmRootAdminDash,.ldmInlineStatus,#v233Greeting,#ldm500Hero,#s336DashboardCard,#r323AdminControl')||
         n.querySelector?.('.ldmRootAdminDash,.ldmInlineStatus,#v233Greeting,#r323AdminControl')))))queue();
 });
 observer.observe(host,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden','style','aria-hidden']});queue();
}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',init,{once:true});else init();
W.LDM_V505_STABILITY=Object.freeze({check:correct,version:'505.0'});
})();
