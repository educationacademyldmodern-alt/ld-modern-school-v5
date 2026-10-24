/* V443: local worker decoder, immediate camera permission, recovery, photo, zoom/focus; V440: Admit / Desk QR and exam-day mixed class teacher scanning; click-only shared scanner. Authoritative daily + exam save is one RPC. */
(()=>{'use strict';
const W=window,D=document,$=id=>D.getElementById(id),E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const db=()=>typeof sb!=='undefined'?sb:W.sb,actor=()=>typeof profile!=='undefined'?profile:W.profile,session=()=>String((typeof school!=='undefined'?school:W.school)?.academic_session||'');
const allowed=()=>['teacher','admin','principal','super_admin'].includes(String(actor()?.role||'').trim().toLowerCase()),admin=()=>['admin','principal','super_admin'].includes(String(actor()?.role||'').trim().toLowerCase());
const today=()=>{const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());return ['year','month','day'].map(k=>p.find(x=>x.type===k).value).join('-')};
const context=()=>String(actor()?.id)+'|'+session(),storage=()=>`ldm439_scan_${context()}`;
let dialog=null,owner='',grant=null,pending=null,busy=false,stream=null,timer=null,cameraEpoch=0,held='',emptyFrames=0,last='',lastAt=0,scans=0,examDirty=false,dailyDirty=false,dirtyTimer=null;
function message(text){if($('scan412Status'))$('scan412Status').textContent=text}
function scope(){if(!allowed()||context()!==owner)throw Error('Account/session बदल गया है। Scanner दोबारा खोलें।')}
function lock(on){busy=on;dialog?.querySelectorAll('input,select,button').forEach(n=>n.disabled=on);if($('scan412Retry'))$('scan412Retry').disabled=on||!pending;if($('scan439Discard'))$('scan439Discard').disabled=on||!pending}
function persist(){scope();if(pending)sessionStorage.setItem(storage(),JSON.stringify(pending));else sessionStorage.removeItem(storage());lock(busy)}
function stop(){clearTimeout(permissionWarning);permissionWarning=null;cameraEpoch++;starting=false;clearTimeout(timer);timer=null;decodeWait?.resolve('');decodeWait=null;worker?.terminate();worker=null;decoderPromise=null;if($('scan412Camera'))$('scan412Camera').textContent='Camera शुरू करें';if($('scan443ZoomBox'))$('scan443ZoomBox').hidden=true;if($('scan443Torch'))$('scan443Torch').hidden=true;stream?.getTracks().forEach(t=>t.stop());stream=null;const v=$('scan412Video');if(v)v.srcObject=null;held='';emptyFrames=0}
function close(refresh=true){if(busy)return message('Save की पुष्टि होने दें।');stop();dialog?.remove();dialog=null;if(refresh&&allowed()&&context()===owner){if(dailyDirty&&typeof renderAttendanceSheet==='function'&&$('attendanceSheet'))renderAttendanceSheet();if(examDirty&&$('x320Load')&&W.LDM_EXAM?.canNavigate?.()!==false)$('x320Load').click();}examDirty=false;dailyDirty=false;}
function parse(raw){const value=String(raw||'').trim();if(value.startsWith('LDM-DESK|'))return {kind:'desk',value:W.LDM_ATT_MODEL412.ref(value)};try{const u=new URL(value,location.href);if(u.searchParams.has('student_verify'))return {kind:grant==='gate'?'gate':'student',value:u.searchParams.get('student_verify')};if(/(?:^|\/)document-verify\.html$/i.test(u.pathname)&&u.searchParams.has('token'))return {kind:'admit',value:u.searchParams.get('token')};if(u.searchParams.has('teacher_verify'))return {kind:'teacher',value:u.searchParams.get('teacher_verify')}}catch(_){}if(/^[0-9a-f]{64}$/.test(value))return {kind:'admit',value};if(!value||value.length>2048)throw Error('सही Student ID / Desk QR scan करें।');return {kind:grant==='gate'?'gate':'student',value}}
async function request(job){let slow;const controller=new AbortController();try{slow=setTimeout(()=>message('Server की पुष्टि बाकी है। दोबारा नई entry न बनाएँ…'),4000);let timeout;const deadline=new Promise((_,reject)=>{timeout=setTimeout(()=>{controller.abort();reject(Error('Server confirmation timeout; Retry Same Save करें।'))},30000)});try{let call=job.exit?db().rpc('ldm_scan_gate_qr',job.exit):db().rpc('ldm_v439_scan',job.args);if(typeof call.abortSignal==='function')call=call.abortSignal(controller.signal);const r=await Promise.race([call,deadline]);if(r.error)throw r.error;if(job.exit){if(r.data?.ok===false)throw Error(r.data.message||'Exit rejected');return {ok:true,teacher:true,message:r.data?.message||'Exit / Checkout saved ✓'}}return r.data}finally{clearTimeout(timeout)}}finally{clearTimeout(slow)}}
function scanError(e){const code=String(e?.code||'');if(['42501','P0001','22P02','23514','23505','42703','42P01','42883','PGRST202','PT409'].includes(code)){pending=null;try{persist()}catch(_){}last='';}let text=e.message||String(e);if(/Active approved Teacher Master/.test(text))text='Admin → Teacher Master में इस teacher की approval और Active status जाँचें।';else if(/Admin must set maximum/.test(text))text='Admin → Exam Attendance में आज का paper चुनकर maximum marks / Start setup पहले सेव करें।';else if(/Class\/exam assignment required/.test(text))text='आज का exam timetable नहीं मिला या daily attendance के लिए class assignment नहीं है।';else if(/Desk QR registered/.test(text))text='Admin उसी seating plan का Desk Slip Preview खोलकर QR registration पूरा करें।';else if(code==='PGRST202'||code==='42883')text='QR वाली SQL/01_QR_DAILY_EXAM_V443.sql पहले चलाएँ। '+text;message('Attendance save नहीं हुई: '+text+(pending?' • Retry Same Save करें।':''));}
function notify(r){if(r.teacher)return;const st=r.student;if(r.exam_changed&&$('x320Paper')?.value===r.paper_id)examDirty=true;
 if(r.daily_changed||r.exam_changed){const who=owner;clearTimeout(dirtyTimer);dirtyTimer=setTimeout(()=>{dirtyTimer=null;if(context()===who&&allowed())W.ldmMarkDataDirty?.('attendance',{owner:actor()?.id,session:session()});},650);W.LDM_MARKSHEET?.clear?.();D.dispatchEvent(new CustomEvent('ldm-attendance-saved',{detail:{date:r.date,student:st,paper_id:r.paper_id,daily:r.daily,exam:r.exam}}));}
 // Update an already open class sheet locally; never fetch/re-render a whole exam per scan.
 if(st&&$('attDate')?.value===r.date&&typeof attendanceRows!=='undefined'){
  const row=attendanceRows.find(x=>String(x.id)===String(st.id)||x.admission_no===st.admission_no);
  if(row){row.att_status='Present';row._expected_status='present';dailyDirty=true;}
 }
}
async function send(){if(!pending)return;const job=pending;scope();if(job.owner!==owner)throw Error('Pending scan दूसरे account/session का है।');const r=await request(job);scope();if(!dialog?.isConnected)return;
 if(r?.ok!==true){
  if(r?.code==='CHOOSE_PAPER'){
   pending=null;persist();const s=$('scan412Paper');s.replaceChildren(new Option('सही subject चुनें',''));
   for(const p of r.papers||[])s.add(new Option(`${p.class_name} • ${p.exam_name} • ${p.subject_name} • ${p.start_time||''}`,p.paper_id));
   s.hidden=false;message(r.message+' Subject चुनकर QR फिर scan करें।');stop();return;
  }
  if(r?.code==='CONFIRM_CORRECTION'){
   const reason=prompt(r.message+' (कम से कम 3 अक्षर)');if(!reason||reason.trim().length<3){pending=null;persist();message('सुधार रद्द; कोई entry नहीं बदली।');stop();return;}
   pending={...job,args:{...job.args,p_request:crypto.randomUUID(),p_reason:reason.trim(),p_expected:r.expected}};persist();return send();
  }
  throw Error(r?.message||'Attendance confirmation नहीं मिली।');
 }
 if(!r.teacher&&(r.request_id!==job.args.p_request||r.date!==job.args.p_date||r.session!==job.args.p_session||r.daily!=='Present'||(r.paper_id&&r.exam!=='Present')))throw Error('Save response मेल नहीं खाता; Retry Same Save करें।');
 pending=null;persist();scans++;const st=r.student;message(`${st?st.student_name+' • Class '+st.class_name+'\n':''}${r.message}${r.subject_name?' • '+r.subject_name:''}${r.room?'\nRoom: '+r.room+' • Seat: '+(r.seat||'—'):''}\nConfirmed scans: ${scans}`);notify(r);W.ldmScanFeedback?.(true);$('scan412Raw').value='';return r;
}
async function scan(raw){if(busy||!dialog)return;try{scope()}catch(e){stop();return message(e.message)}if(pending)return message('पहले Retry Same Save करें।');let qr;try{qr=parse(raw)}catch(e){return message(e.message)}if(qr.kind==='teacher'&&!admin())return message('Teacher gate check-in के लिए Admin scanner खोलें।');const stamp=raw+'|'+($('scan412Paper')?.value||'');if(stamp===last&&Date.now()-lastAt<1800)return;last=stamp;lastAt=Date.now();lock(true);
 try{pending={owner,args:{p_kind:qr.kind,p_value:qr.value,p_session:session(),p_date:today(),p_request:crypto.randomUUID(),p_paper:$('scan412Paper').value||null,p_grant:grant&&grant!=='gate'?grant:null,p_reason:'',p_expected:null}};const gateMode=$('scan439GateMode')?.value;if(gateMode&&gateMode!=='ARRIVAL'){if(!admin()||!['student','gate','teacher'].includes(qr.kind))throw Error('Exit / Checkout के लिए Student/Teacher ID QR और Admin login जरूरी है।');pending.exit={p_token:qr.value,p_mode:gateMode,p_sync_key:'gate:'+gateMode+':'+today()+':'+qr.value};}persist();message('Daily + आज का सही exam save हो रहा है…');return await send()}
 catch(e){stop();scanError(e);W.ldmScanFeedback?.(false)}
 finally{lock(false)}
}
const assetRoot=new URL('.',D.currentScript?.src||location.href);
let permissionWarning=null,photoBusy=false,starting=false,worker=null,decodeWait=null,decodeSeq=0,decoderPromise=null,trackQueue=Promise.resolve();
function cameraHelp(error){
 const name=error?.name||'', policy=D.permissionsPolicy||D.featurePolicy;
 let text;
 if(!W.isSecureContext)text='Camera के लिए ERP का HTTPS वाला link Chrome/Safari में खोलें।';
 else if(policy?.allowsFeature&&!policy.allowsFeature('camera'))text='इस preview/frame में Camera बंद है। नीचे ERP सीधे खोलें और वहाँ Camera Allow करें।';
 else if(['NotAllowedError','PermissionDeniedError','SecurityError'].includes(name)||/permission denied/i.test(error?.message||''))text='Camera अनुमति बंद है। Chrome में address bar के पास site controls → Permissions → Camera → Allow करें। Android Settings → Apps → Chrome → Permissions → Camera भी Allow करें। फिर यहाँ Camera शुरू दबाएँ। App/WhatsApp के अंदर खोला हो तो link सीधे Chrome में खोलें।';
 else if(['NotFoundError','DevicesNotFoundError'].includes(name))text='Camera नहीं मिला। दूसरा camera चुनें या QR की फोटो / USB scanner इस्तेमाल करें।';
 else if(['NotReadableError','TrackStartError'].includes(name))text='Camera दूसरी app में व्यस्त है। Camera/WhatsApp बंद करके यहाँ फिर शुरू करें।';
 else text=error?.message||'Camera फिर शुरू करें या QR की फोटो चुनें।';
 const help=$('scan443Help');if(help){help.hidden=false;$('scan443HelpText').textContent=text;}
 message(text);
}
function decoder(){if(decoderPromise)return decoderPromise;
 decoderPromise=(async()=>{
  let native=null;
  try{if(W.BarcodeDetector&&(!W.BarcodeDetector.getSupportedFormats||(await Promise.race([W.BarcodeDetector.getSupportedFormats(),new Promise(resolve=>setTimeout(()=>resolve([]),1200))])).includes('qr_code')))native=new W.BarcodeDetector({formats:['qr_code']});}catch(_){}
  const canvas=D.createElement('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});let frame=0,nativeMisses=0,jq=null;
  async function software(source){
   const width=source.videoWidth||source.naturalWidth||source.width,height=source.videoHeight||source.naturalHeight||source.height;
   if(!width||!height)return '';
   const crop=(++frame%2===0),side=Math.floor(Math.min(width,height)*.7),sw=crop?side:width,sh=crop?side:height,ratio=Math.min(1,1280/Math.max(sw,sh));
   canvas.width=Math.max(1,Math.round(sw*ratio));canvas.height=Math.max(1,Math.round(sh*ratio));
   ctx.drawImage(source,crop?(width-side)/2:0,crop?(height-side)/2:0,sw,sh,0,0,canvas.width,canvas.height);
   const im=ctx.getImageData(0,0,canvas.width,canvas.height);
   if(W.Worker){
    if(!worker){worker=new Worker(new URL('qr-decode-worker-v443.js',assetRoot));worker.onerror=()=>{decodeWait?.reject(Error('QR decoder load नहीं हुआ; upload में worker और vendor folder भी रखें।'));decodeWait=null;worker?.terminate();worker=null;};worker.onmessage=({data:m})=>{if(decodeWait?.id===m.id){const wait=decodeWait;decodeWait=null;m.error?wait.reject(Error(m.error)):wait.resolve(m.raw);}};}
    return new Promise((resolve,reject)=>{const id=++decodeSeq;const timeout=setTimeout(()=>{if(decodeWait?.id===id){decodeWait=null;worker?.terminate();worker=null;reject(Error('QR decoder timeout; camera दोबारा शुरू करें।'));}},8000);decodeWait={id,resolve:r=>{clearTimeout(timeout);resolve(r)},reject:e=>{clearTimeout(timeout);reject(e)}};worker.postMessage({id,width:im.width,height:im.height,buffer:im.data.buffer},[im.data.buffer]);});
   }
   if(!jq){jq=W.jsQR;if(!jq)jq=await new Promise((resolve,reject)=>{const s=D.createElement('script'),t=setTimeout(()=>{s.remove();reject(Error('QR decoder load timeout'));},8000);s.src=new URL('vendor/jsQR-1.4.0.js',assetRoot);s.onload=()=>{clearTimeout(t);s.remove();W.jsQR?resolve(W.jsQR):reject(Error('QR decoder missing'))};s.onerror=()=>{clearTimeout(t);s.remove();reject(Error('vendor/jsQR-1.4.0.js upload करें।'))};D.head.append(s)});}
   return jq(im.data,im.width,im.height,{inversionAttempts:'attemptBoth'})?.data||'';
  }
  return async (source,forceSoftware=false)=>{if(native&&!forceSoftware){try{const raw=(await native.detect(source))[0]?.rawValue||'';if(raw){nativeMisses=0;return raw}if(++nativeMisses%4!==0)return '';}catch(_){native=null;}}return software(source)};
 })().catch(e=>{decoderPromise=null;throw e});return decoderPromise;
}
function cameraControls(track,epoch){
 const caps=track.getCapabilities?.()||{},settings=track.getSettings?.()||{};
 const apply=c=>{trackQueue=trackQueue.catch(()=>{}).then(async()=>{if(epoch===cameraEpoch&&stream)try{await track.applyConstraints({advanced:[c]})}catch(_){message('यह camera setting उपलब्ध नहीं है; scan जारी है।')}});return trackQueue;};
 if(caps.focusMode?.includes('continuous'))apply({focusMode:'continuous'});
 const z=$('scan443Zoom'),box=$('scan443ZoomBox');if(z&&caps.zoom&&caps.zoom.max>caps.zoom.min){box.hidden=false;z.min=caps.zoom.min;z.max=caps.zoom.max;z.step=caps.zoom.step||.1;z.value=settings.zoom||caps.zoom.min;z.onchange=()=>apply({zoom:Number(z.value)});}
 const light=$('scan443Torch');if(light&&caps.torch){light.hidden=false;let on=false;light.onclick=async()=>{on=!on;await apply({torch:on});light.textContent=on?'Light बंद':'Light चालू'};}
 // Device labels are read only after permission; never poll devices.
 navigator.mediaDevices.enumerateDevices?.().then(list=>{if(epoch!==cameraEpoch)return;const s=$('scan443Device');if(!s)return;s.replaceChildren(new Option('पीछे का camera / Auto',''));for(const d of list.filter(x=>x.kind==='videoinput'))s.add(new Option(d.label||'Camera '+s.options.length,d.deviceId));s.value=settings.deviceId||'';s.hidden=s.options.length<3;}).catch(()=>{});
}
async function camera(deviceId=''){
 if(photoBusy)return message('QR photo पढ़ रहे हैं; बंद करें से रद्द कर सकते हैं।');
 if(stream||starting){stop();message('Camera बंद है। शुरू करने के लिए Camera शुरू दबाएँ।');return;}
 if(busy||pending)return message('पहले pending save पूरा करें।');
 if(!W.isSecureContext||!navigator.mediaDevices?.getUserMedia)return cameraHelp(Error('इस browser में Camera उपलब्ध नहीं है। ERP का HTTPS link Chrome/Safari में खोलें।'));
 const policy=D.permissionsPolicy||D.featurePolicy;if(policy?.allowsFeature&&!policy.allowsFeature('camera'))return cameraHelp(Error('Frame camera policy'));
 const epoch=++cameraEpoch;starting=true;$('scan412Camera').textContent='Camera रद्द करें';message('Camera की अनुमति आए तो Allow दबाएँ…');
 let warning=permissionWarning=setTimeout(()=>{if(epoch===cameraEpoch){$('scan443Help').hidden=false;$('scan443HelpText').textContent='Permission popup में Allow करें। Popup न मिले तो site controls में Camera permission देखें। Camera रद्द करें से वापस जा सकते हैं।';}},10000);
 try{
  // Request immediately from the click. Never await a decoder/CDN before permission.
  let next;try{next=await navigator.mediaDevices.getUserMedia({video:{...(typeof deviceId==='string'&&deviceId?{deviceId:{exact:deviceId}}:{facingMode:{ideal:'environment'}}),width:{ideal:1920},height:{ideal:1080},frameRate:{ideal:15,max:24}},audio:false});}
  catch(e){if(epoch!==cameraEpoch)return;if(!['OverconstrainedError','ConstraintNotSatisfiedError','NotFoundError'].includes(e.name))throw e;next=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});}
  if(epoch!==cameraEpoch||D.hidden||!dialog?.isConnected){next.getTracks().forEach(t=>t.stop());return;}
  stream=next;starting=false;clearTimeout(warning);$('scan412Camera').textContent='Camera बंद करें';$('scan443Help').hidden=true;
  const video=$('scan412Video');video.srcObject=stream;await video.play();if(epoch!==cameraEpoch)return;
  cameraControls(stream.getVideoTracks()[0],epoch);const decode=await decoder();if(epoch!==cameraEpoch)return;message('QR को बीच में रखें। दूर हो तो Zoom बढ़ाएँ; QR साफ और पूरा दिखे।');
  async function tick(){if(epoch!==cameraEpoch||!stream||!dialog?.isConnected||D.hidden)return;const start=performance.now();try{if(!busy&&!pending&&video.readyState>=2){const raw=await decode(video);if(epoch!==cameraEpoch)return;if(!raw){if(++emptyFrames>=3)held=''}else{emptyFrames=0;if(raw!==held){held=raw;await scan(raw)}}}}catch(e){if(epoch===cameraEpoch){stop();cameraHelp(e);}return;}if(epoch===cameraEpoch&&stream)timer=setTimeout(tick,Math.max(160,300-(performance.now()-start)));}tick();
 }catch(e){if(epoch===cameraEpoch){stop();cameraHelp(e)}}finally{clearTimeout(warning);if(epoch===cameraEpoch)starting=false;}
}
async function photo(file){if(!file||busy||pending||photoBusy)return;if(file.size>15*1024*1024)return message('15 MB से छोटी QR photo चुनें।');stop();photoBusy=true;const epoch=cameraEpoch,url=URL.createObjectURL(file);try{message('QR photo पढ़ रहे हैं…');const img=new Image();img.src=url;await img.decode();if(epoch!==cameraEpoch||!dialog?.isConnected)return;const decode=await decoder();if(epoch!==cameraEpoch||!dialog?.isConnected)return;let raw=await decode(img,true);if(epoch!==cameraEpoch||!dialog?.isConnected)return;if(!raw)raw=await decode(img,true);if(epoch!==cameraEpoch||!dialog?.isConnected)return;if(raw)await scan(raw);else message('QR साफ नहीं मिला। नज़दीक की साफ photo लें।');}catch(e){if(epoch===cameraEpoch)cameraHelp(e)}finally{photoBusy=false;worker?.terminate();worker=null;decoderPromise=null;URL.revokeObjectURL(url);if($('scan443Photo'))$('scan443Photo').value='';}}

async function open(mode='daily',requestGrant=null){if(!allowed())return W.toast?.('Teacher/Admin login जरूरी है।');if(W.LDM_EXAM?.canNavigate?.()===false)return W.toast?.('Exam के unsaved बदलाव पहले Save करें।');if(dialog?.isConnected)return;W.v130StopScanner?.(true);W.v143StopTeacherQr?.();owner=context();grant=mode==='gate'?'gate':requestGrant;pending=null;try{const saved=JSON.parse(sessionStorage.getItem(storage())||'null');if(saved?.owner===owner&&saved.args?.p_request)pending=saved}catch(_){}scans=0;last='';
 dialog=D.createElement('dialog');dialog.id='scan412';dialog.innerHTML=`<style>#scan412{box-sizing:border-box;width:min(680px,calc(100vw - 24px));max-width:calc(100vw - 24px);font:16px/1.4 system-ui;max-height:94dvh;overflow:auto;border:0;border-radius:16px;padding:18px;color:#173f53}#scan412 *{box-sizing:border-box;max-width:100%}#scan412 h2{font-size:22px;margin:4px 0 12px}#scan412::backdrop{background:#112941aa}#scan412 .tools{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}#scan412 button,#scan412 select,#scan412 input{font:inherit;padding:11px;min-height:44px;border:1px solid #a8c6cf;border-radius:9px}#scan412 [hidden]{display:none!important}#scan443Help{background:#fff7df;padding:12px;border-radius:9px;font:15px/1.5 system-ui}#scan443Direct{color:#075d86;text-decoration:underline}#scan443Zoom{max-width:220px}#scan412 video{object-fit:contain;width:100%;max-height:260px;background:#102b40}#scan412Status{padding:12px;background:#eef7f9;white-space:pre-wrap}#scan412Raw{width:100%}</style><h2>QR • Admit / Desk • Daily + Exam</h2><p>Admit Card, Desk Slip या Student ID QR से आज की Daily और सही exam की attendance साथ सेव होगी।</p><div class="tools"><button id="scan412Close">बंद करें</button><button id="scan412Camera">Camera शुरू करें</button><button id="scan443PhotoButton">QR फोटो चुनें</button><input id="scan443Photo" type="file" accept="image/*" hidden><button id="scan443HelpButton">Camera मदद</button><button id="scan412Retry">Retry Same Save</button><button id="scan439Discard">Pending scan हटाएँ</button></div>${mode==='gate'?'<label>Gate action<select id="scan439GateMode"><option value="ARRIVAL">Entry • Daily + Exam</option><option value="STUDENT_EXIT">Student Exit</option><option value="TEACHER_CHECKOUT">Teacher Check-Out</option></select></label>':''}<select id="scan412Paper" aria-label="Exam subject" hidden><option value="">Auto: आज का सही paper</option></select><section id="scan443Help" hidden><p id="scan443HelpText">Chrome: address bar के पास site controls → Permissions → Camera → Allow करें। Android में Chrome app की Camera permission भी Allow करें। फिर Camera शुरू दबाएँ। App के भीतर link हो तो सीधे Chrome में खोलें।</p><a id="scan443Direct" target="_blank" rel="noopener">ERP सीधे browser में खोलें ↗</a></section><select id="scan443Device" aria-label="Camera चुनें" hidden><option value="">पीछे का camera / Auto</option></select><video id="scan412Video" playsinline autoplay muted></video><div class="tools"><label id="scan443ZoomBox" hidden>Zoom <input id="scan443Zoom" type="range" aria-label="Camera zoom"></label><button id="scan443Torch" hidden>Light चालू</button></div><label>QR text / USB Scanner<input id="scan412Raw" autocomplete="off" placeholder="Admit Card / Desk Slip / Student ID QR"></label><button id="scan412Go">Scan / Present</button><p id="scan412Status" role="status">Camera शुरू करें या QR scan करें।</p>`;D.body.append(dialog);dialog.showModal();$('scan412Close').onclick=()=>close(true);dialog.oncancel=e=>{e.preventDefault();close(true)};$('scan412Camera').onclick=()=>camera();$('scan443Direct').href=location.href;$('scan443HelpButton').onclick=()=>{$('scan443Help').hidden=!$('scan443Help').hidden};$('scan443PhotoButton').onclick=()=>{if(!busy&&!pending)$('scan443Photo').click()};$('scan443Photo').onchange=e=>photo(e.target.files[0]);$('scan443Device').onchange=e=>{const id=e.target.value;stop();camera(id)};$('scan412Go').onclick=()=>scan($('scan412Raw').value);$('scan412Raw').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();scan(e.target.value)}};$('scan412Paper').onchange=()=>{last='';held=''};if($('scan439GateMode'))$('scan439GateMode').onchange=()=>{last='';held=''};
 $('scan412Retry').onclick=async()=>{if(busy)return;lock(true);try{await send()}catch(e){stop();scanError(e)}finally{lock(false)}};
 $('scan439Discard').onclick=()=>{if(!busy&&pending&&confirm('Server पर save हो चुका हो सकता है। Pending request हटाकर फिर scan करने पर मौजूदा attendance जाँची जाएगी। हटाएँ?')){pending=null;persist();last='';message('Pending request हटाई। Attendance नहीं मिटाई गई।')}};
 lock(false);if(pending)message('पिछले scan की पुष्टि बाकी है। Retry Same Save करें।');
}
let queued=false;function mount(){const host=$('erpContent');if(!host||!allowed()||$('scan412Entry'))return;const b=D.createElement('button');b.id='scan412Entry';b.type='button';b.textContent='📷 QR • Admit / Desk • Daily + Exam';b.style.cssText='padding:10px 14px;min-height:44px;margin:8px;border:1px solid #8bb8c8;border-radius:9px;background:#087f82;color:white;font:600 14px system-ui';b.onclick=()=>open($('x320Center')?'exam':'daily');host.prepend(b)}
function init(){const host=$('erpContent');if(host)new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mount();if(dialog&&(!allowed()||context()!==owner)){stop();if(!busy)close()}})}).observe(host,{childList:true});mount()}
const base=W.render;if(typeof base==='function'){W.render=async function(route,...args){if(busy)return W.toast?.('Scan save की पुष्टि होने दें।');if(dialog)close(false);if(route==='v130_qr_scanner')return open('gate');if(route==='v143_teacher_qr_attendance')return open('daily');try{return await base.call(this,route,...args)}finally{mount()}};try{render=W.render}catch(_){}}
// Every existing daily/exam QR entry uses this shared implementation.
W.v130SchoolScanner=()=>open('gate');W.v143TeacherQrAttendance=()=>open('daily');
// Exit / checkout remains an explicit separate operation; it never marks an exam Present.

W.LDM_ATTENDANCE412={open,stop,scan};W.addEventListener('pagehide',stop);D.addEventListener('visibilitychange',()=>{if(D.hidden)stop()});
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
