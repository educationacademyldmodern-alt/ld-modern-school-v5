/* LD MODERN ERP V539: one-sector dashboard rearrangement.
 * This file adds ONLY a presentation/navigation layer to the authenticated, live ERP.
 * Existing nodes, route handlers, form state, dashboards, permissions and API calls remain intact.
 * Distinct legacy actions remain accessible. Only audited redundant route launchers are removed.
 */
(()=>{
  'use strict';
  const W=window, D=document, roles=new Set(['admin','super_admin','principal']);
  if(W.LDM_DASHBOARD_V539)return;
  const admin=()=>roles.has(String(W.profile?.role||'').toLowerCase());
  const root=()=>D.querySelector('#erpContent > .ldm535PremiumDashboard');
  const q=(s,r=D)=>r?.querySelector(s);
  const el=(tag,cls,txt)=>{const e=D.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=String(txt);return e;};
  const categories=[
    {id:'students',icon:'🎓',label:'Students & Admission',hindi:'विद्यार्थी एवं प्रवेश',re:/(student|admission|parent|class.teacher|udise|enquiry|transport)/i},
    {id:'teachers',icon:'👩‍🏫',label:'Teacher & Staff',hindi:'शिक्षक एवं कर्मचारी',re:/(teacher|staff|work.delegation|delegat|responsibility|leave)/i},
    {id:'exams',icon:'📚',label:'Exams & Academic',hindi:'परीक्षा एवं शिक्षण',re:/(exam|mark|academic|checking|homework|teaching|syllabus|timetable|result)/i},
    {id:'finance',icon:'₹',label:'Finance & Fees',hindi:'शुल्क एवं लेखा',re:/(fee|due|ledger|account|receipt|payment|collection|expense)/i},
    {id:'documents',icon:'📄',label:'Documents & ID',hindi:'दस्तावेज एवं पहचान',re:/(document|certificate|id.card|marksheet|admit.card|letter|bonafide|tc\b)/i},
    {id:'qr',icon:'▦',label:'QR & Security',hindi:'क्यूआर एवं सुरक्षा',re:/(\bqr\b|scan|storage|gate|security|visitor)/i},
    {id:'management',icon:'⚙️',label:'Management',hindi:'प्रबंधन एवं नियंत्रण',re:/(management|attendance|presence|setting|request|control|monitor)/i},
    {id:'reports',icon:'📊',label:'Reports & Utilities',hindi:'रिपोर्ट एवं अन्य कार्य',re:/(report|notice|calendar|event|utility|communic|dashboard)/i}
  ];
  let selection='all',search='',lastCatalog='',observer=null,pending=false,activeRoot=null;
  function safeRoute(route){
    if(!admin()||!root()||!route||typeof W.render!=='function')return;
    try{const p=W.render(route);if(p&&typeof p.catch==='function')p.catch(e=>W.toast?.(String(e?.message||e)));}
    catch(e){W.toast?.(String(e?.message||e));}
  }
  // Only literal render calls are proven equivalent. Preserve arguments, scoped actions,
  // dynamic badges and unknown handlers; never infer equivalence from the label.
  const literalRoute=/^\s*(?:window\.)?render\(\s*['"]([\w-]+)['"]\s*\)\s*;?\s*$/;
  function routeOf(button){return literalRoute.exec(button.getAttribute('onclick')||'')?.[1]||button.dataset.ldm535Route||'';}
  function liveEntries(r){
    const result=new Map(), quick=new Set();
    const add=(item)=>{const route=String(item.route||'').trim();if(!/^[\w-]{1,95}$/.test(route)||!item.title)return;
      if(!result.has(route))result.set(route,{route,title:item.title,icon:item.icon||'📌',detail:item.detail||'',native:null});};
    (W.LDM_PREMIUM_V500?.catalog?.()||[]).forEach(add);
    // V535's proven admin shortcuts are registered here rather than generated twice.
    for(const [icon,title,route] of [['📝','Exams & Marks','central_exam'],['🧩','Assign Work','work_delegation'],['⏰','Timetable','timetable_master'],['🚨','Work Alarm','smart_work_alarm'],['📣','Notices & Circular','notice_order_center'],['📊','Reports','reports']])add({icon,title,route});
    const officeAssign=q('#s336DashboardCard [data-open="assign"]',D);
    if(officeAssign&&!officeAssign.hidden&&!officeAssign.disabled&&q('#ldmOffice',r)&&q('#ldm542OfficeButton'))quick.add('work_delegation');
    r.querySelectorAll('#v185FrontDesk .v185FrontActions > button').forEach(b=>{const route=routeOf(b);if(route&&!b.hidden&&!b.disabled)quick.add(route)});
    // Static original cards, including special badge-bearing buttons, retain their native nodes.
    const src=r.querySelectorAll('.ldm535FullSections .v90MonitorGrid > button,.ldm535FullSections .ldmMasterGrid > button,.ldm535FullSections #v149AdminQuickSlot .ldmTeacherModules > button,.ldm539CardGrid .ldm542Native');
    for(const button of src){const route=routeOf(button);if(!route)continue;
      const item={route,title:button.querySelector('b,strong')?.textContent?.trim()||button.textContent.trim().slice(0,90),icon:button.querySelector('i,.v90MonitorIcon')?.textContent?.trim()||'📌',detail:button.querySelector('small')?.textContent?.trim()||''};
      add(item);const entry=result.get(route);if(!entry)continue;
      const special=!!(button.id||button.querySelector('[id],[data-v102-gate-badge]')||[...button.attributes].some(a=>a.name.startsWith('data-')&&!['data-ldm542-native','data-route','data-category'].includes(a.name)));
      if(quick.has(route)||route==='marksheet_center'){
        if(!special){button.remove();continue;}
        // Different live state is not a duplicate. Keep original control and its unique information.
        continue;
      }
      if(!entry.native){entry.native=button;entry.title=item.title;entry.detail=item.detail||entry.detail;entry.icon=item.icon;}
      else if(entry.native!==button&&!special){button.remove();}
    }
    // Known native quick links: exact literal route only, keep unique controls intact.
    for(const b of r.querySelectorAll('.v114QuickGrid > button[onclick]')){const route=routeOf(b);if(!route)continue;
      if(quick.has(route)||result.has(route)){if(!b.id&&!b.querySelector('[id]'))b.remove();}
      else {add({route,title:b.querySelector('span')?.textContent||b.textContent,icon:b.querySelector('b')?.textContent});const e=result.get(route);if(e)e.native=b;}
    }
    for(const b of r.querySelectorAll('.v114QuickPanel .v114PanelHead > button[onclick]')){if(routeOf(b)==='settings'&&result.has('settings')&&!b.id)b.remove();}
    for(const panel of r.querySelectorAll('.v114QuickPanel')){const grid=q('.v114QuickGrid',panel);if(grid&&!grid.children.length&&!panel.querySelector('button,a,input,select,textarea,[id]'))panel.remove();}
    return [...result.values()].filter(e=>!quick.has(e.route)&&e.route!=='marksheet_center');
  }
  function classify(item){
    const route=String(item.route||'').toLowerCase(),s=[item.title,item.detail,route].join(' ');
    if(/qr|scanner|storage/.test(route))return 'qr';
    if(/marksheet|certificate|idcard|id_card|document|admit|result_receipt/.test(route))return 'documents';
    if(/fee|due|ledger|account|receipt|payment|collection|expense/.test(route))return 'finance';
    if(/class_teacher_control/.test(route))return 'students';
    if(/staff|teacher_requests|work_delegation|teacher_register/.test(route))return 'teachers';
    if(/exam|mark|academic|teaching|checking|homework|timetable|result/.test(route))return 'exams';
    if(/report|notice|calendar|event|activit|utility|communication/.test(route))return 'reports';
    if(/attendance|presence|request|gate|setting|monitor|management|control|alarm/.test(route))return 'management';
    if(/student|admission|parent|udise|enquiry|transport/.test(route))return 'students';
    for(const key of ['finance','documents','qr','exams','teachers','students','management','reports'])if(categories.find(c=>c.id===key).re.test(s))return key;
    return 'reports';
  }
  function ensureModules(r){
    const mount=q('#ldm535FullAccess .ldm535FullBody',r);if(!mount)return;
    let main=q('#ldm539Modules',mount);
    if(main)return main;
    main=el('section','ldm539Modules');main.id='ldm539Modules';main.setAttribute('aria-label','All existing ERP modules');
    const header=el('div','ldm539ModuleHeader');const copy=el('div');
    copy.append(el('span','ldm539Eyebrow','ALL FUNCTIONS • ONE SECTOR'),el('h2','','A–Z School Management & Services'),el('p','','सभी उपलब्ध मॉड्यूल अपनी वास्तविक सुविधाओं और अनुमति के साथ'));
    const badge=el('span','ldm539LiveBadge','ERP • LIVE ROUTES');header.append(copy,badge);
    const controls=el('div','ldm539Controls'),filters=el('div','ldm539CategoryTabs');filters.setAttribute('role','group');filters.setAttribute('aria-label','Filter ERP modules');
    const groups=[{id:'all',icon:'✦',label:'All Cards',hindi:'सभी कार्ड'}];
    groups.forEach(group=>{
      const b=el('button','ldm539CategoryTab',group.icon+'  '+group.label);
      b.type='button';b.dataset.category=group.id;b.title=group.hindi;
      b.setAttribute('aria-pressed',String(group.id===selection));b.addEventListener('click',()=>{selection=group.id;applyFilter(r);});filters.append(b);
    });
    const searchArea=el('div','ldm539SearchArea');const searchInput=el('input','ldm539Search');searchInput.type='search';searchInput.placeholder='कार्ड / विषय / काम खोजें…';
    searchInput.setAttribute('aria-label','Search loaded ERP cards');searchInput.autocomplete='off';searchInput.value=search;
    searchInput.addEventListener('input',()=>{selection='all';search=searchInput.value.toLocaleLowerCase().trim();applyFilter(r);});
    const count=el('output','ldm539Count');count.setAttribute('aria-live','polite');count.textContent='—';searchArea.append(searchInput,count);
    const status=el('button','ldm539CategoryTab','📊 Universal ERP लाइव स्थिति');status.type='button';status.addEventListener('click',()=>W.LDM_PREMIUM_V500?.open?.());controls.append(filters,searchArea,status);const grid=el('div','ldm539CardGrid');grid.id='ldm539CardGrid';
    const none=el('p','ldm539Empty','इस खोज से मेल खाने वाला कार्ड नहीं मिला।');none.hidden=true;
    main.append(header,controls,grid,none);
    const directory=el('details','ldm540Directory');
    directory.append(el('summary','','सभी कार्य खोजें / Search all functions'),main);
    directory.addEventListener('toggle',()=>{if(directory.open)populate(r)});
    mount.append(directory);directory.open=true;
    return main;
  }
  function populate(r){
    const main=q('#ldm539Modules',r),grid=q('#ldm539CardGrid',main);if(!grid)return;
    const entries=liveEntries(r),hash=entries.map(e=>e.route+'|'+e.title+'|'+e.detail).join('\n');
    if(hash===lastCatalog && grid.querySelectorAll('.ldm539ModuleCard').length===entries.length&&entries.every(e=>!e.native||grid.contains(e.native))){applyFilter(r);return;}
    lastCatalog=hash;const fragment=D.createDocumentFragment();
    for(const group of categories){
      const section=el('section','ldm542Group');section.dataset.category=group.id;
      section.append(el('h3','ldm542GroupTitle',group.icon+' '+group.label+' / '+group.hindi));const tiles=el('div','ldm542GroupTiles');section.append(tiles);
      for(const entry of entries.filter(e=>classify(e)===group.id)){
        const tile=entry.native||el('button','ldm539ModuleCard');tile.type='button';tile.classList.add('ldm539ModuleCard');tile.dataset.category=group.id;tile.dataset.route=entry.route;
        if(entry.native){tile.classList.add('ldm542Native');tile.dataset.ldm542Native='1';}
        else {const art=el('span','ldm539ModuleIcon',entry.icon),info=el('span','ldm539ModuleCopy');info.append(el('strong','',entry.title),el('small','',entry.detail||'मूल ERP सुविधा खोलें'));tile.append(art,info,el('span','ldm539ModuleArrow','➜'));tile.addEventListener('click',()=>safeRoute(entry.route));}
        tile.title=entry.title+' • '+entry.route;tiles.append(tile);
      }
      if(tiles.children.length)fragment.append(section);
    }
    grid.replaceChildren(fragment);applyFilter(r);
  }
  function applyFilter(r){
    const main=q('#ldm539Modules',r);if(!main)return;let count=0;
    main.querySelectorAll('.ldm539CategoryTab').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===selection)));
    const cards=main.querySelectorAll('.ldm539ModuleCard');cards.forEach(b=>{const okay=(selection==='all'||selection===b.dataset.category)&&(!search||[b.textContent,b.dataset.route].join(' ').toLocaleLowerCase().includes(search));b.classList.toggle('ldm542SearchHidden',!okay);if(okay&&!b.hidden)count++;});
    main.querySelectorAll('.ldm542Group').forEach(g=>g.hidden=![...g.querySelectorAll('.ldm539ModuleCard')].some(b=>!b.hidden&&!b.classList.contains('ldm542SearchHidden')));
    const counter=q('.ldm539Count',main),value=`${count} / ${cards.length} कार्य`;if(counter&&counter.textContent!==value)counter.textContent=value;
    const none=q('.ldm539Empty',main);if(none)none.hidden=count!==0;
  }
  function openCategory(category='all'){
    const r=root();if(!admin()||!r)return;ensureModules(r);
    const full=q('#ldm535FullAccess',r),directory=q('.ldm540Directory',r);if(!directory||!full)return;
    selection=categories.some(c=>c.id===category)?category:'all';search='';const input=q('.ldm539Search',directory);if(input)input.value='';
    full.open=true;directory.open=true;populate(r);directory.scrollIntoView?.({block:'start',behavior:'smooth'});
  }
  function teacherSector(){
    if(String(W.profile?.role||'').toLowerCase()!=='teacher')return;
    const t=q('#erpContent > .ldmNewTeacher, #erpContent > .v114TeacherDash');
    const grid=q('.ldmTeacherModules',t);
    if(!grid||!t)return;
    let nav=q('.ldm540TeacherNav',t);
    if(!nav){
      nav=el('section','ldm540TeacherNav');
      nav.append(el('h2','','Teacher Work Center'));
      const tabs=el('div','ldm540TeacherTabs');nav.append(tabs);
      grid.before(nav);nav.dataset.selected='all';
      for(const group of [{id:'all',label:'All functions',icon:'▦'},...categories]){
        const button=el('button','',group.icon+' '+group.label);
        button.type='button';button.dataset.key=group.id;tabs.append(button);
        button.addEventListener('click',()=>{nav.dataset.selected=group.id;teacherSector()});
      }
    }
    const present=new Set();
    for(const card of grid.children){
      if(!card.matches('button,a,[role="button"]'))continue;
      const category=classify({title:q('b,strong',card)?.textContent||'',detail:'',
        route:card.dataset.newTeacherRoute||card.dataset.route||card.getAttribute('onclick')||''});
      present.add(category);
      card.dataset.teacherSector=category;
      card.classList.toggle('ldm540Filtered',nav.dataset.selected!=='all'&&nav.dataset.selected!==category);
    }
    if(nav.dataset.selected!=='all'&&!present.has(nav.dataset.selected)){nav.dataset.selected='all';teacherSector();return}
    for(const tab of nav.querySelectorAll('button')){
      tab.hidden=tab.dataset.key!=='all'&&!present.has(tab.dataset.key);
      tab.setAttribute('aria-pressed',String(tab.dataset.key===nav.dataset.selected));
    }
    t.classList.add('ldm540Teacher');
  }
  const modes=['auto','mobile','desktop'];
  const viewport=D.querySelector('meta[name="viewport"]');
  const defaultViewport=viewport?.content;
  let preferenceKey='',mode='auto';
  function viewKey(){
    const user=W.user?.id||W.profile?.id;
    return user?'ldm.dashboard.view.'+user+'.'+W.profile.role:'';
  }
  function applyMode(value){
    mode=modes.includes(value)?value:'auto';
    D.documentElement.dataset.erpView=mode;
    const content=mode==='desktop'?'width=1536':defaultViewport;
    if(viewport&&viewport.content!==content)viewport.content=content;
  }
  function setupView(active){
    const top=q('#erp .erpTop');
    if(!active){
      if(D.documentElement.hasAttribute('data-erp-view')){
        applyMode('auto');delete D.documentElement.dataset.erpView;preferenceKey='';
      }
      q('#ldmViewSwitch',top)?.remove();return;
    }
    const key=viewKey();
    if(preferenceKey!==key||!D.documentElement.hasAttribute('data-erp-view')){
      preferenceKey=key;let saved='auto';
      try{if(key)saved=localStorage.getItem(key)}catch{}
      applyMode(saved);
    }
    if(!top)return;
    let select=q('#ldmViewSwitch',top);
    if(!select){
      select=el('select');select.id='ldmViewSwitch';select.setAttribute('aria-label','डैशबोर्ड दृश्य / Dashboard view');
      for(const [i,label] of ['🖥 दृश्य · Auto','📱 मोबाइल','🖥 डेस्कटॉप'].entries()){
        const option=el('option','',label);option.value=modes[i];select.append(option);
      }
      select.addEventListener('change',()=>{applyMode(select.value);try{if(preferenceKey)localStorage.setItem(preferenceKey,mode)}catch{}});
      const profile=q('#ldm538AdminProfile',top);if(profile)profile.before(select);else top.append(select);
    }
    select.value=mode;
  }
  function office(dash){
    const top=q('#erp .erpTop'),old=q('#ldm542OfficeButton',top);
    if(!dash){old?.remove();return;}
    const assistant=q('#s336DashboardCard',q('#erpContent')),attendance=admin()?q('.v114AttendancePanel',dash):null;
    const greeting=q('#v233Greeting,.ldmTeacherHero,.v114PortalHero',dash);if(!top||!greeting||(!assistant&&!attendance)){old?.remove();return;}
    let panel=q('#ldmOffice',dash);
    if(!panel){panel=el('section','ldm542Office');panel.id='ldmOffice';panel.hidden=true;panel.setAttribute('role','region');panel.setAttribute('aria-label','कार्यालय / Office');
      const head=el('header','ldm542OfficeHead'),close=el('button','','✕ बंद करें');close.type='button';head.append(el('strong','','🏢 कार्यालय / Office'),close);panel.append(head);
      const tools=el('div');tools.id='ldmOfficeTools';panel.append(tools);dash.prepend(panel);
      close.addEventListener('click',()=>{panel.hidden=true;const trigger=q('#ldm542OfficeButton',top);trigger?.setAttribute('aria-expanded','false');trigger?.focus();});}
    let button=old;if(!button){button=el('button','ldm542OfficeButton','🏢 कार्यालय / Office');button.id='ldm542OfficeButton';button.type='button';button.setAttribute('aria-controls','ldmOffice');top.append(button);}
    button.setAttribute('aria-expanded',String(!panel.hidden));button.onclick=()=>{panel.hidden=!panel.hidden;button.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden)q('.ldm542OfficeHead button',panel)?.focus({preventScroll:true});};
    const tools=q('#ldmOfficeTools',panel);if(assistant&&assistant.parentElement!==tools)tools.append(assistant);
    if(attendance&&attendance.parentElement!==panel)q('.ldm542OfficeHead',panel).after(attendance);
  }
  function closeOffice(){const panel=q('#erpContent #ldmOffice');if(panel&&!panel.hidden){panel.hidden=true;q('#ldm542OfficeButton')?.setAttribute('aria-expanded','false');}}
  function hero(r){
    const hero=q('#ldm500Hero',r);if(!hero||hero.dataset.ldm542Ready)return;hero.dataset.ldm542Ready='1';
    const map={v150_student_master:'students',central_exam:'exams',work_delegation:'teachers'};
    const main=q('#ldm500Open',hero);if(main)main.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openCategory('all');});
    for(const button of hero.querySelectorAll('[data-ldm500-route]')){const route=button.dataset.ldm500Route;delete button.dataset.ldm500Route;
      if(route==='academic_monitor'&&q('[data-ldm500-route="central_exam"]',hero)){button.remove();continue;}
      if(route==='central_exam')button.textContent='📚 Teaching, Exams & Marks';
      if(route==='work_delegation'){button.addEventListener('click',e=>{e.stopPropagation();const t=q('#ldm542OfficeButton');if(t){const panel=q('#ldmOffice',r);if(panel?.hidden)t.click();else q('.ldm542OfficeHead button',panel)?.focus();}else openCategory('teachers');});continue;}
      if(route==='marksheet_center'){button.textContent='🧾 A4 Preview / Print / PDF';button.setAttribute('aria-label','A4 documents and printing');button.addEventListener('click',()=>openPrintMenu(r,button));}
      else if(map[route]){button.setAttribute('aria-label',button.textContent+' विभाग खोलें');button.addEventListener('click',()=>openCategory(map[route]));}
      else button.addEventListener('click',()=>safeRoute(route));}
    // Keep the original Universal status dialog (including its own status report) available.
  }
  function openPrintMenu(r,trigger){
    if(!admin()||root()!==r)return;let box=q('#ldm542PrintMenu',r);
    if(!box){box=el('section','ldm542PrintMenu');box.id='ldm542PrintMenu';box.setAttribute('aria-label','A4 Preview / Print / PDF');
      const actions=[['📄 सामान्य A4 / PDF प्रीव्यू',()=>W.LDM_A4_V337?.choose?.()],['🎓 मार्कशीट / प्रिंट',()=>safeRoute('marksheet_center')],['📊 Universal ERP स्थिति रिपोर्ट',()=>{W.LDM_PREMIUM_V500?.open?.();q('#ldm500Report')?.click();}]];
      for(const [title,fn] of actions){const b=el('button','',title);b.type='button';b.addEventListener('click',()=>{box.hidden=true;trigger.setAttribute('aria-expanded','false');fn();});box.append(b);}q('#ldm500Hero',r).append(box);box.hidden=true;}
    box.hidden=!box.hidden;trigger.setAttribute('aria-expanded',String(!box.hidden));trigger.setAttribute('aria-controls',box.id);
  }
  function moveLive(r){
    const body=q('#ldm535FullAccess .ldm535FullBody',r);if(!body)return;
    const nodes=['#r323AdminControl','.v156DailyControl','#r320DailyReminderCard','#v307Dash'].map(x=>q(':scope > '+x,r)).filter(Boolean);
    let box=q('#ldm542Live',body);if(!box&&!nodes.length)return;
    if(!box){box=el('section','ldm542Live');box.id='ldm542Live';box.append(el('h3','','⚡ लाइव स्थिति एवं अतिरिक्त कार्य'));body.append(box);}
    for(const node of nodes)if(node.parentElement!==box)box.append(node);
  }
  function render(){
    pending=false;watch();teacherSector();const r=root();
    const dash=admin()?r:(String(W.profile?.role||'').toLowerCase()==='teacher'?q('#erpContent > .ldmNewTeacher,#erpContent > .v114TeacherDash'):null);
    setupView(dash);office(dash);if(!r||!admin())return;if(activeRoot!==r){activeRoot=r;selection='all';search='';lastCatalog='';}hero(r);
    ensureModules(r);
    if(q('.ldm540Directory[open]',r))populate(r);moveLive(r);
  }
  function schedule(){if(pending)return;pending=true;W.requestAnimationFrame?W.requestAnimationFrame(render):Promise.resolve().then(render);}
  function watch(){
    const host=D.getElementById('erpContent');if(!host)return;
    if(observer)return;
    observer=new MutationObserver(records=>{
      if(records.some(m=>!m.target.closest?.('.ldm540Directory,.ldm540TeacherNav') &&
        [...m.addedNodes,...m.removedNodes].some(n=>n.nodeType===1)))schedule();
    });
    observer.observe(host,{childList:true,subtree:true});
  }
  // Sidebar close is limited to the dashboard and respects dialogs and header controls.
  D.addEventListener('click',event=>{
    if(!root()||!admin())return;
    const aside=D.querySelector('#erp aside.open');if(!aside)return;
    if(event.target.closest('#erp aside,#erp .erpTop,[role=dialog],dialog,.modal,.modalCard'))return;
    aside.classList.remove('open');
    D.querySelector('#erp .erpTop .hamb')?.setAttribute('aria-expanded','false');
  });
  D.addEventListener('keydown',event=>{
    if(event.key!=='Escape'||!root()||!admin())return;
    if(D.querySelector('dialog[open],.modal:not(.hidden),[role=dialog][aria-modal=true]'))return;
    const aside=D.querySelector('#erp aside.open');if(!aside)return;
    aside.classList.remove('open');D.querySelector('#erp .erpTop .hamb')?.setAttribute('aria-expanded','false');
  });
  function start(){watch();schedule();D.addEventListener('click',e=>{if(!e.target.closest('#ldmOffice,#ldm542OfficeButton,dialog,[role=dialog]'))closeOffice();else if(e.target.closest('#ldmOffice .s336Tools button,#ldmOffice .v114AttendancePanel button'))closeOffice();});D.addEventListener('keydown',e=>{if(e.key==='Escape'&&!D.querySelector('dialog[open]'))closeOffice();});}
  W.LDM_DASHBOARD_V539=Object.freeze({version:'542',refresh:()=>{watch();schedule();},openCategory,categories:categories.length});
  if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
