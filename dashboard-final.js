(function(){
'use strict';

function topReset(){
  try{
    const main=document.querySelector('#erp main');
    if(main)main.scrollTo({top:0,left:0,behavior:'auto'});
    const c=document.getElementById('erpContent');
    if(c)c.scrollTop=0;
    window.scrollTo(0,0);
  }catch(_e){}
}
function closeDrawer(){
  if(window.innerWidth>900)return;
  try{document.querySelector('#erp aside')?.classList.remove('open')}catch(_e){}
  try{document.getElementById('v26Nav')?.classList.remove('show')}catch(_e){}
}
function normalize(){
  const erp=document.getElementById('erp');
  if(!erp||erp.classList.contains('hidden'))return;
  document.body.classList.add('v1142-erp-active');
  document.body.classList.remove('v1142-public-home-active');
  const aside=document.querySelector('#erp aside');
  if(window.innerWidth>900 && aside)aside.classList.remove('open');
}
document.addEventListener('click',e=>{
  const navButton=e.target.closest('#erpNav button');
  if(navButton){
    closeDrawer();
    setTimeout(topReset,0);
    setTimeout(topReset,100);
  }
  const back=e.target.closest('#v45BackBtn,#v45HomeBtn,#v90BackBtn,#v90HomeBtn');
  if(back){closeDrawer();setTimeout(topReset,0)}
  if(window.innerWidth<=900){
    const aside=document.querySelector('#erp aside');
    if(aside?.classList.contains('open') && !e.target.closest('#erp aside') && !e.target.closest('.hamb')){
      aside.classList.remove('open');
    }
  }
},true);

window.addEventListener('resize',normalize,{passive:true});
window.addEventListener('load',()=>setTimeout(normalize,100));
document.addEventListener('DOMContentLoaded',()=>setTimeout(normalize,100));

const ob=new MutationObserver(()=>normalize());
const erp=document.getElementById('erp');
if(erp)ob.observe(erp,{attributes:true,attributeFilter:['class']});
})();
