/* Pure report calculations: no network, timers or DOM. */
(function(root){'use strict';
const norm=v=>String(v??'').trim().toLowerCase(),cl=v=>norm(v).replace(/^class\s*/,'').replace(/\s+/g,''),rs=(d,k)=>d.sources?.[k]?.ok?d.sources[k].rows||[]:[];
const student=s=>({target:String(s.admission_no||''),name:s.student_name||'नाम नहीं',class_name:s.class_name||'—',phone:s.phone||'',details:'पिता: '+(s.father_name||'—')+' • '+(s.admission_no||'—')});
function build(d){let rows=[],warnings=Object.entries(d.sources||{}).filter(([,v])=>!v.ok).map(([k,v])=>k+': '+v.error),hint='';
if(d.board==='fees'){
 const list=rs(d,'students'),counts=new Map();for(const s of list)counts.set(String(s.admission_no),(counts.get(String(s.admission_no))||0)+1);const students=new Map(list.filter(s=>counts.get(String(s.admission_no))===1).map(s=>[String(s.admission_no),s]));if(students.size<list.length)warnings.push('Duplicate admission numbers: अस्पष्ट विद्यार्थियों पर संपर्क न करें; Student Master ठीक करें।');
 rows=rs(d,'dues').filter(s=>students.has(String(s.admission_no))).map(r=>({...student(students.get(String(r.admission_no))),value:Number(r.current_due),status:'बकाया ₹'+Number(r.current_due).toLocaleString('en-IN')}));
 hint='दिन की स्थिर 25-विद्यार्थी सूची। पहले न चुने / सबसे पुराने चुने विद्यार्थी, फिर अधिक बकाया। भुगतान के बाद Refresh पर हटेंगे। Call/WhatsApp खोलना भेजने की पुष्टि नहीं है।';
}else if(['absent','attendance'].includes(d.board)){
 const students=rs(d,'students'),att=rs(d,'attendance'),groups=new Map(),lookup=new Map();
 for(const s of students){const k=cl(s.class_name);if(!groups.has(k))groups.set(k,{name:s.class_name||'—',students:[],days:new Set()});groups.get(k).students.push(s)}
 for(const a of att){const g=groups.get(cl(a.class_name));if(!g||!['present','absent','leave'].includes(norm(a.status))||!a.date)continue;g.days.add(a.date);const k=JSON.stringify([cl(a.class_name),String(a.admission_no),a.date]);if(!lookup.has(k))lookup.set(k,[]);lookup.get(k).push(norm(a.status))}
 const state=(s,date)=>{const a=lookup.get(JSON.stringify([cl(s.class_name),String(s.admission_no),date]))||[];return a.length>1?'conflict':a[0]||'not_marked'};
 for(const g of groups.values()){
  if(d.board==='absent'){const days=[...g.days].sort().reverse().slice(0,4);if(days.length<4){warnings.push(g.name+': चार दर्ज स्कूल-दिन उपलब्ध नहीं।');continue}for(const s of g.students)if(days.every(day=>state(s,day)==='absent'))rows.push({...student(s),status:'लगातार 4 दर्ज दिन Absent',details:student(s).details+' • दिन: '+days.slice().reverse().join(', ')})}
  else {const counts={present:0,absent:0,leave:0,not_marked:0,conflict:0};g.students.forEach(s=>counts[state(s,d.date)]++);rows.push({target:String(g.name),name:'कक्षा '+g.name,class_name:g.name,status:counts.not_marked||counts.conflict?'जाँच बाकी':'दर्ज पूरा',value:counts.not_marked+counts.conflict,details:`कुल ${g.students.length} • Present ${counts.present} • Absent ${counts.absent} • Leave ${counts.leave} • Not marked ${counts.not_marked} • Duplicate/conflict ${counts.conflict}`})}
 }
 hint=d.board==='absent'?'हर class के हाल के चार attendance-दर्ज दिन। छुट्टी का अनुमान नहीं लगाया जाता; missing/duplicate entry Absent नहीं मानी जाती। 60 दिन की lookback सीमा है।':'सभी सक्रिय classes, Nursery / LKG / UKG सहित। Missing attendance Absent नहीं है। Duplicate entries की अलग जाँच करें।';
 if(!d.sources?.students?.ok||!d.sources?.attendance?.ok)rows=[];
}else if(d.board==='worksheets'){
 const diary=rs(d,'teaching_diary');rows=rs(d,'teacher_profiles').filter(t=>t.is_active!==false&&norm(t.approval_status)==='approved').map(t=>{const entries=diary.filter(r=>r.teacher_user_id===t.auth_user_id),works=entries.filter(r=>String(r.homework_remark||r.worksheet||'').trim());return {target:t.id,name:t.teacher_name||t.employee_id,phone:t.mobile||t.phone||'',status:!d.sources?.teaching_diary?.ok?'अज्ञात':works.length?'Worksheet दर्ज':'आज worksheet entry नहीं',value:works.length,details:`Teaching entries ${entries.length} • Worksheet entries ${works.length} • `+entries.map(e=>[e.class_name,e.subject,e.topic].filter(Boolean).join(' / ')).join('; ')}});
 hint='वास्तविक Teaching Diary के worksheet/homework remarks की स्थिति। हर Teacher के लिए रोज worksheet अनिवार्य है, ऐसा अनुमान नहीं लगाया गया है।';
}else if(d.board==='papers'){
 const x=d.sources?.papers?.data;if(!x)return {rows:[],warnings,hint:'Paper source की पुष्टि बाकी है।'};warnings.push(...(x.warnings||[]));
 const teachers=x.teachers||[],byId=new Map(teachers.map(t=>[t.id,t])),pairs=new Map();
 for(const a of [...(x.subjects||[]),...(x.academics||[]),...(x.timetable||[])]){let t=byId.get(a.teacher_profile_id);if(!t&&a.teacher_name){const found=teachers.filter(t=>norm(t.name)===norm(a.teacher_name));if(found.length===1)t=found[0]}const sub=a.subject||a.subject_name;if(!t||!a.class_name||!sub){warnings.push('अस्पष्ट assignment: '+(a.teacher_name||a.teacher_profile_id||'Unknown teacher'));continue}if(!pairs.has(t.id))pairs.set(t.id,new Map());pairs.get(t.id).set(cl(a.class_name)+'|'+norm(sub),{class_name:a.class_name,subject:sub})}
 rows=teachers.map(t=>{const expected=[...(pairs.get(t.id)?.values()||[])];let missing=0,draft=0,sent=0;const details=expected.map(a=>{const found=(x.papers||[]).filter(p=>p.owner_id===t.auth_user_id&&cl(p.class_name)===cl(a.class_name)&&norm(p.subject_name)===norm(a.subject)&&(!d.exam||norm(p.exam_name)===norm(d.exam)));let status;if(found.some(p=>['submitted','sent','approved','published','admin','printed'].includes(norm(p.status)))){sent++;status='Admin को भेजा'}else if(found.length){draft++;status='Draft'}else{missing++;status='बाकी'}return a.class_name+' / '+a.subject+': '+status});return {target:t.id+'|'+(d.exam||''),name:t.name||t.employee_id,status:!expected.length?'Assignment अज्ञात':`बाकी ${missing} • Draft ${draft} • भेजे ${sent}`,value:missing,details:details.join('; ')||'Exact class/subject assignment उपलब्ध नहीं; Pending का अनुमान नहीं लगाया गया।'}});
 hint='वास्तविक class/subject assignments और चुने session/exam का metadata। Questions नहीं मँगाए जाते। किसी भी exam में भेजा paper पर्याप्त होने से बचने के लिए exam अवश्य चुनें।';
 if(!d.exam)warnings.push('Exam खाली है: सभी exams का संयुक्त रिकॉर्ड है; किसी एक परीक्षा की पूर्णता न मानें।');
}else if(d.board==='leaves'){
 for(const source of ['student_leave_requests','v90_teacher_requests','leave'])for(const r of rs(d,source))rows.push({target:source+':'+r.id,name:r.student_name||r.teacher_name||r.staff_name||r.admission_no||r.employee_id,class_name:r.class_name||'Staff',status:r.status,details:[r.from_date,r.to_date,r.leave_type||r.request_type,r.reason||r.details].filter(Boolean).join(' • '),leave:true});
 hint='Pending छात्र / Teacher Leave requests। छात्र और Teacher request पर मूल केंद्रीय approval सेवा; Staff leave register में निर्णय status बदलता है। Past attendance अपने-आप बदलने का दावा नहीं है।';
}else if(d.board==='reports'){
 rows=Object.entries(d.sources).map(([name,r])=>({target:name,name,status:r.ok?'स्रोत उपलब्ध':'स्रोत की जाँच बाकी',value:r.count,details:r.ok?'पूरे table के कुल records: '+r.count+' • यह चुनी तारीख की business/financial audit नहीं है।':r.error}));
 hint='Report source inventory और मानव समीक्षा log। नीचे उपलब्ध table / record count है; इससे सभी business reports सही या पूर्ण प्रमाणित नहीं होते। मूल reports संबंधित module में उपलब्ध हैं।';
}
 rows=rows.map(r=>({...r,last:(d.history||[]).find(h=>h.target===r.target)||null}));
 return {rows,warnings:[...new Set(warnings)],hint};
}
const api={build};if(typeof module==='object'&&module.exports)module.exports=api;else root.LDM_OPS405_MODEL=api;
})(typeof window==='object'?window:globalThis);
