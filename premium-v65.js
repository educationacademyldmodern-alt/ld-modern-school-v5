/* V65: bounded login requests and duplicate-save protection. No background writes. */
(function(){
 'use strict';
 function protectAuth(){
  const client=typeof sb!=='undefined'?sb:window.sb;if(!client?.auth||client.auth.__v65Guard)return;
  const auth=client.auth,base=auth.signInWithPassword.bind(auth);let busy=false;
  auth.__v65Guard=true;
  auth.signInWithPassword=async function(payload){
   const key='ldmea-v65-login-attempts';let state={fails:0,until:0};
   try{state=JSON.parse(sessionStorage.getItem(key))||state}catch(e){}
   const fail=message=>({data:{user:null,session:null},error:{message,status:429}});
   if(busy)return fail('Login request चल रही है. कृपया प्रतीक्षा करें.');
   if(state.until>Date.now())return fail('कई असफल प्रयास हुए. '+Math.ceil((state.until-Date.now())/1000)+' सेकंड बाद कोशिश करें.');
   if(state.until&&state.until<=Date.now())state={fails:0,until:0};
   busy=true;
   try{const result=await base(payload);if(result.error){state.fails++;if(state.fails>=5)state.until=Date.now()+60000}else state={fails:0,until:0};try{sessionStorage.setItem(key,JSON.stringify(state))}catch(e){}return result;}finally{busy=false;}
  };
 }
 window.signup=function(){window.toast?.('Account केवल School Admin बनाता है. Office से Login ID लें.');};
 protectAuth();
 if(typeof init==='function'){const base=init;init=function(){const out=base.apply(this,arguments);protectAuth();return out;};}
 function protectTeacherForm(){
  const form=document.getElementById('v6422TName')?.closest('form');
  if(!form||form.__v65SaveGuard||typeof form.onsubmit!=='function')return;
  form.__v65SaveGuard=true;const base=form.onsubmit;let busy=false;
  form.onsubmit=async function(event){event.preventDefault();if(busy)return;busy=true;
   const buttons=[...form.querySelectorAll('button[type="submit"],button:not([type])')];const disabled=buttons.map(x=>x.disabled);buttons.forEach(x=>x.disabled=true);
   try{return await base.call(this,event)}finally{busy=false;buttons.forEach((x,i)=>x.disabled=disabled[i]);}
  };
 }
 for(const name of ['v6422AddTeacherForm','v6422EditTeacher']){
  const base=window[name];if(typeof base==='function')window[name]=async function(){const out=await base.apply(this,arguments);protectTeacherForm();return out;};
 }
 document.addEventListener('submit',event=>{
  if(event.target.id==='v6428TeacherLoginForm')event.target.querySelector('input[type="password"]')?.setAttribute('autocomplete','current-password');
 },true);
 // Use the lexical authenticated profile; window.profile is not authoritative in older builds.
 window.addEventListener('pageshow',()=>{if(typeof window.v6436SyncRoleShell==='function')window.v6436SyncRoleShell();});
})();
