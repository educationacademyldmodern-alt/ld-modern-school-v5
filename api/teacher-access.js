// V64.22 Teacher Access API — Vercel serverless. Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
module.exports = async (req,res)=>{
 if(req.method!=='POST') return res.status(405).json({error:'POST only'});
 const url=process.env.SUPABASE_URL, service=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!service) return res.status(500).json({error:'Server setup missing: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY'});
 const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
 if(!token) return res.status(401).json({error:'Admin session missing'});
 const H={apikey:service,Authorization:'Bearer '+service,'Content-Type':'application/json'};
 const userResp=await fetch(url+'/auth/v1/user',{headers:{apikey:service,Authorization:'Bearer '+token}}); const caller=await userResp.json();
 if(!userResp.ok||!caller?.id) return res.status(401).json({error:'Admin session invalid'});
 const pr=await fetch(url+'/rest/v1/profiles?id=eq.'+encodeURIComponent(caller.id)+'&select=role&limit=1',{headers:H}); const parr=await pr.json();
 if(!['admin','super_admin','principal'].includes(String(parr?.[0]?.role||'').toLowerCase())) return res.status(403).json({error:'Admin/Principal only'});
 const b=req.body||{}; if(b.action!=='create_or_update'||!b.staff_id) return res.status(400).json({error:'Invalid request'});
 const sr=await fetch(url+'/rest/v1/staff?id=eq.'+encodeURIComponent(b.staff_id)+'&select=*&limit=1',{headers:H}); const sa=await sr.json(); const st=sa?.[0];
 if(!st) return res.status(404).json({error:'Teacher staff record not found'});
 const mobile=String(st.phone||'').replace(/\D/g,'').slice(-10); if(mobile.length!==10)return res.status(400).json({error:'Teacher valid 10 digit mobile required'});
 const loginEmail='t'+mobile+'@teacher.ldmodern.local';
 let filter=st.employee_id?'employee_id=eq.'+encodeURIComponent(st.employee_id):'mobile=eq.'+encodeURIComponent(mobile); let tpr=await fetch(url+'/rest/v1/teacher_profiles?'+filter+'&select=*&limit=1',{headers:H}); let ta=await tpr.json(); let tp=ta?.[0]; if(!tp){let mr=await fetch(url+'/rest/v1/teacher_profiles?or=(mobile.eq.'+encodeURIComponent(mobile)+',phone.eq.'+encodeURIComponent(mobile)+')&select=*&limit=1',{headers:H});let ma=await mr.json();tp=ma?.[0]} let uid=tp?.auth_user_id, created=false;
 if(!uid){
   let lr=await fetch(url+'/auth/v1/admin/users?page=1&per_page=1000',{headers:H});let lu=await lr.json();let ex=(lu?.users||[]).find(x=>String(x.email||'').toLowerCase()===loginEmail.toLowerCase());if(ex?.id)uid=ex.id;
 }
 if(!uid){
   if(String(b.password||'').length<8)return res.status(400).json({error:'Initial password minimum 8 characters'});
   const cr=await fetch(url+'/auth/v1/admin/users',{method:'POST',headers:H,body:JSON.stringify({email:loginEmail,password:b.password,email_confirm:true,user_metadata:{role:'teacher',mobile,employee_id:st.employee_id||''}})}); const cu=await cr.json();
   if(!cr.ok){return res.status(cr.status).json({error:cu.msg||cu.message||'Teacher Auth user create failed'})} uid=cu.id;created=true;
 }else if(b.password){
   const ur=await fetch(url+'/auth/v1/admin/users/'+encodeURIComponent(uid),{method:'PUT',headers:H,body:JSON.stringify({password:b.password})});if(!ur.ok){let e=await ur.json();return res.status(ur.status).json({error:e.msg||e.message||'Password reset failed'})}
 }
 const classes=[...new Set((Array.isArray(b.classes)?b.classes:[]).map(x=>String(x).trim()).filter(Boolean))];
 const profile={auth_user_id:uid,employee_id:st.employee_id||null,teacher_name:st.staff_name||'Teacher',mobile,phone:mobile,email:loginEmail,approval_status:'Approved',is_active:true,requested_classes:classes,updated_at:new Date().toISOString()};
 // IMPORTANT: an existing Teacher profile must be updated IN PLACE.
 // Do not POST/upsert it by auth_user_id: legacy rows may have a blank auth_user_id and
 // an insert can fire old staff-sync triggers, causing staff_employee_id_unique_nonblank.
 if(tp?.id){
   const prh={...H,Prefer:'return=representation'};
   const upr=await fetch(url+'/rest/v1/teacher_profiles?id=eq.'+encodeURIComponent(tp.id),{method:'PATCH',headers:prh,body:JSON.stringify(profile)});
   const upa=await upr.json();
   if(!upr.ok)return res.status(500).json({error:upa.message||'Existing Teacher profile update failed'});
   tp=upa?.[0]||{...tp,...profile};
 }else{
   // No teacher_profile row exists yet. Create the login profile WITHOUT copying staff.employee_id.
   // Legacy DB triggers may mirror teacher_profiles.employee_id back into staff; sending an existing
   // employee_id here can attempt a second staff insert and hit staff_employee_id_unique_nonblank.
   // The permanent staff identity stays in staff.id / staff.employee_id; teacher login is linked by
   // auth_user_id + mobile and class assignments. This is safe for both legacy and newly-added staff.
   const createProfile={...profile,employee_id:null};
   const ph={...H,Prefer:'return=representation'};
   const upr=await fetch(url+'/rest/v1/teacher_profiles',{method:'POST',headers:ph,body:JSON.stringify(createProfile)});
   const upa=await upr.json();
   if(!upr.ok)return res.status(500).json({error:upa.message||'Teacher login profile create failed'});
   tp=upa?.[0];
 }
 const tpid=tp?.id; if(!tpid)return res.status(500).json({error:'Teacher profile ID unavailable'});
 // Keep the central role profile linked to the SAME auth user, like Parent/Student login mapping.
 const centralProfile={id:uid,email:loginEmail,full_name:st.staff_name||'Teacher',role:'teacher',status:'active'};
 const cpr=await fetch(url+'/rest/v1/profiles?on_conflict=id',{method:'POST',headers:{...H,Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(centralProfile)});
 if(!cpr.ok){let e=await cpr.json().catch(()=>({}));return res.status(500).json({error:e.message||'Teacher central login profile save failed'})}
 await fetch(url+'/rest/v1/teacher_class_assignments?teacher_profile_id=eq.'+encodeURIComponent(tpid),{method:'PATCH',headers:{...H,Prefer:'return=minimal'},body:JSON.stringify({is_active:false,updated_at:new Date().toISOString()})});
 for(const c of classes){
   // V64.23: do not depend on PostgREST ON CONFLICT metadata. Older production DBs may
   // have the rows/index but not a matching constraint visible to ON CONFLICT yet.
   const q=url+'/rest/v1/teacher_class_assignments?teacher_profile_id=eq.'+encodeURIComponent(tpid)+'&class_name=eq.'+encodeURIComponent(c)+'&select=id&limit=1';
   const er=await fetch(q,{headers:H}); const ea=await er.json(); const ex=ea?.[0];
   const body={teacher_profile_id:tpid,class_name:c,is_class_teacher:String(b.class_teacher||'')===c,is_active:true,updated_at:new Date().toISOString()};
   let rr;
   if(ex?.id) rr=await fetch(url+'/rest/v1/teacher_class_assignments?id=eq.'+encodeURIComponent(ex.id),{method:'PATCH',headers:{...H,Prefer:'return=minimal'},body:JSON.stringify(body)});
   else rr=await fetch(url+'/rest/v1/teacher_class_assignments',{method:'POST',headers:{...H,Prefer:'return=minimal'},body:JSON.stringify(body)});
   if(!rr.ok){let e=await rr.json().catch(()=>({}));return res.status(500).json({error:e.message||'Class assignment save failed'})}
 }
 return res.status(200).json({ok:true,created,teacher_name:st.staff_name,login_id:mobile,mobile,classes});
};
