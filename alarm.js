/* L D MODERN EDUCATION ACADEMY
   V264 SMART WORK ALARM / DAILY SCHEDULE CENTER
   Free-tier safe: on-demand/day load + one next-alarm setTimeout only.
*/
(function(){
'use strict';
if(window.__LDM_V264_WORK_ALARM)return;
window.__LDM_V264_WORK_ALARM=true;
window.LDM_FINAL_BUILD='V265-ACADEMIC-MONITOR-2026-10-08';

const $=id=>document.getElementById(id);
const E=v=>typeof window.esc==='function'?window.esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const role=()=>String(window.profile?.role||((typeof profile!=='undefined'&&profile)?profile.role:'')||'').trim().toLowerCase();
const admin=()=>['admin','super_admin','principal'].includes(role());
const teacher=()=>role()==='teacher';
const uid=()=>String(window.user?.id||((typeof user!=='undefined'&&user)?user.id:'')||'');
const db=()=>typeof sb!=='undefined'?sb:window.sb;
const INDIA_TZ='Asia/Kolkata';
const DAYS=[['0','Sun'],['1','Mon'],['2','Tue'],['3','Wed'],['4','Thu'],['5','Fri'],['6','Sat']];
const REC_LABEL={one_time:'One Time',daily:'Daily',weekly:'Weekly',mon_sat:'Mon–Sat',selected_days:'Selected Days'};
let editingId=null, editingAssignee='', audioCtx=null;
window.__v264TodayRows=[];
window.__v264Upcoming=[];
window.__v264AssignedByMe=[];
window.__v264Teachers=[];
window.__v264AlarmTimer=null;
window.__v264MidnightTimer=null;
window.__v264LoadedDate='';

function indiaParts(d=new Date()){
  const p=new Intl.DateTimeFormat('en-CA',{timeZone:INDIA_TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(d);
  return Object.fromEntries(p.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
}
function today(){
  const p=indiaParts();return `${p.year}-${p.month}-${p.day}`;
}
function nowHM(){const p=indiaParts();return `${p.hour}:${p.minute}`}
function addDays(ymd,n){
  const d=new Date(ymd+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);
}
function prettyDate(x){
  if(!x)return '—';try{return new Intl.DateTimeFormat('en-IN',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(x+'T00:00:00+05:30'))}catch(_e){return x}
}
function prettyTime(x){
  x=String(x||'').slice(0,5);if(!x)return '—';
  try{return new Date('2000-01-01T'+x+':00+05:30').toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:INDIA_TZ})}catch(_e){return x}
}
function occurrenceMs(date,time){
  const t=String(time||'00:00').slice(0,5);return new Date(`${date}T${t}:00+05:30`).getTime();
}
function fmtTs(ts){
  if(!ts)return '';try{return new Date(ts).toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:INDIA_TZ})}catch(_e){return ''}
}
function priorityClass(p){p=String(p||'Normal').toLowerCase();return p==='urgent'?'urgent':p==='high'?'high':p==='low'?'low':'normal'}
function stateClass(s){s=String(s||'pending').toLowerCase();return ['done','skipped'].includes(s)?s:'pending'}
function recurrenceText(r,days){
  r=String(r||'one_time');
  if(r!=='selected_days')return REC_LABEL[r]||r;
  const set=new Set((days||[]).map(String));return DAYS.filter(x=>set.has(x[0])).map(x=>x[1]).join(', ')||'Selected Days';
}
function currentRouteOptions(selected=''){
  const out=[['','No ERP Link']],seen=new Set(['']);
  try{
    if(admin()&&typeof V90_ADMIN_GROUPS!=='undefined'&&Array.isArray(V90_ADMIN_GROUPS)){
      V90_ADMIN_GROUPS.forEach(g=>(g?.[2]||[]).forEach(x=>{
        let r=String(x?.[0]||'').trim();if(r&&!seen.has(r)){seen.add(r);out.push([r,String(x?.[1]||r)])}
      }));
    }else if(teacher()&&typeof V90_TEACHER_NAV!=='undefined'&&Array.isArray(V90_TEACHER_NAV)){
      V90_TEACHER_NAV.forEach(x=>{let r=String(x?.[0]||'').trim();if(r&&!seen.has(r)){seen.add(r);out.push([r,String(x?.[1]||r)])}});
    }
  }catch(_e){}
  return out.map(x=>`<option value="${E(x[0])}" ${String(selected)===String(x[0])?'selected':''}>${E(x[1])}</option>`).join('');
}
function soundPrime(){
  try{
    const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
    audioCtx=audioCtx||new C();if(audioCtx.state==='suspended')audioCtx.resume();
  }catch(_e){}
}
function beep(){
  try{
    const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
    audioCtx=audioCtx||new C();
    const play=(delay,freq)=>{
      const o=audioCtx.createOscillator(),g=audioCtx.createGain();
      o.type='sine';o.frequency.value=freq;g.gain.value=.0001;
      o.connect(g);g.connect(audioCtx.destination);
      const t=audioCtx.currentTime+delay;g.gain.exponentialRampToValueAtTime(.18,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+.34);
      o.start(t);o.stop(t+.36);
    };
    if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});
    play(0,880);play(.45,1040);play(.9,880);
  }catch(_e){}
  try{navigator.vibrate?.([250,120,250,120,400])}catch(_e){}
}
document.addEventListener('pointerdown',soundPrime,{once:true,capture:true,passive:true});
document.addEventListener('keydown',soundPrime,{once:true,capture:true,passive:true});

function injectStyle(){
  if($('ldm-v264-style'))return;
  const st=document.createElement('style');st.id='ldm-v264-style';st.textContent=`
  .v264Page{display:grid;gap:12px}.v264Hero{background:linear-gradient(135deg,#8a2300,#f47d00 50%,#c9155c);color:#fff;border-radius:20px;padding:18px;box-shadow:0 12px 30px #7b2c1820}.v264Hero h2{margin:3px 0 5px}.v264Hero p{margin:0;color:#fff9}
  .v264Grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.v264Form{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.v264Form .wide{grid-column:span 2}.v264Form .full{grid-column:1/-1}.v264Form label{display:grid;gap:5px;font-size:11px;font-weight:850;color:#40556c}.v264Form input,.v264Form select,.v264Form textarea{width:100%;min-height:42px;border:1px solid #cfdae7;border-radius:10px;padding:9px;background:#fff;font:inherit}.v264Form textarea{min-height:78px;resize:vertical}
  .v264Stats{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}.v264Stat{background:#fff;border:1px solid #dbe6f1;border-radius:14px;padding:12px}.v264Stat small,.v264Stat b{display:block}.v264Stat b{font-size:21px;color:#153f70;margin-top:4px}
  .v264Agenda{display:grid;gap:9px}.v264Task{background:#fff;border:1px solid #dce5ee;border-left:5px solid #1782d4;border-radius:15px;padding:12px;box-shadow:0 7px 18px #18395c0c}.v264Task.done{opacity:.7;border-left-color:#18a15f}.v264Task.skipped{opacity:.68;border-left-color:#8b98a7}.v264TaskTop{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.v264TaskTop h3{margin:0 0 4px;color:#193f6b}.v264Time{font-size:18px;font-weight:950;color:#9b2f00;white-space:nowrap}.v264Meta{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}.v264Chip{display:inline-flex;padding:4px 7px;border-radius:999px;background:#edf4fb;color:#38516d;font-size:10px;font-weight:850}.v264Chip.high,.v264Chip.urgent{background:#fff0ec;color:#a73219}.v264Chip.done{background:#e8f8ef;color:#087446}.v264Chip.skipped{background:#eef1f4;color:#5e6975}.v264Task p{margin:6px 0;color:#4c6074}.v264Actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.v264Actions button{min-height:39px}
  .v264Days{display:flex;gap:6px;flex-wrap:wrap}.v264Days label{display:flex!important;align-items:center;gap:4px;background:#f5f8fb;padding:6px 8px;border-radius:9px}.v264Days input{width:auto;min-height:auto}
  .v264TeacherPick{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;max-height:230px;overflow:auto;border:1px solid #dbe5ef;border-radius:12px;padding:8px;background:#fbfdff}.v264TeacherPick label{display:flex!important;align-items:center;gap:7px;border:1px solid #e0e8f0;border-radius:10px;padding:8px;background:#fff}.v264TeacherPick input{width:auto;min-height:auto}
  .v264Notice{padding:10px 12px;border:1px solid #dce7f2;border-radius:12px;background:#f5faff;color:#435b72;font-size:11px;line-height:1.55}.v264Notice strong{color:#164d83}
  .v264Next{display:flex;justify-content:space-between;gap:10px;align-items:center;background:linear-gradient(135deg,#f7fbff,#eef8ff);border:1px solid #d5e8f8;border-radius:15px;padding:12px}.v264Next b{display:block;color:#153f70}.v264Next small{color:#617589}
  .v264AlarmOverlay{position:fixed;inset:0;background:#061728a8;z-index:9999999;display:grid;place-items:center;padding:18px}.v264AlarmCard{width:min(520px,96vw);background:#fff;border-radius:24px;padding:22px;box-shadow:0 24px 70px #0007;text-align:center;animation:v264Pulse 1s ease-in-out infinite alternate}.v264AlarmIcon{font-size:54px}.v264AlarmCard h2{margin:7px 0;color:#a12d00}.v264AlarmCard p{color:#53697d}.v264AlarmBtns{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:14px}.v264AlarmBtns button{min-height:44px}.v264Dash{margin:10px 0;border:1px solid #ffd7a5;background:linear-gradient(135deg,#fffaf1,#fff);border-radius:16px;padding:11px;display:flex;justify-content:space-between;gap:10px;align-items:center}.v264Dash b{display:block;color:#8a3500}.v264Dash small{color:#657485}
  @keyframes v264Pulse{from{transform:scale(1)}to{transform:scale(1.015)}}
  @media(max-width:800px){.v264Form{grid-template-columns:1fr 1fr}.v264Form .wide{grid-column:span 2}.v264Stats{grid-template-columns:1fr 1fr}.v264TeacherPick{grid-template-columns:1fr 1fr}}
  @media(max-width:520px){.v264Form{grid-template-columns:1fr}.v264Form .wide,.v264Form .full{grid-column:auto}.v264TeacherPick{grid-template-columns:1fr}.v264TaskTop{align-items:flex-start}.v264Dash{align-items:flex-start;flex-direction:column}}
  `;
  document.head.appendChild(st);
}
injectStyle();

function showDays(){
  const r=$('v264Recurrence')?.value||'one_time',box=$('v264DayBox');if(box)box.style.display=r==='selected_days'?'block':'none';
}
window.v264ShowDays=showDays;

async function loadTeachers(){
  if(!admin())return [];
  if(window.__v264Teachers.length)return window.__v264Teachers;
  const c=db();if(!c)return [];
  const r=await c.from('teacher_profiles').select('id,auth_user_id,teacher_name,employee_id,approval_status,is_active').eq('approval_status','Approved').order('teacher_name').limit(2000);
  if(r.error)throw r.error;
  window.__v264Teachers=(r.data||[]).filter(x=>x.is_active!==false&&x.auth_user_id);
  return window.__v264Teachers;
}
function teacherPicker(){
  if(!admin())return '';
  const rows=window.__v264Teachers||[];
  return `<div class="full"><label>Assign To</label><div class="v264TeacherPick"><label><input id="v264Self" type="checkbox" checked> ⭐ Myself / Principal</label>${rows.map((t,i)=>`<label><input class="v264TeacherChk" type="checkbox" value="${E(t.auth_user_id)}"> ${E(t.teacher_name||'Teacher')} <small>${E(t.employee_id||'')}</small></label>`).join('')}</div><small>एक या कई teachers चुन सकते हैं. Teacher को केवल अपना/assigned alarm दिखेगा.</small></div>`;
}
function dayPicker(selected=[]){
  const set=new Set((selected||[]).map(String));
  return `<div class="v264Days">${DAYS.map(d=>`<label><input class="v264Day" type="checkbox" value="${d[0]}" ${set.has(d[0])?'checked':''}>${d[1]}</label>`).join('')}</div>`;
}

function scheduleForm(){
  return `<section class="panel">
   <div class="panelHead"><div><h3 id="v264FormTitle">➕ New Work Alarm</h3><p class="note">काम + तारीख + समय set करें. One Time / Daily / Weekly / Mon–Sat / Selected Days.</p></div><button onclick="v264ResetForm()">Clear</button></div>
   <div class="v264Form">
    <label class="wide">Work / Task *<input id="v264Title" maxlength="180" placeholder="e.g. 10:30 Fee Due Check"></label>
    <label>Priority<select id="v264Priority"><option>Normal</option><option>High</option><option>Urgent</option><option>Low</option></select></label>
    <label>Alarm Time *<input id="v264Time" type="time" value="09:00"></label>
    <label>Start Date *<input id="v264Date" type="date" value="${today()}"></label>
    <label>Repeat<select id="v264Recurrence" onchange="v264ShowDays()"><option value="one_time">One Time</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="mon_sat">Mon–Sat</option><option value="selected_days">Selected Days</option></select></label>
    <label class="wide">Linked ERP Function (optional)<select id="v264Route">${currentRouteOptions()}</select><small>Function खोलने पर existing role/permission rules लागू रहेंगे.</small></label>
    <div id="v264DayBox" class="full" style="display:none"><label>Selected Days</label>${dayPicker()}</div>
    <label class="full">Instructions / Notes<textarea id="v264Details" maxlength="1000" placeholder="क्या करना है, किस क्रम में करना है..."></textarea></label>
    ${teacherPicker()}
   </div>
   <div id="v264EditingFor" class="v264Notice" style="display:none;margin-top:10px"></div>
   <div class="v264Actions"><button id="v264SaveBtn" class="primary" onclick="v264SaveSchedule()">✓ Save Alarm</button><button onclick="v264EnableNotifications()">🔔 Enable Browser Notification</button></div>
  </section>`;
}
function centerSkeleton(){
  return `<div class="v264Page">
   <section class="v264Hero"><small>SMART WORK ALARM • DAILY SCHEDULE</small><h2>🚨 आज का काम भूलिए नहीं</h2><p>Time-wise agenda • alarm • Done • Snooze • Skip • Next Task • Admin → Teacher assignment</p></section>
   <div class="v264Notice"><strong>Reliable rule:</strong> ERP/browser खुला हो तो exact-time in-app alarm चलेगा. Browser notification permission मिले तो background tab में notification भी मिलेगा. Browser/app पूरी तरह बंद होने पर web alarm guaranteed नहीं है; उसके लिए future PWA/Web Push चाहिए.</div>
   <div id="v264FormHost"></div>
   <section class="panel"><div class="panelHead"><div><h3>📅 Today Agenda</h3><p class="note">${prettyDate(today())} • time order • one-by-one work</p></div><button onclick="v264RefreshAll(true)">↻ Refresh</button></div><div id="v264Stats"></div><div id="v264NextBox"></div><div id="v264TodayAgenda" class="v264Agenda"><div class="empty">Loading today schedule…</div></div></section>
   <section class="panel"><div class="panelHead"><div><h3>🗓 Active / Upcoming</h3><p class="note">Personal + assigned recurring schedule</p></div></div><div id="v264Upcoming" class="v264Agenda"></div></section>
   ${admin()?`<section class="panel"><div class="panelHead"><div><h3>👩‍🏫 Assigned to Teachers</h3><p class="note">Admin-created active alarms</p></div></div><div id="v264AssignedByMe" class="v264Agenda"></div></section>`:''}
   <section class="panel"><div class="panelHead"><div><h3>🧾 Alarm History</h3><p class="note">Done • Snooze • Skip audit</p></div><button onclick="v264LoadHistory()">Load History</button></div><div id="v264History"><div class="empty">History on demand.</div></div></section>
  </div>`;
}

window.v264ScheduleCenter=async function(){
  if(!admin()&&!teacher())return window.toast?.('Admin / Teacher only');
  window.__v90Route='smart_work_alarm';try{window.v90Push?.('smart_work_alarm')}catch(_e){}
  try{window.v90InstallShell?.('smart_work_alarm')}catch(_e){}
  try{window.v90Head?.('🚨 Smart Work Alarm','Daily Schedule • One-by-one Task • Teacher Assignment')}catch(_e){}
  const host=$('erpContent');if(!host)return;
  host.innerHTML=centerSkeleton();
  try{
    if(admin())await loadTeachers();
    $('v264FormHost').innerHTML=scheduleForm();showDays();
    await window.v264RefreshAll(true);
  }catch(e){
    $('v264TodayAgenda').innerHTML=`<div class="dangerNote">${E(e?.message||e)}<br>V264 SAFE SQL run करें.</div>`;
  }
};

function selectedDays(){
  return [...document.querySelectorAll('.v264Day:checked')].map(x=>Number(x.value));
}
function selectedAssignees(){
  if(!admin())return [uid()];
  const a=[...document.querySelectorAll('.v264TeacherChk:checked')].map(x=>x.value);
  if($('v264Self')?.checked)a.unshift(uid());
  return [...new Set(a.filter(Boolean))];
}
window.v264ResetForm=function(){
  editingId=null;editingAssignee='';
  const host=$('v264FormHost');if(host){host.innerHTML=scheduleForm();showDays()}
};
window.v264SaveSchedule=async function(){
  const title=String($('v264Title')?.value||'').trim(),details=String($('v264Details')?.value||'').trim(),date=$('v264Date')?.value,time=$('v264Time')?.value,rec=$('v264Recurrence')?.value||'one_time',priority=$('v264Priority')?.value||'Normal',route=$('v264Route')?.value||null,days=selectedDays();
  if(!title)return window.toast?.('Work / Task लिखें');
  if(!date||!time)return window.toast?.('Date और Alarm Time जरूरी है');
  if(rec==='selected_days'&&!days.length)return window.toast?.('कम से कम एक दिन चुनें');
  const c=db();if(!c)return window.toast?.('Database connection unavailable');
  const btn=$('v264SaveBtn');if(btn)btn.disabled=true;
  try{
    if(editingId){
      const r=await c.rpc('ldm_v264_schedule_update',{p_item_id:editingId,p_title:title,p_details:details,p_start_date:date,p_alarm_time:time,p_recurrence:rec,p_selected_days:days,p_priority:priority,p_module_route:route});
      if(r.error)throw r.error;window.toast?.('✓ Alarm updated');
    }else{
      const assignees=selectedAssignees();if(!assignees.length)return window.toast?.('Myself या कम से कम एक Teacher चुनें');
      const r=await c.rpc('ldm_v264_schedule_create',{p_title:title,p_details:details,p_start_date:date,p_alarm_time:time,p_recurrence:rec,p_selected_days:days,p_priority:priority,p_module_route:route,p_assignee_user_ids:assignees});
      if(r.error)throw r.error;window.toast?.(`✓ Alarm saved for ${assignees.length} user(s)`);
    }
    v264ResetForm();await v264RefreshAll(true);
  }catch(e){window.toast?.(e?.message||String(e))}
  finally{if(btn)btn.disabled=false}
};
window.v264Edit=function(id){
  const rows=[...(window.__v264Upcoming||[]),...(window.__v264AssignedByMe||[])],x=rows.find(z=>String(z.id)===String(id));if(!x)return;
  editingId=String(x.id);editingAssignee=x.assigned_user_name||'';
  if(!$('v264Title'))return;
  $('v264Title').value=x.title||'';$('v264Details').value=x.details||'';$('v264Date').value=String(x.start_date||today()).slice(0,10);$('v264Time').value=String(x.alarm_time||'09:00').slice(0,5);$('v264Recurrence').value=x.recurrence||'one_time';$('v264Priority').value=x.priority||'Normal';$('v264Route').value=x.module_route||'';
  showDays();document.querySelectorAll('.v264Day').forEach(c=>c.checked=(x.selected_days||[]).map(Number).includes(Number(c.value)));
  document.querySelectorAll('.v264TeacherPick input').forEach(c=>c.disabled=true);
  const note=$('v264EditingFor');if(note){note.style.display='block';note.textContent='Editing existing alarm for: '+(editingAssignee||'User')+'. Assignee cannot be changed; create a new alarm to assign another person.'}
  $('v264FormTitle').textContent='✏ Edit Work Alarm';$('v264SaveBtn').textContent='✓ Update Alarm';window.scrollTo({top:0,behavior:'smooth'});
};
window.v264ToggleActive=async function(id,on){
  const c=db();try{let r=await c.rpc('ldm_v264_schedule_set_active',{p_item_id:id,p_active:!!on});if(r.error)throw r.error;window.toast?.(on?'Alarm reactivated':'Alarm cancelled');await v264RefreshAll(true)}catch(e){window.toast?.(e?.message||String(e))}
};
window.v264EnableNotifications=async function(){
  if(!('Notification'in window))return window.toast?.('Browser notification supported नहीं है');
  try{const p=await Notification.requestPermission();window.toast?.(p==='granted'?'✓ Browser notifications enabled':'Notification permission नहीं मिला')}catch(e){window.toast?.(e?.message||String(e))}
};

function todayCard(x){
  const st=String(x.occurrence_state||'pending'),snooze=x.snoozed_until&&new Date(x.snoozed_until).getTime()>Date.now()?` • Snoozed to ${fmtTs(x.snoozed_until)}`:'';
  return `<article class="v264Task ${stateClass(st)}">
   <div class="v264TaskTop"><div><h3>${E(x.title)}</h3><div class="v264Meta"><span class="v264Chip ${priorityClass(x.priority)}">${E(x.priority||'Normal')}</span><span class="v264Chip ${stateClass(st)}">${E(st)}</span><span class="v264Chip">${E(recurrenceText(x.recurrence,x.selected_days))}</span>${x.assigned_by_name&&String(x.assigned_by)!==uid()?`<span class="v264Chip">Assigned by ${E(x.assigned_by_name)}</span>`:''}</div></div><div class="v264Time">${E(prettyTime(x.alarm_time))}</div></div>
   ${x.details?`<p>${E(x.details)}</p>`:''}${snooze?`<small>${E(snooze)}</small>`:''}
   <div class="v264Actions">
    ${st==='pending'?`<button class="primary" onclick="v264Action('${x.item_id}','done')">✓ Done</button><button onclick="v264Action('${x.item_id}','snooze',10)">⏰ Snooze 10m</button><button onclick="v264Action('${x.item_id}','skip')">↷ Skip</button>`:''}
    ${x.module_route?`<button onclick="v264OpenRoute('${E(x.module_route)}')">↗ Open Function</button>`:''}
    ${x.can_edit?`<button onclick="v264Edit('${x.item_id}')">✏ Edit</button>`:''}
   </div>
  </article>`;
}
function manageCard(x,assigned=false){
  return `<article class="v264Task">
   <div class="v264TaskTop"><div><h3>${E(x.title)}</h3><div class="v264Meta"><span class="v264Chip ${priorityClass(x.priority)}">${E(x.priority||'Normal')}</span><span class="v264Chip">${E(recurrenceText(x.recurrence,x.selected_days))}</span>${assigned?`<span class="v264Chip">👩‍🏫 ${E(x.assigned_user_name||'Teacher')}</span>`:''}</div></div><div class="v264Time">${E(prettyTime(x.alarm_time))}</div></div>
   <p>${E(prettyDate(String(x.start_date||'').slice(0,10)))}${x.details?' • '+E(x.details):''}</p>
   <div class="v264Actions">${(admin()||String(x.assigned_by)===uid()&&String(x.assigned_user_id)===uid())?`<button onclick="v264Edit('${x.id}')">✏ Edit</button><button onclick="v264ToggleActive('${x.id}',false)">⛔ Cancel</button>`:''}</div>
  </article>`;
}
function renderToday(){
  const rows=window.__v264TodayRows||[],host=$('v264TodayAgenda');if(!host)return;
  const pending=rows.filter(x=>String(x.occurrence_state||'pending')==='pending'),done=rows.filter(x=>x.occurrence_state==='done'),skipped=rows.filter(x=>x.occurrence_state==='skipped');
  const total=rows.length,next=pending.slice().sort((a,b)=>effectiveMs(a)-effectiveMs(b))[0];
  const stats=$('v264Stats');if(stats)stats.innerHTML=`<div class="v264Stats"><div class="v264Stat"><small>Today</small><b>${total}</b></div><div class="v264Stat"><small>Pending</small><b>${pending.length}</b></div><div class="v264Stat"><small>Done</small><b>${done.length}</b></div><div class="v264Stat"><small>Skipped</small><b>${skipped.length}</b></div></div>`;
  const nb=$('v264NextBox');if(nb)nb.innerHTML=next?`<div class="v264Next"><div><small>NEXT TASK</small><b>${E(next.title)}</b><small>${E(prettyTime(next.alarm_time))}${next.snoozed_until?' • snoozed '+E(fmtTs(next.snoozed_until)):''}</small></div><button class="primary" onclick="v264Action('${next.item_id}','done')">✓ Done → Next</button></div>`:`<div class="v264Next"><div><small>NEXT TASK</small><b>आज का pending काम पूरा ✅</b></div></div>`;
  host.innerHTML=rows.length?rows.map(todayCard).join(''):'<div class="empty">आज कोई schedule नहीं है. ऊपर से नया Work Alarm जोड़ें.</div>';
}
function effectiveMs(x){
  const sn=x.snoozed_until?new Date(x.snoozed_until).getTime():0;if(sn>Date.now())return sn;return occurrenceMs(x.occurrence_date||today(),x.alarm_time);
}
function renderManage(){
  const u=$('v264Upcoming');if(u)u.innerHTML=(window.__v264Upcoming||[]).length?window.__v264Upcoming.map(x=>manageCard(x,false)).join(''):'<div class="empty">No active schedule.</div>';
  const a=$('v264AssignedByMe');if(a)a.innerHTML=(window.__v264AssignedByMe||[]).length?window.__v264AssignedByMe.map(x=>manageCard(x,true)).join(''):'<div class="empty">Teachers को कोई active alarm assign नहीं है.</div>';
}
async function loadToday(force=false){
  const d=today();if(!force&&window.__v264LoadedDate===d&&Array.isArray(window.__v264TodayRows))return window.__v264TodayRows;
  const c=db();if(!c||!uid())return [];
  const r=await c.rpc('ldm_v264_my_schedule',{p_date:d});if(r.error)throw r.error;
  window.__v264TodayRows=r.data||[];window.__v264LoadedDate=d;return window.__v264TodayRows;
}
async function loadManage(){
  const c=db(),id=uid();if(!c||!id)return;
  let q=c.from('ldm_schedule_items').select('*').eq('assigned_user_id',id).eq('is_active',true).order('start_date',{ascending:true}).order('alarm_time',{ascending:true}).limit(300);
  const r=await q;if(r.error)throw r.error;window.__v264Upcoming=r.data||[];
  if(admin()){
    const a=await c.from('ldm_schedule_items').select('*').eq('assigned_by',id).neq('assigned_user_id',id).eq('is_active',true).order('start_date',{ascending:true}).order('alarm_time',{ascending:true}).limit(500);
    if(a.error)throw a.error;window.__v264AssignedByMe=a.data||[];
  }else window.__v264AssignedByMe=[];
}
window.v264RefreshAll=async function(force=false){
  try{await Promise.all([loadToday(force),loadManage()]);renderToday();renderManage();armNext();decorateDashboard()}catch(e){if($('v264TodayAgenda'))$('v264TodayAgenda').innerHTML=`<div class="dangerNote">${E(e?.message||e)}</div>`;throw e}
};
window.v264Action=async function(id,action,snooze=0){
  const c=db();try{
    let r=await c.rpc('ldm_v264_schedule_action',{p_item_id:id,p_occurrence_date:today(),p_action:action,p_snooze_minutes:Number(snooze)||0,p_note:''});if(r.error)throw r.error;
    closeAlarm();window.toast?.(action==='done'?'✓ Done — next task ready':action==='skip'?'Task skipped':'Alarm snoozed');
    window.__v264LoadedDate='';await loadToday(true);renderToday();armNext();decorateDashboard();
  }catch(e){window.toast?.(e?.message||String(e))}
};
window.v264OpenRoute=function(route){
  route=String(route||'').trim();if(!route)return;
  closeAlarm();try{window.render?.(route)}catch(e){window.toast?.(e?.message||String(e))}
};

function firedKey(x){
  const marker=x.snoozed_until&&new Date(x.snoozed_until).getTime()>occurrenceMs(x.occurrence_date,x.alarm_time)?x.snoozed_until:String(x.alarm_time);
  return `ldm_v264_fired:${x.item_id}:${x.occurrence_date}:${marker}`;
}
function alarmHtml(x){
  return `<div id="v264AlarmOverlay" class="v264AlarmOverlay"><div class="v264AlarmCard"><div class="v264AlarmIcon">🚨</div><small>WORK ALARM • ${E(prettyTime(x.alarm_time))}</small><h2>${E(x.title)}</h2>${x.details?`<p>${E(x.details)}</p>`:''}<div class="v264Meta" style="justify-content:center"><span class="v264Chip ${priorityClass(x.priority)}">${E(x.priority||'Normal')}</span><span class="v264Chip">${E(recurrenceText(x.recurrence,x.selected_days))}</span></div><div class="v264AlarmBtns"><button class="primary" onclick="v264Action('${x.item_id}','done')">✓ Done</button><button onclick="v264Action('${x.item_id}','snooze',5)">5 Min</button><button onclick="v264Action('${x.item_id}','snooze',10)">10 Min</button><button onclick="v264Action('${x.item_id}','snooze',30)">30 Min</button><button onclick="v264Action('${x.item_id}','skip')">↷ Skip</button>${x.module_route?`<button onclick="v264OpenRoute('${E(x.module_route)}')">↗ Open Work</button>`:''}</div></div></div>`;
}
function closeAlarm(){$('v264AlarmOverlay')?.remove()}
function fireAlarm(x){
  if(!x||$('v264AlarmOverlay'))return;
  try{localStorage.setItem(firedKey(x),'1')}catch(_e){}
  beep();document.body.insertAdjacentHTML('beforeend',alarmHtml(x));
  try{
    if('Notification'in window&&Notification.permission==='granted'&&document.hidden){
      new Notification('🚨 '+String(x.title||'Work Alarm'),{body:`${prettyTime(x.alarm_time)} • ${String(x.details||'Daily schedule')}`,icon:'school-logo.png',tag:'ldm-'+x.item_id});
    }
  }catch(_e){}
}
function armNext(){
  clearTimeout(window.__v264AlarmTimer);window.__v264AlarmTimer=null;
  const pending=(window.__v264TodayRows||[]).filter(x=>String(x.occurrence_state||'pending')==='pending');
  const candidates=pending.map(x=>({x,ms:effectiveMs(x)})).sort((a,b)=>a.ms-b.ms);
  const now=Date.now();
  let next=null;
  for(const c of candidates){
    let fired=false;try{fired=localStorage.getItem(firedKey(c.x))==='1'}catch(_e){}
    if(!fired){next=c;break}
  }
  if(next){
    const delay=Math.max(120,next.ms-now);
    window.__v264AlarmTimer=setTimeout(()=>fireAlarm(next.x),Math.min(delay,2147483000));
  }
  armMidnight();
}
function armMidnight(){
  clearTimeout(window.__v264MidnightTimer);
  const d=addDays(today(),1),ms=new Date(`${d}T00:00:03+05:30`).getTime()-Date.now();
  window.__v264MidnightTimer=setTimeout(async()=>{window.__v264LoadedDate='';try{await loadToday(true);renderToday();decorateDashboard();armNext()}catch(_e){}},Math.max(1000,ms));
}
window.v264LoadHistory=async function(){
  const host=$('v264History');if(!host)return;host.innerHTML='<div class="empty">Loading history…</div>';
  try{
    const r=await db().rpc('ldm_v264_schedule_history',{p_limit:100});if(r.error)throw r.error;
    const rows=r.data||[];host.innerHTML=rows.length?`<div class="tableWrap"><table><thead><tr><th>Time</th><th>Work</th><th>Date</th><th>Action</th><th>Note</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${E(new Date(x.created_at).toLocaleString('en-IN',{timeZone:INDIA_TZ}))}</td><td>${E(x.title)}</td><td>${E(x.occurrence_date)}</td><td>${E(x.action)}</td><td>${E(x.note||'')}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">No alarm history yet.</div>';
  }catch(e){host.innerHTML=`<div class="dangerNote">${E(e?.message||e)}</div>`}
};

function decorateDashboard(){
  if(!admin()&&!teacher())return;
  const host=$('erpContent');if(!host)return;
  let box=host.querySelector('[data-v264-dash]');
  if(!box){
    box=document.createElement('button');box.type='button';box.dataset.v264Dash='1';box.className='v264Dash';box.onclick=()=>window.render?.('smart_work_alarm');
    const target=teacher()?host.querySelector('.ldmTeacherModules'):host.querySelector('.v90Quick');
    if(target){box.innerHTML='<span><b>🚨 Work Alarm</b><small>Loading today schedule…</small></span><strong>OPEN →</strong>';target.parentNode.insertBefore(box,target)}
    else{box.innerHTML='<span><b>🚨 Work Alarm</b><small>Loading today schedule…</small></span><strong>OPEN →</strong>';host.insertBefore(box,host.firstChild?.nextSibling||host.firstChild)}
  }
  const rows=window.__v264TodayRows||[],pending=rows.filter(x=>String(x.occurrence_state||'pending')==='pending').sort((a,b)=>effectiveMs(a)-effectiveMs(b)),next=pending[0];
  box.innerHTML=`<span><b>🚨 Work Alarm • ${pending.length} Pending</b><small>${next?`Next ${E(prettyTime(next.alarm_time))} — ${E(next.title)}`:'आज का pending काम पूरा ✅'}</small></span><strong>OPEN →</strong>`;
}

async function bootDashboard(){
  if(!admin()&&!teacher()||!uid())return;
  try{await loadToday(false);decorateDashboard();armNext()}catch(_e){/* SQL may not be installed yet; no dashboard disruption */}
}
window.v264BootDashboard=bootDashboard;

const previousRender=window.render;
window.render=async function(route='dashboard'){
  const r=String(route||'dashboard');
  if(r==='smart_work_alarm')return window.v264ScheduleCenter();
  const out=await previousRender.apply(this,arguments);
  if(r==='dashboard'&&(admin()||teacher()))setTimeout(bootDashboard,0);
  return out;
};
try{render=window.render}catch(_e){}


/* V265: central external reminder hook.
   Academic/Bell reminders reuse the SAME V264 alarm sound/overlay engine.
   No polling; caller gives one exact timestamp and this module owns the timer. */
window.v264CancelExternalReminder=function(){
  clearTimeout(window.__v264ExternalTimer);window.__v264ExternalTimer=null;
};
window.v264ArmExternalReminder=function(o){
  window.v264CancelExternalReminder();
  if(!o||!Number.isFinite(Number(o.atMs)))return false;
  const at=Number(o.atMs),key=String(o.key||'external'),title=String(o.title||'Reminder'),details=String(o.details||''),status=String(o.status||''),route=String(o.route||'');
  let fired=false;try{fired=localStorage.getItem('ldm_v264_external:'+key)==='1'}catch(_e){}
  if(fired)return false;
  const fire=()=>{
    if(document.getElementById('v264AlarmOverlay')){
      window.__v264ExternalTimer=setTimeout(fire,60000);return;
    }
    try{localStorage.setItem('ldm_v264_external:'+key,'1')}catch(_e){}
    try{window.dispatchEvent(new CustomEvent('ldm-v264-external-fired',{detail:{key,title,status,route}}))}catch(_e){}
    beep();
    const safeTitle=E(title),safeDetails=E(details),safeStatus=E(status),safeRoute=E(route);
    document.body.insertAdjacentHTML('beforeend',`<div id="v264AlarmOverlay" class="v264AlarmOverlay"><div class="v264AlarmCard"><div class="v264AlarmIcon">🔔</div><small>TEACHING BELL REMINDER</small><h2>${safeTitle}</h2>${safeStatus?`<div class="v264Meta" style="justify-content:center"><span class="v264Chip high">${safeStatus}</span></div>`:''}${safeDetails?`<p>${safeDetails}</p>`:''}<div class="v264AlarmBtns">${route?`<button class="primary" onclick="document.getElementById('v264AlarmOverlay')?.remove();render('${safeRoute}')">Open Monitor →</button>`:''}<button onclick="document.getElementById('v264AlarmOverlay')?.remove()">Dismiss</button></div></div></div>`);
    try{
      if('Notification'in window&&Notification.permission==='granted'&&document.hidden){
        new Notification('🔔 '+title,{body:(status?status+' • ':'')+details,icon:'school-logo.png',tag:'ldm-ext-'+key});
      }
    }catch(_e){}
  };
  const delay=at-Date.now();
  if(delay<=-120000)return false;
  window.__v264ExternalTimer=setTimeout(fire,Math.max(120,Math.min(delay,2147483000)));
  return true;
};

window.LDM_V264_WORK_ALARM=Object.freeze({
  route:'smart_work_alarm',
  adminTeacher:true,
  teacherPersonal:true,
  adminMultiTeacherAssignment:true,
  recurrence:['one_time','daily','weekly','mon_sat','selected_days'],
  alarmEngine:'single-next-setTimeout',
  polling:false,realtime:false,cron:false,
  writes:'create/edit/done/snooze/skip/cancel only',
  closedBrowserGuarantee:false
});
})();
