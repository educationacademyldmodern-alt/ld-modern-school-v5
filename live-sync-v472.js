/* V490: cross-device invalidation with targeted dashboard refresh. No table payloads, polling, or idle/background channel. */
(()=>{'use strict';
const W=window,D=document,TOPIC='ldm-office-sync-v489',EVENT='data_changed';
let channel=null,subscribing=null,ready=false,origin='';const pending=new Set(),lastApplied={attendance:0,fees:0};
try{origin=sessionStorage.getItem('ldm_sync_origin_v489')||crypto.randomUUID();sessionStorage.setItem('ldm_sync_origin_v489',origin)}catch(_){origin=String(Math.random()).slice(2)}
const q=id=>D.getElementById(id),db=()=>W.sb||(typeof sb!=='undefined'?sb:null),actor=()=>W.user||(typeof user!=='undefined'?user:null),profileNow=()=>W.profile||(typeof profile!=='undefined'?profile:null),schoolNow=()=>W.school||(typeof school!=='undefined'?school:null),route=()=>String(W.__v90Route||W.page||'dashboard');
const role=()=>String(profileNow()?.role||'').trim().toLowerCase(),session=()=>String(schoolNow()?.academic_session||'2026-27');
const authorized=()=>!!actor()?.id&&['admin','super_admin','principal','teacher'].includes(role());
const visible=()=>D.visibilityState==='visible'&&!!q('erp')&&!q('erp').classList.contains('hidden')&&authorized();
const norm=k=>/attend/i.test(String(k||''))?'attendance':/fee|payment|due|receipt/i.test(String(k||''))?'fees':'';
function stats(){return {active:!!channel,topic:TOPIC,polling:false,background:false,pending:[...pending]}}
async function stop(){const c=channel;channel=null;subscribing=null;ready=false;if(c){try{await db()?.removeChannel(c)}catch(_){}}return true}
function safeToRefresh(kind){if(D.querySelector('dialog.w470Dialog[open]'))return false;const roots=kind==='attendance'?[q('attendanceSheet')?.querySelector('tr[data-att-index]')?.closest('table'),q('x320Rows')]:[q('v75MFFull'),q('w470Root')];for(const root of roots.filter(Boolean)){const active=D.activeElement;if(active&&root.contains(active)&&/^(INPUT|SELECT|TEXTAREA)$/.test(active.tagName))return false;for(const e of root.querySelectorAll(kind==='attendance'?'input[data-mark],tr[data-att-index] input,tr[data-att-index] select':'input,textarea,select')){if(e.type==='checkbox'||e.type==='radio'){if(e.checked!==e.defaultChecked)return false}else if(e.tagName==='SELECT'){if([...e.options].some(o=>o.selected!==o.defaultSelected))return false}else if(e.value!==e.defaultValue)return false}}return true}
function hint(text){let n=q('ldmLiveSyncHint489');if(!n){n=D.createElement('div');n.id='ldmLiveSyncHint489';n.setAttribute('role','status');n.style.cssText='position:fixed;z-index:9998;bottom:12px;right:12px;max-width:min(390px,calc(100vw - 24px));padding:9px 13px;border-radius:9px;background:#173f53;color:white;font:600 13px/1.4 system-ui;box-shadow:0 3px 16px #0003';D.body.append(n)}n.textContent=text;n.hidden=false;clearTimeout(n._hide);n._hide=setTimeout(()=>{n.hidden=true},7000)}
async function refresh(kind){if(!visible())return false;if(!safeToRefresh(kind)){hint(kind==='attendance'?'दूसरे device पर Attendance बदली है। अपने खुले बदलाव Save/रद्द करें; फिर Refresh करें।':'दूसरे device पर Fee बदली है। अपने खुले बदलाव Save/रद्द करें; फिर Refresh करें।');return false;}const now=Date.now();if(now-(lastApplied[kind]||0)<1200)return false;lastApplied[kind]=now;
 const r=route(),admin=['admin','super_admin','principal'].includes(role());
 if(r==='dashboard'){
  // Keep the dashboard DOM/layout intact. Admin uses its existing targeted data refresh.
  if(admin&&typeof W.ldmRefreshDashboardOnce==='function'){
   try{const ok=await W.ldmRefreshDashboardOnce({force:true,reason:'cross-device-'+kind});if(ok)return true}catch(_){}
  }
  try{sessionStorage.setItem('ldm_dashboard_dirty',String(Date.now()));sessionStorage.setItem('ldm_dashboard_dirty_kind',kind)}catch(_){}
  hint('दूसरे device पर '+(kind==='fees'?'Fee':'Attendance')+' अपडेट हुई। Dashboard layout सुरक्षित रखा; जरूरत पर Refresh दबाएँ।');return false;
 }
 if(kind==='attendance'){
  if(q('attendanceSheet')&&typeof W.loadAttendanceClass==='function'){
   if(W.LDM_ROOT?.hasUnsavedAttendance?.()){hint('दूसरे device पर Attendance बदली है। पहले अपने खुले बदलाव Save या रद्द करें; फिर सूची ताज़ा करें।');return false}
   await W.loadAttendanceClass();return true
  }
  if(q('x320Center')&&q('x320Load')&&W.LDM_EXAM?.canNavigate?.()!==false&&!q('scan412')){q('x320Load').click();return true}
  if(q('scan412'))return false;
 }
 if(kind==='fees'){
  const s=W.v75MFStudent;
  if(q('v75MFFull')&&s?.id){if(!safeToRefresh('fees')){hint('दूसरे device पर Fee बदली है। खुले बदलाव Save/रद्द करें; फिर Fee सूची ताज़ा करें।');return false}await W.v75MFOpen?.(s.id);return true}
  if(/fee|fees|due|collection|account/i.test(r)&&safeToRefresh('fees')){await W.render?.(r,true);return true}
 }
 // Unopened modules read the canonical server data when next opened; mark current dashboard data stale.
 try{sessionStorage.setItem('ldm_dashboard_dirty',String(Date.now()));sessionStorage.setItem('ldm_dashboard_dirty_kind',kind)}catch(_){}
 return !!admin;
}
let refreshTimer=0;
function receive(payload){if(!payload||payload.origin===origin||!['attendance','fees'].includes(payload.kind)||String(payload.session||'')!==session())return;const kind=payload.kind;try{sessionStorage.setItem('ldm_dashboard_dirty',String(Date.now()));sessionStorage.setItem('ldm_dashboard_dirty_kind',kind)}catch(_){}clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>{void refresh(kind)},800)}
async function start(){if(!visible())return stop();const c=db();if(!c?.channel)return false;if(channel||subscribing)return subscribing||true;
 const ch=c.channel(TOPIC,{config:{private:true,broadcast:{self:false}}});ch.on('broadcast',{event:EVENT},msg=>receive(msg?.payload));channel=ch;
 subscribing=Promise.resolve(ch.subscribe(status=>{if(status==='SUBSCRIBED'){ready=true;for(const kind of pending)send(kind);pending.clear();try{sessionStorage.setItem('ldm_sync_ready_v489','1')}catch(_){}}else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){ready=false;try{sessionStorage.removeItem('ldm_sync_ready_v489')}catch(_){};if(channel===ch){channel=null;subscribing=null;try{c.removeChannel(ch)}catch(_){}}}})).catch(()=>{if(channel===ch){channel=null;subscribing=null}}).finally(()=>{if(channel===ch)subscribing=null});return subscribing
}
async function send(kind){if(!['attendance','fees'].includes(kind))return false;if(!visible())return false;if(!channel||!ready){pending.add(kind);void start();return false}try{const result=await channel.send({type:'broadcast',event:EVENT,payload:{kind,session:session(),origin,at:Date.now()}});const ok=result==='ok'||result?.status==='ok';if(!ok)pending.add(kind);return ok}catch(_){pending.add(kind);return false}}
function notify(kind){const k=norm(kind);return k?send(k):false}
function lifecycle(){if(visible())void start();else void stop()}
const nativeDirty=W.ldmMarkDataDirty;if(typeof nativeDirty==='function')W.ldmMarkDataDirty=function(kind,...args){const result=nativeDirty.apply(this,[kind,...args]);if(result!==false)notify(kind);return result};
const nativeBroadcast=W.v58BroadcastUpdate;if(typeof nativeBroadcast==='function')W.v58BroadcastUpdate=function(reason,...args){const result=nativeBroadcast.apply(this,[reason,...args]);notify(reason);return result};
const nativeRender=W.render;if(typeof nativeRender==='function')W.render=async function(...args){const result=await nativeRender.apply(this,args);lifecycle();return result};
D.addEventListener('visibilitychange',lifecycle);W.addEventListener('pagehide',()=>void stop());W.addEventListener('pageshow',lifecycle);D.addEventListener('ldm-scan-closed',()=>{if(pending.size){for(const k of pending)void refresh(k);pending.clear()}});
const erp=q('erp');if(erp)new MutationObserver(lifecycle).observe(erp,{attributes:true,attributeFilter:['class']});
try{db()?.auth?.onAuthStateChange?.(()=>setTimeout(lifecycle,0))}catch(_){}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',lifecycle,{once:true});else lifecycle();
W.LDM_LIVE472={start,stop,notify,flush:async()=>{for(const k of pending)await send(k);pending.clear();return true},probe:async()=>!!channel,stats,version:489};
})();
