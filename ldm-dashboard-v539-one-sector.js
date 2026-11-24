/* LD MODERN ERP V539: one-sector dashboard rearrangement.
 * This file adds ONLY a presentation/navigation layer to the authenticated, live ERP.
 * Existing nodes, route handlers, form state, dashboards, permissions and API calls remain intact.
 * Legacy control groups remain accessible in native <details> panels; they are never deleted.
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
  let selection='all',search='',lastCatalog='',observer=null,pending=false;
  function safeRoute(route){
    if(!admin()||!root()||!route||typeof W.render!=='function')return;
    try{const p=W.render(route);if(p&&typeof p.catch==='function')p.catch(e=>W.toast?.(String(e?.message||e)));}
    catch(e){W.toast?.(String(e?.message||e));}
  }
  function liveEntries(r){
    const list=typeof W.LDM_PREMIUM_V500?.catalog==='function'?W.LDM_PREMIUM_V500.catalog():[];
    const result=[],known=new Set();
    const add=(item)=>{
      const route=String(item.route||'').trim(),title=String(item.title||'').trim();
      if(!/^[\w-]{1,95}$/.test(route)||!title||known.has(route))return;
      known.add(route);result.push({route,title,icon:String(item.icon||'📌'),detail:String(item.detail||'')});
    };
    list.forEach(add);
    // Include native admin cards not present in the centralized catalog. Only exact existing render() routes.
    r.querySelectorAll('.v114ManagementPanel button[onclick],.ldmMasterControl button[onclick],#v149AdminQuickSlot button[onclick]').forEach(button=>{
      const match=/^\s*(?:window\.)?render\(['"]([\w-]+)['"]\)\s*;?\s*$/.exec(button.getAttribute('onclick')||'');
      if(!match)return;
      add({route:match[1],title:button.querySelector('b,strong')?.textContent?.trim()||button.textContent.trim().slice(0,90),icon:button.querySelector('.v90MonitorIcon,i,span')?.textContent?.trim()||'📌',detail:button.querySelector('small')?.textContent?.trim()||''});
    });
    return result;
  }
  function classify(item){
    const s=[item.title,item.detail,item.route].join(' ');
    // Prioritize the more specific sectors so cards do not appear in duplicate panels.
    for(const key of ['finance','documents','qr','exams','teachers','students','management','reports']){
      const group=categories.find(c=>c.id===key);
      if(group.re.test(s))return key;
    }
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
    const groups=[{id:'all',icon:'✦',label:'All Cards',hindi:'सभी कार्ड'},...categories];
    groups.forEach(group=>{
      const b=el('button','ldm539CategoryTab',group.icon+'  '+group.label);
      b.type='button';b.dataset.category=group.id;b.title=group.hindi;
      b.setAttribute('aria-pressed',String(group.id===selection));b.addEventListener('click',()=>{selection=group.id;applyFilter(r);});filters.append(b);
    });
    const searchArea=el('div','ldm539SearchArea');const searchInput=el('input','ldm539Search');searchInput.type='search';searchInput.placeholder='कार्ड / विषय / काम खोजें…';
    searchInput.setAttribute('aria-label','Search loaded ERP cards');searchInput.autocomplete='off';searchInput.value=search;
    searchInput.addEventListener('input',()=>{search=searchInput.value.toLocaleLowerCase().trim();applyFilter(r);});
    const count=el('output','ldm539Count');count.setAttribute('aria-live','polite');count.textContent='—';searchArea.append(searchInput,count);
    controls.append(filters,searchArea);const grid=el('div','ldm539CardGrid');grid.id='ldm539CardGrid';
    const none=el('p','ldm539Empty','इस खोज से मेल खाने वाला कार्ड नहीं मिला।');none.hidden=true;
    main.append(header,controls,grid,none);
    const directory=el('details','ldm540Directory');
    directory.append(el('summary','','सभी कार्य खोजें / Search all functions'),main);
    directory.addEventListener('toggle',()=>{if(directory.open)populate(r)});
    mount.append(directory);
    return main;
  }
  function populate(r){
    const main=q('#ldm539Modules',r),grid=q('#ldm539CardGrid',main);if(!grid)return;
    const entries=liveEntries(r),hash=entries.map(e=>e.route+'|'+e.title+'|'+e.detail).join('\n');
    if(hash===lastCatalog && grid.childElementCount===entries.length)return;
    lastCatalog=hash;const fragment=D.createDocumentFragment();
    for(const entry of entries){
      const category=classify(entry),tile=el('button','ldm539ModuleCard');tile.type='button';tile.dataset.category=category;tile.dataset.route=entry.route;
      const art=el('span','ldm539ModuleIcon',entry.icon),info=el('span','ldm539ModuleCopy');
      info.append(el('strong','',entry.title),el('small','',entry.detail||'मूल ERP सुविधा खोलें'));
      tile.append(art,info,el('span','ldm539ModuleArrow','➜'));
      tile.title=entry.title+' • '+entry.route;
      tile.addEventListener('click',()=>safeRoute(entry.route));fragment.append(tile);
    }
    grid.replaceChildren(fragment);applyFilter(r);
  }
  function setFlag(node,name,value){
    const next=String(value);if(node.getAttribute(name)!==next)node.setAttribute(name,next);
  }
  function applyFilter(r){
    const main=q('#ldm539Modules',r);if(!main)return;let count=0;
    main.querySelectorAll('.ldm539CategoryTab').forEach(b=>setFlag(b,'aria-pressed',b.dataset.category===selection));
    const cards=main.querySelectorAll('.ldm539ModuleCard');cards.forEach(b=>{
      const okay=(selection==='all'||selection===b.dataset.category) && (!search||[b.textContent,b.dataset.route].join(' ').toLocaleLowerCase().includes(search));
      if(b.hidden===okay)b.hidden=!okay;if(okay)count++;
    });
    const counter=q('.ldm539Count',main);if(counter && counter.textContent!==`${count} / ${cards.length} कार्ड`)counter.textContent=`${count} / ${cards.length} कार्ड`;
    const none=q('.ldm539Empty',main);if(none&&none.hidden!==(count!==0))none.hidden=count!==0;
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
      if(card.dataset.teacherSector!==category)card.dataset.teacherSector=category;
      card.classList.toggle('ldm540Filtered',nav.dataset.selected!=='all'&&nav.dataset.selected!==category);
    }
    if(nav.dataset.selected!=='all'&&!present.has(nav.dataset.selected)){nav.dataset.selected='all';teacherSector();return}
    for(const tab of nav.querySelectorAll('button')){
      const unavailable=tab.dataset.key!=='all'&&!present.has(tab.dataset.key);
      if(tab.hidden!==unavailable)tab.hidden=unavailable;
      setFlag(tab,'aria-pressed',tab.dataset.key===nav.dataset.selected);
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
    if(select.value!==mode)select.value=mode;
  }
  function office(dash){
    const assistant=q('#s336DashboardCard',q('#erpContent'));
    const attendance=admin()?q('.v114AttendancePanel',dash):null;
    const greeting=q('#v233Greeting,.ldmTeacherHero,.v114PortalHero',dash);
    if(!greeting||(!assistant&&!attendance))return;
    let panel=q('#ldmOffice',dash);
    if(!panel){
      panel=el('section');panel.id='ldmOffice';panel.hidden=true;panel.setAttribute('aria-label','कार्यालय');
      const tools=el('div');tools.id='ldmOfficeTools';panel.append(tools);
      greeting.after(panel);
    }
    const launcher=q('#ldm538Toolbar .ldm538ToolActions')||greeting;
    let button=q('.ldm538WorkAssistant',launcher);
    if(!button){
      button=el('button','ldm538WorkAssistant','🏢 कार्यालय / Office');button.type='button';button.setAttribute('aria-controls',panel.id);
      launcher.append(button);
      button.addEventListener('click',()=>{const current=q('#ldmOffice');if(current){current.hidden=!current.hidden;button.setAttribute('aria-expanded',String(!current.hidden));if(!current.hidden)current.scrollIntoView({block:'nearest'});}});
    }
    setFlag(button,'aria-expanded',!panel.hidden);
    const tools=q('#ldmOfficeTools',panel);
    if(assistant&&assistant.parentElement!==tools)tools.append(assistant);
    if(attendance&&attendance.parentElement!==panel)panel.append(attendance);
  }
  function render(){
    pending=false;watch();teacherSector();const r=root();
    const dash=admin()?r:(String(W.profile?.role||'').toLowerCase()==='teacher'?q('#erpContent > .ldmNewTeacher,#erpContent > .v114TeacherDash'):null);
    setupView(dash);if(dash)office(dash);if(!r||!admin())return;
    ensureModules(r);
    if(q('.ldm540Directory[open]',r))populate(r);
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
  function start(){watch();schedule();}
  W.LDM_DASHBOARD_V539=Object.freeze({version:'539',refresh:()=>{watch();schedule();},categories:categories.length});
  if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
