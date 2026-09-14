
(function(){
  'use strict';

  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc100=v=>{
    try{return typeof v90Safe==='function'?v90Safe(v):String(v??'')}
    catch(_e){return String(v??'')}
  };
  const role100=()=>{
    let raw='';
    try{raw=window.profile?.role||((typeof profile!=='undefined'&&profile?.role)||'')}catch(_e){}
    return String(raw||'').trim().toLowerCase().replace(/[\s-]+/g,'_');
  };
  const isAdmin100=()=>['super_admin','superadmin','admin','principal'].includes(role100());
  const isTeacher100=()=>role100()==='teacher';
  const money100=v=>{try{return typeof v90Money==='function'?v90Money(v):'₹'+Number(v||0).toLocaleString('en-IN')}catch(_e){return '₹0'}};
  const today100=()=>{try{return typeof v90Today==='function'?v90Today():new Date().toISOString().slice(0,10)}catch(_e){return new Date().toISOString().slice(0,10)}};
  const session100=()=>{try{return typeof v90Session==='function'?v90Session():(window.school?.academic_session||'2026-27')}catch(_e){return '2026-27'}};

  let activeRoute100='dashboard';
  let repairing100=false;

  const ADMIN_NAV100=[
    ['dashboard','⌂','Dashboard'],
    ['admissions','✚','Admission'],
    ['students','👥','Students'],
    ['staff','👨‍🏫','Teachers'],
    ['attendance','✓','Attendance'],
    ['master_fee','₹','Fee & Accounts'],
    ['exam_admit_center','▣','Exams & Results'],
    ['academics','▤','Academics'],
    ['van_center','▰','Transport'],
    ['notice_order_center','📣','Communication'],
    ['reports','▥','Reports'],
    ['settings','⚙','Settings']
  ];
  const TEACHER_NAV100=[
    ['dashboard','⌂','Home'],
    ['teacher_profile','👤','My Profile'],
    ['teacher_class','👥','My Class'],
    ['teacher_bells','▦','My Teaching'],
    ['attendance','✓','Attendance'],
    ['master_attendance','▣','Master Attendance'],
    ['v91_student_photos','▧','Student Photos'],
    ['homework','▤','Homework'],
    ['v90_teacher_marks','A+','Exams & Marks'],
    ['my_notes','▣','My Notes'],
    ['teacher_notices','📣','Notices'],
    ['v90_my_requests','📬','My Requests'],
    ['class_opinions','💬','Class Review']
  ];

  function clearOldWallpaper100(){
    try{
      const erp=document.getElementById('erp');
      if(erp){
        erp.classList.remove('roleWallpaper');
        erp.style.removeProperty('--role-wallpaper');
      }
      const pp=document.getElementById('parentPortal');
      if(pp){
        pp.classList.remove('parentWallpaper');
        pp.style.removeProperty('--parent-wallpaper');
      }
      document.body.classList.remove('v75Dark');
    }catch(_e){}
  }
  window.applyPortalWallpapers=clearOldWallpaper100;

  function roleName100(){
    if(isAdmin100())return 'Admin';
    return window.v14TeacherProfile?.teacher_name||window.profile?.full_name||'Teacher';
  }
  function roleLabel100(){
    if(isAdmin100())return role100()==='principal'?'Principal':'Super Admin';
    return 'Teacher';
  }
  function now100(){
    try{return new Date().toLocaleString('en-IN',{weekday:'short',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
    catch(_e){return ''}
  }

  function routeTitle100(r){
    const map={
      dashboard:'Dashboard',admissions:'Admission',students:'Students',staff:'Teachers / Staff',attendance:'Attendance',
      master_attendance:'Master Attendance',master_fee:'Master Fee Management',smart_fee_center:'Fee Collection',
      exam_admit_center:'Exams & Admit Card',academics:'Academics',van_center:'Transport',notice_order_center:'Orders / Notices',
      reports:'Reports',settings:'Settings',teacher_profile:'My Profile',teacher_class:'My Class',teacher_bells:'My Teaching',
      v90_teacher_daily:'Daily Teaching',homework:'Homework',v90_teacher_marks:'Exams & Marks',my_notes:'My Notes',
      teacher_notices:'Notices',v90_my_requests:'My Requests',class_opinions:'Class Review',timetable_master:'Timetable Master',
      system_health:'System Health',v92_admit_publish:'Admit Publish',v91_parent_updates:'Parent Data Updates',v91_student_photos:'Student Photos'
    };
    return map[r]||String(r||'').replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase());
  }

  function back100(){
    try{
      if(typeof window.v92Back==='function')return window.v92Back();
      if(typeof window.v91Back==='function')return window.v91Back();
      if(typeof window.v90Back==='function')return window.v90Back();
    }catch(_e){}
    return window.render?.('dashboard');
  }

  function full100(){
    try{
      if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
    }catch(_e){}
  }

  function search100(){
    const input=document.getElementById('v75TopQ');
    const value=String(input?.value||'').trim();
    if(!value)return;
    if(isAdmin100()&&typeof window.v764MasterSearchRun==='function')return window.v764MasterSearchRun();
    try{return window.render?.('dashboard_search')}catch(_e){}
  }

  function brand100(){
    return `<div class="v100Mark">LD</div><div class="v100BrandText"><b>L D MODERN EDUCATION ACADEMY</b><span>Gambhiriya Bujurg, Singhapatti, Kushinagar</span></div>`;
  }

  function buildNav100(active=activeRoute100){
    const host=document.getElementById('erpNav');
    if(!host)return;
    const nav=isAdmin100()?ADMIN_NAV100:(isTeacher100()?TEACHER_NAV100:null);
    if(!nav)return;
    const expected=nav.map(x=>x[0]);
    const signature=expected.join('|')+'@'+active;
    const buttons=[...host.children].filter(x=>x.tagName==='BUTTON');
    const actual=buttons.map(b=>String(b.dataset.route||''));
    const healthy=host.classList.contains('v100Nav')&&actual.length===expected.length&&actual.every((r,i)=>r===expected[i]);
    if(host.dataset.v100Signature===signature&&healthy){
      buttons.forEach(b=>b.classList.toggle('active',b.dataset.route===active));
      return;
    }
    host.dataset.v100Signature=signature;
    host.className='v100Nav';
    host.innerHTML=nav.map(x=>`<button data-route="${x[0]}" class="${active===x[0]?'active':''}" onclick="render('${x[0]}')"><span>${x[1]}</span><b>${x[2]}</b></button>`).join('');
  }

  function header100(active=activeRoute100){
    const top=q('#erp .erpTop');
    if(!top)return;
    const needBack=active!=='dashboard';
    top.className='erpTop v100Top';
    top.dataset.v100='1';
    top.dataset.v100Role=role100();
    top.innerHTML=`
      <button class="v100Menu" type="button" onclick="document.querySelector('#erp aside')?.classList.toggle('open')" aria-label="Menu">☰</button>
      <div class="v100Brand">${brand100()}</div>
      <div id="v75TopSearch" data-v764="1" class="v100Search">
        ${needBack?`<button class="v100Back" type="button" onclick="v100Back()" title="Back">←</button>`:''}
        <input id="v75TopQ" autocomplete="off" placeholder="${isAdmin100()?'Search student, teacher, fee, notice, function...':'Search class, student, notice...'}">
        <button type="button" onclick="v100Search()" title="Search">⌕</button>
      </div>
      <div class="v100TopActions">
        <button id="v62Bell" class="v100Icon" type="button" onclick="window.v62ToggleNotifications?.()" title="Notifications">🔔<span id="v62Badge" class="v62Badge zero">0</span></button>
        <button class="v100Icon" type="button" onclick="v100Fullscreen()" title="Fullscreen">⛶</button>
        <button class="v100Profile" type="button" onclick="${isAdmin100()?"render('settings')":"render('teacher_profile')"}">
          <span class="v100Avatar">${isAdmin100()?'A':'T'}</span>
          <span><b>${esc100(roleName100())}</b><small>${esc100(roleLabel100())}</small></span><em>⌄</em>
        </button>
      </div>
      <span id="erpTitle" class="v100CompatTitle">${esc100(routeTitle100(active))}</span>
      <span id="erpSub" class="v100CompatTitle"></span>`;
    const input=document.getElementById('v75TopQ');
    input?.addEventListener('keydown',e=>{if(e.key==='Enter')search100()});
  }

  const LEGACY_TOP100=[
    '#v64HealthBadge','#v764LiveBadge','.v63Msg','#v63AdminBox','.v63TopLogout','.websiteBtn','#v75DarkBtn',
    '[data-v58-order]','[data-v58-settings]','#v90HomeBtn','#v90BackBtn','.erpHomeBtn','.v63SchoolHead','.v45NavControls',
    '.v75BackBtn','.hamb:not(.v100Menu)'
  ].join(',');

  function removeLegacyTop100(){
    const top=q('#erp .erpTop');
    if(!top)return;
    qa(LEGACY_TOP100,top).forEach(el=>el.remove());
    qa('#v75TopSearch',top).slice(1).forEach(el=>el.remove());
    qa('#v62Bell',top).slice(1).forEach(el=>el.remove());
  }

  function installShell100(active=activeRoute100){
    const erp=document.getElementById('erp');
    if(!erp||erp.classList.contains('hidden'))return;
    activeRoute100=String(active||'dashboard');
    window.__v90Route=activeRoute100;
    clearOldWallpaper100();
    erp.classList.add('v100Shell');
    erp.classList.remove('roleWallpaper');
    const brand=q('#erp .sideBrand');
    if(brand){
      brand.className='sideBrand v100SideBrand';
      brand.innerHTML=`${brand100()}`;
    }
    buildNav100(activeRoute100);
    header100(activeRoute100);
    removeLegacyTop100();
    q('#erp aside')?.classList.remove('open');
  }

  function statCard100(icon,label,value,sub,kind){
    return `<article class="v100Stat ${kind}"><span class="v100StatIcon">${icon}</span><div><small>${label}</small><b>${value}</b><em>${sub}</em></div><i>›</i></article>`;
  }
  function action100(icon,title,sub,route){
    return `<button class="v100Action" onclick="render('${route}')"><span>${icon}</span><div><b>${title}</b><small>${sub}</small></div><em>›</em></button>`;
  }
  function quick100(icon,title,route){
    return `<button onclick="render('${route}')"><b>${icon}</b><span>${title}</span></button>`;
  }

  async function adminStats100(){
    let students=0,teachers=0,collection=0,due=0,attPct=0,pending=0,present=0,absent=0,marked=0;
    try{
      if(typeof v90Count==='function'){
        [students,teachers]=await Promise.all([
          v90Count('students',x=>x.neq('status','Inactive')),
          v90Count('teacher_profiles',x=>x.eq('approval_status','Approved'))
        ]);
      }
    }catch(_e){}
    try{
      const r=await sb.from('fee_payments').select('amount').eq('payment_date',today100()).limit(3000);
      collection=(r.data||[]).reduce((a,x)=>a+Number(x.amount||0),0);
    }catch(_e){}
    try{
      const r=await sb.from('student_fee_schedules').select('amount,paid_amount,status').eq('academic_session',session100()).limit(6000);
      due=(r.data||[]).reduce((a,x)=>a+(String(x.status||'').toLowerCase()==='paid'?0:Math.max(Number(x.amount||0)-Number(x.paid_amount||0),0)),0);
    }catch(_e){}
    try{
      const r=await sb.from('attendance').select('status').eq('date',today100()).limit(5000);
      const rows=r.data||[]; marked=rows.length;
      present=rows.filter(x=>String(x.status||'').toLowerCase()==='present').length;
      absent=rows.filter(x=>String(x.status||'').toLowerCase()==='absent').length;
      attPct=marked?Math.round(present*100/marked):0;
    }catch(_e){}
    try{
      const req=await Promise.all([
        sb.from('student_leave_requests').select('id',{count:'exact',head:true}).eq('status','Pending'),
        sb.from('student_correction_requests').select('id',{count:'exact',head:true}).eq('status','Pending'),
        sb.from('student_roster_requests').select('id',{count:'exact',head:true}).eq('status','Pending'),
        sb.from('v90_teacher_requests').select('id',{count:'exact',head:true}).eq('status','Pending')
      ]);
      pending=req.reduce((a,x)=>a+(x.count||0),0);
    }catch(_e){}
    return {students,teachers,collection,due,attPct,pending,present,absent,marked};
  }

  function adminDashboardFrame100(){
    const host=document.getElementById('erpContent');
    if(!host)return;
    host.innerHTML=`
      <div class="v100Dash">
        <section class="v100Greeting">
          <div><small>ADMIN DASHBOARD</small><h1>Good Morning, Admin 👋</h1><p>Manage your school, make a difference today.</p></div>
          <div class="v100GreetingRight">
            <div class="v100Date">📅 <span>${esc100(now100())}</span></div>
            <div class="v100Online"><i></i><span><b>School Online</b><small>All Systems Operational</small></span></div>
          </div>
        </section>
        <section id="v100Stats" class="v100Stats">${Array.from({length:6},()=>'<article class="v100Stat skeleton"></article>').join('')}</section>
        <section class="v100MainGrid">
          <article class="v100Panel">
            <header><div><h2>▣ One-Click Monitoring Center</h2><p>Quick access to key school operations</p></div></header>
            <div class="v100ActionGrid">
              ${action100('📅','Take Attendance','Mark student attendance','attendance')}
              ${action100('👥','Manage Students','View and edit records','students')}
              ${action100('👨‍🏫','Manage Teachers','Teacher profile & subjects','staff')}
              ${action100('₹','Fee Collection','Collect and manage fees','master_fee')}
              ${action100('📊','View Reports','Attendance, fees, exams','reports')}
              ${action100('⚙','School Settings','General configuration','settings')}
            </div>
          </article>
          <article class="v100Panel">
            <header><div><h2>☷ Today's Activity</h2><p>Live school summary</p></div></header>
            <div id="v100Activity" class="v100Activity"></div>
          </article>
        </section>
        <section class="v100BottomGrid">
          <article class="v100Panel">
            <header><div><h2>▣ Attendance Overview</h2><p>Today's attendance</p></div></header>
            <div id="v100Attendance" class="v100Attendance"></div>
          </article>
          <article class="v100Panel">
            <header><div><h2>🔖 Quick Links</h2><p>Frequently used controls</p></div></header>
            <div class="v100Quick">
              ${quick100('🕐','Timetable','timetable_master')}
              ${quick100('₹','Master Fee','master_fee')}
              ${quick100('📊','Class Report','reports')}
              ${quick100('✉','Message','notice_order_center')}
            </div>
          </article>
          <article class="v100Panel">
            <header><div><h2>🔔 Recent Notifications</h2><p>Important school actions</p></div></header>
            <div class="v100Notifications">
              ${action100('📣','Orders / Notices','Communication center','notice_order_center')}
              ${action100('🎫','Admit Publish','Fee clear • Publish to parent','v92_admit_publish')}
              ${action100('🚨','System Health','Security and system alerts','system_health')}
            </div>
          </article>
        </section>
        <footer class="v100Footer"><span>© 2026 L D MODERN EDUCATION ACADEMY</span><b>Education for a Brighter Tomorrow</b></footer>
      </div>`;
  }

  async function adminDashboard100(){
    activeRoute100='dashboard';
    installShell100('dashboard');
    adminDashboardFrame100();
    const s=await adminStats100();
    const statHost=document.getElementById('v100Stats');
    if(!statHost)return;
    statHost.innerHTML=[
      statCard100('👥','Students',s.students,'Total Enrolled','blue'),
      statCard100('👨‍🏫','Teachers',s.teachers,'Active Teachers','green'),
      statCard100('💰','Today Collection',money100(s.collection),'Fees Collected Today','yellow'),
      statCard100('₹','Total Due',money100(s.due),'Pending Fee Amount','pink'),
      statCard100('✓','Attendance',s.attPct?s.attPct+'%':'—','Present Today','purple'),
      statCard100('👤','Pending Requests',s.pending,'New Requests','cyan')
    ].join('');
    const act=document.getElementById('v100Activity');
    if(act)act.innerHTML=`
      ${action100('✚','New Admission','Open admission records','admissions')}
      ${action100('₹','Fee Collection',money100(s.collection)+' collected today','master_fee')}
      ${action100('✓','Attendance Update',(s.attPct||0)+'% present today','master_attendance')}
      ${action100('▣','Pending Requests',s.pending+' new requests','v90_student_requests')}`;
    const att=document.getElementById('v100Attendance');
    if(att)att.innerHTML=`
      <div class="v100Donut" style="--pct:${Math.max(0,Math.min(100,s.attPct||0))}"><b>${s.attPct||0}%</b><span>Present</span></div>
      <div class="v100Legend">
        <span><i class="g"></i>Present <b>${s.present}</b></span>
        <span><i class="r"></i>Absent <b>${s.absent}</b></span>
        <span><i class="b"></i>Marked <b>${s.marked}</b></span>
        <span><i class="k"></i>Total <b>${s.students}</b></span>
      </div>`;
  }

  async function teacherDashboard100(){
    activeRoute100='dashboard';
    try{if(typeof window.v14LoadTeacherContext==='function')await window.v14LoadTeacherContext()}catch(_e){}
    installShell100('dashboard');
    const tp=window.v14TeacherProfile||{};
    const name=tp.teacher_name||window.profile?.full_name||'Teacher';
    let classes=[];try{classes=typeof window.v14AllowedClassNames==='function'?window.v14AllowedClassNames():[]}catch(_e){}
    let sched=[];try{
      const day=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
      const r=await sb.from('timetable').select('*').eq('teacher_name',name).eq('day_name',day).order('period_no');
      sched=r.data||[];
    }catch(_e){}
    let studentCount=0;
    try{
      if(classes.length){
        const r=await sb.from('students').select('id',{count:'exact',head:true}).in('class_name',classes);
        studentCount=r.count||0;
      }
    }catch(_e){}
    const host=document.getElementById('erpContent');if(!host)return;
    host.innerHTML=`
      <div class="v100Dash">
        <section class="v100Greeting">
          <div><small>TEACHER DASHBOARD</small><h1>Good Morning, ${esc100(name)} 👋</h1><p>Teach, track, and inspire every day.</p></div>
          <div class="v100GreetingRight"><div class="v100Date">📅 <span>${esc100(now100())}</span></div><div class="v100Online"><i></i><span><b>Online</b><small>Teacher Portal</small></span></div></div>
        </section>
        <section class="v100Stats">
          ${statCard100('🏫','My Classes',classes.length,'Assigned Classes','blue')}
          ${statCard100('👥','Students',studentCount,'In My Classes','green')}
          ${statCard100('🕐',"Today's Periods",sched.length,'Scheduled','yellow')}
          ${statCard100('✓','Attendance','Today','Mark / View','pink')}
          ${statCard100('▣','Pending Tasks','Open','To Do','purple')}
          ${statCard100('📣','Notices','View','Latest','cyan')}
        </section>
        <section class="v100MainGrid teacher">
          <article class="v100Panel">
            <header><div><h2>📅 Today's Teaching Schedule</h2><p>Admin timetable से automatic generated</p></div><button onclick="render('teacher_bells')">View Full</button></header>
            <div class="v100Schedule">
              ${sched.length?sched.map(x=>`<button onclick="window.v90OpenTeacherDailyBell?.(${Number(x.period_no)||0})"><span>${esc100(x.period_no||'')}</span><span>${esc100(String(x.start_time||'').slice(0,5))}–${esc100(String(x.end_time||'').slice(0,5))}</span><b>Class ${esc100(x.class_name||'')}</b><b>${esc100(x.subject||'')}</b><em>Mark ›</em></button>`).join(''):'<div class="empty">आज का timetable नहीं मिला।</div>'}
            </div>
          </article>
          <article class="v100Panel">
            <header><div><h2>⚡ Quick Access</h2><p>My daily work</p></div></header>
            <div class="v100Quick">
              ${quick100('👥','My Class','teacher_class')}
              ${quick100('✓','Attendance','attendance')}
              ${quick100('📖','Teaching','v90_teacher_daily')}
              ${quick100('✏','Homework','homework')}
              ${quick100('A+','Marks','v90_teacher_marks')}
              ${quick100('📣','Notices','teacher_notices')}
            </div>
          </article>
        </section>
        <footer class="v100Footer"><span>© 2026 L D MODERN EDUCATION ACADEMY</span><b>Together for a Brighter Tomorrow</b></footer>
      </div>`;
  }

  function instantPage100(route){
    if(route==='dashboard')return;
    installShell100(route);
    const host=document.getElementById('erpContent');
    if(!host)return;
    host.innerHTML=`<section class="v100LoadingPage"><header><span></span><div><b>${esc100(routeTitle100(route))}</b><small></small></div></header><div class="v100Shimmer"><i></i><i></i><i></i><i></i></div></section>`;
  }

  function polishChild100(route){
    installShell100(route);
    const host=document.getElementById('erpContent');
    if(!host)return;
    host.classList.add('v100Content');
    qa('.empty,.v39Empty',host).forEach(el=>{
      const t=String(el.textContent||'').trim();
      if(/^loading(?:\.{3}|…)?$/i.test(t))el.innerHTML='<span class="v100MiniLoad"></span>';
    });
  }

  function parentBack100(){
    try{
      const modal=[...document.querySelectorAll('#parentDashboard .modal:not(.hidden),#parentDashboard .v14Modal:not(.hidden),#parentDashboard [role="dialog"]:not(.hidden)')].pop();
      if(modal){modal.classList.add('hidden');return}
    }catch(_e){}
    try{window.loadParentPortal?.()}catch(_e){}
  }

  function polishParent100(){
    const pd=document.getElementById('parentDashboard');
    if(!pd||pd.classList.contains('hidden'))return;
    clearOldWallpaper100();
    pd.classList.add('v100Parent');
    const head=q('.portalHead',pd);
    if(head){
      head.className='portalHead v100ParentHead';
      head.innerHTML=`
        <div class="v100ParentBrand">${brand100()}</div>
        <div class="v100ParentActions">
          <button onclick="v100ParentBack()">← Back</button>
          <button onclick="loadParentPortal()">⌂ Home</button>
          <button onclick="parentSignOut()">Logout</button>
        </div>`;
    }
  }

  function ensureClean100(){
    if(repairing100)return;
    repairing100=true;
    try{
      clearOldWallpaper100();
      const erp=document.getElementById('erp');
      if(erp&&!erp.classList.contains('hidden')){
        const top=q('.erpTop',erp);
        const bad=top&&!top.classList.contains('v100Top');
        const legacy=top&&q(LEGACY_TOP100,top);
        const knownRole=isAdmin100()||isTeacher100();
        const wrongRole=knownRole&&top&&top.dataset.v100Role!==role100();
        if(bad||legacy||wrongRole)header100(activeRoute100);
        removeLegacyTop100();
        const nav=document.getElementById('erpNav');
        if(nav&&knownRole)buildNav100(activeRoute100);
      }
      polishParent100();
    }catch(_e){}
    repairing100=false;
  }

  const baseRender100=window.render;
  if(typeof baseRender100==='function'){
    window.render=async function(route='dashboard'){
      const r=String(route||'dashboard');
      activeRoute100=r;
      if(r==='dashboard'){
        if(isAdmin100())return adminDashboard100();
        if(isTeacher100())return teacherDashboard100();
      }
      instantPage100(r);
      await new Promise(resolve=>requestAnimationFrame(resolve));
      const result=await baseRender100.apply(this,arguments);
      [0,25,90,220].forEach(ms=>setTimeout(()=>polishChild100(r),ms));
      return result;
    };
  }

  const baseOpen100=window.openERP;
  if(typeof baseOpen100==='function'){
    window.openERP=async function(){
      clearOldWallpaper100();
      const result=await baseOpen100.apply(this,arguments);
      setTimeout(()=>installShell100(window.__v90Route||activeRoute100||'dashboard'),0);
      return result;
    };
  }

  const baseParent100=window.loadParentPortal;
  if(typeof baseParent100==='function'){
    window.loadParentPortal=async function(){
      const r=await baseParent100.apply(this,arguments);
      setTimeout(polishParent100,0);
      return r;
    };
  }

  window.v100Back=back100;
  window.v100Search=search100;
  window.v100Fullscreen=full100;
  window.v100ParentBack=parentBack100;
  window.v90InstallShell=installShell100;
  window.v90BuildNav=buildNav100;
  window.v90AdminDashboard=adminDashboard100;
  window.v90TeacherDashboard=teacherDashboard100;

  // Neutralize old UI-only injectors. Business/data functions remain untouched.
  ['v58AdminSidebar','v59AdminSidebar','v48AdminSidebar','v59TeacherSidebar','v74InstallNav','v75InstallNav','v763InstallNav'].forEach(name=>{
    try{if(typeof window[name]==='function')window[name]=()=>buildNav100(activeRoute100)}catch(_e){}
  });
  ['v58EnsureTopBar','v75InstallTopControls','v764InstallMasterSearch','v64InstallHealthBadge'].forEach(name=>{
    try{if(typeof window[name]==='function')window[name]=()=>ensureClean100()}catch(_e){}
  });
  try{if(typeof window.v764Badge==='function')window.v764Badge=()=>{}}catch(_e){}

  window.addEventListener('load',()=>{
    clearOldWallpaper100();
    setTimeout(ensureClean100,80);
    setTimeout(ensureClean100,400);
    setTimeout(ensureClean100,1200);
    const erp=document.getElementById('erp');
    if(erp){
      const mo=new MutationObserver(()=>setTimeout(ensureClean100,0));
      mo.observe(erp,{childList:true,subtree:true});
      window.__v100Observer=mo;
    }
  });
})();
