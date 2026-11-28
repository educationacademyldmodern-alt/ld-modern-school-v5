/* LDMEA V535 — add-only dashboard arrangement. Existing card nodes, handlers,
   permission checks, live counters, and server calls remain untouched. */
(()=>{
 'use strict';
 if(window.LDM_DASHBOARD_V535)return;
 const D=document,W=window;
 const adminRoles=new Set(['admin','super_admin','principal']);
 const shortcuts=[
  ['📅','उपस्थिति / Attendance','attendance']
 ];
 let queued=false,observer=null;
 const q=(s,root=D)=>root.querySelector(s);
 function admin(){return adminRoles.has(String(W.profile?.role||'').toLowerCase());}
 function safeLogo(){
  const configured=String(W.school?.logo_url||'').trim();
  try {if(configured){const url=new URL(configured,location.href);if(['http:','https:'].includes(url.protocol))return url.href;}}
  catch(_e){}
  return 'school-logo.png';
 }
 function brand(){
  if(!D.querySelector('#erp:not(.hidden)'))return;
  const identity=q('#erp.ldmAdminCanonical .erpTop > .ldmAdminSchoolIdentity');
  if(identity&&!q(':scope > .ldm535BrandLogo',identity)){
   const img=D.createElement('img');img.className='ldm535BrandLogo';img.alt='School logo';img.decoding='async';img.src=safeLogo();
   img.addEventListener('error',()=>{if(!img.dataset.fallback){img.dataset.fallback='1';img.src='school-logo.png';}});
   identity.prepend(img);
  }
 }
 function ensureShortcuts(root){
  const group=q('#v185FrontDesk .v185FrontActions',root);if(!group)return;
  for(const [icon,title,route] of shortcuts){
   if([...group.querySelectorAll('button')].some(b=>b.dataset.ldm535Route===route||b.getAttribute('onclick')?.trim()==="render('attendance')"))continue;
   const button=D.createElement('button');button.type='button';button.className='ldm535DailyShortcut';button.dataset.ldm535Route=route;
   const sign=D.createElement('span');sign.textContent=icon;sign.setAttribute('aria-hidden','true');
   const label=D.createElement('b');label.textContent=title;
   button.append(sign,label);
   button.addEventListener('click',()=>{if(admin()&&typeof W.render==='function')W.render(route);});
   group.append(button);
  }
 }
 function ensureFullAccess(root){
  let panel=q(':scope > #ldm535FullAccess',root);
  if(!panel){
   panel=D.createElement('details');panel.id='ldm535FullAccess';panel.className='ldm535FullAccess';
   panel.innerHTML='<summary><span class="ldm535FullIcon" aria-hidden="true">👑</span><span class="ldm535FullLabel"><strong>Admin Full Access / सभी प्रशासनिक कार्य</strong><small>Management • School Control • QR & Storage • All Existing Modules</small></span><span class="ldm535ExpandText">सभी कार्ड खोलें <span aria-hidden="true">⌄</span></span></summary><div class="ldm535FullBody"><div class="ldm535FullIntro">सभी पुराने कार्ड मूल कार्य, अनुमति और रिकॉर्ड सहित उपलब्ध हैं। कार्ड चुनकर संबंधित पेज खोलें।</div><div class="ldm535FullSections"></div></div>';
   root.append(panel);
  }
  const target=q('.ldm535FullSections',root);
  for(const selector of [':scope > .v114ManagementPanel',':scope > .ldmMasterControl',':scope > #v149AdminQuickSlot']){
   const el=q(selector,root);
   if(el&&el.parentElement!==target)target.append(el);
  }
 }
 function ensureUniversal(root){
  const greeting=q('#v233Greeting',root),hero=q('#ldm500Hero',root);
  if(greeting&&hero&&hero.parentElement===root&&greeting.parentElement===root&&greeting.nextElementSibling!==hero)greeting.after(hero);
 }
 function ensureDashboard(){
  brand();
  const root=q('#erpContent > .ldmRootAdminDash');
  if(!admin()||!root)return;
  root.classList.add('ldm535PremiumDashboard');
  // V553: V539 owns dashboard ordering; retain V535 as a fallback only.
  if(!W.LDM_DASHBOARD_V539)ensureUniversal(root);
  ensureShortcuts(root);
  ensureFullAccess(root);
 }
 function flush(){queued=false;ensureDashboard();}
 function schedule(){if(queued)return;queued=true;W.requestAnimationFrame?W.requestAnimationFrame(flush):Promise.resolve().then(flush);}
 function init(){
  if(!observer){
   const host=D.getElementById('erpContent');
   if(host){observer=new MutationObserver(records=>{if(records.some(r=>!r.target.closest?.("table,form,[role=dialog],.ldmInlineStatus,#work574Panel")&&[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1)))schedule();});observer.observe(host,{childList:true,subtree:true});}
  }
  schedule();
 }
 // Existing global navigation and sidebar handlers are preserved. Clicking the
 // dashboard canvas closes only the open sidebar and never closes a form/modal.
 D.addEventListener('click',e=>{
  if(!D.querySelector('#erpContent > .ldm535PremiumDashboard'))return;
  if(e.target.closest('#erp aside,#erp .erpTop,[role="dialog"],dialog,.modal,.modalCard'))return;
  if(e.target.closest('button,a,input,select,textarea,[contenteditable="true"]'))return;
  D.querySelector('#erp aside.open')?.classList.remove('open');
 },{passive:true});
 W.LDM_DASHBOARD_V535=Object.freeze({version:'535',refresh:schedule,shortcuts:shortcuts.length});
 if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
