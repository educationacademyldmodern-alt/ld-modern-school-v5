(()=>{'use strict';
const p=new URLSearchParams(location.search),slug=(p.get('site')||'').trim().toLowerCase();
const cfg=window.LDM_FACTORY_PUBLIC_CONFIG||{},url=String(cfg.supabaseUrl||'').replace(/\/$/,''),key=String(cfg.anonKey||'');
const root=document.getElementById('erpApp');
if(!/^[a-z0-9][a-z0-9-]{1,62}$/.test(slug)||!/^https:\/\//.test(url)||key.length<20||!window.supabase){root.innerHTML='<div class="empty" style="margin:20px">Customer ERP configuration invalid or unavailable.</div>';return}
const sb=supabase.createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
sb.rpc('factory_public_site',{p_slug:slug}).then(({data,error})=>{if(error||!data){root.innerHTML='<div class="empty" style="margin:20px">Customer site not found.</div>';return}let v=String(data.runtime_version||'v1').replace(/[^a-zA-Z0-9_-]/g,'');window.LDM_RUNTIME_BOOT={site:data,url,key,slug};let s=document.createElement('script');s.src=`factory-runtime-${v}.js`;s.onerror=()=>{root.innerHTML='<div class="empty" style="margin:20px">Runtime version unavailable. Owner can rollback/change runtime from Studio.</div>'};document.body.appendChild(s)}).catch(()=>{root.innerHTML='<div class="empty" style="margin:20px">Network error loading customer ERP.</div>'})})();
