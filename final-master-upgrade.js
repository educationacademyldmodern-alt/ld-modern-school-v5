/* FINAL MASTER UPGRADE — official report center + safe print */
(()=>{
 const E=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const D=()=>new Date().toISOString().slice(0,10), money2=n=>'₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2});
 const defs={
  fee:{icon:'💳',title:'Daily Fee Collection',table:'fees',date:'date',cols:[['receipt_no','Receipt No.'],['admission_no','Admission No.'],['student_name','Student'],['class_name','Class'],['fee_head','Fee Head'],['fee_month','Month'],['payment_mode','Mode'],['paid_amount','Amount']],sum:'paid_amount'},
  due:{icon:'🔔',title:'Due Fee Report',table:'fees',date:'due_date',cols:[['admission_no','Admission No.'],['student_name','Student'],['class_name','Class'],['phone','Mobile'],['fee_month','Month'],['due_amount','Due']],sum:'due_amount'},
  student_att:{icon:'✅',title:'Student Attendance',table:'attendance',date:'date',cols:[['admission_no','Admission No.'],['student_name','Student'],['class_name','Class'],['status','Status'],['remark','Remark']]},
  staff_att:{icon:'👩‍🏫',title:'Teacher / Staff Attendance',table:'staff_attendance',date:'date',cols:[['employee_id','Employee ID'],['staff_name','Name'],['status','Status'],['remark','Remark']]},
  admission:{icon:'🎓',title:'Admission Register',table:'admissions',date:'created_at',cols:[['registration_id','Registration ID'],['admission_no','Admission No.'],['student_name','Student'],['father_name','Father'],['class_name','Class'],['phone','Mobile'],['status','Status']]},
  staff:{icon:'🪪',title:'Teacher / Staff Register',table:'staff',date:'created_at',cols:[['employee_id','Employee ID'],['staff_name','Name'],['staff_type','Type'],['designation','Designation'],['subject','Subject'],['phone','Mobile'],['status','Status']]},
  income:{icon:'📈',title:'Income Report',table:'income',date:'date',cols:[['voucher_no','Voucher'],['source','Source'],['description','Description'],['amount','Amount']],sum:'amount'},
  expense:{icon:'📉',title:'Expense Report',table:'expenses',date:'date',cols:[['voucher_no','Voucher'],['category','Category'],['description','Description'],['amount','Amount']],sum:'amount'},
  teaching:{icon:'📚',title:'Daily Teaching Update',table:'teaching_updates',date:'update_date',cols:[['teacher_name','Teacher'],['class_name','Class'],['period_no','Bell'],['subject','Subject'],['lesson_topic','Topic'],['work_done','Work Done'],['homework','Homework']]}
 };
 window.finalMasterReports=async function(){
  if(typeof v14Admin==='function'&&!v14Admin())return toast('Admin permission required');
  head('Master Reports','Official A4 • Preview • Print / PDF • Live database');
  $('erpContent').innerHTML=`<div class="panel"><div class="panelHead"><div><h3>📑 Master Official Reports</h3><p class="note">Report database से live बनेगी; generated PDF Supabase में store नहीं होगी.</p></div></div><div class="fmReportGrid">${Object.entries(defs).map(([k,x])=>`<button onclick="fmOpen('${k}')"><span>${x.icon}</span>${E(x.title)}</button>`).join('')}</div></div>`;
 };
 const reportTypes524={fee:'collection',student_att:'attendance',staff_att:'staff_attendance',admission:'admissions',staff:'staff',income:'income',expense:'expenses',teaching:'teaching'};
 window.fmOpen=async function(k){let x=defs[k];if(!x)return;if(k==='due')return window.render('v200_due_fee_report');head(x.title,'Official Report • A4 Preview');let d=D(),type=reportTypes524[k],spec=window.LDM_REPORTS?.registry[type],fields=window.LDM_REPORTS?.filterFields?.[type]||[],labels={admission_no:'Student admission number (exact)',employee_id:'Employee ID (exact)',teacher_name:'Teacher name (exact)',section:'Section (exact)',academic_session:'Academic session'};
 $('erpContent').innerHTML=`<div class="panel"><div class="fmFilters">${spec?.date?`<label>From<input id="fmFrom" type="date" value="${d}"></label><label>To<input id="fmTo" type="date" value="${d}"></label>`:''}${['attendance','admissions','teaching','students','due'].includes(type)?'<label>Class<input id="fmClass" placeholder="All Classes"></label>':''}${fields.map(field=>`<label>${labels[field]}<input id="fm524_${field}" placeholder="All"></label>`).join('')}<label>Search<input id="fmSearch" type="search" placeholder="Name / ID / other text"></label><button class="primary" onclick="fmLoad('${k}')">Generate Report</button><button class="secondary" onclick="finalMasterReports()">← Reports</button></div></div><div id="fmReportHost"></div>`;await fmLoad(k)};

 let reportTicket521=0,reportAbort523=null;
 window.fmLoad=async function(k){
  if(k==='due')return window.render('v200_due_fee_report');const host=$('fmReportHost'),mine=++reportTicket521,a=$('fmFrom')?.value||'',b=$('fmTo')?.value||'';
  if(!host)return;if(a&&b&&a>b){host.textContent='From date must be before To date';return}
  const types={fee:'collection',student_att:'attendance',staff_att:'staff_attendance',admission:'admissions',staff:'staff',income:'income',expense:'expenses',teaching:'teaching'},type=types[k];
  reportAbort523?.abort();const request523=new AbortController();reportAbort523=request523;const who523=String(user?.id||''),current523=()=>mine===reportTicket521&&host.isConnected&&String(user?.id||'')===who523;host.textContent='Loading official report…';
  try{if(!window.LDM_REPORTS)throw Error('Report module unavailable. Reload page.');const filters={from:a,to:b,class:$('fmClass')?.value.trim()||'',search:$('fmSearch')?.value.trim()||''};
   for(const field of window.LDM_REPORTS.filterFields?.[type]||[]){const value=$('fm524_'+field)?.value.trim();if(value)filters[field]=value}const rows=await window.LDM_REPORTS.collect(type,filters,request523.signal);if(!current523())return;
   host.innerHTML='<div class="fmPrintActions"><button id="fm521Print">A4 Preview / PDF / Print</button></div><section id="fmPrintable">'+window.LDM_REPORTS.html(type,rows,filters)+'</section>';
   $('fm521Print').onclick=()=>window.LDM_A4_V337.preview('fmPrintable',defs[k].title);
   try{await sb.from('report_audit').insert({report_type:k,date_from:a||null,date_to:b||null,generated_by:user?.id||null})}catch(_e){}
  }catch(e){if(current523()&&!request523.signal.aborted)host.textContent=e.message||String(e)}
 };

 // Wrap the final route, preserving every existing route and design.
 const base=window.render;window.render=function(p){if(p==='reports'||p==='master_reports')return finalMasterReports();return base.apply(this,arguments)};
})();
