/* LDMEA V66.3 final clean correction — no destructive data operations */
(function(){
 'use strict';
 const $=id=>document.getElementById(id), safe=v=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 // V66.3: public literal \n leakage fixed in index.html source; no runtime text hiding is used.

 // Parent: authoritative two-stage experience. First only children cards; details only after explicit selection.
 const detailedParentLoad=window.loadParentPortal;
 let selectedAdm='';
 function parentRows(){return Array.isArray(window.v643ParentRows)?window.v643ParentRows:[]}
 function childKey(x,i){return String(x?.admission_no||x?.student_id||x?.id||i)}
 function chooser(){
   const box=$('parentDashboardBody'), rows=parentRows(); if(!box||!rows.length)return;
   selectedAdm=''; window.v662ActiveStudentId='';
   const logo=(window.school&&school.logo_url)||'school-logo.png';
   box.innerHTML=`<section class="v662ChildChooser"><div class="v662ChildChooserHead"><img src="${safe(logo)}" alt="School Logo"><div><h2>L D MODERN EDUCATION ACADEMY</h2><p>Parent / Student Portal • My Children</p></div></div><div class="v662ChildGrid">${rows.map((x,i)=>`<button type="button" class="v662ChildCard" data-v662-child="${safe(childKey(x,i))}"><b>🎓 ${safe(x.student_name||'Student')}</b><span>Class ${safe(x.class_name||'—')}</span><span>Admission No. ${safe(x.admission_no||'—')}</span></button>`).join('')}</div></section>`;
 }
 async function selectChild(key){
   selectedAdm=String(key||''); window.v662ActiveStudentId=selectedAdm;
   if(typeof detailedParentLoad!=='function')return;
   await detailedParentLoad();
   const box=$('parentDashboardBody');if(!box)return;
   const cards=[...box.querySelectorAll('.parentStudentCard')];
   cards.forEach((c,i)=>{const r=parentRows()[i],k=childKey(r,i),adm=String(c.dataset.admissionNo||'');if(k!==selectedAdm&&adm!==selectedAdm)c.remove()});
   box.insertAdjacentHTML('afterbegin','<button type="button" class="v662ChildBack" id="v662ChildBack">← My Children</button>');
   window.scrollTo({top:0,left:0,behavior:'auto'});
 }
 if(typeof detailedParentLoad==='function')window.loadParentPortal=async function(){
   const r=await detailedParentLoad.apply(this,arguments); chooser(); return r;
 };
 document.addEventListener('click',e=>{const c=e.target.closest?.('[data-v662-child]');if(c){e.preventDefault();selectChild(c.dataset.v662Child).catch(err=>toast?.(err.message||String(err)));return}if(e.target.closest?.('#v662ChildBack')){e.preventDefault();chooser()}},false);
 window.v662ShowMyChildren=chooser;

 // V66.3: Teacher Class Teacher selection is native in both Teacher Manager forms; no fetch monkey-patch.

 // Keep shell width normalized after route changes without polling.
 function normalize(){const erp=$('erp');if(!erp||erp.classList.contains('hidden'))return;document.documentElement.style.maxWidth='100%';document.body.style.maxWidth='100%'}
 window.addEventListener('resize',normalize,{passive:true});document.addEventListener('click',()=>setTimeout(normalize,0),{passive:true});setTimeout(normalize,0);
})();
