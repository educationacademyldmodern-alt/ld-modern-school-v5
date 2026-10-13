(function(){
'use strict';

const DEFAULT_NOTICE='Admissions Open for Session 2026-27 (Nursery to Class 10) | Quality Education for a Better Tomorrow | Building Character, Creating Brighter Futures | Welcome to L D Modern Education Academy';
const DEFAULT_EMAIL='educationacademyldmodern@gmail.com';
const DEFAULT_PHONE='9625688873';
const DEFAULT_ADDRESS='Gambhiriya Bujurg, Singhapatti, Padrauna, Kushinagar, 274304';

function sc(){
  try{ if(typeof school!=='undefined' && school) return school; }catch(_e){}
  return {};
}
function safeText(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function noticeText(){
  const s=sc();
  return String(
    s.latest_information ||
    [s.notice1_enabled!==false?s.notice1_text:'',s.notice2_enabled!==false?s.notice2_text:'',s.notice3_enabled!==false?s.notice3_text:''].filter(Boolean).join('  •  ') ||
    DEFAULT_NOTICE
  ).trim();
}
function publicGo(id){
  try{
    if(id==='home'){
      if(typeof showPublicPage==='function') showPublicPage('home');
      window.scrollTo(0,0);
      return;
    }
    const route=id==='academics'?'facilities':id;
    if(typeof showPublicPage==='function') return showPublicPage(route);
  }catch(e){console.warn('Public nav',e)}
}
window.v1142PublicGo=publicGo;

function hidePublicControls(){
  if(document.body.classList.contains('v1142-erp-active'))return;
  document.querySelectorAll('button,a,[role="button"]').forEach(el=>{
    if(el.closest('#v1142RefPage'))return;
    const t=((el.textContent||'')+' '+(el.title||'')+' '+(el.getAttribute('aria-label')||'')).replace(/\s+/g,' ').trim();
    if(/\bwebsite\s*control\b/i.test(t)||/^control$/i.test(t)){
      el.classList.add('v1142PublicControlHide');
    }
  });
}

function build(){
  const home=document.getElementById('exactHome');
  if(!home || document.getElementById('v1142RefPage')) return;

  const logins=home.querySelector('.v26LoginCards');
  if(!logins) return;

  const s=sc();
  const oldLogo=home.querySelector('.v26Brand img');
  const logo=s.logo_url || oldLogo?.getAttribute('src') || 'school-logo.png';
  const hero='public-hero-reference.webp';
  const name=s.school_name || 'L D MODERN EDUCATION ACADEMY';
  const address=s.address || DEFAULT_ADDRESS;
  const email=s.email || DEFAULT_EMAIL;
  const phone=s.phone || DEFAULT_PHONE;
  const n=noticeText();

  const page=document.createElement('div');
  page.id='v1142RefPage';
  page.innerHTML=`
    <div class="v1142Latest" aria-label="Latest school information">
      <div class="v1142LatestLabel">LATEST</div>
      <div class="v1142LatestViewport">
        <div class="v1142LatestTrack">
          <span>${safeText(n)} &nbsp; • &nbsp;</span>
          <span>${safeText(n)} &nbsp; • &nbsp;</span>
        </div>
      </div>
    </div>

    <header class="v1142Brand">
      <div class="v1142LogoWrap">
        <img class="v1142Logo" src="${safeText(logo)}" alt="School Logo">
      </div>
      <div class="v1142BrandCenter">
        <h1 class="v1142SchoolName">${safeText(name)}</h1>
        <div class="v1142Address">${safeText(address)}</div>
        <div class="v1142Quality">NURSERY TO CLASS 10 &nbsp; • &nbsp; QUALITY EDUCATION FOR A BETTER TOMORROW</div>
      </div>
      <div class="v1142Quote">Education Today<b>A Better Tomorrow</b></div>
    </header>

    <nav class="v1142RefNav" aria-label="Public website navigation">
      <button type="button" data-page="home">Home</button>
      <button type="button" data-page="about">About</button>
      <button type="button" data-page="academics">Academics</button>
      <button type="button" data-page="admission">Admission / Enquiry</button>
      <button type="button" data-page="notices">Notices</button>
      <button type="button" data-page="gallery">Gallery</button>
      <button type="button" data-page="contact">Contact</button>
    </nav>

    <section class="v1142Hero">
      <img src="${hero}" alt="L D Modern Education Academy">
    </section>

    <section class="v1142LoginArea"></section>

    <footer class="v1142RefFooter">
      <div class="v1142RefFootLeft">
        <span>✉ ${safeText(email)}</span>
        <span>☎ ${safeText(phone)}</span>
      </div>
      <div class="v1142RefFootRight">
        <span>© 2026 L D MODERN EDUCATION ACADEMY. All Rights Reserved.</span>
        <b>Founder - Adv Shiv Balak Yadav</b>
      </div>
    </footer>`;

  home.classList.add('v1142FinalBuilt');
  home.appendChild(page);
  page.querySelector('.v1142LoginArea').appendChild(logins);

  page.querySelectorAll('.v1142RefNav button').forEach(b=>{
    b.addEventListener('click',()=>publicGo(b.dataset.page));
  });

  document.body.classList.add('v1142-public-home-active');
  hidePublicControls();
  sync();
}

function sync(){
  const page=document.getElementById('v1142RefPage');
  if(!page)return;
  const s=sc();
  const n=noticeText();
  const spans=page.querySelectorAll('.v1142LatestTrack span');
  spans.forEach(x=>x.textContent=n+'   •   ');
  const logo=page.querySelector('.v1142Logo');
  if(logo && s.logo_url)logo.src=s.logo_url;
  const name=page.querySelector('.v1142SchoolName');
  if(name)name.textContent=s.school_name||'L D MODERN EDUCATION ACADEMY';
  const address=page.querySelector('.v1142Address');
  if(address)address.textContent=s.address||DEFAULT_ADDRESS;
  const foot=page.querySelectorAll('.v1142RefFootLeft span');
  if(foot[0])foot[0].textContent='✉ '+(s.email||DEFAULT_EMAIL);
  if(foot[1])foot[1].textContent='☎ '+(s.phone||DEFAULT_PHONE);
  hidePublicControls();
}

function state(){
  const home=document.getElementById('exactHome');
  const pub=document.getElementById('publicSite');
  const on=!!home && !home.classList.contains('hidden') && !!pub && !pub.classList.contains('hidden');
  document.body.classList.toggle('v1142-public-home-active',on);
  if(on){build();sync()}
}

function hookSchoolRefresh(){
  try{
    if(typeof applySchool==='function' && !applySchool.__v1142Final){
      const base=applySchool;
      const wrapped=function(){
        const r=base.apply(this,arguments);
        setTimeout(sync,0);
        return r;
      };
      wrapped.__v1142Final=true;
      applySchool=wrapped;
    }
  }catch(_e){}
}

function start(){
  build();
  hookSchoolRefresh();
  state();
  [300,900,1800].forEach(ms=>setTimeout(()=>{build();sync();state()},ms));

  document.addEventListener('click',()=>setTimeout(state,0),true);
  window.addEventListener('resize',state,{passive:true});

  const ob=new MutationObserver(()=>state());
  const pub=document.getElementById('publicSite');
  if(pub)ob.observe(pub,{attributes:true,subtree:false,attributeFilter:['class']});
  const home=document.getElementById('exactHome');
  if(home)ob.observe(home,{attributes:true,subtree:false,attributeFilter:['class']});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
})();
