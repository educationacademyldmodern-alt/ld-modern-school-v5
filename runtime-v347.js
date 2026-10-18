/* Navigation ownership: one active submit, shared in-flight route renders, no idle polling. */
(()=>{'use strict';const W=window,D=document;const writes=new Map(),flights=new Map();let sequence=0;
const owner=()=>String((typeof profile!=='undefined'?profile:W.profile)?.id||''),session=()=>String((typeof school!=='undefined'?school:W.school)?.academic_session||'');
const APIs=['LDMEA_ROOT','LDM_MARKSHEET','LDM_EXAM','LDM_RESOURCES','LDM_ROOT','LDM_V336','LDM_V304','LDM_FEE_V335','LDM_REMINDERS','LDM_V309_RECEIPT','LDM_PHOTO_V337','LDM_PAPER_V343'];
function canNavigate(){if([...writes.values()].some(w=>w.owner===owner()))return false;for(const name of APIs){const api=W[name];if(api?.canNavigate&&api.canNavigate()===false)return false}return true}
const blocked=()=>W.toast?.('पहले चालू Save / उसी अनुरोध का Retry पूरा करें।');
function beginWrite(form){const id=++sequence;writes.set(id,{owner:owner(),form});return id}function endWrite(id){writes.delete(id)}
const renderBase=W.render;if(typeof renderBase==='function'){W.render=function(route='dashboard',...args){if(!canNavigate())return blocked();const key=[owner(),session(),String(route)].join('|');if(!args.length&&flights.has(key))return flights.get(key);let result;try{result=renderBase.call(this,route,...args)}catch(e){return Promise.reject(e)}const promise=Promise.resolve(result).finally(()=>{if(flights.get(key)===promise)flights.delete(key)});if(!args.length)flights.set(key,promise);return promise};try{render=W.render}catch(_){}}
for(const name of ['v90Back','v90GoHome','erpGoHome']){const base=W[name];if(typeof base==='function')W[name]=function(...args){if(!canNavigate())return blocked();return base.apply(this,args)}}try{v90GoHome=W.v90GoHome;erpGoHome=W.erpGoHome}catch(_){}
// Legacy toolbar handlers may retain a previous function reference; guard before they mutate history.
D.addEventListener('click',e=>{if(!e.target.closest?.('#v90BackBtn,#v90HomeBtn,#erpNav button,.erpHomeBtn'))return;if(!canNavigate()){e.preventDefault();e.stopImmediatePropagation();blocked()}},true);
W.addEventListener('beforeunload',e=>{if([...writes.values()].some(w=>w.owner===owner())){e.preventDefault();e.returnValue=''}});
W.LDM_RUNTIME_V347={canNavigate,beginWrite,endWrite,activeWrites:()=>[...writes.values()].filter(w=>w.owner===owner()).length};W.LDM_FINAL_BUILD='V347-PREMIUM-ROOT';
})();
