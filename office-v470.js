/* Office ergonomics. Proxy buttons invoke existing payment actions; no new payment writer. */
(()=>{'use strict';const W=window,D=document,$=id=>D.getElementById(id);let dock=null,queued=false;
function mount(){const pay=$('v304Save'),next=$('v309Next'),host=$('v105FeeAccount');if(!host||!host.isConnected||(!pay&&!next)||D.getElementById('erp')?.classList.contains('hidden')){dock?.remove();dock=null;return}
 if(!dock){dock=D.createElement('aside');dock.id='fee470Dock';dock.setAttribute('aria-label','त्वरित फीस भुगतान');dock.innerHTML='<strong id="fee470Total"></strong><button id="fee470Save">फीस जमा करें</button><button id="fee470Next">अगला बच्चा →</button>';D.body.append(dock);$('fee470Save').onclick=()=>{const b=$('v304Save');if(b&&!b.disabled)b.click()};$('fee470Next').onclick=()=>{const b=$('v309Next');if(b&&!b.disabled)b.click()}}
 $('fee470Total').textContent=$('v304Totals')?.querySelector('[data-total=paid]')?.textContent||($('v304Status')?.textContent.includes('saved')?'✓ भुगतान सेव':'');$('fee470Save').hidden=!!next||!pay;$('fee470Save').disabled=!pay||pay.disabled;$('fee470Save').textContent=pay?.textContent||'फीस जमा करें';$('fee470Next').hidden=!next;$('fee470Next').disabled=!next||next.disabled;D.body.classList.add('fee470HasDock');}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mount();if(!dock)D.body.classList.remove('fee470HasDock')})}
function init(){const root=$('erpContent');if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['disabled']});schedule()}
let eventChannel=null,eventOwner='',authSubscription=null,eventTimer=0,feeChanged=false;
function bindEvents(){const client=typeof sb!=='undefined'?sb:W.sb;const id=String((typeof profile!=='undefined'?profile:W.profile)?.id||(typeof user!=='undefined'?user:W.user)?.id||'');
 if(id===eventOwner)return;if(eventChannel){client?.removeChannel?.(eventChannel);eventChannel=null}eventOwner=id;if(!id||!client?.channel)return;
 eventChannel=client.channel('central-corrections470-'+id).on('postgres_changes',{event:'INSERT',schema:'public',table:'ldm_v470_events'},e=>{
 const sess=String((typeof school!=='undefined'?school:W.school)?.academic_session||'');if(e.new?.academic_session!==sess)return;
 W.LDM_NETWORK_ECONOMY433?.invalidate();W.LDM_FEE_FAST_V427?.clearCache();W.ldmInvalidateFeeRegister?.();W.LDM_MARKSHEET?.clear?.();W.ldmMarkDataDirty?.(e.new.kind==='fee'?'fees':e.new.kind);
 feeChanged=feeChanged||['fee','phone'].includes(e.new.kind);if(eventTimer)return;eventTimer=setTimeout(()=>{eventTimer=0;if(D.hidden)return;refreshReadViews()},900);
 }).subscribe();
 if(!authSubscription&&client.auth?.onAuthStateChange)authSubscription=client.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'){if(eventChannel)client.removeChannel?.(eventChannel);eventChannel=null;eventOwner='';clearTimeout(eventTimer);eventTimer=0;feeChanged=false;}else queueMicrotask(bindEvents)});}
function refreshReadViews(){if(!feeChanged)return;feeChanged=false;if($('v254TeacherFeeBody'))W.v254LoadTeacherFee?.($('v254TeacherFeeClass')?.value||'');if($('parentDashboardBody'))W.LDM_PARENT455?.refreshFees({force:true});}
D.addEventListener('visibilitychange',()=>{if(!D.hidden){bindEvents();refreshReadViews()}});
const base=W.render;W.render=async function(...args){const r=await base.apply(this,args);bindEvents();schedule();return r};try{render=W.render}catch(_){}
const logout=W.logout;if(logout)W.logout=async function(...a){const r=await logout.apply(this,a);dock?.remove();dock=null;D.body.classList.remove('fee470HasDock');return r};
W.LDM_FINAL_BUILD='V470-SCOPED-WORK-OFFICE';W.LDM_OFFICE470={version:470,mount};if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',init,{once:true});else init();})();
