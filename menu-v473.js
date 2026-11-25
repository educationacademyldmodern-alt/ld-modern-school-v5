(() => {
  const leadingIcon = /^\s*((?:\p{Extended_Pictographic}|[₹✅✓☎→←])(?:\uFE0F|\p{Emoji_Modifier}|\u200D\p{Extended_Pictographic})*)\s*/u;
  function iconFor(label) {
    if (/class|student|विद्यार्थी/i.test(label)) return '🎓';
    if (/fee|salary|फीस/i.test(label)) return '💰';
    if (/profile|teacher/i.test(label)) return '👤';
    if (/mark|exam|अंक/i.test(label)) return '📊';
    if (/time|bell/i.test(label)) return '🔔';
    if (/attendance/i.test(label)) return '📅';
    if (/logout/i.test(label)) return '🚪';
    return '📋';
  }
  function decorate(item) {
    if(item.dataset.menu473 || item.hidden || item.style.display==='none') return;
    const walker=document.createTreeWalker(item,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode()) && !node.nodeValue.trim()) {}
    if(!node) return;
    const match=node.nodeValue.match(leadingIcon);
    item.dataset.menu473=match ? match[1] : iconFor(item.textContent);
    if(match)node.nodeValue=node.nodeValue.slice(match[0].length);
  }
  const teacherSections=[
    ['profile','👤 Profile & Class','प्रोफाइल एवं कक्षा',['teacher_profile','teacher_class','v93_teacher_password','idcard_center']],
    ['attendance','📅 Attendance','उपस्थिति',['attendance','master_attendance','v65_teacher_attendance','absence_followup']],
    ['academic','📚 Teaching & Exams','शिक्षण एवं परीक्षा',['teacher_bells','v90_teacher_daily','teacher_schedule','teaching_diary','academic_monitor','homework','v90_teacher_marks','v65_smart_marks','exams','class_opinions','teacher_reports']],
    ['work','📋 Assigned Work & Notices','आवंटित कार्य एवं सूचनाएँ',['assigned_work','smart_work_alarm','v90_my_requests','teacher_notices','my_notes']],
    ['fee','₹ Fee Status','शुल्क स्थिति',['fees','teacher_fee']]
  ];
  const extraRoutes={v305ExamNav:'exam_automation_center',u306Nav:'udise_reconciliation',v307Nav:'absence_followup',v308FeeNav:'combined_fee'};
  function routeOf(b){return b.dataset.route||extraRoutes[b.id]||(b.hasAttribute('data-admin-fee459')?'admin_class_fee_status':'')||(b.hasAttribute('data-v649-idcard')?'idcard_center':'')||(b.hasAttribute('data-v65-selfatt')?'v65_teacher_attendance':'')||(b.getAttribute('onclick')||'').match(/\brender\s*\(\s*['"]([^'"]+)['"]/)?.[1]||'';}
  function role(){try{return String((typeof profile!=='undefined'?profile:window.profile)?.role||'').toLowerCase()}catch(_){return ''}}
  function hindi(){try{return window.LDM_V337_UI?.language?.()==='hi'}catch(_){return false}}
  function arrange(nav){
    const r=role();if(!['teacher','admin','super_admin','principal','accountant'].includes(r))return;
    nav.parentElement.classList.add('ldm562Sidebar');
    nav.classList.add('ldm562Nav');
    if(r==='teacher'){
      for(const b of [...nav.children].filter(x=>x.matches('button'))){
        const route=routeOf(b);if(route==='dashboard')continue;
        const spec=teacherSections.find(x=>x[3].includes(route));if(!spec)continue;
        let group=nav.querySelector('[data-ldm562-group="'+spec[0]+'"]');
        if(!group){group=document.createElement('details');group.className='v90NavGroup ldm562TeacherGroup';group.dataset.ldm562Group=spec[0];const summary=document.createElement('summary'),span=document.createElement('span'),arrow=document.createElement('b'),body=document.createElement('div');span.textContent=hindi()?spec[2]:spec[1];arrow.textContent='⌄';summary.append(span,arrow);group.append(summary,body);if(b.classList.contains('active'))group.open=true;nav.insertBefore(group,b);}
        group.lastElementChild.appendChild(b);
      }
    }else{
      const groups=[...nav.children].filter(x=>x.matches('details.v90NavGroup:not(.ldm562TeacherGroup)'));
      const targets={admin_class_fee_status:'fee & accounts',combined_fee:'fee & accounts',exam_automation_center:'exam & results',udise_reconciliation:'students',absence_followup:'students'};
      for(const b of [...nav.children].filter(x=>x.matches('button'))){
        const dest=targets[routeOf(b)];if(!dest)continue;
        // Only relocate existing authorized nodes; never manufacture a route.
        const group=groups.find(g=>g.querySelector('summary')?.textContent.toLowerCase().includes(dest));
        const body=group?.querySelector(':scope > div');if(body)body.appendChild(b);
      }
    }
  }
  function start() {
    const nav=document.getElementById('erpNav');if(!nav)return;
    let queued=false;
    const settle=()=>{queued=false;arrange(nav);nav.querySelectorAll('button,summary').forEach(decorate);};
    const schedule=()=>{if(!queued){queued=true;queueMicrotask(settle)}};
    settle();
    new MutationObserver(schedule).observe(nav,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
