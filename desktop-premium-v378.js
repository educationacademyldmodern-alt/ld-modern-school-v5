/* Desktop dashboard composition only. No database reads, polling or mobile mount. */
(()=>{'use strict';const W=window,D=document,media=matchMedia('(min-width:901px)'),$=id=>D.getElementById(id);let queued=false,paintCount=0,signature='',lastRole='';
const actor=()=>typeof profile!=='undefined'?profile:W.profile,schoolInfo=()=>typeof school!=='undefined'?school:W.school,role=()=>String(actor()?.role||'').toLowerCase();
const admin=()=>['admin','principal','super_admin'].includes(role()),eligible=()=>admin()||role()==='teacher';
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nativeRoot=()=>$('erpContent')?.querySelector(admin()?'.ldmRootAdminDash':'.ldmNewTeacher');
function active(){return media.matches&&eligible()&&String(W.__v90Route||'dashboard')==='dashboard'&&!!nativeRoot()}
function closeMenu(){D.body.classList.remove('d378MenuOpen');$('d378Menu')?.setAttribute('aria-expanded','false')}
function cleanup(){const was=D.body.classList.contains('d378Desktop');D.body.classList.remove('d378Desktop','d378MenuOpen');for(const id of ['d378Brand','d378Welcome','d378Actions','d378TeacherStats','d378Menu'])$(id)?.remove();signature='';lastRole='';if(was&&!media.matches)W.LDM_DASHBOARD_V350?.mount?.()}
function button(text,route,primary=false){return '<button type="button" data-d378-route="'+E(route)+'"'+(primary?' class="primary"':'')+'>'+E(text)+'</button>'}
function safeLogo(){const value=String(schoolInfo()?.logo_url||'school-logo.png');return /^(https?:\/\/|\/|\.\/|[a-z0-9][\w./-]*\.(?:png|jpe?g|webp)(?:\?|$))/i.test(value)?value:'school-logo.png'}
function identity(){const p=actor()||{},ctx=W.ldmTeacherContext,t=ctx?.teacher||{};let name=String(role()==='teacher'?t.teacher_name||p.full_name||'Teacher':p.full_name||'School Administrator').trim();if(name.includes('@'))name=admin()?'School Administrator':'Teacher';return {name,ctx,p}}
function paintChrome(host){const {name,ctx,p}=identity(),s=schoolInfo()||{},classes=[...new Set((ctx?.classes||[]).filter(x=>x.is_active!==false).map(x=>String(x.class_name||'')).filter(Boolean))],subjects=[...new Set((ctx?.subjects||[]).filter(x=>x.is_active!==false).map(x=>String(x.subject_name||x.subject||'')).filter(Boolean))];
 const sig=JSON.stringify([role(),p.id,name,s.school_name,s.school_address,s.address,s.logo_url,classes,subjects,p.status,new Date().toLocaleDateString('en-IN',{timeZone:'Asia/Kolkata'})]);if(sig===signature&&$('d378Brand')&&$('d378Welcome'))return;signature=sig;lastRole=role();
 for(const [id,tag]of [['d378Brand','section'],['d378Welcome','section'],['d378Actions','nav']])if(!$(id)){const el=D.createElement(tag);el.id=id;host.append(el)}
 $('d378Brand').innerHTML='<div class="d378SchoolIcon"><img src="'+E(safeLogo())+'" alt="School logo"><span>LD</span></div><div><small>OFFICIAL SCHOOL WORKSPACE · '+E(admin()?'ADMINISTRATION':'TEACHER PORTAL')+'</small><h1>'+E(s.school_name||'L D MODERN EDUCATION ACADEMY')+'</h1><p>'+E(s.school_address||s.address||'Gambhiriya Bujurg, Singhapatti, Padrauna, Kushinagar')+'</p></div>';
 const logo=$('d378Brand').querySelector('img');logo.onerror=()=>{logo.hidden=true;logo.nextElementSibling.hidden=false};logo.nextElementSibling.hidden=true;
 $('d378Welcome').className='d378Welcome v114PortalHero';$('d378Welcome').innerHTML=typeof W.ldmRoleHeroV377==='function'?W.ldmRoleHeroV377(admin()?'admin':'teacher',name,admin()?'School Administration':'Teacher • '+(classes.length?classes.join(', '):'Assigned classroom')):'<h2>'+E(name)+'</h2>';
 $('d378Actions').setAttribute('aria-label','Daily dashboard actions');$('d378Actions').innerHTML=button(admin()?'📝 Teacher Paper Inbox':'📝 My Question Papers','teacher_paper_center',true)+button('✅ Attendance','attendance')+button(admin()?'₹ Fee Collection':'👥 My Class',admin()?'smart_fee_center':'teacher_class');
 if(!admin()){if(!$('d378TeacherStats')){const el=D.createElement('section');el.id='d378TeacherStats';host.append(el)}const metric=(icon,label,value,route)=>'<button type="button" data-d378-route="'+route+'"><span>'+icon+'</span><div><small>'+label+'</small><b>'+E(value)+'</b></div></button>';$('d378TeacherStats').innerHTML=metric('👥','Assigned Classes',ctx?classes.length:'—','teacher_class')+metric('📚','Assigned Subjects',ctx?subjects.length:'—','teacher_profile')+metric('👤','Account Status',String(p.status||'active'),'teacher_profile')+metric('📝','Question Papers','Open','teacher_paper_center')}else $('d378TeacherStats')?.remove();
 for(const id of ['d378Actions','d378TeacherStats'])if($(id))$(id).onclick=e=>{const b=e.target.closest('[data-d378-route]');if(b)W.render?.(b.dataset.d378Route)};
}
function rank(selector,value){for(const el of D.querySelectorAll('#erpContent '+selector)){el.dataset.d378Order=String(value);if(el.style.getPropertyValue('order'))el.style.removeProperty('order')}}
function mount(){if(!media.matches&&!D.body.classList.contains('d378Desktop'))return;if(!active()){cleanup();return}const host=$('erpContent'),top=D.querySelector('#erp .erpTop');D.body.classList.add('d378Desktop');if(top&&!$('d378Menu')){const b=D.createElement('button');b.id='d378Menu';b.type='button';b.textContent='☰ Menu';b.setAttribute('aria-expanded','false');b.setAttribute('aria-label','Open school navigation');b.onclick=()=>{const open=D.body.classList.toggle('d378MenuOpen');b.setAttribute('aria-expanded',String(open))};top.prepend(b)}paintChrome(host);
 rank('#v90Stats',15);rank('.ldmTeacherScope',17);rank('.ldmTeacherModules',22);rank('#v185FrontDesk',25);rank('#r323ControlActions',30);rank('.v114QuickPanel',35);rank('.v114ManagementPanel',40);rank('.ldmMasterControl',45);rank('#v149AdminQuickSlot',50);rank('.v114AttendancePanel',55);rank('#s336DashboardCard',70);rank('#s336TeacherCard',72);rank('#v307Dash',75);rank('#r320DailyReminderCard',76);rank('.v114AdminFeedGrid',80);
 paintCount++;
}
function schedule(){if(queued||!media.matches)return;queued=true;requestAnimationFrame(()=>{queued=false;mount()})}
const baseRender=W.render;if(typeof baseRender==='function'){W.render=async function(...args){try{return await baseRender.apply(this,args)}finally{mount()}};try{render=W.render}catch(_){}}
function init(){
 const host=$('erpContent');
 if(host)new MutationObserver(records=>{
  const structural=records.some(r=>r.target===host||[...r.addedNodes].some(n=>n.nodeType===1&&!String(n.id||'').startsWith('d378')));
  if(structural)schedule();
 }).observe(host,{childList:true,subtree:true});
 mount();
}
D.addEventListener('click',e=>{if(!media.matches)return;if(e.target.closest?.('#erpNav button,#erpNav a'))closeMenu()});D.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});media.addEventListener('change',()=>{if(media.matches)mount();else cleanup()});
W.LDM_DESKTOP_378={active,mount,stats:()=>({mounts:paintCount,role:lastRole}),version:378};if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
