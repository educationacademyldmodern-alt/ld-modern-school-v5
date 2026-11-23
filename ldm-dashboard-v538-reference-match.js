/* LD Modern School V538 — live ERP dashboard composition, no backend/data changes.
 * Requires the original V534 ERP scripts + V535, V536 and V537 assets.
 * Uses the original live controls and their existing authenticated render routes.
 */
(()=>{
 'use strict';
 if(window.LDM_DASHBOARD_V538)return;
 const D=document,W=window,admins=new Set(['admin','super_admin','principal']);
 const categories=[
  {name:'Management Center',icon:'⚙️',re:/attendance|presence|request|transport|gate|security|setting|management|attendance|leave/i},
  {name:'School Control Center',icon:'🏫',re:/student|admission|class teacher|parent login|control|UDISE|enquiry/i},
  {name:'Exam & Academic Center',icon:'📖',re:/exam|mark|teaching|checking|homework|timetable|admit|academic|result/i},
  {name:'Finance & Accounts',icon:'₹',re:/fee|account|ledger|due|receipt|finance|collection/i},
  {name:'Teacher & Staff Center',icon:'👥',re:/teacher|staff|work|delegate|monitor|attendance/i},
  {name:'Documents & Certificate',icon:'📃',re:/document|certificate|id card|marksheet|admit|letter|bonafide|TC/i},
  {name:'QR & Storage Center',icon:'▦',re:/QR|scan|storage|gate|presence|id card/i},
  {name:'Reports & Utilities',icon:'📊',re:/report|notice|calendar|setting|monitor|receipt|communication/i}
 ];
 const q=(s,r=D)=>r?.querySelector(s);
 const isAdmin=()=>admins.has(String(W.profile?.role||'').toLowerCase());
 const isTeacher=()=>String(W.profile?.role||'').toLowerCase()==='teacher';
 const isDash=()=>!!q('#erpContent > .ldm535PremiumDashboard, #erpContent > .v114TeacherDash, #erpContent > .ldmNewTeacher');
 const create=(tag,cls,text)=>{const e=D.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e};
 const safeRoute=(route)=>{if(!isAdmin()||!route||typeof W.render!=='function')return;try{const result=W.render(route);if(result?.catch)result.catch(e=>W.toast?.(String(e?.message||e)));}catch(e){W.toast?.(String(e?.message||e));}};
 const setText=(node,value)=>{if(node && node.textContent!==value)node.textContent=value};
 let queued=false,observer=null;
 function makeToolbar(){
  const erp=q('#erp');if(!erp||erp.classList.contains('hidden')||!(isAdmin()||isTeacher()))return;
  const top=q('.erpTop',erp),main=top?.parentElement;if(!top||!main)return;
  let bar=q('#ldm538Toolbar',main);
  if(!bar){
   bar=create('div','ldm538Toolbar');bar.id='ldm538Toolbar';bar.setAttribute('aria-label','Dashboard tools');
   const langs=create('div','ldm538Lang');
   for(const [lang,label] of [['hi','हिंदी'],['en','English']]){
    const b=create('button','',label);b.type='button';b.dataset.lang=lang;b.setAttribute('aria-pressed',lang==='en'?'true':'false');
    b.addEventListener('click',()=>{W.LDM_V337_UI?.setLanguage(lang);bar.dataset.lang=lang;langs.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.lang===lang)));bar.querySelector('[data-ldm538="photos"]').textContent=lang==='hi'?'📷 विद्यार्थी फोटो':'📷 Student Photos';bar.querySelector('[data-ldm538="preview"]').textContent=lang==='hi'?'🗎 PDF / A4 प्रीव्यू':'🗎 PDF / A4 Preview';bar.querySelector('[data-ldm538="theme"]').textContent=lang==='hi'?'🎨 थीम':'🎨 Theme';});
    langs.append(b);
   }
   const slot=create('div','ldm538SearchSlot');
   const actions=create('div','ldm538ToolActions');
   const add=(type,label,fn)=>{const b=create('button','',label);b.type='button';b.dataset.ldm538=type;b.addEventListener('click',fn);actions.append(b)};
   add('photos','📷 Student Photos',()=>{if(isAdmin())safeRoute('student_photo_center');else if(isTeacher()&&typeof W.render==='function')W.render('v91_student_photos');});
   add('preview','🗎 PDF / A4 Preview',()=>{if(isAdmin()&&W.LDM_A4_V337?.choose)W.LDM_A4_V337.choose();else if(isAdmin())safeRoute('marksheet_center')});
   add('theme','🎨 Theme',()=>{if(typeof W.LDM_THEME?.open==='function')W.LDM_THEME.open();else if(typeof W.v75ToggleDark==='function')W.v75ToggleDark();else W.toast?.('Theme is not available')});
   const hint=create('kbd','ldmSearchHint','Ctrl + K');slot.append(hint);bar.append(langs,slot,actions);top.after(bar);
  }
  const admin=isAdmin();
  const preview=q('[data-ldm538="preview"]',bar);
  if(preview && preview.hidden===admin)preview.hidden=!admin;
  const search=q('.ldm538SearchSlot',bar);
  if(search && search.hidden===admin)search.hidden=!admin;
  if(!admin){q('#ldm538AdminProfile',top)?.remove();q('#ldm538HeaderRefresh',top)?.remove();}
  if(isAdmin()){
   const master=q('#v75TopSearch');if(master&&master.parentElement!==q('.ldm538SearchSlot',bar))q('.ldm538SearchSlot',bar)?.append(master);
   const input=q('#v75TopQ',bar);if(input)input.placeholder='Master Search: search school records…';
  }
  // Existing header functions remain clickable and keep their original handlers.
  if((isAdmin()||isTeacher())&&!q('#ldm538HeaderLogout',top)){
   const btn=create('button','ldm538Logout','⇥ Logout');btn.id='ldm538HeaderLogout';btn.type='button';btn.addEventListener('click',()=>W.logout?.());
   const web=q('.websiteBtn',top);if(web)web.before(btn);else top.append(btn);
  }
  if(isAdmin()&&!q('#ldm538AdminProfile',top)){
   const btn=create('button','ldm538Profile','◉ Admin ▾');btn.id='ldm538AdminProfile';btn.type='button';
   btn.addEventListener('click',()=>{const aside=q('aside',erp);if(aside){aside.classList.toggle('open');q('.hamb',top)?.setAttribute('aria-expanded',String(aside.classList.contains('open')))}});
   top.append(btn);
  }
  if(isAdmin()&&!q('#ldm538HeaderRefresh',top)){
   const btn=create('button','ldm538Refresh','⟳ Refresh');btn.id='ldm538HeaderRefresh';btn.type='button';
   btn.addEventListener('click',()=>{const b=q('#ldmV281Refresh');if(b&&b!==btn&&!b.disabled)b.click();else if(typeof W.ldmRefreshCurrentRoute==='function')W.ldmRefreshCurrentRoute();else if(typeof W.render==='function')W.render('dashboard');});
   const bell=q('#v62Bell',top);if(bell)bell.before(btn);else top.append(btn);
  }
 }
 function setDate(){
  const root=q('#erpContent > .ldm535PremiumDashboard');if(!root||!isAdmin())return;
  const g=q('#v233Greeting',root);if(!g)return;
  let date=q('.ldm538Date',g);if(!date){date=create('div','ldm538Date');date.setAttribute('aria-label','Current India date');g.append(date)}
  const copy=q('.v114PortalHeroText',g)||[...g.children].find(el=>el.querySelector?.('b')&&!el.classList.contains('ldm538Date'));if(copy)copy.classList.add('ldm538GreetingText');
  if(!q('.ldm538WorkAssistant',g)){
    const native=q('#s336DashboardCard',root);
    if(native){const btn=create('button','ldm538WorkAssistant','👥 School Work Assistant');btn.type='button';btn.title='Open existing School Work Assistant';btn.addEventListener('click',()=>{const card=q('#s336DashboardCard',root);if(!card)return;for(let el=card;el;el=el.parentElement){if(el.tagName==='DETAILS')el.open=true;}card.scrollIntoView({block:'start',behavior:'smooth'});});g.append(btn);}
  }
  const now=new Date();const fmt=new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',weekday:'long',day:'numeric',month:'short',year:'numeric'});
  const rendered=fmt.format(now);if(date.dataset.value!==rendered){date.dataset.value=rendered;date.replaceChildren(create('span','ldm538CalendarIcon','▣'),create('span','',rendered));}
 }
 function decorateHero(){
  const hero=q('#erpContent > .ldm535PremiumDashboard > #ldm500Hero');if(!hero)return;
  if(!q('.ldm538HeroArt',hero)){
   const art=create('span','ldm538HeroArt');art.setAttribute('aria-hidden','true');
   hero.prepend(art);
  }
  const title=q('.ldm500-hero-title strong',hero);if(title&&title.textContent!=='Universal ERP Control Center')title.textContent='Universal ERP Control Center';
 }
 function statCaption(){
  const grid=q('#erpContent > .ldm535PremiumDashboard > #v90Stats');if(!grid)return;
  if(!q(':scope > .ldm538StatusTitle',grid)){
   const label=create('div','ldm538StatusTitle');label.append(create('span','', '🏫'),create('span','', 'School Status Today'));
   const small=create('small','', 'Live Overview');label.append(small);grid.prepend(label);
  }
 }
 function compactDesk(){
  const root=q('#erpContent > .ldm535PremiumDashboard'),desk=q('#v185FrontDesk',root);if(!desk)return;
  const head=q('.v185FrontHead',desk),actions=q('.v185FrontActions',desk);if(!head||!actions)return;
  desk.classList.add('ldm538Desk');
  const h=q('h2',head);if(h&&h.textContent!=='⚡ Daily Quick Desk')h.textContent='⚡ Daily Quick Desk';
  const targets=["v185FindStudent()", "openAdd('students')", "v185NewAdmission()", "v185FrontFee()", "render('fee_dashboard')",
   'attendance','work_delegation','timetable_master','central_exam','smart_work_alarm','reports','notice_order_center'];
  for(const btn of actions.children){
   const key=btn.dataset.ldm535Route||btn.getAttribute('onclick');
   const i=targets.indexOf(key);
   if(i>=0 && btn.dataset.deskSlot!==String(i))btn.dataset.deskSlot=String(i);
  }
  let more=q(':scope > .ldm538DailyMore',desk);
  if(!more){
   more=create('details','ldm538DailyMore');
   more.append(create('summary','','फीस खोज, रसीद एवं अन्य काउंटर सेवाएँ'));
   desk.append(more);
   actions.addEventListener('click',e=>{
    if(e.target.closest('button')?.dataset.deskSlot==='3')more.open=true;
   },true);
  }
  for(const child of [...desk.children]){
   if(child!==head&&child!==actions&&child!==more&&!['STYLE','SCRIPT'].includes(child.tagName))more.append(child);
  }

 }
 function arrangeFull(){
  const root=q('#erpContent > .ldm535PremiumDashboard'),details=q('#ldm535FullAccess',root);if(!details)return;
  if(!details.dataset.ldm538Setup){details.dataset.ldm538Setup='1';details.open=true;}
  const label=q('.ldm535FullLabel strong',details);setText(label,'Admin Full Access – A to Z Modules');
  const sub=q('.ldm535FullLabel small',details);setText(sub,'School Management के सभी कार्य एक स्थान पर');
  const exp=q('.ldm535ExpandText',details);setText(exp,'⌃ Hide / Show');
  const body=q('.ldm535FullBody',details),sections=q('.ldm535FullSections',root);
  if(!body||!sections)return;
  const intro=q('.ldm535FullIntro',body);if(intro)intro.hidden=true;
  let original=q(':scope > .ldm538Original',body);
  if(!original){original=create('details','ldm538Original');original.open=false;original.append(create('summary','', 'सभी मूल ERP कार्ड / Original modules देखें'));body.append(original)}
  if(sections.parentElement!==original)original.append(sections);
  const nav=q('.ldm537Categories',body);if(nav){
   [...nav.children].forEach(b=>{const i=Number(b.dataset.ldm538Category);if(!categories[i])return;const small=q('small',b);if(small){const value=[
      'Attendance · Requests · Gate Pass · Monitoring','UDISE+ · Student Master · Class Teacher',
      'Exams · Question Paper · Marks Entry','Fee Collection · Due Fee · Fee Status',
      'Add Teacher · Requests · Teaching','ID Cards · Certificates · Letters',
      'QR Gate · Student QR · Storage','All Reports · Activities · Notices'][i];if(small.textContent!==value)small.textContent=value;}
   });
   if(!q('.ldm538CategoryPanel',body)){
    const panel=create('section','ldm538CategoryPanel');panel.hidden=true;panel.setAttribute('aria-live','polite');nav.after(panel);
   }
  }
 }
 function openCategory(index,trigger){
  const root=q('#erpContent > .ldm535PremiumDashboard'),full=q('#ldm535FullAccess',root);
  const panel=q('.ldm538CategoryPanel',full),def=categories[index];if(!panel||!def)return;
  if(!full.open)full.open=true;
  if(!panel.hidden&&panel.dataset.category===String(index)){panel.hidden=true;trigger?.setAttribute('aria-expanded','false');return;}
  panel.hidden=false;panel.dataset.category=String(index);
  const catalog=typeof W.LDM_PREMIUM_V500?.catalog==='function'?W.LDM_PREMIUM_V500.catalog():[];
  const matches=catalog.filter(e=>{
   const description=[e.title,e.detail,e.route].join(' ');
   return def.re.test(description)||(index===categories.length-1&&!categories.some(c=>c.re.test(description)));
  });
  panel.replaceChildren();panel.append(create('b','ldm538CategoryHeading',def.icon+' '+def.name));
  const links=create('div','ldm538CategoryLinks');
  for(const e of matches){
   const btn=create('button','',String(e.icon||'📌')+' '+String(e.title||e.route));btn.type='button';btn.addEventListener('click',()=>safeRoute(e.route));links.append(btn);
  }
  if(!matches.length){const no=create('span','', 'इस श्रेणी के मूल कार्ड नीचे उपलब्ध हैं।');links.append(no)}
  const all=create('button','ldm538ShowAll','सभी मूल ERP कार्ड खोलें →');all.type='button';all.addEventListener('click',()=>{const d=q('.ldm538Original',root);if(d){d.open=true;d.scrollIntoView({block:'start',behavior:'smooth'});}else W.LDM_PREMIUM_V500?.open?.();});
  panel.append(links,all);
  q('.ldm537Categories',full)?.querySelectorAll('button').forEach(el=>el.setAttribute('aria-expanded',String(el===trigger)));
  panel.scrollIntoView({block:'nearest',behavior:'smooth'});
 }
 function refresh(){queued=false;makeToolbar();if(!isAdmin()||!isDash())return;decorateHero();statCaption();compactDesk();arrangeFull();setDate();}
 function schedule(){if(queued)return;queued=true;if(W.requestAnimationFrame)W.requestAnimationFrame(refresh);else Promise.resolve().then(refresh)}
 function initialize(){
  const host=q('#erpContent');if(host&&!observer){observer=new MutationObserver(records=>{if(records.some(r=>r.addedNodes.length||r.removedNodes.length))schedule()});observer.observe(host,{childList:true,subtree:true});}
  D.addEventListener('click',e=>{const btn=e.target.closest?.('.ldm537Categories > button');if(!btn||!isAdmin()||!btn.closest('#ldm535FullAccess'))return;const i=Number(btn.dataset.ldm538Category);if(!categories[i])return;e.preventDefault();e.stopImmediatePropagation();openCategory(i,btn);},true);
  D.addEventListener('keydown',event=>{
   if(!(event.ctrlKey||event.metaKey)||event.key.toLowerCase()!=='k'||!isAdmin()||!isDash())return;
   const search=q('#v75TopQ');if(search){event.preventDefault();search.focus();}
  });
  D.addEventListener('visibilitychange',()=>{if(!D.hidden)schedule()});schedule();
 }
 W.LDM_DASHBOARD_V538=Object.freeze({version:'538',refresh:schedule});
 if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',initialize,{once:true});else initialize();
})();
