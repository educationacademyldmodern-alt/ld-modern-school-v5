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
  const hi=()=>W.LDM_V337_UI?.language?.()!=='en';
  const t=(h,e)=>hi()?h:e;
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
  const routeOf=b=>/^\s*(?:window\.)?render\(\s*(['"])([\w-]+)\1\s*\)\s*;?\s*$/.exec(b.getAttribute('onclick')||'')?.[2]||'';
  const nativeSelector='.ldm535FullSections :is(.v90MonitorGrid,.ldmMasterGrid,#v147AdminQuick .ldmTeacherModules)>button';
  function nativeCards(r){return [...r.querySelectorAll(nativeSelector)].filter(b=>!b.hidden&&b.style.display!=='none'&&!b.classList.contains('hidden')&&!b.closest('[hidden],.hidden'));}
  function liveEntries(r){
    const list=typeof W.LDM_PREMIUM_V500?.catalog==='function'?W.LDM_PREMIUM_V500.catalog():[];
    const known=new Set([...r.querySelectorAll(nativeSelector)].map(routeOf).filter(Boolean));
    return list.filter(item=>{const route=String(item.route||'').trim();if(!/^[\w-]{1,95}$/.test(route)||!item.title||known.has(route))return false;known.add(route);return true;});
  }
  const localized=(en,hindi)=>hi()?hindi:en;
  const tr=s=>W.LDM_V337_UI?.translate?.(s)||s;
  const nativeInfo=b=>({title:b.querySelector('b,strong')?.textContent?.trim()||b.textContent.trim(),detail:b.querySelector('small')?.textContent?.trim()||'',route:routeOf(b)});
  function classify(item){
    const s=[item.title,item.detail,item.route].join(' ');
    if(/v147_admin_(presence|student_qr)|v130_(qr_scanner|storage)/i.test(item.route)||/QR Gate|QR Scanner|Student QR|Storage Center/i.test(item.title))return 'qr';
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
    if(main){const sections=q('.ldm535FullSections',r),grid=q('#ldm539CardGrid',main);if(sections&&grid&&sections.parentElement!==grid)grid.prepend(sections);for(const d of mount.querySelectorAll('details.ldm538Original'))if([...d.children].every(x=>x.tagName==='SUMMARY'))d.remove();return main;}
    main=el('section','ldm539Modules');main.id='ldm539Modules';main.setAttribute('aria-label','All existing ERP modules');
    const header=el('div','ldm539ModuleHeader');const copy=el('div');
    copy.append(el('span','ldm539Eyebrow','ALL FUNCTIONS • ONE SECTOR'),el('h2','','A–Z School Management & Services'),el('p','','सभी उपलब्ध मॉड्यूल अपनी वास्तविक सुविधाओं और अनुमति के साथ'));
    const badge=el('span','ldm539LiveBadge','ERP • LIVE ROUTES');header.append(copy,badge);
    const controls=el('div','ldm539Controls'),filters=el('div','ldm539CategoryTabs');filters.setAttribute('role','group');filters.setAttribute('aria-label','Filter ERP modules');
    const groups=[{id:'all',icon:'✦',label:'All Cards',hindi:'सभी कार्ड'},...categories];
    groups.forEach(group=>{
      const b=el('button','ldm539CategoryTab',group.icon+'  '+localized(group.label,group.hindi));
      b.type='button';b.dataset.category=group.id;b.title=group.hindi;
      b.setAttribute('aria-pressed',String(group.id===selection));b.addEventListener('click',()=>{selection=group.id;if(selection==='all'){search='';const input=q('.ldm539Search',r);if(input)input.value='';}applyFilter(r);});filters.append(b);
    });
    const searchArea=el('div','ldm539SearchArea');const searchInput=el('input','ldm539Search');searchInput.type='search';searchInput.placeholder='कार्ड / विषय / काम खोजें…';
    searchInput.setAttribute('aria-label','Search loaded ERP cards');searchInput.autocomplete='off';searchInput.value=search;
    searchInput.addEventListener('input',()=>{search=searchInput.value.toLocaleLowerCase().trim();applyFilter(r);});
    const count=el('output','ldm539Count');count.setAttribute('aria-live','polite');count.textContent='—';searchArea.append(searchInput,count);
    controls.append(filters,searchArea);const grid=el('div','ldm539CardGrid');grid.id='ldm539CardGrid';const extras=el('div','ldm548Extras');grid.append(extras);const sections=q('.ldm535FullSections',r);if(sections)grid.prepend(sections);
    const none=el('p','ldm539Empty','इस खोज से मेल खाने वाला कार्ड नहीं मिला।');none.hidden=true;
    main.append(header,controls,grid,none);
    mount.prepend(main);
    return main;
  }
  function populate(r){
    const main=q('#ldm539Modules',r),grid=q('.ldm548Extras',main);if(!grid)return;
    const entries=liveEntries(r),hash=localized('en','hi')+'|'+entries.map(e=>e.route+'|'+e.title+'|'+e.detail).join('\n');
    if(hash===lastCatalog && grid.childElementCount===entries.length){applyFilter(r);return;}
    lastCatalog=hash;const fragment=D.createDocumentFragment();
    for(const entry of entries){
      const category=classify(entry),tile=el('button','ldm539ModuleCard');tile.type='button';tile.dataset.category=category;tile.dataset.route=entry.route;
      const art=el('span','ldm539ModuleIcon',entry.icon),info=el('span','ldm539ModuleCopy');
      info.append(el('strong','',tr(entry.title)),el('small','',tr(entry.detail||localized('Open ERP module','मूल ERP सुविधा खोलें'))));
      tile.append(art,info,el('span','ldm539ModuleArrow','➜'));
      tile.title=entry.title+' • '+entry.route;tile.dataset.searchText=[entry.title,entry.detail,W.LDM_V337_UI?.translate?.(entry.title),W.LDM_V337_UI?.translate?.(entry.detail)].join(' ');
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
    const originals=nativeCards(r);
    for(const b of originals){const info=nativeInfo(b);if(!b.dataset.searchText)b.dataset.searchText=[info.title,info.detail,info.route].join(' ');b.classList.add('ldm548Native');if(!b.dataset.category)b.dataset.category=classify(info);if(b.style.getPropertyValue('background'))b.style.removeProperty('background');}
    const cards=[...originals,...main.querySelectorAll('.ldm539ModuleCard')];
    cards.forEach(b=>{
      const text=[b.textContent,b.dataset.route,b.title,b.dataset.searchText,routeOf(b)].join(' ').toLocaleLowerCase();
      const okay=(selection==='all'||selection===b.dataset.category)&&(!search||text.includes(search));
      // Do not overwrite a native permission/visibility flag.
      if(b.classList.contains('ldm548Native'))b.classList.toggle('ldm548Filtered',!okay);else if(b.hidden===okay)b.hidden=!okay;
      if(okay)count++;
    });
    const counter=q('.ldm539Count',main);const label=`${count} / ${cards.length} ${hi()?'कार्ड':'cards'}`;if(counter&&counter.textContent!==label)counter.textContent=label;
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
    const content=mode==='desktop'&&W.screen.width<901?'width=1536':defaultViewport;
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
      select=el('select');select.id='ldmViewSwitch';select.setAttribute('aria-label',t('डैशबोर्ड दृश्य','Dashboard view'));
      for(const [i,label] of ['🖥 Auto view','📱 Mobile','🖥 Desktop'].entries()){
        const option=el('option','',label);option.value=modes[i];select.append(option);
      }
      select.addEventListener('change',()=>{applyMode(select.value);schedule();try{if(preferenceKey)localStorage.setItem(preferenceKey,mode)}catch{}});
      const profile=q('#ldm538AdminProfile',top);if(profile)profile.before(select);else top.append(select);
    }
    if(select.value!==mode)select.value=mode;
  }
  function office(dash){
    const assistant=q('#s336DashboardCard',q('#erpContent'));
    const attendance=admin()?q('.v114AttendancePanel',dash):null;
    const stats=q('#v90Stats',dash);
    if(attendance&&stats){
      const details=attendance.closest('details');
      attendance.classList.add('ldm549AttendanceTop');
      const greeting=q('#v233Greeting',dash);
      // Use the existing live attendance node; visual and keyboard order agree.
      if(greeting?.parentElement===dash&&stats.parentElement===dash){
        const mobile=mode==='mobile'||(mode!=='desktop'&&W.innerWidth<=900);
        const first=mobile?attendance:stats,second=mobile?stats:attendance;
        if(greeting.nextElementSibling!==first)greeting.after(first);
        if(first.nextElementSibling!==second)first.after(second);
      }else if(stats.parentElement===dash&&stats.nextElementSibling!==attendance)stats.after(attendance);
      if(details && details!==dash && !details.querySelector('.v114AttendancePanel') && [...details.children].every(x=>x.tagName==='SUMMARY'))details.remove();
    }
    const greeting=q('#v233Greeting,.ldmTeacherHero,.v114PortalHero',dash);
    if(!greeting||!assistant)return;
    let panel=q('#ldmOffice',dash);
    if(!panel){
      panel=el('section');panel.id='ldmOffice';panel.hidden=true;panel.setAttribute('aria-label','कार्यालय');
      const tools=el('div');tools.id='ldmOfficeTools';panel.append(tools);
      greeting.after(panel);
    }
    const launcher=q('#ldm500Hero .ldm500-hero-pills',dash)||greeting;
    let button=q('.ldm538WorkAssistant',dash);if(button&&button.parentElement!==launcher)launcher.append(button);
    if(!button){
      button=el('button','ldm538WorkAssistant',t('🏢 कार्यालय','🏢 Office'));button.type='button';button.setAttribute('aria-controls',panel.id);
      launcher.append(button);
      button.addEventListener('click',()=>{const current=q('#ldmOffice');if(current){current.hidden=!current.hidden;button.setAttribute('aria-expanded',String(!current.hidden));if(!current.hidden)current.scrollIntoView({block:'start',behavior:'instant'});}});
    }
    setFlag(button,'aria-expanded',!panel.hidden);
    const tools=q('#ldmOfficeTools',panel);
    if(assistant&&assistant.parentElement!==tools)tools.append(assistant);

  }
  function profilePhoto(dash){
    const greeting=q('#v233Greeting',dash),student=q('.v114PortalHeroStudent',greeting);
    if(!admin()||!student||q('.ldmPhotoChoice',student))return;
    const label=el('label','ldmPhotoChoice'),input=el('input'),status=el('small');
    status.setAttribute('role','status');input.type='file';input.accept='image/*';
    const title=el('span','',localized('Change photo','फ़ोटो बदलें'));label.append(input,title,status);student.append(label);
    input.addEventListener('change',async()=>{if(!admin()||!input.files.length)return;
      input.disabled=true;
      try{await W.v97UploadAvatar(input,status);const url=W.v97AvatarUrl?.(),badge=q('.v114StudentBadge',student);if(url&&badge){let img=q('img',badge);if(!img){img=el('img');img.alt='Profile';badge.replaceChildren(img)}img.src=url+(url.includes('?')?'&':'?')+'v='+encodeURIComponent(W.profile?.updated_at||'');}}finally{input.disabled=false}
    });
  }

  function render(){
    pending=false;watch();teacherSector();const r=root();
    const dash=admin()?r:(String(W.profile?.role||'').toLowerCase()==='teacher'?q('#erpContent > .ldmNewTeacher,#erpContent > .v114TeacherDash'):null);
    setupView(dash);if(dash){office(dash);profilePhoto(dash)}if(!r||!admin())return;
    ensureModules(r);
    updateLanguage(r);populate(r);
  }
  function schedule(){if(pending)return;pending=true;W.requestAnimationFrame?W.requestAnimationFrame(render):Promise.resolve().then(render);}
  function watch(){
    const host=D.getElementById('erpContent');if(!host)return;
    if(observer)return;
    observer=new MutationObserver(records=>{
      if(records.some(m=>!m.target.closest?.('.ldm548Extras,.ldm540TeacherNav') &&
        [...m.addedNodes,...m.removedNodes].some(n=>n.nodeType===1)))schedule();
    });
    observer.observe(host,{childList:true,subtree:true});
  }
  // V547: close both legacy sidebar state flags, for either dashboard role.
  const dashboardMenuActive=()=>!!D.querySelector('#erp:not(.hidden) #erpContent > :is(.ldm535PremiumDashboard,.ldmRootAdminDash,.ldmNewTeacher,.v114TeacherDash)');
  function closeDashboardMenu(){
    D.querySelector('#erp aside.open')?.classList.remove('open');
    D.body.classList.remove('d378MenuOpen');
    D.querySelectorAll('#erp .erpTop :is(.hamb,#d378Menu,#ldm538AdminProfile)').forEach(b=>b.setAttribute('aria-expanded','false'));
  }
  D.addEventListener('click',event=>{
    if(!dashboardMenuActive()||!event.target.closest('#erpContent'))return;
    if(event.target.closest('#erp aside,#erp .erpTop,[role=dialog],dialog,.modal,.modalCard'))return;
    if(D.querySelector('#erp aside.open')||D.body.classList.contains('d378MenuOpen'))closeDashboardMenu();
  });
  D.addEventListener('keydown',event=>{
    if(event.key!=='Escape'||!dashboardMenuActive())return;
    if(D.querySelector('dialog[open],.modal:not(.hidden),[role=dialog][aria-modal=true]'))return;
    if(D.querySelector('#erp aside.open')||D.body.classList.contains('d378MenuOpen'))closeDashboardMenu();
  });
  function updateLanguage(r){
    const main=q('#ldm539Modules',r);if(!main)return;
    const set=(selector,value)=>{const n=q(selector,main);if(n&&n.textContent!==value)n.textContent=value;};
    set('.ldm539Eyebrow',localized('ALL FUNCTIONS • ONE SECTOR','सभी कार्य • एक केंद्र'));
    set('.ldm539ModuleHeader h2',localized('A–Z School Management & Services','विद्यालय प्रबंधन एवं सेवाएँ'));
    set('.ldm539ModuleHeader p',localized('All available modules with existing permissions','सभी उपलब्ध मॉड्यूल अपनी मूल अनुमति के साथ'));
    set('.ldm539LiveBadge',localized('ERP • LIVE ROUTES','ईआरपी • सक्रिय कार्य'));
    set('.ldm539Empty',localized('No matching cards.','इस खोज से मेल खाने वाला कार्ड नहीं मिला।'));
    const input=q('.ldm539Search',main);if(input)input.placeholder=localized('Search cards / topics / work…','कार्ड / विषय / काम खोजें…');
    for(const b of main.querySelectorAll('.ldm539CategoryTab')){const group=b.dataset.category==='all'?{icon:'✦',label:'All Cards',hindi:'सभी कार्ड'}:categories.find(c=>c.id===b.dataset.category);if(group){const v=group.icon+'  '+localized(group.label,group.hindi);if(b.textContent!==v)b.textContent=v;}}
    const photo=q('.ldmPhotoChoice>span',r);if(photo&&photo.textContent!==localized('Change photo','फ़ोटो बदलें'))photo.textContent=localized('Change photo','फ़ोटो बदलें');
    const preview=q('[data-ldm538="preview"]',r);if(preview&&preview.textContent!==localized('🗎 PDF / A4 Preview','🗎 पीडीएफ / ए4 पूर्वावलोकन'))preview.textContent=localized('🗎 PDF / A4 Preview','🗎 पीडीएफ / ए4 पूर्वावलोकन');
  }
  function start(){watch();schedule();W.addEventListener('resize',schedule,{passive:true});W.addEventListener('ldm:language-changed',()=>{const r=root();if(r){updateLanguage(r);populate(r)}schedule()});}

  W.LDM_DASHBOARD_V539=Object.freeze({version:'553',refresh:()=>{watch();schedule();},categories:categories.length});
  if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
