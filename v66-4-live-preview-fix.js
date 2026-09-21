/* LDMEA V66.4 live-preview reliability correction — non-destructive */
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 const uniq=v=>[...new Set((Array.isArray(v)?v:[]).map(x=>String(x??'').trim()).filter(Boolean))];
 // FINAL teacher context loader: active assignment rows first; Admin-saved requested_classes is the safe fallback.
 if(window.sb){
   window.v14LoadTeacherContext=async function(){
     v14TeacherProfile=null;v14TeacherClasses=[];v14TeacherSubjects=[];
     window.v14TeacherProfile=null;window.v14TeacherClasses=[];
     if(!window.user?.id)return null;
     const pr=await sb.from('teacher_profiles').select('*').eq('auth_user_id',user.id).order('updated_at',{ascending:false}).limit(20);
     if(pr.error)throw new Error('Teacher profile access error: '+(pr.error.message||'Database access blocked'));
     const profiles=(pr.data||[]).filter(x=>String(x.approval_status||'').toLowerCase()==='approved'&&x.is_active!==false);
     if(!profiles.length)return null;
     const primary=profiles[0]; v14TeacherProfile=primary;
     let rows=[];
     for(const prof of profiles){
       const cr=await sb.from('teacher_class_assignments').select('*').eq('teacher_profile_id',prof.id).eq('is_active',true);
       if(cr.error)throw new Error('Assigned classes पढ़ने में समस्या: '+cr.error.message);
       rows.push(...(cr.data||[]));
     }
     const seen=new Set(); rows=rows.filter(x=>{const k=String(x.class_name||'').trim().toLowerCase();if(!k||seen.has(k))return false;seen.add(k);return true});
     if(!rows.length){
       const fallback=uniq(profiles.flatMap(p=>Array.isArray(p.requested_classes)?p.requested_classes:[]));
       rows=fallback.map((c,i)=>({id:'admin-saved-'+i,teacher_profile_id:primary.id,class_name:c,is_active:true,is_class_teacher:false,__fallback:true}));
     }
     v14TeacherClasses=rows;window.v14TeacherProfile=v14TeacherProfile;window.v14TeacherClasses=rows;
     return v14TeacherProfile;
   };
   // Rebind all legacy class readers to the same central rows.
   const allowed=()=>uniq((Array.isArray(window.v14TeacherClasses)?window.v14TeacherClasses:[]).filter(x=>x&&x.is_active!==false).map(x=>x.class_name));
   window.v14AllowedClassNames=allowed;window.v40ClassTeacherNames=allowed;window.v103ClassTeacherClasses=allowed;
   try{v14AllowedClassNames=allowed;v40ClassTeacherNames=allowed;v103ClassTeacherClasses=allowed}catch(_e){}
 }
 // Parent: keep the first screen exclusively as My Children until an explicit child click.
 let choosing=false,observer=null;
 function enforceChooser(){
   const dash=$('parentDashboard'),body=$('parentDashboardBody');if(!choosing||!dash||!body)return;
   dash.classList.add('v664Choosing');
   const chooser=body.querySelector('.v662ChildChooser');
   if(chooser&&body.firstElementChild!==chooser)body.prepend(chooser);
 }
 function startChooser(){choosing=true;enforceChooser();if(observer)observer.disconnect();const body=$('parentDashboardBody');if(body){observer=new MutationObserver(()=>enforceChooser());observer.observe(body,{childList:true,subtree:false})}}
 function stopChooser(){choosing=false;observer?.disconnect();observer=null;$('parentDashboard')?.classList.remove('v664Choosing')}
 document.addEventListener('click',e=>{if(e.target.closest?.('[data-v662-child]'))stopChooser();if(e.target.closest?.('#v662ChildBack'))setTimeout(startChooser,0)},true);
 const oldShow=window.v662ShowMyChildren;if(typeof oldShow==='function')window.v662ShowMyChildren=function(){const r=oldShow.apply(this,arguments);startChooser();return r};
 // loadParentPortal in V66.3 calls the chooser at the end. Activate exclusivity just after that synchronous/async completion.
 const lp=window.loadParentPortal;if(typeof lp==='function')window.loadParentPortal=async function(){const r=await lp.apply(this,arguments);if($('parentDashboardBody')?.querySelector('.v662ChildChooser'))startChooser();return r};
 // Normalize shell after login/route without polling.
 function fit(){const erp=$('erp');if(!erp||erp.classList.contains('hidden'))return;erp.style.maxWidth='100vw';const main=erp.querySelector(':scope>main');if(main)main.style.minWidth='0'}
 window.addEventListener('resize',fit,{passive:true});document.addEventListener('click',()=>requestAnimationFrame(fit),{passive:true});requestAnimationFrame(fit);
})();
