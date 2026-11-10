/* V476: bounded RPC reads, native bell filters, change notifications; no polling. */
(()=>{'use strict';
 const W=window,D=document;
 const owner=()=>{const p=typeof profile!=='undefined'?profile:W.profile;return p?.id||''};
 const client=()=>typeof sb!=='undefined'?sb:W.sb;
 const normal=v=>String(v??'').trim().toLowerCase();
 async function bindBells(select,papers,blocked){
  if(!select?.isConnected||D.getElementById('x476Bell'))return;
  const label=D.createElement('label');label.textContent='टाइमटेबल की घंटी ';
  const bell=D.createElement('select');bell.id='x476Bell';bell.add(new Option('सभी आवंटित विषय',''));label.append(bell);select.before(label);
  const who=owner();
  try{
   let timer;const result=await Promise.race([client().rpc('ldm_teacher_bells460',{}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('घंटी सूची नहीं खुली')),12000)})]).finally(()=>clearTimeout(timer));
   if(result.error)throw result.error;if(owner()!==who||!select.isConnected)return;
   const bells=result.data||[];bells.forEach((b,i)=>bell.add(new Option(['घंटी '+b.period_no,b.class_name,b.section,b.subject].filter(Boolean).join(' • '),i)));
   let previous='';bell.onchange=()=>{
    if(blocked()){bell.value=previous;return W.toast?.('पहले अंक या उपस्थिति सेव करें।')}
    previous=bell.value;const b=bells[Number(bell.value)];
    const classKey=v=>normal(W.ldmClassCanonical?.(v)||v);
    const options=papers.filter(p=>bell.value===''||(classKey(p.class_name)===classKey(b.class_name)&&normal(p.subject_name)===normal(b.subject)&&(!p.section||!b.section||normal(p.section)===normal(b.section))));
    select.replaceChildren(new Option('पेपर चुनें',''));
    for(const p of options)select.add(new Option([p.exam_name,p.class_name,p.section,p.subject_name,p.exam_date].filter(Boolean).join(' • '),p.paper_id));
    select.value=options.length===1?String(options[0].paper_id):'';
    select.dispatchEvent(new Event('change',{bubbles:true}));
   };
  }catch(e){if(label.isConnected){bell.disabled=true;label.title=e.message;bell.options[0].textContent='घंटी सूची अनुपलब्ध; विषय सूची से चुनें'}}
 }
 function invalidate(){W.LDM_MARKSHEET?.clear?.();W.LDM_NETWORK_ECONOMY433?.invalidate?.();W.dispatchEvent(new CustomEvent('ldm:master-search-invalidated'))}
 const changed=W.ldmMarkDataDirty;
 W.ldmMarkDataDirty=function(...args){invalidate();W.dispatchEvent(new CustomEvent('ldm:central-record-saved',{detail:{kind:args[0],owner:owner()}}));return changed?.apply(this,args)};
 const baseRender=W.render;
 if(typeof baseRender==='function')W.render=function(...args){if(W.LDM_TEACHER_ENTRY476?.canNavigate()===false)return W.toast?.('पहले स्थानीय अंक ड्राफ्ट सेव करें या ड्राफ्ट छोड़ें।');return baseRender.apply(this,args)};
 try{render=W.render}catch(_){}
 let channel=null,channelOwner='',timer=null,epoch=0;
 function stop(){epoch++;clearTimeout(timer);if(channel){client()?.removeChannel?.(channel);channel=null}channelOwner=''}
 function start(){
  const p=typeof profile!=='undefined'?profile:W.profile,db=client();
  if(!owner()||!['admin','super_admin','principal','teacher'].includes(normal(p?.role))||typeof db?.channel!=='function'){stop();return}
  if(channel&&channelOwner===owner())return;stop();channelOwner=owner();const who=owner(),ticket=epoch;
  channel=db.channel('ldm-central-476-'+who).on('postgres_changes',{event:'UPDATE',schema:'public',table:'ldm_changes476'},()=>{
   if(owner()!==who||ticket!==epoch)return;invalidate();clearTimeout(timer);
   timer=setTimeout(()=>{if(owner()!==who||ticket!==epoch||D.visibilityState==='hidden')return;
    if(W.LDM_EXAM?.canNavigate()&&D.getElementById('x320Center'))W.LDM_EXAM.refresh?.();
    else if(D.getElementById('x320Center')){const status=D.getElementById('x320Status');if(status)status.textContent='केंद्रीय रिकॉर्ड बदला है। आपका ड्राफ्ट सुरक्षित है; सेव करते समय मिलान होगा।'}
    W.dispatchEvent(new CustomEvent('ldm:central-record-changed'));
   },400);
  }).subscribe();
 }
 const open=W.openERP;if(typeof open==='function')W.openERP=async function(...args){const result=await open.apply(this,args);start();return result};
 const logout=W.logout;if(typeof logout==='function')W.logout=async function(...args){stop();try{return await logout.apply(this,args)}catch(e){start();throw e}};
 W.addEventListener('beforeunload',e=>{if(W.LDM_TEACHER_ENTRY476?.canNavigate()===false){e.preventDefault();e.returnValue=''}});
 W.addEventListener('pagehide',stop);
 D.addEventListener('visibilitychange',()=>{if(D.visibilityState==='visible'){start();if(W.LDM_EXAM?.canNavigate())W.LDM_EXAM.refresh?.()}});
 W.addEventListener('ldm:central-record-saved',start);
 W.addEventListener('storage',e=>{if(e.key?.includes('auth-token')){invalidate();if(!owner())stop()}});
 W.LDM_EXAM476={bindBells,invalidate,start,stop};start();
})();
