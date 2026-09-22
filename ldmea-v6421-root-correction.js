/* LDMEA V64.21 ROOT CORRECTION — authoritative state/navigation/teacher/due-fee runtime */
(function(){
'use strict';
const $x=id=>document.getElementById(id), escx=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const KEY='ldmea_v6421_nav'; let stack=[]; let restoring=false;
function role(){return String(window.profile?.role||'').toLowerCase()}
function save(){try{sessionStorage.setItem(KEY,JSON.stringify({role:role(),current:routeNow(),stack:stack.slice(-30)}))}catch(_){}}
function load(){try{let x=JSON.parse(sessionStorage.getItem(KEY)||'{}');if(x.role===role()&&Array.isArray(x.stack))stack=x.stack.filter(Boolean).slice(-30);return x}catch(_){stack=[];return {}}}
function home(){return role()==='teacher'?'v90_teacher_dashboard':'dashboard'}
function routeNow(){return window.__v6419Route||window.__v90Route||home()}
const baseRender=window.render;
if(typeof baseRender==='function') window.render=async function(route){
  route=String(route||home());
  if(!restoring){let cur=routeNow();if(cur&&cur!==route)stack.push(cur)}
  window.__v6419Route=route;save();
  let r=await baseRender.apply(this,arguments);save();return r;
};
window.ldmeaBack=function(){
  let prev=stack.pop(); while(prev&&prev===routeNow())prev=stack.pop();
  if(!prev)prev=home(); restoring=true; Promise.resolve(window.render(prev)).finally(()=>{restoring=false;save()});
};
function installBack(){document.querySelectorAll('#erp .v75BackBtn').forEach(b=>{b.onclick=e=>{e.preventDefault();e.stopPropagation();ldmeaBack()};b.setAttribute('title','Previous ERP page')})}
document.addEventListener('click',e=>{let b=e.target.closest('#erp .v75BackBtn');if(b){e.preventDefault();e.stopImmediatePropagation();ldmeaBack()}},true);
window.addEventListener('popstate',e=>{if(!$x('erp')?.classList.contains('hidden')){e.preventDefault();ldmeaBack()}},true);

/* Single teacher credential path: Admin-created mobile maps to deterministic internal auth email. */
window.teacherPasswordLogin=async function(){
 let id=String($x('tLoginId')?.value||'').trim(),password=String($x('tLoginPassword')?.value||'');
 if(!id||!password)return toast('Mobile और Password डालें');
 let digits=id.replace(/\D/g,'').slice(-10), email=id.includes('@')?id.toLowerCase():(digits.length===10?`t${digits}@teacher.ldmodern.local`:'');
 if(!email)return toast('Valid 10 digit Mobile डालें');
 let {data,error}=await sb.auth.signInWithPassword({email,password}); if(error)return toast('Teacher login failed: '+error.message);
 user=data.user; await loadProfile(); await v14LoadTeacherContext();
 let tp=window.v14TeacherProfile, approved=String(tp?.approval_status||'').toLowerCase()==='approved', active=tp?.is_active!==false&&!['inactive','disabled','relieved'].includes(String(tp?.status||'').toLowerCase());
 if(role()!=='teacher'||!tp||!approved||!active){await sb.auth.signOut();user=null;return toast(!tp?'Teacher identity mapping नहीं मिला. Admin → Teacher Login Manager से account verify करें.':!approved?'Teacher account approved नहीं है.':'Teacher account inactive है.')}
 try{let a=await sb.from('teacher_class_assignments').select('id').eq('teacher_profile_id',tp.id).eq('is_active',true).limit(1);window.__v6419TeacherHasAssignment=!!a.data?.length}catch(_){ }
 if(!window.__v6419TeacherHasAssignment){await sb.auth.signOut();user=null;return toast('Teacher login valid है, लेकिन active class assignment नहीं मिला. Admin → Teacher Login Manager में class assign करें.')} $x('v14Modal')?.remove(); stack=[]; window.__v6419Route='v90_teacher_dashboard';save(); openERP(); setTimeout(()=>window.render('v90_teacher_dashboard'),0);
};
window.teacherPasswordRegistrationForm=function(){let h=$x('teacherAuthBox');if(h)h.innerHTML='<div class="v93Rule"><b>Teacher self-registration बंद है.</b><br>Admin → Teachers/Staff → Teacher Login Manager से Teacher ID, classes और initial password बनाएं.</div>'};

/* Due Fee Master: reads authoritative schedules/fees; never creates a parallel due database. */
window.ldmeaDueFeeMaster=async function(){
 if(typeof v14Accounting==='function'&&!v14Accounting())return toast('Permission denied');
 if(typeof head==='function')head('💰 Due Fee Master','Class → Till Month → Authoritative Fee Ledger');
 let host=$x('erpContent'); if(!host)return;
 let now=new Date(), ym=now.toISOString().slice(0,7);
 host.innerHTML=`<div class="panel"><div class="panelHead"><div><h3>Due Fee Master</h3><p class="note">Central Fee Ledger source of truth • paid amount दोबारा due नहीं बनेगा</p></div></div><div class="tools"><label>Class <select id="v6419DueClass"><option value="">Select Class</option>${(window.cls||[]).map(c=>`<option>${escx(c)}</option>`).join('')}</select></label><label>Till Month <input id="v6419Till" type="month" value="${ym}"></label><button class="primary" onclick="v6419LoadDueMaster()">Load Students</button></div><div id="v6419DueBody" class="empty">Class चुनें.</div></div>`;
 $x('v6419DueClass').onchange=window.v6419LoadDueMaster; $x('v6419Till').onchange=window.v6419LoadDueMaster;
};
window.v6419LoadDueMaster=async function(){
 let c=$x('v6419DueClass')?.value||'', till=$x('v6419Till')?.value||''; if(!c)return;
 let body=$x('v6419DueBody'); body.innerHTML='Loading...';
 let sr=await sb.from('students').select('id,admission_no,student_name,father_name,class_name').eq('class_name',c).order('student_name'); if(sr.error)return body.innerHTML=escx(sr.error.message);
 let students=sr.data||[], ad=students.map(s=>s.admission_no).filter(Boolean); if(!ad.length)return body.innerHTML='<div class="empty">No students.</div>';
 let end=till?`${till}-31`:'9999-12-31';
 let [sch,fees]=await Promise.all([sb.from('student_fee_schedules').select('admission_no,amount,paid_amount,status,due_date').in('admission_no',ad).lte('due_date',end),sb.from('fees').select('admission_no,due_amount,total_fee,paid_amount,monthly_fee').in('admission_no',ad)]); if(sch.error&&String(sch.error.code||'')!=='42P01')return body.innerHTML=escx(sch.error.message||'Fee schedule load failed'); if(fees.error)return body.innerHTML=escx(fees.error.message||'Fee ledger load failed');
 let sm=new Map(), fm=new Map(); (sch.data||[]).forEach(x=>{let k=String(x.admission_no),v=sm.get(k)||{due:0,monthly:0,inst:0};let out=Math.max(0,Number(x.amount||0)-Number(x.paid_amount||0));if(String(x.status||'').toLowerCase()!=='paid')v.due+=out;v.inst=Math.max(v.inst,Number(x.amount||0));sm.set(k,v)}); (fees.data||[]).forEach(x=>{let k=String(x.admission_no),v=fm.get(k)||{due:0,monthly:0};v.due+=Math.max(0,Number(x.due_amount||0));v.monthly=Math.max(v.monthly,Number(x.monthly_fee||0));fm.set(k,v)});
 let rows=students.map(s=>{let a=sm.get(String(s.admission_no)),f=fm.get(String(s.admission_no))||{};return {...s,_due:a?Number(a.due||0):Number(f.due||0),_monthly:Number(f.monthly||0),_inst:Number(a?.inst||0)}}).sort((a,b)=>b._due-a._due);
 body.innerHTML=`<div class="tableWrap"><table><tr><th>Student Name</th><th>Father Name</th><th>Till Due</th><th>Fixed Monthly Fee</th><th>Installment</th><th>Total Due</th><th>Update</th></tr>${rows.map(s=>`<tr><td><b>${escx(s.student_name)}</b><small class="cellSub">${escx(s.admission_no)}</small></td><td>${escx(s.father_name)}</td><td>${escx(till)}</td><td>${typeof money==='function'?money(s._monthly):s._monthly}</td><td>${typeof money==='function'?money(s._inst):s._inst}</td><td><b>${typeof money==='function'?money(s._due):s._due}</b></td><td><button class="mini edit" onclick="render('smart_fee_center');setTimeout(()=>openStudentFeeAccount('${s.id}'),0)">Open Ledger</button></td></tr>`).join('')}</table></div>`;
};

/* Route integration without replacing existing fee/id-card engines. */
const r2=window.render;
if(typeof r2==='function')window.render=async function(route){if(route==='due_fee_master')return ldmeaDueFeeMaster();return r2.apply(this,arguments)};
function addDueMenu(){document.querySelectorAll('#erpNav').forEach(nav=>{if(!nav.querySelector('[data-v6419-due]')){let b=document.createElement('button');b.dataset.v6419Due='1';b.textContent='💰 Due Fee Master';b.onclick=()=>render('due_fee_master');nav.appendChild(b)}})}

/* Session restore: do not show public/login while a valid session is being resolved. */
async function restore(){
 try{let g=await sb.auth.getSession(),s=g.data?.session;if(!s)return;
   user=s.user;await loadProfile();if(role()==='teacher')await v14LoadTeacherContext();
   if(!profile)return;let nav=load();let target=(nav.role===role()&&nav.current)?nav.current:home();
   restoring=true;openERP();await window.render(target);restoring=false;window.__v6419Route=target;save();
 }catch(_){restoring=false}finally{document.documentElement.classList.add('v6419-ready')}
}
function init(){installBack();addDueMenu();setTimeout(()=>{installBack();addDueMenu()},300);restore()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
