/* Compact Admin controls; existing alarm and academic handlers remain authoritative. */
(()=>{'use strict';const $=id=>document.getElementById(id),actor=()=>typeof profile!=='undefined'?profile:window.profile;
const admin=()=>['admin','super_admin','principal'].includes(String(actor()?.role||'').toLowerCase());let queued=false;
function mount(){if(!admin())return;const dash=document.querySelector('#erpContent .ldmRootAdminDash');if(!dash)return;
 let box=$('r323AdminControl');if(!box){box=document.createElement('section');box.id='r323AdminControl';box.className='r323AdminControl';box.innerHTML='<div id="r323ControlGreeting"></div><div id="r323ControlActions"><button id="r323AssignWork"><span>🧩</span><b>Assign Work / काम दें</b><small>शिक्षक / जिम्मेदारी / प्रगति</small></button></div>';dash.prepend(box);$('r323AssignWork').onclick=()=>window.render('work_delegation')}
 const paper=$('r323PaperCard');const actionHost=$('r323ControlActions');if(paper&&actionHost&&paper.parentElement!==actionHost)actionHost.append(paper);
 const g=$('v233Greeting');if(g){if(g.parentElement!==$('r323ControlGreeting'))$('r323ControlGreeting').append(g);const name=g.querySelector('.v271GreetingCopy b');if(name&&name.textContent.includes('@')){let actual=String(actor()?.full_name||'').trim();if(actual.includes('@'))actual='Principal / Admin';name.textContent=name.textContent.split(' • ')[0]+' • '+(actual||'Principal / Admin')}}
 const target=$('r323ControlActions'),alarm=dash.querySelector('[data-v264-dash]')||document.querySelector('#erpContent [data-v264-dash]'),academic=dash.querySelector('[data-v267-admin-academic]')||document.querySelector('#erpContent [data-v267-admin-academic]');
 if(alarm&&alarm.parentElement!==target)target.prepend(alarm);if(!alarm&&!$('r323AlarmFallback')){const b=document.createElement('button');b.id='r323AlarmFallback';b.innerHTML='<span><b>🔔 Work Alarm</b><small>आज के कार्य / Pending स्थिति खोलें</small></span><strong>OPEN →</strong>';b.onclick=()=>window.render('smart_work_alarm');target.prepend(b)}if(alarm)$('r323AlarmFallback')?.remove();if(academic&&academic.parentElement!==target)target.append(academic);
 if(!academic&&!$('r323AcademicFallback')){const b=document.createElement('button');b.id='r323AcademicFallback';b.innerHTML='<span>📊</span><b>Academic Analysis</b><small>शिक्षक / पाठ्यक्रम / कॉपी जाँच / टेस्ट</small>';b.onclick=()=>window.render('academic_monitor');target.append(b)}if(academic)$('r323AcademicFallback')?.remove();
 for(const old of dash.querySelectorAll('.v90Monitor[onclick="render(\'academic_monitor\')"]'))old.hidden=true;
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mount()})}
const prior=window.render;window.render=async function(...args){const out=await prior.apply(this,args);if(args[0]==='dashboard'){mount();schedule()}return out};try{render=window.render}catch(_){}
const baseDash=window.v90AdminDashboard;if(typeof baseDash==='function'){window.v90AdminDashboard=async function(...args){const out=await baseDash.apply(this,args);mount();return out};try{v90AdminDashboard=window.v90AdminDashboard}catch(_){}}
function ready(){const host=$('erpContent');if(host)new MutationObserver(schedule).observe(host,{childList:true,subtree:true});mount()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();window.LDM_V323_CONTROLS={mount};
})();
