/* V537 — Add visual category navigation to the existing V535 Admin Full Access.
   No route interception, database writes, access-control changes or duplicated modules. */
(()=>{
  'use strict';
  if(window.LDM_DASHBOARD_V537)return;
  const D=document;
  let queued=false;
  const groups=[
    {icon:'⚙️',name:'Management Center',info:'Attendance · Requests · Gate Pass',target:'.v114ManagementPanel'},
    {icon:'🏫',name:'School Control Center',info:'Student Master · Class Teacher · UDISE+',target:'.ldmMasterControl'},
    {icon:'📖',name:'Exam & Academic Center',info:'Marks Entry · Exams · Daily Teaching',target:'#v185FrontDesk'},
    {icon:'₹',name:'Finance & Accounts',info:'Fee Collection · Due Fee · Ledger',target:'#v185FrontDesk'},
    {icon:'👩‍🏫',name:'Teacher & Staff Center',info:'Staff · Assign Work · Monitoring',target:'.v114ManagementPanel'},
    {icon:'📄',name:'Documents & Certificate',info:'ID Card · Certificate · School Docs',target:'.ldmMasterControl'},
    {icon:'▦',name:'QR & Storage Center',info:'QR Gate · Scanner · Storage',target:'#v149AdminQuickSlot'},
    {icon:'📊',name:'Reports & Utilities',info:'Activities · Notices · Calendar',target:'.v114AdminFeedGrid'}
  ];
  function isAdmin(){return ['admin','super_admin','principal'].includes(String(window.profile?.role||'').toLowerCase());}
  function enhance(){
    if(!isAdmin())return;
    const root=D.querySelector('#erpContent > .ldm535PremiumDashboard');
    const details=root?.querySelector('#ldm535FullAccess');
    const body=details?.querySelector('.ldm535FullBody');
    if(!root||!body||body.querySelector('.ldm537Categories'))return;
    const nav=D.createElement('nav');nav.className='ldm537Categories';nav.setAttribute('aria-label','Full Access Sections');
    for(const [index,group] of groups.entries()){
      const button=D.createElement('button');button.type='button';button.dataset.target=group.target;button.dataset.ldm538Category=String(index);
      const symbol=D.createElement('span');symbol.className='ldm537Icon';symbol.setAttribute('aria-hidden','true');symbol.textContent=group.icon;
      const txt=D.createElement('span');txt.className='ldm537CatText';
      const label=D.createElement('b');label.textContent=group.name;
      const info=D.createElement('small');info.textContent=group.info;
      txt.append(label,info);button.append(symbol,txt);nav.append(button);
    }
    nav.addEventListener('click',e=>{
      const button=e.target.closest('button[data-target]');if(!button||!nav.contains(button))return;
      const target=root.querySelector(button.dataset.target);
      if(!target)return;
      // Category buttons navigate to existing modules; they never create/grant routes.
      target.scrollIntoView({behavior:'auto',block:'start'});
    });
    const intro=body.querySelector('.ldm535FullIntro');
    if(intro)intro.after(nav);else body.prepend(nav);
  }
  function flush(){queued=false;enhance();}
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(flush);}
  function init(){
    const host=D.getElementById('erpContent');
    if(host){new MutationObserver(m=>{
      if(m.some(x=>x.addedNodes.length||x.removedNodes.length))schedule();
    }).observe(host,{subtree:true,childList:true});}
    schedule();
  }
  window.LDM_DASHBOARD_V537=Object.freeze({version:'537',refresh:schedule});
  if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
