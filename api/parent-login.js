module.exports = async function handler(req,res){
  if(req.method!=='POST'){
    return res.status(405).json({error:'Method not allowed'});
  }

  try{
    const identifier=String(req.body?.identifier||'').trim();
    const password=String(req.body?.password||'');

    if(!identifier||!password){
      return res.status(400).json({error:'Mobile/Email and password required'});
    }

    const url=process.env.SUPABASE_URL;
    const key=process.env.SUPABASE_SERVICE_ROLE_KEY;

    if(!url||!key){
      return res.status(500).json({error:'Server configuration missing'});
    }

    let email=identifier.toLowerCase();

    if(!email.includes('@')){
      const mobile=identifier.replace(/\D/g,'').slice(-10);

      if(mobile.length!==10){
        return res.status(400).json({error:'Invalid mobile number'});
      }

      const or=(phone.eq.${mobile},phone.eq.+91${mobile},emergency_phone.eq.${mobile},emergency_phone.eq.+91${mobile});

      const r=await fetch(
        ${url}/rest/v1/students?select=parent_email&or=${encodeURIComponent(or)}&limit=1,
        {
          headers:{
            apikey:key,
            Authorization:Bearer ${key}
          }
        }
      );

      if(!r.ok){
        return res.status(500).json({error:'Parent account lookup failed'});
      }

      const rows=await r.json();
      email=rows?.[0]?.parent_email || p${mobile}@parent.ldmodern.local;
    }

    const r=await fetch(${url}/auth/v1/token?grant_type=password,{
      method:'POST',
      headers:{
        apikey:key,
        'Content-Type':'application/json'
      },
      body:JSON.stringify({email,password})
    });

    const data=await r.json();

    if(!r.ok){
      return res.status(401).json({
        error:data?.msg || data?.message || data?.error_description || 'Invalid login'
      });
    }

    return res.status(200).json({
      access_token:data.access_token,
      refresh_token:data.refresh_token
    });

  }catch(e){
    return res.status(500).json({error:e?.message||'Parent login failed'});
  }
}
