(function(){
  'use strict';
  const percentage={
    key:'Percentage',subject:'Mathematics',chapter:'Arithmetic',status:'NEEDS REVIEW',
    title:'Percentage — Concept to Exam Questions',
    hook:'अगर 20% बढ़ने के बाद किसी संख्या को फिर 20% घटाएँ तो क्या वही संख्या वापस मिलेगी?',
    overview:'Percentage का अर्थ प्रति सौ होता है. यह fraction, decimal और ratio से जुड़ा arithmetic concept है.',
    explanation:'Percentage का अर्थ प्रति सौ है. Base value पहचानना सबसे जरूरी step है.',
    relevance:'SSC, Banking, Railway, Police, Teaching तथा aptitude exams में direct और application-based प्रश्न आते हैं.',
    mapping:'Arithmetic → Percentage',
    learningTargets:['Percentage को fraction/decimal में बदलना','Increase/Decrease समझना','Exam-style questions solve करना'],
    basic:['x% = x/100','x% of y = (x/100) × y','Percentage change = Change/Original × 100'],
    theory:['Increase/decrease में original base पहचानें.','Successive percentage change में नया base बदल जाता है.'],
    script:['पूछें: 20% बढ़ाकर 20% घटाने पर क्या वही संख्या लौटेगी?','Percentage को “per hundred” से समझाएँ.','Fraction और decimal conversion दिखाएँ.','Successive change का exam trap कराएँ.'],
    board:['% = per 100','x% of y = x/100 × y','% Change = Change ÷ Original × 100'],
    boardWork:['% = per hundred','x% of y = x/100 × y','Increase = Original + change'],
    notes:['25%=1/4','50%=1/2','75%=3/4','10%=1/10'],
    deep:['Percentage comparison में base values अलग हो सकती हैं.','Successive change net = a + b + ab/100, signs सहित, लेकिन formula से पहले concept समझाएँ.'],
    facts:['100% = whole value','0% = no part'],
    formula:['x% of y = xy/100','Percentage change = (New−Old)/Old ×100'],
    tricks:['Common fractions ↔ percentages याद रखें: 1/2=50%, 1/4=25%, 1/5=20%.'],
    examples:['25% of 240 = 60','200 से 250: increase 50, percentage increase 25%','800 पर 15% discount = 120; selling price 680'],
    example:'₹800 का 15% = 800 × 15/100 = ₹120.',
    visual:'100-grid / bar model / before-after comparison',
    examPoint:'Question में “of” multiplication और “more/less than” base change को ध्यान से पढ़ें.',
    commonMistakes:['Percentage change में denominator original value होता है.','20% increase और 20% decrease cancel नहीं होते.'],
    commonMistake:'20% increase और 20% decrease एक-दूसरे को cancel नहीं करते.',
    oneLine:['Percent = per hundred','Base बदलता है तो percentage effect बदलता है.'],
    memoryTip:'Base बदलता है तो percentage effect भी बदलता है.',
    homework:['15% of 360','1200 पर 10% discount','40 से 50 तक percentage increase'],
    dpp:['35% of 400','A number increased by 25% becomes 500. Original?','Successive +10% and −10% net change?'],
    practice:['15% of 360 निकालिए.','₹1200 पर 10% discount के बाद मूल्य निकालिए.','40 से 50 होने पर percentage increase निकालिए.'],
    shortHook:'20% बढ़ा और 20% घटा—क्या answer same?',
    shortScript:'नहीं. क्योंकि decrease नए base पर लगता है. यही percentage का exam trap है.',
    fullVideoTitle:'Percentage Complete Concept + Exam Questions | Sky Sir',
    thumbnailText:'PERCENTAGE — EXAM TRAP!',
    sourceRefs:[],version:1,
    mcqs:[
      {q:'25% of 240 = ?',o:['40','50','60','80'],options:['40','50','60','80'],a:2,answer:2,e:'240×25/100=60',explanation:'240×25/100=60'},
      {q:'200 से 250 होने पर increase %?',o:['20%','25%','40%','50%'],options:['20%','25%','40%','50%'],a:1,answer:1,e:'50/200×100=25%',explanation:'50/200×100=25%'},
      {q:'20% increase then 20% decrease का net?',o:['0%','4% decrease','4% increase','8% decrease'],options:['0%','4% decrease','4% increase','8% decrease'],a:1,answer:1,e:'100→120→96, यानी 4% decrease.',explanation:'100→120→96, यानी 4% decrease.'}
    ]
  };
  window.SKY_SHARED_CONTENT={...(window.SKY_SHARED_CONTENT||{}),Percentage:percentage};
})();
