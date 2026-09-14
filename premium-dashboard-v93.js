
/* V93 Premium Role Dashboard runtime
   Visual/dashboard renderer only. Existing routes, Supabase calls, auth and permissions remain authoritative. */
(function(){
  'use strict';

  function v93Safe(v){
    try { return typeof v90Safe === 'function' ? v90Safe(v) : String(v ?? ''); }
    catch(_e){ return String(v ?? ''); }
  }
  function v93Now(){
    try{
      return new Date().toLocaleString('en-IN',{
        weekday:'short', day:'2-digit', month:'short', year:'numeric',
        hour:'2-digit', minute:'2-digit'
      });
    }catch(_e){ return ''; }
  }
  function v93Card(icon,title,sub,route){
    return `<button class="v90Monitor v93ActionCard" onclick="render('${route}')">
      <span class="v90MonitorIcon">${icon}</span>
      <span><b>${v93Safe(title)}</b><small>${v93Safe(sub)}</small></span><em>›</em>
    </button>`;
  }

  async function v93AdminDashboard(){
    window.__v90Route='dashboard';
    if(typeof v90Head==='function') v90Head('Admin Dashboard','Full School Control');
    if(typeof v90InstallShell==='function') v90InstallShell('dashboard');

    const html = `
    <div class="v90Dash v93Dash v93AdminDash">
      <section class="v93Greeting">
        <div>
          <span class="v93Eyebrow">ADMIN DASHBOARD</span>
          <h1>Good Morning, Admin <span aria-hidden="true">👋</span></h1>
          <p>Manage your school, make a difference today.</p>
        </div>
        <div class="v93GreetingMeta">
          <div class="v93Date">📅 <span>${v93Safe(v93Now())}</span></div>
          <div class="v93Online"><i></i><span><b>School Online</b><small>All systems operational</small></span></div>
        </div>
      </section>

      <section id="v90Stats" class="v90Stats v93Stats">
        ${Array.from({length:6},()=>'<div class="v90Stat skeleton"></div>').join('')}
      </section>

      <section class="v93DashboardGrid">
        <article class="v93Panel v93PanelMain">
          <header class="v93PanelHead">
            <div><h2>⚡ One-Click Monitoring Center</h2><p>Quick access to key school operations</p></div>
          </header>
          <div class="v90MonitorGrid v93PrimaryGrid">
            ${v93Card('📅','Take Attendance','Class-wise attendance','attendance')}
            ${v93Card('👥','Manage Students','View and edit records','students')}
            ${v93Card('👨‍🏫','Manage Teachers','Teacher profiles & subjects','staff')}
            ${v93Card('₹','Fee Collection','Collect and manage fees','smart_fee_center')}
            ${v93Card('📊','View Reports','Attendance, fees, exams','reports')}
            ${v93Card('⚙','School Settings','General configuration','settings')}
          </div>
        </article>

        <article class="v93Panel">
          <header class="v93PanelHead"><div><h2>🔖 Quick Links</h2><p>Frequently used controls</p></div></header>
          <div class="v90Quick v93Quick">
            ${[
              ['🗓','Timetable','timetable_master'],
              ['💼','Master Fee','master_fee'],
              ['📣','Notice / Order','notice_order_center'],
              ['🎫','Exam / Admit','exam_admit_center'],
              ['📄','Marksheet','marksheet_center'],
              ['🔎','Master Search','dashboard_search']
            ].map(x=>`<button onclick="render('${x[2]}')"><b>${x[0]}</b><span>${x[1]}</span></button>`).join('')}
          </div>
        </article>
      </section>

      <section class="v93Panel v93MorePanel">
        <header class="v93PanelHead">
          <div><h2>School Monitoring</h2><p>Live status and pending work</p></div>
          <span id="v90LiveText" class="v93Live">● LIVE</span>
        </header>
        <div class="v90MonitorGrid v93MoreGrid">
          ${v93Card('📅','Attendance Status','Class-wise done / not marked','v90_attendance_monitor')}
          ${v93Card('💰','Due Fee Status','Old due + current month due','v90_due_fee_monitor')}
          ${v93Card('📝','Exam Participation','Selected • Admit • Appeared','v90_exam_monitor')}
          ${v93Card('📊','Marks Entry Progress','Teacher • Subject • Pending','v90_marks_monitor')}
          ${v93Card('🚌','Transport Trip','Pickup / Drop attendance','v90_transport_monitor')}
          ${v93Card('👥','Presence & Leave','Students + Teachers today','v90_presence_monitor')}
          ${v93Card('🎓','Student Requests','Leave • Correction • Add/Remove','v90_student_requests')}
          ${v93Card('👨‍🏫','Teacher Requests','Personal + class related','v90_teacher_requests')}
          ${v93Card('📚','Daily Teaching','Timetable → lesson update','v90_teaching_monitor')}
          ${v93Card('🔐','Password Manager','Parent login access','parent_access')}
        </div>
      </section>
    </div>`;

    if(typeof v90Set==='function') v90Set(html);
    else {
      const h=document.getElementById('erpContent');
      if(h)h.innerHTML=html;
    }

    if(typeof v90LoadDashboardStats==='function') await v90LoadDashboardStats();
    setTimeout(()=>{ try{ if(typeof v91AdminQuick==='function')v91AdminQuick(); if(typeof v92AdminQuick==='function')v92AdminQuick(); }catch(_e){} },0);
  }

  async function v93TeacherDashboard(){
    window.__v90Route='dashboard';
    if(typeof v90Head==='function') v90Head('Teacher Dashboard','My Classes • Teaching • Attendance');
    if(typeof v90InstallShell==='function') v90InstallShell('dashboard');

    try{ if(typeof v14LoadTeacherContext==='function') await v14LoadTeacherContext(); }catch(_e){}
    const tp=window.v14TeacherProfile||{};
    const name=tp.teacher_name||(window.profile&&profile.full_name)||'Teacher';
    let classes=[];
    try{ classes=typeof v14AllowedClassNames==='function'?v14AllowedClassNames():[]; }catch(_e){}
    let sched=[];
    try{
      const day=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
      const r=await sb.from('timetable').select('*').eq('teacher_name',name).eq('day_name',day).order('period_no');
      sched=r.data||[];
    }catch(_e){}

    const html=`
    <div class="v90Dash v93Dash v93TeacherDash">
      <section class="v93Greeting">
        <div>
          <span class="v93Eyebrow">TEACHER DASHBOARD</span>
          <h1>Good Morning, ${v93Safe(name)} <span aria-hidden="true">👋</span></h1>
          <p>Teach, track, and inspire every day.</p>
        </div>
        <div class="v93GreetingMeta">
          <div class="v93Date">📅 <span>${v93Safe(v93Now())}</span></div>
          <div class="v93Online"><i></i><span><b>Online</b><small>You are logged in</small></span></div>
        </div>
      </section>

      <section class="v90Stats v93Stats v93TeacherStats">
        ${[
          ['🏫','My Classes',classes.length],
          ['🕐',"Today's Periods",sched.length],
          ['📖','Teaching Update','Fast Entry'],
          ['✅','Attendance','Today'],
          ['📬','My Requests','Open'],
          ['📣','Notices','View']
        ].map(x=>`<div class="v90Stat"><span>${x[0]}</span><div><small>${x[1]}</small><b>${x[2]}</b></div></div>`).join('')}
      </section>

      <section class="v93DashboardGrid v93TeacherGrid">
        <article class="v93Panel v93PanelMain">
          <header class="v93PanelHead">
            <div><h2>📅 Today's Teaching Schedule</h2><p>Admin timetable से automatic generated</p></div>
            <button class="secondary" onclick="render('teacher_bells')">View Timetable</button>
          </header>
          <div class="v93ScheduleTable">
            <div class="v93ScheduleHead"><span>Period</span><span>Time</span><span>Class</span><span>Subject</span><span>Action</span></div>
            ${sched.length?sched.map(x=>`<button class="v93ScheduleRow" onclick="v90OpenTeacherDailyBell(${Number(x.period_no)||0})">
              <span>${v93Safe(x.period_no||'')}</span>
              <span>${typeof v90FmtTime==='function'?v90FmtTime(x.start_time):v93Safe(x.start_time||'')} – ${typeof v90FmtTime==='function'?v90FmtTime(x.end_time):v93Safe(x.end_time||'')}</span>
              <span>${v93Safe(x.class_name||'')}</span>
              <span>${v93Safe(x.subject||'')}</span>
              <strong>Mark ›</strong>
            </button>`).join(''):'<div class="empty">आज का timetable नहीं मिला।</div>'}
          </div>
        </article>

        <article class="v93Panel">
          <header class="v93PanelHead"><div><h2>⚡ Quick Access</h2><p>My daily work</p></div></header>
          <div class="v90Quick v93Quick">
            ${[
              ['👥','My Class','teacher_class'],
              ['✅','Attendance','attendance'],
              ['📖','Daily Teaching','v90_teacher_daily'],
              ['✏','Homework','homework'],
              ['📝','Marks','v90_teacher_marks'],
              ['📣','Orders','teacher_notices'],
              ['🗒','My Notes','my_notes'],
              ['👤','Profile','teacher_profile']
            ].map(x=>`<button onclick="render('${x[2]}')"><b>${x[0]}</b><span>${x[1]}</span></button>`).join('')}
          </div>
        </article>
      </section>
    </div>`;

    if(typeof v90Set==='function') v90Set(html);
    else {
      const h=document.getElementById('erpContent');
      if(h)h.innerHTML=html;
    }
    setTimeout(()=>{try{if(typeof v91TeacherQuick==='function')v91TeacherQuick()}catch(_e){}},0);
  }

  function v93PolishParent(){
    const pd=document.getElementById('parentDashboard');
    if(!pd||pd.classList.contains('hidden'))return;
    pd.classList.add('v93ParentDashboard');
    if(!pd.querySelector('.v93ParentBrand')){
      const head=document.createElement('div');
      head.className='v93ParentBrand';
      head.innerHTML=`<div><b>L D MODERN EDUCATION ACADEMY</b><span>Gambhiriya Bujurg, Singhapatti, Kushinagar</span></div>
        <div class="v93ParentRole"><strong>Parent / Student</strong><small>Secure Portal</small></div>`;
      pd.prepend(head);
    }
  }

  function install(){
    try{
      if(typeof v90AdminDashboard==='function') v90AdminDashboard=v93AdminDashboard;
      if(typeof v90TeacherDashboard==='function') v90TeacherDashboard=v93TeacherDashboard;
    }catch(e){ console.warn('V93 dashboard override',e); }

    try{
      const old=window.v90PolishParentPortal;
      window.v90PolishParentPortal=function(){
        try{ if(typeof old==='function') old.apply(this,arguments); }catch(_e){}
        setTimeout(v93PolishParent,0);
      };
    }catch(_e){}

    try{
      const oldLoad=window.loadParentPortal;
      if(typeof oldLoad==='function'&&!oldLoad.__v93){
        const w=async function(){
          const r=await oldLoad.apply(this,arguments);
          setTimeout(v93PolishParent,20);
          return r;
        };
        w.__v93=true;
        window.loadParentPortal=w;
      }
    }catch(_e){}

    setTimeout(v93PolishParent,300);
  }

  install();
  window.addEventListener('load',()=>setTimeout(install,50));
})();
