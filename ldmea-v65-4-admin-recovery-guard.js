/* LDMEA V65.4 — Primary Admin recovery guard. Single authoritative client handler. */
(()=>{'use strict';
const KEY='ldmea_admin_recovery_next_v654', COOLDOWN=30*60*1000;
const $=id=>document.getElementById(id);
const left=()=>Math.max(0,Number(localStorage.getItem(KEY)||0)-Date.now());
const fmt=ms=>Math.max(1,Math.ceil(ms/60000))+' मिनट';
function sync(){const b=$('v95SendRecovery'),s=$('v95RecoveryStatus'),ms=left();if(!b)return;b.disabled=!!ms||!!window.__v654RecoveryBusy;if(ms&&s)s.textContent='Recovery link पहले भेजा जा चुका है. लगभग '+fmt(ms)+' बाद दोबारा कोशिश करें.'}
window.v95SendAdminRecovery=async function(){const b=$('v95SendRecovery'),s=$('v95RecoveryStatus');if(window.__v654RecoveryBusy)return;const wait=left();if(wait){sync();return}window.__v654RecoveryBusy=true;sync();if(s)s.textContent='Recovery request check हो रहा है...';try{const r=await fetch('/api/admin-forgot',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});const j=await r.json().catch(()=>({}));if(!r.ok){if(r.status===429)localStorage.setItem(KEY,String(Date.now()+COOLDOWN));throw new Error(j.error||'Recovery request failed')}localStorage.setItem(KEY,String(Date.now()+COOLDOWN));if(s)s.innerHTML='<b>✓ Recovery link sent</b><br>'+(window.esc?esc(j.message||'Primary Admin registered email check करें.'):j.message||'Primary Admin registered email check करें.')+(j.masked_email?' ('+(window.esc?esc(j.masked_email):j.masked_email)+')':'')}catch(e){if(s)s.textContent=e.message||String(e)}finally{window.__v654RecoveryBusy=false;sync()}};
window.addEventListener('storage',e=>{if(e.key===KEY)sync()});
setInterval(sync,30000);document.addEventListener('click',e=>{if(e.target?.id==='v95SendRecovery')setTimeout(sync,0)},true);
})();
