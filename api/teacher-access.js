// V65 consolidated update. Secrets belong only in Vercel server environment.
module.exports = async function(req,res) {
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'POST only'});}
 const root=(process.env.SUPABASE_URL||'').replace(/\/$/,''), key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!root||!key)return res.status(503).json({error:'Vercel में SUPABASE_URL और SUPABASE_SERVICE_ROLE_KEY configure करें.'});
 const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
 if(!token)return res.status(401).json({error:'Admin session required'});
 const headers={apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'};
 let stage='Admin verification';
 async function call(path,method='GET',body,extra={}) {
  const r=await fetch(root+path,{method,headers:{...headers,...extra},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000)});
  const data=await r.json().catch(()=>null);
  if(!r.ok){const e=new Error(stage+': '+(data?.message||data?.msg||data?.error_description||'Database request failed'));e.status=r.status;throw e;}return data;
 }
 const q=encodeURIComponent;
 try {
  const caller=await call('/auth/v1/user','GET',undefined,{Authorization:'Bearer '+token});
  if(!caller?.id)return res.status(401).json({error:'Invalid Admin session'});
  const roles=await call('/rest/v1/profiles?id=eq.'+q(caller.id)+'&select=role,status&limit=2');
  if(roles?.length!==1||!['admin','super_admin','principal'].includes(String(roles[0].role).toLowerCase())||['inactive','blocked','relieved','disabled','suspended','pending','rejected'].includes(String(roles[0].status).toLowerCase()))return res.status(403).json({error:'Active Admin/Principal account required'});
  const b=req.body||{};
  if(b.action!=='create_or_update'||typeof b.staff_id!=='string'||!b.staff_id||!Array.isArray(b.classes))return res.status(400).json({error:'Staff ID and class list required'});
  const classes=[...new Set(b.classes.map(x=>String(x).trim()).filter(Boolean))];
  if(!classes.length||classes.length>50||classes.some(x=>x.length>80))return res.status(400).json({error:'Select valid assigned classes'});
  if(b.password!==undefined&&typeof b.password!=='string')return res.status(400).json({error:'Invalid password'});
  const password=b.password||'';
  if(password&&(password.length<8||password.length>128))return res.status(400).json({error:'Password must contain 8–128 characters'});
  stage='Staff lookup';
  const rows=await call('/rest/v1/staff?id=eq.'+q(b.staff_id)+'&select=*&limit=2');const st=rows?.[0];
  if(rows?.length!==1)return res.status(404).json({error:'Selected Staff record not found'});
  if(['relieved','inactive','blocked'].includes(String(st.status).toLowerCase()))return res.status(409).json({error:'Staff Master में Teacher को Active करें; history सुरक्षित रहेगी.'});
  const mobile=String(st.phone||'').replace(/\D/g,'').replace(/^91(?=\d{10}$)/,'');
  if(!/^[6-9]\d{9}$/.test(mobile))return res.status(400).json({error:'Staff Master में valid 10 digit mobile डालें.'});
  const sameMobile=await call('/rest/v1/staff?or=(phone.eq.'+mobile+',phone.eq.%2B91'+mobile+')&select=id&limit=3');
  if(sameMobile.length>1)return res.status(409).json({error:'यह Mobile कई Staff records पर है. सही mapping की समीक्षा करें; कोई password नहीं बदला.'});
  const email='t'+mobile+'@teacher.ldmodern.local';
  stage='Teacher identity lookup';
  const byMobile=await call('/rest/v1/teacher_profiles?or=(mobile.eq.'+mobile+',phone.eq.'+mobile+')&select=*&limit=3');
  const byEmployee=st.employee_id?await call('/rest/v1/teacher_profiles?employee_id=eq.'+q(st.employee_id)+'&select=*&limit=3'):[];
  const candidates=[...new Map([...byMobile,...byEmployee].map(x=>[x.id,x])).values()];
  if(candidates.length>1)return res.status(409).json({error:'एक से अधिक Teacher profiles मिले. Central mapping ठीक करें; कोई record delete नहीं किया गया.'});
  let tp=candidates[0], uid=tp?.auth_user_id,created=false;
  if(tp?.employee_id&&st.employee_id&&tp.employee_id!==st.employee_id)return res.status(409).json({error:'Mobile दूसरे Employee ID से जुड़ा है. सही Staff चुनें.'});
  stage='Auth identity lookup';
  if(!uid){
   for(let page=1;page<=100;page++){
    const list=await call('/auth/v1/admin/users?page='+page+'&per_page=1000');
    const found=(list?.users||[]).find(x=>String(x.email).toLowerCase()===email);
    if(found){uid=found.id;break;}if((list?.users||[]).length<1000)break;
    if(page===100)throw new Error('Auth lookup incomplete; no new account created');
   }
  }
  if(uid){
   const auth=await call('/auth/v1/admin/users/'+q(uid));
   if(String(auth?.email||'').toLowerCase()!==email)return res.status(409).json({error:'Existing Auth email और Staff mobile अलग हैं; mapping review required.'});
   const central=await call('/rest/v1/profiles?id=eq.'+q(uid)+'&select=role');
   if(central?.some(x=>x.role!=='teacher'))return res.status(409).json({error:'यह account दूसरे role का है. Role/password नहीं बदला गया.'});
  } else {
   if(!password)return res.status(400).json({error:'New Teacher का initial password डालें.'});
   stage='Teacher account creation';
   const auth=await call('/auth/v1/admin/users','POST',{email,password,email_confirm:true,user_metadata:{role:'teacher',mobile,employee_id:st.employee_id||''}});
   uid=auth?.id;if(!uid)throw new Error('Auth ID missing');created=true;
  }
  stage='Teacher profile save';
  const profile={...(!tp?.employee_id&&st.employee_id?{employee_id:st.employee_id}:{}),auth_user_id:uid,teacher_name:st.staff_name||'Teacher',mobile,phone:mobile,email,approval_status:'Approved',is_active:true,requested_classes:classes,updated_at:new Date().toISOString()};
  const result=await call('/rest/v1/teacher_profiles'+(tp?.id?'?id=eq.'+q(tp.id):''),tp?.id?'PATCH':'POST',profile,{Prefer:'return=representation'});
  tp=result?.[0];if(!tp?.id)throw new Error('Teacher profile not saved');
  stage='Central profile save';
  await call('/rest/v1/profiles?on_conflict=id','POST',{id:uid,email,full_name:st.staff_name||'Teacher',role:'teacher',status:'active',...((created||password)?{must_change_password:true}:{})},{Prefer:'resolution=merge-duplicates,return=minimal'});
  stage='Class assignment save (run V67 SQL first)';
  await call('/rest/v1/rpc/ldmea_v67_assign_classes','POST',{p_teacher:tp.id,p_classes:classes,p_class_teacher:String(b.class_teacher||'')});
  // Reset an existing password only after mapping and class saves succeed.
  if(!created&&password){stage='Password update';await call('/auth/v1/admin/users/'+q(uid),'PUT',{password});}
  return res.status(200).json({ok:true,created,teacher_id:tp.teacher_code||'',teacher_name:st.staff_name,login_id:mobile,mobile,classes});
 }catch(e){return res.status(e.status===429?429:500).json({error:(e.name==='TimeoutError'?'Server timeout during '+stage:e.message)+' — Staff data retained. Retry Edit Login on the same Staff record.'});}
};
