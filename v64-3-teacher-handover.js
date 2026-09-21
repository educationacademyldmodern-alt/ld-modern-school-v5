/* Replace multi-request handover with one database transaction. */
(()=>{'use strict';
 window.v57DoHandover=async()=>{
 const $=id=>document.getElementById(id),old=$('v57Old')?.value,next=$('v57New')?.value||null,date=$('v57LeaveDate')?.value,reason=$('v57Reason')?.value.trim();
 if(!old||old===next||!date||!reason)return toast('Leaving Teacher, अलग replacement, date और reason भरें।');
 const b=document.querySelector('[onclick="v57DoHandover()"]');if(b?.disabled)return;if(b)b.disabled=true;
 try{const r=await sb.rpc('v643_teacher_handover',{p_old:old,p_new:next,p_date:date,p_reason:reason});if(r.error)throw r.error;toast('Teacher relieved; class, subject और timetable transfer तथा history सुरक्षित है।');await v57TeacherHandover()}catch(e){toast(e.message||String(e))}finally{if(b)b.disabled=false}
 };
})();
/* A relieved/inactive profile must not enter a dashboard with a restored token. */
(()=>{'use strict';const original=window.loadProfile;if(typeof original!=='function')return;window.loadProfile=async function(){const result=await original.apply(this,arguments);const status=String(window.profile?.status||'active').toLowerCase();if(status!=='active'){await sb.auth.signOut();window.user=null;window.profile=null;throw new Error('Account inactive / relieved है। Admin से संपर्क करें।')}return result}})();
