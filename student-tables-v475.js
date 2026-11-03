// Identify columns from the displayed header so imports and reordered tables keep the right identity.
(function () {
  const host=document.getElementById('erpContent');
  if (!host) return;
  const style=document.createElement('style');
  style.media='screen';
  document.head.appendChild(style);
  const layouts=new Set();
  function mark(table) {
    if (!table || !host.contains(table) || table.closest('[id*="Print"],[id*="Preview"]')) return;
    const header=table.tHead?.rows[0] || table.rows[0];
    if (!header) return;
    const labels=Array.from(header.cells,c=>c.textContent.trim().toLowerCase().replace(/_/g,' '));
    const name=labels.findIndex(x=>/student name|student’s name|विद्यार्थी|छात्र का नाम|^student$/.test(x));
    const father=labels.findIndex(x=>/father|पिता/.test(x));
    const wrap=table.parentElement;
    if (name<0 || father<0 || father===name || !wrap || wrap.children.length!==1) return;
    const key='s'+name+'f'+father;
    table.dataset.studentGrid475=key;wrap.classList.add('studentScroll475');
    if(layouts.has(key))return;
    layouts.add(key);
    const grid='#erp #erpContent table[data-student-grid475="'+key+'"] > ';
    const col=i=>['thead','tbody','tfoot'].map(part=>grid+part+' > tr > :nth-child('+(i+1)+')').join(',');
    style.sheet.insertRule(col(name)+','+col(father)+'{position:sticky!important;box-sizing:border-box!important;width:var(--student-pin)!important;min-width:var(--student-pin)!important;max-width:var(--student-pin)!important;background:var(--student-bg)!important;color:var(--student-ink)!important;overflow-wrap:anywhere!important;white-space:normal!important;z-index:2}');
    style.sheet.insertRule(col(name)+'{left:0!important}');
    style.sheet.insertRule(col(father)+'{left:var(--student-pin)!important}');
  }
  const pending=new Set();let frame=0;
  function add(el) {
    if(el.nodeType!==1)return;
    if(el.tagName==='TABLE')pending.add(el);
    else if(el.closest('table'))pending.add(el.closest('table'));
    else el.querySelectorAll('table').forEach(t=>pending.add(t));
  }
  new MutationObserver(records=>{
    for(const r of records) for(const n of r.addedNodes)add(n);
    if(pending.size&&!frame)frame=requestAnimationFrame(()=>{frame=0;pending.forEach(mark);pending.clear()});
  }).observe(host,{childList:true,subtree:true});
  host.querySelectorAll('table').forEach(mark);
})();
