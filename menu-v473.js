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
  const extraRoutes={v305ExamNav:'exam_automation_center',u306Nav:'udise_reconciliation',v307Nav:'absence_followup',v308FeeNav:'combined_fee',r320ReminderNav:'daily_reminders',x320Nav:'central_exam',sf424Nav:'school_forms',v53CompleteNav:'v53_complete_hub',v53TeacherDueNav:'teacher_due_fee'};
  function routeOf(b){return b.dataset.route||extraRoutes[b.id]||(b.hasAttribute('data-admin-fee459')?'admin_class_fee_status':'')||(b.hasAttribute('data-v649-idcard')?'idcard_center':'')||(b.hasAttribute('data-v65-selfatt')?'v65_teacher_attendance':'')||(b.getAttribute('onclick')||'').match(/\brender\s*\(\s*['"]([^'"]+)['"]/)?.[1]||'';}
  function role(){try{return String((typeof profile!=='undefined'?profile:window.profile)?.role||'').toLowerCase()}catch(_){return ''}}
  function hindi(){try{return window.LDM_V337_UI?.language?.()==='hi'}catch(_){return false}}
  function arrange(nav){
    const r=role();if(!['teacher','admin','super_admin','principal','accountant'].includes(r)){delete nav.dataset.ldm565Owner;return;}
    nav.dataset.ldm565Owner=r==='teacher'?'teacher':'admin';
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
        const group=groups.find(g=>g.dataset.ldm565Section===String({'students':0,'fee & accounts':2,'exam & results':3}[dest])||g.querySelector('summary')?.textContent.toLowerCase().includes(dest));
        const body=group?.querySelector(':scope > div');if(body)body.appendChild(b);
      }
    }
  }
  // V572: selection reflects the current page, not the last click. Only existing menu nodes are marked.
  const aliases={teacher_fee:'fees',exam_marks_entry_470:'central_exam'};
  const normalized=r=>aliases[String(r||'')]||String(r||'');
  function actualRoute(fallback){
    // The old Master Plan directly calls head() without setting a route.
    if(document.querySelector('#erpContent .v53Hub') && document.getElementById('erpTitle')?.textContent.trim()==='Master Plan')return 'v53_complete_hub';
    return fallback||window.__v90Route||'dashboard';
  }
  let preferred=null;
  function sync(route){
    const nav=document.getElementById('erpNav');if(!nav?.dataset.ldm565Owner)return;
    const current=normalized(actualRoute(route));
    const buttons=[...nav.querySelectorAll('button')];
    const available=b=>!b.hidden&&!b.classList.contains('hidden')&&b.style.display!=='none'&&b.getAttribute('aria-hidden')!=='true';
    const candidates=buttons.filter(b=>available(b)&&normalized(routeOf(b))===current&&current);
    const selected=(preferred&&candidates.includes(preferred)?preferred:null)||candidates.find(b=>b.getAttribute('aria-current')==='page')||candidates[0]||null;
    const group=selected?.closest('details')||null;
    const changed=nav._menu572Route!==current||nav._menu572Selected!==selected;
    for(const b of buttons){if(b===selected){if(b.getAttribute('aria-current')!=='page')b.setAttribute('aria-current','page')}else if(b.getAttribute('aria-current')==='page')b.removeAttribute('aria-current');}
    for(const g of nav.querySelectorAll('details')){const active=g===group;if(active!==g.hasAttribute('data-menu572-current'))g.toggleAttribute('data-menu572-current',active);}
    if(changed&&group&&!group.open)group.open=true;
    nav._menu572Route=current;nav._menu572Selected=selected;
  }
  window.LDM_MENU_ACTIVE_V572={sync};
  function start() {
    const nav=document.getElementById('erpNav');if(!nav||nav._menu565Observer)return;nav._menu565Observer=true;
    let queued=false;
    const settle=()=>{queued=false;arrange(nav);nav.querySelectorAll('button,summary').forEach(decorate);sync();};
    nav.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!nav.contains(b)||b.disabled)return;preferred=b;
      // Preserve native click/permissions. A leaf click closes an open overlay, not a category summary.
      queueMicrotask(()=>{const aside=nav.closest('aside');if(aside?.classList.contains('open'))aside.classList.remove('open');document.body.classList.remove('d378MenuOpen');document.querySelectorAll('#erp .erpTop :is(.hamb,#d378Menu,#ldm538AdminProfile)').forEach(x=>{if(x.getAttribute('aria-expanded')!=='false')x.setAttribute('aria-expanded','false')});sync();});
    },true);
    // Sync on opening a drawer even for legacy direct-open handlers. No route is changed.
    window.addEventListener('click',e=>{if(e.target.closest?.('#erp .erpTop .hamb'))sync();},true);
    const schedule=()=>{if(!queued){queued=true;queueMicrotask(settle)}};
    settle();
    new MutationObserver(schedule).observe(nav,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
