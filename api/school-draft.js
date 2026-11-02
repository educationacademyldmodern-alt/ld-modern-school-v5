const formats = {
  lesson: 'पाठ योजना बनाओ, एक उद्देश्य, उदाहरण, गतिविधि और छोटी जाँच शामिल करो।',
  paper: 'अभ्यास प्रश्नपत्र और अंत में उत्तर-कुंजी लिखो। हर प्रश्न के अंक और कुल अंक दिखाओ।',
  slides: 'डिजिटल बोर्ड की 5 स्लाइड लिखो। हर स्लाइड में एक विचार, एक उदाहरण और एक सवाल रखो।',
  notice: 'स्कूल कार्यालय का छोटा नोटिस लिखो। व्यक्तिगत विवरण के लिए खाली स्थान रखो।'
};
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).end();
  const {kind,topic,language}=req.body||{};
  if(!Object.hasOwn(formats,kind)||typeof topic!=='string'||!topic.trim()||topic.length>140)return res.status(400).json({error:'विषय 1–140 अक्षर में दें।'});
  const token=req.headers.authorization||'';
  if(!/^Bearer \S+$/.test(token))return res.status(401).end();
  const base=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!base||!key||!process.env.SCHOOL_FREE_GEMINI_KEY||process.env.SCHOOL_AI_UNBILLED!=='true')return res.status(503).json({error:'मुफ़्त AI सक्रिय नहीं है। स्थानीय टेम्पलेट इस्तेमाल करें।'});
  try{
    const headers={apikey:key,Authorization:token};
    const auth=await fetch(new URL('/auth/v1/user',base),{headers,signal:AbortSignal.timeout(8000)});
    if(!auth.ok)return res.status(401).end();
    const user=await auth.json();
    const profiles=new URL('/rest/v1/profiles',base);
    profiles.search=new URLSearchParams({select:'role,status',id:'eq.'+user.id});
    const lookup=await fetch(profiles,{headers,signal:AbortSignal.timeout(8000)});
    if(!lookup.ok)return res.status(403).end();
    const [profile]=await lookup.json();
    if(!profile||!['teacher','admin','super_admin','principal'].includes(profile.role)||String(profile.status||'active').toLowerCase()!=='active')return res.status(403).end();
    const model=process.env.SCHOOL_FREE_GEMINI_MODEL;
    if(!model||!/^gemini-[a-z0-9.-]+$/.test(model))return res.status(503).json({error:'मुफ़्त मॉडल सेट नहीं है।'});
    const upstream=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+model+':generateContent',{
      method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':process.env.SCHOOL_FREE_GEMINI_KEY},
      body:JSON.stringify({contents:[{parts:[{text:formats[kind]+' भाषा '+(language==='en'?'English':'हिन्दी')+'। विषय '+topic}]}],generationConfig:{maxOutputTokens:1600}}),
      signal:AbortSignal.timeout(18000)
    });
    if(!upstream.ok)return res.status(503).json({error:'AI कोटा या सेवा उपलब्ध नहीं है। स्थानीय टेम्पलेट इस्तेमाल करें।'});
    const data=await upstream.json(),draft=data.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('\n');
    if(!draft)return res.status(503).json({error:'ड्राफ्ट उपलब्ध नहीं है।'});
    return res.json({draft});
  }catch{return res.status(503).json({error:'AI सेवा उपलब्ध नहीं है।'});}
}
