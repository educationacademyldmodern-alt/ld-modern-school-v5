// Resolve the current family alias on the server. Password verification belongs to Supabase Auth.
module.exports=async function(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');
 const reject=(code=401)=>res.status(code).end(JSON.stringify({error:code===401?'Invalid login':'Login service unavailable'}));
 if(req.method!=='POST')return reject(405);
 try{
  const {mobile,password}=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
  if(typeof mobile!=='string'||!/^\+?[0-9 ()-]{10,20}$/.test(mobile)||typeof password!=='string'||!password||password.length>4096)return reject();
  const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)return reject(503);
  const headers={apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'};
  async function resolve(){
   const r=await fetch(url+'/rest/v1/rpc/ldm_family_login_lookup',{method:'POST',headers,body:JSON.stringify({p_mobile:mobile})});
   if(!r.ok)throw Error();return r.json();
  }
  const id=await resolve();
  let email='unassigned-family@invalid.invalid';
  if(id){
   const user=await fetch(url+'/auth/v1/admin/users/'+encodeURIComponent(id),{headers});
   if(!user.ok)throw Error();const u=await user.json();email=u.email||u.user?.email;
  }
  const r=await fetch(url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email,password})});
  if(!r.ok)return reject(r.status===429?429:r.status>=500?503:401);
  const t=await r.json();
  if(!id||t.user?.id!==id||!t.access_token||!t.refresh_token||await resolve()!==id)return reject();
  return res.status(200).end(JSON.stringify({access_token:t.access_token,refresh_token:t.refresh_token}));
 }catch{return reject(503)}
};
