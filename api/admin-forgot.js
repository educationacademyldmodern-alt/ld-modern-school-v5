// V64.22 secure Primary Admin recovery endpoint.
// Required Vercel env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_RECOVERY_ID, ADMIN_RECOVERY_EMAIL
const generic = 'यदि Admin ID valid है और cooldown पूरा है, recovery instructions registered Admin contact पर भेजी जाएँगी.';
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST') return res.status(405).json({message:generic});
  const id=String(req.body?.admin_id||'').trim();
  const expected=String(process.env.ADMIN_RECOVERY_ID||'').trim();
  const email=String(process.env.ADMIN_RECOVERY_EMAIL||'').trim().toLowerCase();
  const url=String(process.env.SUPABASE_URL||'').replace(/\/$/,'');
  const key=String(process.env.SUPABASE_SERVICE_ROLE_KEY||'');
  if(!id || !expected || !email || !url || !key || id!==expected) return res.status(200).json({message:generic});
  try{
    const q=encodeURIComponent(id);
    const chk=await fetch(`${url}/rest/v1/admin_recovery_guard?admin_id=eq.${q}&select=last_sent_at&limit=1`,{headers:{apikey:key,Authorization:`Bearer ${key}`}});
    const rows=chk.ok?await chk.json():[];
    const last=rows?.[0]?.last_sent_at?new Date(rows[0].last_sent_at).getTime():0;
    if(last && Date.now()-last<30*60*1000) return res.status(200).json({message:generic});
    // Email recovery only: never invoke phone OTP/SMS from this endpoint.
    const rr=await fetch(`${url}/auth/v1/recover`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({email})});
    if(!rr.ok) throw new Error('recovery send failed');
    await fetch(`${url}/rest/v1/admin_recovery_guard?on_conflict=admin_id`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates'},body:JSON.stringify({admin_id:id,last_sent_at:new Date().toISOString()})});
    return res.status(200).json({message:generic});
  }catch(_e){return res.status(200).json({message:generic});}
}
