/* Office ergonomics. Proxy buttons invoke existing payment actions; no new payment writer. */
(()=>{'use strict';const W=window,D=document,$=id=>D.getElementById(id);let dock=null,queued=false;
function mount(){const pay=$('v304Save'),next=$('v309Next'),host=$('v105FeeAccount');if(!host||!host.isConnected||(!pay&&!next)||D.getElementById('erp')?.classList.contains('hidden')){dock?.remove();dock=null;return}
 if(!dock){dock=D.createElement('aside');dock.id='fee470Dock';dock.setAttribute('aria-label','त्वरित फीस भुगतान');dock.innerHTML='<strong id="fee470Total"></strong><button id="fee470Save">फीस जमा करें</button><button id="fee470Next">अगला बच्चा →</button>';D.body.append(dock);$('fee470Save').onclick=()=>{const b=$('v304Save');if(b&&!b.disabled)b.click()};$('fee470Next').onclick=()=>{const b=$('v309Next');if(b&&!b.disabled)b.click()}}
 $('fee470Total').textContent=$('v304Totals')?.querySelector('[data-total=paid]')?.textContent||($('v304Status')?.textContent.includes('saved')?'✓ भुगतान सेव':'');$('fee470Save').hidden=!!next||!pay;$('fee470Save').disabled=!pay||pay.disabled;$('fee470Save').textContent=pay?.textContent||'फीस जमा करें';$('fee470Next').hidden=!next;$('fee470Next').disabled=!next||next.disabled;D.body.classList.add('fee470HasDock');}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mount();if(!dock)D.body.classList.remove('fee470HasDock')})}
function init(){const root=$('erpContent');if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['disabled']});schedule()}
function bindEvents(){W.LDM_LIVE472?.start()}
const base=W.render;W.render=async function(...args){const r=await base.apply(this,args);bindEvents();schedule();return r};try{render=W.render}catch(_){}
const logout=W.logout;if(logout)W.logout=async function(...a){const r=await logout.apply(this,a);dock?.remove();dock=null;D.body.classList.remove('fee470HasDock');return r};
W.LDM_FINAL_BUILD='V472-CENTRAL-OFFICE';W.LDM_OFFICE470={version:470,mount};if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',init,{once:true});else init();})();
