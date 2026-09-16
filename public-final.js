(function(){

function getSchool(){
  try{
    if(typeof school!=='undefined' && school)return school;
  }catch(e){}
  return {};
}

function buildReferenceHome(){

  const home=document.getElementById('exactHome');
  if(!home)return;

  const sc=getSchool();

  /* पहले से बना हो तो सिर्फ logo/phone update */
  const ready=document.getElementById('v1142RefPage');
  if(ready){
    const logo=ready.querySelector('.v1142Logo');
    if(logo && sc.logo_url)logo.src=sc.logo_url;
    return;
  }

  /* मौजूदा functional login cards सुरक्षित रखें */
  const loginCards=home.querySelector('.v26LoginCards');
  if(!loginCards)return;

  /* पुराना logo source */
  const oldLogo=home.querySelector('.v26Brand img');
  const logoSrc=
    sc.logo_url ||
    (oldLogo ? oldLogo.getAttribute('src') : '') ||
    'school-logo.png';

  /* पुराना exactHome hide, delete नहीं */
  [...home.children].forEach(function(el){
    el.style.setProperty('display','none','important');
  });

  const page=document.createElement('div');
  page.id='v1142RefPage';

  page.innerHTML=`
    <div class="v1142Latest">
      <b>LATEST</b>
      <div class="v1142LatestTrack">
        📢 Admissions Open for Session 2026-27 (Nursery to Class 10)
        &nbsp;&nbsp; | &nbsp;&nbsp;
        Quality Education for a Better Tomorrow
        &nbsp;&nbsp; | &nbsp;&nbsp;
        Building Character, Creating Brighter Futures
        &nbsp;&nbsp; | &nbsp;&nbsp;
        Welcome to L D Modern Education Academy
      </div>
    </div>

    <header class="v1142Brand">
      <div class="v1142LogoWrap">
        <img class="v1142Logo" alt="School Logo">
      </div>

      <div class="v1142BrandCenter">
        <h1 class="v1142SchoolName">
          <span>L D MODERN</span>
          <span>EDUCATION ACADEMY</span>
        </h1>

        <div class="v1142Address"></div>

        <div class="v1142Quality">
          QUALITY EDUCATION FOR A BETTER TOMORROW
        </div>
      </div>

      <div class="v1142Quote">
        Education<br>
        Today<br>
        A Better<br>
        Tomorrow
      </div>
    </header>

    <nav class="v1142RefNav">
      <button type="button" data-page="home">🏠 Home</button>
      <button type="button" data-page="about">👥 About</button>
      <button type="button" data-page="facilities">🎓 Academics</button>
      <button type="button" data-page="admission">📝 Admission / Enquiry</button>
      <button type="button" data-page="notices">🔔 Notices</button>
      <button type="button" data-page="gallery">🖼 Gallery</button>
      <button type="button" data-page="contact">☎ Contact</button>
    </nav>

    <section class="v1142Hero">
      <img src="public-hero-reference.webp"
           alt="L D Modern Education Academy">
    </section>

    <section class="v1142LoginArea"></section>

    <footer class="v1142RefFooter">
      <div class="v1142RefFootLeft">
        <span>✉ educationacademyldmodern@gmail.com</span>
        <span class="v1142Phone"></span>
      </div>

      <div class="v1142RefFootRight">
        <div>© 2026 L D MODERN EDUCATION ACADEMY • All Rights Reserved</div>
        <div class="v1142Founder">Founder - Adv Shiv Balak Yadav</div>
      </div>
    </footer>
  `;

  home.appendChild(page);

  const logo=page.querySelector('.v1142Logo');
  logo.src=logoSrc;
  logo.onerror=function(){
    this.onerror=null;
    this.src='school-logo.png';
  };

  page.querySelector('.v1142Address').textContent=
    sc.address ||
    'Gambhiriya Bujurg, Singhapatti, Padrauna, Kushinagar, 274304';

  page.querySelector('.v1142Phone').textContent=
    '☎ '+(sc.phone || '9625688873');

  /* functional cards उसी के उसी */
  page.querySelector('.v1142LoginArea').appendChild(loginCards);
  loginCards.style.removeProperty('display');

  /* Public menu existing showPublicPage function को ही call करे */
  page.querySelectorAll('.v1142RefNav button').forEach(function(btn){
    btn.addEventListener('click',function(){
      const pg=this.dataset.page;

      if(pg==='home'){
        window.scrollTo({top:0,behavior:'smooth'});
        return;
      }

      if(typeof window.showPublicPage==='function'){
        window.showPublicPage(pg);
      }
    });
  });
}

document.addEventListener('DOMContentLoaded',buildReferenceHome,{once:true});

window.addEventListener('load',function(){
  buildReferenceHome();
  setTimeout(buildReferenceHome,350);
  setTimeout(buildReferenceHome,1000);
},{once:true});

})();

/* stray \n / n/n text cleanup */
(function cleanStrayPublicText(){
  function run(){
    const roots=[
      document.body,
      document.getElementById('exactHome'),
      document.getElementById('v1142RefPage')
    ].filter(Boolean);

    roots.forEach(root=>{
      [...root.childNodes].forEach(node=>{
        if(node.nodeType!==3) return;

        const t=(node.textContent||'').trim();

        if(
          t==='\\n' ||
          t==='\\n\\n' ||
          t==='n/n' ||
          t==='/n' ||
          t==='/n/n'
        ){
          node.remove();
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded',run);
  window.addEventListener('load',()=>{
    run();
    setTimeout(run,500);
  });
})();

/* ===== FINAL PUBLIC CORRECTIONS ===== */
(function(){

function publicSchool(){
  try{
    if(typeof school!=='undefined' && school)return school;
  }catch(e){}
  return {};
}

function setupTicker(){

  const latest=document.querySelector('#v1142RefPage .v1142Latest');
  if(!latest)return;

  const sc=publicSchool();

  /* बाद में Admin Website Control इसी field को update करेगा */
  const text=
    sc.latest_information ||
    sc.latest_notice ||
    sc.running_notice ||
    sc.public_notice ||
    'Admissions Open for Session 2026-27 (Nursery to Class 10)  |  Quality Education for a Better Tomorrow  |  Building Character, Creating Brighter Futures  |  Welcome to L D Modern Education Academy';

  latest.innerHTML='';

  const label=document.createElement('b');
  label.textContent='LATEST';

  const viewport=document.createElement('div');
  viewport.className='v1142LatestViewport';

  const track=document.createElement('div');
  track.className='v1142LatestTrack';

  /* दो copies = पहली खत्म होते ही दूसरी शुरू */
  for(let i=0;i<2;i++){
    const span=document.createElement('span');
    span.textContent='📢  '+text+'   •   ';
    track.appendChild(span);
  }

  viewport.appendChild(track);
  latest.appendChild(label);
  latest.appendChild(viewport);
}

function hidePublicControl(){

  document.querySelectorAll(
    '#publicSite button,#publicSite a,#exactHome button,#exactHome a,#v1142RefPage button,#v1142RefPage a'
  ).forEach(el=>{

    const text=(
      (el.textContent||'')+' '+
      (el.getAttribute('title')||'')+' '+
      (el.getAttribute('aria-label')||'')
    ).replace(/\s+/g,' ').trim();

    if(/^control$/i.test(text) || /^website control$/i.test(text)){
      el.classList.add('v1142PublicControlHide');
    }
  });
}

function fitPublicHome(){

  const page=document.getElementById('v1142RefPage');

  if(page){
    document.body.classList.add('v1142-public-home-active');
  }

  setupTicker();
  hidePublicControl();
}

document.addEventListener('DOMContentLoaded',fitPublicHome);

window.addEventListener('load',()=>{
  fitPublicHome();
  setTimeout(fitPublicHome,350);
  setTimeout(fitPublicHome,1000);
});

})();
