/* Save in place. Own only post-save refresh; existing writes/permissions/errors remain unchanged. */
(()=>{'use strict';const W=window,$=id=>document.getElementById(id);let serial=0,refreshing=false,stamp=0;const nextStamp=()=>++stamp;const formOrigins=new WeakMap();
const route=()=>String(W.__v90Route||W.page||'dashboard');const owner=()=>String((typeof profile!=='undefined'?profile:W.profile)?.id||'');
function controls(){return [...document.querySelectorAll('#erpContent input,#erpContent select,#erpContent textarea')].filter(e=>e.id&&!e.closest('#modal,dialog')&&!['password','file','hidden','submit','button'].includes(e.type)).map(e=>({id:e.id,value:e.value,checked:e.checked,type:e.type}))}
function snapshot(){const h=$('erpContent');return {route:route(),owner:owner(),serial,view:h?.firstElementChild||null,controls:controls(),x:W.scrollX,y:W.scrollY,scrolls:[...(h?.querySelectorAll('[id],.tableWrap')||[])].filter(e=>e.scrollLeft||e.scrollTop).map(e=>({id:e.id||'',index:[...(h?.querySelectorAll('.tableWrap')||[])].indexOf(e),x:e.scrollLeft,y:e.scrollTop}))}}
function remember(form){if(!form)return;formOrigins.set(form,{...snapshot(),editor:nextStamp()})}
function capture(kind,form,id){const original=formOrigins.get(form);if(original){const submission=nextStamp();formOrigins.set(form,{...original,latestSave:submission});return {...original,kind,id,submission}}const context={...snapshot(),editor:nextStamp(),kind,id};context.submission=nextStamp();if(form)formOrigins.set(form,{...context,latestSave:context.submission});return context}
function matches(context){return context.owner===owner()&&context.route===route()&&context.serial===serial&&(!context.view||context.view.isConnected&&$('erpContent')?.contains(context.view))}
function sameEditor(form,context){return formOrigins.get(form)?.editor===context.editor&&formOrigins.get(form)?.latestSave===context.submission}
function restore(context){for(const saved of context.controls){const el=$(saved.id);if(!el)continue;if(el.tagName==='SELECT'&&![...el.options].some(o=>o.value===saved.value))continue;el.value=saved.value;if(saved.type==='checkbox'||saved.type==='radio')el.checked=saved.checked}
 // Refilter from fresh server rows after putting the original class/query back.
 if(route()==='v150_student_master')W.v150RenderStudents?.();else if($('nameSearch')||$('search')){for(const id of ['nameSearch','search'])$(id)?.dispatchEvent(new Event('input',{bubbles:true}))}
 const h=$('erpContent');for(const s of context.scrolls){const el=s.id?$(s.id):h?.querySelectorAll('.tableWrap')[s.index];if(el){el.scrollLeft=s.x;el.scrollTop=s.y}}W.scrollTo(context.x,context.y)}
async function finish(kind,form,id,context){
 // A later editor or an explicitly chosen page always wins over the old delayed Save callback.
 if(!sameEditor(form,context))return false;
 if(context.owner!==owner())return false;
 if(!matches(context))return false;
 const liveContext={...context,...snapshot()};
 try{W.closeModal?.()}catch(_){}
 if(refreshing)return false;
 // Dashboard/collection pages can contain another unfinished payment. Marking dirty is sufficient there.
 if(['dashboard','smart_fee_center','master_fee','fee_dashboard'].includes(context.route)){W.ldmMarkDataDirty?.(kind);return true}
 refreshing=true;
 try{const result=W.render(context.route);const refreshSerial=serial;await result;if(owner()!==context.owner||route()!==context.route||serial!==refreshSerial)return false;restore(liveContext);requestAnimationFrame(()=>{if(owner()===context.owner&&route()===context.route&&serial===refreshSerial)restore(liveContext)});return true}
 catch(e){W.toast?.((W.LDM_V337_UI?.language()==='en'?'Saved; list refresh failed: ':'डेटा सेव है; सूची अपडेट नहीं हुई: ')+(e.message||e));return false}
 finally{refreshing=false}
}
// Stamp the originating page before an editor is opened; no global click interception.
for(const name of ['openEdit','openAdd']){const original=W[name];if(typeof original==='function')W[name]=function(...args){remember($('dataForm'));const result=original.apply(this,args);return result}}
const centralAdd=W.v186OpenCentralStudentAdd;if(typeof centralAdd==='function')W.v186OpenCentralStudentAdd=async function(...args){const context=snapshot();const result=await centralAdd.apply(this,args);if(context.owner===owner()&&context.route===route()&&context.serial===serial&&$('dataForm'))formOrigins.set($('dataForm'),{...context,editor:nextStamp()});return result};
const previousRender=W.render;W.render=function(...args){serial++;return previousRender.apply(this,args)};
W.LDM_SAVE_STAY_V338={capture,finish,navigation:()=>serial,remember,canRefresh:matches};
})();
