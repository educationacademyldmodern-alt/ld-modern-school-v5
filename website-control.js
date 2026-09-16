(function(){
'use strict';

const DEFAULT_NOTICE='Admissions Open for Session 2026-27 (Nursery to Class 10) | Quality Education for a Better Tomorrow | Building Character, Creating Brighter Futures | Welcome to L D Modern Education Academy';
const DEFAULT_EMAIL='educationacademyldmodern@gmail.com';
const DEFAULT_PHONE='9625688873';

function schoolData(){try{if(typeof school!=='undefined'&&school)return school}catch(_e){}return{}}
function isAdmin(){
  try{if(typeof v14Admin==='function')return !!v14Admin()}catch(_e){}
  try{return ['super_admin','admin','principal'].includes(String(profile?.role||'').toLowerCase())}catch(_e){}
  return false;
}
function notify(t){try{if(typeof toast==='function')return toast(t)}catch(_e){}alert(t)}

function style(){
  if(document.getElementById('v1142WebsiteControlStyle'))return;
  const st=document.createElement('style');
  st.id='v1142WebsiteControlStyle';
  st.textContent=`
  #v1142WebsiteControlModal{position:fixed;inset:0;z-index:999999;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(2,20,48,.72);backdrop-filter:blur(5px)}
  #v1142WebsiteControlModal.open{display:flex}
  .v1142WcBox{width:min(760px,96vw);max-height:92dvh;overflow:auto;background:linear-gradient(145deg,#fff,#edf8ff);border:1px solid #9bcdf7;border-radius:22px;box-shadow:0 25px 65px rgba(0,35,80,.35);padding:20px;color:#173b68}
  .v1142WcHead{display:flex;align-items:flex-start;justify-content:space-between;gap:15px;margin-bottom:16px}.v1142WcHead h2{margin:0;color:#073b7d}.v1142WcHead p{margin:4px 0 0;font-size:12px;color:#657b94}
  .v1142WcClose{border:0;border-radius:11px;padding:8px 12px;cursor:pointer;font-weight:900}
  .v1142WcGrid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.v1142WcField{display:flex;flex-direction:column;gap:6px}.v1142WcField.full{grid-column:1/-1}.v1142WcField label{font-weight:900;color:#153d6b}
  .v1142WcField input,.v1142WcField textarea{width:100%;border:1px solid #bad8ef;border-radius:12px;padding:11px;background:#fff;color:#17324e;font:inherit}.v1142WcField textarea{min-height:110px;resize:vertical}
  .v1142LogoPreview{width:105px;height:105px;object-fit:contain;border:1px solid #c8dff2;border-radius:16px;background:#fff;box-shadow:0 8px 18px rgba(0,60,120,.13)}
  .v1142WcActions{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}.v1142WcActions button{border:0;border-radius:999px;padding:10px 24px;cursor:pointer;font-weight:900}
  #v1142WcSave{color:#fff;background:linear-gradient(180deg,#149ef1,#0755ab);box-shadow:0 5px 0 #043d7c}
  #v1142WebsiteControlBtn{border-color:#7ebcf1!important;background:linear-gradient(180deg,#eaf6ff,#d7ecff)!important;color:#073b7d!important;font-weight:900!important}
  @media(max-width:650px){.v1142WcGrid{grid-template-columns:1fr}.v1142WcField.full{grid-column:auto}.v1142WcBox{padding:14px}.v1142WcActions{flex-wrap:wrap}.v1142WcActions button{flex:1 1 160px}}
  `;
  document.head.appendChild(st);
}

function modal(){
  if(document.getElementById('v1142WebsiteControlModal'))return;
  const d=document.createElement('div');
  d.id='v1142WebsiteControlModal';
  d.innerHTML=`
  <div class="v1142WcBox" role="dialog" aria-modal="true" aria-labelledby="v1142WcTitle">
    <div class="v1142WcHead">
      <div><h2 id="v1142WcTitle">🌐 Website Control</h2><p>Public Website की live branding और running information</p></div>
      <button class="v1142WcClose" type="button">✕</button>
    </div>
    <div class="v1142WcGrid">
      <div class="v1142WcField full">
        <label>📢 Latest Running Information</label>
        <textarea id="v1142WcNotice" placeholder="LATEST bar में एक line में चलने वाली सूचना"></textarea>
      </div>
      <div class="v1142WcField"><label>✉ Website Email</label><input id="v1142WcEmail" type="email"></div>
      <div class="v1142WcField"><label>☎ Contact Number</label><input id="v1142WcPhone" type="tel" inputmode="tel"></div>
      <div class="v1142WcField full">
        <label>🏫 School Logo</label>
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
          <img id="v1142WcLogoPreview" class="v1142LogoPreview" src="school-logo.png" alt="School Logo">
          <input id="v1142WcLogoFile" type="file" accept="image/jpeg,image/png,image/webp">
        </div>
        <small>Existing image compression/upload system ही use होगा.</small>
      </div>
    </div>
    <div class="v1142WcActions">
      <button type="button" class="v1142WcClose">Cancel</button>
      <button type="button" id="v1142WcSave">Save Website Settings</button>
    </div>
  </div>`;
  document.body.appendChild(d);
  d.querySelectorAll('.v1142WcClose').forEach(b=>b.addEventListener('click',()=>d.classList.remove('open')));
  d.addEventListener('click',e=>{if(e.target===d)d.classList.remove('open')});
  document.getElementById('v1142WcLogoFile').addEventListener('change',e=>{
    const f=e.target.files?.[0];if(f)document.getElementById('v1142WcLogoPreview').src=URL.createObjectURL(f);
  });
  document.getElementById('v1142WcSave').addEventListener('click',save);
}

async function open(){
  if(!isAdmin())return notify('Permission denied');
  style();modal();
  let data=schoolData();
  try{
    const r=await sb.from('school_settings').select('*').eq('id',1).maybeSingle();
    if(r.error)throw r.error;
    if(r.data)data=r.data;
  }catch(e){console.warn('Website Control load',e)}
  document.getElementById('v1142WcNotice').value=data.latest_information||DEFAULT_NOTICE;
  document.getElementById('v1142WcEmail').value=data.email||DEFAULT_EMAIL;
  document.getElementById('v1142WcPhone').value=data.phone||DEFAULT_PHONE;
  document.getElementById('v1142WcLogoPreview').src=data.logo_url||'school-logo.png';
  document.getElementById('v1142WcLogoFile').value='';
  document.getElementById('v1142WebsiteControlModal').classList.add('open');
}
window.openWebsiteControl=open;

async function save(){
  if(!isAdmin())return notify('Permission denied');
  const btn=document.getElementById('v1142WcSave'),old=btn.textContent;
  try{
    btn.disabled=true;btn.textContent='Saving...';
    const row={
      id:1,
      latest_information:document.getElementById('v1142WcNotice').value.trim()||DEFAULT_NOTICE,
      email:document.getElementById('v1142WcEmail').value.trim()||DEFAULT_EMAIL,
      phone:document.getElementById('v1142WcPhone').value.trim()||DEFAULT_PHONE
    };
    const file=document.getElementById('v1142WcLogoFile').files?.[0];
    if(file){
      if(typeof compressImageFile!=='function'||typeof uploadPublicAsset!=='function')throw new Error('Existing logo upload system not available');
      const compressed=await compressImageFile(file,15,80,700,'logo');
      const up=await uploadPublicAsset(compressed,'branding/logo');
      row.logo_url=up.url;
    }
    const q=await sb.from('school_settings').upsert(row,{onConflict:'id'});
    if(q.error)throw q.error;
    if(typeof loadSchool==='function')await loadSchool();
    try{if(typeof applySchool==='function')applySchool()}catch(_e){}
    try{if(typeof applyPortalWallpapers==='function')applyPortalWallpapers()}catch(_e){}
    document.getElementById('v1142WebsiteControlModal').classList.remove('open');
    notify('Website settings updated • all devices');
  }catch(e){
    console.error(e);
    const m=String(e?.message||e);
    notify((/latest_information|email|column|schema cache/i.test(m)?'पहले supabase-v1142-website-control.sql Run करें • ':'')+m);
  }finally{btn.disabled=false;btn.textContent=old}
}

function installButton(){
  if(!isAdmin())return false;
  if(document.getElementById('v1142WebsiteControlBtn'))return true;
  const buttons=[...document.querySelectorAll('#erpNav button')];
  const settings=buttons.find(b=>{
    const oc=b.getAttribute('onclick')||'';
    return /render\(['"]settings['"]\)/.test(oc);
  });
  if(!settings)return false;
  const b=document.createElement('button');
  b.id='v1142WebsiteControlBtn';
  b.type='button';
  b.innerHTML='🌐 <span>Website Control</span>';
  b.addEventListener('click',open);
  settings.insertAdjacentElement('afterend',b);
  return true;
}

function boot(){
  style();modal();
  installButton();
  const ob=new MutationObserver(()=>installButton());
  const nav=document.getElementById('erpNav');
  if(nav)ob.observe(nav,{childList:true,subtree:true});
  else ob.observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
