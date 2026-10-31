/* V434 recheck of V433: bounded read coalescing and memory cache. No polling, log uploads, write retries,
   auth interception, persistent student data, or changes to database authorization. */
(function(W){'use strict';
if(W.LDM_NETWORK_ECONOMY433)return;
const native=W.fetch.bind(W),cache=new Map(),flights=new Map(),cooldowns=new Map();
const MAX_ENTRIES=64,MAX_BYTES=2*1024*1024,MAX_ITEM=256*1024;
let bytes=0,epoch=0,refreshDepth=0,activeReads=0,activeGeneralReads=0;const readQueue=[];
const counters={networkReads:0,writes:0,joined:0,cacheHits:0,errorPauses:0,invalidations:0,foregroundReads:0,maxQueueWaitMs:0,maxForegroundQueueWaitMs:0,maxReadHeaderMs:0,throttledReads:0,failedReads:0};
// Only audited read-only RPCs; unknown RPCs always pass through as possible writes.
const READ_RPC=new Set(['ldm472_teacher_due','ldm472_bootstrap','ldm472_progress','ldm472_exam_load','ldm472_id_rows','ldm472_id_state','ldm_v470_bootstrap','ldm_v470_read','ldm_v470_edit_state','ldm_v398_bootstrap','ldm_v398_records','ldm_v398_fee_students','ldm_v406_fee_status','ldm_teacher_context_v2','ldm_teacher_class_fee_due_v254','ldm_fee_due_snapshot_v2','ldm_v362_paper_get','ldm_v362_paper_list','ldm_v272_my_assignment_for_route','ldm_v259_gate_pass_assigned','ldm_v259_gate_students','ldm_v320_attendance_load','ldm_v320_exam_load','ldm_v320_exam_list','ldm_v320_daily_snapshot','ldm_v320_daily_birthdays','ldm_work403_read','ldm_work403_history','ldm_v336_database_health','ldm_v336_promotion_candidates','ldm_v462_scan_capabilities','ldm_v465_exam_scope','ldm_v466_parent_portal_summary','ldm_v466_parent_fee_due']);
const sensitive=/profile|permission|assignment|fee|payment|receipt|attendance|mark|exam|admission|approval|gate|presence|due|balance/i;
function erase(k){const old=cache.get(k);if(old){bytes-=old.body.byteLength;cache.delete(k)}}
function clear(){epoch++;cache.clear();cooldowns.clear();bytes=0;counters.invalidations++}
let bc=null;try{bc=new BroadcastChannel('ldm-local-invalidation-v433');bc.onmessage=e=>{if(e.data==='changed')clear()}}catch(_){}
function invalidate(notify=false){clear();if(notify)try{bc?.postMessage('changed')}catch(_){}}
function projectOrigin(){try{const c=typeof cfg!=='undefined'?cfg:W.cfg;return c?.url?new URL(c.url,W.location.href).origin:null}catch(_){return null}}
// Keep two of six read slots available for a focused search / current student / current sheet.
// Only these narrow, audited operations receive priority; writes still bypass the read queue.
function foregroundRead(url,name,body){
 if(!url.pathname.includes('/rpc/')){
  const narrow=['id','admission_no','student_id'].some(k=>/^(eq\.|in\.)/.test(url.searchParams.get(k)||''));
  return ['students','student_fee_settings','student_fee_schedules','fee_payments'].includes(name)&&(narrow||name==='students'&&url.searchParams.has('or'));
 }
 if(['ldm_v320_attendance_load','ldm_v320_exam_load','ldm_v466_parent_fee_due'].includes(name))return true;
 if(name==='ldm_fee_due_snapshot_v2'){try{const a=JSON.parse(body||'{}').p_admission_nos;return Array.isArray(a)&&a.length>0&&a.length<=25}catch(_){}}
 return false;
}
function classify(input,init){let url;try{url=new URL(typeof input==='string'||input instanceof URL?input:input.url,W.location.href)}catch(_){return null}if(url.origin!==projectOrigin()||!url.pathname.startsWith('/rest/v1/'))return null;
 const req=new Request(input,init);const method=req.method.toUpperCase(),rpc=url.pathname.match(/\/rpc\/([^/]+)$/),name=rpc?decodeURIComponent(rpc[1]):url.pathname.split('/').pop();
 const read=method==='GET'||method==='HEAD'||method==='POST'&&rpc&&READ_RPC.has(name);
 let ttl=method==='GET'&&!rpc&&!sensitive.test(name)?15000:0;
 // Authoritative fees, marks, attendance and access decisions are never served from completed cache.
 if(refreshDepth||['reload','no-store','no-cache'].includes(req.cache)||/no-cache|no-store/i.test(req.headers.get('cache-control')||'')||req.headers.has('x-ldm-fresh'))ttl=0;
 const body=method==='POST'?init?.body:undefined;if(method==='POST'&&typeof body!=='string')return{read:false,req};
 const key=[epoch,method,url.href,[...req.headers].map(([k,v])=>k+':'+v).join('\n'),body||'',req.credentials,req.cache].join('|');
 return{read,req,key,ttl,foreground:read&&foregroundRead(url,name,body),noReuse:refreshDepth>0||['reload','no-store','no-cache'].includes(req.cache)||/no-cache|no-store/i.test(req.headers.get('cache-control')||'')||req.headers.has('x-ldm-fresh')};
}
function readNative(req,foreground=false){return new Promise((resolve,reject)=>{const job={req,resolve,reject,foreground,queuedAt:Date.now(),started:false,onAbort:null};job.onAbort=()=>{if(job.started)return;const i=readQueue.indexOf(job);if(i>=0)readQueue.splice(i,1);reject(req.signal.reason||new DOMException('Aborted','AbortError'))};if(req.signal.aborted)return job.onAbort();req.signal.addEventListener('abort',job.onAbort,{once:true});readQueue.push(job);drain()})}
function drain(){while(activeReads<6&&readQueue.length){
 let index=readQueue.findIndex(job=>job.foreground);
 if(index<0){if(activeGeneralReads>=4)return;index=0}
 const job=readQueue.splice(index,1)[0];job.req.signal.removeEventListener('abort',job.onAbort);
 if(job.req.signal.aborted){job.reject(job.req.signal.reason||new DOMException('Aborted','AbortError'));continue}
 job.started=true;activeReads++;if(!job.foreground)activeGeneralReads++;else counters.foregroundReads++;
 const wait=Math.max(0,Date.now()-job.queuedAt);counters.maxQueueWaitMs=Math.max(counters.maxQueueWaitMs,wait);if(job.foreground)counters.maxForegroundQueueWaitMs=Math.max(counters.maxForegroundQueueWaitMs,wait);counters.networkReads++;const started=Date.now();
 Promise.resolve().then(()=>native(job.req)).then(response=>{counters.maxReadHeaderMs=Math.max(counters.maxReadHeaderMs,Math.max(0,Date.now()-started));if(response.status===429)counters.throttledReads++;if(response.status>=400)counters.failedReads++;job.resolve(response)},error=>{if(error?.name!=='AbortError')counters.failedReads++;job.reject(error)}).finally(()=>{activeReads--;if(!job.foreground)activeGeneralReads--;drain()})
}}

async function smallBody(r,max){if(!r.body)return new ArrayBuffer(0);const reader=r.clone().body.getReader(),parts=[];let n=0;try{for(;;){const x=await reader.read();if(x.done)break;n+=x.value.byteLength;if(n>max){reader.cancel().catch(()=>{});return null}parts.push(x.value)}const body=new Uint8Array(n);let at=0;for(const p of parts){body.set(p,at);at+=p.byteLength}return body.buffer}catch(_){return null}}
function response(v){return new Response(v.body.slice(0),{status:v.status,statusText:v.statusText,headers:v.headers})}
async function remember(r,key,ttl,atEpoch){if(!ttl||!r.ok||!r.body||/no-store/i.test(r.headers.get('cache-control')||'')||r.headers.get('content-type')?.includes('text/event-stream'))return;
 const reader=r.clone().body.getReader(),chunks=[];let n=0;try{while(true){const x=await reader.read();if(x.done)break;n+=x.value.byteLength;if(n>MAX_ITEM){reader.cancel().catch(()=>{});return}chunks.push(x.value)}if(epoch!==atEpoch)return;const body=new Uint8Array(n);let off=0;for(const x of chunks){body.set(x,off);off+=x.byteLength}erase(key);while(cache.size>=MAX_ENTRIES||bytes+n>MAX_BYTES){const k=cache.keys().next().value;if(k===undefined)break;erase(k)}cache.set(key,{body:body.buffer,headers:[...r.headers],status:r.status,statusText:r.statusText,until:Date.now()+ttl});bytes+=n}catch(_){} }
function subscribe(f,signal){return new Promise((resolve,reject)=>{let done=false;f.users++;const finish=(error,value)=>{if(done)return;done=true;signal?.removeEventListener('abort',abort);f.users--;if(!f.users&&!f.done)f.controller.abort();error?reject(error):resolve(value)};const abort=()=>finish(signal?.reason||new DOMException('Aborted','AbortError'));if(signal?.aborted)return abort();signal?.addEventListener('abort',abort,{once:true});f.promise.then(r=>{try{finish(null,r.clone())}catch(e){finish(e)}},e=>finish(e))})}
W.fetch=function(input,init){let c;try{c=classify(input,init)}catch(e){return Promise.reject(e)}if(!c)return native(input,init);
 if(!c.read){invalidate(true);counters.writes++;return native(c.req).finally(()=>invalidate(true))}
 const routeSignal=W.LDM_RUNTIME_V347?.readSignal?.();if(routeSignal&&typeof AbortSignal.any==='function')c.req=new Request(c.req,{signal:AbortSignal.any([c.req.signal,routeSignal])});if(c.req.signal.aborted)return Promise.reject(c.req.signal.reason||new DOMException('Aborted','AbortError'));
 if(!c.noReuse){const hit=cache.get(c.key);if(hit){if(hit.until>Date.now()){counters.cacheHits++;return Promise.resolve(response(hit))}erase(c.key)}const bad=cooldowns.get(c.key);if(bad){if(bad.until>Date.now()){counters.errorPauses++;return bad.error?Promise.reject(bad.error):Promise.resolve(response(bad))}cooldowns.delete(c.key)}const f=flights.get(c.key);if(f&&!f.controller.signal.aborted){counters.joined++;return subscribe(f,c.req.signal)}}
 const controller=new AbortController(),f={controller,users:0,done:false,promise:null},atEpoch=epoch;
 f.promise=readNative(new Request(c.req,{signal:controller.signal}),c.foreground).then(async r=>{
   if(!c.noReuse&&epoch===atEpoch){remember(r,c.key,c.ttl,atEpoch);if([300,400,401,403,404,406,429,500,502,503,504].includes(r.status)){const errorBody=await smallBody(r,16384);if(errorBody!==null){while(cooldowns.size>=32)cooldowns.delete(cooldowns.keys().next().value);const retry=Number(r.headers.get('retry-after')),ms=r.status===404?30000:r.status===429?Math.min(60000,Math.max(3000,(Number.isFinite(retry)&&retry>0?retry:3)*1000)):3000;cooldowns.set(c.key,{body:errorBody,headers:[...r.headers],status:r.status,statusText:r.statusText,until:Date.now()+ms})}}}
   return r;
 }).catch(e=>{if(e?.name!=='AbortError'&&!c.noReuse&&epoch===atEpoch){while(cooldowns.size>=32)cooldowns.delete(cooldowns.keys().next().value);cooldowns.set(c.key,{error:e,until:Date.now()+3000})}throw e}).finally(()=>{f.done=true;if(flights.get(c.key)===f)flights.delete(c.key)});
 if(!c.noReuse)flights.set(c.key,f);return subscribe(f,c.req.signal);
};
W.LDM_NETWORK_ECONOMY433={version:433,revision:471,invalidate,async fresh(fn){invalidate();refreshDepth++;try{return await fn()}finally{refreshDepth--}},stats:()=>({...counters,cacheEntries:cache.size,cacheBytes:bytes,inFlight:flights.size,activeReads,activeGeneralReads,queuedReads:readQueue.length,errorEntries:cooldowns.size})};
W.document?.addEventListener('click',e=>{if(e.target?.closest?.('#ldmV281Refresh,[data-ldm-refresh]'))invalidate()},{capture:true});
W.addEventListener('pagehide',()=>invalidate());
})(window);
