/* LDM V500: additive UI, existing card actions and authenticated routes remain canonical. */
(function(){'use strict';
 if(window.LDM_PREMIUM_V500)return;
 const D=document,W=window;
 const safe=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const actor=()=>{try{return typeof profile!=='undefined'?profile:W.profile}catch(_){return W.profile}};
 const admin=()=>['admin','super_admin','principal'].includes(String(actor()?.role||'').toLowerCase());
 const palette=['#135fb0','#0e8f7f','#7042bd','#c26b16','#af3583','#087e9d','#3e52ae'];
 const base=[
 ['🎓','Students','Admission • Search • Records','v150_student_master'],
 ['👩‍🏫','Teachers & Staff','Staff • Profiles • Attendance','staff'],
 ['📚','Teaching Progress','Lessons • Periods • Syllabus','v90_teaching_monitor'],
 ['☑','Checking & Homework','Homework • Copy Checking','academic_monitor'],
 ['📅','Timetable','Classes • Schedule • Bell','timetable_master'],
 ['✅','Student Attendance','Daily • Monthly • Correction','attendance'],
 ['📝','Central Examination','Paper • P/A • Marks','central_exam'],
 ['📊','Marks & Progress','Teacher • Class • Subject','v90_marks_monitor'],
 ['📄','Marksheet','Preview • A4 Print • PDF','marksheet_center'],
 ['🎫','Admit Cards','Exam • Admit • Print','exam_admit_center'],
 ['💰','Fee & Accounts','Collection • Due • Reports','fees'],
 ['🧾','Fee Due Control','Correction • Ledger','v6422_due_master'],
 ['🪪','Student ID Cards','Student Photos • Print','idcard_center'],
 ['🏆','Certificates','School • Premium Certificates','certificate_center'],
 ['📋','Class Teacher Control','Class • Section • Assign','class_teacher_control'],
 ['📢','Notice & Communication','Notices • Announcements','notices'],
 ['🗓','Staff Attendance','Presence • Leave','staff_attendance'],
 ['👥','Daily Presence','Student • Teacher Status','v90_presence_monitor'],
 ['✉','Student Requests','Pending • Corrections','v90_student_requests'],
 ['🚍','Transport','Route • Attendance','v90_transport_monitor'],
 ['🧩','Work Delegation','Assistants • Assigned Work','work_delegation'],
 ['🔐','Admin Settings','School • Security • Options','settings'],
 ['📑','All Reports','Preview • Print • Export','reports'],
 ['🗂','School Academic Monitoring','Teaching • Checking • Exams','academic_monitor'],
 ['🧑‍🎓','Student / Parent Login','Account • Access','parent_access'],
 ['📬','Teacher Requests','Teacher • Work • Leave','v90_teacher_requests'],
 ['📥','Result Receipt','Marksheet / TC Receipt','result_receipt_center']
 ];
 let dlg=null,menu=[],searchTerm='',teacherWork=null;let workEpoch=0;
 const database=()=>{try{return typeof sb!=='undefined'?sb:W.sb}catch(_){return W.sb}};
 const session=()=>{try{return typeof school!=='undefined'?school?.academic_session:W.school?.academic_session}catch(_){return W.school?.academic_session}};
 function entries(){const extra=(W.LDM_MANAGEMENT?.entries||[]).map(e=>[e.icon||'📌',e.title,e.sub,e.route]);const known=new Set();return base.concat(extra).filter(e=>{if(!e[3]||known.has(e[3]))return false;known.add(e[3]);return true;});}
 function ensureDialog(){if(dlg?.isConnected)return dlg;dlg=D.createElement('dialog');dlg.id='ldm500Dialog';dlg.setAttribute('aria-label','Universal ERP Control Center');dlg.innerHTML='<div class="ldm500-modal-head"><strong>✦ LD MODERN • UNIVERSAL ERP</strong><button type="button" id="ldm500Close">✕ Close</button></div><div class="ldm500-modal-inner"><div class="ldm500-kpis" id="ldm500Kpis"></div><div class="ldm500-filters"><input type="search" id="ldm500Search" placeholder="Find any ERP function / sector" aria-label="Search ERP functions"><button type="button" id="ldm500Report">A4 Report</button><button type="button" id="ldm500Print" hidden>Print</button><button type="button" id="ldm500Pdf" hidden>Save as PDF</button></div><div class="ldm500-filters" style="margin-top:9px"><label>Teacher Work Date <input type="date" id="ldm500WorkDate"></label><button type="button" id="ldm500LoadWork">Load Verified Teacher Status</button></div><div id="ldm500TeacherTable" role="status">Teaching और Copy Checking की वास्तविक रिपोर्ट Load पर उपलब्ध होगी।</div><p id="ldm500Note">सभी पुराने Cards और Functions अपने स्थान पर रहेंगे।</p><div class="ldm500-sections" id="ldm500Sections"></div><section class="ldm500-report" id="ldm500ReportSheet"><h2>L D MODERN EDUCATION ACADEMY</h2><p>Universal ERP Status — Available dashboard records</p><div id="ldm500ReportBody"></div><p style="font-size:11px">Status is derived only from currently displayed ERP data. Teaching/Checking details are available in their respective authenticated monitors.</p></section></div>';
 D.body.append(dlg);
 dlg.querySelector('#ldm500Close').onclick=()=>{workEpoch++;dlg.close?.();dlg.remove();dlg=null;teacherWork=null;};
 dlg.addEventListener('cancel',e=>{e.preventDefault();dlg.querySelector('#ldm500Close').click()});
 dlg.querySelector('#ldm500Search').addEventListener('input',e=>{searchTerm=e.target.value.trim().toLowerCase();renderEntries()});
 dlg.querySelector('#ldm500Report').onclick=()=>{dlg.dataset.report=dlg.dataset.report==='true'?'false':'true';const report=dlg.dataset.report==='true';dlg.querySelector('#ldm500Report').textContent=report?'All Sectors':'A4 Report';dlg.querySelector('#ldm500Print').hidden=!report;dlg.querySelector('#ldm500Pdf').hidden=!report;if(report)fillReport()};
 dlg.querySelector('#ldm500WorkDate').value=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Kolkata'});dlg.querySelector('#ldm500WorkDate').addEventListener('change',()=>{workEpoch++;teacherWork=null;dlg.querySelector('#ldm500LoadWork').disabled=false;dlg.querySelector('#ldm500TeacherTable').textContent='तारीख बदली है। नई रिपोर्ट Load करें।'});dlg.querySelector('#ldm500LoadWork').onclick=loadTeacherStatus;dlg.querySelector('#ldm500Print').onclick=()=>printReport(false);
 dlg.querySelector('#ldm500Pdf').onclick=()=>printReport(true);
 return dlg;
 }

 async function loadTeacherStatus(){
   if(!admin()||!dlg)return;const currentDialog=dlg,epoch=++workEpoch;const host=dlg.querySelector('#ldm500TeacherTable'),button=dlg.querySelector('#ldm500LoadWork');
   const date=dlg.querySelector('#ldm500WorkDate')?.value||'',who=String(actor()?.id||''),sess=String(session()||'');
   if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!sess)return host.textContent='Date और Academic Session जरूरी है।';
   const db=database();if(!db?.from)return host.textContent='Database connection नहीं मिला। Login के बाद जाँचें।';
   if(teacherWork?.date===date&&teacherWork.who===who&&teacherWork.sess===sess&&Date.now()-teacherWork.at<120000)return renderTeacherStatus();
   host.textContent='Loading verified records…';button.disabled=true;const limit=3000;
   try{
     const day=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(date+'T12:00:00').getDay()];
     const [tt,di,cc]=await Promise.all([
       db.from('timetable').select('teacher_name,class_name,period_no').eq('day_name',day).limit(limit),
       db.from('teaching_diary').select('teacher_name,class_name,period_no,teaching_status').eq('teaching_date',date).limit(limit),
       db.from('v90_marks_check_status').select('teacher_name,copy_checked').eq('academic_session',sess).eq('copy_checked',true).limit(limit)
     ]);
     const err=tt.error||di.error||cc.error;if(err)throw Error(err.message||'Status access denied');
     if(!admin()||epoch!==workEpoch||dlg!==currentDialog||!dlg?.isConnected||String(actor()?.id||'')!==who||String(session()||'')!==sess||dlg.querySelector('#ldm500WorkDate')?.value!==date)return;
     const records=tt.data||[],diaries=di.data||[],checks=cc.data||[];
     const diarySet=new Map(diaries.map(x=>[[x.teacher_name,Number(x.period_no),x.class_name].join('|'),x]));
     const summary=new Map();const ensure=name=>{name=String(name||'Unknown');if(!summary.has(name))summary.set(name,{name,planned:0,taught:0,notTaken:0,checked:0});return summary.get(name)};
     records.forEach(t=>{const row=ensure(t.teacher_name);row.planned++;const diary=diarySet.get([t.teacher_name,Number(t.period_no),t.class_name].join('|'));if(diary){if(String(diary.teaching_status||'').trim().toLowerCase()==='not taken')row.notTaken++;else row.taught++}});
     checks.forEach(c=>{if(c.copy_checked)ensure(c.teacher_name).checked++});
     teacherWork={date,who,sess,at:Date.now(),rows:[...summary.values()].sort((a,b)=>a.name.localeCompare(b.name,'hi')),partial:records.length===limit||diaries.length===limit||checks.length===limit};
     renderTeacherStatus();
   }catch(e){if(epoch===workEpoch&&dlg===currentDialog&&host.isConnected)host.textContent='Status unavailable: '+String(e.message||e)+' • कोई अनुमानित आंकड़ा नहीं दिखाया गया।'}
   finally{if(epoch===workEpoch)button.disabled=false}
 }
 function renderTeacherStatus(){if(!dlg||!teacherWork)return;const rows=teacherWork.rows;const host=dlg.querySelector('#ldm500TeacherTable');host.innerHTML=`<div style="overflow:auto;max-height:260px"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr><th>Teacher</th><th>Periods</th><th>Taught</th><th>Pending</th><th>Copies Checked*</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${safe(x.name)}</td><td>${x.planned}</td><td>${x.taught}</td><td>${Math.max(0,x.planned-x.taught-x.notTaken)}</td><td>${x.checked}</td></tr>`).join('')||'<tr><td colspan="5">No teacher work records available</td></tr>'}</tbody></table></div><small>* Copy checked: academic session total, teaching: selected date. ${teacherWork.partial?'Results may be partial (row limit reached).':'Only saved records are counted.'}</small>`;}
 function dashboardKpis(){const root=D.querySelector('#erpContent #v90Stats');if(!root)return[];return [...root.querySelectorAll('.v90Stat')].slice(0,9).map(x=>({name:String(x.querySelector('small')?.textContent||'').trim(),value:String(x.querySelector('b')?.textContent||'').trim()})).filter(x=>x.name&&x.value&&x.value!=='—');}
 function renderKpis(){const target=dlg?.querySelector('#ldm500Kpis');if(!target)return;const k=dashboardKpis();target.innerHTML=(k.length?k.slice(0,6).map(x=>`<div class="ldm500-kpi"><small>${safe(x.name)}</small><strong>${safe(x.value)}</strong></div>`).join(''):'<div class="ldm500-kpi" style="grid-column:1/-1"><small>ERP Status</small><strong>Open individual modules for verified live records</strong></div>');}
 function renderEntries(){if(!dlg)return;const host=dlg.querySelector('#ldm500Sections');host.replaceChildren();menu.filter(x=>(x[1]+' '+x[2]).toLowerCase().includes(searchTerm)).forEach((e,i)=>{const b=D.createElement('button');b.type='button';b.className='ldm500-sector';b.style.setProperty('--ldm500-color',palette[i%palette.length]);b.innerHTML=`<span style="font-size:23px" aria-hidden="true">${safe(e[0])}</span><b>${safe(e[1])}</b><small>${safe(e[2])}</small>`;b.onclick=()=>{if(!admin())return;const route=e[3];dlg.querySelector('#ldm500Close').click();try{if(typeof W.render==='function')W.render(route);else if(typeof render==='function')render(route);else W.toast?.('Function is not currently available')}catch(ex){W.toast?.(ex.message||String(ex))}};host.append(b)});if(!host.children.length){const p=D.createElement('p');p.textContent='No matching function';host.append(p)}}
 function fillReport(){if(!admin())return;if(teacherWork&&(teacherWork.who!==String(actor()?.id||'')||teacherWork.sess!==String(session()||'')))teacherWork=null;const d=dlg?.querySelector('#ldm500ReportBody');if(!d)return;const k=dashboardKpis();const now=new Date().toLocaleString('en-IN',{timeZone:'Asia/Kolkata',dateStyle:'medium',timeStyle:'short'});d.innerHTML=`<p style="text-align:left;font-size:12px">Generated: ${safe(now)} · Status: displayed dashboard values</p><table><thead><tr><th>Sector / Indicator</th><th>Displayed Value</th></tr></thead><tbody>${k.map(x=>`<tr><td>${safe(x.name)}</td><td>${safe(x.value)}</td></tr>`).join('')||'<tr><td colspan="2">No verified dashboard totals loaded</td></tr>'}</tbody></table><h3>Teacher work details</h3>${teacherWork?.rows?.length?`<p style="font-size:12px;text-align:left">Teaching date: ${safe(teacherWork.date)} • Copy checks: current academic session${teacherWork.partial?' • PARTIAL DATA':''}</p><table><tr><th>Teacher</th><th>Scheduled</th><th>Taught</th><th>Pending</th><th>Copies Checked*</th></tr>${teacherWork.rows.map(x=>`<tr><td>${safe(x.name)}</td><td>${x.planned}</td><td>${x.taught}</td><td>${Math.max(0,x.planned-x.taught-x.notTaken)}</td><td>${x.checked}</td></tr>`).join('')}</table>`:'<p style="text-align:left;font-size:12px">Teacher work not loaded or unavailable. Open Load Verified Teacher Status to retrieve actual records.</p>'}`;}
 function printReport(pdf){if(!dlg||!admin())return;if(pdf){const n=dlg.querySelector('#ldm500Note');if(n)n.textContent='Print dialog में Destination → Save as PDF चुनें (browser supported).'}fillReport();D.body.classList.add('ldm500-printing');const cleanup=()=>D.body.classList.remove('ldm500-printing');W.addEventListener('afterprint',cleanup,{once:true});try{W.print()}catch(e){cleanup();throw e}W.setTimeout(cleanup,60000)}
 function open(){if(!admin())return W.toast?.('Admin authorization required');ensureDialog();if(teacherWork&&(teacherWork.who!==String(actor()?.id||'')||teacherWork.sess!==String(session()||'')))teacherWork=null;menu=entries();searchTerm='';dlg.dataset.report='false';dlg.querySelector('#ldm500Search').value='';dlg.querySelector('#ldm500Print').hidden=dlg.querySelector('#ldm500Pdf').hidden=true;dlg.querySelector('#ldm500Report').textContent='A4 Report';renderKpis();renderEntries();dlg.scrollTop=0;dlg.querySelector('.ldm500-modal-inner').scrollTop=0;if(typeof dlg.showModal==='function'){if(!dlg.open)dlg.showModal();}else {dlg.setAttribute('open','');}requestAnimationFrame(()=>{if(dlg?.open)dlg.querySelector('.ldm500-modal-inner').scrollTop=0;});}
 function attachHero(){const root=D.querySelector('#erpContent .ldmRootAdminDash');if(!admin()||!root||root.querySelector('#ldm500Hero'))return;const section=D.createElement('section');section.id='ldm500Hero';section.className='ldm500-hero';section.setAttribute('aria-label','Universal ERP Control Center');section.innerHTML='<div class="ldm500-hero-top"><div class="ldm500-hero-title"><strong>✦ UNIVERSAL ERP CONTROL CENTER</strong><small>LD Modern Premium ERP • A–Z Status • All Existing Functions</small></div><button class="ldm500-open" id="ldm500Open" type="button">OPEN A–Z CENTER →</button></div><div class="ldm500-hero-pills"><span>👥 Students & Staff</span><span>📚 Teaching & Checking</span><span>📝 Exams & Marks</span><span>🧾 A4 Preview / Print / PDF</span><span>🔐 Admin Work</span></div>';
 root.insertBefore(section,root.firstElementChild);section.querySelector('#ldm500Open').addEventListener('click',open);
 }
 function dedupeIdentity(){const header=D.querySelector('#erp .erpTop');if(!header)return;const all=[...header.querySelectorAll(':scope > .ldmAdminSchoolIdentity')];const seen=new Set();all.forEach(el=>{const t=el.textContent.replace(/\s+/g,' ').trim().toLowerCase();if(!t||!t.includes('modern'))return;if(seen.has(t)){el.style.setProperty('display','none','important');el.setAttribute('aria-hidden','true');}else{seen.add(t);if(el.getAttribute('aria-hidden')==='true'){el.style.removeProperty('display');el.removeAttribute('aria-hidden')}}});}
 const tableStates=new WeakMap();
 function setupTableTools(){const area=D.querySelector('#erpContent');if(!area)return;const wrappers=[...area.querySelectorAll('.tableWrap, .x393ExamScroll')].slice(0,80);wrappers.forEach(w=>{if(w.closest('#x320Center'))return;const table=w.querySelector('table');if(!table)return;const prior=tableStates.get(w);if(prior){const current=Array.from(table.tBodies?.[0]?.rows||[]);if(prior.table===table&&prior.bar.isConnected&&current.length===prior.rows.length&&current.every(r=>prior.rows.includes(r)))return;prior.rows.forEach(r=>r.hidden=false);prior.bar.remove();tableStates.delete(w);delete w.dataset.ldm500;}const heads=[...table.querySelectorAll('thead tr:first-child th, tr:first-child th')].slice(0,25).map(x=>x.textContent.trim().toLowerCase());if(!heads.some(x=>/student|विद्यार्थी/.test(x))||!heads.some(x=>/father|roll|admission|पिता/.test(x)))return;const body=table.tBodies?.[0];if(!body||body.rows.length===0||body.rows.length>1200||body.querySelector('input,textarea,select,[contenteditable]'))return;const bar=D.createElement('div');bar.className='ldm500-table-tools';bar.innerHTML='<input type="search" aria-label="Search loaded students" placeholder="Student / Father / Roll / Admission Search"><select aria-label="Sort loaded students"><option value="default">Original order</option><option value="az">Name A–Z</option><option value="za">Name Z–A</option><option value="rollasc">Roll ascending</option><option value="rolldesc">Roll descending</option></select><small>Current page • no server queries</small>';
 w.parentNode.insertBefore(bar,w);w.dataset.ldm500='1';const original=[...body.rows];tableStates.set(w,{table,bar,rows:original});const studentIdx=Math.max(0,heads.findIndex(x=>/student|विद्यार्थी/.test(x)));const rollIdx=heads.findIndex(x=>/roll|क्रमांक/.test(x));const collator=new Intl.Collator('en-IN',{numeric:true,sensitivity:'base'});const filter=()=>{const q=bar.querySelector('input').value.toLocaleLowerCase().trim();const sort=bar.querySelector('select').value;const rows=original.slice();if(sort!=='default')rows.sort((a,b)=>{const col=sort.startsWith('roll')&&rollIdx>=0?rollIdx:studentIdx;const left=a.cells[col]?.textContent.trim()||'';const right=b.cells[col]?.textContent.trim()||'';return collator.compare(left,right)*(sort==='za'||sort==='rolldesc'?-1:1)});if(sort!=='default'){const fragment=D.createDocumentFragment();rows.forEach(r=>fragment.append(r));body.append(fragment)}else if([...body.rows].some((r,i)=>r!==original[i])){const fragment=D.createDocumentFragment();original.forEach(r=>fragment.append(r));body.append(fragment)}
 rows.forEach(r=>{r.hidden=!!q&&!r.textContent.toLocaleLowerCase().includes(q)})};bar.querySelector('input').oninput=filter;bar.querySelector('select').onchange=filter;
 });}
 let timer=0;function schedule(){if(timer)return;timer=setTimeout(()=>{timer=0;try{attachHero();dedupeIdentity();setupTableTools()}catch(e){/* must not interfere with ERP */}},180)}
 function install(){const host=D.getElementById('erpContent');if(!host)return;const observer=new MutationObserver(schedule);observer.observe(host,{childList:true,subtree:true});const header=D.querySelector('#erp .erpTop');if(header)new MutationObserver(schedule).observe(header,{childList:true,subtree:false});schedule()}
 if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',install,{once:true});else install();
 W.LDM_PREMIUM_V500=Object.freeze({open,catalog:()=>entries().map(e=>({icon:e[0],title:e[1],detail:e[2],route:e[3]})),version:'505.0',modes:'additive'});
})();
