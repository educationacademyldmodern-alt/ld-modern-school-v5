function send(res,status,obj){
  res.status(status).setHeader("Content-Type","application/json; charset=utf-8");
  res.end(JSON.stringify(obj));
}

async function asJson(r){
  const t=await r.text();
  try{return t?JSON.parse(t):null}
  catch{return {raw:t}}
}

module.exports = async function handler(req,res){
  if(req.method!=="POST"){
    return send(res,405,{error:"POST only"});
  }

  try{
    const body=typeof req.body==="string"
      ? JSON.parse(req.body||"{}")
      : (req.body||{});

    const identifier=String(body.identifier||"").trim();
    const password=String(body.password||"");

    if(!identifier||!password){
      return send(res,400,{error:"Mobile/Email and password required"});
    }

    const url=process.env.SUPABASE_URL;
    const key=process.env.SUPABASE_SERVICE_ROLE_KEY;

    if(!url||!key){
      return send(res,500,{error:"Server configuration missing"});
    }

    let email=identifier.toLowerCase();

    if(email.indexOf("@")===-1){
      const mobile=identifier.replace(/\D/g,"").slice(-10);

      if(mobile.length!==10){
        return send(res,400,{error:"Invalid mobile number"});
      }

      const or="(phone.eq."+mobile+
        ",phone.eq.+91"+mobile+
        ",emergency_phone.eq."+mobile+
        ",emergency_phone.eq.+91"+mobile+")";

      const lookupUrl=url+
        "/rest/v1/students?select=parent_email&or="+
        encodeURIComponent(or)+"&limit=1";

      const lr=await fetch(lookupUrl,{
        headers:{
          "apikey":key,
          "Authorization":"Bearer "+key
        }
      });

      const rows=await asJson(lr);

      if(!lr.ok){
        return send(res,500,{error:"Parent account lookup failed"});
      }

      email=
        (Array.isArray(rows) && rows[0] && rows[0].parent_email)
        ? String(rows[0].parent_email).toLowerCase()
        : "p"+mobile+"@parent.ldmodern.local";
    }

    const ar=await fetch(
      url+"/auth/v1/token?grant_type=password",
      {
        method:"POST",
        headers:{
          "apikey":key,
          "Content-Type":"application/json"
        },
        body:JSON.stringify({email:email,password:password})
      }
    );

    const auth=await asJson(ar);

    if(!ar.ok){
      return send(res,401,{
        error:
          (auth && (auth.msg||auth.message||auth.error_description)) ||
          "Parent account not activated or password incorrect"
      });
    }

    if(!auth || !auth.access_token || !auth.refresh_token){
      return send(res,401,{
        error:"Parent account अभी Admin द्वारा activate नहीं किया गया है"
      });
    }

    return send(res,200,{
      access_token:auth.access_token,
      refresh_token:auth.refresh_token
    });

  }catch(e){
    return send(res,500,{
      error:(e && e.message) ? e.message : "Parent login failed"
    });
  }
};
