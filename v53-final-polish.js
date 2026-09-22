/* V53 FINAL POLISH — navigation/session, stray-text cleanup, selection reset, light performance guards */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 function erpOpen(){const e=$('erp');return !!(e&&!e.classList.contains('hidden'))}
 function cleanStray(root=document){
   try{const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n,changed=0;while((n=w.nextNode())&&changed<80){const p=n.parentElement;if(!p||/^(SCRIPT|STYLE|TEXTAREA|PRE|CODE)$/i.test(p.tagName))continue;let s=n.nodeValue||'';if(/^\s*(?:\\?n\s*\/\s*\\?n|n\s*\/\s*n)\s*$/i.test(s)){n.nodeValue='';changed++}}}catch(_e){}
 }
 function clearAccidentalSelection(){try{const s=window.getSelection?.();if(s&&!document.activeElement?.matches?.('input,textarea,[contenteditable=true]'))s.removeAllRanges()}catch(_e){};try{document.activeElement?.blur?.()}catch(_e){};try{window.scrollTo({top:0,left:0,behavior:'auto'})}catch(_e){window.scrollTo(0,0)}}
 let cleanQueued=false;function queueClean(){if(cleanQueued)return;cleanQueued=true;requestAnimationFrame(()=>{cleanQueued=false;cleanStray();})}
 document.addEventListener('DOMContentLoaded',()=>cleanStray(),{once:true});
 // V64.21: legacy Back/history wrappers removed. Authoritative navigation is ldmea-v6421-root-correction.js.
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)queueClean()});
 window.addEventListener('load',()=>{setTimeout(()=>{cleanStray()},250)});
})();
