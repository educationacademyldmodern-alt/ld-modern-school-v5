/* V60 - session/navigation reliability + smart admit tracking */
(function(){
'use strict';
const $id=id=>document.getElementById(id);
const safeToast=m=>{try{window.toast?.(m)}catch(_){}};
const keyOf=s=>String(s?.student_id||s?.admission_no||'').trim();
const state={issues:new Map(), restoring:false};

/* Keep ERP state on refresh. Never sign out on browser/mobile Back. */
function erpVisible(){const e=$id('erp');return !!(e&&!e.classList.contains('hidden'));}
function remember(route){try{localStorage.setItem('ld_erp_open','1');if(route)localStorage.setItem('ld_erp_route',route)}catch(_){}}
function forget(){try{localStorage.removeItem('ld_erp_open');localStorage.removeItem('ld_erp_route')}catch(_){}}
function routeFromState(){try{return localStorage.getItem('ld_erp_route')||'dashboard'}catch(_){return'dashboard'}}
async function restore(){
 if(state.restoring||!window.sb)return; state.restoring=true;
 try{
   const {data}=await sb.auth.getSession(); const session=data?.session;
   if(!session?.user)return;
   window.user=session.user;
   if(typeof window.loadProfile==='function')await window.loadProfile();
   if(localStorage.getItem('ld_erp_open')==='1'){
     await window.openERP?.();
     const r=routeFromState(); if(erpVisible()&&r&&r!=='dashboard')await window.render?.(r);
   }
 }catch(e){console.warn('V60 restore',e)}finally{state.restoring=false}
}
function installSessionHooks(){
 if(window.__v60SessionHooks)return;window.__v60SessionHooks=true;
 const oldOpen=window.openERP;if(typeof oldOpen==='function')window.openERP=function(){const r=oldOpen.apply(this,arguments);remember(routeFromState());return r};
 const oldRender=window.render;if(typeof oldRender==='function')window.render=function(route){remember(route||'dashboard');return oldRender.apply(this,arguments)};
 const oldLogout=window.logout;if(typeof oldLogout==='function')window.logout=async function(){forget();return oldLogout.apply(this,arguments)};
 // Capture first so older popstate handlers cannot turn Back into logout/public-login navigation.
 window.addEventListener('popstate',function(ev){
   if(!erpVisible())return;
   ev.stopImmediatePropagation();
   const current=routeFromState();
   if(current!=='dashboard'){window.render?.('dashboard');remember('dashboard');}
   try{history.pushState({ldERP:1},'',location.href)}catch(_){ }
 },true);
 try{history.pushState({ldERP:1},'',location.href)}catch(_){ }
 restore();
}

/* Smart Admit Card issue tracking. Preview/print alone does NOT create first issue. */
async function loadIssues(){
 state.issues.clear(); if(!window.v69CurrentExam?.id)return;
 try{const {data,error}=await sb.from('v60_admit_issues').select('*').eq('exam_id',v69CurrentExam.id);if(error)throw error;(data||[]).forEach(x=>state.issues.set(String(x.student_key),x));}
 catch(e){console.warn('V60 admit tracking',e)}
}
function selected(){try{return window.v69SelectedStudents?.()||[]}catch(_){return[]}}
function injectTracking(){
 const body=$id('v69CandidateBody');if(!body||!Array.isArray(window.v69Candidates))return;
 const total=v69Candidates.length, issued=v69Candidates.filter(s=>state.issues.has(keyOf(s))).length;
 const blocked=v69Candidates.filter(s=>s.is_withheld).length, pending=Math.max(0,total-issued);
 let bar=$id('v60AdmitTrack');if(!bar){bar=document.createElement('div');bar.id='v60AdmitTrack';bar.className='v60Track';body.prepend(bar)}
 bar.innerHTML=`<div class="v60Stats"><b>Total ${total}</b><span class="ok">Issued ${issued}</span><span class="wait">Not Issued ${pending}</span><span class="bad">Fee Blocked ${blocked}</span></div><div class="v60Actions"><button onclick="v60MarkSelectedIssued()">✓ Mark Selected Issued</button><button onclick="v60RefreshAdmitTracking()">↻ Refresh Status</button></div>`;
 const rows=body.querySelectorAll('table tr');v69Candidates.forEach((s,i)=>{const row=rows[i+1];if(!row)return;const cell=row.children[1];if(!cell)return;let old=cell.querySelector('.v60Issue');if(old)old.remove();const issue=state.issues.get(keyOf(s));const tag=document.createElement('small');tag.className='cellSub v60Issue';tag.textContent=issue?`🟢 ISSUED • ${new Date(issue.issued_at).toLocaleString('en-IN')}`:'🟠 NOT ISSUED';cell.appendChild(tag)});
}
window.v60RefreshAdmitTracking=async function(){await loadIssues();injectTracking()};
window.v60MarkSelectedIssued=async function(){
 if(!window.v69CurrentExam?.id)return safeToast('Exam select करें');const ss=selected();if(!ss.length)return safeToast('Students select करें');
 const rows=ss.map(s=>({exam_id:v69CurrentExam.id,student_key:keyOf(s),student_name:s.student_name||null,class_name:s.class_name||null,admission_no:s.admission_no||null,issued_by:window.user?.id||null,issued_at:new Date().toISOString(),issue_status:s.is_withheld?'override_issued':'issued'})).filter(x=>x.student_key);
 if(!rows.length)return safeToast('Student identity missing');
 const {error}=await sb.from('v60_admit_issues').upsert(rows,{onConflict:'exam_id,student_key'});if(error)return safeToast(error.message+' • V60 SQL run करें');
 await sb.from('v60_admit_issue_history').insert(rows.map(x=>({exam_id:x.exam_id,student_key:x.student_key,action:'ISSUED',action_by:x.issued_by,action_at:x.issued_at})));
 safeToast(`${rows.length} Admit Card Issued marked`);await v60RefreshAdmitTracking();
};
function installAdmitHooks(){
 if(window.__v60AdmitHooks)return;window.__v60AdmitHooks=true;
 const oldLoad=window.v69LoadCandidates;if(typeof oldLoad==='function')window.v69LoadCandidates=async function(){const r=await oldLoad.apply(this,arguments);await loadIssues();injectTracking();return r};
 const oldRender=window.v69RenderCandidates;if(typeof oldRender==='function')window.v69RenderCandidates=function(){const r=oldRender.apply(this,arguments);setTimeout(injectTracking,0);return r};
 const oldPrint=window.v69PrintAdmitCards;if(typeof oldPrint==='function')window.v69PrintAdmitCards=function(){const ss=selected();const r=oldPrint.apply(this,arguments);if(window.v69CurrentExam?.id&&ss.length){const now=new Date().toISOString();const hist=ss.filter(s=>state.issues.has(keyOf(s))).map(s=>({exam_id:v69CurrentExam.id,student_key:keyOf(s),action:'REPRINT',action_by:window.user?.id||null,action_at:now}));if(hist.length)sb.from('v60_admit_issue_history').insert(hist).then(()=>{}).catch(()=>{})}return r};
}
function install(){installSessionHooks();installAdmitHooks()}
document.addEventListener('DOMContentLoaded',()=>setTimeout(install,650));window.addEventListener('load',()=>setTimeout(install,850));
})();
