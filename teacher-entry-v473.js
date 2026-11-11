// A teacher enters one score at a time. Server authorization and central writes use the installed exam contracts.
window.openTeacherEntry473 = async function () {
  const teacher = profile?.id;
  const session = school?.academic_session;
  if (!teacher || profile.role !== 'teacher' || !session) return;
  if (window.LDM_EXAM?.center) return window.LDM_EXAM.center(true);
  if (window.LDM_ROOT?.canNavigate() === false || window.LDM_REMINDERS?.canNavigate() === false) return;
  window.v90Push?.('exam_marks_entry_470');
  window.__v90Route = 'exam_marks_entry_470';
  window.v90InstallShell?.(window.__v90Route);
  window.head?.('Exams & Marks', 'अपने विषय के अंक दर्ज करें');
  const host = document.getElementById('erpContent');
  host.innerHTML = '<section id="entry473" class="panel"><h2>विषयवार अंक प्रविष्टि</h2><button id="newPaper474" type="button">＋ प्रश्नपत्र बनाएँ / इम्पोर्ट करें</button><label>घंटी से खोजें (वैकल्पिक)<select id="bell475"><option value="">सभी अधिकृत पेपर</option></select></label><label>परीक्षा और विषय<select id="paper473"><option value="">पेपर चुनें</option></select></label><div id="date475"></div><button id="roster475" type="button">परीक्षा उपस्थिति और अंक तालिका</button><div id="student473"></div><p role="status"></p></section>';
  const root = host.firstElementChild;
  const paper = root.querySelector('#paper473'), body = root.querySelector('#student473'), status = root.querySelector('[role=status]');
  const live = () => root.isConnected && profile?.id === teacher && school?.academic_session === session;
  const prefix = JSON.stringify([teacher,session]) + ':entry473:';
  let generation = 0, data, index, busy = false, rows = [];
  root.querySelector('#roster475').onclick=()=>{if(!busy&&live())window.LDM_EXAM.center(true)};
  const addPaper=root.querySelector('#newPaper474');
  addPaper.onclick=()=>{if(!busy && live())return window.render('teacher_paper_center');};
  const key = () => prefix + paper.value;
  const note = text => { if (live()) status.textContent = text; };
  async function rpc(name,args) {
    const result = await sb.rpc(name,args);
    if (result.error) throw result.error;
    return result.data;
  }
  function read() { return JSON.parse(localStorage.getItem(key()) || '{}'); }
  function store(draft) { localStorage.setItem(key(), JSON.stringify(draft)); }
  function show() {
    body.replaceChildren();
    if (!rows.length) return note('इस पेपर में अंक प्रविष्टि के लिए उपस्थित विद्यार्थी उपलब्ध नहीं हैं।');
    const row = rows[index], draft = read();
    const same = draft.student === row.student_id;
    body.innerHTML = '<label>विद्यार्थी चुनें (अंक बदलने के लिए भी)<select id="jump474"></select></label><h3></h3><small></small><label>प्राप्त अंक<input type="number" min="0" step="0.01" inputmode="decimal" enterkeyhint="next"></label><label>सुधार का कारण (यदि लागू हो)<input type="text"></label><button type="button">पिछला</button> <button type="button" class="primary">Save & Next</button>';
    body.querySelector('h3').textContent = (index+1)+' / '+rows.length+' • '+row.student_name;
    body.querySelector('small').textContent = [row.father_name,row.admission_no,'पूर्णांक '+data.max_marks].filter(Boolean).join(' • ');
    const [score,reason] = body.querySelectorAll('input');
    const [back,next] = body.querySelectorAll('button');
    const jump=body.querySelector('#jump474');
    rows.forEach((r,i)=>jump.add(new Option([r.student_name,r.admission_no,r.marks==null?'बाकी':r.marks+'/'+data.max_marks].filter(Boolean).join(' • '),String(i))));
    jump.value=String(index);
    jump.disabled=same && (draft.value!=null || !!draft.job);
    jump.onchange=()=>{if(busy || jump.disabled)return;index=Number(jump.value);store({student:rows[index].student_id});show();note('');};
    score.max = data.max_marks;
    score.value = same ? draft.value ?? row.marks ?? '' : row.marks ?? '';
    reason.value = same ? draft.reason || '' : '';
    const remember = () => store({student:row.student_id,value:score.value,reason:reason.value,revision:same ? draft.revision ?? row.revision : row.revision});
    score.oninput = reason.oninput = () => {try {remember();note('ड्राफ्ट इस डिवाइस पर सुरक्षित है।');back.disabled=jump.disabled=true;} catch {note('ड्राफ्ट सुरक्षित नहीं हो सका। पेज खुला रखें।');}};
    back.disabled = index === 0 || (same && draft.value != null);
    back.onclick = () => { if (!busy && index>0) {index--;store({student:rows[index].student_id});show();} };
    next.onclick = async () => {
      if (busy || !live()) return;
      if (!score.value || !score.checkValidity() || !(Number(data.max_marks)>0)) return note('सही पूर्णांक और प्राप्त अंक जाँचें।');
      if (!read().job && data.published_at && Number(score.value)!==Number(row.marks) && reason.value.trim().length<3){
        reason.focus();return note('प्रकाशित अंक बदलने के लिए कम से कम 3 अक्षरों में कारण लिखें।');
      }
      busy=true;root.querySelector('#bell475').disabled=true;addPaper.disabled=jump.disabled=paper.disabled=next.disabled=score.disabled=reason.disabled=back.disabled=true;
      try {
        const d=read();
        if (row.marks == null || Number(score.value)!==Number(row.marks) || d.job) {
          if (!d.job && d.student===row.student_id && d.revision!=null && d.revision!==row.revision) throw Error('दूसरे उपयोगकर्ता ने अंक बदले हैं। नया अंक जाँचें और पेपर फिर खोलें।');
          const job=d.job || {p_paper:paper.value,p_action:'marks',p_rows:[{student_id:row.student_id,marks:score.value,revision:row.revision}],p_max:data.max_marks,p_revision:data.revision,p_request:crypto.randomUUID(),p_reason:reason.value.trim()};
          store({student:row.student_id,value:score.value,reason:reason.value,revision:row.revision,job});
          const result=await rpc('ldm_marks_sync471',job);
          if (!live()) return;
          const confirmed=result?.rows?.find(r=>r.student_id===row.student_id);
          if (String(result?.paper?.paper_id)!==String(job.p_paper) || confirmed?.marks==null || Number(confirmed.marks)!==Number(job.p_rows[0].marks)) throw Error('केंद्रीय सेव की पुष्टि नहीं मिली। फिर प्रयास करें।');
          window.LDM_MARKSHEET?.clear?.();window.ldmMarkDataDirty?.('marks');
          data=result; rows=result.rows.filter(r=>r.attendance==='Present');
          index=rows.findIndex(r=>r.student_id===row.student_id);
        }
        const last=index>=rows.length-1;
        if(!last) index++;
        store({student:rows[index].student_id});show();
        note(last?'अंतिम विद्यार्थी के अंक सुरक्षित हैं।':'केंद्रीय रिकॉर्ड में सुरक्षित।');
        const field=body.querySelector('input');field.focus();field.select();
      } catch(e) {
        if (!live()) return;
        // PostgreSQL errors roll back the transaction; network errors keep the exact request for retry.
        if (/^(?:22|23|40|42|P0)[A-Z0-9]{3}$/.test(e.code||'')) {const d=read();delete d.job;store(d);}
        note(e.message || 'सेव अधूरा है। फिर प्रयास करें।');
      } finally {busy=false;if(live()){root.querySelector('#bell475').disabled=false;addPaper.disabled=paper.disabled=next.disabled=false;const locked=!!read().job;score.disabled=reason.disabled=locked;}}
    };
    if (same && draft.job) {score.disabled=reason.disabled=true;next.textContent='सेव की पुष्टि फिर करें';}
    score.onkeydown=e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();next.click();}};
    if(same && draft.revision!=null && draft.revision!==row.revision && !draft.job && Number(draft.value)!==Number(row.marks)){
      const review=document.createElement('button');review.textContent='वर्तमान केंद्रीय अंक '+(row.marks??'खाली')+' देखें और अपना ड्राफ्ट छोड़ें';
      review.onclick=()=>{store({student:row.student_id});show();note('वर्तमान अंक दिख रहे हैं।');};body.append(review);
    }
  }
  paper.onchange=async()=>{
    const id=paper.value, mine=++generation;
    body.replaceChildren();root.querySelector('#date475').replaceChildren();note('');
    if(!id)return;
    try {
      localStorage.setItem(prefix+'last',id);
      const result=await rpc('ldm_teacher_load471',{p_paper:id});
      if(!live()||mine!==generation)return;
      if(String(result?.paper?.paper_id)!==id)throw Error('पेपर की पहचान जाँचें।');
      window.examDates475(root.querySelector('#date475'),result,false,rpc,()=>paper.onchange(),note,()=>!busy&&live()&&!read().job);
      data=result;rows=result.rows.filter(r=>r.attendance==='Present');
      index=Math.max(0,rows.findIndex(r=>r.student_id===read().student));show();
    } catch(e){if(live()&&mine===generation)note(e.message);}
  };
  try {
    const list=await rpc('ldm_teacher_list471',{p_session:session});
    if(!live())return;
    for(const p of list)paper.add(new Option([p.exam_name,p.class_name,p.section,p.subject_name,p.exam_date].filter(Boolean).join(' • '),p.paper_id));
    const bell=root.querySelector('#bell475');
    const normal=v=>String(v||'').trim().toLowerCase();
    const classKey=v=>normal(window.ldmClassCanonical?.(v)||v);
    rpc('ldm_teacher_bells460',{}).then(bells=>{
      if(!live())return;
      bells.forEach((b,i)=>bell.add(new Option(['घंटी '+b.period_no,b.class_name,b.section,b.subject].filter(Boolean).join(' • '),String(i))));
      bell.onchange=()=>{
        if(busy||!live())return;
        const b=bell.value===''?null:bells[Number(bell.value)];
        const matches=list.filter(p=>!b||(classKey(p.class_name)===classKey(b.class_name)&&normal(p.subject_name)===normal(b.subject)&&(!p.section||!b.section||normal(b.section)===normal(p.section))));
        paper.options.length=1;
        matches.forEach(p=>paper.add(new Option([p.exam_name,p.class_name,p.section,p.subject_name,p.exam_date].filter(Boolean).join(' • '),p.paper_id)));
        paper.value=matches.length===1?String(matches[0].paper_id):'';
        paper.onchange();
        if(!matches.length)note('इस घंटी का परीक्षा पेपर उपलब्ध नहीं है।');
      };
    }).catch(()=>{if(live())bell.disabled=true});
    const last=localStorage.getItem(prefix+'last');if(list.some(p=>p.paper_id===last)){paper.value=last;await paper.onchange();}
    else if(!list.length)note('आपके आवंटित विषय का पेपर उपलब्ध नहीं है।');
  }catch(e){note(e.message);}
};
