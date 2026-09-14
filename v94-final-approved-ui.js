
(function(){
  'use strict';
  const $q=(s,r=document)=>r.querySelector(s);
  const esc94=(v)=>{try{return typeof v90Safe==='function'?v90Safe(v):String(v??'')}catch(_){return String(v??'')}};
  const isAdmin=()=>{try{return typeof v90Admin==='function'&&v90Admin()}catch(_){return false}};
  const isTeacher=()=>{try{return typeof v90Teacher==='function'&&v90Teacher()}catch(_){return false}};

  function v94RoleName(){
    if(isAdmin()) return 'Admin';
    return (window.v14TeacherProfile?.teacher_name||window.profile?.full_name||'Teacher');
  }
  function v94RoleLabel(){
    let r=String(window.profile?.role||'').replaceAll('_',' ');
    return r|| (isAdmin()?'Super Admin':'Teacher');
  }
  function v94Now(){
    try{return new Date().toLocaleString('en-IN',{weekday:'short',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
    catch(_){return ''}
  }
  function v94Back(){
    try{
      // Prefer the app's existing history-aware Back once; do not pop twice.
      if(typeof window.v92Back==='function') return window.v92Back();
      if(typeof window.v91Back==='function') return window.v91Back();
      if(typeof window.v90Back==='function') return window.v90Back();
      let h=window.__v90History||['dashboard'];
      if(h.length>1)h.pop();
      let r=h[h.length-1]||'dashboard';
      window.__v90History=h;
      return window.render?.(r);
    }catch(_){ return window.render?.('dashboard') }
  }
  function v94Fullscreen(){
    try{
      if(!document.fullscreenElement) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
    }catch(_){}
  }

  const ADMIN_NAV=[
    ['dashboard','⌂','Dashboard'],
    ['admissions','♙','Admission'],
    ['students','👥','Students'],
    ['staff','👨‍🏫','Teachers'],
    ['attendance','✓','Attendance'],
    ['master_fee','₹','Fees & Finance'],
    ['exam_admit_center','▣','Exams & Results'],
    ['academics','▤','Academics'],
    ['van_center','▰','Transport'],
    ['notice_order_center','📣','Communication'],
    ['reports','▥','Reports'],
    ['settings','⚙','Settings']
  ];
  const TEACHER_NAV=[
    ['dashboard','⌂','Home'],
    ['teacher_profile','👤','My Profile'],
    ['teacher_class','👥','My Class'],
    ['teacher_bells','▦','My Teaching'],
    ['v90_teacher_daily','📖','Daily Teaching'],
    ['attendance','✓','Attendance'],
    ['master_attendance','📋','Master Attendance'],
    ['homework','▤','Homework'],
    ['v90_teacher_marks','A+','Exams & Marks'],
    ['v90_my_requests','📬','My Requests'],
    ['v91_student_photos','📷','Student Photos'],
    ['my_notes','▣','My Notes'],
    ['teacher_notices','📣','Notices'],
    ['class_opinions','💬','Class Review']
  ];

  function v94BuildNav(active='dashboard'){
    const host=document.getElementById('erpNav'); if(!host) return;
    const nav=isAdmin()?ADMIN_NAV:TEACHER_NAV;
    host.className='v94Nav';
    host.innerHTML=nav.map(x=>`<button class="${active===x[0]?'active':''}" onclick="render('${x[0]}')"><span>${x[1]}</span><b>${x[2]}</b></button>`).join('');
  }

  function v94CleanLegacyHeader(){
    document.querySelectorAll(
      '#erp .erpTop #v64HealthBadge,#erp .erpTop #v75TopSearch:not(.v94Search),#erp .erpTop #v764LiveBadge,'+
      '#erp .erpTop .v63Msg,#erp .erpTop #v63AdminBox,#erp .erpTop .v63TopLogout,'+
      '#erp .erpTop .websiteBtn,#erp .erpTop #v75DarkBtn,#erp .erpTop [data-v58-order],'+
      '#erp .erpTop [data-v58-settings],#erp .erpTop #v90HomeBtn,#erp .erpTop #v90BackBtn,'+
      '#erp .erpTop .erpHomeBtn,#erp .erpTop .v63SchoolHead'
    ).forEach(e=>e.remove());
  }

  function v94Header(active='dashboard'){
    const top=$q('#erp .erpTop'); if(!top) return;
    top.className='erpTop v94Top';
    top.innerHTML=`
      <button class="v94MobileMenu" type="button" onclick="document.querySelector('#erp aside').classList.toggle('open')">☰</button>
      <div class="v94Brand">
        <img src="school-logo.png" alt="" onerror="this.style.display='none'">
        <div><b>L D MODERN EDUCATION ACADEMY</b><span>Gambhiriya Bujurg, Singhapatti, Kushinagar</span></div>
      </div>
      <div id="v75TopSearch" data-v764="1" class="v94Search">
        ${active!=='dashboard'?`<button class="v94Back" type="button" onclick="v94Back()">←</button>`:''}
        <input id="v75TopQ" placeholder="${isAdmin()?'Search student, teacher, fee, notice, function...':'Search class, student, notice...'}" autocomplete="off">
        <button type="button" onclick="${isAdmin()?"(window.v764MasterSearchRun?window.v764MasterSearchRun():render('dashboard_search'))":"render('dashboard_search')"}">⌕</button>
      </div>
      <div class="v94TopActions">
        <button id="v62Bell" class="v94IconBtn" type="button" onclick="window.v62ToggleNotifications?.()" title="Notifications">🔔<span id="v62Badge" class="v62Badge zero">0</span></button>
        <button class="v94IconBtn" type="button" onclick="v94Fullscreen()" title="Fullscreen">⛶</button>
        <button class="v94Profile" type="button" onclick="${isAdmin()?"render('settings')":"render('teacher_profile')"}">
          <span class="v94Avatar">${isAdmin()?'👨‍💼':'👨‍🏫'}</span>
          <span><b>${esc94(v94RoleName())}</b><small>${esc94(v94RoleLabel())}</small></span>
          <em>⌄</em>
        </button>
      </div>`;
    const inp=document.getElementById('v75TopQ');
    if(inp) inp.addEventListener('keydown',e=>{if(e.key==='Enter'){ if(isAdmin()&&typeof window.v764MasterSearchRun==='function')window.v764MasterSearchRun(); else render('dashboard_search'); }});
    v94CleanLegacyHeader();
  }

  function v94InstallShell(active=window.__v90Route||'dashboard'){
    const erp=document.getElementById('erp');
    if(!erp||erp.classList.contains('hidden')) return;
    erp.classList.add('v90Shell','v94Shell');
    const brand=erp.querySelector('.sideBrand');
    if(brand){
      brand.className='sideBrand v94SideBrand';
      brand.innerHTML=`<img src="school-logo.png" alt="" onerror="this.style.display='none'"><div><b id="sideName">L D MODERN EDUCATION ACADEMY</b><small id="roleText">${isAdmin()?'SUPER ADMIN':'TEACHER PORTAL'}</small></div>`;
    }
    v94BuildNav(active);
    v94Header(active);
    try{$q('#erp aside')?.classList.remove('open')}catch(_){}
  }

  function money94(n){
    try{return typeof v90Money==='function'?v90Money(n):'₹'+Number(n||0).toLocaleString('en-IN')}catch(_){return '₹0'}
  }
  async function v94AdminStats(){
    let students=0,teachers=0,collection=0,due=0,attPct=0,pending=0,present=0,absent=0,marked=0;
    try{
      [students,teachers]=await Promise.all([
        v90Count('students',q=>q.neq('status','Inactive')),
        v90Count('teacher_profiles',q=>q.eq('approval_status','Approved'))
      ]);
    }catch(_){}
    try{
      let p=await sb.from('fee_payments').select('amount').eq('payment_date',v90Today()).limit(3000);
      collection=(p.data||[]).reduce((a,x)=>a+Number(x.amount||0),0);
    }catch(_){}
    try{
      let s=await sb.from('student_fee_schedules').select('amount,paid_amount,status').eq('academic_session',v90Session()).limit(6000);
      due=(s.data||[]).reduce((a,x)=>a+(v90Norm(x.status)==='paid'?0:Math.max(Number(x.amount||0)-Number(x.paid_amount||0),0)),0);
    }catch(_){}
    try{
      let a=await sb.from('attendance').select('status').eq('date',v90Today()).limit(5000);
      let r=a.data||[]; marked=r.length;
      present=r.filter(x=>v90Norm(x.status)==='present').length;
      absent=r.filter(x=>v90Norm(x.status)==='absent').length;
      attPct=marked?Math.round(present*100/marked):0;
    }catch(_){}
    try{
      let [l,c,r,t]=await Promise.all([
        sb.from('student_leave_requests').select('id',{count:'exact',head:true}).eq('status','Pending'),
        sb.from('student_correction_requests').select('id',{count:'exact',head:true}).eq('status','Pending'),
        sb.from('student_roster_requests').select('id',{count:'exact',head:true}).eq('status','Pending'),
        sb.from('v90_teacher_requests').select('id',{count:'exact',head:true}).eq('status','Pending')
      ]);
      pending=(l.count||0)+(c.count||0)+(r.count||0)+(t.count||0);
    }catch(_){}
    return {students,teachers,collection,due,attPct,pending,present,absent,marked};
  }

  const action94=(icon,title,sub,route)=>`<button class="v94Action" onclick="render('${route}')"><span>${icon}</span><div><b>${title}</b><small>${sub}</small></div><em>›</em></button>`;
  const quick94=(icon,title,route)=>`<button onclick="render('${route}')"><b>${icon}</b><span>${title}</span></button>`;

  async function v94AdminDashboard(){
    window.__v90Route='dashboard';
    v94InstallShell('dashboard');
    const host=document.getElementById('erpContent'); if(!host)return;
    host.innerHTML=`
      <div class="v94Dash">
        <section class="v94Greeting">
          <div><small>ADMIN DASHBOARD</small><h1>Good Morning, Admin 👋</h1><p>Manage your school, make a difference today.</p></div>
          <div class="v94GreetingRight"><div class="v94Date">📅 <span>${esc94(v94Now())}</span></div><div class="v94Online"><i></i><span><b>School Online</b><small>All Systems Operational</small></span></div></div>
        </section>

        <section id="v94Stats" class="v94Stats">${Array.from({length:6},()=>'<div class="v94Stat skeleton"></div>').join('')}</section>

        <section class="v94MainGrid">
          <article class="v94Panel">
            <header><div><h2>▣ One-Click Monitoring Center</h2><p>Quick access to key school operations</p></div></header>
            <div class="v94ActionGrid">
              ${action94('📅','Take Attendance','Mark student attendance','attendance')}
              ${action94('👥','Manage Students','View and edit records','students')}
              ${action94('👨‍🏫','Manage Teachers','Teacher profile & subjects','staff')}
              ${action94('₹','Fee Collection','Collect and manage fees','master_fee')}
              ${action94('📊','View Reports','Attendance, fees, exams','reports')}
              ${action94('⚙','School Settings','General configuration','settings')}
            </div>
          </article>

          <article class="v94Panel">
            <header><div><h2>☷ Today's Activity</h2><p>Live school summary</p></div></header>
            <div id="v94Activity" class="v94Activity"></div>
          </article>
        </section>

        <section class="v94BottomGrid">
          <article class="v94Panel">
            <header><div><h2>▣ Attendance Overview</h2><p>Today's attendance</p></div></header>
            <div id="v94AttendanceBox" class="v94AttendanceBox"></div>
          </article>

          <article class="v94Panel">
            <header><div><h2>🔖 Quick Links</h2><p>Frequently used controls</p></div></header>
            <div class="v94Quick">
              ${quick94('🕐','Timetable','timetable_master')}
              ${quick94('₹','Master Fee','master_fee')}
              ${quick94('📊','Class Report','reports')}
              ${quick94('✉','Message','notice_order_center')}
            </div>
          </article>

          <article class="v94Panel">
            <header><div><h2>🔔 Recent Notifications</h2><p>Important school actions</p></div></header>
            <div id="v94Notifications" class="v94Notifications"></div>
          </article>
        </section>
        <footer class="v94Footer"><span>© 2026 L D MODERN EDUCATION ACADEMY | All Rights Reserved</span><b>Education for a Brighter Tomorrow</b></footer>
      </div>`;

    const s=await v94AdminStats();
    const statData=[
      ['👥','Students',s.students,'Total Enrolled','blue'],
      ['👨‍🏫','Teachers',s.teachers,'Active Teachers','green'],
      ['💰','Today Collection',money94(s.collection),'Fees Collected Today','yellow'],
      ['₹','Total Due',money94(s.due),'Pending Fee Amount','pink'],
      ['✓','Attendance',s.attPct?s.attPct+'%':'—','Present Today','purple'],
      ['👤','Pending Requests',s.pending,'New Requests','cyan']
    ];
    document.getElementById('v94Stats').innerHTML=statData.map(x=>`<div class="v94Stat ${x[4]}"><span>${x[0]}</span><div><small>${x[1]}</small><b>${x[2]}</b><em>${x[3]}</em></div><i>›</i></div>`).join('');
    document.getElementById('v94Activity').innerHTML=`
      ${action94('👥','New Admission','Open admission records','admissions')}
      ${action94('₹','Fee Collection',money94(s.collection)+' collected today','master_fee')}
      ${action94('✓','Attendance Update',(s.attPct||0)+'% present today','master_attendance')}
      ${action94('▣','Pending Requests',s.pending+' new requests','v90_student_requests')}`;
    const att=document.getElementById('v94AttendanceBox');
    if(att) att.innerHTML=`<div class="v94Donut" style="--pct:${Math.max(0,Math.min(100,s.attPct||0))}"><b>${s.attPct||0}%</b><span>Present</span></div>
      <div class="v94Legend"><span><i class="g"></i>Present <b>${s.present}</b></span><span><i class="r"></i>Absent <b>${s.absent}</b></span><span><i class="b"></i>Marked <b>${s.marked}</b></span><span><i class="k"></i>Total <b>${s.students}</b></span></div>`;
    document.getElementById('v94Notifications').innerHTML=`
      ${action94('📣','Orders / Notices','Open communication center','notice_order_center')}
      ${action94('✏','Parent Data Updates','Approve once → sync everywhere','v91_parent_updates')}
      ${action94('🚨','System Health','Check security & alerts','system_health')}
      ${action94('🎫','Admit Publish','Fee clear • Select • Parent show','v92_admit_publish')}`;
  }

  async function v94TeacherDashboard(){
    window.__v90Route='dashboard';
    try{if(typeof v14LoadTeacherContext==='function')await v14LoadTeacherContext()}catch(_){}
    v94InstallShell('dashboard');
    const tp=window.v14TeacherProfile||{},name=tp.teacher_name||window.profile?.full_name||'Teacher';
    let classes=[];try{classes=typeof v14AllowedClassNames==='function'?v14AllowedClassNames():[]}catch(_){}
    let sched=[];try{
      let day=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
      let r=await sb.from('timetable').select('*').eq('teacher_name',name).eq('day_name',day).order('period_no');
      sched=r.data||[];
    }catch(_){}
    const host=document.getElementById('erpContent'); if(!host)return;
    host.innerHTML=`<div class="v94Dash">
      <section class="v94Greeting"><div><small>TEACHER DASHBOARD</small><h1>Good Morning, ${esc94(name)} 👋</h1><p>Teach, track, and inspire every day.</p></div>
      <div class="v94GreetingRight"><div class="v94Date">📅 <span>${esc94(v94Now())}</span></div><div class="v94Online"><i></i><span><b>Online</b><small>Teacher Portal</small></span></div></div></section>
      <section class="v94Stats teacher">
        ${[['🏫','My Classes',classes.length,'Assigned Classes','blue'],['👥','Students','—','My Students','green'],['🕐',"Today's Periods",sched.length,'Scheduled','yellow'],['✓','Attendance','Today','Mark / View','pink'],['▣','Pending Tasks','Open','To Do','purple'],['📣','Notices','View','Latest','cyan']].map(x=>`<div class="v94Stat ${x[4]}"><span>${x[0]}</span><div><small>${x[1]}</small><b>${x[2]}</b><em>${x[3]}</em></div><i>›</i></div>`).join('')}
      </section>
      <section class="v94MainGrid teacher">
        <article class="v94Panel"><header><div><h2>📅 Today's Teaching Schedule</h2><p>Admin timetable से automatic generated</p></div><button onclick="render('teacher_bells')">View Full</button></header>
          <div class="v94Schedule">${sched.length?sched.map(x=>`<button onclick="v90OpenTeacherDailyBell(${Number(x.period_no)||0})"><span>${esc94(x.period_no||'')}</span><span>${v90FmtTime(x.start_time)}–${v90FmtTime(x.end_time)}</span><b>Class ${esc94(x.class_name||'')}</b><b>${esc94(x.subject||'')}</b><em>Mark ›</em></button>`).join(''):'<div class="empty">आज का timetable नहीं मिला।</div>'}</div>
        </article>
        <article class="v94Panel"><header><div><h2>⚡ Quick Access</h2><p>My daily work</p></div></header><div class="v94Quick">
          ${quick94('👥','My Class','teacher_class')}${quick94('✓','Attendance','attendance')}${quick94('📖','Teaching','v90_teacher_daily')}${quick94('✏','Homework','homework')}${quick94('A+','Marks','v90_teacher_marks')}${quick94('📷','Photos','v91_student_photos')}${quick94('📬','Requests','v90_my_requests')}${quick94('📣','Orders','teacher_notices')}
        </div></article>
      </section>
      <footer class="v94Footer"><span>© 2026 L D MODERN EDUCATION ACADEMY</span><b>Together for a Brighter Tomorrow</b></footer>
    </div>`;
  }

  function v94PolishParent(){
    const pd=document.getElementById('parentDashboard');
    if(!pd||pd.classList.contains('hidden'))return;
    pd.classList.add('v94Parent');
    let head=pd.querySelector('.portalHead');
    if(head&&!head.querySelector('.v94ParentBrand')){
      head.innerHTML=`<div class="v94ParentBrand"><img src="school-logo.png" alt="" onerror="this.style.display='none'"><div><b>L D MODERN EDUCATION ACADEMY</b><span>Parent / Student Portal</span></div></div><div class="v94ParentHeadActions"><button onclick="v94ParentBack()">← Back</button><button onclick="loadParentPortal()">⌂ Home</button><button onclick="parentSignOut()">Logout</button></div>`;
    }
  }


  function v94ParentBack(){
    try{
      // Close any open child modal/panel first; otherwise return to Parent/Student home.
      const modal=[...document.querySelectorAll('#parentDashboard .modal:not(.hidden),#parentDashboard .v14Modal:not(.hidden),#parentDashboard [role="dialog"]:not(.hidden)')].pop();
      if(modal){ modal.classList.add('hidden'); return; }
      if(typeof window.loadParentPortal==='function') return window.loadParentPortal();
    }catch(_){ }
  }

  const V94_ROUTE_TITLES={
    admissions:'Admission',students:'Students',staff:'Teachers',attendance:'Attendance',master_attendance:'Master Attendance',
    master_fee:'Master Fee Management',exam_admit_center:'Exams & Admit Card',academics:'Academics',van_center:'Transport',
    notice_order_center:'Orders / Notices',reports:'Reports',settings:'Settings',teacher_profile:'My Profile',teacher_class:'My Class',
    teacher_bells:'My Teaching',v90_teacher_daily:'Daily Teaching',homework:'Homework',v90_teacher_marks:'Exams & Marks',
    v90_my_requests:'My Requests',v91_student_photos:'Student Photos',my_notes:'My Notes',teacher_notices:'Notices',class_opinions:'Class Review'
  };

  function v94InstantOpen(route){
    try{
      const r=String(route||'dashboard');
      if(r==='dashboard') return;
      const erp=document.getElementById('erp');
      if(!erp||erp.classList.contains('hidden')) return;
      // Header + Back + active sidebar change immediately on click, before network data returns.
      v94BuildNav(r);
      v94Header(r);
      const host=document.getElementById('erpContent');
      if(!host) return;
      const title=V94_ROUTE_TITLES[r]||String(r).replaceAll('_',' ').replace(/\\b\\w/g,m=>m.toUpperCase());
      host.innerHTML=`<section class="v94InstantPage" aria-label="${esc94(title)}"><header><span></span><div><b>${esc94(title)}</b><small>Preparing your data…</small></div></header><div class="v94InstantGrid"><i></i><i></i><i></i><i></i><i></i><i></i></div></section>`;
    }catch(_){ }
  }

  function v94SilenceLoading(root=document){
    try{
      root.querySelectorAll?.('.empty,.v39Empty').forEach(el=>{
        if(/^loading(?:\\.{3}|…)?$/i.test(String(el.textContent||'').trim())){
          el.classList.add('v94SilentLoad');
          el.innerHTML='<span></span><span></span><span></span>';
        }
      });
    }catch(_){ }
  }

  function v94EnsureBack(route){
    try{
      const r=String(route||window.__v90Route||'dashboard');
      if(!document.getElementById('erp')?.classList.contains('hidden')){
        // Rebuild the approved header after every module render so Back cannot disappear.
        v94InstallShell(r);
        const b=document.querySelector('#erp .v94Back');
        if(r!=='dashboard' && !b) v94Header(r);
      }
    }catch(_){ }
  }

  // Wrap the final render chain. Navigation shell changes immediately; data can finish asynchronously.
  const v94PrevRender=window.render;
  if(typeof v94PrevRender==='function' && !v94PrevRender.__v94BackChecked){
    const v94WrappedRender=async function(route='dashboard'){
      const r=String(route||'dashboard');
      v94InstantOpen(r);
      // Yield one frame so the new page/header is painted before Supabase/network work begins.
      await new Promise(resolve=>requestAnimationFrame(()=>resolve()));
      let result=await v94PrevRender.apply(this,arguments);
      const finalRoute=String(route||window.__v90Route||'dashboard');
      [0,30,100,240].forEach(ms=>setTimeout(()=>v94EnsureBack(finalRoute),ms));
      setTimeout(()=>v94SilenceLoading(document.getElementById('erpContent')||document),0);
      return result;
    };
    v94WrappedRender.__v94BackChecked=true;
    window.render=v94WrappedRender;
  }

  const oldParentLoad=window.loadParentPortal;
  if(typeof oldParentLoad==='function'){
    window.loadParentPortal=async function(){let r=await oldParentLoad.apply(this,arguments);setTimeout(v94PolishParent,0);return r}
  }

  window.v94Back=v94Back;
  window.v94ParentBack=v94ParentBack;
  window.v94Fullscreen=v94Fullscreen;
  window.v90InstallShell=v94InstallShell;
  window.v90BuildNav=v94BuildNav;
  window.v90AdminDashboard=v94AdminDashboard;
  window.v90TeacherDashboard=v94TeacherDashboard;

  let v94RepairTimer=0;
  const obs=new MutationObserver(()=>{
    if(document.getElementById('erp')?.classList.contains('hidden')) return;
    clearTimeout(v94RepairTimer);
    v94RepairTimer=setTimeout(()=>{
      const top=$q('#erp .erpTop');
      if(!top) return;
      // If any older script rebuilds/injects the old header, restore approved V94 once.
      if(!top.querySelector('.v94Brand') || top.querySelector('.v63SchoolHead,#v63AdminBox,#v764LiveBadge,.websiteBtn,#v75DarkBtn')){
        v94Header(window.__v90Route||'dashboard');
      }else v94CleanLegacyHeader();
    },0);
  });
  const contentObs=new MutationObserver(()=>v94SilenceLoading(document.getElementById('erpContent')||document));
  window.addEventListener('load',()=>{
    setTimeout(()=>{
      const top=$q('#erp .erpTop'); if(top) obs.observe(top,{childList:true,subtree:false});
      const content=document.getElementById('erpContent'); if(content) contentObs.observe(content,{childList:true,subtree:true});
      if(!document.getElementById('erp')?.classList.contains('hidden')) v94EnsureBack(window.__v90Route||'dashboard');
      v94SilenceLoading(document);
      v94PolishParent();
    },250);
  });
})();
