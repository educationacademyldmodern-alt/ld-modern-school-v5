// Secure Vercel Serverless API for Parent login create/update.
// IMPORTANT: SUPABASE_SERVICE_ROLE_KEY must be stored only in Vercel Environment Variables.

const SUPABASE_URL = process.env.SUPABASE_URL || "https://xleagfmdueyalkdnicyr.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function send(res, status, obj){
  res.status(status).setHeader("Content-Type","application/json; charset=utf-8");
  res.end(JSON.stringify(obj));
}
async function asJson(r){
  let t=await r.text();
  try{return t?JSON.parse(t):null}catch{return {raw:t}}
}
async function rest(path, opts={}){
  return fetch(SUPABASE_URL + "/rest/v1/" + path,{
    ...opts,
    headers:{
      "apikey":SERVICE_KEY,
      "Authorization":"Bearer "+SERVICE_KEY,
      "Content-Type":"application/json",
      ...(opts.headers||{})
    }
  });
}
async function verifyAdmin(req){
  const auth=String(req.headers.authorization||"");
  if(!auth.startsWith("Bearer ")) throw new Error("Admin login required");
  const ur=await fetch(SUPABASE_URL+"/auth/v1/user",{
    headers:{"apikey":SERVICE_KEY,"Authorization":auth}
  });
  if(!ur.ok) throw new Error("Invalid/expired Admin session");
  const u=await ur.json();
  const pr=await rest(`profiles?id=eq.${encodeURIComponent(u.id)}&select=role,status`);
  const rows=await asJson(pr);
  const p=Array.isArray(rows)?rows[0]:null;
  if(!p || !["super_admin","admin","principal"].includes(p.role) || String(p.status||"active").toLowerCase()==="disabled"){
    throw new Error("Admin permission required");
  }
  return u;
}
async function getStudent(id){
  const r=await rest(`students?id=eq.${encodeURIComponent(id)}&select=id,student_name,admission_no,class_name,phone,parent_email`);
  const rows=await asJson(r);
  if(!r.ok) throw new Error(rows?.message||"Student lookup failed");
  if(!Array.isArray(rows)||!rows[0]) throw new Error("Student not found");
  return rows[0];
}
async function findProfileByAdmission(adm){
  if(!adm)return null;
  const r=await rest(`profiles?linked_admission_no=eq.${encodeURIComponent(adm)}&role=eq.parent&select=id,email,linked_admission_no&limit=1`);
  const rows=await asJson(r);
  return Array.isArray(rows)?rows[0]||null:null;
}
async function findProfileByEmail(email){
  if(!email)return null;
  const r=await rest(`profiles?email=eq.${encodeURIComponent(email)}&role=eq.parent&select=id,email,linked_admission_no&limit=1`);
  const rows=await asJson(r);
  return Array.isArray(rows)?rows[0]||null:null;
}
async function authCreate(email,password,meta){
  const r=await fetch(SUPABASE_URL+"/auth/v1/admin/users",{
    method:"POST",
    headers:{"apikey":SERVICE_KEY,"Authorization":"Bearer "+SERVICE_KEY,"Content-Type":"application/json"},
    body:JSON.stringify({email,password,email_confirm:true,user_metadata:meta})
  });
  const j=await asJson(r);
  if(!r.ok) throw new Error(j?.msg||j?.message||j?.error_description||"Parent auth create failed");
  return j;
}
async function authUpdate(id,email,password,meta){
  const r=await fetch(SUPABASE_URL+"/auth/v1/admin/users/"+encodeURIComponent(id),{
    method:"PUT",
    headers:{"apikey":SERVICE_KEY,"Authorization":"Bearer "+SERVICE_KEY,"Content-Type":"application/json"},
    body:JSON.stringify({email,password,email_confirm:true,user_metadata:meta})
  });
  const j=await asJson(r);
  if(!r.ok) throw new Error(j?.msg||j?.message||j?.error_description||"Parent auth update failed");
  return j;
}
async function upsertProfile(userId,email,student){
  const r=await rest("profiles?on_conflict=id",{
    method:"POST",
    headers:{"Prefer":"resolution=merge-duplicates,return=representation"},
    body:JSON.stringify({
      id:userId,email,
      full_name:`Parent of ${student.student_name||""}`,
      role:"parent",status:"active",
      linked_admission_no:student.admission_no||""
    })
  });
  const j=await asJson(r);
  if(!r.ok) throw new Error(j?.message||"Parent profile link failed");
}
async function updateStudent(studentId,mobile,email){
  const r=await rest(`students?id=eq.${encodeURIComponent(studentId)}`,{
    method:"PATCH",
    headers:{"Prefer":"return=representation"},
    body:JSON.stringify({phone:mobile,parent_email:email})
  });
  const j=await asJson(r);
  if(!r.ok) throw new Error(j?.message||"Student link update failed");
}

module.exports = async function handler(req,res){
  if(req.method!=="POST") return send(res,405,{error:"POST only"});
  if(!SERVICE_KEY) return send(res,500,{error:"SUPABASE_SERVICE_ROLE_KEY is not configured in Vercel"});
  try{
    await verifyAdmin(req);
    const body=typeof req.body==="string"?JSON.parse(req.body||"{}"):(req.body||{});
    if(body.action!=="create_or_update") return send(res,400,{error:"Invalid action"});
    const student=await getStudent(body.student_id);
    const mobile=String(body.mobile||"").replace(/\D/g,"").slice(-10);
    const emailInput=String(body.email||"").trim().toLowerCase();
    const password=String(body.password||"");
    if(mobile.length!==10) throw new Error("Valid 10 digit Parent Mobile required");
    if(password.length<6) throw new Error("Password must be at least 6 characters");

    // Same mobile gets the same internal login email, so siblings can share one Parent account.
    const loginEmail=emailInput || `p${mobile}@parent.ldmodern.local`;
    let prof=await findProfileByAdmission(student.admission_no);
    if(!prof) prof=await findProfileByEmail(loginEmail);

    const meta={full_name:`Parent of ${student.student_name||""}`,role:"parent",mobile,linked_admission_no:student.admission_no||""};
    let authUser,created=false;
    if(prof?.id){
      authUser=await authUpdate(prof.id,loginEmail,password,meta);
    }else{
      try{
        authUser=await authCreate(loginEmail,password,meta);created=true;
      }catch(e){
        // If an auth user already exists but the profile lookup missed it, fail safely.
        throw new Error(e.message+" • यदि account पहले से है तो Parent profile/link check करें.");
      }
    }
    const uid=authUser?.id||authUser?.user?.id||prof?.id;
    if(!uid) throw new Error("Parent user id not returned");
    await upsertProfile(uid,loginEmail,student);
    await updateStudent(student.id,mobile,loginEmail);

    return send(res,200,{ok:true,created,login_email:loginEmail,mobile});
  }catch(e){
    return send(res,400,{error:e.message||String(e)});
  }
};
