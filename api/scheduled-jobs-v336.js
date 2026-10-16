// Daily school jobs. Secrets are server environment variables only.
import { timingSafeEqual } from 'node:crypto';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const secret=process.env.CRON_SECRET,got=req.headers.authorization||'';
 if(!secret){return res.status(503).json({ok:false,error:'CRON_SECRET is not configured'});}
 const expected=Buffer.from('Bearer '+secret),actual=Buffer.from(got);
 if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return res.status(401).json({ok:false,error:'Unauthorized'});
 if(!['GET','POST'].includes(req.method))return res.status(405).json({ok:false,error:'Method not allowed'});
 const base=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!base||!key)return res.status(503).json({ok:false,error:'Server database configuration missing'});
 const control=new AbortController(),timer=setTimeout(()=>control.abort(),25000);
 try{const response=await fetch(new URL('/rest/v1/rpc/ldm_v336_daily_jobs',base),{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:'{}',signal:control.signal});if(!response.ok)return res.status(502).json({ok:false,error:'Database job failed; inspect database logs'});return res.status(200).json({ok:true,result:await response.json()});}
 catch(_){return res.status(502).json({ok:false,error:'Job did not finish; inspect job history before retry'});}finally{clearTimeout(timer)}
}
