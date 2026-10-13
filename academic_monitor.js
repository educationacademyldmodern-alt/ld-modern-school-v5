/* ==========================================================
L D MODERN EDUCATION ACADEMY
V267 — TEACHER-CENTRIC ACADEMIC MONITORING CENTER
Central sources: timetable + teaching_diary + syllabus_master.
New state only: copy checking + bell tests + principal audit.
No polling / realtime / cron.
========================================================== */
(function(){
'use strict';
if(window.__LDM_V265_ACADEMIC)return;
window.__LDM_V265_ACADEMIC=true;
window.LDM_FINAL_BUILD='V267-TEACHER-CENTRIC-ACADEMIC-2026-10-08';

const $=id=>document.getElementById(id);
const E=v=>typeof window.v90Safe==='function'?window.v90Safe(v):typeof window.esc==='function'?window.esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const role=()=>String(window.profile?.role||'').trim().toLowerCase();
const isAdmin=()=>['admin','super_admin','principal'].includes(role());
const isTeacher=()=>role()==='teacher';
const uid=()=>String(window.user?.id||'');
const db=()=>typeof sb!=='undefined'?sb:window.sb;
const session=()=>String(window.school?.academic_session||window.school?.current_session||(typeof window.v90Session==='function'?window.v90Session():'2026-27'));
const CLASS_ORDER=['Nursery','LKG','UKG','1','2','3','4','5','6','7','8','9','10'];
const state={days:30,className:'',subject:'',teacher:'',date:'',view:'progress',diary:[],copy:[],tests:[],syllabus:[],timetable:[],teachers:[],students:[],attendance:null,adminSummary:[],adminSummaryError:'',detailLoaded:false,loaded:false};
window.__v265Academic=state;

function indiaYMD(d=new Date()){
  const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
  const z=Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return `${z.year}-${z.month}-${z.day}`;
}
function addDays(s,n){let d=new Date(s+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}
function dayName(s){return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(s+'T12:00:00+05:30').getDay()]}
function cls(v){let original=String(v??'').trim(),x=original.toLowerCase().replace(/[^a-z0-9]/g,'');if(['nursery','nur'].includes(x))return'Nursery';if(x==='lkg')return'LKG';if(x==='ukg')return'UKG';x=x.replace(/^class/,'');if(/^\d{1,2}$/.test(x))return String(Number(x));return original}
function classIndex(v){let i=CLASS_ORDER.indexOf(cls(v));return i<0?999:i}
function norm(v){return String(v??'').trim().toLowerCase()}
function n(v){return Number.isFinite(Number(v))?Number(v):0}
function pct(a,b){return b>0?Math.max(0,Math.min(100,Math.round((a/b)*100))):0}
function dateLabel(s){try{return new Date(s+'T00:00:00+05:30').toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}catch(_e){return s}}
function timeLabel(t){t=String(t||'').slice(0,5);if(!t)return'—';try{return new Date('2000-01-01T'+t+':00+05:30').toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:'Asia/Kolkata'})}catch(_e){return t}}
function keyLesson(x){let l=n(x.lesson_no);return [String(x.teacher_user_id||''),cls(x.class_name),norm(x.subject),l||norm(x.topic)].join('|')}
function keyBell(x,date=x.teaching_date||x.test_date){return [String(x.teacher_user_id||''),String(date||''),n(x.period_no)].join('|')}
function statusClass(s){s=norm(s);return s.includes('urgent')||s.includes('not taken')?'bad':s.includes('attention')||s.includes('partial')||s.includes('planned')||s.includes('rescheduled')||s.includes('pending')?'warn':'ok'}
function routeHead(title,sub){
  try{window.v90Head?.(title,sub)}catch(_e){try{window.head?.(title,sub)}catch(__e){}}
  try{window.v90InstallShell?.('academic_monitor')}catch(_e){}
  window.__v90Route='academic_monitor';
}
function injectStyle(){
 if($('ldm-v265-style'))return;
 const s=document.createElement('style');s.id='ldm-v265-style';s.textContent=`
 .v265Page{display:grid;gap:12px}.v265Hero{background:linear-gradient(135deg,#082c59,#0b70bf 55%,#0c9b87);color:#fff;border-radius:22px;padding:18px;box-shadow:0 16px 38px #092d5720}.v265Hero h2{margin:3px 0 5px}.v265Hero p{margin:0;color:#eef7ff}
 .v265Toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:end}.v265Toolbar label{display:grid;gap:4px;font-size:11px;font-weight:850;color:#40566e}.v265Toolbar select,.v265Toolbar input{min-height:42px;border:1px solid #cfdae6;border-radius:10px;padding:8px;background:#fff;min-width:135px}
 .v265Tabs{display:flex;gap:7px;overflow:auto;padding:2px}.v265Tabs button{white-space:nowrap}.v265Tabs button.active{background:#0a5fa5;color:#fff}
 .v265Stats{display:grid;grid-template-columns:repeat(6,1fr);gap:9px}.v265Stat{background:#fff;border:1px solid #dbe6ef;border-radius:15px;padding:12px}.v265Stat small,.v265Stat b{display:block}.v265Stat b{font-size:22px;color:#123f70;margin-top:4px}.v265Stat.bad b{color:#b42318}.v265Stat.warn b{color:#9a5b00}.v265Stat.ok b{color:#087a51}
 .v265GraphGrid{display:grid;grid-template-columns:1.2fr .8fr;gap:12px}.v265Panel{background:#fff;border:1px solid #dbe6ef;border-radius:17px;padding:13px;overflow:hidden}.v265Panel h3{margin:0 0 8px;color:#173f70}.v265Sub{color:#63778b;font-size:11px}
 .v265Bars{display:grid;gap:11px}.v265BarRow{display:grid;grid-template-columns:minmax(140px,1fr) 2.1fr;gap:10px;align-items:center}.v265BarLabel b,.v265BarLabel small{display:block}.v265BarLabel small{color:#647689}.v265BarStack{display:grid;gap:5px}.v265Track{height:11px;background:#edf2f7;border-radius:999px;overflow:hidden;position:relative}.v265Fill{height:100%;border-radius:999px}.v265Fill.taught{background:linear-gradient(90deg,#1d6ed3,#5aa7ff)}.v265Fill.checked{background:linear-gradient(90deg,#0b9d73,#45c59e)}.v265Fill.verified{background:linear-gradient(90deg,#7c4ed8,#ae82ff)}.v265Legend{display:flex;gap:12px;flex-wrap:wrap;margin:7px 0 12px;font-size:10px;font-weight:800;color:#566b80}.v265Legend i{width:9px;height:9px;border-radius:50%;display:inline-block;margin-right:4px}.v265Legend .t{background:#3786df}.v265Legend .c{background:#1fad83}.v265Legend .v{background:#8d5de3}
 .v265Donuts{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.v265Donut{display:grid;place-items:center;gap:5px}.v265Ring{--p:0;--ring:#1682d8;width:96px;height:96px;border-radius:50%;background:conic-gradient(var(--ring) calc(var(--p)*1%),#e9eff5 0);display:grid;place-items:center;position:relative}.v265Ring:after{content:"";position:absolute;inset:10px;border-radius:50%;background:#fff}.v265Ring b{position:relative;z-index:1;font-size:21px;color:#193f6b}.v265Donut small{text-align:center;color:#607287;font-weight:800}
 .v265Heat{display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:8px}.v265HeatCell{border:1px solid #dfe6ec;border-radius:13px;padding:10px;text-align:left;background:#f7f9fb}.v265HeatCell.ok{background:#e9f9f1;border-color:#bce7d0}.v265HeatCell.warn{background:#fff7e5;border-color:#f5d58b}.v265HeatCell.bad{background:#fff0ed;border-color:#efb9ae}.v265HeatCell b,.v265HeatCell small{display:block}.v265HeatCell small{margin-top:3px;color:#5f7080}
 .v265Trend{display:flex;align-items:end;gap:7px;height:170px;padding:12px 4px 0}.v265TrendDay{flex:1;min-width:34px;display:flex;gap:3px;align-items:end;justify-content:center;height:130px;border-bottom:1px solid #dce4ec;position:relative}.v265TrendDay i{width:10px;border-radius:5px 5px 0 0;min-height:2px}.v265TrendDay .a{background:#3b86de}.v265TrendDay .b{background:#22ad83}.v265TrendDay .c{background:#8e61db}.v265TrendDay span{position:absolute;bottom:-22px;font-size:9px;color:#66788b}
 .v265BellGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:9px}.v265Bell{background:#fff;border:1px solid #dbe5ef;border-left:5px solid #7f8fa1;border-radius:15px;padding:12px}.v265Bell.ok{border-left-color:#15a56e}.v265Bell.warn{border-left-color:#e2a11a}.v265Bell.bad{border-left-color:#d54c3f}.v265BellTop{display:flex;justify-content:space-between;gap:8px}.v265Bell h3{margin:0;color:#153f6c}.v265Badge{display:inline-flex;padding:4px 7px;border-radius:999px;background:#edf3f8;color:#435a70;font-size:10px;font-weight:850;margin:3px 3px 0 0}.v265Badge.ok{background:#e6f8ef;color:#087248}.v265Badge.warn{background:#fff4d9;color:#895300}.v265Badge.bad{background:#ffebe7;color:#a62c1d}.v265Bell p{font-size:12px;color:#52677a;line-height:1.5}.v265Actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.v265Actions button{min-height:38px}
 .v265Matrix{overflow:auto}.v265Matrix table{min-width:920px}.v265TestTaken{background:#e8f8ef}.v265TestPlan{background:#fff7df}.v265TestNo{background:#ffefeb}.v265TestPending{background:#f2f4f6}
 .v265Lesson{border:1px solid #dce5ed;border-radius:14px;padding:10px;margin:8px 0;background:#fff}.v265LessonTop{display:flex;justify-content:space-between;gap:8px;align-items:start}.v265Lesson h4{margin:0;color:#173f6e}.v265Lesson small{color:#65788b}.v265Gap{font-weight:900}.v265Gap.bad{color:#b72e20}.v265Gap.warn{color:#955900}.v265Gap.ok{color:#08754c}
 .v265ModalBack{position:fixed;inset:0;background:#061727a8;z-index:9999998;display:grid;place-items:center;padding:16px}.v265Modal{width:min(720px,97vw);max-height:90vh;overflow:auto;background:#fff;border-radius:22px;padding:18px;box-shadow:0 25px 70px #0007}.v265Modal h2{margin:0 0 10px;color:#153f6d}.v265Form{display:grid;grid-template-columns:1fr 1fr;gap:9px}.v265Form label{display:grid;gap:4px;font-size:11px;font-weight:850;color:#40566d}.v265Form input,.v265Form select,.v265Form textarea{min-height:42px;border:1px solid #ccd9e5;border-radius:10px;padding:8px;font:inherit}.v265Form textarea{min-height:78px}.v265Form .full{grid-column:1/-1}.v265Roster{max-height:250px;overflow:auto;border:1px solid #dce5ed;border-radius:12px;padding:7px}.v265Roster label{display:flex!important;align-items:center;gap:7px;padding:6px;border-bottom:1px solid #edf1f5}.v265Roster input{width:auto;min-height:auto}
 .v265Dash{margin:10px 0;padding:11px;border:1px solid #cfe2f2;border-radius:15px;background:linear-gradient(135deg,#f4faff,#fff);display:flex;align-items:center;justify-content:space-between;gap:10px}.v265Dash b,.v265Dash small{display:block}.v265Dash b{color:#154777}.v265Dash small{color:#64788b}
 .v267AdminLauncher{margin:10px 0;padding:14px;border:1px solid #bcdcf2;border-radius:17px;background:linear-gradient(135deg,#eef8ff,#f8fffc);display:flex;align-items:center;justify-content:space-between;gap:12px;text-align:left;box-shadow:0 8px 22px #0b508814}.v267AdminLauncher b,.v267AdminLauncher small{display:block}.v267AdminLauncher b{font-size:15px;color:#0c4477}.v267AdminLauncher small{margin-top:3px;color:#597287}
 .v267TeacherFocus{background:linear-gradient(135deg,#0d3c72,#0b7e9a);color:#fff;border-radius:17px;padding:14px;margin-bottom:10px}.v267TeacherFocus h3{margin:0 0 5px;color:#fff}.v267TeacherFocus p{margin:3px 0;color:#eef9ff}.v267TeacherFocus .v265Badge{background:#ffffff20;color:#fff;border:1px solid #ffffff2c}
 .v267CompareGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px}.v267TeacherCard{background:#fff;border:1px solid #d8e5ef;border-radius:16px;padding:12px;text-align:left;box-shadow:0 6px 16px #12365a0b}.v267TeacherCard.attn{border-left:5px solid #e5a11b}.v267TeacherCard.bad{border-left:5px solid #d74a3b}.v267TeacherCard.ok{border-left:5px solid #16a56e}.v267TeacherCard h3{margin:0 0 4px;color:#153f6c}.v267TeacherCard small{color:#65798c}.v267MiniBars{display:grid;gap:5px;margin:9px 0}.v267MiniBar{display:grid;grid-template-columns:76px 1fr 38px;gap:6px;align-items:center;font-size:10px;color:#566c80}.v267MiniBar i{height:8px;border-radius:999px;background:#edf2f6;overflow:hidden}.v267MiniBar em{display:block;height:100%;border-radius:999px;background:#2581d6}.v267MiniBar:nth-child(2) em{background:#1da97d}.v267MiniBar:nth-child(3) em{background:#8a5bda}.v267SelectBig select{min-width:240px;border:2px solid #1780c5!important;font-weight:850;color:#17486f}
 @media(max-width:900px){.v265Stats{grid-template-columns:repeat(3,1fr)}.v265GraphGrid{grid-template-columns:1fr}.v265BarRow{grid-template-columns:1fr}.v265Donuts{grid-template-columns:repeat(3,1fr)}}
 @media(max-width:560px){.v265Stats{grid-template-columns:1fr 1fr}.v265Donuts{grid-template-columns:1fr 1fr 1fr}.v265Ring{width:76px;height:76px}.v265Ring:after{inset:8px}.v265Ring b{font-size:17px}.v265Form{grid-template-columns:1fr}.v265Form .full{grid-column:auto}.v265Toolbar>*{flex:1 1 140px}}
 `;
 document.head.appendChild(s);
}
injectStyle();

function setMain(html){const h=$('erpContent');if(h)h.innerHTML=html}
function tabButton(id,label){return `<button class="${state.view===id?'active':''}" onclick="v265Switch('${id}')">${label}</button>`}
function classOpts(){
 const vals=[...new Set(state.diary.map(x=>cls(x.class_name)).concat(state.timetable.map(x=>cls(x.class_name))).filter(Boolean))].sort((a,b)=>classIndex(a)-classIndex(b)||a.localeCompare(b,undefined,{numeric:true}));
 return `<option value="">All Classes</option>${vals.map(x=>`<option value="${E(x)}" ${state.className===x?'selected':''}>${E(x)}</option>`).join('')}`;
}
function subjectOpts(){
 let rows=filteredDiary(false);const vals=[...new Set(rows.map(x=>String(x.subject||'').trim()).filter(Boolean))].sort();
 return `<option value="">All Subjects</option>${vals.map(x=>`<option value="${E(x)}" ${state.subject===x?'selected':''}>${E(x)}</option>`).join('')}`;
}
function teacherOpts(){
 let vals=(state.teachers||[]).filter(x=>x.auth_user_id&&x.is_active!==false&&(!x.approval_status||norm(x.approval_status)==='approved')).map(x=>[String(x.auth_user_id),String(x.teacher_name||x.full_name||'Teacher')]);
 vals=[...new Map(vals).entries()].sort((a,b)=>a[1].localeCompare(b[1]));
 return `<option value="">All Teachers — Comparison</option>${vals.map(x=>`<option value="${E(x[0])}" ${state.teacher===x[0]?'selected':''}>${E(x[1])}</option>`).join('')}`;
}
function toolbar(){
 return `<div class="v265Toolbar">
  ${isAdmin()?`<label class="v267SelectBig">👨‍🏫 Select Teacher<select id="v265Teacher" onchange="v267SelectTeacher(this.value)">${teacherOpts()}</select></label>`:''}
  <label>Period<select id="v265Days" onchange="v265Filter()"><option value="7" ${state.days===7?'selected':''}>Last 7 Days</option><option value="30" ${state.days===30?'selected':''}>Last 30 Days</option><option value="90" ${state.days===90?'selected':''}>Last 90 Days</option></select></label>
  ${isAdmin()&&state.teacher&&state.detailLoaded?`<label>Class<select id="v265Class" onchange="v265Filter('class')">${classOpts()}</select></label><label>Subject<select id="v265Subject" onchange="v265Filter()">${subjectOpts()}</select></label><button onclick="v267ClearTeacher()">👥 All Teachers</button>`:''}
  <button class="primary" onclick="v265Reload()">↻ Refresh</button>
 </div>`;
}
function shell(){
 return `<div class="v265Page">
  <section class="v265Hero"><small>${isAdmin()?'PRINCIPAL / ADMIN ACADEMIC CONTROL':'CENTRAL ACADEMIC QUALITY CONTROL'}</small><h2>${isAdmin()?'📊 Teacher Academic Analysis':'📊 Teaching Progress & Copy Checking Monitor'}</h2><p>${isAdmin()?'Select Teacher → Class → Subject → Lesson → Pending Students':'Teaching → Copy Checking → Learning Verified → Bell Test • Central Timetable + Daily Teaching data'}</p></section>
  <div class="v265Tabs">${tabButton('progress','📈 Progress Graph')}${tabButton('bells','🔔 Bell Performance')}${tabButton('tests','📝 Class Test Monitor')}${tabButton('lessons','📚 Lesson / Copy Check')}${isAdmin()?tabButton('audit','🔎 Principal Audit'):''}</div>
  <section class="v265Panel">${toolbar()}</section>
  <div id="v265Body"><div class="empty">Loading central academic data…</div></div>
 </div>`;
}

window.v265AcademicCenter=async function(){
 if(!isAdmin()&&!isTeacher())return window.toast?.('Admin / Teacher only');
 routeHead(isTeacher()?'📊 My Teaching Performance':'📊 Teacher Academic Analysis',isTeacher()?'My Bells • Teaching • Copy Checking • Class Tests':'Select one Teacher → complete syllabus, checking, tests and bell analysis');
 setMain(shell());
 await loadAll(true);
 setMain(shell());
 renderCurrent();
 if(isTeacher())armBellReminder();
};

function rangeStart(){return addDays(indiaYMD(),-(state.days-1))}
async function safe(table,cols='*',build=null){
 let q=db().from(table).select(cols);if(build)q=build(q);let r=await q;if(r.error)throw r.error;return r.data||[];
}
async function safeMaybe(table,cols='*',build=null){
 try{return await safe(table,cols,build)}catch(_e){return null}
}
async function loadAll(force=false){
 const end=indiaYMD(),start=rangeStart();
 try{
  if(isTeacher()){
   await window.v14LoadTeacherContext?.();
   const name=String(window.v14TeacherProfile?.teacher_name||window.profile?.full_name||'').trim();
   const [di,cp,te,sy,tt,at]=await Promise.all([
    safe('teaching_diary','*',q=>q.eq('teacher_user_id',uid()).gte('teaching_date',start).lte('teaching_date',end).order('teaching_date',{ascending:false}).limit(3000)),
    safe('ldm_v265_copy_checks','*',q=>q.eq('teacher_user_id',uid()).gte('teaching_date',start).lte('teaching_date',end).order('teaching_date',{ascending:false}).limit(3000)),
    safe('ldm_v265_bell_tests','*',q=>q.eq('teacher_user_id',uid()).gte('test_date',start).lte('test_date',end).order('test_date',{ascending:false}).limit(3000)),
    safe('syllabus_master','*',q=>q.eq('academic_session',session()).limit(1000)),
    safe('timetable','*',q=>q.eq('teacher_name',name).order('day_name').order('period_no').limit(500)),
    safeMaybe('attendance','admission_no,class_name,status,date',q=>q.eq('date',end).limit(6000))
   ]);
   state.diary=di;state.copy=cp;state.tests=te;state.syllabus=sy;state.timetable=tt;state.attendance=at;state.detailLoaded=true;
  }else{
   // ADMIN PERFORMANCE RULE: initial open never pulls school-wide diary/copy/test/timetable rows.
   // Only Teacher Master + one server-side aggregate RPC. Teacher detail is loaded on selection.
   const tp=await safe('teacher_profiles','id,auth_user_id,teacher_name,full_name,approval_status,is_active',q=>q.order('teacher_name').limit(3000));
   state.teachers=tp;state.diary=[];state.copy=[];state.tests=[];state.syllabus=[];state.timetable=[];state.attendance=null;state.detailLoaded=false;
   state.adminSummary=[];state.adminSummaryError='';
   try{
    const sr=await db().rpc('ldm_v267_teacher_academic_summary',{p_days:state.days,p_session:session()});
    if(sr.error)throw sr.error;
    state.adminSummary=sr.data||[];
   }catch(e){
    state.adminSummaryError=String(e?.message||e);
    // Comparison may be unavailable before V267 SQL, but teacher-specific analysis still works.
   }
   if(state.teacher)await loadAdminTeacherDetail(state.teacher);
  }
  state.loaded=true;
 }catch(e){
  const b=$('v265Body');if(b)b.innerHTML=`<div class="dangerNote">${E(e?.message||e)}</div>`;
  throw e;
 }
}
async function loadAdminTeacherDetail(teacherId){
 if(!isAdmin()||!teacherId)return;
 const tp=(state.teachers||[]).find(x=>String(x.auth_user_id||'')===String(teacherId));
 if(!tp)throw new Error('Teacher Master mapping नहीं मिला.');
 const name=String(tp.teacher_name||tp.full_name||'').trim(),end=indiaYMD(),start=rangeStart();
 const [di,cp,te,tt]=await Promise.all([
  safe('teaching_diary','*',q=>q.eq('teacher_user_id',teacherId).gte('teaching_date',start).lte('teaching_date',end).order('teaching_date',{ascending:false}).limit(2500)),
  safe('ldm_v265_copy_checks','*',q=>q.eq('teacher_user_id',teacherId).gte('teaching_date',start).lte('teaching_date',end).order('teaching_date',{ascending:false}).limit(2500)),
  safe('ldm_v265_bell_tests','*',q=>q.eq('teacher_user_id',teacherId).gte('test_date',start).lte('test_date',end).order('test_date',{ascending:false}).limit(2500)),
  safe('timetable','*',q=>q.eq('teacher_name',name).order('day_name').order('period_no').limit(700))
 ]);
 const classSet=[...new Set(tt.map(x=>cls(x.class_name)).filter(Boolean))];
 let sy=[];
 if(classSet.length){
   // Small master only; fetch the session once and normalize class aliases in JS.
   // This avoids LKG/UKG/"Class 1" alias misses.
   let qr=db().from('syllabus_master').select('*').eq('academic_session',session()).limit(1500);
   let rr=await qr;if(rr.error)throw rr.error;sy=(rr.data||[]).filter(x=>classSet.includes(cls(x.class_name)));
 }
 state.diary=di;state.copy=cp;state.tests=te;state.timetable=tt;state.syllabus=sy;state.attendance=null;state.detailLoaded=true;
}
window.v267SelectTeacher=async function(id){
 state.teacher=String(id||'');state.className='';state.subject='';state.view='progress';
 if(!state.teacher){state.detailLoaded=false;state.diary=[];state.copy=[];state.tests=[];state.timetable=[];state.syllabus=[];setMain(shell());return renderCurrent()}
 const b=$('v265Body');if(b)b.innerHTML='<div class="empty">Selected Teacher का academic analysis loading…</div>';
 try{await loadAdminTeacherDetail(state.teacher);setMain(shell());renderCurrent()}catch(e){window.toast?.(e?.message||String(e));setMain(shell());renderCurrent()}
};
window.v267ClearTeacher=function(){state.teacher='';state.className='';state.subject='';state.detailLoaded=false;state.diary=[];state.copy=[];state.tests=[];state.timetable=[];state.syllabus=[];setMain(shell());renderCurrent()};
window.v265Reload=async function(){state.loaded=false;await loadAll(true);setMain(shell());renderCurrent();if(isTeacher())armBellReminder()};

window.v265Filter=function(kind=''){
 const d=n($('v265Days')?.value||30);if(d&&d!==state.days){state.days=d;return window.v265Reload()}
 if(isAdmin()&&state.teacher){
  state.className=String($('v265Class')?.value||'');state.subject=String($('v265Subject')?.value||'');
  if(kind==='class'){const s=$('v265Subject');if(s)s.innerHTML=subjectOpts()}
 }
 renderCurrent();
};
window.v265Switch=function(v){state.view=v;const root=$('erpContent');if(root){root.querySelectorAll('.v265Tabs button').forEach(b=>b.classList.remove('active'));[...root.querySelectorAll('.v265Tabs button')].find(b=>String(b.getAttribute('onclick')||'').includes(`'${v}'`))?.classList.add('active')}renderCurrent()};

function filteredDiary(applySubject=true){
 let rows=state.diary.slice();
 if(state.className)rows=rows.filter(x=>cls(x.class_name)===state.className);
 if(applySubject&&state.subject)rows=rows.filter(x=>String(x.subject||'')===state.subject);
 if(state.teacher)rows=rows.filter(x=>String(x.teacher_user_id||'')===state.teacher);
 return rows;
}
function filteredCopy(){
 let rows=state.copy.slice();
 if(state.className)rows=rows.filter(x=>cls(x.class_name)===state.className);
 if(state.subject)rows=rows.filter(x=>String(x.subject||'')===state.subject);
 if(state.teacher)rows=rows.filter(x=>String(x.teacher_user_id||'')===state.teacher);
 return rows;
}
function filteredTests(dateOnly=''){
 let rows=state.tests.slice();
 if(state.className)rows=rows.filter(x=>cls(x.class_name)===state.className);
 if(state.subject)rows=rows.filter(x=>String(x.subject||'')===state.subject);
 if(state.teacher)rows=rows.filter(x=>String(x.teacher_user_id||'')===state.teacher);
 if(dateOnly)rows=rows.filter(x=>String(x.test_date)===dateOnly);
 return rows;
}
function uniqueLessons(rows){
 const m=new Map();rows.forEach(x=>{if(!x.topic&&!n(x.lesson_no))return;let k=keyLesson(x),old=m.get(k);if(!old||String(x.teaching_date)>String(old.teaching_date))m.set(k,x)});return [...m.values()];
}
function copyMap(){let m=new Map();filteredCopy().forEach(x=>m.set(keyLesson(x),x));return m}
function syllabusTotal(c,s){
 let x=state.syllabus.find(z=>cls(z.class_name)===cls(c)&&norm(z.subject)===norm(s));return n(x?.total_lessons);
}
function groupMetrics(){
 const lessons=uniqueLessons(filteredDiary()),cm=copyMap(),g=new Map();
 lessons.forEach(x=>{
  const key=[cls(x.class_name),String(x.subject||''),String(x.teacher_user_id||'')].join('|');
  let z=g.get(key);if(!z){z={class_name:cls(x.class_name),subject:String(x.subject||''),teacher_user_id:String(x.teacher_user_id||''),teacher_name:String(x.teacher_name||'Teacher'),taught:0,full:0,partial:0,unchecked:0,verified:0,totalStudents:0,checkedStudents:0,oldestPending:''};g.set(key,z)}
  z.taught++;
  const c=cm.get(keyLesson(x));
  if(c){
   z.totalStudents+=n(c.total_students);z.checkedStudents+=n(c.checked_students);
   if(n(c.total_students)>0&&n(c.checked_students)>=n(c.total_students))z.full++;
   else if(n(c.checked_students)>0)z.partial++;else z.unchecked++;
   if(norm(c.learning_status)==='verified')z.verified++;
  }else z.unchecked++;
  if(!c||n(c.checked_students)<n(c.total_students)){if(!z.oldestPending||String(x.teaching_date)<z.oldestPending)z.oldestPending=String(x.teaching_date||'')}
 });
 // Include assigned Class/Subject even when Teacher has taught 0 lessons in selected period.
 (state.timetable||[]).forEach(r=>{
   if(state.className&&cls(r.class_name)!==state.className)return;
   if(state.subject&&String(r.subject||'')!==state.subject)return;
   const tu=isTeacher()?uid():(state.teacher||bellTeacherUid(r)||'');
   if(state.teacher&&tu&&String(tu)!==String(state.teacher))return;
   const key=[cls(r.class_name),String(r.subject||''),String(tu||'')].join('|');
   if(!g.has(key))g.set(key,{class_name:cls(r.class_name),subject:String(r.subject||''),teacher_user_id:String(tu||''),teacher_name:String(r.teacher_name||selectedTeacherName()||'Teacher'),taught:0,full:0,partial:0,unchecked:0,verified:0,totalStudents:0,checkedStudents:0,oldestPending:''});
 });
 return [...g.values()].map(x=>({...x,totalLessons:syllabusTotal(x.class_name,x.subject),checkRate:pct(x.full,x.taught),studentCheckRate:pct(x.checkedStudents,x.totalStudents),verifyRate:pct(x.verified,x.taught),gap:x.taught-x.full})).sort((a,b)=>b.gap-a.gap||classIndex(a.class_name)-classIndex(b.class_name)||a.subject.localeCompare(b.subject));
}
function globalMetrics(){
 const g=groupMetrics(),taught=g.reduce((a,x)=>a+x.taught,0),full=g.reduce((a,x)=>a+x.full,0),partial=g.reduce((a,x)=>a+x.partial,0),unchecked=g.reduce((a,x)=>a+x.unchecked,0),verified=g.reduce((a,x)=>a+x.verified,0);
 return {taught,full,partial,unchecked,verified,gap:taught-full,checkRate:pct(full,taught),verifyRate:pct(verified,taught)};
}
function summaryStats(m){
 return `<div class="v265Stats"><div class="v265Stat"><small>Lessons Taught</small><b>${m.taught}</b></div><div class="v265Stat ok"><small>Fully Checked</small><b>${m.full}</b></div><div class="v265Stat warn"><small>Partial</small><b>${m.partial}</b></div><div class="v265Stat bad"><small>Not Checked</small><b>${m.unchecked}</b></div><div class="v265Stat"><small>Learning Verified</small><b>${m.verified}</b></div><div class="v265Stat ${m.gap?'bad':'ok'}"><small>Checking Gap</small><b>${m.gap}</b></div></div>`;
}
function ring(p,label,color){return `<div class="v265Donut"><div class="v265Ring" style="--p:${p};--ring:${color}"><b>${p}%</b></div><small>${E(label)}</small></div>`}
function progressBars(g){
 let rows=g.slice(0,30);return `<div class="v265Legend"><span><i class="t"></i>Teaching</span><span><i class="c"></i>Fully Checked</span><span><i class="v"></i>Verified</span></div><div class="v265Bars">${rows.map(x=>{
   const denom=x.totalLessons>0?x.totalLessons:Math.max(x.taught,1),tp=pct(x.taught,denom),cp=pct(x.full,Math.max(x.taught,1)),vp=pct(x.verified,Math.max(x.taught,1));
   return `<button class="v265BarRow" onclick="v265OpenGroup('${E(x.class_name)}','${E(x.subject)}','${E(x.teacher_user_id)}')"><span class="v265BarLabel"><b>Class ${E(x.class_name)} • ${E(x.subject)}</b><small>${E(x.teacher_name)} • Taught ${x.taught}${x.totalLessons?'/'+x.totalLessons:''} • Gap ${x.gap}</small></span><span class="v265BarStack"><i class="v265Track"><i class="v265Fill taught" style="width:${tp}%"></i></i><i class="v265Track"><i class="v265Fill checked" style="width:${cp}%"></i></i><i class="v265Track"><i class="v265Fill verified" style="width:${vp}%"></i></i></span></button>`;
 }).join('')||'<div class="empty">No teaching data in selected period.</div>'}</div>`;
}
function weeklyTrend(){
 const end=indiaYMD(),days=[...Array(7)].map((_,i)=>addDays(end,i-6)),di=filteredDiary(),cm=filteredCopy(),te=filteredTests();
 const vals=days.map(d=>({d,t:di.filter(x=>x.teaching_date===d).length,c:cm.filter(x=>x.checked_date===d||x.teaching_date===d&&n(x.checked_students)>=n(x.total_students)&&n(x.total_students)>0).length,q:te.filter(x=>x.test_date===d&&x.status==='Taken').length}));
 const mx=Math.max(1,...vals.flatMap(x=>[x.t,x.c,x.q]));
 return `<div class="v265Legend"><span><i class="t"></i>Teaching Updates</span><span><i class="c"></i>Full Checks</span><span><i class="v"></i>Tests Taken</span></div><div class="v265Trend">${vals.map(x=>`<div class="v265TrendDay"><i class="a" title="Teaching ${x.t}" style="height:${Math.max(2,Math.round(x.t/mx*110))}px"></i><i class="b" title="Checks ${x.c}" style="height:${Math.max(2,Math.round(x.c/mx*110))}px"></i><i class="c" title="Tests ${x.q}" style="height:${Math.max(2,Math.round(x.q/mx*110))}px"></i><span>${new Date(x.d+'T12:00:00').toLocaleDateString('en-IN',{weekday:'short'})}</span></div>`).join('')}</div>`;
}
function heatmap(g){
 return `<div class="v265Heat">${g.map(x=>{let cl=x.checkRate>=80?'ok':x.checkRate>=50?'warn':'bad';return `<button class="v265HeatCell ${cl}" onclick="v265OpenGroup('${E(x.class_name)}','${E(x.subject)}','${E(x.teacher_user_id)}')"><b>Class ${E(x.class_name)} • ${E(x.subject)}</b><small>${E(x.teacher_name)}</small><small>Checked ${x.checkRate}% • Verified ${x.verifyRate}% • Gap ${x.gap}</small></button>`}).join('')||'<div class="empty">No data.</div>'}</div>`;
}

function selectedTeacherProfile(){return (state.teachers||[]).find(x=>String(x.auth_user_id||'')===String(state.teacher||''))||null}
function selectedTeacherName(){const t=selectedTeacherProfile();return String(t?.teacher_name||t?.full_name||state.diary?.[0]?.teacher_name||'Teacher')}
function teacherFocus(){
 if(!isAdmin()||!state.teacher)return '';
 const classes=[...new Set((state.timetable||[]).map(x=>cls(x.class_name)).filter(Boolean))].sort((a,b)=>classIndex(a)-classIndex(b));
 const subjects=[...new Set((state.timetable||[]).map(x=>String(x.subject||'').trim()).filter(Boolean))].sort();
 return `<section class="v267TeacherFocus"><small>SELECTED TEACHER</small><h3>👨‍🏫 ${E(selectedTeacherName())}</h3><p>${classes.length?`Classes: ${E(classes.join(', '))}`:'No timetable class mapped'} • ${subjects.length?`Subjects: ${E(subjects.join(', '))}`:'No subject mapped'} • ${state.timetable.length} weekly bell rows</p><div><span class="v265Badge">${state.days} day analysis</span><span class="v265Badge">Central Timetable</span><span class="v265Badge">Daily Teaching</span></div></section>`;
}
function renderAdminLanding(){
 const rows=(state.adminSummary||[]).slice().sort((a,b)=>n(b.checking_gap)-n(a.checking_gap)||n(a.copy_check_rate)-n(b.copy_check_rate)||String(a.teacher_name||'').localeCompare(String(b.teacher_name||'')));
 const totalTeachers=(state.teachers||[]).filter(x=>x.auth_user_id&&x.is_active!==false).length;
 const taught=rows.reduce((a,x)=>a+n(x.lessons_taught),0),checked=rows.reduce((a,x)=>a+n(x.fully_checked),0),tests=rows.reduce((a,x)=>a+n(x.tests_taken),0);
 const cards=rows.length?rows.map(x=>{
   const taughtN=n(x.lessons_taught),full=n(x.fully_checked),ver=n(x.learning_verified),gap=n(x.checking_gap),cr=n(x.copy_check_rate),vr=n(x.verify_rate),testRate=n(x.test_coverage_rate);
   const st=gap>=3||cr<50?'bad':gap>0||cr<80?'attn':'ok';
   return `<button class="v267TeacherCard ${st}" onclick="v267SelectTeacher('${E(x.teacher_user_id)}')"><h3>👨‍🏫 ${E(x.teacher_name||'Teacher')}</h3><small>Taught ${taughtN} • Full Check ${full} • Gap ${gap} • Tests ${n(x.tests_taken)}</small><div class="v267MiniBars"><div class="v267MiniBar"><span>Copy Check</span><i><em style="width:${cr}%"></em></i><b>${cr}%</b></div><div class="v267MiniBar"><span>Verified</span><i><em style="width:${vr}%"></em></i><b>${vr}%</b></div><div class="v267MiniBar"><span>Test</span><i><em style="width:${testRate}%"></em></i><b>${testRate}%</b></div></div><span class="v265Badge ${st==='bad'?'bad':st==='attn'?'warn':'ok'}">${st==='bad'?'Urgent Review':st==='attn'?'Needs Attention':'Good'}</span><span class="v265Badge">Open Full Analysis →</span></button>`;
 }).join(''):`<div class="empty">${state.adminSummaryError?'All-teacher comparison RPC अभी उपलब्ध नहीं है; ऊपर Teacher चुनकर full analysis फिर भी खोल सकते हैं.':'No summary data yet.'}</div>`;
 $('v265Body').innerHTML=`<div class="v265Stats"><div class="v265Stat"><small>Active Teachers</small><b>${totalTeachers}</b></div><div class="v265Stat"><small>Lessons Taught</small><b>${taught}</b></div><div class="v265Stat ok"><small>Fully Checked</small><b>${checked}</b></div><div class="v265Stat"><small>Tests Taken</small><b>${tests}</b></div><div class="v265Stat warn"><small>Analysis Period</small><b>${state.days}d</b></div><div class="v265Stat"><small>Mode</small><b>On-Demand</b></div></div><section class="v265Panel"><h3>👨‍🏫 Select Teacher → Complete Academic Analysis</h3><p class="v265Sub">किसी Teacher पर click करें. उसके बाद केवल उसी Teacher का syllabus, teaching, copy checking, tests और bell data load होगा.</p>${state.adminSummaryError?`<div class="v265Note">Comparison summary: ${E(state.adminSummaryError)} • V267 SQL run करने पर lightweight comparison भी active हो जाएगा.</div>`:''}<div class="v267CompareGrid">${cards}</div></section>`;
}
function renderProgress(){
 const m=globalMetrics(),g=groupMetrics(),taughtSyllabus=g.reduce((a,x)=>a+x.totalLessons,0),taughtCount=g.reduce((a,x)=>a+x.taught,0),teachPct=taughtSyllabus?pct(taughtCount,taughtSyllabus):m.taught?100:0;
 $('v265Body').innerHTML=`${teacherFocus()}${summaryStats(m)}<div class="v265GraphGrid"><section class="v265Panel"><h3>Premium Progress Graph</h3><p class="v265Sub">Click any class/subject bar for exact lesson pending detail.</p>${progressBars(g)}</section><section class="v265Panel"><h3>Overall Quality</h3><div class="v265Donuts">${ring(teachPct,'Syllabus Taught','#2f81d7')}${ring(m.checkRate,'Copy Fully Checked','#16a77b')}${ring(m.verifyRate,'Learning Verified','#8a5bd8')}</div><p class="v265Sub">${taughtSyllabus?'Teaching % uses syllabus_master total lessons.':'Syllabus total not set: teaching ring shows observed scope.'}</p></section></div><div class="v265GraphGrid"><section class="v265Panel"><h3>Class / Subject Heatmap</h3>${heatmap(g)}</section><section class="v265Panel"><h3>Last 7 Days Trend</h3>${weeklyTrend()}</section></div>`;
}
window.v265OpenGroup=function(c,s,t){
 state.className=c;state.subject=s;state.teacher=t||state.teacher;state.view='lessons';
 const cs=$('v265Class'),ss=$('v265Subject'),ts=$('v265Teacher');if(cs)cs.value=c;if(ss){ss.innerHTML=subjectOpts();ss.value=s}if(ts&&t)ts.value=t;renderCurrent();
};

function subjectMetricForBell(r){
 const rows=groupMetrics().filter(x=>cls(x.class_name)===cls(r.class_name)&&norm(x.subject)===norm(r.subject)&&(isAdmin()||!x.teacher_user_id||x.teacher_user_id===uid()));
 if(!rows.length)return {status:'Needs Attention',reason:'इस class/subject का recent teaching/checking data नहीं मिला.',checkRate:0,gap:0};
 const z=rows.sort((a,b)=>b.taught-a.taught)[0];let oldest=z.oldestPending?Math.floor((new Date(indiaYMD())-new Date(z.oldestPending+'T00:00:00'))/86400000):0;
 if((z.taught>=3&&z.checkRate<50)||oldest>=4)return {status:'Urgent',reason:`Copy checking ${z.checkRate}% • ${z.gap} lesson pending${oldest?` • oldest ${oldest} days`:''}`,checkRate:z.checkRate,gap:z.gap};
 if(z.checkRate<80||z.gap>0)return {status:'Needs Attention',reason:`Copy checking ${z.checkRate}% • ${z.gap} lesson pending`,checkRate:z.checkRate,gap:z.gap};
 return {status:'Good',reason:`Copy checking ${z.checkRate}% • Verified ${z.verifyRate}%`,checkRate:z.checkRate,gap:z.gap};
}
function todaysTimetable(){
 const d=indiaYMD(),day=dayName(d);
 let rows=state.timetable.filter(x=>norm(x.day_name)===norm(day));
 if(state.className)rows=rows.filter(x=>cls(x.class_name)===state.className);
 if(state.subject)rows=rows.filter(x=>String(x.subject||'')===state.subject);
 if(state.teacher){
   const name=state.diary.find(x=>String(x.teacher_user_id)===state.teacher)?.teacher_name||'';
   if(name)rows=rows.filter(x=>norm(x.teacher_name)===norm(name));
 }
 return rows.sort((a,b)=>n(a.period_no)-n(b.period_no)||classIndex(a.class_name)-classIndex(b.class_name));
}
function bellTeacherUid(r){
 if(isTeacher())return uid();
 const p=state.teachers.find(x=>norm(x.teacher_name||x.full_name)===norm(r.teacher_name));
 return String(p?.auth_user_id||'');
}
function todayTestMap(){let m=new Map();filteredTests(indiaYMD()).forEach(x=>m.set(keyBell(x,x.test_date),x));return m}
function renderBells(){
 const d=indiaYMD(),diMap=new Map(state.diary.filter(x=>x.teaching_date===d).map(x=>[keyBell(x,x.teaching_date),x])),tm=todayTestMap(),rows=todaysTimetable();
 $('v265Body').innerHTML=`<section class="v265Panel"><h3>🔔 Today Bell-wise Teacher Performance</h3><p class="v265Sub">${E(dateLabel(d))} • Good / Needs Attention / Urgent is rule-based and shows the reason.</p><div class="v265BellGrid">${rows.map(r=>{
   let tu=bellTeacherUid(r),perf=subjectMetricForBell(r),dk=[tu,d,n(r.period_no)].join('|'),teach=diMap.get(dk),test=tm.get(dk),st=statusClass(perf.status);
   let attRows=Array.isArray(state.attendance)?state.attendance.filter(a=>cls(a.class_name)===cls(r.class_name)):null,attBadge=attRows===null?'':`<span class="v265Badge ${attRows.length?'ok':'warn'}">${attRows.length?'Attendance Marked':'Attendance Pending'}</span>`;
   return `<article class="v265Bell ${st}"><div class="v265BellTop"><div><h3>Bell ${E(r.period_no)} • Class ${E(cls(r.class_name))}</h3><span class="v265Badge">${E(r.subject||'')}</span><span class="v265Badge">${E(r.teacher_name||'')}</span></div><b>${E(timeLabel(r.start_time))}</b></div><p><b>${E(perf.status)}</b> — ${E(perf.reason)}</p><div><span class="v265Badge ${teach?'ok':'warn'}">${teach?'✓ Teaching Updated':'Teaching Pending'}</span>${teach?`<span class="v265Badge ${teach.homework_remark?'ok':'warn'}">${teach.homework_remark?'Homework/Worksheet Updated':'Homework/Worksheet Blank'}</span>`:''}${attBadge}<span class="v265Badge ${test?.status==='Taken'?'ok':test?.status==='Not Taken'?'bad':'warn'}">Test: ${E(test?.status||'Pending / Not Updated')}</span></div><div class="v265Actions">${teach?`<button onclick="v265OpenCopy('${E(tu)}','${E(d)}',${n(r.period_no)},'${E(cls(r.class_name))}','${E(r.subject||'')}')">📋 Copy Check</button>`:''}<button class="primary" onclick="v265OpenTest('${E(tu)}','${E(d)}',${n(r.period_no)},'${E(cls(r.class_name))}','${E(r.section||'')}','${E(r.subject||'')}','${E(r.teacher_name||'')}')">📝 Test Status</button></div></article>`;
 }).join('')||'<div class="empty">आज के लिए timetable bell नहीं मिला.</div>'}</div></section>`;
}
function testStatusClass(s){return s==='Taken'?'v265TestTaken':s==='Not Taken'?'v265TestNo':s==='Planned'||s==='Rescheduled'?'v265TestPlan':'v265TestPending'}
function renderTests(){
 const d=state.date||indiaYMD();state.date=d;const day=dayName(d),rows=state.timetable.filter(x=>norm(x.day_name)===norm(day)).filter(x=>!state.className||cls(x.class_name)===state.className).filter(x=>!state.subject||String(x.subject||'')===state.subject);
 const tests=filteredTests(d),periodTests=filteredTests(),map=new Map(tests.map(x=>[keyBell(x,x.test_date),x]));
 let matrix=rows.map(r=>{let tu=isTeacher()?uid():bellTeacherUid(r);return {...r,_tu:tu,_test:map.get([tu,d,n(r.period_no)].join('|'))}}).filter(x=>isAdmin()||x._tu===uid());
 const taken=matrix.filter(x=>x._test?.status==='Taken').length,not=matrix.filter(x=>x._test?.status==='Not Taken').length,res=matrix.filter(x=>['Planned','Rescheduled'].includes(x._test?.status)).length,pending=matrix.filter(x=>!x._test).length;
 const pt=periodTests.filter(x=>x.status==='Taken').length,pn=periodTests.filter(x=>x.status==='Not Taken').length,pr=periodTests.filter(x=>['Planned','Rescheduled'].includes(x.status)).length;
 $('v265Body').innerHTML=`<section class="v265Panel"><div class="v265Toolbar"><label>Test Date<input id="v265TestDate" type="date" value="${E(d)}" onchange="v265TestDateChange()"></label></div><p class="v265Sub">Selected ${state.days} days: Tests Taken <b>${pt}</b> • Planned/Rescheduled <b>${pr}</b> • Explicit Not Taken <b>${pn}</b></p></section><div class="v265Stats"><div class="v265Stat"><small>Scheduled Bells</small><b>${matrix.length}</b></div><div class="v265Stat ok"><small>Tests Taken</small><b>${taken}</b></div><div class="v265Stat warn"><small>Planned / Rescheduled</small><b>${res}</b></div><div class="v265Stat bad"><small>Explicit Not Taken</small><b>${not}</b></div><div class="v265Stat"><small>Pending / Not Updated</small><b>${pending}</b></div><div class="v265Stat"><small>Coverage</small><b>${pct(taken,matrix.length)}%</b></div></div><section class="v265Panel"><h3>Class × Subject × Teacher × Bell Matrix</h3><p class="v265Sub">Grey Pending को automatically “Not Taken” नहीं माना गया है.</p><div class="v265Matrix"><table><thead><tr><th>Bell</th><th>Time</th><th>Class</th><th>Subject</th><th>Teacher</th><th>Status</th><th>Test Detail</th><th>Action</th></tr></thead><tbody>${matrix.map(x=>`<tr class="${testStatusClass(x._test?.status)}"><td><b>${E(x.period_no)}</b></td><td>${E(timeLabel(x.start_time))}</td><td>${E(cls(x.class_name))}</td><td>${E(x.subject||'')}</td><td>${E(x.teacher_name||'')}</td><td><b>${E(x._test?.status||'Pending / Not Updated')}</b></td><td>${x._test?`${E(x._test.test_type||'')} ${E(x._test.topic||'')} ${x._test.students_tested!=null?'• '+E(x._test.students_tested)+' students':''}`:'—'}</td><td><button onclick="v265OpenTest('${E(x._tu)}','${E(d)}',${n(x.period_no)},'${E(cls(x.class_name))}','${E(x.section||'')}','${E(x.subject||'')}','${E(x.teacher_name||'')}')">${isTeacher()?'Update':'Open'}</button></td></tr>`).join('')||'<tr><td colspan="8">No timetable rows.</td></tr>'}</tbody></table></div></section>`;
}
window.v265TestDateChange=function(){state.date=$('v265TestDate')?.value||indiaYMD();renderTests()};

function lessonRows(){
 const cm=copyMap();return uniqueLessons(filteredDiary()).sort((a,b)=>String(b.teaching_date).localeCompare(String(a.teaching_date))||n(b.period_no)-n(a.period_no)).map(x=>({...x,_copy:cm.get(keyLesson(x))}));
}
function lessonStatus(c){
 if(!c)return['Not Checked','bad'];if(n(c.total_students)>0&&n(c.checked_students)>=n(c.total_students))return['Fully Checked','ok'];if(n(c.checked_students)>0)return['Partially Checked','warn'];return['Not Checked','bad'];
}
function renderLessons(){
 let rows=lessonRows();
 $('v265Body').innerHTML=`<section class="v265Panel"><h3>📚 Lesson-wise Teaching → Copy Checking</h3><p class="v265Sub">Daily Teaching is the source. Copy Check is stored separately without duplicating teaching records.</p>${rows.map(x=>{let [st,sc]=lessonStatus(x._copy),pend=Math.max(0,n(x._copy?.total_students)-n(x._copy?.checked_students));return `<article class="v265Lesson"><div class="v265LessonTop"><div><h4>Class ${E(cls(x.class_name))} • ${E(x.subject||'')} • Lesson ${E(x.lesson_no||'—')}</h4><small>${E(dateLabel(x.teaching_date))} • Bell ${E(x.period_no||'—')} • ${E(x.teacher_name||'')}</small></div><span class="v265Badge ${sc}">${E(st)}</span></div><p><b>${E(x.topic||'')}</b>${x.details?' — '+E(x.details):''}</p><div><span class="v265Badge">Checked ${n(x._copy?.checked_students)}/${n(x._copy?.total_students)||'—'}</span><span class="v265Badge ${pend?'bad':'ok'}">Pending ${pend}</span><span class="v265Badge ${norm(x._copy?.learning_status)==='verified'?'ok':'warn'}">${E(x._copy?.learning_status||'Not Verified')}</span></div><div class="v265Actions">${isTeacher()||isAdmin()?`<button class="primary" onclick="v265OpenCopy('${E(x.teacher_user_id||'')}','${E(x.teaching_date)}',${n(x.period_no)},'${E(cls(x.class_name))}','${E(x.subject||'')}')">📋 ${x._copy?'Update':'Check Copies'}</button>`:''}</div></article>`}).join('')||'<div class="empty">Selected period में teaching lessons नहीं मिले.</div>'}</section>`;
}
function renderAudit(){
 if(!isAdmin())return;
 const g=groupMetrics();
 $('v265Body').innerHTML=`<div class="v265GraphGrid"><section class="v265Panel"><h3>⚠ Attention Needed</h3>${g.filter(x=>x.gap>0).slice(0,20).map(x=>`<article class="v265Lesson"><div class="v265LessonTop"><div><h4>Class ${E(x.class_name)} • ${E(x.subject)}</h4><small>${E(x.teacher_name)}</small></div><span class="v265Badge ${x.checkRate<50?'bad':'warn'}">Gap ${x.gap}</span></div><p>Taught ${x.taught} • Fully checked ${x.full} • Verified ${x.verified} • Copy coverage ${x.checkRate}%</p><div class="v265Actions"><button onclick="v265OpenGroup('${E(x.class_name)}','${E(x.subject)}','${E(x.teacher_user_id)}')">Open Lessons</button><button class="primary" onclick="v265RandomAudit('${E(x.class_name)}','${E(x.subject)}','${E(x.teacher_user_id)}','${E(x.teacher_name)}')">🎲 Random 5 Students Audit</button></div></article>`).join('')||'<div class="empty">No pending checking gap in selected data.</div>'}</section><section class="v265Panel"><h3>Quality Heatmap</h3>${heatmap(g)}</section></div><section class="v265Panel" id="v265AuditBox"><h3>Principal Random Audit</h3><div class="empty">Class/Subject के सामने Random 5 Students Audit दबाएँ.</div></section>`;
}
function renderCurrent(){
 if(!state.loaded)return;
 if(isAdmin()&&!state.teacher)return renderAdminLanding();
 if(isAdmin()&&state.teacher&&!state.detailLoaded){$('v265Body').innerHTML='<div class="empty">Teacher analysis loading…</div>';return}
 if(state.view==='bells')return renderBells();
 if(state.view==='tests')return renderTests();
 if(state.view==='lessons')return renderLessons();
 if(state.view==='audit')return renderAudit();
 renderProgress();
}

function modal(html){
 $('v265ModalBack')?.remove();document.body.insertAdjacentHTML('beforeend',`<div id="v265ModalBack" class="v265ModalBack"><div class="v265Modal">${html}</div></div>`);
}
window.v265CloseModal=()=>{$('v265ModalBack')?.remove()};

async function fetchRoster(c,s,d,p){
 const r=await db().rpc('ldm_v265_class_roster',{p_class_name:c,p_subject:s,p_date:d,p_period_no:Number(p)||0});if(r.error)throw r.error;return r.data||[];
}
window.v265OpenCopy=async function(tu,d,p,c,s){
 if(isAdmin()&&!tu)return window.toast?.('Teaching record में Teacher mapping missing है. पहले Teacher Master/Daily Teaching mapping ठीक करें.');
 const diary=state.diary.find(x=>String(x.teacher_user_id||'')===String(tu)&&String(x.teaching_date)===String(d)&&n(x.period_no)===n(p)&&cls(x.class_name)===cls(c)&&norm(x.subject)===norm(s));
 if(!diary)return window.toast?.('इस bell का Daily Teaching record पहले Save करें.');
 const old=state.copy.find(x=>String(x.teacher_user_id||'')===String(tu)&&String(x.teaching_date)===String(d)&&n(x.period_no)===n(p));
 modal(`<h2>📋 Copy Checking • Class ${E(c)} ${E(s)}</h2><p class="v265Sub">${E(dateLabel(d))} • Bell ${E(p)} • Lesson ${E(diary.lesson_no||'—')} • ${E(diary.topic||'')}</p><div class="v265Form"><label>Total Students<input id="v265CTotal" type="number" min="0" value="${n(old?.total_students)||''}"></label><label>Checked Students<input id="v265CChecked" type="number" min="0" value="${n(old?.checked_students)||''}"></label><label>Checked Date<input id="v265CDate" type="date" value="${E(old?.checked_date||indiaYMD())}"></label><label>Learning Status<select id="v265CLearn"><option ${old?.learning_status==='Not Verified'?'selected':''}>Not Verified</option><option ${old?.learning_status==='Verified'?'selected':''}>Verified</option><option ${old?.learning_status==='Revision Needed'?'selected':''}>Revision Needed</option></select></label><label class="full">Remark<textarea id="v265CRemark">${E(old?.remark||'')}</textarea></label><div class="full"><div class="v265Actions"><button onclick="v265LoadRoster('${E(c)}','${E(s)}','${E(d)}',${n(p)})">👥 Load Students / Pending List</button></div><div id="v265RosterHost" class="v265Roster" style="display:none"></div></div><div class="full v265Actions"><button onclick="v265CloseModal()">Cancel</button><button class="primary" onclick="v265SaveCopy('${E(tu)}','${E(d)}',${n(p)},'${E(c)}','${E(s)}','${E(diary.topic||'')}',${n(diary.lesson_no)})">✓ Save Copy Check</button></div></div>`);
 window.__v265PendingSet=new Set((old?.pending_admission_nos||[]).map(String));
};
window.v265LoadRoster=async function(c,s,d,p){
 const host=$('v265RosterHost');if(!host)return;host.style.display='block';host.innerHTML='<div class="empty">Loading class students…</div>';
 try{
  let rows=await fetchRoster(c,s,d,p),pend=window.__v265PendingSet||new Set();
  host.innerHTML=`<small><b>Tick only students whose copy is still Pending.</b></small>${rows.map(x=>`<label><input type="checkbox" class="v265PendingStudent" value="${E(x.admission_no)}" ${pend.has(String(x.admission_no))?'checked':''}> Roll ${E(x.roll_no||'—')} • ${E(x.student_name)} <small>${E(x.admission_no)}</small></label>`).join('')||'<div class="empty">No students found.</div>'}`;
  const total=$('v265CTotal');if(total&&!n(total.value))total.value=rows.length;
  document.querySelectorAll('.v265PendingStudent').forEach(el=>el.onchange=()=>{const p=[...document.querySelectorAll('.v265PendingStudent:checked')].length,tot=n($('v265CTotal')?.value);if(tot>=p)$('v265CChecked').value=Math.max(0,tot-p)});
 }catch(e){host.innerHTML=`<div class="dangerNote">${E(e?.message||e)}</div>`}
};
window.v265SaveCopy=async function(tu,d,p,c,s,topic,lesson){
 let total=n($('v265CTotal')?.value),checked=n($('v265CChecked')?.value),pending=[...document.querySelectorAll('.v265PendingStudent:checked')].map(x=>x.value);
 if(total<0||checked<0||checked>total)return window.toast?.('Checked Students Total से ज्यादा नहीं हो सकते.');
 if(pending.length&&total&&checked!==total-pending.length){checked=total-pending.length}
 const target=tu||(isTeacher()?uid():'');if(!target)return window.toast?.('Teacher mapping required');
 const r=await db().rpc('ldm_v265_copy_check_save',{p_academic_session:session(),p_teacher_user_id:target,p_teaching_date:d,p_period_no:n(p),p_class_name:c,p_subject:s,p_lesson_no:n(lesson),p_topic:topic,p_total_students:total,p_checked_students:checked,p_checked_date:$('v265CDate')?.value||indiaYMD(),p_learning_status:$('v265CLearn')?.value||'Not Verified',p_remark:$('v265CRemark')?.value||'',p_pending_admission_nos:pending});
 if(r.error)return window.toast?.(r.error.message);
 window.toast?.('✓ Copy checking updated');v265CloseModal();await v265Reload();
};

window.v265OpenTest=function(tu,d,p,c,section,s,tname){
 if(isTeacher()&&tu&&tu!==uid())return window.toast?.('यह bell आपका नहीं है.');
 if(isAdmin()&&!tu)return window.toast?.('Teacher login/profile mapping नहीं मिला. पहले Teacher Master mapping ठीक करें.');
 const old=state.tests.find(x=>String(x.teacher_user_id||'')===String(tu)&&String(x.test_date)===String(d)&&n(x.period_no)===n(p));
 modal(`<h2>📝 Bell-wise Class Test</h2><p class="v265Sub">${E(dateLabel(d))} • Bell ${E(p)} • Class ${E(c)} • ${E(s)} • ${E(tname)}</p><div class="v265Form"><label>Status<select id="v265TStatus"><option ${old?.status==='Planned'?'selected':''}>Planned</option><option ${old?.status==='Taken'?'selected':''}>Taken</option><option ${old?.status==='Not Taken'?'selected':''}>Not Taken</option><option ${old?.status==='Rescheduled'?'selected':''}>Rescheduled</option></select></label><label>Test Type<select id="v265TType"><option ${old?.test_type==='Oral'?'selected':''}>Oral</option><option ${old?.test_type==='Written'?'selected':''}>Written</option><option ${old?.test_type==='Quiz'?'selected':''}>Quiz</option><option ${old?.test_type==='Other'?'selected':''}>Other</option></select></label><label class="full">Lesson / Topic<input id="v265TTopic" value="${E(old?.topic||'')}" placeholder="e.g. Lesson 10 Fractions"></label><label>Max Marks<input id="v265TMarks" type="number" min="0" step="0.5" value="${old?.max_marks??''}"></label><label>Students Tested<input id="v265TStudents" type="number" min="0" value="${old?.students_tested??''}"></label><label>Rescheduled Date<input id="v265TResched" type="date" value="${E(old?.rescheduled_date||'')}"></label><label class="full">Remark<textarea id="v265TRemark">${E(old?.remark||'')}</textarea></label><div class="full v265Actions"><button onclick="v265CloseModal()">Cancel</button><button class="primary" onclick="v265SaveTest('${E(tu||uid())}','${E(d)}',${n(p)},'${E(c)}','${E(section||'')}','${E(s)}','${E(tname)}')">✓ Save Test Status</button></div></div>`);
};
window.v265SaveTest=async function(tu,d,p,c,section,s,tname){
 const status=$('v265TStatus')?.value||'Planned',topic=String($('v265TTopic')?.value||'').trim();
 if(status==='Taken'&&!topic)return window.toast?.('Taken test के लिए Lesson / Topic लिखें.');
 if(status==='Rescheduled'&&!$('v265TResched')?.value)return window.toast?.('Rescheduled Date चुनें.');
 const target=tu||(isTeacher()?uid():'');if(!target)return window.toast?.('Teacher mapping required');
 const r=await db().rpc('ldm_v265_bell_test_save',{p_academic_session:session(),p_teacher_user_id:target,p_test_date:d,p_period_no:n(p),p_class_name:c,p_section:section||'',p_subject:s,p_teacher_name:tname||'',p_status:status,p_test_type:$('v265TType')?.value||'Oral',p_topic:topic,p_max_marks:n($('v265TMarks')?.value),p_students_tested:n($('v265TStudents')?.value),p_remark:$('v265TRemark')?.value||'',p_rescheduled_date:$('v265TResched')?.value||null});
 if(r.error)return window.toast?.(r.error.message);
 window.toast?.('✓ Test status updated');v265CloseModal();await v265Reload();
};

window.v265RandomAudit=async function(c,s,tu,tname){
 const box=$('v265AuditBox');if(!box)return;box.innerHTML='<h3>Principal Random Audit</h3><div class="empty">Selecting 5 students…</div>';
 try{
  const d=indiaYMD(),p=state.diary.find(x=>cls(x.class_name)===cls(c)&&norm(x.subject)===norm(s)&&String(x.teacher_user_id)===String(tu))?.period_no||0;
  let rows=await fetchRoster(c,s,d,p);rows=rows.sort(()=>Math.random()-.5).slice(0,5);window.__v265AuditSample=rows;
  box.innerHTML=`<h3>🔎 Random 5 • Class ${E(c)} • ${E(s)}</h3><p class="v265Sub">${E(tname)} • Physical copies में इन students को random check करें.</p><div class="v265Heat">${rows.map(x=>`<div class="v265HeatCell"><b>Roll ${E(x.roll_no||'—')} • ${E(x.student_name)}</b><small>${E(x.admission_no)}</small></div>`).join('')}</div><div class="v265Form" style="margin-top:10px"><label>Audit Rating<select id="v265ARating"><option>Good</option><option>Needs Improvement</option><option>Recheck</option></select></label><label class="full">Principal Remark<textarea id="v265ARemark"></textarea></label><div class="full"><button class="primary" onclick="v265SaveAudit('${E(c)}','${E(s)}','${E(tu)}','${E(tname)}')">✓ Save Audit</button></div></div>`;
 }catch(e){box.innerHTML=`<div class="dangerNote">${E(e?.message||e)}</div>`}
};
window.v265SaveAudit=async function(c,s,tu,tname){
 const sample=(window.__v265AuditSample||[]).map(x=>String(x.admission_no));
 const r=await db().rpc('ldm_v265_principal_audit_save',{p_academic_session:session(),p_class_name:c,p_subject:s,p_teacher_user_id:tu||null,p_teacher_name:tname||'',p_sample_admission_nos:sample,p_rating:$('v265ARating')?.value||'Good',p_remark:$('v265ARemark')?.value||''});
 if(r.error)return window.toast?.(r.error.message);window.toast?.('✓ Principal audit saved');
};

function nextBellPayload(){
 if(!isTeacher())return null;
 const d=indiaYMD(),rows=todaysTimetable(),now=Date.now();
 for(const r of rows){
  const time=String(r.start_time||'').slice(0,5);if(!time)continue;
  const ms=new Date(`${d}T${time}:00+05:30`).getTime(),remind=ms-3*60000,key=`bell:${uid()}:${d}:${r.period_no}`;
  let fired=false;try{fired=localStorage.getItem('ldm_v264_external:'+key)==='1'}catch(_e){}
  if(fired)continue;
  if(ms>=now-2*60000){
   const perf=subjectMetricForBell(r),at=(remind<=now?now+250:remind),tm=todayTestMap(),test=tm.get([uid(),d,n(r.period_no)].join('|'));
   return {key,atMs:at,title:`Bell ${r.period_no} • Class ${cls(r.class_name)} • ${r.subject||''}`,details:`${perf.reason} • Test: ${test?.status||'Pending / Not Updated'} • ${timeLabel(r.start_time)} से class.`,status:perf.status,route:'academic_monitor'};
  }
 }
 return null;
}
function armBellReminder(){
 if(!isTeacher()||typeof window.v264ArmExternalReminder!=='function')return;
 const p=nextBellPayload();if(p)window.v264ArmExternalReminder(p);else window.v264CancelExternalReminder?.();
}
window.v265ArmBellReminder=armBellReminder;
window.addEventListener('ldm-v264-external-fired',e=>{
  if(isTeacher()&&String(e?.detail?.key||'').startsWith('bell:'))setTimeout(armBellReminder,1200);
});

async function bootTeacherDashboard(){
 if(!isTeacher()||!uid())return;
 try{
  if(!state.loaded){
   const end=indiaYMD(),start=addDays(end,-29),name=String(window.v14TeacherProfile?.teacher_name||window.profile?.full_name||'').trim();
   const [di,cp,te,sy,tt,at]=await Promise.all([
    safe('teaching_diary','*',q=>q.eq('teacher_user_id',uid()).gte('teaching_date',start).lte('teaching_date',end).order('teaching_date',{ascending:false}).limit(1500)),
    safe('ldm_v265_copy_checks','*',q=>q.eq('teacher_user_id',uid()).gte('teaching_date',start).lte('teaching_date',end).limit(1500)),
    safe('ldm_v265_bell_tests','*',q=>q.eq('teacher_user_id',uid()).gte('test_date',start).lte('test_date',end).limit(1500)),
    safe('syllabus_master','*',q=>q.eq('academic_session',session()).limit(1000)),
    safe('timetable','*',q=>q.eq('teacher_name',name).limit(500)),
    safeMaybe('attendance','admission_no,class_name,status,date',q=>q.eq('date',end).limit(6000))
   ]);Object.assign(state,{diary:di,copy:cp,tests:te,syllabus:sy,timetable:tt,attendance:at,loaded:true});
  }
  decorateDashboard();armBellReminder();
 }catch(_e){/* do not disturb dashboard if V265 SQL is not installed */}
}
function decorateDashboard(){
 if(!isTeacher())return;const host=$('erpContent');if(!host||host.querySelector('[data-v265-dash]'))return;
 const g=groupMetrics(),gap=g.reduce((a,x)=>a+x.gap,0),rows=todaysTimetable(),next=rows.find(r=>{let t=String(r.start_time||'').slice(0,5);return t&&new Date(`${indiaYMD()}T${t}:00+05:30`).getTime()>=Date.now()-10*60000}),perf=next?subjectMetricForBell(next):null;
 const b=document.createElement('button');b.type='button';b.dataset.v265Dash='1';b.className='v265Dash';b.onclick=()=>window.render?.('academic_monitor');b.innerHTML=`<span><b>📊 Teaching Performance • Gap ${gap}</b><small>${next?`Next Bell ${E(next.period_no)} • Class ${E(cls(next.class_name))} ${E(next.subject||'')} • ${E(perf.status)}`:'Open teaching/copy/test monitor'}</small></span><strong>OPEN →</strong>`;
 const target=host.querySelector('.ldmTeacherModules');if(target)target.parentNode.insertBefore(b,target);else host.insertBefore(b,host.firstChild?.nextSibling||host.firstChild);
}


function decorateAdminDashboard(){
 if(!isAdmin())return;
 const host=$('erpContent');if(!host||host.querySelector('[data-v267-admin-academic]'))return;
 const b=document.createElement('button');b.type='button';b.dataset.v267AdminAcademic='1';b.className='v267AdminLauncher';b.onclick=()=>window.render?.('academic_monitor');
 b.innerHTML='<span><b>📊 Teacher Academic Analysis</b><small>Select Teacher → Full Syllabus • Teaching • Copy Check • Bell Test</small></span><strong>OPEN →</strong>';
 const alarm=host.querySelector('[data-v264-dash]');
 if(alarm)alarm.insertAdjacentElement('afterend',b);
 else{
   const management=host.querySelector('.v114ManagementPanel,.v90Quick,.v90MonitorGrid');
   if(management)management.parentNode.insertBefore(b,management);
   else host.insertBefore(b,host.firstChild?.nextSibling||host.firstChild);
 }
}

const prevRender=window.render;
window.render=async function(route='dashboard'){
 const r=String(route||'dashboard');
 if(r==='academic_monitor')return window.v265AcademicCenter();
 const out=await prevRender.apply(this,arguments);
 if(r==='dashboard'&&isTeacher())setTimeout(bootTeacherDashboard,0);
 if(r==='dashboard'&&isAdmin())setTimeout(decorateAdminDashboard,0);
 return out;
};
try{render=window.render}catch(_e){}

window.LDM_V265_ACADEMIC=Object.freeze({
 centralTeachingSource:'teaching_diary',
 centralTimetableSource:'timetable',
 syllabusSource:'syllabus_master',
 copyCheckTable:'ldm_v265_copy_checks',
 bellTestTable:'ldm_v265_bell_tests',
 adminAuditTable:'ldm_v265_principal_audits',
 reminderEngine:'V264 central alarm hook',
 adminLoadMode:'teacher-list + aggregate summary; selected-teacher detail only',
 dashboardAdminFetch:false,
 polling:false,realtime:false,cron:false
});
})();
