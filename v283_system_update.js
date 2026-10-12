(function(){
'use strict';
if(window.__LDM_V283_SYSTEM_UPDATE)return; window.__LDM_V283_SYSTEM_UPDATE=true;
const BUILD='V283-SYSTEM-UPDATE-CENTER-2026-10-12';
window.LDM_FINAL_BUILD=BUILD;
const $=id=>document.getElementById(id);
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isAdmin=()=>{const r=String(window.profile?.role||'').toLowerCase();return ['admin','super_admin','principal'].includes(r)};
const fmtBytes=n=>{n=Number(n||0);if(n<1024)return n+' B';if(n<1048576)return (n/1024).toFixed(1)+' KB';if(n<1073741824)return (n/1048576).toFixed(1)+' MB';return (n/1073741824).toFixed(2)+' GB'};
function installNav(){
 if(!isAdmin())return; const nav=$('erpNav'); if(!nav||nav.querySelector('[data-v283-update]'))return;
 const b=document.createElement('button'); b.dataset.v283Update='1'; b.innerHTML='🛠 System & Update'; b.onclick=()=>window.render?.('system_update_center'); nav.appendChild(b);
}
function installDashboardCard(){
 if(!isAdmin()||String(window.__v90Route||'')!=='dashboard')return; const host=$('erpContent'); if(!host||host.querySelector('[data-v283-dash]'))return;
 const section=[...host.querySelectorAll('.v90ManagementPanel,.v114ManagementPanel')][0]||host;
 const btn=document.createElement('button');btn.className='v90Monitor v283DashCard';btn.dataset.v283Dash='1';btn.onclick=()=>window.render?.('system_update_center');btn.innerHTML='<span class="v90MonitorIcon">🛠</span><span><b>System & Update Center</b><small>Health • Version • Backup • Security • Safe Update</small></span><em>›</em>';
 const grid=section.querySelector('.v90MonitorGrid')||section;grid.appendChild(btn);
}
function installSettingsCard(){
 if(!isAdmin()||String(window.__v90Route||'')!=='settings')return;const host=$('erpContent');if(!host||host.querySelector('[data-v283-settings]'))return;
 const box=document.createElement('div');box.className='panel';box.dataset.v283Settings='1';box.innerHTML='<div class="panelHead"><div><h3>🛠 System & Update Center</h3><p class="note">Version, health, backup, security और safe package validation एक जगह.</p></div><button class="primary" onclick="render(\'system_update_center\')">Open Center</button></div>';
 host.prepend(box);
}
window.v283SystemUpdateCenter=function(){
 if(!isAdmin())return window.toast?.('Admin / Principal only');
 window.surface?.('erp'); window.__v90Route='system_update_center';
 try{window.v90Head?.('🛠 System & Update Center','Safe Update • Health • Backup • Security');window.v90InstallShell?.('system_update_center')}catch(_e){try{window.head?.('System & Update Center','Safe Update • Health • Backup • Security')}catch(_e2){}}
 const host=$('erpContent'); if(!host)return;
 const preview=/\.vercel\.app$/i.test(location.hostname)&&!/^(www\.)?(myldm\.com)$/i.test(location.hostname);
 host.innerHTML=`<div class="v283Center">
 <section class="v283Hero"><div class="v283HeroTop"><div><h2>🛠 System & Update Center</h2><p>Controlled updates only — ERP browser से production code overwrite नहीं करेगा.</p></div><span class="v283Version">${safe(BUILD)}</span></div><div class="v283Meta"><div><small>Current Host</small><b>${safe(location.hostname||'local')}</b></div><div><small>Environment</small><b>${preview?'Preview / Test':'Production / Custom Domain'}</b></div><div><small>Update Mode</small><b>GitHub / Vercel Controlled</b></div></div></section>
 <div class="v283Grid">
  <section class="v283Card"><div class="v283CardHead"><span class="v283Icon">🩺</span><div><h3>System Health</h3><p>On-demand checks only; कोई background polling नहीं.</p></div></div><div class="v283Actions"><button class="primary" onclick="v283RunHealth()">Run Health Check</button><button onclick="render('system_health')">Open Full Health</button></div><div id="v283Health" class="v283Result">Check अभी run नहीं किया गया.</div></section>
  <section class="v283Card"><div class="v283CardHead"><span class="v283Icon">🔐</span><div><h3>Security Audit</h3><p>HTTPS, session, role और deployment safety check.</p></div></div><div class="v283Actions"><button class="primary" onclick="v283RunSecurity()">Run Security Audit</button></div><div id="v283Security" class="v283Result">Audit on-demand है.</div></section>
  <section class="v283Card wide"><div class="v283CardHead"><span class="v283Icon">⬆️</span><div><h3>Update Package Validator</h3><p>ZIP को browser में local validate करें; production पर automatic apply नहीं होगा.</p></div></div><div class="v283Actions"><label class="v283FileBtn primary">Choose Update ZIP<input id="v283UpdateFile" type="file" accept=".zip,application/zip,application/x-zip-compressed" onchange="v283ValidateUpdate(this.files?.[0])"></label><button id="v283CopyDeploy" disabled onclick="v283CopyDeployChecklist()">Copy Deployment Checklist</button><button disabled title="Security rule: deployment remains GitHub/Vercel controlled">Apply Update (Controlled)</button></div><div id="v283UpdateResult" class="v283Result">कोई package selected नहीं है.</div><div class="v283Notice v283Danger"><b>Safety:</b> arbitrary HTML/JS upload करके live ERP overwrite नहीं होगा. Validated package को Preview branch → Vercel Preview → live test के बाद Production में deploy करें.</div></section>
  <section class="v283Card"><div class="v283CardHead"><span class="v283Icon">💾</span><div><h3>Backup / Restore Status</h3><p>Existing safe backup flow reuse होता है; destructive auto-restore नहीं.</p></div></div><div class="v283Actions"><button class="safe" onclick="v283BackupNow()">Download Backup</button><button onclick="v283RestoreInfo()">Restore Guidance</button></div><div id="v283Backup" class="v283Result">Backup manually download करें और सुरक्षित रखें.</div></section>
  <section class="v283Card"><div class="v283CardHead"><span class="v283Icon">📋</span><div><h3>Version & Changelog</h3><p>Current build और update validation history.</p></div></div><div id="v283VersionInfo" class="v283Result good"><b>${safe(BUILD)}</b><br>V282 root-clean baseline + safe System & Update Center. No new SQL required.</div><div class="v283Actions" style="margin-top:10px"><button onclick="v283ShowHistory()">Validation History</button></div></section>
 </div></div>`;
 installNav(); window.scrollTo(0,0);
};
window.v283RunHealth=async function(){
 const box=$('v283Health');if(!box)return;box.className='v283Result';box.innerHTML='Checking…';
 const checks=[];const add=(ok,name,detail,warn=false)=>checks.push({ok,name,detail,warn});
 add(location.protocol==='https:'||['localhost','127.0.0.1'].includes(location.hostname),'HTTPS',location.protocol);
 add(!!window.sb,'Database client',window.sb?'Supabase client loaded':'Not available');
 try{const s=await window.sb?.auth?.getSession?.();add(!s?.error&&!!s?.data?.session,'Login session',s?.data?.session?'Authenticated':'No active session',!s?.data?.session)}catch(e){add(false,'Login session',e.message||String(e))}
 try{if(window.sb){const r=await window.sb.from('school_settings').select('id').eq('id',1).maybeSingle();add(!r.error,'Database read',r.error?.message||'school_settings reachable')}else add(false,'Database read','Client unavailable')}catch(e){add(false,'Database read',e.message||String(e))}
 try{if(window.sb){const r=await window.sb.rpc('ldm_v278_delegation_health');add(!r.error,'Delegation health',r.error?.message||'RPC ready',!!r.error)}else add(false,'Delegation health','Client unavailable')}catch(e){add(false,'Delegation health',e.message||String(e),true)}
 const critical=['./runtime_guard.js?v=V280','./v280_root.js?v=V280','./erp_styles_v277.css','./school-logo.png'];
 try{const rs=await Promise.all(critical.map(u=>fetch(u,{method:'HEAD',cache:'no-store'}).then(r=>r.ok).catch(()=>false)));add(rs.every(Boolean),'Core assets',rs.every(Boolean)?'Critical local files reachable':'One or more local files missing')}catch(e){add(false,'Core assets',e.message||String(e))}
 const bad=checks.filter(x=>!x.ok&&!x.warn).length,warn=checks.filter(x=>!x.ok&&x.warn).length;box.className='v283Result '+(bad?'bad':warn?'warn':'good');box.innerHTML='<div class="v283Checks">'+checks.map(x=>`<div class="v283Check"><span class="v283Status ${x.ok?'ok':x.warn?'warn':'bad'}">${x.ok?'✓':x.warn?'!':'✕'}</span><strong>${safe(x.name)}</strong><small>${safe(x.detail)}</small></div>`).join('')+'</div>';
};
window.v283RunSecurity=async function(){
 const box=$('v283Security');if(!box)return;const role=String(window.profile?.role||'unknown');let session=false;try{session=!!(await window.sb?.auth?.getSession?.())?.data?.session}catch(_e){}
 const preview=/\.vercel\.app$/i.test(location.hostname)&&!/^(www\.)?myldm\.com$/i.test(location.hostname);
 const rows=[
  [location.protocol==='https:','HTTPS transport',location.protocol],
  [session,'Authenticated session',session?'Active':'Missing'],
  [isAdmin(),'Admin authorization',role],
  [true,'Direct code overwrite','Blocked by design'],
  [true,'Update deployment','GitHub/Vercel controlled'],
  [true,'Background update polling','Not used'],
  [true,'Environment',preview?'Preview/Test':'Production/Custom']
 ];
 const bad=rows.filter(x=>!x[0]).length;box.className='v283Result '+(bad?'warn':'good');box.innerHTML='<div class="v283Checks">'+rows.map(x=>`<div class="v283Check"><span class="v283Status ${x[0]?'ok':'warn'}">${x[0]?'✓':'!'}</span><strong>${safe(x[1])}</strong><small>${safe(x[2])}</small></div>`).join('')+'</div>';
};
window.v283ValidateUpdate=async function(file){
 const box=$('v283UpdateResult'),copy=$('v283CopyDeploy');if(!box||!file)return;copy.disabled=true;box.className='v283Result';box.textContent='Validating locally…';
 try{const head=new Uint8Array(await file.slice(0,4).arrayBuffer());const zip=head[0]===0x50&&head[1]===0x4b&&(head[2]===0x03||head[2]===0x05||head[2]===0x07);if(!zip)throw new Error('यह valid ZIP signature नहीं है.');
 const hashBuf=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());const hash=[...new Uint8Array(hashBuf)].map(b=>b.toString(16).padStart(2,'0')).join('');
 const big=file.size>100*1024*1024;window.__v283Package={name:file.name,size:file.size,hash,at:new Date().toISOString()};
 try{let h=JSON.parse(localStorage.getItem('ldm_update_validation_history')||'[]');h.unshift(window.__v283Package);localStorage.setItem('ldm_update_validation_history',JSON.stringify(h.slice(0,10)))}catch(_e){}
 box.className='v283Result '+(big?'warn':'good');box.innerHTML=`<b>✓ ZIP signature valid</b><br>Name: ${safe(file.name)}<br>Size: ${safe(fmtBytes(file.size))}${big?'<br>⚠ Large package: Preview deployment पर विशेष test करें.':''}<br>SHA-256: <span style="font-family:monospace">${safe(hash)}</span><br><b>Next:</b> Preview branch में deploy → login/workflow test → Production.`;copy.disabled=false;
 }catch(e){box.className='v283Result bad';box.textContent=e.message||String(e)}
};
window.v283CopyDeployChecklist=async function(){
 const p=window.__v283Package;if(!p)return window.toast?.('पहले ZIP validate करें');const txt=`LDM ERP SAFE UPDATE CHECKLIST\nPackage: ${p.name}\nSHA-256: ${p.hash}\n1. Backup download करें\n2. Preview branch पर package files deploy करें\n3. Vercel Preview build PASS देखें\n4. Admin + Teacher login test करें\n5. Fee Search/Pay, Daily Work, Back/Home/Refresh test करें\n6. SQL केवल package instructions में required हो तभी run करें\n7. सब live PASS होने के बाद Production promote करें\n8. Previous production deployment rollback के लिए सुरक्षित रखें`;
 try{await navigator.clipboard.writeText(txt);window.toast?.('Deployment checklist copied')}catch(_e){window.prompt('Copy checklist',txt)}
};
window.v283BackupNow=function(){const box=$('v283Backup');try{if(typeof window.downloadBackup==='function'){window.downloadBackup();if(box){box.className='v283Result good';box.textContent='Backup download requested. File को device/cloud में सुरक्षित रखें.'}}else throw new Error('Backup function unavailable')}catch(e){if(box){box.className='v283Result bad';box.textContent=e.message||String(e)}}};
window.v283RestoreInfo=function(){const box=$('v283Backup');if(box){box.className='v283Result warn';box.innerHTML='<b>Restore safety:</b> live database पर automatic restore नहीं किया जाता. Backup को पहले verify करें, Preview/Test environment में restore procedure test करें, फिर controlled database restore करें.'}};
window.v283ShowHistory=function(){let h=[];try{h=JSON.parse(localStorage.getItem('ldm_update_validation_history')||'[]')}catch(_e){};const box=$('v283VersionInfo');if(!box)return;box.className='v283Result';box.innerHTML=h.length?'<b>Recent local validations</b><br>'+h.map(x=>`${safe(new Date(x.at).toLocaleString())} • ${safe(x.name)} • ${safe(fmtBytes(x.size))}<br><small>${safe(x.hash)}</small>`).join('<br>'):'No local package validation history yet.'};
const base=window.render;
if(typeof base==='function'&&!base.__v283){const f=async function(route){route=String(route||'dashboard');if(route==='system_update_center')return window.v283SystemUpdateCenter();const out=await base.apply(this,arguments);try{installNav();installDashboardCard();installSettingsCard()}catch(_e){}return out};f.__v283=true;window.render=f;try{render=f}catch(_e){}}
const openBase=window.openERP;if(typeof openBase==='function'&&!openBase.__v283){const f=async function(){const out=await openBase.apply(this,arguments);try{installNav();installDashboardCard()}catch(_e){}return out};f.__v283=true;window.openERP=f;try{openERP=f}catch(_e){}}
window.addEventListener('load',()=>{try{installNav();installDashboardCard();installSettingsCard()}catch(_e){}},{once:true,passive:true});
window.LDM_V283_SYSTEM_UPDATE=Object.freeze({build:BUILD,backgroundPolling:false,directCodeOverwrite:false,packageValidation:'local-sha256',deployment:'github-vercel-controlled',newSql:false});
})();
