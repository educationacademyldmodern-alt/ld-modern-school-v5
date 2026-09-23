(()=>{'use strict';
 const q=s=>document.querySelector(s);
 function isERP(){return !!q('#erp:not(.hidden)')}
 function removeFloatingControl(){document.querySelectorAll('#v65Dock,.v65Dock').forEach(x=>x.remove())}
 function cleanPublicNN(){
   if(isERP())return;
   const roots=[q('#publicHome'),q('#publicPageView'),q('#publicSite'),document.querySelector('main')].filter(Boolean);
   roots.forEach(root=>{const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode())){const p=n.parentElement;if(!p||/^(SCRIPT|STYLE|TEXTAREA|PRE|CODE)$/i.test(p.tagName))continue;let s=n.nodeValue||'';if(/^\s*(?:\\?\/n){2,}\s*$/i.test(s)||/^\s*n\/n\s*$/i.test(s))n.nodeValue='';else if(s.includes('/n/n'))n.nodeValue=s.replace(/\/n\/n/g,'');}});
 }
 function fixAdminIdentity(){
   if(!isERP())return;
   const h=q('#erpContent .v90Welcome h1,#erpContent .dashHero h1');
   if(h&&/@/.test(h.textContent||''))h.textContent=(/morning/i.test(h.textContent)?'Good Morning':/afternoon/i.test(h.textContent)?'Good Afternoon':/evening/i.test(h.textContent)?'Good Evening':'Welcome Back')+', Principal / Admin';
 }
 let raf=0;function repair(){cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{removeFloatingControl();cleanPublicNN();fixAdminIdentity();});}
 document.addEventListener('DOMContentLoaded',repair,{once:true});
 window.addEventListener('load',repair,{once:true});
 window.addEventListener('resize',repair,{passive:true});
 /* Route changes are repaired after the user's action; no page-wide MutationObserver. */
 document.addEventListener('click',e=>{if(e.target.closest('#erpNav button,.hamb,.erpHomeBtn,.websiteBtn,[data-page],[data-route]'))setTimeout(repair,80)},true);
 window.v64RepairLayout=repair;
})();
