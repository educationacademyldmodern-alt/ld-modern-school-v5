(()=>{'use strict';
 const q=s=>document.querySelector(s);
 function isERP(){return !!q('#erp:not(.hidden)')}
 function removeFloatingControl(){document.querySelectorAll('#v65Dock,.v65Dock').forEach(x=>x.remove())}
 /* V65.1: removed DOM text scrubber; stray technical text must be fixed at its source. */
 function fixAdminIdentity(){
   if(!isERP())return;
   const h=q('#erpContent .v90Welcome h1,#erpContent .dashHero h1');
   if(h&&/@/.test(h.textContent||''))h.textContent=(/morning/i.test(h.textContent)?'Good Morning':/afternoon/i.test(h.textContent)?'Good Afternoon':/evening/i.test(h.textContent)?'Good Evening':'Welcome Back')+', Principal / Admin';
 }
 let raf=0;function repair(){cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{removeFloatingControl();fixAdminIdentity();});}
 document.addEventListener('DOMContentLoaded',repair,{once:true});
 window.addEventListener('load',repair,{once:true});
 window.addEventListener('resize',repair,{passive:true});
 /* Route changes are repaired after the user's action; no page-wide MutationObserver. */
 document.addEventListener('click',e=>{if(e.target.closest('#erpNav button,.hamb,.erpHomeBtn,.websiteBtn,[data-page],[data-route]'))setTimeout(repair,80)},true);
 window.v64RepairLayout=repair;
})();
