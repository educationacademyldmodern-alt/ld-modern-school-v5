
(function(){
'use strict';
if(window.__LDM_V288_AUTH_ROOT)return;
window.__LDM_V288_AUTH_ROOT=true;

const BUILD='V288-AUTH-ROOT-DIAGNOSTIC-2026-10-12';
window.LDM_V288_AUTH=Object.freeze({
  build:BUILD,
  canonicalOwner:true,
  previewPasswordAllowed:true,
  noNewUserSystem:true,
  noPolling:true,
  noRealtime:true,
  noMutationObserver:true
});

const q=(id)=>document.getElementById(id);
const roleKey=()=>String(window.profile?.role||'').trim().toLowerCase();
const online=()=>navigator.onLine!==false;
const isPreview=()=>/\.vercel\.app$/i.test(location.hostname)&&!/^(www\.)?(myldm\.com|ldmoderneducationacademy\.)/i.test(location.hostname);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

function stageName(e){
  const msg=String(e?.message||e||'').toLowerCase();
  if(msg.includes('invalid login credentials'))return 'AUTH_CREDENTIALS';
  if(msg.includes('failed to fetch')||msg.includes('network')||msg.includes('connection'))return 'NETWORK';
  if(msg.includes('profile'))return 'PROFILE';
  if(msg.includes('permission')||msg.includes('rls')||msg.includes('row-level'))return 'RLS_PERMISSION';
  if(msg.includes('teacher'))return 'TEACHER_MAPPING';
  if(msg.includes('parent')||msg.includes('student'))return 'PARENT_MAPPING';
  return 'AUTH_UNKNOWN';
}
function humanError(e,who='Login'){
  let m=String(e?.message||e||'').trim();
  if(/invalid login credentials/i.test(m))return 'ID / Mobile / Email या Password सही नहीं है।';
  if(/email not confirmed/i.test(m))return 'Account email अभी confirm/active नहीं है। Admin से check करें।';
  if(/failed to fetch|network|connection|fetch failed/i.test(m))return 'Network / Supabase connection नहीं हो पा रहा। Internet और Preview deployment check करें।';
  if(/rate limit|too many requests/i.test(m))return 'बहुत अधिक login प्रयास हुए। थोड़ी देर बाद दोबारा प्रयास करें।';
  if(/jwt|token/i.test(m))return 'Session/token problem मिला। Logout/clear session के बाद फिर login करें।';
  return `${who}: ${m||'Unknown authentication error'}`;
}
function diagObject(kind,stage,error,extra={}){
  return {
    build:BUILD,
    kind,
    stage,
    preview:isPreview(),
    host:location.hostname,
    https:location.protocol==='https:',
    online:online(),
    supabaseClient:!!window.sb,
    supabaseConfigured:!!(window.cfg?.url&&window.cfg?.key),
    supabaseHost:(()=>{try{return new URL(window.cfg?.url||'').hostname}catch(_e){return ''}})(),
    role:roleKey()||null,
    user:window.user?.id?'authenticated':null,
    error:String(error?.message||error||''),
    ...extra
  };
}
function statusHost(kind){
  if(kind==='admin')return document.querySelector('#login .authCard')||q('login');
  if(kind==='teacher')return q('teacherAuthBox')||document.querySelector('.v14ModalCard');
  return q('parentGate')||q('parentPortal');
}
function ensureStatus(kind){
  const host=statusHost(kind);
  if(!host)return null;
  const id='v288AuthStatus_'+kind;
  let box=q(id);
  if(!box){
    box=document.createElement('div');
    box.id=id;
    box.className='v288AuthStatus';
    host.appendChild(box);
  }
  return box;
}
function show(kind,msg,state='info',diag=null){
  const box=ensureStatus(kind);
  if(!box){try{window.toast?.(msg)}catch(_e){};return}
  box.className='v288AuthStatus '+state;
  const d=diag?`<details><summary>Technical Details</summary><pre>${esc(JSON.stringify(diag,null,2))}</pre><button type="button" class="v288CopyDiag">Copy Diagnostic</button></details>`:'';
  box.innerHTML=`<b>${esc(msg)}</b>${d}`;
  box.querySelector('.v288CopyDiag')?.addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(JSON.stringify(diag,null,2));window.toast?.('Diagnostic copied')}catch(_e){}
  });
}
function timeout(p,ms=15000,label='Request'){
  let t;
  const x=new Promise((_,rej)=>{t=setTimeout(()=>rej(new Error(label+' timeout after '+Math.round(ms/1000)+'s')),ms)});
  return Promise.race([Promise.resolve(p).finally(()=>clearTimeout(t)),x]);
}
async function ensureClient(){
  if(!window.sb && typeof window.init==='function')window.init();
  if(!window.sb)throw new Error('Supabase client initialize नहीं हुआ');
  if(!window.cfg?.url||!window.cfg?.key)throw new Error('School cloud configuration missing');
  return window.sb;
}
async function directEmail(email,password){
  await ensureClient();
  return timeout(window.sb.auth.signInWithPassword({email:String(email).toLowerCase(),password}),15000,'Supabase login');
}
async function directPhone(phone,password){
  await ensureClient();
  return timeout(window.sb.auth.signInWithPassword({phone,password}),15000,'Supabase phone login');
}
function digits10(raw){
  const d=String(raw||'').replace(/\D/g,'');
  return d.length>=10?d.slice(-10):'';
}
function internalStudent(raw){
  const code=String(raw||'').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,48);
  return code?`s${code}@student.ldmodern.local`:'';
}
async function resolveLegacyEmail(raw,role){
  if(typeof window.v32ResolveEmail==='function'){
    try{
      return await timeout(window.v32ResolveEmail(raw,role),8000,'Login ID lookup');
    }catch(_e){}
  }
  return null;
}
async function signInCanonical(identifier,password,kind){
  const raw=String(identifier||'').trim();
  if(!raw||!password)throw new Error('Login ID और Password जरूरी है');
  await ensureClient();

  // Email is always direct and never requires a pre-login database lookup.
  if(raw.includes('@')){
    const r=await directEmail(raw,password);
    if(r.error)throw r.error;
    return {result:r,method:'email-direct'};
  }

  const d=digits10(raw);
  const attempts=[];

  if(kind==='teacher' && d){
    attempts.push({name:'teacher-internal',email:`t${d}@teacher.ldmodern.local`});
    const legacy=await resolveLegacyEmail(d,'teacher');
    if(legacy && !attempts.some(x=>x.email===legacy))attempts.push({name:'teacher-mapped',email:legacy});
  }else if(kind==='parent'){
    if(d){
      attempts.push({name:'parent-internal',email:`p${d}@parent.ldmodern.local`});
      const legacy=await resolveLegacyEmail(d,'parent');
      if(legacy && !attempts.some(x=>x.email===legacy))attempts.push({name:'parent-mapped',email:legacy});
      const st=internalStudent(raw);
      if(st)attempts.push({name:'student-id-fallback',email:st});
    }else{
      const st=internalStudent(raw);
      if(st)attempts.push({name:'student-admission',email:st});
    }
  }else if(kind==='admin'){
    if(d){
      const legacy=await resolveLegacyEmail(d,'admin');
      if(legacy)attempts.push({name:'staff-mapped',email:legacy});
    }
  }

  let lastErr=null;
  for(const a of attempts){
    try{
      const r=await directEmail(a.email,password);
      if(!r.error)return {result:r,method:a.name};
      lastErr=r.error;
      if(!/invalid login credentials/i.test(String(r.error?.message||'')))break;
    }catch(e){lastErr=e;break}
  }

  // Final mobile-password fallback for accounts genuinely created with phone auth.
  if(d){
    try{
      const phone=(typeof window.normalizePhone==='function'?window.normalizePhone(d):'+91'+d);
      const r=await directPhone(phone,password);
      if(!r.error)return {result:r,method:'phone-direct'};
      lastErr=r.error;
    }catch(e){lastErr=e}
  }
  throw lastErr||new Error('Login account resolve नहीं हुआ');
}
async function loadProfileStrict(){
  if(typeof window.loadProfile!=='function')throw new Error('Profile loader missing');
  await timeout(window.loadProfile(),12000,'Profile load');
  if(!window.profile)throw new Error('Profile नहीं मिला. Users & Roles / Auth mapping check करें.');
  return window.profile;
}
async function cleanFailedAuth(){
  try{await window.sb?.auth?.signOut?.()}catch(_e){}
  window.user=null;window.profile=null;
}
function staffRoleAllowed(r){
  return ['super_admin','admin','principal','admission','accountant','librarian','transport','viewer'].includes(String(r||'').toLowerCase());
}

/* ADMIN / OFFICE canonical final owner */
let adminBusy=false;
window.login=async function(){
  if(adminBusy)return;
  adminBusy=true;
  const id=String(q('email')?.value||'').trim(),password=String(q('password')?.value||'');
  let method='';
  show('admin','Admin login check हो रहा है…','busy',diagObject('admin','START',''));
  try{
    const a=await signInCanonical(id,password,'admin');method=a.method;
    window.user=a.result.data.user;
    await loadProfileStrict();
    const r=roleKey();
    if(!staffRoleAllowed(r))throw new Error(`यह Office/Admin login account नहीं है (role: ${r||'unknown'})`);
    show('admin',`Login verified • ${r}`,'ok',diagObject('admin','SUCCESS','',{method,role:r}));
    if(typeof window.ldmSetSurface==='function')window.ldmSetSurface('erp');
    if(typeof window.openERP!=='function')throw new Error('ERP dashboard opener missing');
    await window.openERP();
  }catch(e){
    const diag=diagObject('admin',stageName(e),e,{method});
    console.error('[V288 Admin Login]',diag);
    await cleanFailedAuth();
    try{window.ldmSetSurface?.('login')}catch(_e){}
    show('admin',humanError(e,'Admin login failed'),'bad',diag);
  }finally{adminBusy=false}
};

/* TEACHER canonical final owner */
let teacherBusy=false;
window.teacherPasswordLogin=async function(){
  if(teacherBusy)return;
  teacherBusy=true;
  const raw=String(q('tLoginId')?.value||'').trim(),password=String(q('tLoginPassword')?.value||'');
  const btn=q('teacherAuthBox')?.querySelector('button[onclick*="teacherPasswordLogin"]');
  if(btn)btn.disabled=true;
  let method='',ctx=null;
  show('teacher','Teacher login check हो रहा है…','busy',diagObject('teacher','START',''));
  try{
    try{
      if(typeof window.portalState127==='function'){
        const ps=await timeout(window.portalState127(),6000,'Portal control');
        if(ps?.teacher_active===false)throw new Error(ps.teacher_message||'Teacher Portal temporarily unavailable');
      }
    }catch(e){
      if(/temporarily unavailable/i.test(String(e?.message||'')))throw e;
      // Portal-control check must never block authentication if its RPC is unavailable.
    }
    const a=await signInCanonical(raw,password,'teacher');method=a.method;
    window.user=a.result.data.user;
    await loadProfileStrict();
    if(roleKey()!=='teacher')throw new Error(`यह Teacher account नहीं है (role: ${roleKey()||'unknown'})`);
    if(typeof window.ldmTeacherMasterContext==='function'){
      ctx=await timeout(window.ldmTeacherMasterContext(),12000,'Teacher mapping');
    }else if(typeof window.v14LoadTeacherContext==='function'){
      ctx=await timeout(window.v14LoadTeacherContext(),12000,'Teacher context');
    }
    if(ctx && ctx.ok===false)throw new Error('Teacher profile/assignment mapping नहीं मिली');
    show('teacher','Teacher login verified','ok',diagObject('teacher','SUCCESS','',{method,classes:(ctx?.classes||[]).length}));
    q('v14Modal')?.remove();
    if(typeof window.ldmSetSurface==='function')window.ldmSetSurface('erp');
    await window.openERP?.();
    if(typeof window.ldmNewTeacherDashboard==='function')await window.ldmNewTeacherDashboard();
  }catch(e){
    const diag=diagObject('teacher',stageName(e),e,{method});
    console.error('[V288 Teacher Login]',diag);
    await cleanFailedAuth();
    show('teacher',humanError(e,'Teacher login failed'),'bad',diag);
  }finally{
    teacherBusy=false;
    if(btn)btn.disabled=false;
  }
};

/* PARENT / STUDENT canonical final owner */
let parentBusy=false;
window.parentPasswordLogin=async function(){
  if(parentBusy)return;
  parentBusy=true;
  const raw=String(q('parentIdentifier')?.value||'').trim(),password=String(q('parentPassword')?.value||'');
  const btn=q('parentGate')?.querySelector('.searchBox>button');
  if(btn){btn.disabled=true;btn.textContent='Checking…'}
  let method='';
  show('parent','Parent / Student login check हो रहा है…','busy',diagObject('parent','START',''));
  try{
    try{
      if(typeof window.portalState127==='function'){
        const ps=await timeout(window.portalState127(),6000,'Portal control');
        if(ps?.parent_active===false)throw new Error(ps.parent_message||'Parent Portal temporarily unavailable');
      }
    }catch(e){
      if(/temporarily unavailable/i.test(String(e?.message||'')))throw e;
    }
    const a=await signInCanonical(raw,password,'parent');method=a.method;
    window.user=a.result.data.user;
    await loadProfileStrict();
    const r=roleKey();
    if(!['parent','student'].includes(r))throw new Error(`यह Parent/Student account नहीं है (role: ${r||'unknown'})`);
    window.parentVerifiedEmail=String(window.user?.email||'').toLowerCase();
    q('parentGate')?.classList.add('hidden');
    q('parentDashboard')?.classList.remove('hidden');
    if(typeof window.ldmSetSurface==='function')window.ldmSetSurface('parent');
    await timeout(window.loadParentPortal?.(),15000,'Parent dashboard');
    show('parent','Parent / Student login verified','ok',diagObject('parent','SUCCESS','',{method,role:r}));
  }catch(e){
    const diag=diagObject('parent',stageName(e),e,{method});
    console.error('[V288 Parent Login]',diag);
    await cleanFailedAuth();
    try{
      if(typeof window.ldmSetSurface==='function')window.ldmSetSurface('public');
      window.showPublicPage?.('parentPortal');
      q('parentGate')?.classList.remove('hidden');
      q('parentDashboard')?.classList.add('hidden');
    }catch(_e){}
    show('parent',humanError(e,'Parent/Student login failed'),'bad',diag);
  }finally{
    parentBusy=false;
    if(btn){btn.disabled=false;btn.textContent='Login'}
  }
};

/* Small non-secret diagnostic for support; no password/token is included. */
window.ldmV288AuthDiagnostic=async function(){
  let session=false;
  try{session=!!(await window.sb?.auth?.getSession?.())?.data?.session}catch(_e){}
  return diagObject('system','MANUAL','',{session,build:BUILD});
};

})();
