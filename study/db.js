(function(){
  'use strict';
  const cfg=window.SKY_STUDIO_CONFIG||{};
  const SESSION_KEY='sky-studio-supabase-session-v1';
  let remotePollers=new Map();
  const configured=()=>!!(String(cfg.supabaseUrl||'').trim()&&String(cfg.supabaseAnonKey||'').trim());
  const base=()=>String(cfg.supabaseUrl||'').replace(/\/$/,'');
  const apiKey=()=>String(cfg.supabaseAnonKey||'').trim();
  const loadSession=()=>{try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{return null}};
  const saveSession=s=>{if(s)localStorage.setItem(SESSION_KEY,JSON.stringify(s));else localStorage.removeItem(SESSION_KEY)};
  async function readBody(r){const t=await r.text();if(!t)return null;try{return JSON.parse(t)}catch{return t}}
  async function raw(url,opts={}){const r=await fetch(url,opts);const body=await readBody(r);if(!r.ok){const msg=body?.msg||body?.message||body?.error_description||body?.error||`${r.status} ${r.statusText}`;const e=new Error(msg);e.status=r.status;e.body=body;throw e}return body}
  async function refreshSession(){const s=loadSession();if(!s?.refresh_token) return null;try{const n=await raw(base()+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:apiKey(),'Content-Type':'application/json'},body:JSON.stringify({refresh_token:s.refresh_token})});const merged={...s,...n,expires_at:Math.floor(Date.now()/1000)+(n.expires_in||3600)};saveSession(merged);return merged}catch(e){saveSession(null);return null}}
  async function session(){let s=loadSession();if(!s)return null;const exp=Number(s.expires_at||0);if(exp&&exp<Math.floor(Date.now()/1000)+30)s=await refreshSession();return s}
  async function authHeaders(){const s=await session();if(!s?.access_token)throw new Error('Login Required / लॉगिन आवश्यक');return {apikey:apiKey(),Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'}}
  async function user(){if(!configured())return null;let s=await session();if(!s?.access_token)return null;try{return await raw(base()+'/auth/v1/user',{headers:{apikey:apiKey(),Authorization:'Bearer '+s.access_token}})}catch(e){if(e.status===401){s=await refreshSession();if(!s)return null;return raw(base()+'/auth/v1/user',{headers:{apikey:apiKey(),Authorization:'Bearer '+s.access_token}})}throw e}}
  async function login(email,password){if(!configured())throw new Error('Cloud config not set');const data=await raw(base()+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:apiKey(),'Content-Type':'application/json'},body:JSON.stringify({email,password})});saveSession({...data,expires_at:Math.floor(Date.now()/1000)+(data.expires_in||3600)});return data.user}
  async function logout(){const s=await session();try{if(s?.access_token)await raw(base()+'/auth/v1/logout',{method:'POST',headers:{apikey:apiKey(),Authorization:'Bearer '+s.access_token}})}catch{}saveSession(null);for(const id of remotePollers.values())clearInterval(id);remotePollers.clear()}
  const queryString=(eq={},extra={})=>{const p=new URLSearchParams();Object.entries(eq||{}).forEach(([k,v])=>{if(v!==undefined&&v!==null&&v!=='')p.set(k,'eq.'+v)});Object.entries(extra||{}).forEach(([k,v])=>{if(v!==undefined&&v!==null&&v!=='')p.set(k,String(v))});return p.toString()};
  async function rest(table,{method='GET',eq={},body=null,select='*',prefer='',extra={}}={}){const h=await authHeaders();h.Accept='application/json';if(prefer)h.Prefer=prefer;const q={...extra};if(method==='GET'||prefer.includes('return=representation'))q.select=select;const qs=queryString(eq,q);const url=base()+'/rest/v1/'+encodeURIComponent(table)+(qs?'?'+qs:'');return raw(url,{method,headers:h,body:body==null?undefined:JSON.stringify(body)})}
  async function rowOwner(){const u=await user();if(!u)throw new Error('Login Required / लॉगिन आवश्यक');return u.id}
  async function select(table,query={}){const rows=await rest(table,{method:'GET',eq:query.eq||{},select:query.columns||'*',extra:query.order?{order:`${query.order}.${query.ascending===false?'desc':'asc'}`}:{}});return Array.isArray(rows)?rows:[]}
  async function insert(table,row){const owner_id=await rowOwner();return rest(table,{method:'POST',body:{...row,owner_id},prefer:'return=representation'})}
  async function upsert(table,row,conflict){const owner_id=await rowOwner();return rest(table,{method:'POST',body:{...row,owner_id},prefer:'resolution=merge-duplicates,return=representation',extra:conflict?{on_conflict:conflict}:{}})}
  async function update(table,row,eq={}){return rest(table,{method:'PATCH',eq,body:row,prefer:'return=representation'})}
  async function remove(table,id){return rest(table,{method:'DELETE',eq:{id},prefer:'return=representation'})}
  async function saveProgress(courseId,state){return upsert('teaching_progress',{course_id:courseId,state_json:state,updated_at:new Date().toISOString()},'owner_id,course_id')}
  async function loadProgress(courseId){const r=await select('teaching_progress',{eq:{course_id:courseId}});return r[0]?.state_json||null}
  async function saveBrand(brand){return upsert('teaching_brand_config',{id:'00000000-0000-0000-0000-000000000001',brand_json:brand,updated_at:new Date().toISOString()},'owner_id')}
  async function loadBrand(){const r=await select('teaching_brand_config');return r[0]?.brand_json||null}
  async function saveTopic(topic){const id=topic.id||crypto.randomUUID();return upsert('teaching_topics',{id,title:topic.title,subject:topic.subject||'',chapter:topic.chapter||'',content_json:topic,status:topic.status||'DRAFT',version_no:topic.version||1,updated_at:new Date().toISOString()},'id')}
  async function saveTopicVersion(topic,changeNote){const owner_id=await rowOwner();return rest('teaching_topic_versions',{method:'POST',body:{owner_id,topic_id:topic.id,version_no:topic.version||1,snapshot_json:topic,change_note:changeNote||'Updated all outputs'},prefer:'return=representation'})}
  async function loadTopics(){return select('teaching_topics',{order:'updated_at',ascending:false})}
  async function saveCurrentAffairs(pack){return upsert('teaching_current_affairs',{pack_date:pack.date,status:pack.status||'NEEDS REVIEW',items_json:pack.items||[],source_note:pack.note||'',last_verified_at:pack.lastVerified||null,updated_at:new Date().toISOString()},'owner_id,pack_date')}
  async function loadCurrentAffairs(date){const r=await select('teaching_current_affairs',{eq:{pack_date:date}});return r[0]||null}
  async function createRemoteSession(payload={}){const code=String(Math.floor(100000+Math.random()*900000));const rows=await insert('teaching_remote_sessions',{code,status:'active',payload_json:payload});return rows?.[0]||null}
  async function getRemoteSession(code){const r=await select('teaching_remote_sessions',{eq:{code,status:'active'}});return r[0]||null}
  async function watchRemote(sessionId,onCommand){let last='';if(remotePollers.has(sessionId))clearInterval(remotePollers.get(sessionId));const tick=async()=>{try{const r=await select('teaching_remote_sessions',{eq:{id:sessionId,status:'active'}});const s=r[0];if(!s)return;const stamp=String(s.command_at||'')+'|'+String(s.last_command||'');if(s.last_command&&stamp!==last){last=stamp;onCommand(s.last_command,s)}}catch{}};await tick();const id=setInterval(tick,1500);remotePollers.set(sessionId,id);return {id,mode:'active-only-poll'}}
  async function sendRemote(code,command){const rows=await update('teaching_remote_sessions',{last_command:command,command_at:new Date().toISOString()},{code,status:'active'});if(!rows?.length)throw new Error('Pairing code not found / code नहीं मिला');return rows[0]}
  async function closeRemote(sessionId){await update('teaching_remote_sessions',{status:'closed'},{id:sessionId});const id=remotePollers.get(sessionId);if(id)clearInterval(id);remotePollers.delete(sessionId)}
  function get(){return {auth:{getUser:async()=>({data:{user:await user()}}),signInWithPassword:async({email,password})=>{try{return {data:{user:await login(email,password)},error:null}}catch(error){return {data:null,error}}},signOut:async()=>logout()},from:(table)=>({insert:async(row)=>{try{return {data:await insert(table,row),error:null}}catch(error){return {data:null,error}}}})}}
  window.SKY_DB={configured,get,user,login,logout,select,insert,upsert,update,remove,saveProgress,loadProgress,saveBrand,loadBrand,saveTopic,saveTopicVersion,loadTopics,saveCurrentAffairs,loadCurrentAffairs,createRemoteSession,getRemoteSession,watchRemote,sendRemote,closeRemote};
})();
