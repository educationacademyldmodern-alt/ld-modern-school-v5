/* Event-driven login/logout shield. No polling, network requests, or auth listeners. */
(()=>{'use strict';const W=window,D=document;let active=0;const q=id=>D.getElementById(id);
function shield(text){let el=q('portal451Transition');if(!el){el=D.createElement('div');el.id='portal451Transition';el.setAttribute('role','status');el.setAttribute('aria-live','polite');el.innerHTML='<div><img src="school-logo.png" alt="School Logo"><strong>L D MODERN EDUCATION ACADEMY</strong><p></p></div>';D.body.append(el)}el.querySelector('p').textContent=text;el.hidden=false;D.body.setAttribute('aria-busy','true');return el}
function hide(){q('portal451Transition')?.remove();D.body.removeAttribute('aria-busy')}
for(const name of ['login','teacherPasswordLogin','parentPasswordLogin']){const base=W[name];if(typeof base!=='function')continue;W[name]=async function(...args){if(active)return;active++;W.__ldmAuthEpoch455=(W.__ldmAuthEpoch455||0)+1;W.__ldmInteractiveLogin=true;shield('लॉगिन की पुष्टि हो रही है… / Signing in…');try{return await base.apply(this,args)}finally{W.__ldmInteractiveLogin=false;active--;hide()}}}
// Await nested route owners without rerendering the dashboard or making auth calls.
const open=W.openERP;if(typeof open==='function')W.openERP=async function(...args){const owns=!active;if(owns){active++;shield('डैशबोर्ड खुल रहा है… / Opening dashboard…')}try{return await open.apply(this,args)}finally{if(owns){active--;hide()}}};
for(const name of ['logout']){const base=W[name];if(typeof base!=='function')continue;W[name]=async function(...args){if(active)return;active++;W.__ldmAuthEpoch455=(W.__ldmAuthEpoch455||0)+1;shield('लॉगआउट हो रहा है… / Signing out…');W.LDM_ATTENDANCE412?.stop?.();W.ldmCancelIdReads?.();try{return await base.apply(this,args)}finally{active--;hide()}}}
W.addEventListener('pagehide',()=>{W.LDM_ATTENDANCE412?.stop?.();W.ldmCancelIdReads?.()});
W.LDM_PORTAL451={hide};
})();
