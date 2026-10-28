/* V53 COMPLETE CONSOLIDATION — additive only, V114.2 safe base */
(()=>{
'use strict';
const $id=id=>document.getElementById(id), E=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const phone=v=>String(v||'').replace(/\D/g,'').slice(-10), INR=n=>'₹'+Number(n||0).toLocaleString('en-IN');
window.V53_COMPLETE_BUILD='V53-COMPLETE-CONSOLIDATED-2026-09-19';
function admin(){try{return !!v14Admin()}catch(_){return false}}
function teacher(){try{return typeof role!=='undefined'&&role==='teacher'}catch(_){return false}}
function session(){return school?.academic_session||'2026-27'}

window.v53CompleteHub=function(){if(!admin())return toast('Admin permission required');head('Master Plan','53 Master Plan • Official Reports • Automation • Safe Controls');
$id('erpContent').innerHTML=`<div class="panel"><div class="panelHead"><div><h3>⭐ FINAL MASTER PLAN</h3><p class="note">V114.2 safe production base • existing functions preserved</p></div></div><div class="v53Hub">
<button onclick="finalMasterReports()">📑<b>Master Official Reports</b><small>Daily / Monthly / Session • A4</small></button>
<button onclick="render('data_hub')">⇄<b>Student Data Hub</b><small>Import / Export / Update</small></button>
<button onclick="studentExcelTools()">📊<b>Excel Center</b><small>Added / Updated / Skipped / Error</small></button>
<button onclick="render('smart_fee_center')">💳<b>Master Fee</b><small>Auto due • ledger • receipt</small></button>
<button onclick="dueReminderCenter()">🔔<b>Master Due Fee</b><small>Call • WhatsApp • notice</small></button>
<button onclick="v53TeacherDueAdmin()">👩‍🏫<b>Class Due Fee</b><small>Teacher-wise assigned classes</small></button>
<button onclick="render('attendance')">✅<b>Master Attendance</b><small>Submitted ≠ Absent</small></button>
<button onclick="v53MasterTimetable()">🕐<b>Master Timetable</b><small>Week / bell generator</small></button>
<button onclick="render('teaching_diary')">📚<b>Teaching Updates</b><small>Bell-wise save</small></button>
<button onclick="render('notice_order_center')">📣<b>Official Letters</b><small>Notice / Order / Circular</small></button>
<button onclick="marksheetCenter()">🏆<b>Result / Marksheet</b><small>Preview • A4 • Print</small></button>
<button onclick="idCardCenter()">🪪<b>ID Card Center</b><small>Photo-linked cards</small></button>
<button onclick="render('transport')">🚌<b>Transport</b><small>Route • monthly fee • due</small></button>
<button onclick="downloadSmartBackup()">💾<b>Safe Backup</b><small>Local JSON • no PDF storage</small></button>
</div></div>`};

window.v53MasterTimetable=async function(){if(!admin())return toast('Admin permission required');head('Master Timetable','One setup • whole week • bell-wise');let {data,error}=await sb.from('timetable').select('*').order('day_name').order('period_no');if(error)return toast(error.message);let rows=data||[];$id('erpContent').innerHTML=`<div class="panel"><div class="panelHead"><div><h3>🕐 Master Timetable</h3><p class="note">Existing timetable सुरक्षित है. Bulk generator केवल selected class/teacher/subject के blank periods add करता है.</p></div></div><div class="v53Tools"><input id="v53TTClass" placeholder="Class"><input id="v53TTTeacher" placeholder="Teacher"><input id="v53TTSubject" placeholder="Subject"><input id="v53TTFrom" type="number" min="1" max="12" value="1" title="First bell"><input id="v53TTTo" type="number" min="1" max="12" value="6" title="Last bell"><button class="primary" onclick="v53GenerateWeekTT()">Generate Blank Week</button></div><div class="tableWrap"><table><tr><th>Day</th><th>Bell</th><th>Class</th><th>Subject</th><th>Teacher</th></tr>${rows.map(r=>`<tr><td>${E(r.day_name)}</td><td>${E(r.period_no)}</td><td>${E(r.class_name)}</td><td>${E(r.subject)}</td><td>${E(r.teacher_name)}</td></tr>`).join('')||'<tr><td colspan="5">No timetable rows.</td></tr>'}</table></div></div>`};
// V468: one class/week read; repeated clicks join the same pending generation.
let timetableGeneration468=null;
window.v53GenerateWeekTT=function(){
 if(!admin()||String(window.profile?.status||'active').toLowerCase()!=='active')return toast('Active Admin permission required');
 if(timetableGeneration468)return timetableGeneration468;
 const c=$id('v53TTClass')?.value.trim()||'',t=$id('v53TTTeacher')?.value.trim()||'',s=$id('v53TTSubject')?.value.trim()||'',a=Number($id('v53TTFrom')?.value||1),b=Number($id('v53TTTo')?.value||6);
 if(!c||!t||!s)return toast('Class, Teacher, Subject required');
 if(!Number.isInteger(a)||!Number.isInteger(b)||a<1||b>12||a>b)return toast('Bell range 1–12 के बीच सही भरें');
 const who=window.profile?.id,days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
 const current=()=>window.profile?.id===who&&admin()&&String(window.profile?.status||'active').toLowerCase()==='active';
 const job=Promise.resolve().then(async()=>{
  const q=await sb.from('timetable').select('id,day_name,period_no',{count:'exact'}).eq('class_name',c).in('day_name',days);if(q.error)throw q.error;
  if(!current())return;
  if(!Array.isArray(q.data)||!Number.isInteger(q.count)||q.count!==q.data.length)throw Error('Existing timetable की पूरी पुष्टि नहीं मिली; कोई bell नहीं जोड़ी गई। Class/week report जाँचें।');
  const occupied=new Set(q.data.map(x=>String(x.day_name)+'|'+Number(x.period_no))),ins=[];
  for(const day of days)for(let period=a;period<=b;period++)if(!occupied.has(day+'|'+period))ins.push({day_name:day,period_no:period,class_name:c,teacher_name:t,subject:s});
  if(ins.length){const r=await sb.from('timetable').insert(ins);if(r.error)throw r.error;}
  if(!current())return;
  toast(`${ins.length} blank timetable periods added`);return window.v53MasterTimetable();
 }).catch(e=>{if(current())toast(e.message||String(e))}).finally(()=>{if(timetableGeneration468===job)timetableGeneration468=null});
 timetableGeneration468=job;return job;
};

async function dueRows(classes=[]){
 if(!classes.length)return [];
 let q=sb.from('students').select('id,student_name,admission_no,father_name,phone,class_name,status,academic_session').order('class_name');q=q.in('class_name',classes);let sr=await q;if(sr.error)throw sr.error;
 let ss=(sr.data||[]).filter(x=>!['inactive','deleted','left','withdrawn','trashed','recycled','archived','transferred'].includes(String(x.status||'active').toLowerCase())).filter(x=>!x.academic_session||x.academic_session===session()),adms=ss.map(x=>x.admission_no).filter(Boolean);if(!adms.length)return[];
 if(typeof window.ldmFeeDueSnapshot!=='function')throw Error('Central fee reader unavailable');let snap=await window.ldmFeeDueSnapshot(adms,session()),dm=new Map(snap.map(x=>[String(x.admission_no),x.current_due]));
 return ss.map(x=>{if(!dm.has(String(x.admission_no)))throw Error('Central due incomplete');return {...x,_due:Number(dm.get(String(x.admission_no)))}}).filter(x=>x._due>0);
}

function dueTable(rows){return `<div class="tableWrap"><table><tr><th>Student</th><th>Father</th><th>Class</th><th>Due</th><th>Contact</th></tr>${rows.map(s=>{let p=phone(s.phone),msg=encodeURIComponent(`Dear Parent, ${s.student_name} (${s.class_name}) की कुल school fee ${INR(s._due)} pending है. कृपया विद्यालय में जमा करें. - L D MODERN EDUCATION ACADEMY`);return `<tr><td><b>${E(s.student_name)}</b><small class="cellSub">${E(s.admission_no)}</small></td><td>${E(s.father_name)}</td><td>${E(s.class_name)}</td><td><b>${INR(s._due)}</b></td><td>${p?`<a class="mini call" href="tel:${p}">Call</a> <a class="mini wa" target="_blank" href="https://wa.me/91${p}?text=${msg}">WhatsApp</a>`:'—'}</td></tr>`}).join('')||'<tr><td colspan="5">No due students.</td></tr>'}</table></div>`}
window.v53TeacherDueAdmin=async function(){if(!admin())return toast('Admin permission required');head('Teacher Class Due Fee','Assigned class • Call • WhatsApp');let ar=await sb.from('teacher_class_assignments').select('class_name').eq('is_active',true),cls=[...new Set((ar.data||[]).map(x=>x.class_name).filter(Boolean))];if(ar.error)return toast(ar.error.message);let rows=await dueRows(cls);$id('erpContent').innerHTML=`<div class="panel"><h3>🔔 Due Fee • Assigned Classes</h3>${dueTable(rows)}</div>`};
window.v53TeacherDue=async function(){if(!teacher())return;await v14LoadTeacherContext?.();let tp=window.v14TeacherProfile;if(!tp)return toast('Teacher profile not linked');let ar=await sb.from('teacher_class_assignments').select('class_name').eq('teacher_profile_id',tp.id).eq('is_active',true),cls=[...new Set((ar.data||[]).map(x=>x.class_name).filter(Boolean))];head('My Class Due Fee','Only assigned active classes');if(ar.error)return toast(ar.error.message);let rows=await dueRows(cls);$id('erpContent').innerHTML=`<div class="panel"><h3>🔔 My Classes • Due Fee</h3>${dueTable(rows)}</div>`};

// Add routes without replacing existing behavior.
try{const base=window.render;window.render=function(p){if(p==='v53_complete_hub')return v53CompleteHub();if(p==='v53_master_timetable')return v53MasterTimetable();if(p==='teacher_due_fee')return v53TeacherDue();return base.apply(this,arguments)}}catch(_e){}
function install(){try{if(admin()){let nav=document.querySelector('.sideNav,.erpNav,#erpNav,.sidebar nav,.sidebar');if(nav&&!document.getElementById('v53CompleteNav')){let b=document.createElement('button');b.id='v53CompleteNav';b.innerHTML='⭐ <span>Master Plan</span>';b.onclick=()=>v53CompleteHub();nav.prepend(b)}}if(teacher()){let nav=document.querySelector('.sideNav,.erpNav,#erpNav,.sidebar nav,.sidebar');if(nav&&!document.getElementById('v53TeacherDueNav')){let b=document.createElement('button');b.id='v53TeacherDueNav';b.innerHTML='🔔 <span>My Class Due Fee</span>';b.onclick=()=>v53TeacherDue();nav.appendChild(b)}}}catch(_){}}
document.addEventListener('DOMContentLoaded',()=>setTimeout(install,500));window.addEventListener('load',()=>setTimeout(install,1200));window.LDM_MASTER_PLAN_INSTALL=install;
})();
