/* V64.2: one child chooser, stable record identity, async render support. */
(()=>{'use strict';
 const cards=()=>Array.from(document.querySelectorAll('#parentDashboardBody .parentStudentCard'));
 let previous=[],observer;
 function meta(c,i){return {key:c.dataset.studentId||`card-${i}`,adm:c.dataset.admissionNo||'',name:c.querySelector('.v114PortalHeroStudent b,.v114ChildRow b')?.textContent?.trim()||`Student ${i+1}`,sub:c.querySelector('.v114PortalHeroStudent span,.v114ChildRow span')?.textContent?.trim()||''}}
 function save(key,adm){try{if(key){sessionStorage.setItem('ld_active_student_id',key);sessionStorage.setItem('ld_active_student',adm)}else{sessionStorage.removeItem('ld_active_student_id');sessionStorage.removeItem('ld_active_student')}}catch(_){} }
 function choose(key){const all=cards(),selected=all.find((c,i)=>meta(c,i).key===key);if(!selected)return;
  all.forEach(c=>c.hidden=c!==selected);const chooser=document.getElementById('v63ChildChooser');if(chooser)chooser.hidden=true;
  const m=meta(selected,all.indexOf(selected));save(m.key,m.adm);selected.scrollIntoView({block:'start'});
 }
 function showChooser(){cards().forEach(c=>c.hidden=true);save('','');const ch=document.getElementById('v63ChildChooser');if(ch){ch.hidden=false;ch.scrollIntoView({block:'start'})}}
 function apply(){const body=document.getElementById('parentDashboardBody'),all=cards();if(!body||!all.length){previous=[];return}
  document.getElementById('v54Children')?.remove();
  if(all.length===previous.length&&all.every((c,i)=>c===previous[i]))return;
  previous=all;document.getElementById('v63ChildChooser')?.remove();
  if(all.length===1){all[0].hidden=false;const m=meta(all[0],0);save(m.key,m.adm);return}
  const ch=document.createElement('section');ch.id='v63ChildChooser';ch.className='v63ChildChooser';
  const title=document.createElement('h2');title.textContent='My Children';ch.append(title);
  const grid=document.createElement('div');grid.className='v63ChildGrid';ch.append(grid);
  all.forEach((c,i)=>{const m=meta(c,i),b=document.createElement('button'),name=document.createElement('b'),sub=document.createElement('span');b.className='v63ChildPick';name.textContent=m.name;sub.textContent=m.sub;b.append(name,sub);b.onclick=()=>choose(m.key);grid.append(b);c.hidden=true;
   if(!c.querySelector('.v63ChildBack')){const back=document.createElement('button');back.className='v63ChildBack';back.textContent='← Back to My Children';back.onclick=showChooser;c.prepend(back)}
  });body.prepend(ch);
  let saved='';try{saved=sessionStorage.getItem('ld_active_student_id')||''}catch(_){}
  if(all.some((c,i)=>meta(c,i).key===saved))choose(saved);
 }
 function install(){apply();const body=document.getElementById('parentDashboardBody');if(body&&!observer){observer=new MutationObserver(apply);observer.observe(body,{childList:true})}}
 window.v63ApplyParentIsolation=apply;window.v63ShowMyChildren=showChooser;
 window.v54SelectChild=adm=>{const all=cards(),c=all.find(x=>x.dataset.admissionNo===adm);if(c)choose(meta(c,all.indexOf(c)).key)};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
