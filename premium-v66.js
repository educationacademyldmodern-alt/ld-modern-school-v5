/* V66 integration: account isolation, recoverable errors and first-password UI. */
(()=>{
 'use strict';
 window.LDMEA_BUILD='V66.1-RECHECKED-2026-09-21';
 // Parent service rows and portal rows use the same central admission identity.
 const originalParentStudent=window.v64ParentStudent;
 if(typeof originalParentStudent==='function')window.v64ParentStudent=function(admission){
  return originalParentStudent(admission)||(window.v643ParentRows||[]).find(x=>String(x.admission_no)===String(admission));
 };
 function clearRoleState(){
  window.v14TeacherProfile=null;window.v14TeacherClasses=[];window.v14TeacherSubjects=[];
  window.v643ParentRows=[];
  if(typeof v64ParentServices!=='undefined')v64ParentServices=[];
  document.getElementById('parentDashboardBody')?.replaceChildren();
  document.getElementById('v66PasswordGate')?.remove();
  document.body.classList.remove('v6436-parent-role','v6436-teacher-role','v6436-admin-role','v6422-parent','v1142-parent-active');
 }
 function attach(){
  const client=window.sb;if(!client?.auth||client.auth.__v66Attached)return;
  client.auth.__v66Attached=true;
  client.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT')setTimeout(clearRoleState,0)});
 }
 attach();
 const originalInit=window.init;
 if(typeof originalInit==='function')window.init=function(){const result=originalInit.apply(this,arguments);attach();return result};
 // Access is still enforced by Supabase policies. This gate implements first-login UX.
 function passwordGate(resume){
  if(!['teacher','parent','student'].includes(String(window.profile?.role||'').toLowerCase())||window.profile?.must_change_password!==true)return false;
  if(document.getElementById('v66PasswordGate'))return true;
  const root=document.createElement('section');root.id='v66PasswordGate';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Change initial password');
  root.innerHTML='<form><h2>अपना नया Password बनाएँ</h2><p>पहली बार login पर Admin का दिया password बदलें।</p><label>New Password<input name="newPassword" type="password" autocomplete="new-password" minlength="8" maxlength="128" required></label><label>Confirm Password<input name="confirmPassword" type="password" autocomplete="new-password" minlength="8" maxlength="128" required></label><p role="status"></p><button type="submit">Save & Continue</button><button type="button" data-logout>Logout</button></form>';
  document.body.appendChild(root);
  root.querySelector('[data-logout]').onclick=async()=>{await window.sb.auth.signOut();window.user=null;window.profile=null;clearRoleState();window.showPublicPage?.('home')};
  const form=root.querySelector('form');let busy=false,passwordSaved=false;
  form.onsubmit=async event=>{
   event.preventDefault();if(busy)return;
   const a=form.elements.newPassword.value,b=form.elements.confirmPassword.value,status=root.querySelector('[role=status]');
   if(a.length<8||a!==b){status.textContent='कम से कम 8 characters और दोनों passwords समान रखें।';return}
   busy=true;const button=form.querySelector('[type=submit]');button.disabled=true;
   try{
    if(!passwordSaved){const update=await window.sb.auth.updateUser({password:a});if(update.error)throw update.error;passwordSaved=true;form.elements.newPassword.readOnly=true;form.elements.confirmPassword.readOnly=true}
    const saved=await window.sb.rpc('ldmea_v66_complete_password_change');if(saved.error)throw new Error('Password बदल गया है; account confirmation बाकी है. Save & Continue फिर दबाएँ. '+saved.error.message);
    window.profile.must_change_password=false;root.remove();await resume();
   }catch(error){status.textContent=error.message||'Password update नहीं हुआ। फिर कोशिश करें।'}finally{busy=false;button.disabled=false}
  };
  root.querySelector('input').focus();return true;
 }
 for(const name of ['openERP','loadParentPortal']){
  const original=window[name];if(typeof original!=='function')continue;
  window[name]=async function(...args){const resume=()=>original.apply(this,args);if(passwordGate(resume))return;return resume()};
 }
 document.addEventListener('keydown',event=>{if(event.key==='Enter'&&event.target.matches('#parentIdentifier,#parentPassword')){event.preventDefault();window.parentPasswordLogin?.()}});
 // Closed navigation after selection; no reload and no periodic redraw.
 document.addEventListener('click',event=>{if(innerWidth<=900&&event.target.closest('#erpNav button'))document.querySelector('#erp>aside')?.classList.remove('open')});
})();
