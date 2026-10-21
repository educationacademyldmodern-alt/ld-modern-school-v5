/* Version 288 extension. No direct student/financial writes or permission fallbacks. */
(()=>{'use strict';
const W=window,$=id=>document.getElementById(id),db=()=>typeof sb!=='undefined'?sb:W.sb;
const actor=()=>String((typeof profile!=='undefined'?profile:W.profile)?.id||'');
const session=()=>String((typeof school!=='undefined'?school:W.school)?.academic_session||'').trim();
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fields=['student_name','roll_no','father_name','mother_name','phone','address'];
const edits=new Map(),pending=new Map(),busy=new Set();let feeEpoch=0,classEpoch=0;
const key=id=>[actor(),session(),id].join('|');
const active=s=>String(s?.status??'').trim().toLowerCase()==='active';
const cash=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))?'₹'+Number(v).toLocaleString('en-IN',{maximumFractionDigits:2}):'उपलब्ध नहीं';
function status(text,kind=''){if(typeof W.v98InlineStatus==='function')W.v98InlineStatus(text,kind);else W.toast?.(text)}
function capture(id,row){const k=key(id);if(!pending.has(k))edits.set(k,Object.fromEntries(fields.map(f=>[f,row[f]??null])))}
function studentForm(source){const input=$(source==='attendance'?'v64TeName':'tesName');return input?.closest('.v14ModalCard,.v64ModalCard,.modalCard,dialog,[role=dialog]')||input?.closest('form')||null}
function controls(root,on,keepInputs=false){if(!root)return;
 root.querySelectorAll('input,textarea,button,select').forEach(el=>{const retry=/teacherSaveStudent|v64SaveTeacherStudent/.test(el.getAttribute('onclick')||'');
  if(on||keepInputs&&!retry){if(!('ldmeaDisabled'in el.dataset))el.dataset.ldmeaDisabled=el.disabled?'1':'0';el.disabled=true}
  else if('ldmeaDisabled'in el.dataset){el.disabled=el.dataset.ldmeaDisabled==='1';delete el.dataset.ldmeaDisabled}})}
async function saveStudent(id,source='class'){
 const k=key(id),who=actor(),sess=session();if(!who||!sess)return status('Login और academic session जाँचें।','bad');if(busy.has(k))return;
 let job=pending.get(k);if(!job){const expected=edits.get(k);if(!expected)return status('यह edit form दोबारा खोलें ताकि पुराने values की पुष्टि हो सके।','bad');
  const names=source==='attendance'?['v64TeName','v64TeRoll','v64TeFather','v64TeMother','v64TePhone','v64TeAddress']:['tesName','tesRoll','tesFather','tesMother','tesPhone','tesAddress'];
  if(names.some(n=>!$(n)))return status('Edit form अधूरा है। पहले उसे दोबारा खोलें।','bad');
  const changes=Object.fromEntries(fields.map((f,i)=>[f,String($(names[i]).value).trim()]));
  if(!changes.student_name)return status('Student Name required.','bad');
  if(changes.phone&&(!/^[+0-9() -]+$/.test(changes.phone)||!/^\d{10,15}$/.test(changes.phone.replace(/\D/g,''))))return status('सही mobile number भरें (10–15 digits)।','bad');
  job={p_student_id:id,p_changes:changes,p_expected:expected,p_session:sess,p_request:crypto.randomUUID()};pending.set(k,job);
 }
 const form=studentForm(source);busy.add(k);controls(form,true);status('Student Master में सेव की पुष्टि हो रही है…','');let timer;
 try{
  const r=await Promise.race([db().rpc('ldmea_teacher_save_v2',job),new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('सर्वर की पुष्टि नहीं मिली। Save फिर दबाएँ; वही request दोबारा भेजी जाएगी।')),20000))]);
  if(r.error)throw r.error;const data=r.data;
  if(data?.ok!==true||String(data.student_id)!==String(id)||data.request_id!==job.p_request)throw Error('Save की पहचान की पुष्टि अधूरी है। उसी Save को Retry करें।');
  pending.delete(k);edits.set(k,data.values);if(actor()!==who||session()!==sess)return;
  W.ldmMarkDataDirty?.('students');W.dispatchEvent(new CustomEvent('ldmea:student-updated',{detail:{id,requestId:job.p_request}}));
  status('✓ Student Master में बदलाव सुरक्षित सेव हुआ।','ok');W.toast?.('Student updated successfully');
  // Do not rewrite historical admission/fee/result names through a broad propagation RPC.
  const route=W.__v90Route,host=$('teacherClassBody')||$('attendanceSheet');Promise.resolve().then(()=>{if(actor()!==who||session()!==sess||route!==W.__v90Route||host&&!host.isConnected)return;if(source==='attendance'&&$('attClass'))return W.loadAttendanceClass?.();if($('teacherClassSel'))return W.teacherLoadSelectedClass?.()}).catch(e=>{if(actor()===who&&session()===sess&&(!host||host.isConnected))status('✓ सेव हो गया। सूची Refresh करें: '+e.message,'ok')});
 }catch(e){
  const definitive=['42501','22023','P0002','40001','PGRST202','42883','23514','22P02'].includes(e.code);
  if(definitive)pending.delete(k);if(actor()===who&&session()===sess){let m=e.message||String(e);
   if(['PGRST202','42883'].includes(e.code))m='Teacher Save RPC उपलब्ध नहीं है। reviewed migration और schema cache जाँचें। पुरानी असुरक्षित save विधि नहीं चलाई गई।';
   status(m+(pending.has(k)?' • Save फिर दबाने पर वही request Retry होगी।':' • आपके typed values form में सुरक्षित हैं।'),'bad')}
 }finally{clearTimeout(timer);busy.delete(k);if(actor()===who&&session()===sess)controls(form,false,pending.has(k))}
}
W.LDMEA_ROOT={capture,saveStudent,canNavigate:()=>![...pending.keys()].some(k=>k.startsWith(actor()+'|'+session()+'|'))};
const oldRender=W.render;if(typeof oldRender==='function'){W.render=function(...args){if(!W.LDMEA_ROOT.canNavigate())return status('पहले Student Save की पुष्टि / Retry पूरा करें।','bad');return oldRender.apply(this,args)};try{render=W.render}catch(_){}}
W.addEventListener('beforeunload',event=>{if(!W.LDMEA_ROOT.canNavigate()){event.preventDefault();event.returnValue=''}});
})();
