/* V53 stability repair — DOM route guards + safe insertBefore */
(()=>{'use strict';
window.V53_STABILITY_BUILD='V53-STABILITY-2026-09-19';
// Prevent NotFoundError when a stale reference node was replaced by another route wrapper.
try{const native=Node.prototype.insertBefore;if(!Node.prototype.__ldSafeInsertBefore){Object.defineProperty(Node.prototype,'__ldSafeInsertBefore',{value:true});Node.prototype.insertBefore=function(n,r){if(r&&r.parentNode!==this)r=null;try{return native.call(this,n,r)}catch(e){if(e&&e.name==='NotFoundError')return this.appendChild(n);throw e}}}}catch(e){console.warn('safe insertBefore install',e)}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function content(){for(let i=0;i<12;i++){const e=document.getElementById('erpContent');if(e&&e.isConnected)return e;await sleep(25)}return null}
// Repair Master Attendance so route races never write into a missing node.
window.v75MasterAttendance=async function(){
 if(!(typeof v75Admin==='function'&&v75Admin()||typeof v75Teacher==='function'&&v75Teacher()))return window.toast?.('Permission denied');
 const host=await content();if(!host)return window.toast?.('ERP content अभी ready नहीं है. फिर खोलें.');
 try{window.head?.('📋 Master Attendance',(v75Admin()?'All Classes':'Assigned Classes')+' • Date-wise consolidated view')}catch(_){}
 const allClasses=Array.isArray(window.cls)?window.cls:[];
 const allowed=(typeof v75Teacher==='function'&&v75Teacher()&&typeof v14AllowedClassNames==='function')?(v14AllowedClassNames()||[]):allClasses;
 if(typeof v75Teacher==='function'&&v75Teacher()&&!allowed.length){host.innerHTML='<div class="panel"><div class="empty">Admin ने अभी कोई class assign नहीं की है.</div></div>';return}
 host.innerHTML=`<div class="panel"><div class="v75Tools"><input id="v75AttDate" type="date" value="${typeof today==='function'?today():new Date().toISOString().slice(0,10)}"><select id="v75AttClass"><option value="">${v75Admin()?'All Classes':'All Assigned Classes'}</option>${allowed.map(c=>`<option>${typeof v75Esc==='function'?v75Esc(c):c}</option>`).join('')}</select><input id="v75AttQ" placeholder="Student / Father / Admission"><button class="primary" onclick="v75LoadMasterAttendance()">Show</button></div><div id="v75AttBody"><div class="empty">Loading...</div></div></div>`;
 if(typeof window.v75LoadMasterAttendance==='function')await window.v75LoadMasterAttendance();
};
// Guard attendance body if user changes route while async queries are running.
if(typeof window.v75LoadMasterAttendance==='function'){const old=window.v75LoadMasterAttendance;window.v75LoadMasterAttendance=async function(){try{return await old.apply(this,arguments)}catch(e){const b=document.getElementById('v75AttBody');if(b)b.innerHTML='<div class="dangerNote">'+String(e?.message||e||'Attendance load failed').replace(/[<>]/g,'')+'</div>';else console.warn('attendance route changed',e);return null}}}
// Special routes can be clicked while previous wrappers are still repainting. Serialize one paint frame first.
if(typeof window.render==='function'){const base=window.render;let token=0;window.render=async function(route){const my=++token;await content();await new Promise(r=>requestAnimationFrame(()=>r()));if(my!==token)return null;try{return await base.apply(this,arguments)}catch(e){console.error('V53 stable route',route,e);window.toast?.('Option open नहीं हुआ: '+String(e?.message||e).slice(0,160));return null}}}
// Admit publish: ensure ERP content exists before the older V92 renderer touches it.
if(typeof window.v92AdmitPublishCenter==='function'){const old=window.v92AdmitPublishCenter;window.v92AdmitPublishCenter=async function(){const h=await content();if(!h)return window.toast?.('ERP content ready नहीं है');return old.apply(this,arguments)}}
})();
