/* Calendar-aware teaching plan. All OCR runs in the browser. */
(() => {
  'use strict';
  const dayNames=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const iso=date=>date.toISOString().slice(0,10);
  function allocate(slots,lessons,count){
    if(!lessons.length || !Number.isInteger(count) || count<0)throw Error('पाठ और सही टेस्ट संख्या दर्ज करें।');
    const available=slots.length-count;
    if(available<Math.max(count,lessons.length))throw Error('उपलब्ध घंटियाँ कम हैं। प्रत्येक पाठ और प्रत्येक टेस्ट से पहले पढ़ाई के लिए समय चाहिए।');
    const result=[];let test=0,covered=new Set();
    for(let i=0;i<available;i++){
      const lesson=lessons[Math.floor(i*lessons.length/available)];
      const previous=i?lessons[Math.floor((i-1)*lessons.length/available)]:null;
      result.push({...slots[result.length],topic:(previous===lesson?'अभ्यास / पुनरावृत्ति — ':'पाठ — ')+lesson});
      covered.add(lesson);
      if(count && i+1===Math.ceil((test+1)*available/count)){
        result.push({...slots[result.length],topic:'टेस्ट '+(++test)+' — '+[...covered].join(', ')});
        covered.clear();
      }
    }
    return result;
  }
  let engine;
  async function ocr(source){
    if(!engine)engine=new Promise((resolve,reject)=>{
      if(window.Tesseract)return resolve(window.Tesseract);
      const script=document.createElement('script');
      script.src='https://cdn.jsdelivr.net/npm/tesseract.js@5.0.0/dist/tesseract.min.js';
      script.onload=()=>resolve(window.Tesseract);
      script.onerror=()=>reject(Error('OCR डाउनलोड असफल। पाठ या तारीख हाथ से भरें।'));
      document.head.append(script);
    }).catch(e=>{engine=null;throw e});
    const worker=await (await engine).createWorker('hin+eng',1,{workerPath:'https://cdn.jsdelivr.net/npm/tesseract.js@5.0.0/dist/worker.min.js',corePath:'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.0.0',langPath:'https://tessdata.projectnaptha.com/4.0.0'});
    try{return (await worker.recognize(source)).data.text}finally{await worker.terminate()}
  }
  async function pdfText(file){
    const lib=await import('./paper-import-v369-assets/pdf.mjs');
    lib.GlobalWorkerOptions.workerSrc=new URL('paper-import-v369-assets/pdf.worker.mjs',document.baseURI).href;
    const doc=await lib.getDocument({data:await file.arrayBuffer(),isEvalSupported:false,useSystemFonts:true}).promise;
    try{
      if(doc.numPages>40)throw Error('एक बार में 40 पेज तक चुनें।');
      const pages=[];
      for(let n=1;n<=doc.numPages;n++){
        const page=await doc.getPage(n);
        let str=(await page.getTextContent()).items.map(x=>x.str+(x.hasEOL?'\n':' ')).join('');
        if(!str.trim()||str.includes('\uFFFD')){
          const view=page.getViewport({scale:1.6}),canvas=document.createElement('canvas');
          canvas.width=view.width;canvas.height=view.height;
          await page.render({canvasContext:canvas.getContext('2d'),viewport:view}).promise;
          str=await ocr(canvas);
        }
        pages.push(str);
      }
      return pages.join('\n');
    }finally{await doc.destroy()}
  }
  function holiday(line){
    const match=line.replace(/[०-९]/g,n=>String('०१२३४५६७८९'.indexOf(n))).match(/(\d{4})-(\d{2})-(\d{2})\b|\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b/);
    if(!match)return null;
    const date=match[1]?match[0]:[match[6],match[5].padStart(2,'0'),match[4].padStart(2,'0')].join('-');
    if(!Number.isFinite(Date.parse(date))||iso(new Date(date))!==date)return null;
    const name=line.replace(match[0],'').replace(/^\s*[-:|]+\s*/,'').trim();
    return name?{holiday_date:date,holiday_name:name,is_working_day:false}:null;
  }
  async function read(query){const r=await query;if(r.error)throw Error(r.error.message);return r.data||[]}
  function lines(value){return value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean)}
  async function availableSlots(db,bells,from,to,reserved){
      const [holidays,examSlots,classDays]=await Promise.all([
        read(db.from('school_holidays').select('holiday_date,is_working_day').gte('holiday_date',from).lte('holiday_date',to)),
        read(db.from('v69_exam_timetable').select('exam_date,start_time,end_time').eq('class_name',bells[0].class_name).gte('exam_date',from).lte('exam_date',to)),
        read(db.from('ldm_class_calendar461').select('holiday_date,is_working_day').eq('class_name',bells[0].class_name).gte('holiday_date',from).lte('holiday_date',to))
      ]);
      
      const overrides=new Map([...holidays,...classDays].map(h=>[h.holiday_date,h.is_working_day])),slots=[];
      for(let t=Date.parse(from);t<=Date.parse(to);t+=86400000){
        const date=new Date(t),day=iso(date),weekday=date.getUTCDay();
        if(reserved.has(day)||!(overrides.get(day)??(weekday!==0)))continue;
        const periods=new Set(bells.filter(b=>String(b.day_name).toLowerCase()===dayNames[weekday].toLowerCase()).map(b=>b.period_no).filter(n=>n!=null));
        for(const period of periods){
          const bell=bells.find(b=>b.period_no===period&&String(b.day_name).toLowerCase()===dayNames[weekday].toLowerCase());
          const overlap=examSlots.some(x=>x.exam_date===day&&(!x.start_time||!x.end_time||!bell.start_time||!bell.end_time||x.start_time<bell.end_time&&bell.start_time<x.end_time));
          if(!overlap)slots.push({date:day,period});
        }
      }
    return slots;
  }
  async function open(host,db,actor,session){
    const admin=['admin','principal','super_admin'].includes(actor.role);
    host.innerHTML='<div class="s336Panel"><p>अपना पीरियड चुनें। फोटो से पहचाने गए पाठ जाँचकर एक पाठ प्रति पंक्ति रखें।</p><div class="s336Tools"><label>समय-सारणी<select id="planBell"></select></label><label>आरंभ<input type="date" id="planFrom"></label><label>अंत<input type="date" id="planTo"></label><label>टेस्ट संख्या<input type="number" min="0" step="1" value="4" id="planTests"></label><label>पाठ की फोटो<input multiple type="file" accept="image/*" id="bookPhoto"></label><label>कैमरा<input type="file" accept="image/*" capture="environment" id="bookCamera"></label></div><label>पाठ सूची<textarea id="planLessons" rows="6"></textarea></label><label>परीक्षा या अन्य आरक्षित तारीखें (YYYY-MM-DD, एक प्रति पंक्ति)<textarea id="planReserved"></textarea></label><div class="s336Tools"><button id="planBuild">योजना का प्रीव्यू</button><button id="planSave" disabled>स्वीकृत योजना सेव करें</button><button id="planLoad">सेव योजना देखें</button></div><p role="status" id="planStatus"></p><div id="planRows"></div></div>';
    const el=id=>host.querySelector('#'+id),status=s=>{if(host.isConnected)el('planStatus').textContent=s};
    const run=(button,act)=>{button.onclick=async()=>{button.disabled=true;try{await act()}catch(e){status(e.message)}finally{button.disabled=button.id==='planSave'&&!plan}}};
    let plan=null,revision=0;
    const invalidate=()=>{revision++;plan=null;el('planSave').disabled=true;el('planRows').replaceChildren()};
    host.querySelector('.s336Panel').addEventListener('input',invalidate);
    const display=items=>{const table=document.createElement('table');for(const item of items){const tr=table.insertRow();for(const value of [item.date,'घंटी '+item.period,item.topic])tr.insertCell().textContent=value}el('planRows').replaceChildren(table)};
    for(const field of ['bookPhoto','bookCamera'])el(field).onchange=async e=>{
      const input=e.target;input.disabled=true;
      try{for(const file of Array.from(input.files)){status('पाठ पढ़ रहा है…');const content=await ocr(file);if(!host.isConnected)return;invalidate();el('planLessons').value+='\n'+content}status('पाठ सूची जाँचें। एक शीर्षक प्रति पंक्ति रखें।')}
      catch(err){status(err.message)}finally{input.disabled=false;input.value=''}
    };
    if(admin)holidayImport(host,db);
    let rows=admin?await read(db.from('timetable').select('*').order('period_no').limit(2000)):await read(db.rpc('ldm_teacher_bells460'));
    if(!host.isConnected)return;
    const groups=new Map();
    for(const r of rows){
      const key=JSON.stringify([r.teacher_id||r.teacher_profile_id||r.teacher_email||r.teacher_name,r.class_name,r.section||'',r.subject]);
      if(!groups.has(key))groups.set(key,[]);
      groups.get(key).push(r);
    }
    for(const [key] of groups)el('planBell').add(new Option(JSON.parse(key).filter(Boolean).join(' · '),key));
    if(!groups.size)status('इस खाते की पहचान से जुड़ी घंटी नहीं मिली। टाइमटेबल में शिक्षक ID या ईमेल मिलाएँ।');
    run(el('planBuild'),async()=>{
      invalidate();
      const bells=groups.get(el('planBell').value)||[],from=el('planFrom').value,to=el('planTo').value;
      if(!bells.length||!from||!to||to<from||Date.parse(to)-Date.parse(from)>370*86400000)throw Error('सही घंटी और अधिकतम एक सत्र की तारीखें चुनें।');
      const lessons=lines(el('planLessons').value),count=Number(el('planTests').value);
      const reserved=new Set(lines(el('planReserved').value));
      if([...reserved].some(d=>!/^\d{4}-\d{2}-\d{2}$/.test(d)))throw Error('आरक्षित तारीख YYYY-MM-DD में दें।');
      const ticket=revision;
      const slots=await availableSlots(db,bells,from,to,reserved);if(!host.isConnected||ticket!==revision)return;
      plan=allocate(slots,lessons,count);display(plan);el('planSave').disabled=false;status(plan.length+' घंटियाँ • '+count+' टेस्ट। जाँचकर सेव करें।');
    });
    const identity=()=>({owner_id:actor.id,session_name:session,bell_key:el('planBell').value});
    run(el('planSave'),async()=>{if(!plan)throw Error('पहले प्रीव्यू बनाएं।');await read(db.rpc('ldm_save_plan460',{p_session:session,p_bell:el('planBell').value,p_plan:plan}));status('योजना सेव हुई।')});
    run(el('planLoad'),async()=>{
      invalidate();const ticket=revision;
      const chosen=el('planBell').value,records=await read(db.from('ldm_teaching_plans460').select('plan').match(identity()));
      if(!host.isConnected||ticket!==revision||el('planBell').value!==chosen)return;
      const original=records[0]?.plan||[];display(original);
      if(!original.length)return status('इस चयन की योजना नहीं मिली।');
      const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Kolkata'}).format(new Date());
      const future=original.filter(x=>x.date>=today);if(!future.length)return status('सेव योजना • सभी तारीखें बीत चुकी हैं।');
      const end=el('planTo').value||future.at(-1).date;
      const slots=await availableSlots(db,groups.get(chosen),today,end,new Set(lines(el('planReserved').value)));
      if(!host.isConnected||ticket!==revision||el('planBell').value!==chosen)return;
      let pos=0,changed=0;const next=[];
      for(const row of future){
        while(pos<slots.length&&(slots[pos].date<row.date||slots[pos].date===row.date&&Number(slots[pos].period)<Number(row.period)))pos++;
        if(pos===slots.length)return status('सत्र में पर्याप्त अगली घंटियाँ नहीं हैं। अंतिम तारीख जाँचें। सेव योजना सुरक्षित है।');
        const slot=slots[pos++];if(slot.date!==row.date||slot.period!==row.period)changed++;
        next.push({...row,...slot});
      }
      if(!changed)return status('सेव योजना कैलेंडर से मेल खाती है।');
      plan=[...original.filter(x=>x.date<today),...next];display(plan);el('planSave').disabled=false;
      status(changed+' आगामी घंटियों का संशोधन प्रस्ताव है। अपनी स्वीकृति पर ही सेव करें।');
    });
  }
  function holidayImport(host,db){
    const box=document.createElement('section');box.className='s336Panel';
    box.innerHTML='<h3>स्कूल कैलेंडर आयात करें</h3><label>कक्षा (खाली = पूरा स्कूल)<input data-calendar-class></label><label>स्थिति<select><option value="closed">बंद</option><option value="open">विशेष कार्यदिवस</option></select></label><input type="file" accept="application/pdf"><textarea rows="6" placeholder="YYYY-MM-DD छुट्टी का नाम"></textarea><button>तारीखें जाँचें</button><div></div><button disabled>चुनी हुई नई छुट्टियाँ सेव करें</button><p role="status"></p>';
    host.append(box);
    const [preview,save]=box.querySelectorAll('button'),file=box.querySelector('[type=file]'),scope=box.querySelector('[data-calendar-class]'),mode=box.querySelector('select'),area=box.querySelector('textarea'),result=box.querySelector('div'),message=box.querySelector('p');
    area.oninput=()=>{save.disabled=true;result.replaceChildren()};
    scope.oninput=mode.onchange=()=>area.oninput();
    file.onchange=async()=>{area.oninput();file.disabled=true;try{area.value=await pdfText(file.files[0]);message.textContent='आयात से पहले हर तारीख और नाम जाँचें।'}catch(e){message.textContent=e.message}finally{file.disabled=false}};
    preview.onclick=async()=>{save.disabled=true;result.replaceChildren();try{
      const source=lines(area.value),parsed=source.map(holiday),dates=[...new Set(parsed.filter(Boolean).map(r=>r.holiday_date))];
      if(dates.length>366)throw Error('एक साल की सूची चुनें।');
      const existing=new Set();
      for(let i=0;i<dates.length;i+=50){const q=scope.value.trim()?db.from('ldm_class_calendar461').select('holiday_date').eq('class_name',scope.value.trim()):db.from('school_holidays').select('holiday_date');for(const r of await read(q.in('holiday_date',dates.slice(i,i+50))))existing.add(r.holiday_date)}
      const seen=new Set();
      parsed.forEach((row,i)=>{const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';
        const valid=row&&!seen.has(row.holiday_date)&&!existing.has(row.holiday_date);input.disabled=!valid;input.checked=!!valid;input.record=row;
        if(row)seen.add(row.holiday_date);
        label.append(input,document.createTextNode((!row?'जाँच आवश्यक':valid?'नई':'पहले से दर्ज / दोहराई गई')+' · '+source[i]));result.append(label,document.createElement('br'));
      });save.disabled=!result.querySelector('input:checked');message.textContent='चुनी हुई कक्षा, तारीख और खुला/बंद स्थिति जाँचें।';
    }catch(e){message.textContent=e.message}};
    save.onclick=async()=>{save.disabled=true;try{const selected=[...result.querySelectorAll('input:checked')].map(x=>x.record);
      if(selected.length)await read(db.rpc('ldm_calendar_import461',{p_class:scope.value.trim(),p_rows:selected,p_work:mode.value==='open'}));
      result.replaceChildren();message.textContent='चयनित तारीखें सेव हुईं।';
    }catch(e){message.textContent=e.message;save.disabled=false}};
  }
  async function dayBadge(host,db){
    if(!host||host.querySelector('[data-school-day]'))return;
    const box=document.createElement('p');box.dataset.schoolDay='1';host.prepend(box);
    const date=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Kolkata'}).format(new Date());
    try{
      const rows=await read(db.from('school_holidays').select('holiday_name,is_working_day').eq('holiday_date',date));
      const special=rows[0],open=special?special.is_working_day:new Date(date).getUTCDay()!==0;
      box.textContent=date+' · स्कूल '+(open?'खुला है':'बंद है')+' · '+(special?.holiday_name||(open?'कार्यदिवस':'रविवार'));
      const exceptions=await read(db.from('ldm_class_calendar461').select('class_name,is_working_day,holiday_name').eq('holiday_date',date));
      for(const r of exceptions){const tag=document.createElement('span');tag.textContent=' · कक्षा '+r.class_name+' '+(r.is_working_day?'खुली':'बंद')+' ('+r.holiday_name+')';box.append(tag)}
    }catch{box.textContent=date+' · स्कूल कैलेंडर की पुष्टि बाकी है।'}
  }
  function drafts(host,db){
    host.innerHTML='<section class="s336Panel"><label>काम<select><option value="lesson">पाठ योजना</option><option value="paper">प्रश्नपत्र व उत्तर-कुंजी</option><option value="slides">डिजिटल बोर्ड स्लाइड</option><option value="notice">कार्यालय नोटिस</option></select></label><label>भाषा<select><option value="hi">हिन्दी</option><option value="en">English</option></select></label><label>सार्वजनिक विषय / कक्षा (व्यक्तिगत जानकारी न लिखें)<input maxlength="140"></label><div class="s336Tools"><button>स्थानीय टेम्पलेट</button><button>मुफ़्त AI ड्राफ्ट</button></div><p role="status"></p><label>समीक्षा और संपादन<textarea rows="14"></textarea></label></section>';
    const [kind,lang]=host.querySelectorAll('select'),[local,ai]=host.querySelectorAll('button'),field=host.querySelector('input'),out=host.querySelector('textarea'),status=host.querySelector('p');
    const templates={lesson:['उद्देश्य / Objective','उदाहरण / Example','गतिविधि / Activity','जाँच / Assessment'],paper:['प्रश्न 1 (2 अंक)','प्रश्न 2 (3 अंक)','प्रश्न 3 (5 अंक)','कुल 10 अंक','उत्तर-कुंजी'],slides:['स्लाइड 1 · विचार','स्लाइड 2 · उदाहरण','स्लाइड 3 · अभ्यास प्रश्न'],notice:['L D MODERN EDUCATION ACADEMY','दिनांक / Date','सूचना / Notice','प्रधानाचार्य / Principal']};
    const imageLabel=document.createElement('label'),image=document.createElement('input');
    image.type='file';image.accept='image/*';imageLabel.append('किताब का पेज पढ़ें (केवल सार्वजनिक पाठ्य सामग्री)',image);host.querySelector('section').append(imageLabel);
    image.onchange=async()=>{if(!image.files[0])return;image.disabled=true;try{const raw=await ocr(image.files[0]);out.value=raw;status.textContent='पहचाना पाठ नीचे संपादित करें। AI के लिए ऊपर केवल सार्वजनिक विषय चुनें।'}catch(e){status.textContent=e.message}finally{image.disabled=false;image.value=''}};
    const studio=document.createElement('button');studio.textContent='प्रश्नपत्र की समीक्षा और Draft Save';host.querySelector('section').append(studio);
    studio.onclick=()=>{if(kind.value!=='paper'||!out.value.trim()){status.textContent='प्रश्नपत्र चुनकर उसका ड्राफ्ट तैयार करें।';return}window.LDM_PAPER_V343.reviewText(out.value)};
    local.onclick=()=>{out.value=[field.value,...templates[kind.value]].join('\n\n');status.textContent='स्थानीय संपादन योग्य टेम्पलेट।'};
    ai.onclick=async()=>{if(!field.value.trim())return;ai.disabled=true;
      try{const auth=await db.auth.getSession();const token=auth.data?.session?.access_token;if(!token)throw Error('लॉगिन जाँचें।');
        const reply=await fetch('/api/school-draft',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({kind:kind.value,language:lang.value,topic:field.value.trim()})});
        const result=await reply.json();if(!reply.ok||!result.draft)throw Error(result.error||'AI अनुपलब्ध। स्थानीय टेम्पलेट चुनें।');out.value=result.draft;status.textContent='समीक्षा के लिए ड्राफ्ट तैयार है।';
      }catch(e){status.textContent=e.message}finally{ai.disabled=false}};
  }
  async function staff(host,db,actor){
    const admin=['admin','principal','super_admin'].includes(actor.role);
    host.innerHTML='<section class="s336Panel"><div class="s336Tools"><label>शिक्षक<select></select></label><label>माह<input type="month"></label><button>उपस्थिति और वेतन प्रीव्यू</button></div><p role="status"></p><div class="s336Scroll" data-output></div></section>';
    const select=host.querySelector('select'),month=host.querySelector('input'),btn=host.querySelector('button'),msg=host.querySelector('p'),output=host.querySelector('[data-output]');
    month.value=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Kolkata'}).format(new Date()).slice(0,7);
    let query=db.from('teacher_profiles').select('id,teacher_name,employee_id').order('teacher_name');
    if(!admin)query=query.eq('auth_user_id',actor.id);
    const teachers=await read(query);
    for(const t of teachers)select.add(new Option(t.teacher_name+' · '+(t.employee_id||'ID जोड़ें'),t.id));
    async function load(setRate=null){
      if(!select.value||!month.value){msg.textContent=!select.value?'इस खाते से शिक्षक प्रोफ़ाइल नहीं जुड़ी है। Admin Teacher Master में Login ID जाँचें।':'हाज़िरी देखने के लिए माह चुनें।';return;}btn.disabled=true;select.disabled=true;month.disabled=true;
      output.replaceChildren();msg.textContent='चुने हुए महीने की उपस्थिति पढ़ी जा रही है…';try{const d=await read(db.rpc('ldm_staff_preview464',{p_teacher:select.value,p_month:month.value+'-01',p_set_rate:setRate}));
        output.replaceChildren();const table=document.createElement('table'),header=table.createTHead().insertRow();
        for(const title of ['तारीख','स्कूल','हाज़िरी / छुट्टी','अनुमानित कटौती'])header.insertCell().textContent=title;
        for(const r of d.days){const row=table.insertRow();for(const field of [r.date,r.open?'खुला':'बंद · '+(r.calendar||'रविवार'),r.leave?'स्वीकृत छुट्टी':r.status||'—',r.deduction==null?'दर तय करें':'₹'+r.deduction])row.insertCell().textContent=field}
        output.append(table);msg.textContent=(d.warning?d.warning+' ':'')+d.name+' · '+(d.employee||'कर्मचारी ID उपलब्ध नहीं')+' · प्रति स्वीकृत छुट्टी कटौती '+(d.rate==null?'दर तय नहीं':'₹'+d.rate)+' · '+(d.payroll.some(x=>x.net!=null)?'दर्ज मासिक नेट वेतन ₹'+d.payroll.filter(x=>x.net!=null).map(x=>x.net).join(', ₹'):'इस माह का वेतन दर्ज नहीं है; उपलब्ध हाज़िरी नीचे है।');
        if(admin){const rate=document.createElement('input'),set=document.createElement('button');rate.type='number';rate.min='0';rate.step='0.01';rate.placeholder='स्वीकृत प्रति दिन दर';rate.value=d.rate??'';set.textContent='इस माह की प्रीव्यू दर सेव करें';set.onclick=()=>{if(rate.value!==''&&rate.reportValidity()){set.disabled=true;void load(rate.valueAsNumber)}};output.prepend(rate,set)}
      }catch(e){msg.textContent=window.ldmExplain464?.(e)||e.message}finally{btn.disabled=false;select.disabled=false;month.disabled=false}
    }
    btn.onclick=()=>load();select.onchange=month.onchange=()=>load();await load();
  }
  window.LDMTeaching={open,allocate,holiday,dayBadge,drafts,staff};
})();
