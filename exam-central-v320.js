/* Timetable paper IDs are the single source for exam attendance and resumable marks. */

/* V475 date panel: bundled to avoid missing script/load-order failures. */
// Reuse the selected timetable paper and its authorized roster.
window.examDates475 = typeof window.examDates475 === "function" ? window.examDates475 : function (host, sheet, isAdmin, save, reload, note, canStart) {
  const panel = document.createElement('details');
  panel.id = 'x320DatePanel';
  panel.innerHTML = '<summary>बाद की परीक्षा / नई तारीख</summary><label>किसकी परीक्षा<select></select></label><label>परीक्षा की वास्तविक तारीख<input type="date"></label><label>कारण<input type="text"></label><button type="button">तारीख दर्ज करें</button>';
  const picker = panel.querySelector('select');
  picker.add(new Option('विकल्प चुनें',''));
  if (isAdmin) picker.add(new Option('पूरी कक्षा का पेपर स्थगित','paper'));
  for (const row of sheet.rows) {
    if (row.attendance !== 'Present' && row.marks == null)
      picker.add(new Option([row.student_name,row.father_name,row.admission_no].filter(Boolean).join(' • '),row.student_id));
  }
  const [date,reason] = panel.querySelectorAll('input');
  const button = panel.querySelector('button');
  button.onclick = async () => {
    if (!canStart() || button.disabled) return;
    if (!picker.value || !date.value || reason.value.trim().length<3) return note('विद्यार्थी या कक्षा, तारीख और कारण चुनें।');
    button.disabled = true;
    try {
      const actual = date.value;
      const res = await save('ldm_exam_date475',{p_paper:sheet.paper.paper_id,p_student:picker.value==='paper'?null:picker.value,p_before:String(sheet.paper.exam_date).slice(0,10),p_actual:actual,p_revision:sheet.revision,p_reason:reason.value.trim()});
      if (res!==actual) throw Error('तारीख की पुष्टि नहीं मिली। पेपर दोबारा खोलें।');
      if(panel.isConnected) await reload();
    } catch(e) {if(panel.isConnected)note(e.message);}
    finally {button.disabled=false;}
  };
  host.append(panel);
};

(()=>{'use strict';const $=id=>document.getElementById(id),E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const actor=()=>typeof profile!=='undefined'?profile:window.profile,db=()=>typeof sb!=='undefined'?sb:window.sb,sess=()=>typeof school!=='undefined'?school?.academic_session:window.school?.academic_session;
let data=null,pending=null,busy=false,page=1,sortField='student_name',direction=1,version=0;const markEdits=new Map();let autoMarks=true;let autoTimer=null;const edits=new Map(),key=()=> 'ldm_exam_retry_'+actor()?.id;
function message(s){if($('x320Status'))$('x320Status').textContent=s}
let stateScope=String(actor()?.id||'')+'|'+String(sess()||'');
function syncScope(){const scope=String(actor()?.id||'')+'|'+String(sess()||'');if(scope===stateScope)return;stateScope=scope;clearTimeout(autoTimer);version++;data=null;pending=null;busy=false;edits.clear();markEdits.clear();page=1}
function blocked(){syncScope();return busy||!!pending||edits.size>0||markEdits.size>0}
function lock(){document.querySelectorAll('#x320Center input,#x320Center select,#x320Center button').forEach(el=>{if(['x320Retry','x320Refresh','x501CancelRejected'].includes(el.id)){el.disabled=busy;return}if(el.dataset.originalDisabled===undefined)el.dataset.originalDisabled=el.disabled?'1':'0';el.disabled=busy||!!pending||el.dataset.originalDisabled==='1'})}
async function rpc(name,args){const req=db().rpc(name,args);let timer;try{const r=await Promise.race([req,new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('Server response uncertain; retry the same save request')),15000))]);if(r.error)throw r.error;return r.data}finally{clearTimeout(timer)}}
async function save(action,rows=[]){if(busy||pending)return;if(!data)return;const args={p_paper:data.paper.paper_id,p_action:action,p_rows:rows,p_max:action==='setup'?Number($('x320Max')?.value):Number(data.max_marks),p_revision:data.revision,p_request:crypto.randomUUID(),p_reason:$('x320Reason')?.value.trim()||(action==='setup'?'Maximum marks changed from '+String(data.max_marks??'unset')+' to '+String(Number($('x320Max')?.value)):'')};pending={owner:actor()?.id,session:sess(),args};try{sessionStorage.setItem(key(),JSON.stringify(pending))}catch(e){pending=null;return message('Retry storage unavailable; save not started')}return retry()}
async function retry(){syncScope();if(!pending||busy)return;if(pending.owner!==actor()?.id||pending.session&&pending.session!==sess())return message('Retry belongs to another account/session');const job=pending,who=actor()?.id,session=sess(),requestKey=key(),host=$('x320Center'),mine=version;const current=()=>actor()?.id===who&&sess()===session&&version===mine&&host===$('x320Center')&&host?.isConnected;const place=capturePlace();let confirmed=false;job.rejected=false;try{sessionStorage.setItem(requestKey,JSON.stringify(job))}catch(_){return message('Retry status could not be stored; request not sent.')}busy=true;lock();message('Saving…');try{let result=await rpc(job.args.p_action==='marks'?'ldm_marks_sync471':String(actor()?.role||'').toLowerCase()==='teacher'?'ldm_teacher_exam_action475':'ldm_v320_exam_save',job.args);if(!current()||pending!==job)return;if(!result?.paper||String(result.paper.paper_id)!==String(job.args.p_paper)){const loader=String(actor()?.role||'').toLowerCase()==='teacher'?'ldm_teacher_load471':'ldm_v320_exam_load';result=await rpc(loader,{p_paper:job.args.p_paper});if(!current()||pending!==job)return;}if(!result?.paper||String(result.paper.paper_id)!==String(job.args.p_paper))throw Error('Save confirmation unavailable; retry same request');if(job.args.p_action==='setup'&&Number(result.max_marks)!==Number(job.args.p_max)){const err=Error('Server did not apply Maximum Marks update. Check function permissions/revision.');err.code='LDM_MAX_NOT_APPLIED';throw err;}const confirmedRows=new Map((result.rows||[]).map(r=>[String(r.student_id),r]));if(job.args.p_action==='attendance'&&job.args.p_rows.some(x=>{const r=confirmedRows.get(String(x.student_id));return !r||String(r.attendance)!==String(x.attendance)}))throw Error('Attendance not confirmed on server; retry same request');if(job.args.p_action==='marks'&&job.args.p_rows.some(x=>{const r=confirmedRows.get(String(x.student_id));return !r||r.marks==null||String(r.marks).trim()===''||Number(r.marks)!==Number(x.marks)}))throw Error('Marks not confirmed on server; retry same request');if(data&&String(data.paper.paper_id)===String(result.paper.paper_id))Object.assign(data,result);else data=result;pending=null;confirmed=true;clearTimeout(autoTimer);try{sessionStorage.removeItem(requestKey)}catch(_){/* server confirmation remains authoritative */}if($('x320RetryHost'))$('x320RetryHost').replaceChildren();if(job.args.p_action==='attendance'){edits.clear();keepScores();if(autoMarks&&markEdits.size)setTimeout(scheduleAutoSave,100);}if(job.args.p_action==='marks'){markEdits.clear();keepScores()}window.LDM_MARKSHEET?.clear();window.ldmMarkDataDirty?.('marks');if(['marks','attendance'].includes(job.args.p_action)&&$('x320Summary'))syncSavedRows(job.args.p_action);else paint(true);restorePlace(place);message('✓ सर्वर पर सेव हुआ। बाकी विद्यार्थियों की प्रविष्टि बाद में जारी रख सकते हैं।')}catch(e){if(!current())return;if(confirmed){message('✓ Server save confirmed; screen update failed. Reopen this paper after reviewing any remaining edits. '+String(e.message||e));return;}if(pending!==job)return;if(['P0001','42501','22P02','23514','23505','42703','42P01','LDM_MAX_NOT_APPLIED'].includes(e.code)){job.rejected=true;try{sessionStorage.setItem(requestKey,JSON.stringify(job))}catch(_){/* In-memory rejection is still known; a reload must treat it as uncertain. */}message(e.message+' • Save rejected. Check server state before starting a new request.');showRecovery()}else{message(e.message);showRecovery()}}finally{if(actor()?.id===who&&sess()===session&&version===mine){busy=false;if(host===$('x320Center'))lock()}}}

async function refreshAfterRejectedSave(){
 if(busy||!pending)return;
 syncScope();if(!pending)return;if(!pending.rejected)return message('Save outcome is uncertain. Use Retry Same Save; its request ID must not change.');const old=pending, paper=old.args.p_paper,who=actor()?.id,session=sess(),mine=version,host=$('x320Center');const current=()=>pending===old&&who===actor()?.id&&session===sess()&&mine===version&&host===$('x320Center');
 message('Checking latest server values…');busy=true;lock();
 try{
  const role=String(actor()?.role||'').toLowerCase();
  const fresh=await rpc(role==='teacher'?'ldm_teacher_load471':'ldm_v320_exam_load',{p_paper:paper});
  if(!current())return;
  if(!fresh?.paper||String(fresh.paper.paper_id)!==String(paper)||!Array.isArray(fresh.rows))throw Error('Server paper could not be verified');
  if(!['marks','attendance'].includes(old.args.p_action))return message('Setup/publication needs review. Cancel the rejected request and reload before resubmitting.');
  if(Number(fresh.max_marks)!==Number(old.args.p_max))return message('Maximum marks changed on server. Review the latest paper before resubmitting.');
  const conflicts=old.args.p_rows.filter(x=>{
   const row=fresh.rows.find(r=>String(r.student_id)===String(x.student_id));
   return !row||Number(row.revision)!==Number(x.revision);
  });
  if(conflicts.length){message(conflicts.length+' students changed on server. Existing values kept. Review these students; no automatic overwrite.');return}
  // All original row revisions still match: only paper revision changed.
  // Recreate the request with fresh revision, retain the same edits and a NEW idempotency key.
  const updated={...old,args:{...old.args,p_revision:fresh.revision,p_request:crypto.randomUUID()}};
  sessionStorage.setItem(key(),JSON.stringify(updated));
  Object.assign(old,updated);pending=old;
  if(data&&String(data.paper.paper_id)===String(fresh.paper.paper_id))Object.assign(data,fresh);else data=fresh;
  message('Server revision refreshed. Press Retry Same Save.');
 }catch(e){if(current())message('Refresh failed: '+e.message)}
 finally{if(current()){busy=false;lock()}}
}
// V509: resolve a Maximum update by reading authoritative server state; never guess if a timed-out write committed.
async function verifyMaximum(){
 syncScope();const job=pending;
 if(busy||!job||job.args?.p_action!=='setup')return;
 const who=actor()?.id,session=sess(),mine=version,host=$('x320Center');
 const current=()=>pending===job&&actor()?.id===who&&sess()===session&&version===mine&&host===$('x320Center')&&!!host?.isConnected;
 const requested=Number(job.args.p_max),paper=job.args.p_paper;
 busy=true;lock();message('Checking Maximum Marks saved on server (no new write)…');
 try{
  const role=String(actor()?.role||'').toLowerCase();
  const fresh=await rpc(role==='teacher'?'ldm_teacher_load471':'ldm_v320_exam_load',{p_paper:paper});
  if(!current())return;
  if(!fresh?.paper||String(fresh.paper.paper_id)!==String(paper)||!Array.isArray(fresh.rows)||!Number.isFinite(Number(fresh.max_marks)))throw Error('Verified paper / maximum unavailable');
  const actual=Number(fresh.max_marks),matched=actual===requested;
  // Only a known, explicitly rejected request may be replaced when server has a different value.
  if(!matched&&!job.rejected){message('Server currently shows '+actual+' marks, but this write may still complete. Retry Same Save with the SAME request ID. Do not start a new Maximum save.');return;}
  try{sessionStorage.removeItem(key())}catch(_){return message('Browser retry storage not accessible. Original request preserved; refresh only after storage is available.');}
  pending=null;
  if(data&&String(data.paper.paper_id)===String(fresh.paper.paper_id))Object.assign(data,fresh);else data=fresh;
  // Refresh only the selected paper. Never invent a database write or reset other students' edits.
  $('x320RetryHost')?.replaceChildren();paint(true);
  if(matched){
   window.LDM_MARKSHEET?.clear();window.ldmMarkDataDirty?.('marks');
   message('✓ Server confirms Maximum Marks = '+actual+'. You can continue Attendance / Marks.');
  }else{
   const input=$('x320Max');if(input)input.value=String(requested);
   message('Rejected request released. Server Maximum = '+actual+'; requested = '+requested+'. Review values, then press Update Maximum for a NEW save. If rejected again, backend permission/function needs repair.');
  }
 }catch(e){if(current())message('Maximum verification failed: '+String(e.message||e)+'. Original request kept; use Retry Same Save.');}
 finally{if(actor()?.id===who&&sess()===session&&version===mine){busy=false;if(host===$('x320Center'))lock();}}
}
function showRecovery(){const h=$('x320RetryHost');if(!h)return;
 h.innerHTML='<button type="button" id="x320Retry">Retry Same Save</button> <button type="button" id="x320Refresh">Check Latest Revision</button>';
 $('x320Retry').onclick=retry;
 if(pending?.args?.p_action==='setup'){
   $('x320Refresh').textContent='Check Server Maximum / Continue';
   $('x320Refresh').onclick=verifyMaximum;
 }else $('x320Refresh').onclick=refreshAfterRejectedSave;
 if(pending?.rejected&&pending?.args?.p_action!=='setup'){const b=document.createElement('button');b.id='x501CancelRejected';b.type='button';b.textContent='Cancel Rejected Request / Review Edits';b.onclick=()=>{if(busy||!pending?.rejected)return;try{sessionStorage.removeItem(key())}catch(_){return message('Retry storage unavailable; request retained')}pending=null;h.replaceChildren();lock();message('Rejected request cancelled. Unsaved edits remain for review or Discard.');};h.append(b)}
}
function installPaperFilters(papers){
 const filters=[['x500Exam','exam_name'],['x500Class','class_name'],['x500Subject','subject_name']];
 const committed={};
 filters.forEach(([id,field])=>{const el=$(id);if(!el)return;committed[id]=el.value;const values=[...new Set(papers.map(p=>String(p[field]||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'hi',{numeric:true}));values.forEach(v=>el.add(new Option(v,v)));
 el.onchange=()=>{if(blocked()){el.value=committed[id];message('Please save the pending entries before changing filters');return;}committed[id]=el.value;applyFilter();};});
 function applyFilter(){const selected=Object.fromEntries(filters.map(([id,field])=>[field,$(id)?.value||'']));const options=papers.filter(p=>Object.entries(selected).every(([k,v])=>!v||String(p[k]||'').trim()===v));const choose=$('x320Paper');if(!choose)return;const previous=choose.value;choose.length=1;options.forEach(p=>choose.add(new Option([p.exam_name,p.class_name,p.section,p.subject_name,p.exam_date].filter(Boolean).join(' • '),p.paper_id)));if(options.some(p=>String(p.paper_id)===previous))choose.value=previous;else {version++;data=null;clearTimeout(autoTimer);$('x320Body')?.replaceChildren();choose.value=options.length===1?String(options[0].paper_id):'';if(choose.value&&!pending){load();return;}}message(options.length+' authorized papers available');}
 applyFilter();
}
async function center(entry=false){const focused=entry===true;if($('x320Center')&&data&&window.__v90Route===(focused?'exam_marks_entry_470':'central_exam'))return load();if(blocked())return window.toast?.('Save or explicitly discard current edits first');if(window.LDM_ROOT?.canNavigate()===false||window.LDM_REMINDERS?.canNavigate()===false)return;version++;data=null;page=1;window.__v90Route=focused?'exam_marks_entry_470':'central_exam';window.v90InstallShell?.(window.__v90Route);window.head?.(focused?'Exam Marks Entry / परीक्षा अंक प्रविष्टि':'Central Exam Attendance / Marks','Timetable → Paper attendance → Draft marks → Publish');$('erpContent').innerHTML=`<section class="panel" id="x320Center"><h2>${focused?'Exam Marks Entry / परीक्षा अंक प्रविष्टि':'Central Exam Attendance / Marks'}</h2><p>हर पेपर की अलग उपस्थिति। Absent = AB; खाली अंक = Pending. Saved drafts दोबारा खुलेंगे।</p><div class="x500PaperFilters"><label>Exam<select id="x500Exam"><option value="">All exams</option></select></label><label>Class<select id="x500Class"><option value="">All classes</option></select></label><label>Subject<select id="x500Subject"><option value="">All subjects</option></select></label></div><div class="tools"><select id="x320Paper"><option value="">Select timetable paper</option></select><button id="x320Load">Load / Resume</button><button id="x320Timetable">Exam timetable / Room & Seating Plan</button><button id="x320OriginalExam">पूर्व परीक्षा विकल्प</button><button id="x320LegacyExam">Existing Exam / Admit Monitor</button><button id="x320LegacyMarks">Existing Marks Progress</button></div><p id="x320Status" role="status" aria-live="polite">Loading permitted papers…</p><div id="x320RetryHost"></div><div id="x320Body"></div></section>`;
 if(focused){
  $('x320Center').dataset.marksEntry='true';
  $('x320Timetable').textContent='＋ समय-सारणी में परीक्षा पेपर जोड़ें';
  for(const id of ['x320LegacyExam','x320LegacyMarks'])$(id).hidden=true;
  $('x320OriginalExam').textContent='उपस्थिति और परीक्षा केंद्र';
 }
 $('x320OriginalExam').onclick=()=>window.render(focused?'central_exam':'exam_automation');$('x320Load').onclick=load;$('x320Paper').onchange=()=>{if(busy||pending||edits.size||markEdits.size){if(data)$('x320Paper').value=data.paper.paper_id;message('Save or discard edits before changing paper');return}load()};$('x320Timetable').onclick=()=>window.render('exam_automation');$('x320LegacyExam').onclick=()=>{if(!blocked()){version++;original.call(window,'v90_exam_monitor')}};$('x320LegacyMarks').onclick=()=>{if(!blocked()){version++;original.call(window,'v90_marks_monitor')}};
 try{pending=JSON.parse(sessionStorage.getItem(key())||'null');if(pending&&(pending.owner!==actor()?.id||pending.session&&pending.session!==sess()))pending=null}catch(_){pending=null}const mine=version,who=actor()?.id,session=sess(),host=$('x320Center');
 try{let papers=await rpc(String(actor()?.role||'').toLowerCase()==='teacher'?'ldm_teacher_list471':'ldm_v320_exam_list',{p_session:sess()});if(mine!==version||who!==actor()?.id||session!==sess()||host!==$('x320Center')||!$('x320Paper'))return;installPaperFilters(papers||[]);message(papers.length?'Paper चुनें।':'इस सत्र में अधिकृत परीक्षा पेपर नहीं मिला। Admin परीक्षा टाइमटेबल और शिक्षक की घंटी जाँचें।');if(pending){$('x320Paper').value=pending.args.p_paper;showRecovery();lock()}}catch(e){if(mine===version&&who===actor()?.id&&session===sess()&&host===$('x320Center'))message('Exam unavailable: '+e.message)}
}
async function load(){
 if(blocked())return message('Save or discard edits first');
 const id=$('x320Paper').value;clearTimeout(autoTimer);
 if(!id){version++;data=null;$('x320Body')?.replaceChildren();return message('Select timetable paper')}
 const previous=data,mine=++version,who=actor()?.id,session=sess(),host=$('x320Center');
 const current=()=>mine===version&&who===actor()?.id&&session===sess()&&host===$('x320Center');
 const place=capturePlace();busy=true;host?.setAttribute('aria-busy','true');lock();message('Loading saved paper…');
 try{
  const result=await rpc(String(actor()?.role||'').toLowerCase()==='teacher'?'ldm_teacher_load471':'ldm_v320_exam_load',{p_paper:id});
  if(!current())return;
  if(String(result?.paper?.paper_id)!==String(id))throw Error('Loaded paper identity mismatch');
  if(!Array.isArray(result.rows)||!result.rows.length)throw Error('No students in authorized roster; check teacher bells and class/section assignment');
  if(previous&&String(previous.paper.paper_id)===String(id)){Object.assign(previous,result);data=previous}else data=result;markEdits.clear();recoverScores();
  if(previous&&String(previous.paper.paper_id)===String(id)&&$('x320Summary')){syncSavedRows('attendance');const max=$('x320Max');if(max)max.value=String(data.max_marks);}
  else{page=1;paint()}
  restorePlace(place);message(markEdits.size?'स्थानीय ड्राफ्ट मिला। जाँचकर Save करें।':'Loaded saved progress');
 }catch(e){if(!current())return;data=previous;if(previous)$('x320Paper').value=previous.paper.paper_id;message('Paper refresh failed; previous display retained: '+e.message)}
 finally{if(current()){busy=false;host?.removeAttribute('aria-busy');lock()}}
}
function paint(preservePlace=false){if(!data||!$('x320Body'))return;clearTimeout(autoTimer);
 const previous=preservePlace?{y:window.scrollY,active:document.activeElement?.matches?.('#x320Rows [data-mark]')?document.activeElement.dataset.mark:null,scroll:document.querySelector('#x320Rows .x393ExamScroll')?.scrollTop||0}:null;const oldFilter=$('x320Filter')?.value||'all',oldSearch=$('x320Search')?.value||'',oldReason=$('x320Reason')?.value||'';const rows=data.rows,ab=rows.filter(r=>r.attendance==='Absent').length,saved=rows.filter(r=>r.marks!==null).length,unknown=rows.filter(r=>r.attendance==='Not Marked').length;$('x320Body').innerHTML=`<h3>${E(data.paper.class_name)} • ${E(data.paper.subject_name)} • ${E(data.paper.exam_date)}</h3><p id="x320Summary">Total ${rows.length} • Saved marks ${saved} • AB ${ab} • Pending ${rows.length-saved-ab} • Attendance unmarked ${unknown}</p><p id="x320Published">${data.published_at?'Published: '+E(data.published_at):'अंक सेव होने पर केंद्रीय परिणाम अपडेट होता है। पूरे पेपर का प्रकाशन अलग है।'}</p><div class="tools"><label>Maximum marks<input id="x320Max" type="number" min="1" max="1000" value="${data.max_marks||100}" ${['admin','super_admin','principal'].includes(String(actor()?.role||'').toLowerCase())?'':'disabled'}></label>${['admin','super_admin','principal'].includes(String(actor()?.role||'').toLowerCase())?'<button id="x320Setup" type="button">'+(data.max_marks?'Update Maximum':'Set Maximum / Start')+'</button>':''}<label>Correction / publication reason<input id="x320Reason" placeholder="Required when correcting existing records"></label></div><div class="tools"><input id="x320Search" placeholder="Name / Father / Roll / Admission"><select id="x320Filter"><option value="all">All students</option><option value="pending">Pending marks / attendance</option><option value="absent">Absent (AB)</option><option value="saved">Saved marks</option></select><button id="x500SaveAll" type="button" class="primary">✓ Save All Changes</button><button id="x320SaveAttendance">Save Attendance</button><button id="x320SaveMarks">Save Marks</button><label><input id="x320AutoMarks" type="checkbox" ${autoMarks?'checked':''}> Marks auto-save</label><button id="x320Discard">Discard Unsaved Edits / Reload</button><button id="x320Publish">Publish Completed Paper</button></div><p>Attendance और marks पहले स्क्रीन पर बदलते हैं। कई छात्रों की entry करके Save Changed Attendance / Save Changed Marks दबाएँ और server confirmation देखें। वैकल्पिक Marks auto-save चालू करने पर हर marks change सेव होगा। Select Pending से बचा हुआ काम खोलें।</p><div id="x320Rows"></div>`;
 $('x320Filter').value=oldFilter;$('x320Search').value=oldSearch;$('x320Reason').value=oldReason;if($('x320Setup'))$('x320Setup').onclick=()=>{
  const next=Number($('x320Max')?.value),maxSaved=Math.max(0,...data.rows.map(r=>r.marks==null?0:Number(r.marks)||0));
  if(!Number.isInteger(next)||next<1||next>1000)return message('Maximum marks 1 से 1000 के बीच पूरा अंक भरें।');
  if(next<maxSaved)return message('Saved student marks '+maxSaved+' हैं। Maximum इससे कम नहीं कर सकते।');
  if(next===Number(data.max_marks))return message('Maximum marks में कोई बदलाव नहीं है।');
  if(edits.size||markEdits.size||pending||busy)return message('पहले बाकी Attendance/Marks Save करें, फिर Maximum बदलें।');
  // The server is authoritative: an installed V320 engine must explicitly allow this update.
  return save('setup');
 };$('x320Search').oninput=()=>{page=1;paintRows()};$('x320Filter').onchange=()=>{page=1;paintRows()};$('x320SaveAttendance').onclick=()=>{if(edits.size)saveAttendance();else message('No changed attendance')};$('x320SaveMarks').onclick=saveMarks;$('x500SaveAll').onclick=async()=>{if(busy||pending)return;if(edits.size)await saveAttendance();if(!busy&&!pending&&markEdits.size)await saveMarks();if(!edits.size&&!markEdits.size&&!pending)message('✓ All changed entries confirmed by server');};$('x320AutoMarks').onchange=()=>{autoMarks=$('x320AutoMarks').checked;if(autoMarks&&markEdits.size)saveMarks()};$('x320Discard').onclick=()=>{if(!window.confirm('Unsaved changes हटाएँ? Server पर सुरक्षित नंबर नहीं हटेंगे।'))return;clearTimeout(autoTimer);edits.clear();markEdits.clear();keepScores();load()};$('x320Publish').onclick=()=>{if(edits.size||markEdits.size)return message('Save attendance and marks edits first');save('publish')};if(typeof window.examDates475==='function'){try{window.examDates475($('x320Body'),data,actor()?.role!=='teacher',rpc,load,message,()=>!blocked())}catch(e){console.error('Exam date panel:',e);message('Exam date panel unavailable: '+e.message)}}paintRows();lock();
 if(previous)requestAnimationFrame(()=>{
   if(!$('x320Center')||!data)return;
   const scrollBox=document.querySelector('#x320Rows .x393ExamScroll');if(scrollBox)scrollBox.scrollTop=previous.scroll;
   if(previous.active){const active=[...document.querySelectorAll('#x320Rows [data-mark]')].find(x=>x.dataset.mark===previous.active);active?.focus({preventScroll:true});}
   window.scrollTo({top:previous.y,behavior:'instant'});
 });
}
function capturePlace(){
 const active=document.activeElement;
 return {host:$('x320Center'),version,y:window.scrollY,x:window.scrollX,
  active:active?.closest?.('#x320Center')?{id:active.id,mark:active.dataset.mark,att:active.dataset.att}:null,
  scroll:[...document.querySelectorAll('#erpContent,#x320Body,#x320Rows .x393ExamScroll')].map(el=>({el,top:el.scrollTop,left:el.scrollLeft}))};
}
function restorePlace(place){requestAnimationFrame(()=>{
 if(place.host!==$('x320Center')||place.version!==version)return;
 const a=place.active;const target=a?.id?$(a.id):a?.mark?[...document.querySelectorAll('#x320Rows [data-mark]')].find(el=>el.dataset.mark===a.mark):a?.att?[...document.querySelectorAll('#x320Rows [data-att]')].find(el=>el.dataset.att===a.att):null;
 target?.focus({preventScroll:true});
 for(const s of place.scroll)if(s.el.isConnected){s.el.scrollTop=s.top;s.el.scrollLeft=s.left;}
 window.scrollTo({left:place.x,top:place.y,behavior:'instant'});
});}
function syncSavedRows(action){
 const rows=data.rows,ab=rows.filter(r=>r.attendance==='Absent').length,saved=rows.filter(r=>r.marks!=null).length;
 $('x320Summary').textContent=`Total ${rows.length} • Saved marks ${saved} • AB ${ab} • Pending ${rows.length-saved-ab} • Attendance unmarked ${rows.filter(r=>r.attendance==='Not Marked').length}`;
 $('x320Published').textContent=data.published_at?'Published: '+data.published_at:'अंक सेव होने पर केंद्रीय परिणाम अपडेट होता है। पूरे पेपर का प्रकाशन अलग है।';
 const byId=new Map(rows.map(row=>[String(row.student_id),row]));
 for(const select of document.querySelectorAll('#x320Rows [data-att]')){
  const row=byId.get(select.dataset.att);if(!row)continue;
  select.value=edits.get(row.student_id)||row.attendance;
  const tr=select.closest('tr'),cell=tr.querySelector('[data-mark-cell]'),input=cell.querySelector('[data-mark]');
  tr.querySelectorAll('[data-p],[data-a]').forEach(b=>b.classList.toggle('selected',select.value===(b.hasAttribute('data-p')?'Present':'Absent')));
  if(input&&select.value!=='Absent'){
   input.value=markEdits.has(row.student_id)?markEdits.get(row.student_id):row.marks==null?'':String(row.marks);
   input.max=String(data.max_marks);input.dataset.originalDisabled=select.value==='Present'&&data.max_marks?'0':'1';
  }else{cell.innerHTML=markCell(row);bindMark(cell.querySelector('[data-mark]'));}
 }
 if(action==='attendance'){
  const picker=$('x320DatePanel')?.querySelector('select');
  if(picker){const selected=picker.value;picker.replaceChildren(new Option('विकल्प चुनें',''));
   if(actor()?.role!=='teacher')picker.add(new Option('पूरी कक्षा का पेपर स्थगित','paper'));
   for(const row of rows)if(row.attendance!=='Present'&&row.marks==null)picker.add(new Option([row.student_name,row.father_name,row.admission_no].filter(Boolean).join(' • '),row.student_id));
   picker.value=[...picker.options].some(o=>o.value===selected)?selected:'';
  }
 }
 // Keep visible students in place after save, including a Pending filter.
 // The next explicit search/filter change reevaluates membership from saved data.
}
function scheduleAutoSave(){clearTimeout(autoTimer);autoTimer=setTimeout(()=>{if(!busy&&!pending&&data){if(edits.size)saveAttendance();else if(markEdits.size)saveMarks()}},2600)}
 function saveAttendance(){if(busy||pending||!data||!edits.size)return;const changed=[...edits].map(([student_id,attendance])=>({student_id,attendance,revision:data.rows.find(r=>r.student_id===student_id)?.revision}));return save('attendance',changed)}
 function saveMarks(){if(busy||pending)return;if(edits.size)return message('पहले Save Changed Attendance करें; typed marks स्क्रीन पर सुरक्षित हैं।');if(!markEdits.size)return message('No changed marks');const changed=[];for(const [student_id,value]of markEdits){const row=data.rows.find(r=>r.student_id===student_id),marks=Number(value);if(value===''||!row||row.attendance!=='Present'||!Number.isFinite(marks)||marks<0||marks>Number(data.max_marks))return message('Present छात्र के लिए 0 से maximum तक सही marks भरें।');changed.push({student_id,revision:row.revision,marks:value})}return save('marks',changed)}
const scoreKey=()=>['ldm461_marks',actor()?.id,sess(),data?.paper?.paper_id].join('|');
function keepScores(){
 if(!data)return;
 try{const entries=Array.from(markEdits,([id,value])=>({id,value,revision:data.rows.find(r=>r.student_id===id)?.revision}));
 if(entries.length)sessionStorage.setItem(scoreKey(),JSON.stringify(entries));else sessionStorage.removeItem(scoreKey());}
 catch{message('स्थानीय ड्राफ्ट उपलब्ध नहीं। पेज छोड़ने से पहले Save करें।')}
}
function recoverScores(){
 if(!data)return;try{const entries=JSON.parse(sessionStorage.getItem(scoreKey())||'[]');
 let conflicts=0;for(const e of entries){const row=data.rows.find(r=>r.student_id===e.id);if(!row||e.value==='')continue;if(row.revision!==e.revision){conflicts++;continue}if(row.attendance==='Present'&&(row.marks===null||Number(row.marks)!==Number(e.value)))markEdits.set(e.id,e.value);}if(conflicts)message(conflicts+' local drafts have changed server revisions; retained in browser storage, not overwritten.');
 }catch{}
}
function bindMark(el){if(!el)return;
 el.oninput=()=>{if(busy||pending)return;const row=data.rows.find(r=>r.student_id===el.dataset.mark);if(!row)return;if(el.value===''||row.marks!==null&&Number(el.value)===Number(row.marks))markEdits.delete(row.student_id);else markEdits.set(row.student_id,el.value);keepScores();if(autoMarks&&el.value!==''&&el.validity.valid)scheduleAutoSave()};

 el.onkeydown=e=>{
  if(e.key!=='Enter'||e.isComposing||busy||pending)return;
  e.preventDefault();
  if(!el.reportValidity())return;
  const inputs=Array.from($('x320Rows').querySelectorAll('[data-mark]:enabled'));
  const next=inputs[inputs.indexOf(el)+1];
  if(next){next.focus();next.select()}else{el.blur();$('x320SaveMarks')?.focus()}
 };
el.onchange=()=>{if(busy||pending)return;const row=data.rows.find(r=>r.student_id===el.dataset.mark);if(!row)return;if(el.value===''){markEdits.delete(row.student_id);keepScores();if(row.marks!=null)el.value=String(row.marks);return message('Saved score retained. Server-side clear is not available in this build.')}if(row.marks!==null&&Number(el.value)===Number(row.marks))markEdits.delete(row.student_id);else markEdits.set(row.student_id,el.value);message(markEdits.size+' marks बदलाव अभी सेव नहीं हैं • Save Changed Marks दबाएँ।');if(autoMarks)scheduleAutoSave()}}
function markCell(row){const attendance=edits.get(row.student_id)||row.attendance;return attendance==='Absent'?'<b>AB</b>':`<input aria-label="Marks ${E(row.student_name)}" data-mark="${E(row.student_id)}" enterkeyhint="next" inputmode="decimal" type="number" min="0" max="${data.max_marks||100}" step="0.01" value="${E(markEdits.has(row.student_id)?markEdits.get(row.student_id):row.marks===null?'':row.marks)}" ${attendance!=='Present'||!data.max_marks?'disabled':''} placeholder="Pending">`}
function paintRows(){const q=$('x320Search').value.toLowerCase(),filter=$('x320Filter').value,rows=data.rows.filter(r=>[r.student_name,r.father_name,r.roll_no,r.admission_no].some(v=>String(v||'').toLowerCase().includes(q))).filter(r=>{const att=edits.get(r.student_id)||r.attendance;return filter==='all'||filter==='absent'&&att==='Absent'||filter==='saved'&&r.marks!==null||filter==='pending'&&(att==='Not Marked'||att==='Present'&&r.marks===null)}).sort((a,b)=>String(a[sortField]??'').localeCompare(String(b[sortField]??''),'hi',{numeric:true})*direction);const fields=['roll_no','student_name','father_name','admission_no'];$('x320Rows').innerHTML=`<div class="tableWrap x393ExamScroll"><table><thead><tr>${fields.map(f=>`<th><button data-sort="${f}">${E(f)} ↕</button></th>`).join('')}<th>Paper Attendance</th><th>Marks / AB</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${E(r.roll_no)}</td><td><strong>${E(r.student_name)}</strong><small class="x500NameDetails">Father: ${E(r.father_name)} · Roll: ${E(r.roll_no)} · Adm: ${E(r.admission_no)}</small></td><td>${E(r.father_name)}</td><td>${E(r.admission_no)}</td><td><div class="x500Attendance"><button type="button" data-p="${E(r.student_id)}" data-current="${E(edits.get(r.student_id)||r.attendance)}" class="${(edits.get(r.student_id)||r.attendance)==='Present'?'selected':''}">Present</button><button type="button" data-a="${E(r.student_id)}" class="${(edits.get(r.student_id)||r.attendance)==='Absent'?'selected':''}">Absent</button></div><select data-att="${E(r.student_id)}" ${!data.max_marks?'disabled':''}>${['Not Marked','Present','Absent'].map(s=>`<option ${s==='Not Marked'?'disabled':''} ${(edits.get(r.student_id)||r.attendance)===s?'selected':''}>${s}</option>`).join('')}</select></td><td data-mark-cell>${markCell(r)}</td></tr>`).join('')}</tbody></table></div><p>${rows.length} विद्यार्थी • सभी नीचे scroll करें • बिना Save के बदलाव server पर दर्ज नहीं हैं।</p>`;
 document.querySelectorAll('#x320Rows [data-sort]').forEach(b=>b.onclick=()=>{direction=sortField===b.dataset.sort?-direction:1;sortField=b.dataset.sort;paintRows()});
 document.querySelectorAll('#x320Rows [data-att]').forEach(el=>el.onchange=()=>{if(busy||pending)return;const row=data.rows.find(r=>r.student_id===el.dataset.att);if(markEdits.has(row.student_id)){el.value=edits.get(row.student_id)||row.attendance;return message('इस छात्र के typed marks पहले Save करें या Discard करें।')}if(el.value===row.attendance)edits.delete(row.student_id);else edits.set(row.student_id,el.value);const cell=el.closest('tr').querySelector('[data-mark-cell]');cell.innerHTML=markCell(row);bindMark(cell.querySelector('[data-mark]'));message(edits.size+' attendance बदलाव सेव होने बाकी हैं।');if(autoMarks)scheduleAutoSave()});
 document.querySelectorAll('#x320Rows [data-p],#x320Rows [data-a]').forEach(btn=>btn.onclick=()=>{const sel=btn.closest('tr')?.querySelector('[data-att]');if(!sel||sel.disabled)return;sel.value=btn.hasAttribute('data-p')?'Present':'Absent';sel.dispatchEvent(new Event('change',{bubbles:true}));if(sel.value=== (btn.hasAttribute('data-p')?'Present':'Absent')){const controls=btn.parentElement;controls.querySelectorAll('button').forEach(b=>b.classList.toggle('selected',b===btn));}});
 document.querySelectorAll('#x320Rows [data-mark]').forEach(bindMark);lock()}

function install(){const role=String(actor()?.role||'').toLowerCase();if(!['admin','super_admin','principal','teacher'].includes(role))return;const nav=$('erpNav');if(nav&&!$('x320Nav')){const b=document.createElement('button');b.id='x320Nav';b.textContent='📝 Central Exam Attendance / Marks';b.onclick=center;nav.append(b)}}
const original=window.render;window.render=async function(route,...args){if(blocked())return window.toast?.('Save/retry or discard exam edits first');if(route==='exam_marks_entry_470'){if(!['teacher','admin','principal','super_admin'].includes(String(actor()?.role||'').toLowerCase()))return;return center(true)}if(String(actor()?.role||'').toLowerCase()==='teacher'&&['teacher_marks_464','exams','v65_smart_marks'].includes(route))return center(true);if(route==='teacher_marks_464')return center();if(window.ldmDelegatedRouteActive?.(route)&&['v90_exam_monitor','v90_marks_monitor'].includes(route))return original.call(this,route,...args);if(['central_exam','v65_smart_marks','v90_exam_monitor','v90_marks_monitor'].includes(route))return center();version++;const r=await original.call(this,route,...args);install();return r};try{render=window.render}catch(_){};window.addEventListener('beforeunload',e=>{if(blocked()){e.preventDefault();e.returnValue=''}});function applyQr(result){syncScope();if(blocked()||result.session!==sess()||!data||data.paper.paper_id!==result.paper_id||result.exam!=='Present'||!Number.isInteger(result.exam_paper_revision)||!Number.isInteger(result.exam_row_revision))return false;if(result.exam_paper_revision<data.revision)return true;const row=data.rows.find(r=>r.student_id===result.student?.id);if(!row)return false;row.attendance='Present';row.marks=result.exam_marks==null?null:Number(result.exam_marks);row.revision=result.exam_row_revision;data.revision=result.exam_paper_revision;data.published_at=result.exam_published_at;const select=[...document.querySelectorAll('#x320Rows [data-att]')].find(n=>n.dataset.att===row.student_id);if(select){select.value='Present';const cell=select.closest('tr').querySelector('[data-mark-cell]');if(cell){cell.innerHTML=markCell(row);bindMark(cell.querySelector('[data-mark]'))}}message('QR confirmed • Daily + Exam Present • existing marks preserved');return true}
window.LDM_EXAM={center,install,applyQr,canNavigate:()=>!blocked()};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
