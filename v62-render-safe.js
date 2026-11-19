/* V539 - scoped header/nav events, no global per-click reinstallation, no network activity. */
(()=>{'use strict';
 if(window.LDM_V539_HEADER_EVENTS)return;
 window.LDM_V539_HEADER_EVENTS=true;
 const D=document,W=window,$=id=>D.getElementById(id);
 const role=()=>String(W.profile?.role||'').toLowerCase();
 const isAdmin=()=>['super_admin','admin','principal'].includes(role());
 const closeMobile=()=>{if(W.innerWidth<=900)D.querySelector('#erp aside')?.classList.remove('open')};
 const mark=()=>{const erp=$('erp');if(!erp)return;erp.dataset.v62Role=role()||'unknown';if(W.innerWidth<=900)erp.classList.remove('v62Collapsed')};
 // Delegated click survives header/nav DOM replacement without binding each time.
 D.addEventListener('click',event=>{
   const target=event.target;
   if(!target?.closest)return;
   if(target.closest('#erpNav button')){mark();setTimeout(closeMobile,0);return;}
   if(target.closest('#erp .hamb')&&W.innerWidth>900&&isAdmin()){mark();$('erp')?.classList.toggle('v62Collapsed');}
 },true);
 W.addEventListener('resize',()=>{mark();if(W.innerWidth>900)D.querySelector('#erp aside')?.classList.remove('open')},{passive:true});
 if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',mark,{once:true});else mark();
 W.addEventListener('load',mark,{once:true});
})();
