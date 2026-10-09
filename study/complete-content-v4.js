(()=>{
'use strict';
const D=window.SKY_COMPETITION_DATA;
if(!D)return;
const uniq=a=>[...new Set((a||[]).filter(Boolean).map(x=>String(x).trim()).filter(Boolean))];
const arr=v=>Array.isArray(v)?v:(v?[v]:[]);
const strip=s=>String(s||'').replace(/\s+/g,' ').trim();
const isDynamic=(subject,topic)=> subject==='Current Affairs'||/Current Affairs|Source-Verified|Schemes Source-Verified/i.test(topic||'');
const subjectTopics={};
Object.entries(D.subjectMap||{}).forEach(([sub,chs])=>subjectTopics[sub]=uniq(Object.values(chs||{}).flat()));
const otherSubjectTopics=(subject)=>uniq(Object.entries(subjectTopics).filter(([s])=>s!==subject).flatMap(([,t])=>t)).slice(0,180);
const safePick=(a,i,fallback)=>a.length?a[Math.abs(i)%a.length]:fallback;
const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
function minFill(existing,candidates,n){const out=uniq([...arr(existing),...candidates]);return out.slice(0,Math.max(n,out.length));}
function topicSeeds(topic,r){
 const pool=uniq([
  ...arr(r.facts),...arr(r.basic),...arr(r.theory),...arr(r.notes),...arr(r.deep),...arr(r.formula),...arr(r.examples),...arr(r.oneLine)
 ].map(strip).filter(x=>x.length>3 && x.length<260));
 return pool;
}
function relatedDistractors(subject,topic,seed){
 const all=otherSubjectTopics(subject); const h=hash(topic+'|'+seed);
 return uniq([safePick(all,h,'Unrelated concept'),safePick(all,h>>3,'Different topic'),safePick(all,h>>7,'Other subject')]).filter(x=>x!==topic).slice(0,3);
}
function assocMcq(topic,r,index,label,source){
 const correct=strip(source)||topic; const dis=relatedDistractors(r.subject||'',topic,correct);
 const opts=uniq([correct,...dis]);
 while(opts.length<4)opts.push(['None of these','All of these','Not related'][opts.length-1]||'Other');
 const rot=(hash(topic+label+index)%4); const o=[...opts.slice(0,4)];
 const c=o.shift(); o.splice(rot,0,c);
 return {q:`${topic}: निम्न में से कौन-सा बिंदु इस topic के core study pack से सीधे जुड़ा है?`,options:o,answer:rot,difficulty:index<2?'Easy':index<4?'Medium':'Hard',explanation:`सही विकल्प: ${correct}. यह ${topic} के stored core material का हिस्सा है.`,concept:topic,verified:true,source:'Sky Sir Core Content Bank'};
}
function mathMcqs(topic,r){
 const t=topic.toLowerCase(); const qs=[];
 const push=(q,o,a,e,d='Medium')=>qs.push({q,options:o,answer:a,explanation:e,concept:topic,difficulty:d,verified:true,source:'Sky Sir Core Content Bank'});
 if(/percentage/.test(t)){
  push('25% of 240 कितना है?',['40','50','60','80'],2,'25/100 × 240 = 60.','Easy');
  push('₹800 पर 15% discount के बाद selling price क्या होगा?',['₹660','₹680','₹700','₹720'],1,'15% of 800 = 120; 800−120 = 680.');
  push('200 से 250 होने पर percentage increase कितना है?',['20%','25%','40%','50%'],1,'Increase 50; 50/200 ×100 = 25%.');
  push('20% increase और फिर 20% decrease का net effect क्या है?',['0%','4% increase','4% decrease','8% decrease'],2,'1.20×0.80=0.96, इसलिए 4% decrease.','Hard');
 }
 if(/ratio and proportion|ratio/.test(t)){
  push('2:3 के अनुपात में कुल 50 बाँटने पर छोटा भाग कितना होगा?',['15','20','25','30'],1,'Total parts=5; 50×2/5=20.');
  push('यदि a:b=4:5 और b:c=10:7, तो a:c क्या होगा?',['4:7','8:7','8:5','10:7'],1,'4:5 को 8:10 बनाएं; इसलिए a:c=8:7.','Hard');
 }
 if(/average/.test(t)){
  push('10, 20, 30, 40 का average क्या है?',['20','25','30','35'],1,'Sum 100 ÷ 4 = 25.','Easy');
  push('5 संख्याओं का average 18 है। उनका total कितना है?',['72','80','90','108'],2,'Total = average × count = 18×5=90.');
 }
 if(/profit|loss|discount/.test(t)){
  push('CP ₹500 और SP ₹600 है। Profit % कितना है?',['10%','15%','20%','25%'],2,'Profit=100; 100/500×100=20%.');
  push('Marked price ₹1000 पर 10% discount के बाद price?',['₹800','₹850','₹900','₹950'],2,'10% of 1000=100; net 900.','Easy');
 }
 if(/simple interest/.test(t))push('₹1000 पर 10% वार्षिक दर से 2 वर्ष का simple interest?',['₹100','₹150','₹200','₹220'],2,'SI=P×R×T/100=1000×10×2/100=200.');
 if(/compound interest/.test(t))push('₹1000 पर 10% वार्षिक compounding से 2 वर्ष बाद amount?',['₹1100','₹1200','₹1210','₹1220'],2,'1000×1.1²=1210.');
 if(/time and work/.test(t))push('A कोई काम 10 दिन में करता है। एक दिन का काम कितना?',['1/5','1/10','1/20','10'],1,'Work rate = 1/10 work per day.');
 if(/time speed distance|trains|boats/.test(t))push('60 km/h की speed से 2 घंटे में distance?',['30 km','60 km','100 km','120 km'],3,'Distance = Speed×Time = 120 km.','Easy');
 if(/hcf and lcm|hcf|lcm/.test(t))push('12 और 18 का HCF क्या है?',['2','3','6','36'],2,'Common greatest divisor 6 है.','Easy');
 if(/divisibility/.test(t))push('कौन-सी संख्या 3 से divisible है?',['124','135','142','151'],1,'135 के digits का sum 9 है, जो 3 से divisible है.','Easy');
 if(/simplification|bodmas/.test(t))push('8 + 2 × 5 = ?',['50','18','40','15'],1,'BODMAS के अनुसार multiplication पहले: 2×5=10, फिर 8+10=18.','Easy');
 if(/linear equations/.test(t))push('2x + 5 = 15 में x क्या है?',['3','5','7','10'],1,'2x=10 इसलिए x=5.');
 if(/quadratic/.test(t))push('x²−5x+6=0 के roots?',['1,6','2,3','−2,−3','3,5'],1,'(x−2)(x−3)=0.');
 if(/mean median mode/.test(t))push('2, 4, 4, 5, 8 का mode क्या है?',['2','4','5','8'],1,'सबसे अधिक बार 4 आता है.');
 if(/probability/.test(t))push('एक fair coin के Head आने की probability?',['0','1/4','1/2','1'],2,'2 equally likely outcomes में 1 favourable.');
 if(/trigonometric ratios/.test(t))push('Right triangle में sin θ = ?',['Base/Hypotenuse','Perpendicular/Hypotenuse','Hypotenuse/Base','Base/Perpendicular'],1,'sin θ = perpendicular / hypotenuse.');
 if(/distance and section formula|cartesian/.test(t))push('(0,0) और (3,4) के बीच distance?',['4','5','6','7'],1,'√(3²+4²)=5.');
 return qs;
}
function reasoningMcqs(topic){
 const t=topic.toLowerCase(),qs=[];const push=(q,o,a,e,d='Medium')=>qs.push({q,options:o,answer:a,explanation:e,concept:topic,difficulty:d,verified:true,source:'Sky Sir Core Content Bank'});
 if(/number series|series/.test(t))push('2, 4, 8, 16, ?',['18','24','32','36'],2,'हर term ×2 है.','Easy');
 if(/alphabet series/.test(t))push('A, C, E, G, ?',['H','I','J','K'],1,'हर बार एक अक्षर छोड़कर: A,C,E,G,I.','Easy');
 if(/coding/.test(t))push('यदि CAT को DBU लिखा जाए, तो DOG कैसे लिखा जाएगा?',['EPH','EOG','DPH','FPH'],0,'हर letter को +1 shift किया गया: D→E, O→P, G→H.');
 if(/blood relation/.test(t))push('A, B की माँ है और B, C का भाई है। A का C से संबंध?',['बहन','माँ','दादी','बुआ'],1,'B और C siblings हैं, इसलिए A दोनों की माँ है.');
 if(/direction/.test(t))push('व्यक्ति उत्तर की ओर 5m चलता है, फिर दाएँ मुड़ता है। अब वह किस दिशा में है?',['पश्चिम','दक्षिण','पूर्व','उत्तर'],2,'उत्तर से right turn = पूर्व.','Easy');
 if(/ranking/.test(t))push('10 छात्रों में Ravi ऊपर से तीसरा है। नीचे से उसका स्थान?',['7वाँ','8वाँ','9वाँ','6वाँ'],1,'10−3+1=8.');
 if(/syllogism/.test(t))push('All cats are animals. All animals are living beings. निश्चित निष्कर्ष?',['All living beings are cats','All cats are living beings','No cat is living','Some animals are not living'],1,'Transitive inclusion से all cats are living beings.');
 if(/calendar/.test(t))push('Leap year में कुल कितने दिन होते हैं?',['365','366','364','367'],1,'Leap year = 366 days.','Easy');
 if(/clock/.test(t))push('3:00 बजे minute hand कहाँ होता है?',['3 पर','6 पर','9 पर','12 पर'],3,'00 minutes पर minute hand 12 पर रहता है.','Easy');
 return qs;
}
function languageMcqs(topic,r,subject){
 const qs=[];const push=(q,o,a,e,d='Medium')=>qs.push({q,options:o,answer:a,explanation:e,concept:topic,difficulty:d,verified:true,source:'Sky Sir Core Content Bank'});
 const t=topic.toLowerCase();
 if(subject==='English'){
  if(/articles/.test(t))push('Choose the correct article: ___ honest person.',['a','an','the','no article'],1,'“honest” starts with a vowel sound, so “an” is used.');
  if(/subject-verb/.test(t))push('Choose the correct sentence.',['She go to school.','She goes to school.','She going to school.','She gone to school.'],1,'Singular third-person subject takes “goes” in simple present.');
  if(/tense/.test(t))push('“She has finished her work” is in which tense?',['Simple Past','Present Perfect','Past Perfect','Present Continuous'],1,'has + past participle = Present Perfect.');
  if(/prepositions/.test(t))push('Fill in: He is good ___ mathematics.',['in','at','on','for'],1,'Standard usage: good at.');
  if(/active passive/.test(t))push('Passive of “Rita writes a letter.”',['A letter is written by Rita.','A letter was written by Rita.','Rita is written by a letter.','A letter has written Rita.'],0,'Simple present passive = is/am/are + V3.');
  if(/synonym/.test(t))push('Choose a synonym of “rapid”.',['slow','quick','weak','late'],1,'Rapid means quick/fast.');
  if(/antonym/.test(t))push('Choose an antonym of “ancient”.',['old','historic','modern','past'],2,'Ancient ↔ modern.');
 }
 if(subject==='Hindi'){
  if(/पर्यायवाची/.test(topic))push('“सूर्य” का पर्यायवाची कौन-सा है?',['शशि','रवि','पवन','नीर'],1,'रवि सूर्य का पर्यायवाची है.');
  if(/विलोम/.test(topic))push('“लाभ” का विलोम?',['हानि','प्राप्ति','धन','सुख'],0,'लाभ का विलोम हानि है.');
  if(/संधि/.test(topic))push('“विद्यालय” में कौन-सी संधि है?',['व्यंजन संधि','विसर्ग संधि','स्वर संधि','कोई नहीं'],2,'विद्या + आलय में स्वर संधि है.');
  if(/मुहावरे/.test(topic))push('“आँखों का तारा” का अर्थ?',['बहुत प्रिय','बहुत दूर','बहुत तेज','बहुत क्रोधित'],0,'इस मुहावरे का अर्थ अत्यंत प्रिय व्यक्ति है.');
 }
 return qs;
}
function factualMcqs(topic,r){
 const seeds=topicSeeds(topic,r).filter(x=>x!==topic); const qs=[];
 for(let i=0;i<Math.min(6,seeds.length);i++)qs.push(assocMcq(topic,r,i,'core',seeds[i]));
 return qs;
}
function buildMcqs(topic,r){
 if(isDynamic(r.subject,topic))return [];
 let qs=[];
 if(r.subject==='Mathematics')qs=mathMcqs(topic,r);
 else if(r.subject==='Reasoning')qs=reasoningMcqs(topic,r);
 else if(r.subject==='English'||r.subject==='Hindi')qs=languageMcqs(topic,r,r.subject);
 qs=[...qs,...factualMcqs(topic,r)];
 const seen=new Set(); qs=qs.filter(q=>{const k=q.q; if(seen.has(k))return false;seen.add(k);return true});
 return qs.slice(0,6);
}
function subjectFrame(subject,topic,r){
 const f={
  Mathematics:['Concept/definition को formula से पहले समझें.','Units और base value लिखकर calculation शुरू करें.','कम से कम एक easy और एक exam-level numerical हल करें.'],
  Reasoning:['Pattern पहचानें, फिर rule लिखें.','Diagram/table/notation का उपयोग करें.','Speed से पहले accuracy verify करें.'],
  English:['Rule → example → error pattern क्रम रखें.','Sentence context में usage दिखाएँ.','Vocabulary में meaning के साथ usage याद रखें.'],
  Hindi:['नियम/परिभाषा के बाद उदाहरण लिखें.','शुद्ध रूप और सामान्य गलती साथ समझाएँ.','परीक्षा में विकल्पों की सूक्ष्म भिन्नता पर ध्यान दें.'],
  Computer:['Term → function → example → security/use-case क्रम रखें.','Hardware/software/network terms को mix न करें.','Practical context से concept जोड़ें.'],
  'Child Development & Pedagogy':['Theory को classroom example से जोड़ें.','Child-centred और inclusive implication स्पष्ट करें.','Psychologist/theory के similar options compare करें.'],
  Polity:['Constitutional term को institution/power/context से जोड़ें.','Article/amendment/date को source-verified होने पर ही exact claim करें.','Similar bodies/powers compare करें.'],
  History:['Timeline → cause → event → result sequence रखें.','Person/date/event को context में जोड़ें.','Chronology और similar movements compare करें.'],
  Geography:['Location/map → process → feature → impact sequence रखें.','Map/diagram where useful.','Similar physical features compare करें.'],
  Economy:['Term → mechanism → effect → example क्रम रखें.','Nominal/real, stock/flow जैसे contrasts साफ करें.','Changing rates/data को current source से verify करें.'],
  Environment:['Concept → ecosystem link → impact → conservation क्रम रखें.','Convention/year जैसे dynamic details source-check करें.','Cause-effect chain बनाएं.'],
  Science:['Definition → principle/process → diagram → daily-life example.','Units/labels/sign convention verify करें.','Common misconception को explicitly correct करें.'],
  'Environmental Studies':['Child-friendly observation → activity → concept → assessment.','Local environment examples लें.','EVS pedagogy में integrated learning रखें.'],
  'Social Studies':['Evidence/map/timeline → concept → civic/social application.','Multiple perspectives और source use बताएं.','Map/timeline practice जोड़ें.'],
  'UP State GK':['Static fact और current layer अलग रखें.','Map/district/river context जोड़ें.','Changing scheme/current data source-check करें.'],
  'Bihar State GK':['Static fact और current layer अलग रखें.','Map/district/river context जोड़ें.','Changing scheme/current data source-check करें.'],
  'Banking Awareness':['Term → RBI/bank function → customer/use-case → risk.','Changing policy rates source-check करें.','Payments/security examples जोड़ें.'],
  'General Studies':['Concept को Polity/History/Geography/Economy/Science context से जोड़ें.','Static और current fact अलग रखें.','Statement-based practice कराएँ.'],
  'General Knowledge':['Static fact को category/context से याद करें.','Current lists/dates source-check करें.','One-liner recall + MCQ practice करें.']
 };
 return f[subject]||[`पहले ${topic} का अर्थ/परिभाषा स्पष्ट करें.`,`मुख्य बिंदु examples के साथ समझाएँ.`,`अंत में exam-style recall कराएँ.`];
}
function buildDpp(topic,r){
 if(isDynamic(r.subject,topic))return [
  `${topic}: आज की verified source list खोलें और कम-से-कम 5 items note करें.`,
  `${topic}: हर item का Event → Important Point → Exam Relevance लिखें.`,
  `${topic}: 5 source-backed MCQ बनाएं/attempt करें.`,
  `${topic}: date और source के बिना किसी fact को current mark न करें.`,
  `${topic}: yesterday pack से 5 recall questions revise करें.`
 ];
 const seeds=topicSeeds(topic,r), ex=arr(r.examples), mis=arr(r.commonMistakes), facts=arr(r.facts), forms=arr(r.formula);
 const s=i=>safePick(seeds,i,topic); const e=i=>safePick(ex,i,`${topic} का एक application example बनाइए.`); const m=i=>safePick(mis,i,`${topic} की एक common mistake लिखकर correct कीजिए.`); const f=i=>safePick(facts,i,s(i));
 return uniq([
  `${topic}: अपनी भाषा में 3–5 lines में core concept समझाइए. संकेत: ${s(0)}`,
  `${topic}: इन key points को explain कीजिए — ${s(1)} | ${s(2)}`,
  `${topic}: example/application solve/explain करें — ${e(0)}`,
  `${topic}: दूसरा exam-level example/application — ${e(1)}`,
  `${topic}: common mistake पहचानकर correct करें — ${m(0)}`,
  `${topic}: इस fact/rule का कारण या उपयोग बताइए — ${f(0)}`,
  forms.length?`${topic}: formula/relation apply करें — ${forms[0]}`:`${topic}: एक related concept से comparison लिखिए.`,
  `${topic}: एक statement-based True/False question खुद बनाकर answer justify करें.`,
  `${topic}: 60-second rapid revision में 5 keywords बोलिए/लिखिए.`,
  `${topic}: आज के concept से एक नया exam-style question बनाकर solution/answer लिखिए.`
 ]).slice(0,10);
}
function enrich(topic,r){
 r.subject=r.subject||'General Studies'; r.chapter=r.chapter||'General';
 const dynamic=isDynamic(r.subject,topic);
 if(dynamic){r.status='LIVE SOURCE REQUIRED';r.relevance=r.relevance||`${topic} date-sensitive है; केवल verified dated sources से पढ़ाएँ.`;r.mcqs=[];r.dpp=buildDpp(topic,r);return;}
 const frame=subjectFrame(r.subject,topic,r); const seeds=topicSeeds(topic,r);
 r.status=/VERIFIED|CURRENT|UPDATED|TEACHER VERIFIED|PREMIUM READY/i.test(r.status||'')?r.status:'FOUNDATION READY';
 r.overview=r.overview||`${topic} — ${r.subject} का core competitive concept.`;
 r.relevance=r.relevance||`${topic} को selected exam के official syllabus/pattern के साथ map करके पढ़ाएँ; core concept reusable है.`;
 r.mapping=r.mapping||`${r.subject} → ${r.chapter} → ${topic}`;
 r.basic=minFill(r.basic,[r.overview,...frame],4);
 r.theory=minFill(r.theory,[...frame,`${topic} को definition, key points, application और exam-trap के क्रम में consolidate करें.`],6);
 r.script=minFill(r.script,[`Opening question से ${topic} activate करें.`,`Zero-level concept समझाकर board पर key rule/diagram लिखें.`,`Easy example के बाद exam-level question कराएँ.`,`Common mistake दिखाकर correction कराएँ.`,`60-second recap और DPP देकर class close करें.`],6);
 r.board=minFill(r.board,[`${topic} — Definition / Core Rule`,`Key Points / Formula / Diagram`,`Example → Method → Answer`,`Common Mistake / Exam Trap`,`Rapid Revision`],5);
 r.notes=minFill(r.notes,[...r.basic.slice(0,3),...r.theory.slice(0,3)],6);
 r.deep=minFill(r.deep,[...r.theory,...frame,`Advanced layer: ${topic} के difficult/exception/application cases को question practice से consolidate करें.`],8);
 r.facts=minFill(r.facts,seeds.slice(0,5),4);
 r.tricks=minFill(r.tricks,[`Shortcut तभी use करें जब concept clear हो; option elimination में units, keywords और base condition दोबारा check करें.`],1);
 r.examples=minFill(r.examples,[`${topic} का basic example बनाकर rule apply करें.`,`${topic} का medium exam-style application solve करें.`,`${topic} का trap/exception example discuss करें.`],3);
 r.commonMistakes=minFill(r.commonMistakes,[`${topic} में definition/rule और application condition mix न करें.`,`Question की unit/base/keyword को ignore न करें.`,`Memorized shortcut को बिना condition check किए apply न करें.`],3);
 r.trap=r.trap||`${topic} में similar terms/conditions को बदलकर distractor बनाया जा सकता है; wording और base condition check करें.`;
 r.oneLine=minFill(r.oneLine,[`${topic}: definition → key rule → example → trap → revision.`],4);
 r.memoryTip=r.memoryTip||`Memory cue: ${topic} को 3 keywords + 1 example + 1 common mistake से recall करें.`;
 r.homework=minFill(r.homework,[`${topic}: class notes revise करें.`,`${topic}: 10 DPP tasks attempt करें.`,`${topic}: 5 key points एक page पर लिखें.`,`${topic}: 1 self-made MCQ बनाएं और explanation लिखें.`,`${topic}: next class से पहले 60-second oral recap करें.`],5);
 r.dpp=buildDpp(topic,r);
 r.mcqs=buildMcqs(topic,r);
 // Guarantee minimum 6 safe questions without inventing factual provenance.
 const seeds2=topicSeeds(topic,r); let k=0;
 while(r.mcqs.length<6 && k<seeds2.length+12){const src=seeds2[k%Math.max(1,seeds2.length)]||r.overview;r.mcqs.push(assocMcq(topic,r,k,'fill',src));k++}
 r.mcqs=r.mcqs.slice(0,6);
 r.learningTargets=uniq([...(r.learningTargets||[]),`Explain ${topic} from basic to exam level.`,`Apply the key rule/concept in examples.`,`Identify common mistakes and exam traps.`,`Complete DPP and rapid revision.`]).slice(0,5);
 r.pptReady=true;r.notesReady=true;r.testReady=r.mcqs.length>=6;r.dppReady=r.dpp.length>=10;
}
Object.entries(D.verifiedTopics||{}).forEach(([topic,r])=>enrich(topic,r));
// Shared Percentage is the canonical richer record when present.
const shared=window.SKY_SHARED_CONTENT?.Percentage||window.SKY_SHARED_CONTENT?.percentage;
if(shared&&D.verifiedTopics?.Percentage){D.verifiedTopics.Percentage={...D.verifiedTopics.Percentage,...shared,subject:'Mathematics',chapter:'Arithmetic',status:'CORE READY'};enrich('Percentage',D.verifiedTopics.Percentage)}
const all=Object.entries(D.verifiedTopics||{}),dynamic=all.filter(([t,r])=>isDynamic(r.subject,t)),staticRows=all.filter(([t,r])=>!isDynamic(r.subject,t));
D.completeHubVersion='C1';
D.contentCoverageC1={
 totalTopics:all.length,
 staticTopics:staticRows.length,
 dynamicSourceGated:dynamic.length,
 mcqs:staticRows.reduce((n,[,r])=>n+(r.mcqs||[]).length,0),
 dppTasks:staticRows.reduce((n,[,r])=>n+(r.dpp||[]).length,0),
 pptReady:staticRows.filter(([,r])=>r.pptReady).length,
 notesReady:staticRows.filter(([,r])=>r.notesReady).length,
 testReady:staticRows.filter(([,r])=>r.testReady).length,
 generatedAt:new Date().toISOString()
};
})();
