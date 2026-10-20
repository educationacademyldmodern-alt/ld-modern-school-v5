/* Local opt-in phonetic Hindi input. Never sends keystrokes over the network. */
(()=>{'use strict';const W=window,D=document,api=W.LDM_PAPER_FORM_V343;if(!api)return;
let mode='roman',focused=null,lastEdit=null;const composing=new WeakSet();
try{mode=sessionStorage.getItem('ldm380HindiMode')==='direct'?'direct':'roman'}catch(_){}
const vowels={a:['अ',''],aa:['आ','ा'],A:['आ','ा'],i:['इ','ि'],ee:['ई','ी'],ii:['ई','ी'],I:['ई','ी'],u:['उ','ु'],oo:['ऊ','ू'],uu:['ऊ','ू'],U:['ऊ','ू'],e:['ए','े'],ai:['ऐ','ै'],o:['ओ','ो'],au:['औ','ौ'],Ri:['ऋ','ृ']};
const cons={k:'क',kh:'ख',g:'ग',gh:'घ',ng:'ङ',ch:'च',chh:'छ',Ch:'छ',j:'ज',jh:'झ',ny:'ञ',T:'ट',Th:'ठ',D:'ड',Dh:'ढ',N:'ण',t:'त',th:'थ',d:'द',dh:'ध',n:'न',p:'प',ph:'फ',f:'फ',b:'ब',bh:'भ',m:'म',y:'य',r:'र',l:'ल',L:'ळ',v:'व',w:'व',sh:'श',Sh:'ष',s:'स',h:'ह',q:'क़',z:'ज़',x:'क्ष'};
const common={namaste:'नमस्ते',hindi:'हिंदी',bharat:'भारत',vidyalay:'विद्यालय',vidyalaya:'विद्यालय',prashn:'प्रश्न',prashna:'प्रश्न',kya:'क्या',kaun:'कौन',hai:'है',hain:'हैं',main:'मैं',mein:'में',aur:'और',nahin:'नहीं',nahi:'नहीं',ki:'कि',kee:'की',ke:'के',ka:'का',ko:'को',se:'से'};
const keys=[...new Set([...Object.keys(vowels),...Object.keys(cons)])].sort((a,b)=>b.length-a.length);
function transliterate(word){if(!/^[A-Za-z]+$/.test(word))return word;if(common[word.toLowerCase()])return common[word.toLowerCase()];let out='',pending=false;for(let i=0;i<word.length;){let key=keys.find(k=>word.startsWith(k,i));if(!key){out+=word[i++];pending=false;continue}i+=key.length;if(vowels[key]){out+=vowels[key][pending?1:0];pending=false}else{if(pending)out+='्';out+=cons[key];pending=true}}return out}
const selector='#t350Questions textarea[data-field="q"],#t350Questions input[data-option],#t350Questions input[data-field="right"],#t350Questions input[data-field="answer"],#t350Compose,#t350ComposeOptions input,#qText,#qRight,#qAnswer,#composerFields input,textarea[data-prop="questions"],textarea[data-prop="answers"],#modelRows [data-model-field]';
function field(el){return el?.matches?.(selector)&&!el.disabled&&!el.readOnly&&el.isConnected}
function hindi(){return typeof state!=='undefined'&&state.lang==='hi'}
function notify(el){el.dispatchEvent(new Event('input',{bubbles:true}))}
function commit(el,emit=true){if(!hindi()||mode!=='roman'||!field(el)||composing.has(el)||el.selectionStart!==el.selectionEnd)return false;const end=el.selectionStart,match=el.value.slice(0,end).match(/[A-Za-z]+$/);if(!match)return false;const start=end-match[0].length;if(start&&/[\u0900-\u097fA-Za-z0-9_]/.test(el.value[start-1]))return false;const word=transliterate(match[0]);if(word===match[0])return false;el.setRangeText(word,start,end,'end');lastEdit={el,start,word,original:match[0]};if(emit)notify(el);const undo=D.getElementById('h380Undo');if(undo)undo.disabled=false;return true}
function undo(){const x=lastEdit;if(!x||!field(x.el)||x.el.value.slice(x.start,x.start+x.word.length)!==x.word){lastEdit=null;return}x.el.setRangeText(x.original,x.start,x.start+x.word.length,'end');notify(x.el);x.el.focus();lastEdit=null;D.getElementById('h380Undo')?.setAttribute('disabled','')}
function mount(){let host=D.body.classList.contains('t350Simple')?D.getElementById('t350Editor'):D.getElementById('quickShell');if(!host)return;let panel=D.getElementById('h380Typing');if(panel?.parentElement!==host){panel?.remove();panel=D.createElement('section');panel.id='h380Typing';panel.innerHTML='<label for="h380Mode">हिन्दी टाइपिंग / Typing</label><select id="h380Mode"><option value="direct">सीधा Keyboard — हिन्दी / English जैसा लिखें</option><option value="roman">Roman → हिन्दी — शब्द के बाद Space</option></select><button type="button" id="h380Undo" disabled>आखिरी शब्द वापस करें</button><p>Roman मोड: namaste → नमस्ते · bhaarat → भारत · vidyaalay → विद्यालय। Space दबाएँ या अगला field चुनें। यह अक्षर बदलने वाला phonetic mode है। English शब्दों के लिए सीधा Keyboard चुनें। हिन्दी keyboard, paste और गणित/English के लिए सीधा Keyboard चुनें।</p>';host.prepend(panel);panel.querySelector('select').onchange=e=>{mode=e.target.value;try{sessionStorage.setItem('ldm380HindiMode',mode)}catch(_){} };panel.querySelector('button').onclick=undo}
 panel.hidden=!hindi();panel.querySelector('select').value=mode;
}
const style=D.createElement('style');style.textContent='#h380Typing{border:1px solid #b6d1df;background:#edf7fc;padding:12px;border-radius:10px;margin:12px 0;color:#193b50}#h380Typing[hidden]{display:none!important}#h380Typing label{display:block;font-weight:700}#h380Typing select{width:auto;max-width:100%;margin:4px 8px 4px 0}#h380Typing p{font-size:13px;line-height:1.6;margin:7px 0 0}@media print{#h380Typing{display:none!important}}';D.head.append(style);
D.addEventListener('focusin',e=>{if(field(e.target)){focused=e.target;e.target.lang=hindi()?'hi':'en';e.target.setAttribute('autocapitalize','off')}});
D.addEventListener('compositionstart',e=>composing.add(e.target),true);
D.addEventListener('compositionend',e=>{composing.delete(e.target);if(field(e.target))notify(e.target)},true);
D.addEventListener('keydown',e=>{if(e.defaultPrevented||e.isComposing||composing.has(e.target)||e.ctrlKey||e.altKey||e.metaKey)return;if([' ','Enter','Tab',',','.','?','!',';',':','।'].includes(e.key))commit(e.target)},true);
D.addEventListener('input',e=>{const el=e.target;if(e.isComposing||composing.has(el)||e.inputType!=='insertText'||!e.data||!/[\s,.?!;:।]$/.test(e.data)||!field(el)||el.selectionStart!==el.selectionEnd)return;const end=el.selectionStart;if(!end)return;el.setSelectionRange(end-1,end-1);const changed=commit(el,false);const cursor=changed?el.selectionStart+1:end;el.setSelectionRange(cursor,cursor)},true);
D.addEventListener('focusout',e=>{commit(e.target);if(focused===e.target)focused=null},true);
D.addEventListener('change',e=>{if(['t350Lang','lang','qLang'].includes(e.target.id))mount()});
D.addEventListener('ldm-paper-editor-mounted',mount);
for(const name of ['load','importContent']){const base=api[name];if(typeof base==='function')api[name]=function(...args){const result=base.apply(this,args);mount();return result}}
for(const name of ['capture','preview','print']){const base=api[name];if(typeof base==='function')api[name]=function(...args){if(focused)commit(focused);return base.apply(this,args)}}

const originalQuickUI=quickUI;quickUI=function(...args){const result=originalQuickUI.apply(this,args);mount();return result};
W.LDM_HINDI_TYPING_V380={transliterate,mount};mount();
})();
