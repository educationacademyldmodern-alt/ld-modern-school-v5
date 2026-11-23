const SUPABASE_URL=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
function send(res,status,obj){res.status(status).setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store, max-age=0');res.setHeader('X-Content-Type-Options','nosniff');res.end(JSON.stringify(obj))}
async function asJson(r){const t=await r.text();try{return t?JSON.parse(t):null}catch{return {raw:t}}}
async function rest(path,opts={}){return fetch(SUPABASE_URL+'/rest/v1/'+path,{...opts,headers:{apikey:SERVICE_KEY,Authorization:'Bearer '+SERVICE_KEY,'Content-Type':'application/json',...(opts.headers||{})}})}
async function rows(path){const r=await rest(path),j=await asJson(r);if(!r.ok)throw new Error(j?.message||j?.error||'Database lookup failed');return Array.isArray(j)?j:[]}
async function verifyPrimaryAdmin(req){const auth=String(req.headers.authorization||'');if(!auth.startsWith('Bearer '))throw Object.assign(new Error('Primary Admin login required'),{status:401});const ur=await fetch(SUPABASE_URL+'/auth/v1/user',{headers:{apikey:SERVICE_KEY,Authorization:auth}});if(!ur.ok)throw Object.assign(new Error('Invalid/expired Admin session'),{status:401});const u=await ur.json(),pr=await rows(`profiles?id=eq.${encodeURIComponent(u.id)}&select=role,status&limit=1`),p=pr[0],role=String(p?.role||'').toLowerCase(),st=String(p?.status||'active').toLowerCase();if(!p||!['admin','super_admin'].includes(role)||['disabled','inactive','pending','suspended','rejected'].includes(st))throw Object.assign(new Error('Primary Admin permission required'),{status:403});const lock=await rows('v95_primary_admin?singleton_id=eq.1&select=user_id&limit=1');if(!lock[0]||String(lock[0].user_id)!==String(u.id))throw Object.assign(new Error('Only locked Primary Admin can manage Parent login'),{status:403});return u}
async function getStudent(id){const r=await rows(`students?id=eq.${encodeURIComponent(id)}&select=id,student_name,admission_no,class_name,phone,parent_email,parent_login_status,parent_login_updated_at&limit=1`);if(!r[0])throw new Error('Student not found');return r[0]}
async function findAdmission(adm){const r=await rows(`profiles?linked_admission_no=eq.${encodeURIComponent(adm)}&role=eq.parent&select=id,email,linked_admission_no&limit=1`);return r[0]||null}
async function findEmail(email){const r=await rows(`profiles?email=eq.${encodeURIComponent(email)}&role=eq.parent&select=id,email,linked_admission_no&limit=1`);return r[0]||null}
async function findSiblingParentByMobile(mobile){
 const found=new Map();const variants=[mobile,`+91${mobile}`];
 for(const ph of variants){for(let offset=0;offset<10000;offset+=500){const matches=await rows(`students?phone=eq.${encodeURIComponent(ph)}&parent_email=not.is.null&select=parent_email&limit=500&offset=${offset}`);for(const x of matches){const email=String(x?.parent_email||'').trim().toLowerCase();if(!email)continue;const p=await findEmail(email);if(p)found.set(String(p.id),p);if(found.size>1)throw Object.assign(new Error('इस मोबाइल पर अलग-अलग Parent accounts हैं। विद्यार्थी का सही Parent mapping सत्यापित करें; किसी खाते का अनुमान लगाकर link नहीं किया गया।'),{status:409});}if(matches.length<500)break;if(offset+500>=10000)throw new Error('Parent contact list is too large; verify the explicit student/parent mapping');}}
 return found.values().next().value||null;
}
async function authCreate(email,password,meta){const r=await fetch(SUPABASE_URL+'/auth/v1/admin/users',{method:'POST',headers:{apikey:SERVICE_KEY,Authorization:'Bearer '+SERVICE_KEY,'Content-Type':'application/json'},body:JSON.stringify({email,password,email_confirm:true,user_metadata:meta})}),j=await asJson(r);if(!r.ok)throw Object.assign(new Error(j?.msg||j?.message||j?.error_description||'Parent auth create failed'),{status:r.status});return j?.user||j}
async function authUpdate(id,email,password,meta){const body={email,email_confirm:true,user_metadata:meta};if(password)body.password=password;const r=await fetch(SUPABASE_URL+'/auth/v1/admin/users/'+encodeURIComponent(id),{method:'PUT',headers:{apikey:SERVICE_KEY,Authorization:'Bearer '+SERVICE_KEY,'Content-Type':'application/json'},body:JSON.stringify(body)}),j=await asJson(r);if(!r.ok)throw Object.assign(new Error(j?.msg||j?.message||j?.error_description||'Parent auth update failed'),{status:r.status});return j?.user||j}
async function upsertProfile(id,email,student,keepAdm){const r=await rest('profiles?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({id,email,full_name:`Parent of ${student.student_name||''}`,role:'parent',status:'active',linked_admission_no:keepAdm??student.admission_no??''})}),j=await asJson(r);if(!r.ok)throw new Error(j?.message||'Parent profile link failed')}
async function familyRpc(name,payload){
 const r=await rest('rpc/'+name,{method:'POST',body:JSON.stringify(payload)});
 const data=await asJson(r);if(!r.ok)throw Object.assign(new Error(data?.message||'Family setup SQL required'),{status:409});return data;
}
module.exports=async function handler(req,res){
 if(req.method!=='POST')return send(res,405,{error:'POST only'});
 try{
  await verifyPrimaryAdmin(req);
  const input=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
  const action=input.action;
  if(!['create_or_link','reset_password','create_or_set_password'].includes(action))return send(res,400,{error:'Invalid action'});
  const student=await getStudent(input.student_id);
  const raw=String(input.mobile||student.phone||'').trim(),digits=raw.replace(/[^0-9]/g,'');
  if(!/^[+0-9 ()-]+$/.test(raw)||!/^(91|0)?[0-9]{10}$/.test(digits))throw Error('Valid parent mobile required');
  const mobile=digits.slice(-10),password=String(input.password||'');
  if(password.length<8)throw Error('Parent password must have at least 8 characters');
  const alias=await familyRpc('ldm_family_login_lookup',{p_mobile:mobile});
  const linked=student.parent_email?await findEmail(student.parent_email.trim().toLowerCase()):null;
  if(student.parent_email&&!linked)throw Error('Existing parent link needs admin review before generating a login');
  const anchor=await findAdmission(student.admission_no);
  const sibling=await findSiblingParentByMobile(mobile);
  const generatedEmail='family-'+require('crypto').createHash('sha256').update(String(student.id)).digest('hex').slice(0,32)+'@parent.ldmodern.local';
  const provisioned=await findEmail(generatedEmail);
  const candidates=new Set([alias,linked?.id,anchor?.id,sibling?.id,provisioned?.id].filter(Boolean));
  if(candidates.size>1)throw Error('Different parent accounts are linked. Verify this family in the school records.');
  let id=[...candidates][0],created=false,email;
  let admission=student.admission_no;
  if(id){
   const found=await rows('profiles?id=eq.'+encodeURIComponent(id)+'&role=eq.parent&select=email,status,linked_admission_no');
   if(!found[0]||!['active','approved'].includes(String(found[0].status||'active').toLowerCase()))throw Error('Parent account requires admin review');
   email=found[0].email;admission=found[0].linked_admission_no||admission;
  }else{
   if(action==='reset_password')throw Error('Create or link the parent login first');
   email=generatedEmail;
   const u=await authCreate(email,password,{role:'parent'});
   id=u.id;created=true;
   try{await upsertProfile(id,email,student,'')}catch(e){
    await fetch(SUPABASE_URL+'/auth/v1/admin/users/'+encodeURIComponent(id),{method:'DELETE',headers:{apikey:SERVICE_KEY,Authorization:'Bearer '+SERVICE_KEY}});throw e;
   }
  }
  await familyRpc('ldm_family_bind',{p_parent:id,p_student:String(student.id),p_mobile:mobile});
  const change=!created&&action!=='create_or_link';
  if(change)await authUpdate(id,email,password,{role:'parent',mobile,linked_admission_no:admission});
  return send(res,200,{ok:true,created,password_changed:created||change,status:created?'Generated':change?'Regenerated':'Linked',login_email:email,mobile,linked_admission_no:admission,internal_auth:true});
 }catch(e){return send(res,e.status||400,{error:e.message||'Parent login update failed'})}
};
