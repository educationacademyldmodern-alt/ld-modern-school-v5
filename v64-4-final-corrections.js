/* V64.4 final corrections — additive, non-destructive */
(()=>{'use strict';
const E=v=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const cash=v=>typeof money==='function'?money(Number(v||0)):'₹'+Number(v||0).toLocaleString('en-IN');

/* Admin Due Fee: exactly up to 3 compact notices per A4 page. Preview remains first. */
window.v57BulkNotice=function(){
 const rows=[...document.querySelectorAll('.v57Sel:checked')].map(x=>window.v57DueRows?.[Number(x.dataset.i)]).filter(Boolean);
 if(!rows.length)return typeof toast==='function'&&toast('Student select करें');
 const card=x=>`<article class="v644FeeNotice"><header><b>${E(window.school?.school_name||'L D MODERN EDUCATION ACADEMY')}</b><small>${E(window.school?.address||'Gambhiriya Bujurg, Singhapatti, Padrauna, Kushinagar, Uttar Pradesh')}</small><h3>FEE DUE NOTICE</h3></header><div class="v644Info"><span><b>Student:</b> ${E(x.student_name)}</span><span><b>Class:</b> ${E(x.class_name)}</span><span><b>Father:</b> ${E(x.father_name||'—')}</span><span><b>Adm. No.:</b> ${E(x.admission_no||'—')}</span></div><p>आपके बच्चे की विद्यालय शुल्क बकाया राशि <strong>${cash(x._due)}</strong> है। कृपया निर्धारित समय में शुल्क जमा करने का कष्ट करें। यदि शुल्क जमा हो चुका है तो इस सूचना को नजरअंदाज करें।</p><footer><span>Date: ${E(new Date().toLocaleDateString('en-IN'))}</span><span>Principal / Authorized Signatory</span></footer></article>`;
 let pages=[];for(let i=0;i<rows.length;i+=3)pages.push(`<section class="v644A4">${rows.slice(i,i+3).map(card).join('')}</section>`);
 const w=window.open('','_blank','width=1050,height=850');if(!w)return typeof toast==='function'&&toast('Popup allow करें');
 w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Fee Due Notice Preview</title><style>@page{size:A4 portrait;margin:8mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;margin:0;background:#eef3f8;color:#142b44}.tools{position:sticky;top:0;z-index:5;padding:10px;text-align:center;background:#fff;border-bottom:1px solid #ccd8e5}.tools button{padding:9px 16px;border:0;border-radius:8px;background:#124b82;color:#fff;font-weight:700;cursor:pointer}.v644A4{width:194mm;min-height:281mm;margin:8mm auto;background:#fff;display:grid;grid-template-rows:repeat(3,1fr);gap:4mm;padding:0;break-after:page;page-break-after:always}.v644A4:last-child{break-after:auto;page-break-after:auto}.v644FeeNotice{min-height:0;border:1.4px solid #173f6b;border-radius:3mm;padding:5mm 6mm;display:flex;flex-direction:column;break-inside:avoid;page-break-inside:avoid;overflow:hidden}.v644FeeNotice header{text-align:center}.v644FeeNotice header>b{display:block;font-size:16px}.v644FeeNotice header small{display:block;font-size:10px;margin-top:2px}.v644FeeNotice h3{font-size:13px;margin:4px 0;border-top:1px solid #b8c9d9;border-bottom:1px solid #b8c9d9;padding:3px}.v644Info{display:grid;grid-template-columns:1fr 1fr;gap:3px 12px;font-size:11px}.v644FeeNotice p{font-size:11px;line-height:1.35;margin:5px 0;flex:1}.v644FeeNotice footer{display:flex;justify-content:space-between;gap:10px;font-size:10px;font-weight:700}@media print{body{background:#fff}.tools{display:none}.v644A4{margin:0;width:auto;min-height:281mm}.v644FeeNotice{box-shadow:none}}</style></head><body><div class="tools"><button onclick="print()">Print / Save PDF</button> &nbsp; ${rows.length} Student • ${pages.length} A4 Page</div>${pages.join('')}</body></html>`);w.document.close();
};

/* Avoid misleading Student-not-found on stale teacher row IDs: re-resolve from current teacher class cache when possible. */
if(typeof window.teacherAssertStudent==='function'){
 window.teacherAssertStudent=async function(studentId){
  await window.v14LoadTeacherContext?.();
  let r=await sb.from('students').select('*').eq('id',studentId).maybeSingle(),s=r.data;
  if((r.error||!s)&&window.teacherClassRows){const old=(window.teacherClassRows||[]).find(x=>String(x.id)===String(studentId));if(old?.admission_no){let z=await sb.from('students').select('*').eq('admission_no',old.admission_no).maybeSingle();if(!z.error)s=z.data}}
  if(!s){toast('Student record refresh करें और फिर खोलें.');return null}
  const allowed=typeof v14AllowedClassNames==='function'?v14AllowedClassNames():[];
  if(!allowed.includes(s.class_name)){toast('यह student आपकी assigned class में नहीं है');return null}
  return s;
 };
}

/* Every ERP route opens at top and mobile sidebar closes after a selection. */
function settle(){try{document.querySelector('#erp aside')?.classList.remove('open');document.querySelector('#erp main')?.scrollTo?.({top:0,left:0});document.getElementById('erpContent')?.scrollTo?.({top:0,left:0});window.scrollTo(0,0)}catch(_){}}
if(typeof window.render==='function'){const base=window.render;window.render=async function(){const r=await base.apply(this,arguments);setTimeout(settle,0);return r}}
document.addEventListener('click',e=>{if(e.target.closest('#erpNav button'))setTimeout(settle,0)},true);
})();
