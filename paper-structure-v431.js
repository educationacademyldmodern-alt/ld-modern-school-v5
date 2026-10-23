/* Shared import/legacy-format structure. No network, timers, document writes or mark redistribution. */
(function(root){'use strict';
const digit=s=>String(s??'').replace(/[०-९]/g,c=>String(c.charCodeAt(0)-2406)),flat=s=>String(s??'').replace(/[\r\n]+/g,' ').trim();
const Q=/^(?:(?:Q(?:uestion)?\.?|प्रश्न|प्र\.)\s*[:.]?\s*)?(?:\((\d{1,4})\)|(\d{1,4})\s*[.)।:\-])\s*(.+)$/i;
const labels='कखगघङचछज',roman=['i','ii','iii','iv','v','vi','vii','viii'];
function options(body){
 body=String(body??'');
 const re=/(?:^|\n|[ \t]+)(?:\(([a-hकखगघङचछज]|i{1,3}|iv|v|vi{1,3}|[1-8])\)|([a-hकखगघङचछज]|i{1,3}|iv|v|vi{1,3}|[1-8])[.)]|([①-⑧]))\s*/gi;
 const hits=[...body.matchAll(re)];if(hits.length<2)return null;
 const raw=hits.map(m=>(m[1]||m[2]||m[3]).toLowerCase()),family=raw.some(x=>x.length>1&&roman.includes(x))?'roman':raw.every(x=>roman.includes(x))&&raw[0]==='i'?'roman':raw.every(x=>/^[1-8]$/.test(x))?'number':raw.every(x=>/^[①-⑧]$/.test(x))?'circle':raw.every(x=>labels.includes(x))?'hi':'letter';
 const index=x=>family==='roman'?roman.indexOf(x):family==='number'?+x-1:family==='circle'?x.charCodeAt(0)-9312:family==='hi'?labels.indexOf(x):'abcdefgh'.indexOf(x);
 const indexes=raw.map(index);if(indexes.some(x=>x<0)||indexes[0]!==0)return null;
 // A reference such as “(a) and (b)” in prose is not silently accepted as complete choices.
 const values=hits.map((m,i)=>body.slice(m.index+m[0].length,hits[i+1]?.index??body.length).trim());
 return{text:body.slice(0,hits[0].index).trim(),options:values,labels:raw,family,complete:values.every(Boolean)&&indexes.every((x,i)=>x===i)};
}
function pipeOptions(text){const p=String(text??'').split('|').map(flat);return p.length>=3?{text:p[0],options:p.slice(1),complete:p.slice(1).every(Boolean),family:'pipe'}:null}
function splitQuestion(line){const norm=digit(line),m=norm.match(Q)||norm.match(/^(?:Q(?:uestion)?\.?|प्रश्न|प्र\.)\s*(\d{1,4})\s+(.+)$/i)||norm.match(/^(\d{1,4})[ \t]+([A-Za-z\u0900-\u097f][\s\S]*)$/i);if(!m)return null;const body=m.length===4?m[3]:m[2];return{number:+(m[1]||m[2]),body:String(line).slice(norm.length-body.length),explicit:/^(?:Q(?:uestion)?\.?|प्रश्न|प्र\.)/i.test(norm),marker:norm.slice(0,norm.length-body.length).trim()}}
const patterns=[['mcq',/^(?:objective(?:\s+questions)?|multiple\s*choice(?:\s+questions)?|mcqs?|choose\s+(?:the\s+)?(?:correct|right|best)\s+(?:answer|option)s?|tick\s+(?:the\s+)?correct.*|वस्तुनिष्ठ(?:\s+प्रश्न)?|बहुविकल्पीय(?:\s+प्रश्न)?|सही\s+विकल्प.*|सही\s+उत्तर.*)/i],['blank',/^(?:fill\s+(?:in\s+)?(?:the\s+)?blanks?|रिक्त\s*स्थान.*)/i],['tf',/^(?:(?:write\s+)?true\s*(?:or|\/|and|–|-)?\s*false|(?:सही.*गलत|सत्य.*असत्य).*)/i],['match',/^(?:match\s+(?:the\s+)?(?:following|columns?|pairs?).*|मिलान.*|जोड़ी.*)/i],['custom:अति लघु उत्तर',/^(?:very\s*short(?:\s*answer)?(?:\s*questions?)?|अति\s*लघु.*)/i],['long',/^(?:long(?:\s*answer)?(?:\s*questions?)?|दीर्घ.*)/i],['short',/^(?:short(?:\s*answer)?(?:\s*questions?)?|लघु.*)/i]];
function heading(line){const norm=digit(line),section=norm.match(/^(?:section|part|खंड|खण्ड|भाग)\s*[-–—:]?\s*(?:[a-z]+|[क-ह]|\d+)\s*[:.)\-–—]?\s*(.*)$/i),number=splitQuestion(line);let text=section?section[1]:number?number.body:norm;text=text.replace(/^(?:[A-Z]{1,5}|[कखगघङचछज])[.)]\s*/i,'').replace(/^निम्नलिखित\s*/,'');const hit=patterns.find(([,re])=>re.test(text.trim()));if(!section&&!hit)return null;
 // Keep actual questions (“Choose the correct answer: What ...?”) rather than discard their stem.
 if(!section&&(options(text)||pipeOptions(text)||/[?？]/.test(text)||/\b(?:what|which|why|how|where|who)\b|क्या|कौन|क्यों|कैसे/i.test(text)))return null;const tail=text.includes(':')?text.slice(text.indexOf(':')+1).replace(/\[[^\]]*\]|\([^)]*\)/g,'').trim():'';if(!section&&tail&&/[a-wyzक-ह]/i.test(tail))return null;
 if(!section&&number&&!/\d\s*[x×*]\s*\d|:\s*(?:\[[^\]]+\])?\s*$/.test(text)&&text.replace(/\[[^\]]*\]|\([^)]*(?:marks?|अंक)[^)]*\)/gi,'').replace(/[.:।]/g,'').trim().length>60)return null;
 const mul=norm.match(/(\d+)\s*[x×*]\s*(\d+(?:\.\d+)?)\s*(?:=|marks?|अंक|\])/i),each=norm.match(/(?:each|प्रत्येक).*?(\d+(?:\.\d+)?)\s*(?:marks?|अंक)/i);
 return{type:hit?.[0]||'short',marks:mul?+mul[2]:each?+each[1]:null,title:line.trim()};
}
function trailingMark(body){const m=digit(body).match(/\s*(?:\[(\d+(?:\.\d+)?)\]|\((\d+(?:\.\d+)?)\s*(?:marks?|अंक)\))\s*$/i);return m?{body:body.slice(0,m.index).trim(),marks:+(m[1]||m[2])}:null}
function numericOption(line,current,lines,at){if(!current||!(current.type==='mcq'||current.type==='short'&&/[?？]|\b(?:which|what|choose|select)\b|कौन|क्या/i.test(current.body))||/^(?:Q(?:uestion)?\.?|प्रश्न|प्र\.)/i.test(line))return false;const m=digit(line).match(/^\(?([1-8])(?:[.)]|[ \t]+)\s*(.+)$/);if(!m||/[?？]|^(?:what|which|why|how|when|where|who|write|find|solve|explain|name|क्या|कौन|क्यों|कैसे|लिखिए|बताइए|ज्ञात|हल)\b/i.test(m[2]))return false;const n=+m[1];if(current.optionNumber431)return n===current.optionNumber431+1;if(n!==1)return false;return lines.slice(at+1,at+3).some(x=>/^\(?2(?:[.)]|[ \t]+)\s*\S/.test(digit(x.trim())))}
function legacyText(q){
 if(q.type==='mcq'){const p=pipeOptions(q.text)||options([q.text,q.extra].filter(Boolean).join('\n'));if(p)return flat(p.text)+' | '+p.options.map(flat).join(' | ')}
 if(q.type==='match'){const pair=String(q.text||'').split(/\s*=>\s*/);return pair.length===2?flat(pair[0])+' => '+flat(pair[1]):flat(q.text)+' => '+flat(q.extra)}
 return [q.text,q.extra].filter(Boolean).map(flat).join(' / ');
}
function sections(questions){const map={mcq:0,short:2,long:3,blank:4,tf:5,match:6},out=[];for(const q of questions){const type=map[q.type]??1,text=legacyText(q),source=q.sourceSection429??q.sourceSection431??null,last=out.at(-1),mark=Number(q.marks),key=q.type||'short';if(!Number.isFinite(mark)||mark<0||mark>100)throw Error('प्रति प्रश्न अंक 0 से अधिक और 100 तक रखें।');if(last&&last.sourceSection429===source&&last.sourceType431===key&&last.count<100){last.count++;last.questions+='\n'+text;last.answers+='\n'+(q.legacyAnswer401||'');last.alloc.push(mark)}else out.push({type,count:1,marks:Math.max(.01,mark),weight:Math.max(.01,mark),alloc:[mark],questions:text,answers:q.legacyAnswer401||'',sourceSection429:source,sourceType431:key,...(key.startsWith('custom:')&&key!=='custom:अति लघु उत्तर'?{customTitle431:key.slice(7)}:{}),...(type===6?{matchOrder429:'source',importMatching429:!q.legacyAnswer401}:{})})}return out}
function parse(raw,onePerLine=false){
 if(typeof raw!=='string'||raw.length>200000)throw Error('पाठ बहुत बड़ा है; एक बार में एक पेपर लें।');
 const issues=[],prefix=[],rows=[],lines=raw.replace(/\r/g,'').replace(/\u00a0/g,' ').split('\n').map(x=>x.trim()).filter(Boolean);
 // OCR/PDF can put a question/option marker on its own line. Join only that marker and its next line.
 for(let i=0;i<lines.length-1;i++)if(/^(?:(?:Q(?:uestion)?\.?|प्रश्न|प्र\.)\s*)?(?:\(?\d{1,4}[.)।:]|\([a-hकखगघङचछज]\))\s*$/i.test(digit(lines[i]))&&!heading(lines[i+1])){lines[i]+=' '+lines[i+1];lines.splice(i+1,1)}
 let type='short',mark=1,section=0,current=null,total=null,headingText='',headingMarkKnown=false;
 for(let i=0;i<lines.length;i++){let line=lines[i],norm=digit(line);if(/^(?:page|पृष्ठ|पेज)\s*\d+\s*(?:\/|of)\s*\d+\s*$/i.test(norm)||/^(?:—\s*)?(?:end of (?:question )?paper|प्रश्नपत्र समाप्त)(?:\s*—)?$/i.test(norm)||/^(?:column|स्तंभ|स्तम्भ)\s*[a-bअ-ब]\s+(?:column|स्तंभ|स्तम्भ)\s*[a-bअ-ब]\s*$/i.test(norm))continue;
  const declared=norm.match(/(?:maximum\s*marks?|max\.?\s*marks?|total\s*marks?|पूर्णांक|कुल\s*अंक)\s*[:=–—-]?\s*(\d+(?:\.\d+)?)/i);if(declared&&+declared[1]>0&&+declared[1]<=1000)total=+declared[1];
  if(numericOption(line,current,lines,i)){current.optionNumber431=+norm.match(/\d/)[0];current.body+='\n'+line;continue}if(current&&/^(?:\((?:[a-hकखगघङचछज]|i{1,3}|iv|v|vi{1,3})\)|(?:[a-hकखगघङचछज]|i{1,3}|iv|v|vi{1,3})[.)])/i.test(line)&&(current.type==='mcq'||/[?？]|\b(?:which|what|choose)\b|कौन|क्या/i.test(current.body))){current.body+='\n'+line;continue}const h=heading(line);if(h){section++;type=h.type;mark=h.marks||1;headingText=h.title;headingMarkKnown=h.marks!==null;current=null;continue}
  
  const romanRow=['blank','tf','match'].includes(type)&&line.match(/^\(?([ivx]+)[.)]\s+(.+)$/i),n=splitQuestion(line)||(romanRow?{body:romanRow[2]}:null);if(n||onePerLine){current={type,marks:mark,body:n?n.body:line,section,headingText,explicitMark:headingMarkKnown};const m=trailingMark(current.body);if(m){current.body=m.body;current.marks=m.marks;current.explicitMark=true}rows.push(current);if(rows.length>1000)throw Error('एक पेपर में अधिकतम 1000 प्रश्न लें।');continue}
  if(current)current.body+='\n'+line;else prefix.push(line);
 }
 if(!rows.length)throw Error('प्रश्न नहीं पहचाने गए। पाठ में 1. / Q. 1. रखें या “हर लाइन एक प्रश्न” चुनें।');
 const questions=rows.map((r,i)=>{let text=r.body,extra='',kind=r.type;const late=trailingMark(text);if(late){text=late.body;r.marks=late.marks;r.explicitMark=true}const p=pipeOptions(text)||options(text),review=[];
  const choiceStem=p&&p.text.trim()&&(/(?:\?|？|\b(?:which|what|choose|select|correct|tick)\b|कौन|क्या|सही\s*(?:उत्तर|विकल्प)|चुन)/i.test(p.text)||p.complete&&!/\b(?:add|subtract|multiply|divide|calculate|solve|arrange|explain|draw|write|answer)\b|जोड़|गुणा|भाग|घटा|हल\s*कर|लिखिए/i.test(p.text));
  if(p&&(kind==='mcq'||(kind==='short'&&choiceStem))){kind='mcq';text=p.text;extra=p.options.map((x,j)=>'('+(!p.complete&&p.labels?p.labels[j]:String.fromCharCode(97+j))+') '+x).join('\n');if(!p.complete)review.push('विकल्प की संख्या/क्रम या खाली विकल्प जाँचें')}
  else if(kind==='mcq')review.push('MCQ में कम-से-कम दो स्पष्ट विकल्प चाहिए');
  if(kind==='short'&&!p){if(/_{2,}|\.{4,}/.test(text))kind='blank';else if(/\btrue\s*(?:or|\/)\s*false\b|सत्य\s*[/–-]\s*असत्य|सही\s*[/–-]\s*गलत/i.test(text))kind='tf';else if(text.includes('=>'))kind='match'}
  if(kind==='match'){const pair=text.split(/\s*(?:=>|→|↔)\s*/);if(pair.length===2){text=pair[0];extra=pair[1]}else{const m=text.match(/^([\s\S]+?)\s*(?:\([a-zकखगघङचछज]\)|[a-zकखगघङचछज][.)]|\t| {3,})\s*([\s\S]+)$/i);if(m){text=m[1].trim();extra=m[2].trim()}else review.push('मिलान का दायाँ स्तंभ स्पष्ट नहीं मिला') }}
  if(!r.explicitMark&&r.marks===1)review.push('अंक स्पष्ट नहीं मिले; अभी 1 अंक रखा है');if(!text.trim())review.push('प्रश्न का मूल पाठ खाली है');
  if(review.length)issues.push('प्रश्न '+(i+1)+': '+review.join(' • '));return{type:kind,text:text.trim(),extra:extra.trim(),marks:r.marks,lines:0,sourceSection429:r.section,sourceHeading431:r.headingText,review431:review};
 });
 const sourceIds=[...new Set(questions.map(q=>q.sourceSection429))];questions.forEach(q=>q.sourceSection429=sourceIds.indexOf(q.sourceSection429));const sum=Number(questions.reduce((n,q)=>n+q.marks,0).toFixed(6));if(sum<=0)throw Error('प्रश्नों के कुल अंक 0 से अधिक रखें।');if(sum>1000)throw Error('पूर्णांक 1000 से अधिक है; अलग पेपर बनाएँ।');if(prefix.length)issues.push('मूल header/निर्देश source text में सुरक्षित हैं; class/subject मिलाएँ।');if(total&&Math.abs(total-sum)>.001)issues.push('मूल पूर्णांक '+total+' और पहचाने प्रश्नों का योग '+sum+' अलग हैं; अंक जाँचें।');return{questions,sections:sections(questions),count:questions.length,total:sum,target:total||sum,warnings:issues};
}
const api={digit,options,pipeOptions,splitQuestion,heading,legacyText,sections,parse};if(typeof module==='object'&&module.exports)module.exports=api;else root.LDM_PAPER_STRUCTURE431=api;
})(typeof window==='object'?window:globalThis);
