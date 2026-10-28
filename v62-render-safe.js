(()=>{'use strict';
 const $=id=>document.getElementById(id);
 function role(){return String(window.profile?.role||'').toLowerCase()}
 function isAdmin(){return ['super_admin','admin','principal'].includes(role())}
 function mark(){
   const erp=$('erp'); if(!erp)return;
   const currentRole=role()||'unknown';if(erp.dataset.v62Role!==currentRole)erp.dataset.v62Role=currentRole;
   if(window.innerWidth<=900) erp.classList.remove('v62Collapsed');
 }
 function closeMobile(){if(window.innerWidth<=900)document.querySelector('#erp aside')?.classList.remove('open')}
 function install(){
   mark();
   const nav=$('erpNav');
   if(nav&&!nav.dataset.v62){nav.dataset.v62='1';nav.addEventListener('click',e=>{if(e.target.closest('button'))setTimeout(closeMobile,0)})}
   const h=document.querySelector('#erp .hamb');
   if(h&&!h.dataset.v62){h.dataset.v62='1';h.addEventListener('click',()=>{if(window.innerWidth>900&&isAdmin())$('erp')?.classList.toggle('v62Collapsed')})}
 }
 document.addEventListener('DOMContentLoaded',()=>setTimeout(install,120));
 window.addEventListener('load',()=>setTimeout(install,250));
 window.addEventListener('resize',()=>{mark();if(window.innerWidth>900)document.querySelector('#erp aside')?.classList.remove('open')},{passive:true});
 let installTimer468=0;function queueInstall468(){if(installTimer468)return;installTimer468=setTimeout(()=>{installTimer468=0;install()},60)}
 document.addEventListener('click',queueInstall468,true);
 window.addEventListener('pagehide',()=>{clearTimeout(installTimer468);installTimer468=0});
})();
