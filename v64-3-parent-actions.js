/* V64.3: child-scoped parent actions, preserved V114 dashboard design. */
(()=>{'use strict';
const $=id=>document.getElementById(id), E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const actions=[['profile','👤','Student Profile'],['attendance','✅','Attendance'],['fees','₹','Fee Details'],['results','🏆','Exam Results'],['admit','🎫','Admit Card'],['notices','📢','Notices / Orders'],['learning','📚','Homework / Worksheets'],['gallery','🖼','Gallery'],['timetable','🕐','Timetable'],['leave','🗓','Apply Leave'],['correction','✏','Data Correction'],['transport','🚐','Transport'],['gate','🚪','Gate Pass'],['idcard','🪪','ID Card'],['help','💬','Help / Complaint']];
let token=0,selected=null,loading=null;const cash=n=>'₹'+Number(n||0).toLocaleString('en-IN');
const schoolDay=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const btn=(key,label)=>`<button type="button" data-parent-action="${key}">${E(label)}</button>`;
const empty=t=>`<p class="empty">${E(t||'अभी कोई जानकारी उपलब्ध नहीं है।')}</p>`;
const rowsTable=(rows,cols)=>!rows?.length?empty():`<div class="v643Table"><table><thead><tr>${cols.map(x=>`<th>${E(x[1])}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${cols.map(x=>`<td>${E(r[x[0]]??'—')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
function validUrl(v){try{let u=new URL(v,location.href);return ['https:','http:'].includes(u.protocol)?u.href:''}catch(_){return ''}}
function resource(v,label){const href=validUrl(v);return href?`<a href="${E(href)}" target="_blank" rel="noopener noreferrer">${E(label||'Open attachment')}</a>`:''}
function getStudent(card){return (window.v643ParentRows||[]).find(s=>String(s.admission_no||s.student_id||s.id)===String(card?.dataset.admissionNo||card?.dataset.studentId))}
function message(el,text,error=false){if(el){el.className=error?'v643Error':'v643Status';el.textContent=text}}
async function rpc(name,args){const r=await sb.rpc(name,args);if(r.error)throw new Error(r.error.message||'जानकारी नहीं खुली। फिर प्रयास करें।');return r.data}
function data(kind,s){return rpc('v643_parent_data',{p_admission_no:s.admission_no,p_kind:kind})}
function back(){++token;$('v643ParentPanel')?.remove();$('parentDashboardBody')?.classList.remove('v643InPanel');selected=null;const dash=$('parentDashboard');if(dash)dash.scrollTop=0}
function panel(s,key){back();selected=s;const p=document.createElement('section');p.id='v643ParentPanel';p.className='v643Panel';p.dataset.admissionNo=s.admission_no;
 p.innerHTML=`<div class="v643PanelHead"><button type="button" data-parent-back>← Back</button><div><h2>${E(actions.find(x=>x[0]===key)?.[2]||key)}</h2><p>${E(s.student_name)} • Class ${E(s.class_name)} • ${E(s.admission_no)}</p></div></div><div id="v643PanelBody" aria-live="polite">Loading…</div>`;
 $('parentDashboardBody').append(p);$('parentDashboardBody').classList.add('v643InPanel');p.querySelector('[data-parent-back]').onclick=back;$('parentDashboard').scrollTop=0;return p.querySelector('#v643PanelBody')}
function paintForm(box,s,kind,history){const leave=kind==='leave';box.innerHTML=`<form id="v643RequestForm" class="v643Form"><input type="hidden" name="admission_no" value="${E(s.admission_no)}">${leave?`<label>From Date<input name="from" type="date" value="${schoolDay()}" required></label><label>To Date<input name="to" type="date" value="${schoolDay()}" required></label><label>Leave Type<select name="type"><option>Sick</option><option>Family</option><option>Emergency</option><option>Medical</option><option>Other</option></select></label>`:kind==='correction'?`<label>Field<select name="field"><option value="phone">Mobile</option><option value="address">Address</option><option value="student_name">Student Name</option><option value="father_name">Father Name</option><option value="mother_name">Mother Name</option><option value="dob">Date of Birth</option><option value="guardian_name">Guardian Name</option><option value="emergency_phone">Emergency Mobile</option><option value="roll_no">Roll No.</option></select></label><label>Correct Value<input name="value" required maxlength="500"></label>`:`<label>Category<select name="category">${['Parent Complaint','Academic','Fee','Transport','Safety','Discipline','Other'].map(v=>`<option>${v}</option>`).join('')}</select></label><label>Subject<input name="subject" required maxlength="200"></label>`}<label class="v643Full">${leave?'Leave Reason':kind==='correction'?'Reason for Correction':'Message'}<textarea name="reason" required maxlength="2000" rows="4"></textarea></label><button type="submit" class="primary">${leave?'Submit Leave Request':kind==='correction'?'Send for Admin Approval':'Send to Admin'}</button><p class="v643Full" id="v643FormStatus" role="status"></p></form><h3>Request History</h3><div id="v643History">${history}</div>`;
 const form=box.querySelector('form');if(kind==='correction')form.elements.field.onchange=()=>{form.elements.value.type=form.elements.field.value==='dob'?'date':'text'};
 form.onsubmit=async ev=>{ev.preventDefault();const b=form.querySelector('[type=submit]'),msg=form.querySelector('#v643FormStatus');if(b.disabled)return;
 const f=Object.fromEntries(new FormData(form));f.reason=f.reason.trim();if(!f.reason)return message(msg,'कारण / message लिखें।',true);
 if(leave&&(!f.from||!f.to||f.to<f.from||(Date.parse(f.to)-Date.parse(f.from))/86400000>60))return message(msg,'सही तारीख चुनें; छुट्टी अधिकतम 60 दिन की हो सकती है।',true);
 if(kind==='correction'&&!f.value.trim())return message(msg,'सही value लिखें।',true);
 b.disabled=true;message(msg,'Saving…');try{if(leave)await rpc('v643_parent_request',{p_admission_no:s.admission_no,p_kind:'leave',p_payload:{from:f.from,to:f.to,type:f.type,reason:f.reason}});else if(kind==='correction')await rpc('v643_parent_request',{p_admission_no:s.admission_no,p_kind:'correction',p_payload:{field:f.field,value:f.value.trim(),reason:f.reason}});else await rpc('v643_parent_request',{p_admission_no:s.admission_no,p_kind:'help',p_payload:{category:f.category,subject:f.subject.trim(),reason:f.reason}});
 message(msg,'✓ Request भेज दी गई है। Admin की समीक्षा बाकी है।');form.reset();b.textContent='Submitted';
 try{const fresh=await data(kind,s);const target=box.querySelector('#v643History');if(target)target.innerHTML=historyHtml(kind,fresh.rows||[])}catch(_){/* saved request remains acknowledged; refresh is optional */}
 }catch(e){message(msg,e.message,true);b.disabled=false}}}
function historyHtml(kind,rows){return rowsTable(rows,kind==='leave'?[['from_date','From'],['to_date','To'],['reason','Reason'],['status','Status'],['reviewer_note','Admin Note']]:kind==='correction'?[['created_at','Date'],['reason','Reason'],['status','Status'],['reviewer_note','Admin Note']]:[['created_at','Date'],['subject','Subject'],['status','Status']])}
async function open(key,s){if(!s?.admission_no)return window.toast?.('Student admission link उपलब्ध नहीं है। Admin से जाँच कराएँ।');const box=panel(s,key),mine=++token;const show=html=>{if(mine===token&&box.isConnected)box.innerHTML=html};
 try{
 if(['leave','correction','help'].includes(key)){paintForm(box,s,key,'Loading…');try{const d=await data(key,s);if(mine===token)box.querySelector('#v643History').innerHTML=historyHtml(key,d.rows||[])}catch(e){if(mine===token)message(box.querySelector('#v643History'),e.message,true)}return}
 if(key==='results'){
  const d=await rpc('v67_parent_result_list',{p_admission_no:s.admission_no});
  show((Array.isArray(d)?d:[]).map((r,i)=>`<article class="v643Item"><h3>${E(r.exam_name)}</h3><p>${E(r.message||'')}</p>${r.can_view?`<button type="button" data-exam-index="${i}">Preview Marksheet</button>`:'<strong>🔒 Admin / Fee clearance required</strong>'}</article>`).join('')||empty('कोई result अभी प्रकाशित नहीं है।'));
  box.querySelectorAll('[data-exam-index]').forEach(b=>b.onclick=async()=>{
    const r=d[Number(b.dataset.examIndex)];if(!r?.can_view)return;
    b.disabled=true;
    try{
      const m=await rpc('v67_parent_published_marksheet',{p_admission_no:s.admission_no,p_exam_name:r.exam_name});
      if(mine!==token)return;
      const student=m?.student||s,exam=m?.exam_name||r.exam_name;
      if(String(student.admission_no)!==String(s.admission_no)||String(exam)!==String(r.exam_name))throw Error('Result belongs to a different student or exam. Admin must check the published record.');
      // Only the authorized result RPC supplies marks. Never fetch another student's marks or invent values.
      const publishedRows=Array.isArray(m?.marks)?m.marks:[];
      const marks=publishedRows.map(row=>({
        ...row,
        subject_name:row.subject_name??row.subject,
        max_marks:row.max_marks??row.maximum_marks,
        obtained_marks:row.obtained_marks??row.marks,
        exam_name:row.exam_name||exam,
        admission_no:row.admission_no||s.admission_no
      })).filter(row=>String(row.subject_name||'').trim());
      if(!marks.length){
        show('<p class="v643Error" role="alert">Result publish है, लेकिन Parent Result RPC से विषयवार अंक नहीं मिले। Admin को Central Exam marks और v67_parent_published_marksheet की जाँच करनी होगी। गलत/खाली मार्कशीट नहीं दिखाई गई है।</p>');
        return;
      }
      if(!marks.some(row=>row.obtained_marks!==null&&row.obtained_marks!==undefined&&String(row.obtained_marks).trim()!=='')){
        show('<p class="v643Error" role="alert">Result published है, लेकिन सर्वर ने विषयों के प्राप्त अंक नहीं लौटाए। गलत कुल/प्रतिशत नहीं बनाए गए हैं। Admin को result RPC और Central Exam Sync की जाँच करनी होगी।</p>');
        return;
      }
      if(marks.some(row=>String(row.admission_no)!==String(s.admission_no)||String(row.exam_name)!==String(exam))){
        throw Error('Published marks contain a different student or exam. Contact Admin.');
      }
      if(!window.LDM_MARKSHEET?.render)throw Error('Shared marksheet template missing; upload the full V533 changed files.');
      const format=(window.LDM_MARKSHEET.formats?.[m?.format]?m.format:null)||window.LDM_MARKSHEET.getDefault?.()||(typeof getDocFormat==='function'?getDocFormat('marksheet'):1);
      const allowedResult=['PASS','FAIL','NEEDS IMPROVEMENT','PROMOTED','NOT PROMOTED'].includes(String(m?.result||'').toUpperCase())?String(m.result).toUpperCase():null;
      const options={...(window.LDM_DOCUMENTS_V345?.previewOptions?.(student,exam)||{}),...(m?.rules&&typeof m.rules==='object'?{rules:m.rules}:{}),parentPublished:true,parentResult:allowedResult||'PUBLISHED RESULT'};
      show(`<div class="v534ReadTools" data-no-print role="toolbar" aria-label="Marksheet reading controls"><button type="button" data-v534-zoom="read" aria-pressed="true">🔎 साफ़ पढ़ें</button><button type="button" data-v534-zoom="fit" aria-pressed="false">पूरा पेज</button><button type="button" data-v534-zoom="out" aria-label="Zoom out">−</button><b data-m534-scale aria-live="polite">125%</b><button type="button" data-v534-zoom="in" aria-label="Zoom in">+</button></div><p class="v534ReadHint" data-no-print>मार्कशीट पढ़ने के लिए बाएँ-दाएँ खिसकाएँ। पूरा पेज देखने के लिए “पूरा पेज” दबाएँ। प्रिंट/PDF में A4 आकार ही रहेगा।</p><div id="v643ResultPreview" class="v643Document" data-m534-zoom-mode="read" data-m534-read-zoom="1.25">${window.LDM_MARKSHEET.render(student,marks,exam,format,options)}</div><button type="button" id="v643Print">Print / Save PDF</button>`);
      window.LDM_MARKSHEET_VIEW444?.prepare?.();
      box.querySelectorAll('[data-v534-zoom]').forEach(button=>button.onclick=()=>window.LDM_MARKSHEET_VIEW444?.setParentZoom?.(box.querySelector('#v643ResultPreview'),button.dataset.v534Zoom));
      box.querySelector('#v643Print').onclick=()=>{
        const root=box.querySelector('#v643ResultPreview');
        if(window.LDM_A4_V337?.preview)return window.LDM_A4_V337.preview(root,'Published Student Marksheet',{orientation:'portrait'});
        message(box,'A4 preview module unavailable. Upload a4-print-v337.js with the project.',true);
      };
    }catch(e){if(mine===token)message(box,e.message,true);}
    finally{if(b.isConnected)b.disabled=false;}
  });return;
 }
 if(key==='admit'){const d=await rpc('v75_parent_admit_cards',{}),all=Array.isArray(d)?d:d?.cards||[],rows=all.filter(x=>String(x.student?.admission_no)===String(s.admission_no));show(rows.map((x,i)=>`<article class="v643Item"><h3>${E(x.exam?.exam_name||'Exam')}</h3>${x.student?.is_withheld?`<p>🔒 ${E(x.student.hold_reason||'Admin hold')}</p>`:`<button data-admit-index="${i}">Preview Admit Card</button>`}</article>`).join('')||empty('Admit Card अभी प्रकाशित नहीं है।'));box.querySelectorAll('[data-admit-index]').forEach(b=>b.onclick=()=>{const x=rows[Number(b.dataset.admitIndex)];show(`<div id="v643AdmitPreview" class="v643Document">${v75ParentAdmitHtml(x)}</div><button id="v643Print">Print / Save PDF</button>`);box.querySelector('#v643Print').onclick=()=>v14Print('v643AdmitPreview')});return}
 if(key==='idcard'){const student=await rpc('v65_parent_official_card',{p_admission_no:s.admission_no});const r=student?.student||student;if(r?.photo_path){const photo=await sb.storage.from('student-media').createSignedUrl(r.photo_path,900);if(photo.data?.signedUrl)r._signed_photo=photo.data.signedUrl}if(!r)throw Error('ID card data उपलब्ध नहीं है।');show(`<div id="v643IDPreview" class="v643Document">${renderIdCard(r,typeof getDocFormat==='function'?getDocFormat('idcard'):1)}</div><button id="v643Print">Print / Save PDF</button>`);box.querySelector('#v643Print').onclick=()=>v14Print('v643IDPreview');return}
 const d=await data(key,s);if(mine!==token)return;const rows=d.rows||[];
 if(key==='profile'){const r=d.student||s;show(rowsTable(Object.entries(r).map(([k,v])=>({field:k.replaceAll('_',' '),value:v})),[['field','Field'],['value','Details']])+btn('correction','Request Correction'));return}
 if(key==='attendance'){show(`<p>Present: ${E(s.attendance?.present??'—')} • Absent: ${E(s.attendance?.absent??'—')} • Leave: ${E(s.attendance?.leave??'—')}</p>`+rowsTable(rows,[['date','Date'],['status','Status'],['remarks','Remarks']]));return}
 if(key==='fees'){show(`<div class="v643Summary"><b>Paid: ${cash(s.fee?.paid)}</b><b>Current Due: ${cash(d.current_due??s.fee?.due)}</b></div>`+rowsTable(rows,[['date','Date / Month'],['label','Head / Receipt'],['amount','Total'],['paid','Paid'],['due','Due']])+`<h3>Fee Notices</h3>`+(d.notices||[]).map(n=>`<article class="v643Item"><b>${E(n.title)}</b><p>${E(n.note)}</p><small>Deposit by: ${E(n.deposit_by_date)}</small></article>`).join(''));return}
 if(key==='timetable'){show(rowsTable(rows,[['day_name','Day'],['period_no','Bell'],['start_time','Start'],['end_time','End'],['subject','Subject'],['teacher_name','Teacher']]));return}
 if(key==='learning'){show(rows.map(r=>`<article class="v643Item"><h3>${E(r.subject)} • ${E(r.date)} ${r.period_no?'• Bell '+E(r.period_no):''}</h3><b>${E(r.title)}</b><p>${E(r.details)}</p><p>${E(r.homework)}</p>${resource(r.worksheet_url,'Worksheet / Attachment')}</article>`).join('')||empty('अभी homework / teaching update नहीं दिया गया है।'));return}
 if(key==='notices'){show(rows.map(r=>`<article class="v643Item"><small>${E(r.date)} • ${E(r.letter_no)}</small><h3>${E(r.title)}</h3><p>${E(r.message)}</p>${resource(r.download_url,'Open Notice')}</article>`).join('')||empty('अभी कोई notice नहीं है।'));return}
 if(key==='gallery'){show(`<div class="v643Gallery">${rows.map(r=>{const u=validUrl(r.media_url);return u?`<figure>${/video/i.test(r.media_type||'')?`<video controls preload="none" src="${E(u)}"></video>`:`<img loading="lazy" src="${E(u)}" alt="${E(r.title)}">`}<figcaption>${E(r.title)}</figcaption></figure>`:''}).join('')}</div>`+(rows.length?'':empty()));return}
 if(key==='transport'){show(rowsTable(rows,[['route_name','Route'],['vehicle_no','Vehicle'],['pickup_point','Pickup'],['monthly_fee','Monthly Fee'],['driver_name','Driver'],['driver_phone','Mobile']]));return}
 if(key==='gate'){show(rowsTable(rows,[['gate_date','Date'],['reason','Reason'],['status','Status'],['approved_departure_time','Time'],['left_at','Left'],['returned_at','Returned']]));return}
 throw Error('यह विकल्प उपलब्ध नहीं है।');
 }catch(e){show(`<p class="v643Error" role="alert">${E(e.message)}</p><button id="v643Retry">Retry</button>`);const retry=box.querySelector('#v643Retry');if(retry)retry.onclick=()=>open(key,s)}
}
function enhance(){$('parentDashboard')?.classList.add('v90ParentShell');
 const header=document.querySelector('#parentDashboard .portalHead');
 if(header&&!header.querySelector('[data-v643-controls]')){const controls=document.createElement('div');controls.dataset.v643Controls='1';controls.className='v643Toolbar';for(const [label,fn] of [['🏠 Home',()=>window.loadParentPortal()],['🔐 Password',()=>window.v54ChangePassword?.()],['👤 Account Profile',()=>window.v97ShowParentProfile?.()]]){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=fn;controls.append(b)}header.append(controls)}
 window.v75ParentBack=()=>{$('v643ParentPanel')?back():window.v63ShowMyChildren?.()};
const body=$('parentDashboardBody');if(!body)return;body.classList.add('v643Scoped');body.querySelectorAll('.parentStudentCard').forEach(card=>{const s=getStudent(card);if(!s)return;
 const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',hour:'numeric',hourCycle:'h23'}).format(new Date()));const greeting=hour<12?'Good Morning':hour<17?'Good Afternoon':'Good Evening';const hero=card.querySelector('.v114PortalHeroText h2');if(hero)hero.textContent=greeting+(String(window.profile?.role)==='student'?', '+s.student_name:', Parent');const date=card.querySelector('.v114PortalHeroText small');if(date)date.textContent=new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',weekday:'long',day:'numeric',month:'short',year:'numeric'}).format(new Date());
 const quick=card.querySelector('.v114PortalQuick');if(quick)quick.innerHTML=actions.map(([k,icon,label])=>`<button type="button" data-parent-action="${k}"><b>${icon}</b><span>${label}</span></button>`).join('');
 card.querySelectorAll('.v114PortalHeroStudent button,.v114ChildInfo button').forEach(b=>{b.removeAttribute('onclick');b.dataset.parentAction='profile'});
 card.querySelectorAll('.v114PortalStats button').forEach((b,i)=>{b.removeAttribute('onclick');b.dataset.parentAction=['profile','attendance','fees','results'][i]});
 });window.v63ApplyParentIsolation?.();
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-parent-action]');if(!b)return;const s=getStudent(b.closest('.parentStudentCard'))||selected;if(!s)return;e.preventDefault();open(b.dataset.parentAction,s)});
const base=window.v643BaseParentLoader;
if(typeof base==='function')window.loadParentPortal=async function(){if(loading)return loading;back();loading=(async()=>{await base();enhance();if(['parent','student'].includes(String(window.profile?.role||'')))window.v643EnforcePassword?.();})().finally(()=>{loading=null});return loading};
window.v643Parent={open,back,enhance,actions:actions.map(x=>x[0])};
})();
