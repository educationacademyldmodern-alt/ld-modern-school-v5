/* SOURCE-MIGRATED: v64-2-state-bridge.js */
/* V64.2: expose live lexical state to existing extension modules, without copying it. */
(()=>{'use strict';
 const bindings={
 sb:{get:()=>sb,set:v=>{sb=v}},user:{get:()=>user,set:v=>{user=v}},
 profile:{get:()=>profile,set:v=>{profile=v}},school:{get:()=>school},cls:{get:()=>cls},
 v69CurrentExam:{get:()=>typeof v69CurrentExam==='undefined'?null:v69CurrentExam}
 };
 for(const [key,descriptor] of Object.entries(bindings)){
  const old=Object.getOwnPropertyDescriptor(window,key);
  if(!old||old.configurable)Object.defineProperty(window,key,{...descriptor,configurable:true});
 }
})();


/* SOURCE-MIGRATED: final-master-upgrade.js */
/* FINAL MASTER UPGRADE — official report center + safe print */
(()=>{
 const E=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const D=()=>new Date().toISOString().slice(0,10), money2=n=>'₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2});
 const defs={
  fee:{icon:'💳',title:'Daily Fee Collection',table:'fees',date:'date',cols:[['receipt_no','Receipt No.'],['admission_no','Admission No.'],['student_name','Student'],['class_name','Class'],['fee_head','Fee Head'],['fee_month','Month'],['payment_mode','Mode'],['paid_amount','Amount']],sum:'paid_amount'},
  due:{icon:'🔔',title:'Due Fee Report',table:'fees',date:'due_date',cols:[['admission_no','Admission No.'],['student_name','Student'],['class_name','Class'],['phone','Mobile'],['fee_month','Month'],['due_amount','Due']],sum:'due_amount'},
  student_att:{icon:'✅',title:'Student Attendance',table:'attendance',date:'date',cols:[['admission_no','Admission No.'],['student_name','Student'],['class_name','Class'],['status','Status'],['remark','Remark']]},
  staff_att:{icon:'👩‍🏫',title:'Teacher / Staff Attendance',table:'staff_attendance',date:'date',cols:[['employee_id','Employee ID'],['staff_name','Name'],['status','Status'],['remark','Remark']]},
  admission:{icon:'🎓',title:'Admission Register',table:'admissions',date:'created_at',cols:[['registration_id','Registration ID'],['admission_no','Admission No.'],['student_name','Student'],['father_name','Father'],['class_name','Class'],['phone','Mobile'],['status','Status']]},
  staff:{icon:'🪪',title:'Teacher / Staff Register',table:'staff',date:'created_at',cols:[['employee_id','Employee ID'],['staff_name','Name'],['staff_type','Type'],['designation','Designation'],['subject','Subject'],['phone','Mobile'],['status','Status']]},
  income:{icon:'📈',title:'Income Report',table:'income',date:'date',cols:[['voucher_no','Voucher'],['source','Source'],['description','Description'],['amount','Amount']],sum:'amount'},
  expense:{icon:'📉',title:'Expense Report',table:'expenses',date:'date',cols:[['voucher_no','Voucher'],['category','Category'],['description','Description'],['amount','Amount']],sum:'amount'},
  teaching:{icon:'📚',title:'Daily Teaching Update',table:'teaching_updates',date:'update_date',cols:[['teacher_name','Teacher'],['class_name','Class'],['period_no','Bell'],['subject','Subject'],['lesson_topic','Topic'],['work_done','Work Done'],['homework','Homework']]}
 };
 window.finalMasterReports=async function(){
  if(typeof v14Admin==='function'&&!v14Admin())return toast('Admin permission required');
  head('Master Reports','Official A4 • Preview • Print / PDF • Live database');
  $('erpContent').innerHTML=`<div class="panel"><div class="panelHead"><div><h3>📑 Master Official Reports</h3><p class="note">Report database से live बनेगी; generated PDF Supabase में store नहीं होगी.</p></div></div><div class="fmReportGrid">${Object.entries(defs).map(([k,x])=>`<button onclick="fmOpen('${k}')"><span>${x.icon}</span>${E(x.title)}</button>`).join('')}</div></div>`;
 };
 window.fmOpen=async function(k){let x=defs[k];if(!x)return;head(x.title,'Official Report • A4 Preview');let d=D();$('erpContent').innerHTML=`<div class="panel"><div class="fmFilters"><label>From<input id="fmFrom" type="date" value="${d}"></label><label>To<input id="fmTo" type="date" value="${d}"></label><button class="primary" onclick="fmLoad('${k}')">Generate Report</button><button class="secondary" onclick="finalMasterReports()">← Reports</button></div></div><div id="fmReportHost"></div>`;await fmLoad(k)};
 window.fmLoad=async function(k){let x=defs[k],a=$('fmFrom').value,b=$('fmTo').value,host=$('fmReportHost');host.innerHTML='<div class="panel">Loading official report...</div>';try{let q=sb.from(x.table).select('*');if(x.date){q=q.gte(x.date,a+(x.date==='created_at'?'T00:00:00':'' )).lte(x.date,b+(x.date==='created_at'?'T23:59:59':''));}let {data,error}=await q.limit(5000);if(error)throw error;let rows=data||[];if(k==='due')rows=rows.filter(r=>Number(r.due_amount||0)>0);let total=x.sum?rows.reduce((s,r)=>s+Number(r[x.sum]||0),0):null;let logo=school?.logo_url||'school-logo.png',addr=school?.address||'Gambhiriya Bujurg, Singhapatti, Padrauna, Kushinagar, Uttar Pradesh';host.innerHTML=`<div class="fmPrintActions"><button class="primary" onclick="window.print()">🖨 Print / Save PDF</button><button class="secondary" onclick="fmLoad('${k}')">↻ Refresh</button></div><section id="fmPrintable" class="fmSheet"><div class="fmHead"><img src="${E(logo)}" style="width:52px;height:52px;object-fit:contain;float:left"><h2>${E(school?.school_name||'L D MODERN EDUCATION ACADEMY')}</h2><p>${E(addr)}</p><h3>${E(x.title).toUpperCase()}</h3></div><div class="fmMeta"><b>Period: ${E(a)} to ${E(b)}</b><b>Generated: ${new Date().toLocaleString('en-IN')}</b><b>Records: ${rows.length}</b></div><table class="fmTable"><thead><tr><th>#</th>${x.cols.map(c=>`<th>${E(c[1])}</th>`).join('')}</tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td>${x.cols.map(c=>`<td>${E((c[0]==='amount'||c[0]==='paid_amount'||c[0]==='due_amount')?money2(r[c[0]]):r[c[0]])}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="${x.cols.length+1}">No records found.</td></tr>`}</tbody></table>${total!==null?`<div class="fmTotals">GRAND TOTAL: ${money2(total)}</div>`:''}<div class="fmSigns"><div>Prepared By</div><div>Checked By</div><div>Principal / Director</div></div></section>`;try{await sb.from('report_audit').insert({report_type:k,date_from:a,date_to:b,generated_by:user?.id||null})}catch(_e){}}catch(e){host.innerHTML=`<div class="panel dangerNote">${E(e.message||String(e))}<br><small>Final Master SQL migration run होने के बाद नए report fields उपलब्ध होंगे.</small></div>`}};
 // Wrap the final route, preserving every existing route and design.
 const base=window.render;window.render=function(p){if(p==='reports'||p==='master_reports')return finalMasterReports();return base.apply(this,arguments)};
})();


/* SOURCE-MIGRATED: public-final.js */
(function(){
'use strict';

const DEFAULT_NOTICE='Admissions Open for Session 2026-27 (Nursery to Class 10) | Quality Education for a Better Tomorrow | Building Character, Creating Brighter Futures | Welcome to L D Modern Education Academy';
const DEFAULT_EMAIL='educationacademyldmodern@gmail.com';
const DEFAULT_PHONE='9625688873';
const DEFAULT_ADDRESS='Gambhiriya Bujurg, Singhapatti, Padrauna, Kushinagar, 274304';

function sc(){
  try{ if(typeof school!=='undefined' && school) return school; }catch(_e){}
  return {};
}
function safeText(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function noticeText(){
  const s=sc();
  return String(
    s.latest_information ||
    [s.notice1_enabled!==false?s.notice1_text:'',s.notice2_enabled!==false?s.notice2_text:'',s.notice3_enabled!==false?s.notice3_text:''].filter(Boolean).join('  •  ') ||
    DEFAULT_NOTICE
  ).trim();
}
function publicGo(id){
  try{
    if(id==='home'){
      if(typeof showPublicPage==='function') showPublicPage('home');
      window.scrollTo(0,0);
      return;
    }
    const route=id==='academics'?'facilities':id;
    if(typeof showPublicPage==='function') return showPublicPage(route);
  }catch(e){console.warn('Public nav',e)}
}
window.v1142PublicGo=publicGo;

function hidePublicControls(){
  if(document.body.classList.contains('v1142-erp-active'))return;
  document.querySelectorAll('button,a,[role="button"]').forEach(el=>{
    if(el.closest('#v1142RefPage'))return;
    const t=((el.textContent||'')+' '+(el.title||'')+' '+(el.getAttribute('aria-label')||'')).replace(/\s+/g,' ').trim();
    if(/\bwebsite\s*control\b/i.test(t)||/^control$/i.test(t)){
      el.classList.add('v1142PublicControlHide');
    }
  });
}

function build(){
  const home=document.getElementById('exactHome');
  if(!home || document.getElementById('v1142RefPage')) return;

  const logins=home.querySelector('.v26LoginCards');
  if(!logins) return;

  const s=sc();
  const oldLogo=home.querySelector('.v26Brand img');
  const logo=s.logo_url || oldLogo?.getAttribute('src') || 'school-logo.png';
  const hero='public-hero-reference.webp';
  const name=s.school_name || 'L D MODERN EDUCATION ACADEMY';
  const address=s.address || DEFAULT_ADDRESS;
  const email=s.email || DEFAULT_EMAIL;
  const phone=s.phone || DEFAULT_PHONE;
  const n=noticeText();

  const page=document.createElement('div');
  page.id='v1142RefPage';
  page.innerHTML=`
    <div class="v1142Latest" aria-label="Latest school information">
      <div class="v1142LatestLabel">LATEST</div>
      <div class="v1142LatestViewport">
        <div class="v1142LatestTrack">
          <span>${safeText(n)} &nbsp; • &nbsp;</span>
          <span>${safeText(n)} &nbsp; • &nbsp;</span>
        </div>
      </div>
    </div>

    <header class="v1142Brand">
      <div class="v1142LogoWrap">
        <img class="v1142Logo" src="${safeText(logo)}" alt="School Logo">
      </div>
      <div class="v1142BrandCenter">
        <h1 class="v1142SchoolName">${safeText(name)}</h1>
        <div class="v1142Address">${safeText(address)}</div>
        <div class="v1142Quality">NURSERY TO CLASS 10 &nbsp; • &nbsp; QUALITY EDUCATION FOR A BETTER TOMORROW</div>
      </div>
      <div class="v1142Quote">Education Today<b>A Better Tomorrow</b></div>
    </header>

    <nav class="v1142RefNav" aria-label="Public website navigation">
      <button type="button" data-page="home">Home</button>
      <button type="button" data-page="about">About</button>
      <button type="button" data-page="academics">Academics</button>
      <button type="button" data-page="admission">Admission / Enquiry</button>
      <button type="button" data-page="notices">Notices</button>
      <button type="button" data-page="gallery">Gallery</button>
      <button type="button" data-page="contact">Contact</button>
    </nav>

    <section class="v1142Hero">
      <img src="${hero}" alt="L D Modern Education Academy">
    </section>

    <section class="v1142LoginArea"></section>

    <footer class="v1142RefFooter">
      <div class="v1142RefFootLeft">
        <span>✉ ${safeText(email)}</span>
        <span>☎ ${safeText(phone)}</span>
      </div>
      <div class="v1142RefFootRight">
        <span>© 2026 L D MODERN EDUCATION ACADEMY. All Rights Reserved.</span>
        <b>Founder - Adv Shiv Balak Yadav</b>
      </div>
    </footer>`;

  home.classList.add('v1142FinalBuilt');
  home.appendChild(page);
  page.querySelector('.v1142LoginArea').appendChild(logins);

  page.querySelectorAll('.v1142RefNav button').forEach(b=>{
    b.addEventListener('click',()=>publicGo(b.dataset.page));
  });

  document.body.classList.add('v1142-public-home-active');
  hidePublicControls();
  sync();
}

function sync(){
  const page=document.getElementById('v1142RefPage');
  if(!page)return;
  const s=sc();
  const n=noticeText();
  const spans=page.querySelectorAll('.v1142LatestTrack span');
  spans.forEach(x=>x.textContent=n+'   •   ');
  const logo=page.querySelector('.v1142Logo');
  if(logo && s.logo_url)logo.src=s.logo_url;
  const name=page.querySelector('.v1142SchoolName');
  if(name)name.textContent=s.school_name||'L D MODERN EDUCATION ACADEMY';
  const address=page.querySelector('.v1142Address');
  if(address)address.textContent=s.address||DEFAULT_ADDRESS;
  const foot=page.querySelectorAll('.v1142RefFootLeft span');
  if(foot[0])foot[0].textContent='✉ '+(s.email||DEFAULT_EMAIL);
  if(foot[1])foot[1].textContent='☎ '+(s.phone||DEFAULT_PHONE);
  hidePublicControls();
}

function state(){
  const home=document.getElementById('exactHome');
  const pub=document.getElementById('publicSite');
  const on=!!home && !home.classList.contains('hidden') && !!pub && !pub.classList.contains('hidden');
  document.body.classList.toggle('v1142-public-home-active',on);
  if(on){build();sync()}
}

function hookSchoolRefresh(){
  try{
    if(typeof applySchool==='function' && !applySchool.__v1142Final){
      const base=applySchool;
      const wrapped=function(){
        const r=base.apply(this,arguments);
        setTimeout(sync,0);
        return r;
      };
      wrapped.__v1142Final=true;
      applySchool=wrapped;
    }
  }catch(_e){}
}

function start(){
  build();
  hookSchoolRefresh();
  state();
  [300,900,1800].forEach(ms=>setTimeout(()=>{build();sync();state()},ms));

  document.addEventListener('click',()=>setTimeout(state,0),true);
  window.addEventListener('resize',state,{passive:true});

  const ob=new MutationObserver(()=>state());
  const pub=document.getElementById('publicSite');
  if(pub)ob.observe(pub,{attributes:true,subtree:false,attributeFilter:['class']});
  const home=document.getElementById('exactHome');
  if(home)ob.observe(home,{attributes:true,subtree:false,attributeFilter:['class']});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
})();


/* SOURCE-MIGRATED: final53-complete.js */
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
window.v53GenerateWeekTT=async function(){let c=$id('v53TTClass').value.trim(),t=$id('v53TTTeacher').value.trim(),s=$id('v53TTSubject').value.trim(),a=Number($id('v53TTFrom').value||1),b=Number($id('v53TTTo').value||6);if(!c||!t||!s)return toast('Class, Teacher, Subject required');let days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],ins=[];for(const d of days)for(let p=a;p<=b;p++){let q=await sb.from('timetable').select('id').eq('day_name',d).eq('period_no',p).eq('class_name',c).limit(1);if(!q.data?.length)ins.push({day_name:d,period_no:p,class_name:c,teacher_name:t,subject:s})}if(ins.length){let q=await sb.from('timetable').insert(ins);if(q.error)return toast(q.error.message)}toast(`${ins.length} blank timetable periods added`);v53MasterTimetable()};

async function dueRows(classes=[]){let q=sb.from('students').select('id,student_name,admission_no,father_name,phone,class_name,status').order('class_name');if(classes.length)q=q.in('class_name',classes);let sr=await q;if(sr.error)throw sr.error;let ss=(sr.data||[]).filter(x=>!['inactive','deleted','left','withdrawn'].includes(String(x.status||'active').toLowerCase())),adms=ss.map(x=>x.admission_no).filter(Boolean);if(!adms.length)return[];let fr=await sb.from('student_fee_schedules').select('admission_no,amount,paid_amount,status,due_date').in('admission_no',adms);if(fr.error)throw fr.error;let dm={};(fr.data||[]).forEach(x=>dm[x.admission_no]=(dm[x.admission_no]||0)+Math.max(Number(x.amount||0)-Number(x.paid_amount||0),0));return ss.map(x=>({...x,_due:dm[x.admission_no]||0})).filter(x=>x._due>0)}
function dueTable(rows){return `<div class="tableWrap"><table><tr><th>Student</th><th>Father</th><th>Class</th><th>Due</th><th>Contact</th></tr>${rows.map(s=>{let p=phone(s.phone),msg=encodeURIComponent(`Dear Parent, ${s.student_name} (${s.class_name}) की कुल school fee ${INR(s._due)} pending है. कृपया विद्यालय में जमा करें. - L D MODERN EDUCATION ACADEMY`);return `<tr><td><b>${E(s.student_name)}</b><small class="cellSub">${E(s.admission_no)}</small></td><td>${E(s.father_name)}</td><td>${E(s.class_name)}</td><td><b>${INR(s._due)}</b></td><td>${p?`<a class="mini call" href="tel:${p}">Call</a> <a class="mini wa" target="_blank" href="https://wa.me/91${p}?text=${msg}">WhatsApp</a>`:'—'}</td></tr>`}).join('')||'<tr><td colspan="5">No due students.</td></tr>'}</table></div>`}
window.v53TeacherDueAdmin=async function(){if(!admin())return toast('Admin permission required');head('Teacher Class Due Fee','Assigned class • Call • WhatsApp');let ar=await sb.from('teacher_class_assignments').select('class_name').eq('is_active',true),cls=[...new Set((ar.data||[]).map(x=>x.class_name).filter(Boolean))];let rows=await dueRows(cls);$id('erpContent').innerHTML=`<div class="panel"><h3>🔔 Due Fee • Assigned Classes</h3>${dueTable(rows)}</div>`};
window.v53TeacherDue=async function(){if(!teacher())return;await v14LoadTeacherContext?.();let tp=window.v14TeacherProfile;if(!tp)return toast('Teacher profile not linked');let ar=await sb.from('teacher_class_assignments').select('class_name').eq('teacher_profile_id',tp.id).eq('is_active',true),cls=[...new Set((ar.data||[]).map(x=>x.class_name).filter(Boolean))];head('My Class Due Fee','Only assigned active classes');let rows=await dueRows(cls);$id('erpContent').innerHTML=`<div class="panel"><h3>🔔 My Classes • Due Fee</h3>${dueTable(rows)}</div>`};

// Add routes without replacing existing behavior.
try{const base=window.render;window.render=function(p){if(p==='v53_complete_hub')return v53CompleteHub();if(p==='v53_master_timetable')return v53MasterTimetable();if(p==='teacher_due_fee')return v53TeacherDue();return base.apply(this,arguments)}}catch(_e){}
function install(){try{if(admin()){let nav=document.querySelector('.sideNav,.erpNav,#erpNav,.sidebar nav,.sidebar');if(nav&&!document.getElementById('v53CompleteNav')){let b=document.createElement('button');b.id='v53CompleteNav';b.innerHTML='⭐ <span>Master Plan</span>';b.onclick=()=>v53CompleteHub();nav.prepend(b)}}if(teacher()){let nav=document.querySelector('.sideNav,.erpNav,#erpNav,.sidebar nav,.sidebar');if(nav&&!document.getElementById('v53TeacherDueNav')){let b=document.createElement('button');b.id='v53TeacherDueNav';b.innerHTML='🔔 <span>My Class Due Fee</span>';b.onclick=()=>v53TeacherDue();nav.appendChild(b)}}}catch(_){}}
document.addEventListener('DOMContentLoaded',()=>setTimeout(install,500));window.addEventListener('load',()=>setTimeout(install,1200));setInterval(install,5000);
})();


/* SOURCE-MIGRATED: v53-stability-fix.js */
/* V53 stability repair — DOM route guards + safe insertBefore */
(()=>{'use strict';
window.V53_STABILITY_BUILD='V53-STABILITY-2026-09-19';
// Prevent NotFoundError when a stale reference node was replaced by another route wrapper.
try{const native=Node.prototype.insertBefore;if(!Node.prototype.__ldSafeInsertBefore){Object.defineProperty(Node.prototype,'__ldSafeInsertBefore',{value:true});Node.prototype.insertBefore=function(n,r){if(r&&r.parentNode!==this)r=null;try{return native.call(this,n,r)}catch(e){if(e&&e.name==='NotFoundError')return this.appendChild(n);throw e}}}}catch(e){console.warn('safe insertBefore install',e)}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function content(){for(let i=0;i<12;i++){const e=document.getElementById('erpContent');if(e&&e.isConnected)return e;await sleep(25)}return null}
// Repair Master Attendance so route races never write into a missing node.
window.v75MasterAttendance=async function(){
 if(!(typeof v75Admin==='function'&&v75Admin()||typeof v75Teacher==='function'&&v75Teacher()))return window.toast?.('Permission denied');
 const host=await content();if(!host)return window.toast?.('ERP content अभी ready नहीं है. फिर खोलें.');
 try{window.head?.('📋 Master Attendance',(v75Admin()?'All Classes':'Assigned Classes')+' • Date-wise consolidated view')}catch(_){}
 const allClasses=Array.isArray(window.cls)?window.cls:[];
 const allowed=(typeof v75Teacher==='function'&&v75Teacher()&&typeof v14AllowedClassNames==='function')?(v14AllowedClassNames()||[]):allClasses;
 if(typeof v75Teacher==='function'&&v75Teacher()&&!allowed.length){host.innerHTML='<div class="panel"><div class="empty">Admin ने अभी कोई class assign नहीं की है.</div></div>';return}
 host.innerHTML=`<div class="panel"><div class="v75Tools"><input id="v75AttDate" type="date" value="${typeof today==='function'?today():new Date().toISOString().slice(0,10)}"><select id="v75AttClass"><option value="">${v75Admin()?'All Classes':'All Assigned Classes'}</option>${allowed.map(c=>`<option>${typeof v75Esc==='function'?v75Esc(c):c}</option>`).join('')}</select><input id="v75AttQ" placeholder="Student / Father / Admission"><button class="primary" onclick="v75LoadMasterAttendance()">Show</button></div><div id="v75AttBody"><div class="empty">Loading...</div></div></div>`;
 if(typeof window.v75LoadMasterAttendance==='function')await window.v75LoadMasterAttendance();
};
// Guard attendance body if user changes route while async queries are running.
if(typeof window.v75LoadMasterAttendance==='function'){const old=window.v75LoadMasterAttendance;window.v75LoadMasterAttendance=async function(){try{return await old.apply(this,arguments)}catch(e){const b=document.getElementById('v75AttBody');if(b)b.innerHTML='<div class="dangerNote">'+String(e?.message||e||'Attendance load failed').replace(/[<>]/g,'')+'</div>';else console.warn('attendance route changed',e);return null}}}
// Special routes can be clicked while previous wrappers are still repainting. Serialize one paint frame first.
if(typeof window.render==='function'){const base=window.render;let token=0;window.render=async function(route){const my=++token;await content();await new Promise(r=>requestAnimationFrame(()=>r()));if(my!==token)return null;try{return await base.apply(this,arguments)}catch(e){console.error('V53 stable route',route,e);window.toast?.('Option open नहीं हुआ: '+String(e?.message||e).slice(0,160));return null}}}
// Admit publish: ensure ERP content exists before the older V92 renderer touches it.
if(typeof window.v92AdmitPublishCenter==='function'){const old=window.v92AdmitPublishCenter;window.v92AdmitPublishCenter=async function(){const h=await content();if(!h)return window.toast?.('ERP content ready नहीं है');return old.apply(this,arguments)}}
})();


/* SOURCE-MIGRATED: v53-final-polish.js */
/* V53 FINAL POLISH — navigation/session, stray-text cleanup, selection reset, light performance guards */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 function erpOpen(){const e=$('erp');return !!(e&&!e.classList.contains('hidden'))}
 function cleanStray(root=document){
   try{const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n,changed=0;while((n=w.nextNode())&&changed<80){const p=n.parentElement;if(!p||/^(SCRIPT|STYLE|TEXTAREA|PRE|CODE)$/i.test(p.tagName))continue;let s=n.nodeValue||'';if(/^\s*(?:\\?n\s*\/\s*\\?n|n\s*\/\s*n)\s*$/i.test(s)){n.nodeValue='';changed++}}}catch(_e){}
 }
 function clearAccidentalSelection(){try{const s=window.getSelection?.();if(s&&!document.activeElement?.matches?.('input,textarea,[contenteditable=true]'))s.removeAllRanges()}catch(_e){};try{document.activeElement?.blur?.()}catch(_e){};try{window.scrollTo({top:0,left:0,behavior:'auto'})}catch(_e){window.scrollTo(0,0)}}
 let cleanQueued=false;function queueClean(){if(cleanQueued)return;cleanQueued=true;requestAnimationFrame(()=>{cleanQueued=false;cleanStray();})}
 document.addEventListener('DOMContentLoaded',()=>cleanStray(),{once:true});
 // Preserve authenticated ERP on browser/mobile Back. Logout remains explicit via the existing Logout action.
 function armHistory(){try{if(erpOpen()&&history.state?.ldERP!==1)history.pushState({...(history.state||{}),ldERP:1},'',location.href)}catch(_e){}}
 window.addEventListener('popstate',()=>{if(erpOpen()){try{history.pushState({ldERP:1},'',location.href)}catch(_e){};try{if(typeof render==='function')render('dashboard')}catch(_e){};setTimeout(clearAccidentalSelection,20)}});
 const baseOpen=window.openERP;if(typeof baseOpen==='function')window.openERP=async function(){const r=await baseOpen.apply(this,arguments);armHistory();setTimeout(clearAccidentalSelection,40);return r};
 const baseRender=window.render;if(typeof baseRender==='function')window.render=async function(){const r=await baseRender.apply(this,arguments);setTimeout(()=>{clearAccidentalSelection();cleanStray()},20);return r};
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)queueClean()});
 window.addEventListener('load',()=>{setTimeout(()=>{cleanStray();if(erpOpen())armHistory()},250)});
})();


/* SOURCE-MIGRATED: v54-final-integration.js */
/* V54 FINAL INTEGRATION — parent/teacher first-login password, child switcher, in-place parent tools */
(()=>{'use strict';
const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)], safe=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
let activeAdm=sessionStorage.getItem('ld_active_student')||'';
function toast54(m){try{return window.toast?.(m)}catch(_e){} alert(m)}
async function changePasswordModal(force=false){
 let old=q('#v54PasswordModal');if(old)old.remove();let d=document.createElement('div');d.id='v54PasswordModal';d.className='v54Modal';d.innerHTML=`<div class="v54ModalCard"><h2>🔐 ${force?'Create New Password':'Change Password'}</h2><p>${force?'पहली login के बाद नया password बनाना जरूरी है.':'अपना नया password बनाइए.'}</p><label>New Password<input id="v54Pass1" type="password" minlength="6" autocomplete="new-password"></label><label>Confirm Password<input id="v54Pass2" type="password" minlength="6" autocomplete="new-password"></label><div class="v54Actions"><button class="primary" id="v54SavePass">Save New Password</button>${force?'':'<button class="secondary" onclick="document.getElementById(\'v54PasswordModal\').remove()">Cancel</button>'}</div><small id="v54PassMsg"></small></div>`;document.body.appendChild(d);
 q('#v54SavePass').onclick=async()=>{let a=q('#v54Pass1').value,b=q('#v54Pass2').value,msg=q('#v54PassMsg');if(a.length<8)return msg.textContent='Password कम से कम 8 characters का रखें.';if(a!==b)return msg.textContent='दोनों passwords match नहीं हैं.';let {error}=await sb.auth.updateUser({password:a});if(error)return msg.textContent=error.message;try{const saved=await sb.from('profiles').update({must_change_password:false,password_changed_at:new Date().toISOString()}).eq('id',user.id);if(saved.error)return msg.textContent='Password बदल गया, लेकिन profile save नहीं हुआ: '+saved.error.message;if(profile)profile.must_change_password=false}catch(e){return msg.textContent='Password बदल गया; profile save फिर करें: '+e.message};d.remove();toast54('Password successfully changed');};
}
window.v54ChangePassword=()=>changePasswordModal(false);
async function enforcePassword(){try{if(!window.user?.id)return;let {data}=await sb.from('profiles').select('must_change_password').eq('id',user.id).maybeSingle();if(data?.must_change_password)changePasswordModal(true)}catch(_e){}}
window.v643EnforcePassword=enforcePassword;
function addPasswordButton(){let host=q('#parentDashboard:not(.hidden) .portalHead')||q('#erp:not(.hidden) .erpTop');if(!host||q('#v54ChangePass'))return;let b=document.createElement('button');b.id='v54ChangePass';b.className='secondary';b.textContent='🔐 Password';b.onclick=()=>changePasswordModal(false);host.appendChild(b)}
function parentCards(){return qa('#parentDashboardBody .parentStudentCard.v114PortalDash')}
function cardAdm(c){return c?.dataset.admissionNo||c?.querySelector('.v114PortalHeroStudent span')?.textContent.match(/Admission\s+([^•\s]+)/i)?.[1]||''}
function showChild(adm){let cards=parentCards();if(!cards.length)return;let chosen=cards.find(c=>cardAdm(c)===adm)||cards[0];activeAdm=cardAdm(chosen);sessionStorage.setItem('ld_active_student',activeAdm);cards.forEach(c=>c.hidden=c!==chosen);q('#v54Children')?.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.adm===activeAdm));window.scrollTo(0,0)}
window.v54SelectChild=adm=>showChild(adm);
async function parentTimetable(adm){let svc=(window.v64ParentServices||[]).find(x=>String(x.admission_no)===String(adm));if(!svc)return toast54('Student data loading...');let {data,error}=await sb.from('timetable').select('day_name,period_no,start_time,end_time,subject,teacher_name,class_name,section').eq('class_name',svc.class_name).order('period_no');if(error)return toast54(error.message);let rows=data||[],days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];let html=days.map(day=>{let r=rows.filter(x=>x.day_name===day);return `<div class="v54Day"><h3>${day}</h3>${r.length?`<table><tr><th>Bell</th><th>Time</th><th>Subject</th><th>Teacher</th></tr>${r.map(x=>`<tr><td>${safe(x.period_no)}</td><td>${safe(x.start_time||'')} ${x.end_time?'– '+safe(x.end_time):''}</td><td>${safe(x.subject||'')}</td><td>${safe(x.teacher_name||'')}</td></tr>`).join('')}</table>`:'<p>No timetable entered.</p>'}</div>`}).join('');v54Panel('🕐 Class Timetable',html)}
function v54Panel(title,html){let body=q('#parentDashboardBody');if(!body)return;body.dataset.v54Saved=body.innerHTML;body.innerHTML=`<section class="v54InPlace"><div class="v54PanelHead"><button class="secondary" onclick="v54ParentBack()">← Back</button><h2>${title}</h2></div>${html}</section>`;window.scrollTo(0,0)}
window.v54ParentBack=()=>{loadParentPortal()};window.v54ParentTimetable=parentTimetable;
function enhanceParent(){let cards=parentCards();if(!cards.length)return;let body=q('#parentDashboardBody');q('#v54Children')?.remove();let wrap=document.createElement('section');wrap.id='v54Children';wrap.className='v54Children';wrap.innerHTML=`<div><b>👨‍👩‍👧 My Children</b><small>${cards.length} linked active student${cards.length>1?'s':''}</small></div><div class="v54ChildButtons">${cards.map((c,i)=>{let adm=cardAdm(c),name=c.querySelector('.v114PortalHeroStudent b')?.textContent||'Student',cl=c.querySelector('.v114PortalHeroStudent span')?.textContent||'';return `<button data-adm="${safe(adm)}" onclick="v54SelectChild(${safe(JSON.stringify(adm))})"><b>${safe(name)}</b><small>${safe(cl)}</small></button>`}).join('')}</div>`;body.prepend(wrap);
 cards.forEach(c=>{let adm=cardAdm(c),quick=c.querySelector('.v114PortalQuick');if(quick&&!quick.querySelector('.v54Leave')){quick.insertAdjacentHTML('beforeend',`<button class="v54Leave" onclick="v64OpenParentLeave(${safe(JSON.stringify(adm))})">🗓<span>Leave</span></button><button class="v54TT" onclick="v54ParentTimetable(${safe(JSON.stringify(adm))})">🕐<span>Timetable</span></button>`)} });if(window.v63ApplyParentIsolation){q('#v54Children')?.remove();window.v63ApplyParentIsolation()}else showChild(activeAdm);addPasswordButton();enforcePassword();
}
function cleanStray(){try{qa('body *').filter(e=>e.children.length===0&&!/^(SCRIPT|STYLE|TEXTAREA|PRE|CODE|INPUT)$/i.test(e.tagName)).forEach(e=>{if(/^\s*(?:\\?n\s*\/\s*\\?n|n\s*\/\s*n)\s*$/i.test(e.textContent||''))e.textContent=''})}catch(_e){}}
function afterAuth(){setTimeout(()=>{addPasswordButton();enforcePassword();cleanStray()},120)}
try{const p=window.loadParentPortal;window.loadParentPortal=async function(){let r=await p.apply(this,arguments);setTimeout(enhanceParent,160);return r}}catch(_e){}
try{const t=window.teacherPasswordLogin;window.teacherPasswordLogin=async function(){let r=await t.apply(this,arguments);afterAuth();return r}}catch(_e){}
try{const p=window.parentPasswordLogin;window.parentPasswordLogin=async function(){let r=await p.apply(this,arguments);afterAuth();return r}}catch(_e){}
try{const o=window.openERP;window.openERP=async function(){let r=await o.apply(this,arguments);afterAuth();return r}}catch(_e){}
window.addEventListener('load',()=>setTimeout(()=>{cleanStray();if(!q('#parentDashboard')?.classList.contains('hidden'))enhanceParent()},350));
})();


/* SOURCE-MIGRATED: v57-school-operations.js */
/* V57 SCHOOL OPERATIONS — additive reliability layer */
(()=>{'use strict';
const E=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const $57=id=>document.getElementById(id); const admin57=()=>['admin','super_admin','principal'].includes(String(window.profile?.role||'').toLowerCase());
const now57=()=>new Date(), wish57=()=>{let h=now57().getHours();return h<12?'Good Morning':h<17?'Good Afternoon':'Good Evening'};
function fmt57(){return now57().toLocaleString('en-IN',{weekday:'long',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'})}
async function guidance57(audience){try{let r=await sb.from('v57_global_guidance').select('*').eq('is_active',true).in('audience',['all',audience]).order('updated_at',{ascending:false});return r.error?[]:(r.data||[]).filter(x=>!x.expires_at||new Date(x.expires_at)>=new Date())}catch(_){return[]}}
async function birthdays57(audience){try{let out=[];let md=String(now57().getMonth()+1).padStart(2,'0')+'-'+String(now57().getDate()).padStart(2,'0');if(audience!=='public'){let r=await sb.from('students').select('id,student_name,class_name,dob').not('dob','is',null);if(!r.error)out.push(...(r.data||[]).filter(x=>String(x.dob||'').slice(5,10)===md).map(x=>({name:x.student_name,kind:'Student',class_name:x.class_name})));let t=await sb.from('staff').select('id,staff_name,dob,status');if(!t.error)out.push(...(t.data||[]).filter(x=>String(x.dob||'').slice(5,10)===md&&!/inactive|relieved/i.test(String(x.status||''))).map(x=>({name:x.staff_name,kind:'Teacher'})))}return out}catch(_){return[]}}
async function banner57(audience,host){if(!host)return;host.querySelectorAll(':scope > .v57TopInfo').forEach(x=>x.remove());let [gs,bs]=await Promise.all([guidance57(audience),birthdays57(audience)]);let d=document.createElement('section');d.className='v57TopInfo';d.innerHTML=`<div class="v57Clock"><b>🌞 ${E(wish57())}</b><span data-v57time>${E(fmt57())}</span></div>${gs.map(g=>`<div class="v57Guide"><b>📌 ${E(g.title||'School Guidance')}</b><span>${E(g.message||'')}</span></div>`).join('')}${bs.length?`<div class="v57Birthday">🎂 Happy Birthday — ${bs.map(x=>E(x.name)+(x.class_name?' • Class '+E(x.class_name):'')).join(' | ')}</div>`:''}`;host.prepend(d)}
setInterval(()=>document.querySelectorAll('[data-v57time]').forEach(x=>x.textContent=fmt57()),1000);
async function decorate57(){let erp=$57('erp');if(erp&&!erp.classList.contains('hidden'))await banner57(String(profile?.role||'admin').toLowerCase()==='teacher'?'teacher':'admin',$57('erpContent'));let pd=$57('parentDashboard');if(pd&&!pd.classList.contains('hidden'))await banner57('parent',$57('parentDashboardBody'));let pub=$57('publicSite');if(pub&&!pub.classList.contains('hidden'))await banner57('public',pub)}
window.v57GuidanceCenter=async function(){if(!admin57())return toast('Admin / Principal only');head('📌 Global Guidance','Public Website • Teacher Dashboard • Parent Dashboard');let r=await sb.from('v57_global_guidance').select('*').order('updated_at',{ascending:false});let rows=r.data||[];$57('erpContent').innerHTML=`<div class="panel"><div class="v57Form"><input id="v57gTitle" placeholder="Title / Rule / Guidance"><textarea id="v57gMsg" placeholder="Guidance / Rules / Important instruction"></textarea><select id="v57gAud"><option value="all">All</option><option value="public">Public Website</option><option value="teacher">Teacher Dashboard</option><option value="parent">Parent Dashboard</option></select><input id="v57gExp" type="date"><button class="primary" onclick="v57SaveGuidance()">Publish Guidance</button></div></div><div class="panel"><h3>Published Guidance</h3>${rows.map(x=>`<div class="v57GuideRow"><div><b>${E(x.title)}</b><small>${E(x.audience)} • ${x.is_active?'Active':'Hidden'}</small><p>${E(x.message)}</p></div><button onclick="v57ToggleGuidance('${x.id}',${!x.is_active})">${x.is_active?'Hide':'Show'}</button></div>`).join('')||'<div class="empty">No guidance yet.</div>'}</div>`};
window.v57SaveGuidance=async()=>{let o={title:$57('v57gTitle').value.trim()||'School Guidance',message:$57('v57gMsg').value.trim(),audience:$57('v57gAud').value,expires_at:$57('v57gExp').value||null,is_active:true,updated_at:new Date().toISOString()};if(!o.message)return toast('Guidance लिखें');let r=await sb.from('v57_global_guidance').insert(o);if(r.error)return toast(r.error.message);toast('Guidance published');v57GuidanceCenter()};
window.v57ToggleGuidance=async(id,val)=>{let r=await sb.from('v57_global_guidance').update({is_active:val,updated_at:new Date().toISOString()}).eq('id',id);if(r.error)return toast(r.error.message);v57GuidanceCenter()};
window.v57TeacherHandover=async function(){if(!admin57())return toast('Admin only');head('🔁 Teacher Replacement / Handover','Relieve safely • preserve history • transfer active assignments');let [t,a]=await Promise.all([sb.from('teacher_profiles').select('id,teacher_name,full_name,status,is_active').order('teacher_name'),sb.from('teacher_class_assignments').select('teacher_profile_id,class_name,is_class_teacher,is_active').eq('is_active',true)]);let rows=t.data||[],am={};(a.data||[]).forEach(x=>(am[x.teacher_profile_id]??=[]).push(x));$57('erpContent').innerHTML=`<div class="panel"><div class="v57Form"><select id="v57Old"><option value="">Leaving Teacher</option>${rows.filter(x=>x.is_active!==false).map(x=>`<option value="${E(x.id)}">${E(x.teacher_name||x.full_name)} • ${(am[x.id]||[]).map(y=>E(y.class_name)).join(', ')}</option>`).join('')}</select><select id="v57New"><option value="">New / Replacement Teacher</option>${rows.filter(x=>x.is_active!==false).map(x=>`<option value="${E(x.id)}">${E(x.teacher_name||x.full_name)}</option>`).join('')}</select><input id="v57LeaveDate" type="date" value="${new Date().toISOString().slice(0,10)}"><input id="v57Reason" placeholder="Leaving / handover reason"><button class="primary" onclick="v57DoHandover()">Relieve & Transfer</button></div><p class="note">Class और Students delete नहीं होंगे. केवल active teacher assignment नए teacher को transfer होगा; old history सुरक्षित रहेगी.</p></div>`};
window.v57DoHandover=async()=>{let old=$57('v57Old').value,nw=$57('v57New').value;if(!old)return toast('Leaving Teacher select करें');if(nw===old)return toast('Replacement अलग teacher होना चाहिए');let {data:as,error}=await sb.from('teacher_class_assignments').select('*').eq('teacher_profile_id',old).eq('is_active',true);if(error)return toast(error.message);let ts=new Date().toISOString();let u=await sb.from('teacher_class_assignments').update({is_active:false,ended_at:ts}).eq('teacher_profile_id',old).eq('is_active',true);if(u.error)return toast(u.error.message);if(nw&&(as||[]).length){let ins=(as||[]).map(x=>({teacher_profile_id:nw,academic_session:x.academic_session,class_name:x.class_name,is_class_teacher:x.is_class_teacher,is_active:true,started_at:ts}));let rr=await sb.from('teacher_class_assignments').insert(ins);if(rr.error)return toast('Old teacher relieved; assignment transfer needs review: '+rr.error.message)}let p=await sb.from('teacher_profiles').update({status:'Relieved',is_active:false,updated_at:ts}).eq('id',old);if(p.error)return toast(p.error.message);toast('Teacher relieved; class/student records preserved'+(nw?' and assignments transferred':''));v57TeacherHandover()};
/* Highest-to-lowest due center. Uses permanent student id; admission no only joins legacy fee rows. */
window.dueReminderCenter=async function(){if(!admin57()&&typeof v14Accounting==='function'&&!v14Accounting())return toast('Permission denied');head('💰 Smart Highest Due Fee Center','Highest → Lowest • Class • Select • Call • WhatsApp • SMS • Notice');$57('erpContent').innerHTML=`<div class="panel"><div class="v57Tools"><select id="drClass"><option value="">All Classes</option>${(window.cls||[]).map(c=>`<option>${E(c)}</option>`).join('')}</select><input id="drSearch" placeholder="Student / Father / Mobile / Class"><button class="primary" onclick="v57LoadDue()">Refresh Due</button><button onclick="v57SelectAll(true)">Select All</button><button onclick="v57SelectAll(false)">Clear</button><button onclick="v57BulkNotice()">Preview Selected Notices</button></div><div id="drBody" class="empty">Loading...</div></div>`;v57LoadDue()};
window.v57LoadDue=async()=>{let c=$57('drClass')?.value||'',q=($57('drSearch')?.value||'').toLowerCase();let sq=sb.from('students').select('id,admission_no,student_name,father_name,phone,class_name,roll_no,fee_category,fee_waiver_percent').order('student_name');if(c)sq=sq.eq('class_name',c);let s=await sq;if(s.error)return toast(s.error.message);let st=s.data||[],ad=st.map(x=>x.admission_no).filter(Boolean),dm={};if(ad.length){let [f,sc]=await Promise.all([sb.from('fees').select('admission_no,due_amount').in('admission_no',ad),sb.from('student_fee_schedules').select('admission_no,amount,paid_amount,status').in('admission_no',ad)]);let hs=new Set((sc.data||[]).map(x=>x.admission_no));(f.data||[]).forEach(x=>{if(!hs.has(x.admission_no))dm[x.admission_no]=(dm[x.admission_no]||0)+Number(x.due_amount||0)});(sc.data||[]).forEach(x=>{if(String(x.status||'').toLowerCase()!=='paid')dm[x.admission_no]=(dm[x.admission_no]||0)+Math.max(0,Number(x.amount||0)-Number(x.paid_amount||0))})}let rows=st.map(x=>({...x,_due:dm[x.admission_no]||0})).filter(x=>x._due>0&&!/free/i.test(String(x.fee_category||''))&&Number(x.fee_waiver_percent||0)<100).filter(x=>!q||[x.student_name,x.father_name,x.phone,x.class_name].some(v=>String(v||'').toLowerCase().includes(q))).sort((a,b)=>b._due-a._due);window.v57DueRows=rows;v57RenderDue(rows)};
function v57RenderDue(rows){let b=$57('drBody');if(!b)return;b.innerHTML=`<div class="v57DueStats"><b>${rows.length} Due Students</b><b>Total ${typeof money==='function'?money(rows.reduce((a,x)=>a+x._due,0)):rows.reduce((a,x)=>a+x._due,0)}</b></div><div class="tableWrap"><table><tr><th>✓</th><th>Student</th><th>Father</th><th>Class</th><th>Mobile</th><th>Due</th><th>Contact</th></tr>${rows.map((x,i)=>{let p=String(x.phone||'').replace(/\D/g,'').slice(-10),msg=encodeURIComponent(`Dear Parent, ${x.student_name} की school fee ${typeof money==='function'?money(x._due):x._due} pending है. कृपया जमा करें. - ${window.school?.school_name||'L D MODERN EDUCATION ACADEMY'}`);return `<tr><td><input class="v57Sel" type="checkbox" data-i="${i}"></td><td><b>${E(x.student_name)}</b></td><td>${E(x.father_name)}</td><td>${E(x.class_name)}</td><td>${E(p)}</td><td><b>${typeof money==='function'?money(x._due):x._due}</b></td><td>${p?`<a href="tel:${p}">Call</a> <a target="_blank" href="https://wa.me/91${p}?text=${msg}">WhatsApp</a> <a href="sms:${p}?body=${msg}">SMS</a>`:'—'}</td></tr>`}).join('')||'<tr><td colspan="7">No due student.</td></tr>'}</table></div>`}
window.v57SelectAll=v=>document.querySelectorAll('.v57Sel').forEach(x=>x.checked=v);
window.v57BulkNotice=()=>{let rows=[...document.querySelectorAll('.v57Sel:checked')].map(x=>window.v57DueRows?.[Number(x.dataset.i)]).filter(Boolean);if(!rows.length)return toast('Student select करें');let h=rows.map(x=>`<article class="v57FeeNotice"><h2>${E(window.school?.school_name||'L D MODERN EDUCATION ACADEMY')}</h2><h3>FEE REMINDER NOTICE</h3><p><b>Student:</b> ${E(x.student_name)} &nbsp; <b>Class:</b> ${E(x.class_name)}</p><p><b>Father:</b> ${E(x.father_name)}</p><p>आपके बच्चे की कुल बकाया विद्यालय शुल्क <b>${typeof money==='function'?money(x._due):x._due}</b> है। कृपया विद्यालय में शीघ्र जमा करें।</p><footer>Date: ${E(new Date().toLocaleDateString('en-IN'))}<span>Principal / Authorized Signatory</span></footer></article>`).join('');let w=window.open('','_blank','width=1000,height=800');if(!w)return toast('Popup allow करें');w.document.write(`<html><head><title>Fee Reminder Preview</title><style>@page{size:A4;margin:10mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;margin:0}.v57FeeNotice{min-height:265mm;border:1.5px solid #183f70;padding:10mm;margin:0;break-inside:avoid;page-break-inside:avoid;break-after:page;page-break-after:always;overflow-wrap:anywhere}.v57FeeNotice:last-child{break-after:auto;page-break-after:auto}.v57FeeNotice h2,.v57FeeNotice h3{text-align:center;margin:2mm}.v57FeeNotice footer{display:flex;justify-content:space-between;margin-top:8mm}button{margin:8px;padding:8px 14px}@media print{button{display:none}.v57FeeNotice{break-inside:avoid;page-break-inside:avoid}}</style></head><body><button onclick="print()">Print / Save PDF</button>${h}</body></html>`);w.document.close()};
/* Keep transport display sourced from Student Master; transport owns only route/vehicle fields. */
try{let r=window.render;window.render=async function(p){if(p==='v57_guidance')return v57GuidanceCenter();if(p==='v57_handover')return v57TeacherHandover();let z=await r.apply(this,arguments);setTimeout(decorate57,180);return z}}catch(_){ }
try{let lp=window.loadParentPortal;window.loadParentPortal=async function(){let z=await lp.apply(this,arguments);setTimeout(()=>banner57('parent',$57('parentDashboardBody')),220);return z}}catch(_){ }
window.addEventListener('load',()=>setTimeout(decorate57,500));
})();


/* SOURCE-MIGRATED: v58-complaint-discipline.js */
/* V58 Complaint / Discipline & Grievance Center */
(()=>{'use strict';
const E58=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const G=id=>document.getElementById(id); const admin58=()=>['admin','super_admin','principal'].includes(String(window.profile?.role||'').toLowerCase());
const cats=['Student Misbehaviour','Parent Complaint','Teacher/Staff Complaint','Academic','Fee','Transport','Safety','Discipline','Other'];
const statuses=['New','Under Review','Action Taken','Closed'];
const opt=(a,v='')=>a.map(x=>`<option ${x===v?'selected':''}>${E58(x)}</option>`).join('');
async function refs58(){let [s,t]=await Promise.all([sb.from('students').select('id,student_name,father_name,class_name').order('student_name'),sb.from('teacher_profiles').select('id,teacher_name,full_name,status,is_active').order('teacher_name')]);return {students:s.data||[],teachers:t.data||[]}}
window.v58ComplaintCenter=async function(){if(!admin58())return toast('Admin / Principal only');head('🛡️ Complaint & Discipline Center','Confidential review • verified action • complete history');let r=await refs58();window.v58Refs=r;G('erpContent').innerHTML=`<div class="v58Grid"><div class="panel"><h3>New Complaint / Report</h3><div class="v58Form"><select id="c58Cat">${opt(cats)}</select><input id="c58Subject" placeholder="Subject / घटना का विषय"><textarea id="c58Desc" placeholder="Complaint / incident details"></textarea><select id="c58Student"><option value="">Related Student (optional)</option>${r.students.map(x=>`<option value="${x.id}" data-class="${E58(x.class_name)}">${E58(x.student_name)} • ${E58(x.father_name)} • ${E58(x.class_name)}</option>`).join('')}</select><select id="c58Teacher"><option value="">Related Teacher/Staff (optional)</option>${r.teachers.map(x=>`<option value="${x.id}">${E58(x.teacher_name||x.full_name)} • ${E58(x.status||'Active')}</option>`).join('')}</select><select id="c58Priority"><option>Normal</option><option>High</option><option>Urgent</option></select><label><input id="c58Conf" type="checkbox" checked> Confidential — Admin only</label><button class="primary" onclick="v58SaveComplaint()">Submit Complaint</button></div></div><div class="panel"><div class="v58Filters"><select id="c58Status" onchange="v58LoadComplaints()"><option value="">All Status</option>${opt(statuses)}</select><select id="c58FilterCat" onchange="v58LoadComplaints()"><option value="">All Categories</option>${opt(cats)}</select><input id="c58Search" placeholder="Search no. / subject / name" oninput="v58LoadComplaints()"></div><div id="c58List" class="empty">Loading...</div></div></div>`;v58LoadComplaints()};
window.v58SaveComplaint=async()=>{let sid=G('c58Student').value||null,tid=G('c58Teacher').value||null,sub=G('c58Subject').value.trim(),des=G('c58Desc').value.trim();if(!sub||!des)return toast('Subject और complaint details लिखें');let cls=sid?(window.v58Refs.students.find(x=>x.id===sid)?.class_name||null):null;let {data:{user}}=await sb.auth.getUser();let o={category:G('c58Cat').value,subject:sub,description:des,source:'admin',student_id:sid,teacher_profile_id:tid,class_name:cls,priority:G('c58Priority').value,is_confidential:G('c58Conf').checked,status:'New',submitted_by:user?.id||null};let r=await sb.from('school_complaints').insert(o).select('complaint_no').single();if(r.error)return toast(r.error.message);toast('Complaint saved: '+(r.data?.complaint_no||''));v58ComplaintCenter()};
window.v58LoadComplaints=async()=>{let st=G('c58Status')?.value||'',cat=G('c58FilterCat')?.value||'',q=(G('c58Search')?.value||'').toLowerCase();let z=sb.from('school_complaints').select('*').order('created_at',{ascending:false}).limit(300);if(st)z=z.eq('status',st);if(cat)z=z.eq('category',cat);let r=await z;if(r.error){G('c58List').innerHTML='<div class="empty">'+E58(r.error.message)+'</div>';return}let rows=(r.data||[]).filter(x=>!q||[x.complaint_no,x.subject,x.description,x.complainant_name,x.class_name].some(v=>String(v||'').toLowerCase().includes(q)));window.v58Complaints=rows;G('c58List').innerHTML=rows.map(x=>`<article class="v58Complaint"><div class="v58ComplaintHead"><div><b>${E58(x.complaint_no||'Complaint')}</b> <span class="v58Badge">${E58(x.category)}</span> ${x.is_confidential?'<span class="v58Badge">🔒 Confidential</span>':''}<h4>${E58(x.subject)}</h4></div><div><b>${E58(x.status)}</b><br><small>${new Date(x.created_at).toLocaleString('en-IN')}</small></div></div><p>${E58(x.description)}</p><small>${x.class_name?'Class: '+E58(x.class_name)+' • ':''}Priority: ${E58(x.priority||'Normal')}</small><div class="v58Actions"><select id="s58_${x.id}">${opt(statuses,x.status)}</select><input id="n58_${x.id}" placeholder="Admin note / action" value="${E58(x.admin_note||'')}"><button onclick="v58UpdateComplaint('${x.id}')">Save Review</button><button onclick="v58VerifyAction('${x.id}')">Verify Discipline Action</button></div></article>`).join('')||'<div class="empty">No complaint found.</div>'};
window.v58UpdateComplaint=async id=>{let status=G('s58_'+id).value,note=G('n58_'+id).value.trim(),ts=new Date().toISOString();let {data:{user}}=await sb.auth.getUser();let o={status,admin_note:note,reviewed_by:user?.id||null,reviewed_at:ts,updated_at:ts};if(status==='Closed')o.closed_at=ts;if(status==='Action Taken')o.action_taken=note;let r=await sb.from('school_complaints').update(o).eq('id',id);if(r.error)return toast(r.error.message);toast('Complaint updated');v58LoadComplaints()};
window.v58VerifyAction=async id=>{let x=(window.v58Complaints||[]).find(a=>a.id===id);if(!x)return toast('Complaint not found');let note=G('n58_'+id).value.trim();if(!note)return toast('पहले verified action note लिखें');if(!x.student_id&&!x.teacher_profile_id)return toast('Verified discipline history के लिए related Student/Teacher जरूरी है');let {data:{user}}=await sb.auth.getUser();let r=await sb.from('discipline_actions').insert({complaint_id:id,student_id:x.student_id||null,teacher_profile_id:x.teacher_profile_id||null,action_type:'Verified Action',action_note:note,verified_by:user?.id||null});if(r.error)return toast(r.error.message);await sb.from('school_complaints').update({status:'Action Taken',action_taken:note,reviewed_by:user?.id||null,reviewed_at:new Date().toISOString()}).eq('id',id);toast('Verified action added to discipline history');v58LoadComplaints()};
window.v58PublicComplaint=function(){let old=G('v58PublicComplaintBox');if(old){old.scrollIntoView({behavior:'smooth'});return}let sec=document.createElement('section');sec.id='v58PublicComplaintBox';sec.className='publicSection soft';sec.innerHTML=`<div class="v58PublicBox"><span class="eyebrow">CONFIDENTIAL FEEDBACK / COMPLAINT</span><h2>School Complaint Box</h2><p>Complaint Admin review के लिए जाएगी. कृपया सही जानकारी दें.</p><div class="v58Form"><input id="p58Name" placeholder="Your Name (optional)"><input id="p58Phone" inputmode="tel" placeholder="Mobile (optional)"><select id="p58Cat">${opt(cats)}</select><input id="p58Subject" placeholder="Subject" required><textarea id="p58Desc" class="full" placeholder="Complaint / feedback details" required></textarea><button class="primary full" onclick="v58SubmitPublic()">Submit Confidentially</button><div id="p58Status" class="full"></div></div></div>`;let contact=G('contact');(contact?.parentNode||G('publicSite')).insertBefore(sec,contact||null);sec.scrollIntoView({behavior:'smooth'})};
window.v58SubmitPublic=async()=>{let sub=G('p58Subject').value.trim(),des=G('p58Desc').value.trim();if(!sub||!des)return G('p58Status').textContent='Subject और details लिखें.';let r=await sb.from('school_complaints').insert({category:G('p58Cat').value,subject:sub,description:des,source:'public',complainant_name:G('p58Name').value.trim()||null,complainant_phone:G('p58Phone').value.trim()||null,is_confidential:true,status:'New',priority:'Normal'}).select('complaint_no').single();G('p58Status').textContent=r.error?('Could not submit: '+r.error.message):('Submitted successfully. Reference: '+(r.data?.complaint_no||''));if(!r.error){G('p58Subject').value='';G('p58Desc').value=''}};
function addPublicButton(){let bar=document.querySelector('.publicNav,.v114PublicNav,nav');if(bar&&!bar.querySelector('[data-v58-complaint]')){let b=document.createElement('button');b.dataset.v58Complaint='1';b.innerHTML='🛡️ <span>Complaint</span>';b.onclick=v58PublicComplaint;bar.appendChild(b)}}
try{let r=window.render;window.render=async function(p){if(p==='v58_complaints')return v58ComplaintCenter();return await r.apply(this,arguments)}}catch(_){ }
window.addEventListener('load',()=>setTimeout(addPublicButton,700));
})();


/* SOURCE-MIGRATED: v59-academic-calendar.js */
/* V59 Academic Calendar — Sunday/Holiday awareness across attendance */
(()=>{'use strict';
const G=id=>document.getElementById(id), esc59=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const admin59=()=>['admin','super_admin','principal'].includes(String(window.profile?.role||'').toLowerCase());
function iso59(v){let d=v?new Date(v+'T12:00:00'):new Date();return d.toISOString().slice(0,10)}
async function day59(date){date=iso59(date);try{let r=await sb.from('school_holidays').select('holiday_name,is_working_day,note').eq('holiday_date',date).maybeSingle();if(!r.error&&r.data){return r.data.is_working_day?{holiday:false,label:'Working Day',source:'calendar'}:{holiday:true,label:r.data.holiday_name||'Holiday',source:'calendar'}}}catch(_){}let d=new Date(date+'T12:00:00');return d.getDay()===0?{holiday:true,label:'Sunday / Weekly Holiday',source:'sunday'}:{holiday:false,label:'Working Day',source:'normal'}}
window.v59SchoolDayStatus=day59;
window.v59HolidayCenter=async function(){if(!admin59())return toast('Admin / Principal only');head('📅 Academic Calendar & Holidays','Sunday automatic holiday • School holidays • Working-day override');let from=new Date();from.setMonth(from.getMonth()-1);let to=new Date();to.setMonth(to.getMonth()+12);let r=await sb.from('school_holidays').select('*').gte('holiday_date',iso59(from.toISOString().slice(0,10))).lte('holiday_date',iso59(to.toISOString().slice(0,10))).order('holiday_date');let rows=r.data||[];G('erpContent').innerHTML=`<div class="panel"><div class="v57Form"><input id="v59Date" type="date" value="${iso59()}"><input id="v59Name" placeholder="Holiday name e.g. Dussehra"><select id="v59Type"><option>School Holiday</option><option>Festival</option><option>Local Holiday</option><option>Vacation</option><option>Special Holiday</option><option>Working Day Override</option></select><label><input id="v59Working" type="checkbox"> Mark as Working Day (Sunday/holiday override)</label><textarea id="v59Note" placeholder="Optional note"></textarea><button class="primary" onclick="v59SaveHoliday()">Save Calendar Day</button></div><p class="note">हर Sunday बिना entry के भी Holiday रहेगा. केवल Sunday को school खुलने पर Working Day override बनाएं.</p></div><div class="panel"><h3>Holiday / Override List</h3><div class="tableWrap"><table><tr><th>Date</th><th>Day</th><th>Name</th><th>Type</th><th>Status</th><th>Action</th></tr>${rows.map(x=>`<tr><td>${esc59(x.holiday_date)}</td><td>${new Date(x.holiday_date+'T12:00:00').toLocaleDateString('en-IN',{weekday:'long'})}</td><td>${esc59(x.holiday_name)}</td><td>${esc59(x.holiday_type)}</td><td><b>${x.is_working_day?'Working Day':'Holiday'}</b></td><td><button onclick="v59DeleteHoliday('${x.id}')">Remove Override</button></td></tr>`).join('')||'<tr><td colspan="6">No manual holiday entries. Sundays are still automatic holidays.</td></tr>'}</table></div></div>`};
window.v59SaveHoliday=async()=>{let d=G('v59Date')?.value,n=(G('v59Name')?.value||'').trim(),w=!!G('v59Working')?.checked,t=G('v59Type')?.value||'School Holiday';if(!d)return toast('Date select करें');if(!w&&!n)return toast('Holiday name लिखें');let o={holiday_date:d,holiday_name:w?(n||'Working Day'):n,holiday_type:t,is_working_day:w,note:G('v59Note')?.value||null,updated_at:new Date().toISOString()};let r=await sb.from('school_holidays').upsert(o,{onConflict:'holiday_date'});if(r.error)return toast(r.error.message);toast(w?'Working day saved':'Holiday saved');v59HolidayCenter()};
window.v59DeleteHoliday=async id=>{if(!admin59())return;let r=await sb.from('school_holidays').delete().eq('id',id);if(r.error)return toast(r.error.message);toast('Calendar override removed');v59HolidayCenter()};
function holidayBox(label){return `<div class="panel v59Holiday"><h2>🏖️ ${esc59(label)}</h2><p>आज attendance में Present / Absent / Leave नहीं लगेगा. यह दिन working-day attendance percentage में नहीं गिना जाना चाहिए.</p></div>`}
const oldLoad=window.loadAttendanceClass; if(typeof oldLoad==='function')window.loadAttendanceClass=async function(){let d=G('attDate')?.value||iso59(),s=await day59(d);if(s.holiday){let box=G('attendanceSheet');if(box)box.innerHTML=holidayBox(s.label);window.attendanceRows=[];return}return oldLoad.apply(this,arguments)};
const oldSave=window.saveAttendanceSheet; if(typeof oldSave==='function')window.saveAttendanceSheet=async function(){let d=G('attDate')?.value||iso59(),s=await day59(d);if(s.holiday)return toast(s.label+' — attendance save नहीं होगी');return oldSave.apply(this,arguments)};
try{let oldRender=window.render;window.render=async function(p){if(p==='v59_calendar')return v59HolidayCenter();return oldRender.apply(this,arguments)}}catch(_){}
// Add Admin navigation without replacing existing navigation.
function addNav(){if(!admin59())return;let nav=[...document.querySelectorAll('button')].find(b=>/Complaints.*Discipline/i.test(b.textContent||''));if(nav&&nav.parentElement&&!nav.parentElement.querySelector('[data-v59nav]')){let b=document.createElement('button');b.dataset.v59nav='1';b.innerHTML='📅 Academic Calendar';b.onclick=()=>v59HolidayCenter();nav.insertAdjacentElement('afterend',b)}}
window.addEventListener('load',()=>setTimeout(addNav,700));document.addEventListener('click',()=>setTimeout(addNav,120));
})();


/* SOURCE-MIGRATED: v60-session-admit-health.js */
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


/* SOURCE-MIGRATED: v62-render-safe.js */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 function role(){return String(window.profile?.role||'').toLowerCase()}
 function isAdmin(){return ['super_admin','admin','principal'].includes(role())}
 function mark(){
   const erp=$('erp'); if(!erp)return;
   erp.dataset.v62Role=role()||'unknown';
   if(window.innerWidth<=900) erp.classList.remove('v62Collapsed');
 }
 function closeMobile(){if(window.innerWidth<=900)document.querySelector('#erp aside')?.classList.remove('open')}
 function install(){
   mark();
   const nav=$('erpNav');
   if(nav&&!nav.dataset.v62){nav.dataset.v62='1';nav.addEventListener('click',e=>{if(e.target.closest('button'))setTimeout(closeMobile,0)})}
   const h=document.querySelector('#erp .hamb');
   if(h&&!h.dataset.v62){h.dataset.v62='1';h.addEventListener('click',()=>{if(window.innerWidth>900&&isAdmin())$('erp')?.classList.toggle('v62Collapsed')})}
 }
 document.addEventListener('DOMContentLoaded',()=>setTimeout(install,120));
 window.addEventListener('load',()=>setTimeout(install,250));
 window.addEventListener('resize',()=>{mark();if(window.innerWidth>900)document.querySelector('#erp aside')?.classList.remove('open')},{passive:true});
 document.addEventListener('click',()=>setTimeout(install,60),true);
})();


/* SOURCE-MIGRATED: v63-final-repair.js */
/* V64.2: one child chooser, stable record identity, async render support. */
(()=>{'use strict';
 const cards=()=>Array.from(document.querySelectorAll('#parentDashboardBody .parentStudentCard'));
 let previous=[],observer;
 function meta(c,i){return {key:c.dataset.studentId||`card-${i}`,adm:c.dataset.admissionNo||'',name:c.querySelector('.v114PortalHeroStudent b,.v114ChildRow b')?.textContent?.trim()||`Student ${i+1}`,sub:c.querySelector('.v114PortalHeroStudent span,.v114ChildRow span')?.textContent?.trim()||''}}
 function save(key,adm){try{if(key){sessionStorage.setItem('ld_active_student_id',key);sessionStorage.setItem('ld_active_student',adm)}else{sessionStorage.removeItem('ld_active_student_id');sessionStorage.removeItem('ld_active_student')}}catch(_){} }
 function choose(key){const all=cards(),selected=all.find((c,i)=>meta(c,i).key===key);if(!selected)return;
  all.forEach(c=>c.hidden=c!==selected);const chooser=document.getElementById('v63ChildChooser');if(chooser)chooser.hidden=true;
  const m=meta(selected,all.indexOf(selected));save(m.key,m.adm);selected.scrollIntoView({block:'start'});
 }
 function showChooser(){cards().forEach(c=>c.hidden=true);save('','');const ch=document.getElementById('v63ChildChooser');if(ch){ch.hidden=false;ch.scrollIntoView({block:'start'})}}
 function apply(){const body=document.getElementById('parentDashboardBody'),all=cards();if(!body||!all.length){previous=[];return}
  document.getElementById('v54Children')?.remove();
  if(all.length===previous.length&&all.every((c,i)=>c===previous[i]))return;
  previous=all;document.getElementById('v63ChildChooser')?.remove();
  if(all.length===1){all[0].hidden=false;const m=meta(all[0],0);save(m.key,m.adm);return}
  const ch=document.createElement('section');ch.id='v63ChildChooser';ch.className='v63ChildChooser';
  const title=document.createElement('h2');title.textContent='My Children';ch.append(title);
  const grid=document.createElement('div');grid.className='v63ChildGrid';ch.append(grid);
  all.forEach((c,i)=>{const m=meta(c,i),b=document.createElement('button'),name=document.createElement('b'),sub=document.createElement('span');b.className='v63ChildPick';name.textContent=m.name;sub.textContent=m.sub;b.append(name,sub);b.onclick=()=>choose(m.key);grid.append(b);c.hidden=true;
   if(!c.querySelector('.v63ChildBack')){const back=document.createElement('button');back.className='v63ChildBack';back.textContent='← Back to My Children';back.onclick=showChooser;c.prepend(back)}
  });body.prepend(ch);
  let saved='';try{saved=sessionStorage.getItem('ld_active_student_id')||''}catch(_){}
  if(all.some((c,i)=>meta(c,i).key===saved))choose(saved);
 }
 function install(){apply();const body=document.getElementById('parentDashboardBody');if(body&&!observer){observer=new MutationObserver(apply);observer.observe(body,{childList:true})}}
 window.v63ApplyParentIsolation=apply;window.v63ShowMyChildren=showChooser;
 window.v54SelectChild=adm=>{const all=cards(),c=all.find(x=>x.dataset.admissionNo===adm);if(c)choose(meta(c,all.indexOf(c)).key)};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();


/* SOURCE-MIGRATED: v64-final-layout-interaction.js */
(()=>{'use strict';
 const q=s=>document.querySelector(s);
 function isERP(){return !!q('#erp:not(.hidden)')}
 function removeFloatingControl(){document.querySelectorAll('#v65Dock,.v65Dock').forEach(x=>x.remove())}
 function cleanPublicNN(){
   if(isERP())return;
   const roots=[q('#publicHome'),q('#publicPageView'),q('#publicSite'),document.querySelector('main')].filter(Boolean);
   roots.forEach(root=>{const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode())){const p=n.parentElement;if(!p||/^(SCRIPT|STYLE|TEXTAREA|PRE|CODE)$/i.test(p.tagName))continue;let s=n.nodeValue||'';if(/^\s*(?:\\?\/n){2,}\s*$/i.test(s)||/^\s*n\/n\s*$/i.test(s))n.nodeValue='';else if(s.includes('/n/n'))n.nodeValue=s.replace(/\/n\/n/g,'');}});
 }
 function fixAdminIdentity(){
   if(!isERP())return;
   const h=q('#erpContent .v90Welcome h1,#erpContent .dashHero h1');
   if(h&&/@/.test(h.textContent||''))h.textContent=(/morning/i.test(h.textContent)?'Good Morning':/afternoon/i.test(h.textContent)?'Good Afternoon':/evening/i.test(h.textContent)?'Good Evening':'Welcome Back')+', Principal / Admin';
 }
 let raf=0;function repair(){cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{removeFloatingControl();cleanPublicNN();fixAdminIdentity();});}
 document.addEventListener('DOMContentLoaded',repair,{once:true});
 window.addEventListener('load',repair,{once:true});
 window.addEventListener('resize',repair,{passive:true});
 /* Route changes are repaired after the user's action; no page-wide MutationObserver. */
 document.addEventListener('click',e=>{if(e.target.closest('#erpNav button,.hamb,.erpHomeBtn,.websiteBtn,[data-page],[data-route]'))setTimeout(repair,80)},true);
 window.v64RepairLayout=repair;
})();


/* SOURCE-MIGRATED: v64-3-parent-actions.js */
/* V64.3: child-scoped parent actions, preserved V114 dashboard design. */
(()=>{'use strict';
const $=id=>document.getElementById(id), E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const actions=[['profile','👤','Student Profile'],['attendance','✅','Attendance'],['fees','₹','Fee Details'],['results','🏆','Exam Results'],['admit','🎫','Admit Card'],['notices','📢','Notices / Orders'],['learning','📚','Homework / Worksheets'],['gallery','🖼','Gallery'],['timetable','🕐','Timetable'],['leave','🗓','Apply Leave'],['correction','✏','Data Correction'],['transport','🚐','Transport'],['gate','🚪','Gate Pass'],['idcard','🪪','ID Card'],['help','💬','Help / Complaint']];
let token=0,selected=null,loading=null;const cash=n=>'₹'+Number(n||0).toLocaleString('en-IN');
const schoolDay=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const btn=(key,label)=>`<button type="button" data-parent-action="${key}">${E(label)}</button>`;
const empty=t=>`<p class="empty">${E(t||'अभी कोई जानकारी उपलब्ध नहीं है।')}</p>`;
const rowsTable=(rows,cols)=>!rows?.length?empty():`<div class="v643Table"><table><thead><tr>${cols.map(x=>`<th>${E(x[1])}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${cols.map(x=>`<td>${E(r[x[0]]??'—')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
function validUrl(v){try{let u=new URL(v,location.href);return ['https:','http:'].includes(u.protocol)?u.href:''}catch(_){return ''}}
function resource(v,label){const href=validUrl(v);return href?`<a href="${E(href)}" target="_blank" rel="noopener noreferrer">${E(label||'Open attachment')}</a>`:''}
function getStudent(card){return (window.v643ParentRows||[]).find(s=>String(s.admission_no||s.student_id||s.id)===String(card?.dataset.admissionNo||card?.dataset.studentId))}
function message(el,text,error=false){if(el){el.className=error?'v643Error':'v643Status';el.textContent=text}}
async function rpc(name,args){const r=await sb.rpc(name,args);if(r.error)throw new Error(r.error.message||'जानकारी नहीं खुली। फिर प्रयास करें।');return r.data}
function data(kind,s){return rpc('v643_parent_data',{p_admission_no:s.admission_no,p_kind:kind})}
function back(){++token;$('v643ParentPanel')?.remove();$('parentDashboardBody')?.classList.remove('v643InPanel');selected=null;const dash=$('parentDashboard');if(dash)dash.scrollTop=0}
function panel(s,key){back();selected=s;const p=document.createElement('section');p.id='v643ParentPanel';p.className='v643Panel';p.dataset.admissionNo=s.admission_no;
 p.innerHTML=`<div class="v643PanelHead"><button type="button" data-parent-back>← Back</button><div><h2>${E(actions.find(x=>x[0]===key)?.[2]||key)}</h2><p>${E(s.student_name)} • Class ${E(s.class_name)} • ${E(s.admission_no)}</p></div></div><div id="v643PanelBody" aria-live="polite">Loading…</div>`;
 $('parentDashboardBody').append(p);$('parentDashboardBody').classList.add('v643InPanel');p.querySelector('[data-parent-back]').onclick=back;$('parentDashboard').scrollTop=0;return p.querySelector('#v643PanelBody')}
function paintForm(box,s,kind,history){const leave=kind==='leave';box.innerHTML=`<form id="v643RequestForm" class="v643Form"><input type="hidden" name="admission_no" value="${E(s.admission_no)}">${leave?`<label>From Date<input name="from" type="date" value="${schoolDay()}" required></label><label>To Date<input name="to" type="date" value="${schoolDay()}" required></label><label>Leave Type<select name="type"><option>Sick</option><option>Family</option><option>Emergency</option><option>Medical</option><option>Other</option></select></label>`:kind==='correction'?`<label>Field<select name="field"><option value="phone">Mobile</option><option value="address">Address</option><option value="student_name">Student Name</option><option value="father_name">Father Name</option><option value="mother_name">Mother Name</option><option value="dob">Date of Birth</option><option value="guardian_name">Guardian Name</option><option value="emergency_phone">Emergency Mobile</option><option value="roll_no">Roll No.</option></select></label><label>Correct Value<input name="value" required maxlength="500"></label>`:`<label>Category<select name="category">${['Parent Complaint','Academic','Fee','Transport','Safety','Discipline','Other'].map(v=>`<option>${v}</option>`).join('')}</select></label><label>Subject<input name="subject" required maxlength="200"></label>`}<label class="v643Full">${leave?'Leave Reason':kind==='correction'?'Reason for Correction':'Message'}<textarea name="reason" required maxlength="2000" rows="4"></textarea></label><button type="submit" class="primary">${leave?'Submit Leave Request':kind==='correction'?'Send for Admin Approval':'Send to Admin'}</button><p class="v643Full" id="v643FormStatus" role="status"></p></form><h3>Request History</h3><div id="v643History">${history}</div>`;
 const form=box.querySelector('form');if(kind==='correction')form.elements.field.onchange=()=>{form.elements.value.type=form.elements.field.value==='dob'?'date':'text'};
 form.onsubmit=async ev=>{ev.preventDefault();const b=form.querySelector('[type=submit]'),msg=form.querySelector('#v643FormStatus');if(b.disabled)return;
 const f=Object.fromEntries(new FormData(form));f.reason=f.reason.trim();if(!f.reason)return message(msg,'कारण / message लिखें।',true);
 if(leave&&(!f.from||!f.to||f.to<f.from||(Date.parse(f.to)-Date.parse(f.from))/86400000>60))return message(msg,'सही तारीख चुनें; छुट्टी अधिकतम 60 दिन की हो सकती है।',true);
 if(kind==='correction'&&!f.value.trim())return message(msg,'सही value लिखें।',true);
 b.disabled=true;message(msg,'Saving…');try{if(leave)await rpc('v643_parent_request',{p_admission_no:s.admission_no,p_kind:'leave',p_payload:{from:f.from,to:f.to,type:f.type,reason:f.reason}});else if(kind==='correction')await rpc('v643_parent_request',{p_admission_no:s.admission_no,p_kind:'correction',p_payload:{field:f.field,value:f.value.trim(),reason:f.reason}});else await rpc('v643_parent_request',{p_admission_no:s.admission_no,p_kind:'help',p_payload:{category:f.category,subject:f.subject.trim(),reason:f.reason}});
 message(msg,'✓ Request भेज दी गई है। Admin की समीक्षा बाकी है।');form.reset();b.textContent='Submitted';
 try{const fresh=await data(kind,s);const target=box.querySelector('#v643History');if(target)target.innerHTML=historyHtml(kind,fresh.rows||[])}catch(_){/* saved request remains acknowledged; refresh is optional */}
 }catch(e){message(msg,e.message,true);b.disabled=false}}}
function historyHtml(kind,rows){return rowsTable(rows,kind==='leave'?[['from_date','From'],['to_date','To'],['reason','Reason'],['status','Status'],['reviewer_note','Admin Note']]:kind==='correction'?[['created_at','Date'],['reason','Reason'],['status','Status'],['reviewer_note','Admin Note']]:[['created_at','Date'],['subject','Subject'],['status','Status']])}
async function open(key,s){if(!s?.admission_no)return window.toast?.('Student admission link उपलब्ध नहीं है। Admin से जाँच कराएँ।');const box=panel(s,key),mine=++token;const show=html=>{if(mine===token&&box.isConnected)box.innerHTML=html};
 try{
 if(['leave','correction','help'].includes(key)){paintForm(box,s,key,'Loading…');try{const d=await data(key,s);if(mine===token)box.querySelector('#v643History').innerHTML=historyHtml(key,d.rows||[])}catch(e){if(mine===token)message(box.querySelector('#v643History'),e.message,true)}return}
 if(key==='results'){const d=await rpc('v67_parent_result_list',{p_admission_no:s.admission_no});show((Array.isArray(d)?d:[]).map((r,i)=>`<article class="v643Item"><h3>${E(r.exam_name)}</h3><p>${E(r.message||'')}</p>${r.can_view?`<button data-exam-index="${i}">Preview Marksheet</button>`:'<strong>🔒 Admin / Fee clearance required</strong>'}</article>`).join('')||empty('कोई result अभी प्रकाशित नहीं है।'));box.querySelectorAll('[data-exam-index]').forEach(b=>b.onclick=async()=>{try{b.disabled=true;const r=d[Number(b.dataset.examIndex)],m=await rpc('v67_parent_published_marksheet',{p_admission_no:s.admission_no,p_exam_name:r.exam_name});if(mine!==token)return;show(`<div id="v643ResultPreview" class="v643Document">${renderMarksheetHtml(m.student||s,m.marks||[],m.exam_name||r.exam_name,typeof getDocFormat==='function'?getDocFormat('marksheet'):1)}</div><button id="v643Print">Print / Save PDF</button>`);box.querySelector('#v643Print').onclick=()=>v14Print('v643ResultPreview')}catch(e){message(box,e.message,true)}});return}
 if(key==='admit'){const d=await rpc('v75_parent_admit_cards',{}),all=Array.isArray(d)?d:d?.cards||[],rows=all.filter(x=>String(x.student?.admission_no)===String(s.admission_no));show(rows.map((x,i)=>`<article class="v643Item"><h3>${E(x.exam?.exam_name||'Exam')}</h3>${x.student?.is_withheld?`<p>🔒 ${E(x.student.hold_reason||'Admin hold')}</p>`:`<button data-admit-index="${i}">Preview Admit Card</button>`}</article>`).join('')||empty('Admit Card अभी प्रकाशित नहीं है।'));box.querySelectorAll('[data-admit-index]').forEach(b=>b.onclick=()=>{const x=rows[Number(b.dataset.admitIndex)];show(`<div id="v643AdmitPreview" class="v643Document">${v75ParentAdmitHtml(x)}</div><button id="v643Print">Print / Save PDF</button>`);box.querySelector('#v643Print').onclick=()=>v14Print('v643AdmitPreview')});return}
 if(key==='idcard'){const student=await rpc('v65_parent_official_card',{p_admission_no:s.admission_no});const r=student?.student||student;if(r?.photo_path){const photo=await sb.storage.from('student-media').createSignedUrl(r.photo_path,900);if(photo.data?.signedUrl)r._signed_photo=photo.data.signedUrl}if(!r)throw Error('ID card data उपलब्ध नहीं है।');show(`<div id="v643IDPreview" class="v643Document">${renderIdCard(r,typeof getDocFormat==='function'?getDocFormat('idcard'):1)}</div><button id="v643Print">Print / Save PDF</button>`);box.querySelector('#v643Print').onclick=()=>v14Print('v643IDPreview');return}
 const d=await data(key,s);if(mine!==token)return;const rows=d.rows||[];
 if(key==='profile'){const r=d.student||s;show(rowsTable(Object.entries(r).map(([k,v])=>({field:k.replaceAll('_',' '),value:v})),[['field','Field'],['value','Details']])+btn('correction','Request Correction'));return}
 if(key==='attendance'){show(`<p>Present: ${E(s.attendance?.present??'—')} • Absent: ${E(s.attendance?.absent??'—')} • Leave: ${E(s.attendance?.leave??'—')}</p>`+rowsTable(rows,[['date','Date'],['status','Status'],['remarks','Remarks']]));return}
 if(key==='fees'){show(`<div class="v643Summary"><b>Paid: ${cash(s.fee?.paid)}</b><b>Current Due: ${cash(d.current_due??s.fee?.due)}</b></div>`+rowsTable(rows,[['date','Date / Month'],['label','Head / Receipt'],['amount','Total'],['paid','Paid'],['due','Due']])+`<h3>Fee Notices</h3>`+(d.notices||[]).map(n=>`<article class="v643Item"><b>${E(n.title)}</b><p>${E(n.note)}</p><small>Deposit by: ${E(n.deposit_by_date)}</small></article>`).join(''));return}
 if(key==='timetable'){show(rowsTable(rows,[['day_name','Day'],['period_no','Bell'],['start_time','Start'],['end_time','End'],['subject','Subject'],['teacher_name','Teacher']]));return}
 if(key==='learning'){show(rows.map(r=>`<article class="v643Item"><h3>${E(r.subject)} • ${E(r.date)} ${r.period_no?'• Bell '+E(r.period_no):''}</h3><b>${E(r.title)}</b><p>${E(r.details)}</p><p>${E(r.homework)}</p>${resource(r.worksheet_url,'Worksheet / Attachment')}</article>`).join('')||empty('अभी homework / teaching update नहीं दिया गया है।'));return}
 if(key==='notices'){show(rows.map(r=>`<article class="v643Item"><small>${E(r.date)} • ${E(r.letter_no)}</small><h3>${E(r.title)}</h3><p>${E(r.message)}</p>${resource(r.download_url,'Open Notice')}</article>`).join('')||empty('अभी कोई notice नहीं है।'));return}
 if(key==='gallery'){show(`<div class="v643Gallery">${rows.map(r=>{const u=validUrl(r.media_url);return u?`<figure>${/video/i.test(r.media_type||'')?`<video controls preload="none" src="${E(u)}"></video>`:`<img loading="lazy" src="${E(u)}" alt="${E(r.title)}">`}<figcaption>${E(r.title)}</figcaption></figure>`:''}).join('')}</div>`+(rows.length?'':empty()));return}
 if(key==='transport'){show(rowsTable(rows,[['route_name','Route'],['vehicle_no','Vehicle'],['pickup_point','Pickup'],['monthly_fee','Monthly Fee'],['driver_name','Driver'],['driver_phone','Mobile']]));return}
 if(key==='gate'){show(rowsTable(rows,[['gate_date','Date'],['reason','Reason'],['status','Status'],['approved_departure_time','Time'],['left_at','Left'],['returned_at','Returned']]));return}
 throw Error('यह विकल्प उपलब्ध नहीं है।');
 }catch(e){show(`<p class="v643Error" role="alert">${E(e.message)}</p><button id="v643Retry">Retry</button>`);const retry=box.querySelector('#v643Retry');if(retry)retry.onclick=()=>open(key,s)}
}
function enhance(){$('parentDashboard')?.classList.add('v90ParentShell');
 const header=document.querySelector('#parentDashboard .portalHead');
 if(header&&!header.querySelector('[data-v643-controls]')){const controls=document.createElement('div');controls.dataset.v643Controls='1';controls.className='v643Toolbar';for(const [label,fn] of [['🏠 Home',()=>window.loadParentPortal()],['🔐 Password',()=>window.v54ChangePassword?.()],['👤 Account Profile',()=>window.v97ShowParentProfile?.()]]){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=fn;controls.append(b)}header.append(controls)}
 window.v75ParentBack=()=>{$('v643ParentPanel')?back():window.v63ShowMyChildren?.()};
const body=$('parentDashboardBody');if(!body)return;body.classList.add('v643Scoped');body.querySelectorAll('.parentStudentCard').forEach(card=>{const s=getStudent(card);if(!s)return;
 const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',hour:'numeric',hourCycle:'h23'}).format(new Date()));const greeting=hour<12?'Good Morning':hour<17?'Good Afternoon':'Good Evening';const hero=card.querySelector('.v114PortalHeroText h2');if(hero)hero.textContent=greeting+(String(window.profile?.role)==='student'?', '+s.student_name:', Parent');const date=card.querySelector('.v114PortalHeroText small');if(date)date.textContent=new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',weekday:'long',day:'numeric',month:'short',year:'numeric'}).format(new Date());
 const quick=card.querySelector('.v114PortalQuick');if(quick)quick.innerHTML=actions.map(([k,icon,label])=>`<button type="button" data-parent-action="${k}"><b>${icon}</b><span>${label}</span></button>`).join('');
 card.querySelectorAll('.v114PortalHeroStudent button,.v114ChildInfo button').forEach(b=>{b.removeAttribute('onclick');b.dataset.parentAction='profile'});
 card.querySelectorAll('.v114PortalStats button').forEach((b,i)=>{b.removeAttribute('onclick');b.dataset.parentAction=['profile','attendance','fees','results'][i]});
 });window.v63ApplyParentIsolation?.();
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-parent-action]');if(!b)return;const s=getStudent(b.closest('.parentStudentCard'))||selected;if(!s)return;e.preventDefault();open(b.dataset.parentAction,s)});
const base=window.v643BaseParentLoader;
if(typeof base==='function')window.loadParentPortal=async function(){if(loading)return loading;back();loading=(async()=>{await base();enhance();if(['parent','student'].includes(String(window.profile?.role||'')))window.v643EnforcePassword?.();})().finally(()=>{loading=null});return loading};
window.v643Parent={open,back,enhance,actions:actions.map(x=>x[0])};
})();


/* SOURCE-MIGRATED: v64-3-teacher-handover.js */
/* Replace multi-request handover with one database transaction. */
(()=>{'use strict';
 window.v57DoHandover=async()=>{
 const $=id=>document.getElementById(id),old=$('v57Old')?.value,next=$('v57New')?.value||null,date=$('v57LeaveDate')?.value,reason=$('v57Reason')?.value.trim();
 if(!old||old===next||!date||!reason)return toast('Leaving Teacher, अलग replacement, date और reason भरें।');
 const b=document.querySelector('[onclick="v57DoHandover()"]');if(b?.disabled)return;if(b)b.disabled=true;
 try{const r=await sb.rpc('v643_teacher_handover',{p_old:old,p_new:next,p_date:date,p_reason:reason});if(r.error)throw r.error;toast('Teacher relieved; class, subject और timetable transfer तथा history सुरक्षित है।');await v57TeacherHandover()}catch(e){toast(e.message||String(e))}finally{if(b)b.disabled=false}
 };
})();
/* A relieved/inactive profile must not enter a dashboard with a restored token. */
(()=>{'use strict';const original=window.loadProfile;if(typeof original!=='function')return;window.loadProfile=async function(){const result=await original.apply(this,arguments);const status=String(window.profile?.status||'active').toLowerCase();if(status!=='active'){await sb.auth.signOut();window.user=null;window.profile=null;throw new Error('Account inactive / relieved है। Admin से संपर्क करें।')}return result}})();


/* SOURCE-MIGRATED: v64-3-print.js */
/* Native A4 fee printing: exactly one student per page, measured before print. */
(()=>{'use strict';
 function isFee(id){return !!document.getElementById(id)?.querySelector('.v111FeeNotice')}
 window.v643PrintFeeNotices=function(id){const source=document.getElementById(id);if(!source)return toast('पहले Preview खोलें।');const cards=[...source.querySelectorAll('.v111FeeNotice')];if(!cards.length)return;
 const w=window.open('','_blank','width=1000,height=800');if(!w)return toast('Print preview के लिए popup allow करें।');
 const rules=[];for(const sheet of document.styleSheets){try{for(const rule of sheet.cssRules||[])if(rule.selectorText?.includes('.v111FeeNotice'))rules.push(rule.cssText)}catch(_){}}
 const base=new URL('.',location.href).href.replace(/"/g,'&quot;');w.document.write(`<!doctype html><html><head><meta charset="utf-8"><base href="${base}"><title>Fee Due Notice — A4</title><style>${rules.join('\n')}@page{size:A4 portrait;margin:10mm}*{box-sizing:border-box}html,body{margin:0;padding:0;font-family:Arial,sans-serif;color:#14233b}.paper{position:relative;width:190mm;height:277mm;margin:0 auto;break-after:page;page-break-after:always}.paper:last-child{break-after:auto;page-break-after:auto}.paper .v111FeeNotice{width:190mm!important;min-height:270mm!important;height:auto!important;overflow:visible!important;transform-origin:top left;overflow-wrap:anywhere;page-break-inside:avoid;break-inside:avoid}.toolbar{padding:12px;display:flex;gap:10px}.toolbar button{padding:10px}.v111FeeNotice .head{grid-template-columns:18mm 1fr!important}.v111FeeNotice .tag{grid-column:1/-1;text-align:center}.v111FeeNotice .foot{margin-top:12mm}@media print{.toolbar{display:none!important}body{background:#fff}.paper{margin:0}}</style></head><body><div class="toolbar"><button id="print" disabled>Preparing…</button><span id="status"></span></div>${cards.map(c=>'<section class="paper">'+c.outerHTML+'</section>').join('')}</body></html>`);w.document.close();
 const fit=()=>{for(const paper of w.document.querySelectorAll('.paper')){const c=paper.firstElementChild;c.style.transform='';const scale=Math.min(1,(paper.clientHeight-2)/c.scrollHeight,(paper.clientWidth-2)/c.scrollWidth);c.style.transform=`scale(${scale})`;}w.document.getElementById('print').disabled=false;w.document.getElementById('print').textContent='Print / Save PDF';w.document.getElementById('status').textContent=cards.length+' student(s) • '+cards.length+' A4 page(s)';};
 w.document.getElementById('print').onclick=()=>{fit();w.print()};w.addEventListener('beforeprint',fit);
 Promise.all([...w.document.images].map(img=>img.complete?Promise.resolve():new Promise(r=>{img.onload=r;img.onerror=r}))).then(fit);w.setTimeout(fit,1500);
 };
 const print=window.v14Print,pdf=window.v14Pdf;
 if(typeof print==='function')window.v14Print=function(id){return isFee(id)?window.v643PrintFeeNotices(id):print.apply(this,arguments)};
 if(typeof pdf==='function')window.v14Pdf=function(id){return isFee(id)?window.v643PrintFeeNotices(id):pdf.apply(this,arguments)};
})();
