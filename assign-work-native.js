/* Scoped delegation for existing Management Center routes. No role impersonation. */
(()=>{'use strict';const W=window,D=document,baseFetch=W.fetch.bind(W),db=()=>typeof sb!=='undefined'?sb:W.sb;
const RULES={"routes": ["v90_attendance_monitor", "attendance_conflict_center", "v90_exam_monitor", "v90_marks_monitor", "v90_transport_monitor", "v90_presence_monitor", "v90_student_requests", "v90_teacher_requests", "timetable_master", "v90_teaching_monitor", "academic_monitor", "master_gate_pass", "v91_parent_updates", "v92_admit_publish", "parent_access"], "rules": {"v90_attendance_monitor": {"students": ["read"], "attendance": ["read"], "staff_attendance": ["read"]}, "attendance_conflict_center": {"students": ["read"], "attendance": ["read"]}, "v90_exam_monitor": {"students": ["read"], "v69_exam_master": ["read"], "v69_exam_classes": ["read"], "v69_admit_card_controls": ["read"], "v90_exam_attendance": ["read", "write", "edit"]}, "v90_marks_monitor": {"students": ["read"], "student_marks": ["read"], "v90_marks_check_status": ["read"], "academics": ["read"]}, "v90_transport_monitor": {"students": ["read"], "transport": ["read"], "v90_transport_trip_attendance": ["read", "write", "edit"]}, "v90_presence_monitor": {"students": ["read"], "attendance": ["read"], "staff_attendance": ["read"], "leave": ["read"], "student_leave_requests": ["read"]}, "v90_student_requests": {"students": ["read"], "student_leave_requests": ["read"], "student_correction_requests": ["read"], "student_roster_requests": ["read"]}, "v90_teacher_requests": {"students": ["read"], "v90_teacher_requests": ["read", "approve"], "student_roster_requests": ["read"], "leave": ["read"]}, "timetable_master": {"students": ["read"], "academics": ["read"], "timetable": ["read"], "v763_bell_time_master": ["read", "global"]}, "v90_teaching_monitor": {"students": ["read"], "timetable": ["read"], "teaching_diary": ["read"]}, "academic_monitor": {"students": ["read"], "timetable": ["read"], "teaching_diary": ["read"], "syllabus_master": ["read"], "ldm_v265_copy_checks": ["read"], "ldm_v265_bell_tests": ["read"], "ldm_v265_principal_audits": ["read"]}, "master_gate_pass": {"students": ["read"], "v102_student_gate_pass": ["read"]}, "v91_parent_updates": {"students": ["read"], "student_correction_requests": ["read"]}, "v92_admit_publish": {"students": ["read"], "v69_exam_master": ["read"], "v69_exam_classes": ["read"], "v69_admit_card_controls": ["read"], "v92_admit_publication_controls": ["read"]}, "parent_access": {"students": ["read"]}}, "permissions": {"v90_attendance_monitor": ["read", "staff"], "attendance_conflict_center": ["read", "approve"], "v90_exam_monitor": ["read", "write", "edit"], "v90_marks_monitor": ["read"], "v90_transport_monitor": ["read", "write", "edit"], "v90_presence_monitor": ["read", "staff"], "v90_student_requests": ["read", "approve"], "v90_teacher_requests": ["read", "approve", "staff"], "timetable_master": ["read", "write", "edit", "global"], "v90_teaching_monitor": ["read"], "academic_monitor": ["read", "write", "edit", "approve"], "master_gate_pass": ["read", "write", "edit", "approve"], "v91_parent_updates": ["read", "approve"], "v92_admit_publish": ["read", "approve"], "parent_access": ["read"]}};
let context=null,owner='',opening=false,writes=0,epoch=0,navigation=0,observer=null;const reads=new Set();
const currentProfile=()=>typeof profile!=='undefined'?profile:W.profile;
const actor=()=>String(currentProfile()?.id||'');
const teacher=()=>String(currentProfile()?.role||'').toLowerCase()==='teacher';
const family=(c,r)=>!!c&&(r===c.route||(c.route==='v90_student_requests'&&r==='student_requests')||(['v90_exam_monitor','v90_marks_monitor'].includes(c.route)&&r==='central_exam'));
function valid(){if(context&&(!teacher()||owner!==actor()))clear();return context}
function active(route){const c=valid();return !!c&&(route?c.route===route:family(c,String(W.__ldmDelegatedOpeningRoute||W.__v90Route||'')))}
function can(action){return !!valid()?.permissions?.includes(action)}
function clear(){observer?.disconnect();observer=null;epoch++;for(const c of reads)c.abort();reads.clear();context=null;owner='';W.__ldmDelegatedContext=null;W.__ldmDelegatedOpeningRoute='';W.__v90MonitorCache={};W.LDM_NETWORK_ECONOMY433?.invalidate?.();D.getElementById('awNativeBar')?.remove();D.querySelectorAll('[data-aw-was-disabled]').forEach(b=>{b.disabled=b.dataset.awWasDisabled==='true';delete b.dataset.awWasDisabled;b.removeAttribute('title')})}
const denied=message=>new Response(JSON.stringify({code:'42501',message,details:null,hint:null}),{status:403,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const rpcActions={ldm_attendance_resolution_statuses:'read',ldm_resolve_attendance_conflict:'approve',ldm_reopen_attendance_conflict:'approve',v763_save_teacher_week:'edit',v91_review_student_correction:'approve',v64_review_student_correction:'approve',v64_review_student_leave:'approve',v92_set_admit_publication:'approve',ldm_fee_due_snapshot_v2:'read',ldm_v259_gate_students:'read',ldm_v259_gate_pass_assigned:'read',v102_create_gate_pass:'write',v102_review_gate_pass:'approve',v102_mark_gate_pass_event:'edit',ldm_v265_class_roster:'read',ldm_v265_copy_check_save:'edit',ldm_v265_bell_test_save:'edit',ldm_v265_principal_audit_save:'approve',ldm_v267_teacher_academic_summary:'read',ldm_aw_refs:'read'};
const taskRPC=new Set(['ldm_exam_list476','ldm_exam_load476','ldm_exam_save476','ldm_aw_context','ldm_work403_read','ldm_work403_write','ldm_work403_history']);
async function scopedFetch(input,init){const c=valid();if(!c)return baseFetch(input,init);const req=new Request(input,init),url=new URL(req.url);
 if(!url.pathname.startsWith('/rest/v1/'))return baseFetch(req);
 let rpc=url.pathname.includes('/rpc/'),name=decodeURIComponent(url.pathname.split('/').pop()),method=req.method.toUpperCase();
 if(rpc&&taskRPC.has(name)){if(name.startsWith('ldm_exam_')){const h=new Headers(req.headers);h.set('x-ldm-work-assignment',c.assignment);return baseFetch(new Request(req,{headers:h}))}return baseFetch(req)}
 const ref=!rpc&&['teacher_profiles','staff'].includes(name)&&method==='GET';
 let action=rpc?rpcActions[name]:method==='GET'||method==='HEAD'?'read':method==='POST'?'write':method==='PATCH'?'edit':'delete';
 if(name==='v90_teacher_requests'&&action==='edit')action='approve';
 if(name==='v763_bell_time_master'&&action!=='read')action='global';
 if(!ref&&(!action||!can(action)||(!rpc&&!RULES.rules[c.route]?.[name]?.includes(action))))return denied('इस assignment में यह Data / Action अनुमति नहीं है।');
 const headers=new Headers(req.headers);headers.set('x-ldm-work-assignment',c.assignment);headers.set('x-ldm-fresh','1');headers.set('Cache-Control','no-store');
 const ticket=epoch,isRead=action==='read'||ref,controller=isRead?new AbortController():null;if(controller)reads.add(controller);else writes++;
 const abort=()=>controller?.abort();if(req.signal.aborted)abort();req.signal.addEventListener('abort',abort,{once:true});
 try{
  let response;
  if(ref){
   headers.set('Content-Type','application/json');headers.set('Accept','application/json');
   response=await baseFetch(url.origin+'/rest/v1/rpc/ldm_aw_refs',{method:'POST',headers,body:JSON.stringify({p_kind:name}),signal:controller.signal,cache:'no-store'});
   if(response.ok){let rows=await response.json();for(const [k,v]of url.searchParams){if(['select','order','limit','offset'].includes(k))continue;if(v.startsWith('eq.'))rows=rows.filter(r=>String(r[k]??'')===v.slice(3));else return denied('Unsupported scoped reference filter');}
    const count=rows.length;rows=rows.slice(Number(url.searchParams.get('offset')||0),Number(url.searchParams.get('offset')||0)+Number(url.searchParams.get('limit')||3000));
    const single=(req.headers.get('Accept')||'').includes('vnd.pgrst.object');if(single&&rows.length!==1)return new Response(JSON.stringify({code:'PGRST116',message:'Expected one reference'}),{status:406,headers:{'Content-Type':'application/json'}});
    response=new Response(JSON.stringify(single?rows[0]:rows),{status:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store','Content-Range':`0-${Math.max(0,rows.length-1)}/${count}`}});
   }
  }else{
   let target=req;if(!rpc&&name==='students'){url.pathname=url.pathname.replace(/students$/,'ldm_aw_students');target=new Request(url,req)}if(name==='ldm_v259_gate_pass_assigned'){url.pathname=url.pathname.replace(name,'ldm_aw_gate_assigned');target=new Request(url,req)}
   response=await baseFetch(new Request(target,{headers,cache:'no-store',...(controller?{signal:controller.signal}:{})}));
  }
  if(ticket!==epoch||owner!==actor())throw new DOMException('Assignment changed','AbortError');return response;
 }finally{if(controller)reads.delete(controller);else writes--;req.signal.removeEventListener('abort',abort)}
}
function decorate(){if(!valid())return;const root=D.getElementById('erpContent');if(!root)return;
 let bar=D.getElementById('awNativeBar');if(!bar){bar=D.createElement('div');bar.id='awNativeBar';bar.style.cssText='display:flex;gap:10px;flex-wrap:wrap;align-items:center;padding:12px;border:1px solid #b8d3e4;border-radius:12px;margin-bottom:12px;background:#edf6ff;color:#163a55';const back=D.createElement('button');back.textContent='← Assigned Work';back.onclick=()=>W.render('assigned_work');const home=D.createElement('button');home.textContent='⌂ Home';home.onclick=()=>W.render('dashboard');const label=D.createElement('span');label.textContent=[context.class||'All Classes',context.section||'All Sections',context.subject||'All Subjects','अधिकार: '+context.permissions.join(', ')].join(' • ');bar.append(back,home,label);root.prepend(bar)}
 const checks=[[/ldm(Resolve|Reopen)AttendanceConflict/,'approve'],[/v265Save(Copy|Test)/,'edit'],[/v265SaveAudit/,'approve'],[/v90MarkExamAttendance\(/,'edit'],[/v90MarkTrip\(/,'edit'],[/v763Save(Selected|WholeWeek)|v763SaveRows/,'edit'],[/v763SaveTimeMaster/,'global'],[/v91.*(Correction|Corrections)|v64(AdminReviewLeave|AdminReviewCorrection)|v102Review|v90ReviewTeacher/,'approve'],[/v92SetPublish/,'approve'],[/v102Mark/,'edit'],[/v102Create/,'write']];
 D.querySelectorAll('button[onclick]').forEach(b=>{const code=b.getAttribute('onclick')||'';let reason='';for(const [re,permission]of checks)if(re.test(code)&&!can(permission))reason='यह action Admin ने assign नहीं किया है।';
  if(/v108(SaveSelected|GenerateCommon)|v64AdminReviewRoster/.test(code)||/v92SetPublish\(true,true\)/.test(code))reason='यह संवेदनशील action Primary Admin के पास रहेगा।';
  if(reason){if(b.dataset.awWasDisabled===undefined)b.dataset.awWasDisabled=String(b.disabled);b.disabled=true;b.title=reason;b.setAttribute('aria-label',(b.textContent||'')+' — '+reason)}
 });
}
async function open(id,task){if(opening||writes)return;opening=true;const startedBy=actor(),startedAt=navigation;try{
 if(!teacher())throw Error('Teacher login required');
 const r=await db().rpc('ldm_aw_context',{p_assignment:id});if(startedAt!==navigation||startedBy!==actor()||!teacher())return;if(r.error)throw r.error;
 if(!r.data||r.data.route!==task.module_route||!r.data.permissions?.includes('read'))throw Error('Assignment inactive, expired, completed या permission उपलब्ध नहीं।');
 clear();context=r.data;owner=actor();W.__ldmDelegatedOpeningRoute=context.route;
 if(task.assignees?.find(a=>a.id===id)?.status==='assigned'){const status=await db().rpc('ldm_work403_write',{p_request:crypto.randomUUID(),p_action:'progress',p_data:{assignment:id,status:'in_progress',note:''}});if(status.error)W.toast?.('कार्य खुल रहा है; status update नहीं हुआ: '+status.error.message)}
 if(startedAt!==navigation||startedBy!==actor()||!context)return;await W.render(['v90_exam_monitor','v90_marks_monitor'].includes(context.route)?'central_exam':context.route);if(!context||owner!==startedBy||!family(context,W.__v90Route)){clear();return;}decorate();const host=D.getElementById('erpContent');if(host){observer=new MutationObserver(()=>decorate());observer.observe(D.body,{childList:true,subtree:true})}
 }catch(e){clear();W.toast?.(e.message||String(e));throw e}finally{W.__ldmDelegatedOpeningRoute='';opening=false}}
const legacyActive=W.ldmDelegatedRouteActive;W.ldmDelegatedRouteActive=function(route=''){return active()&&family(context,route||W.__ldmDelegatedOpeningRoute||W.__v90Route)||(!context&&legacyActive?.(route))||false};
const authorize=W.v1146TeacherAuthorize;if(authorize)W.v1146TeacherAuthorize=async function(route,...rest){if(valid()&&family(context,route))return {ok:true,delegated:true,assignment_id:context.assignment,delegated_route:context.route};return authorize.call(this,route,...rest)};
const render=W.render;if(render)W.render=async function(route,...args){const c=valid();if(c&&!family(c,route)){
 if(writes){W.toast?.('Save की पुष्टि आने तक रुकें।');return}
 if(W.LDM_WORK_ACCESS398?.canLeave?.()===false)return;
 clear();
 }
 navigation++;const result=await render.call(this,route,...args);decorate();return result};
// Reapply disabled actions only to changed native content; disconnected on navigation.
const oldDecorate=decorate;
W.LDM_ASSIGN_WORK=Object.freeze({open,active,can,clear,fetch:scopedFetch,rules:RULES,decorate:oldDecorate});
W.addEventListener('beforeunload',e=>{if(writes){e.preventDefault();e.returnValue=''}});
})();
