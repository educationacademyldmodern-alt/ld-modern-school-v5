/* Preserve every original V339 dashboard renderer and card. */
(()=>{'use strict';const W=window,actor=()=>typeof profile!=='undefined'?profile:W.profile;
const canLeave=()=>![W.LDM_PHOTO_V337,W.LDM_RESOURCES,W.LDM_ROOT,W.LDM_V336,W.LDM_EXAM,W.LDM_V304,W.LDM_FEE_V335].some(api=>api?.canNavigate&&api.canNavigate()===false);
const prior=W.render;if(typeof prior==='function'){W.render=async function(route,...args){if(String(route||'dashboard')!==String(W.__v90Route||'dashboard')){if(!canLeave())return W.toast?.('Complete pending Save / Retry first');W.LDM_A4_V337?.closePreview?.();W.LDM_REPORTS?.dispose();W.ldmCancelIdReads?.();W.LDM_V336?.dispose?.()}return prior.call(this,route,...args)};try{render=W.render}catch(_){}}
const toggle=W.v58ToggleSidebar;W.v58ToggleSidebar=function(...args){const erp=document.getElementById('erp');if(erp&&innerWidth>1050&&['admin','super_admin','principal'].includes(String(actor()?.role||'').toLowerCase())){erp.classList.toggle('v342SideCollapsed');return}return toggle?.apply(this,args)};try{v58ToggleSidebar=W.v58ToggleSidebar}catch(_){}
W.LDM_FINAL_BUILD='V342-ORIGINAL-V339-DASHBOARD';W.LDM_V342={originalDashboard:true,base:'V339',canLeave};
})();
