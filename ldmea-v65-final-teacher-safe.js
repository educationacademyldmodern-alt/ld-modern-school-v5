/* LDMEA V65 Final Teacher Root Correction — loaded last, no polling. */
(function(){
'use strict';
window.LDMEA_FINAL_BUILD='V65.3-CONFLICT-CLEAN-2026-09-21';
const byId=id=>document.getElementById(id), role=()=>String(window.profile?.role||'').toLowerCase();
const isAdmin=()=>['admin','super_admin'].includes(role());
const safe=v=>typeof window.esc==='function'?window.esc(String(v??'')):String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
function sessionName(){try{return typeof window.v90Session==='function'?window.v90Session():(window.school?.current_session||'2026-27')}catch{return '2026-27'}}
function classList(){try{return Array.isArray(window.cls)?window.cls:[]}catch{return []}}
function status(msg,bad=false){const x=byId('v650TeacherStatus');if(x){x.textContent=msg;x.className='v650Status '+(bad?'bad':'ok')}}
window.v650AddTeacher=async function(){
 if(!isAdmin())return window.toast?.('Admin / Principal only');
 window.__v90Route='teacher_add_final';
 if(typeof window.v90Head==='function')window.v90Head('➕ Add New Teacher','One form • Auto Employee ID • Login Ready • No Approval');
 if(typeof window.v90InstallShell==='function')window.v90InstallShell('teacher_add_final');
 const classes=classList();
 const html=`<div class="v650Page"><div class="v650Intro"><b>Authoritative Teacher Creation</b><span>Teacher data + login + class/subject mapping एक Submit में तैयार होगा. Technical IDs automatic हैं.</span></div><form id="v650TeacherForm" class="v650Form" onsubmit="v650SubmitTeacher(event)">
 <label>Teacher Name *<input id="v650Name" required autocomplete="name"></label><label>Father / Guardian Name<input id="v650Father"></label>
 <label>Mobile / Login ID *<input id="v650Mobile" required inputmode="numeric" maxlength="10" placeholder="10 digit mobile"></label><label>Email (optional)<input id="v650Email" type="email"></label>
 <label>Joining Date<input id="v650Join" type="date"></label><label>Designation<input id="v650Designation" value="Teacher"></label>
 <label class="full">Address<textarea id="v650Address" rows="2"></textarea></label>
 <fieldset class="full"><legend>Assigned Classes *</legend><div class="v650Checks">${classes.map(c=>`<label><input type="checkbox" class="v650Class" value="${safe(c)}"> ${safe(c)}</label>`).join('')||'<span>Class master not loaded; refresh after school data loads.</span>'}</div></fieldset>
 <label>Class Teacher<select id="v650ClassTeacher"><option value="">Not Class Teacher</option>${classes.map(c=>`<option>${safe(c)}</option>`).join('')}</select></label><label>Subjects<input id="v650Subjects" placeholder="English, Mathematics"></label>
 <label class="full">Initial Password *<div class="v650Pw"><input id="v650Password" type="text" minlength="8" required><button type="button" onclick="v650GeneratePassword()">Generate</button></div></label>
 <div class="full v650Actions"><button type="button" onclick="typeof v92Back==='function'?v92Back():render('dashboard')">← Back</button><button class="primary" id="v650Submit" type="submit">✓ Create Teacher & Login</button></div><div id="v650TeacherStatus" class="v650Status full">Success तभी दिखेगा जब account, profile और assignments complete हों.</div></form></div>`;
 if(typeof window.v90Set==='function')window.v90Set(html);else if(byId('erpContent'))byId('erpContent').innerHTML=html;
 v650GeneratePassword();
};
window.v650GeneratePassword=function(){const out=typeof window.v93SuggestedPassword==='function'?window.v93SuggestedPassword('Teacher'):'LdM@'+Math.random().toString(36).slice(2,10)+'9';if(byId('v650Password'))byId('v650Password').value=out};
window.v650SubmitTeacher=async function(ev){ev?.preventDefault();if(!isAdmin())return status('Admin session required',true);const mobile=String(byId('v650Mobile')?.value||'').replace(/\D/g,'').slice(-10),name=String(byId('v650Name')?.value||'').trim(),password=String(byId('v650Password')?.value||''),classes=[...document.querySelectorAll('.v650Class:checked')].map(x=>x.value),subjects=String(byId('v650Subjects')?.value||'').split(',').map(x=>x.trim()).filter(Boolean),ct=byId('v650ClassTeacher')?.value||'';if(!name)return status('Teacher Name required',true);if(mobile.length!==10)return status('Valid 10 digit Mobile required',true);if(password.length<8)return status('Password कम से कम 8 characters का रखें',true);if(!classes.length)return status('कम से कम एक Assigned Class चुनें',true);if(ct&&!classes.includes(ct))return status('Class Teacher वही class हो जो Assigned Classes में selected है',true);const btn=byId('v650Submit');if(btn){btn.disabled=true;btn.textContent='Creating…'}status('Account create और mapping verify हो रही है…');try{const gs=await window.sb.auth.getSession(),token=gs?.data?.session?.access_token;if(!token)throw new Error('Admin session expired. दोबारा login करें.');const body={action:'create_or_update',teacher_name:name,father_name:byId('v650Father')?.value||'',mobile,email:byId('v650Email')?.value||'',address:byId('v650Address')?.value||'',joining_date:byId('v650Join')?.value||null,designation:byId('v650Designation')?.value||'Teacher',password,classes,class_teacher:ct,subjects,academic_session:sessionName()};const r=await fetch('/api/teacher-access',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify(body)}),j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Teacher account creation failed');status(`✓ ${j.teacher_name||name} ready. Login ID: ${j.login_id||mobile}. Teacher अब सीधे login कर सकता है.`);window.toast?.('Teacher account ready');if(btn)btn.textContent='✓ Account Ready'}catch(e){status(e.message||String(e),true);if(btn){btn.disabled=false;btn.textContent='✓ Create Teacher & Login'}}};
// Retire approval UI routes at dispatch level; historical rows remain untouched.
const oldRender=window.render;
if(typeof oldRender==='function')window.render=async function(route='dashboard'){if(['teacher_approval','teacher_approvals','v90_teacher_requests'].includes(String(route)))return window.v650AddTeacher();return oldRender.apply(this,arguments)};
window.teacherApprovalCenter=window.v650AddTeacher;
// Make Teacher Access entry authoritative Add New Teacher without changing other modules.
const oldAccess=window.v93TeacherAccessCenter;
window.v93TeacherAccessCenter=async function(){return window.v650AddTeacher()};
// Login-only: resolve mobile to central internal auth email, then validate active teacher profile.
window.teacherPasswordLogin=async function(){const raw=String(byId('tLoginId')?.value||'').trim(),password=String(byId('tLoginPassword')?.value||'');if(!raw||!password)return window.toast?.('Registered Mobile और Password डालें');try{let email=raw.toLowerCase();if(!raw.includes('@')){const d=raw.replace(/\D/g,'').slice(-10);if(d.length!==10)return window.toast?.('Valid 10 digit Registered Mobile डालें');const rr=await fetch('/api/teacher-access',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'resolve_login',mobile:d})}),rj=await rr.json().catch(()=>({}));if(!rr.ok)throw new Error(rj.error||'Teacher login mapping lookup failed');email=String(rj.email||`t${d}@teacher.ldmodern.local`).toLowerCase()}const a=await window.sb.auth.signInWithPassword({email,password});if(a.error)throw a.error;window.user=a.data.user;await window.loadProfile();await window.v14LoadTeacherContext();if(role()!=='teacher'||!window.v14TeacherProfile){await window.sb.auth.signOut();return window.toast?.('Teacher mapping incomplete है. Admin Teacher Management में account Update करें.')}if(window.v14TeacherProfile.is_active===false){await window.sb.auth.signOut();return window.toast?.('Teacher account inactive है.')}byId('v14Modal')?.remove();window.openERP()}catch(e){window.toast?.('Teacher login: '+(e.message||String(e)))}};
// Replace the expensive body-wide MutationObserver back guard with render-time installation.
try{document.querySelector('#v6422-final-back-guard')?.remove()}catch(_e){}
})();
