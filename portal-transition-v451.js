/* V467: one pending auth action / ERP opening; immediate status, no polling or auth caching. */
(()=>{'use strict';const W=window,D=document;let active=0,authFlight=null,openFlight=null;const q=id=>D.getElementById(id);
function shield(text){let el=q('portal451Transition');if(!el){el=D.createElement('div');el.id='portal451Transition';el.setAttribute('role','status');el.setAttribute('aria-live','polite');el.innerHTML='<div><p></p></div>';D.body.append(el)}el.querySelector('p').textContent=text;el.hidden=false;D.body.setAttribute('aria-busy','true');return el}
function beginLogin(){const login=q('login');D.documentElement.dataset.ldmLoginStage=login&&getComputedStyle(login).display!=='none'?'login':'portal'}
function endLogin(){delete D.documentElement.dataset.ldmLoginStage}
function hide(){q('portal451Transition')?.remove();D.body.removeAttribute('aria-busy')}
function waitMessage(){W.toast?.('पहली Login/Logout प्रक्रिया की पुष्टि हो रही है। कृपया प्रतीक्षा करें।');return Promise.resolve(false)}
for(const name of ['login','teacherPasswordLogin','parentPasswordLogin','logout']){const base=W[name];if(typeof base!=='function')continue;W[name]=function(...args){if(authFlight){if(authFlight.name===name)return authFlight.promise;return waitMessage()}if(active)return waitMessage();const logout=name==='logout';active++;W.__ldmAuthEpoch455=(W.__ldmAuthEpoch455||0)+1;
 if(logout){shield('लॉगआउट की पुष्टि हो रही है… / Signing out…');W.LDM_ATTENDANCE412?.stop?.();W.ldmCancelIdReads?.()}else{W.__ldmInteractiveLogin=true;beginLogin();shield('लॉगिन की पुष्टि हो रही है… / Signing in…')}
 const promise=Promise.resolve().then(()=>base.apply(this,args)).finally(()=>{if(authFlight?.promise===promise)authFlight=null;if(!logout){W.__ldmInteractiveLogin=false;endLogin()}active--;if(!active)hide()});authFlight={name,promise};return promise;};}
const open=W.openERP;if(typeof open==='function')W.openERP=function(...args){const key=[W.user?.id,W.profile?.role,W.__ldmAuthEpoch455||0].join('|');if(openFlight?.key===key)return openFlight.promise;const owns=!active;if(owns){active++;shield('डैशबोर्ड खुल रहा है… / Opening dashboard…')}
 const promise=Promise.resolve().then(()=>open.apply(this,args)).finally(()=>{if(openFlight?.promise===promise)openFlight=null;if(owns){active--;if(!active)hide()}});openFlight={key,promise};return promise;};
W.addEventListener('pagehide',()=>{W.LDM_ATTENDANCE412?.stop?.();W.ldmCancelIdReads?.()});
W.LDM_PORTAL451={hide,stats:()=>({active,authInFlight:authFlight?.name||null,erpOpening:!!openFlight,version:467})};})();
