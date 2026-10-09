/* L D MODERN EDUCATION ACADEMY — V270 SINGLE RUNTIME OWNER
   Interaction + Surface + Render lifecycle consolidated.
   No polling / realtime / MutationObserver / DB query added. */
(function(){
'use strict';
if(window.__LDM_V270_RUNTIME)return;
window.__LDM_V270_RUNTIME=true;
window.LDM_FINAL_BUILD='V276-FAST-OPEN-2026-10-09';

const q=id=>document.getElementById(id);
const role=()=>String(window.profile?.role||'').trim().toLowerCase();
const admin=()=>['admin','super_admin','principal'].includes(role());
const teacher=()=>role()==='teacher';
const parent=()=>['parent','student'].includes(role());
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const nextFrame=()=>new Promise(r=>requestAnimationFrame(()=>r()));

const S={
  lastSurface:'',
  intent:'',
  seq:0,
  inFlight:new Map(),
  lastCall:new Map(),
  dashboardHTML:{admin:'',teacher:''},
  parentBusy:null,
  signoutBusy:null,
  homeBusy:null,
  backBusy:null
};
window.__ldmV270RuntimeState=S;

(function(){
 if(q('ldm-v270-runtime-style'))return;
 const st=document.createElement('style');st.id='ldm-v270-runtime-style';
 st.textContent=`
 body.ldmSurfacePublic #publicSite,
 body.ldmSurfaceLogin #login,
 body.ldmSurfaceERP #erp,
 body.ldmSurfaceParent #publicSite,
 body.ldmSurfaceParent #publicPageView,
 body.ldmSurfaceParent #parentPortal,
 body.ldmSurfaceParent #parentDashboard,
 body.ldmSurfaceParent #v6422ParentBar{pointer-events:auto!important}
 #erpContent.ldmRuntimeBusy{opacity:1!important}
 #erpContent.ldmRuntimeReady{opacity:1!important}
 #ldmFastOpenLayer{position:fixed;left:50%;top:88px;transform:translateX(-50%);z-index:2147483000;
   display:flex;align-items:center;gap:9px;max-width:min(90vw,420px);padding:10px 14px;border-radius:999px;
   background:rgba(6,47,88,.96);color:#fff;font:800 13px/1.2 system-ui,sans-serif;
   box-shadow:0 8px 24px rgba(0,28,58,.22);pointer-events:none}
 #ldmFastOpenLayer[hidden]{display:none!important}
 #ldmFastOpenLayer .ldmFastDot{width:10px;height:10px;border-radius:50%;background:#54f0bc;
   box-shadow:0 0 0 0 rgba(84,240,188,.5);animation:ldmFastPulse .65s ease-out infinite}
 @keyframes ldmFastPulse{to{box-shadow:0 0 0 9px rgba(84,240,188,0)}}
 @media(prefers-reduced-motion:reduce){#ldmFastOpenLayer .ldmFastDot{animation:none!important}}
 `;
 document.head.appendChild(st);
})();

function fastLayer(){
 let el=q('ldmFastOpenLayer');
 if(!el){
   el=document.createElement('div');el.id='ldmFastOpenLayer';el.hidden=true;
   el.innerHTML='<span class="ldmFastDot"></span><span id="ldmFastOpenText">Opening…</span>';
   document.body.appendChild(el);
 }
 return el;
}
function routeLabel(r){
 const map={dashboard:'Dashboard',assigned_work:'Assigned Work',smart_fee_center:'Fee Center',fee_dashboard:'Fee Dashboard',
 attendance:'Attendance',master_attendance:'Master Attendance',academic_monitor:'Academic Analysis',
 v90_teacher_marks:'Marks',homework:'Homework',v66_programs:'Programs',master_gate_pass:'Gate Pass',
 teacher_notices:'Notices',gallery:'Gallery',my_notes:'Notes',v91_student_photos:'Student Photos'};
 return map[r]||String(r||'Module').replace(/^v\d+_/,'').replace(/_/g,' ').replace(/\b\w/g,x=>x.toUpperCase());
}
function fastStart(r,msg){
 const el=fastLayer(),tx=q('ldmFastOpenText');if(tx)tx.textContent=msg||('Opening '+routeLabel(r)+'…');
 el.hidden=false;
}
function fastStop(){const el=q('ldmFastOpenLayer');if(el)el.hidden=true}
window.ldmFastOpenStart=fastStart;window.ldmFastOpenStop=fastStop;
function roleKey(){return admin()?'admin':teacher()?'teacher':parent()?'parent':role()||'other'}
function routeNow(){
 try{return String(sessionStorage.getItem('ldm_current_route')||window.__v90Route||'dashboard')}
 catch(_e){return String(window.__v90Route||'dashboard')}
}
function surface(){
 const b=document.body;if(!b)return '';
 if(b.classList.contains('ldmSurfaceParent'))return 'parent';
 if(b.classList.contains('ldmSurfaceERP'))return 'erp';
 if(b.classList.contains('ldmSurfaceLogin'))return 'login';
 if(b.classList.contains('ldmSurfaceSetup'))return 'setup';
 if(b.classList.contains('ldmSurfacePublic'))return 'public';
 return '';
}
function show(id){
 const el=q(id);if(!el)return;
 el.classList.remove('hidden');el.removeAttribute('hidden');el.style.pointerEvents='auto';
}
function hide(id){q(id)?.classList.add('hidden')}
function cleanupTransition(){
 try{q('modal')?.classList.add('hidden')}catch(_e){}
 try{q('cameraModal')?.classList.add('hidden')}catch(_e){}
 ['v14Modal','v49RecoveryModal','v64Modal','v187Modal','v227Modal','v131TeacherQrModal'].forEach(id=>{try{q(id)?.remove()}catch(_e){}});
 try{window.closeCamera?.()}catch(_e){}
 try{window.v143StopTeacherQr?.()}catch(_e){}
 try{window.ldmStopFastScan?.()}catch(_e){}
}
function activeRoots(s){
 if(s==='parent')return ['publicSite','publicPageView','parentPortal','parentDashboard'];
 if(s==='erp')return ['erp'];
 if(s==='login')return ['login'];
 if(s==='public')return ['publicSite'];
 if(s==='setup')return ['setup'];
 return [];
}
function reconcile(reason='manual'){
 const s=surface();if(!s)return false;
 if(S.lastSurface&&S.lastSurface!==s)cleanupTransition();
 S.lastSurface=s;
 if(s==='parent'){
   ['publicSite','publicPageView','parentPortal','parentDashboard'].forEach(show);
   hide('parentGate');hide('erp');hide('login');hide('setup');
   document.body.classList.add('v6416ParentOpen');
 }else if(s==='erp'){
   show('erp');hide('parentDashboard');hide('login');hide('setup');document.body.classList.remove('v6416ParentOpen');
 }else if(s==='login'){
   show('login');hide('erp');hide('parentDashboard');hide('setup');document.body.classList.remove('v6416ParentOpen');
 }else if(s==='setup'){
   show('setup');hide('erp');hide('parentDashboard');hide('login');document.body.classList.remove('v6416ParentOpen');
 }else if(s==='public'){
   show('publicSite');hide('erp');hide('parentDashboard');hide('login');hide('setup');document.body.classList.remove('v6416ParentOpen');
 }
 return true;
}
window.ldmReconcileInteractionSurface=reconcile;

function needsRepair(){
 const s=surface();
 return activeRoots(s).some(id=>{
   const el=q(id);if(!el)return false;
   try{const cs=getComputedStyle(el);return el.classList.contains('hidden')||el.hasAttribute('hidden')||cs.pointerEvents==='none'||cs.display==='none'}
   catch(_e){return el.classList.contains('hidden')||el.hasAttribute('hidden')}
 });
}
function host(){return q('erpContent')}
function dashboardReady(){
 const h=host();if(!h)return false;
 if(admin())return !!h.querySelector('.ldmRootAdminDash,.v114AdminDash');
 if(teacher())return !!h.querySelector('.v114TeacherDash,.ldmNewTeacher,.ldmTeacherModules');
 return false;
}
function dedupe(root,sel){
 const a=[...(root||document).querySelectorAll(sel)];if(a.length<=1)return 0;
 let n=0;for(const el of a.slice(1)){try{el.remove();n++}catch(_e){}}
 return n;
}
function cleanupDuplicates(){
 const erp=q('erp'),pd=q('parentDashboard'),h=host();
 if(erp){
   dedupe(erp,'#v90BackBtn');dedupe(erp,'#v90HomeBtn');dedupe(erp,'[id="v233Greeting"]');
   dedupe(erp,'[data-v264-dash]');dedupe(erp,'[data-v267-admin-academic]');dedupe(erp,'[data-v254-teacher-fee]');
 }
 if(pd)dedupe(pd,'#v6422ParentBar');
 if(h&&admin())dedupe(h,'.ldmRootAdminDash');
 if(h&&teacher())dedupe(h,'.v114TeacherDash');
}
function storeDashboard(){
 const h=host(),k=roleKey();if(!h||!dashboardReady()||!['admin','teacher'].includes(k))return false;
 const html=h.innerHTML;if(html.length<250||/Loading\.\.\.|Loading…/i.test(html))return false;
 S.dashboardHTML[k]=html;return true;
}
function restoreDashboard(){
 const h=host(),html=S.dashboardHTML[roleKey()];if(!h||!html)return false;
 h.innerHTML=html;cleanupDuplicates();reconcile('dashboard-restore');return true;
}
function duplicateFast(r){
 const now=Date.now(),last=S.lastCall.get(r)||0;S.lastCall.set(r,now);return now-last<280;
}
function markBusy(){const h=host();if(h){h.classList.add('ldmRuntimeBusy');h.setAttribute('aria-busy','true')}}
function clearBusy(){const h=host();if(h){h.classList.remove('ldmRuntimeBusy');h.removeAttribute('aria-busy')}}
async function settleDashboard(seq){
 await nextFrame();
 if(seq!==S.seq||S.intent!=='dashboard')return;
 cleanupDuplicates();storeDashboard();clearBusy();
 reconcile('dashboard-ready');
}

// Surface owner: one wrapper.
try{
 const base=window.ldmSetSurface;
 if(typeof base==='function'){
   const f=function(){const r=base.apply(this,arguments);reconcile('surface');return r};
   window.ldmSetSurface=f;
 }
}catch(_e){}

// Canonical render owner: one wrapper.
try{
 const base=window.render;
 if(typeof base==='function'){
  const f=async function(route='dashboard'){
   const r=String(route||'dashboard');
   if(r==='dashboard'&&routeNow()==='dashboard'&&dashboardReady()&&!S.inFlight.has('dashboard')){
     cleanupDuplicates();storeDashboard();reconcile('dashboard-reuse');return true;
   }
   if(S.inFlight.has(r))return S.inFlight.get(r);
   if(duplicateFast(r)&&r==='dashboard'&&dashboardReady())return true;

   const seq=++S.seq;S.intent=r;
   if(r!=='dashboard')fastStart(r);
   markBusy();
   const promise=(async()=>{
    try{
      const out=await base.apply(this,arguments);
      if(seq!==S.seq){
        if(S.intent==='dashboard'&&S.dashboardHTML[roleKey()])restoreDashboard();
        return out;
      }
      if(r==='dashboard'&&(admin()||teacher()))await settleDashboard(seq);
      else{cleanupDuplicates();clearBusy();reconcile('route-ready')}
      return out;
    }catch(err){
      if(r==='dashboard'&&!dashboardReady())restoreDashboard();
      clearBusy();reconcile('render-error');throw err;
    }finally{S.inFlight.delete(r);if(seq===S.seq&&r!=='dashboard'){clearBusy();fastStop()}}
   })();
   S.inFlight.set(r,promise);return promise;
  };
  window.render=f;try{render=f}catch(_e){}
 }
}catch(_e){}

// Home owner.
try{
 const base=window.v90GoHome;
 if(typeof base==='function'){
  const f=async function(){
   if(S.homeBusy)return S.homeBusy;
   S.homeBusy=(async()=>{try{
     if(routeNow()==='dashboard'&&dashboardReady()){cleanupDuplicates();storeDashboard();window.scrollTo?.(0,0);return true}
     return await base.apply(this,arguments);
   }finally{S.homeBusy=null}})();
   return S.homeBusy;
  };
  window.v90GoHome=f;window.erpGoHome=f;try{v90GoHome=f}catch(_e){}
 }
}catch(_e){}

// Back owner.
try{
 const base=window.v90Back;
 if(typeof base==='function'){
  const f=async function(){
   if(S.backBusy)return S.backBusy;
   S.backBusy=Promise.resolve(base.apply(this,arguments)).finally(()=>{S.backBusy=null});
   return S.backBusy;
  };
  window.v90Back=f;
 }
}catch(_e){}

// Parent portal owner: interaction repair + duplicate-load prevention in ONE wrapper.
try{
 const base=window.loadParentPortal;
 if(typeof base==='function'){
  const f=async function(){
   if(S.parentBusy)return S.parentBusy;
   reconcile('parent-before-load');
   S.parentBusy=(async()=>{try{
     const out=await base.apply(this,arguments);
     await nextFrame();cleanupDuplicates();reconcile('parent-after-load');
     try{window.ldmDecorateSortableTables?.()}catch(_e){}
     return out;
   }finally{S.parentBusy=null}})();
   return S.parentBusy;
  };
  window.loadParentPortal=f;try{loadParentPortal=f}catch(_e){}
 }
}catch(_e){}

try{
 const base=window.parentSignOut;
 if(typeof base==='function'){
  const f=async function(){
   if(S.signoutBusy)return S.signoutBusy;
   S.signoutBusy=Promise.resolve(base.apply(this,arguments)).finally(()=>{S.signoutBusy=null});
   return S.signoutBusy;
  };
  window.parentSignOut=f;try{parentSignOut=f}catch(_e){}
 }
}catch(_e){}

for(const name of ['openERP','parentPasswordLogin','login']){
 try{
   const base=window[name];
   if(typeof base!=='function')continue;
   window[name]=async function(){const out=await base.apply(this,arguments);reconcile(name+'-ready');return out};
 }catch(_e){}
}

function health(){
 if(needsRepair())reconcile('health-repair');
 cleanupDuplicates();
 if(routeNow()==='dashboard')storeDashboard();
}
window.addEventListener('pageshow',health,{passive:true});
window.addEventListener('focus',()=>{if(needsRepair())reconcile('focus')},{passive:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&needsRepair())reconcile('visible')},{passive:true});
document.addEventListener('pointerdown',()=>{if(needsRepair())reconcile('pointer')},{capture:true,passive:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',health,{once:true,passive:true});else health();

window.ldmRuntimeAudit=function(){
 return{
  build:'V276-FAST-OPEN-2026-10-09',
  surface:surface(),role:roleKey(),route:routeNow(),intent:S.intent,
  inFlight:[...S.inFlight.keys()],dashboardReady:dashboardReady(),
  dashboardCacheBytes:(S.dashboardHTML[roleKey()]||'').length,
  polling:false,realtime:false,mutationObserver:false,dbCallsAdded:0
 };
};
window.LDM_V270_RUNTIME=Object.freeze({
 singleRuntimeOwner:true,
 singleParentLoaderWrapper:true,
 canonicalRenderOwner:true,
 activeSurfaceRepair:true,
 homeBackDedup:true,
 dashboardLastGood:true,
 polling:false,realtime:false,mutationObserver:false,dbCallsAdded:0
});
})();
