(function(){
  const boardSubjects = {
    Science:[
      'Chemical Reactions and Equations','Acids, Bases and Salts','Metals and Non-metals','Carbon and its Compounds','Life Processes','Control and Coordination','How do Organisms Reproduce?','Heredity','Light – Reflection and Refraction','Human Eye and Colourful World','Electricity','Magnetic Effects of Electric Current','Our Environment'
    ],
    Mathematics:[
      'Real Numbers','Polynomials','Pair of Linear Equations','Quadratic Equations','Arithmetic Progressions','Triangles','Coordinate Geometry','Introduction to Trigonometry','Applications of Trigonometry','Circles','Areas Related to Circles','Surface Areas and Volumes','Statistics','Probability'
    ],
    English:[
      'Reading Comprehension','Grammar and Editing','Formal Letter / Analytical Paragraph','Prose – Theme and Character','Poetry – Theme and Devices','Supplementary Reader','Vocabulary in Context','Writing Practice','Sample Paper Practice'
    ],
    Hindi:[
      'अपठित बोध','व्याकरण','रचनात्मक लेखन','गद्य – भाव व प्रश्नोत्तर','पद्य – भावार्थ व काव्य सौंदर्य','पूरक पाठ','शब्द-भंडार','लेखन अभ्यास','मॉडल पेपर अभ्यास'
    ],
    'Social Science':[
      'History – Nationalism','History – Global World','Geography – Resources','Geography – Agriculture','Geography – Manufacturing','Civics – Power Sharing','Civics – Federalism','Civics – Political Parties','Economics – Development','Economics – Sectors','Economics – Money and Credit','Map Work','Case-based Questions'
    ],
    Computer:[
      'Digital Documentation','Electronic Spreadsheet','Database Concepts','Web Applications','Cyber Safety','Employability Skills','Practical Revision','Project / Viva Practice'
    ]
  };

  const competitionSubjects = {
    Mathematics:['Number System','Simplification','Percentage','Ratio and Proportion','Average','Profit and Loss','Simple and Compound Interest','Time and Work','Time Speed Distance','Mensuration','Data Interpretation'],
    Reasoning:['Analogy','Classification','Series','Coding-Decoding','Direction Test','Blood Relation','Ranking','Syllogism','Venn Diagram','Statement and Conclusion','Puzzle Basics'],
    GS:['Indian Polity','Modern History','Ancient and Medieval India','Indian Geography','World Geography','Economy Basics','General Science','Environment','Important Institutions','Schemes and Reports','Static GK'],
    Hindi:['व्याकरण','संधि-समास','पर्यायवाची-विलोम','मुहावरे-लोकोक्तियाँ','वाक्य शुद्धि','अपठित गद्यांश','शिक्षण उपयोगी भाषा'],
    English:['Grammar','Vocabulary','Error Detection','Sentence Improvement','Comprehension','Teaching-use English'],
    Pedagogy:['Child Development','Learning Theories','Piaget','Vygotsky','Inclusive Education','Assessment','Classroom Management','RTE and School Education','Teaching Methods','Learning Difficulties']
  };


  const ctetSubjects = {
    'Child Development & Pedagogy':['Development and Learning','Inclusive Education','Learning and Pedagogy','Assessment and Classroom Processes','Individual Differences'],
    Mathematics:['Number Concepts','Arithmetic','Geometry','Measurement','Data Handling','Mathematics Pedagogy'],
    'Environmental Studies':['Family and Friends','Food','Shelter','Water','Travel','Things We Make and Do','EVS Pedagogy'],
    'Language I - Hindi':['भाषा बोध','व्याकरण','भाषा शिक्षण','अपठित गद्यांश','कक्षा में भाषा विकास'],
    'Language II - English':['Comprehension','Grammar in Context','Language Pedagogy','Learning and Acquisition','Classroom Language Skills']
  };

  function flattenSubjects(subjects){
    return Object.entries(subjects).flatMap(([subject,topics])=>topics.map((topic,i)=>({subject,topic,chapter:`${subject} Unit ${i+1}`})));
  }

  window.SKY_COURSES = [
    {
      id:'class10-complete', type:'board', title:'Class 10 — Complete Board Course', subtitle:'Science • Maths • English • Hindi • SST • Computer',
      board:'UP Board / CBSE adaptable', days:120, minutes:60, revisionEvery:6, testEvery:12,
      source:{status:'NEEDS REVIEW',label:'Select current official board syllabus before public teaching',url:'',lastVerified:''},
      subjects:boardSubjects, syllabus:flattenSubjects(boardSubjects)
    },
    {
      id:'bpsc-tre-primary', type:'competition', title:'BPSC TRE — Primary Teacher Complete Prep', subtitle:'Maths • Reasoning • GS • Language • Pedagogy • Current Affairs',
      exam:'BPSC TRE', days:90, minutes:180, revisionEvery:6, testEvery:7,
      source:{status:'NEEDS REVIEW',label:'Verify latest official BPSC notification/syllabus before publish',url:'',lastVerified:''},
      subjects:competitionSubjects, syllabus:flattenSubjects(competitionSubjects)
    },
    {
      id:'up-primary-teacher', type:'competition', title:'UP Primary Teacher / TET Complete Prep', subtitle:'Maths • Reasoning • GS • Hindi/English • Pedagogy • Current Affairs',
      exam:'UP Teacher / TET', days:90, minutes:180, revisionEvery:6, testEvery:7,
      source:{status:'NEEDS REVIEW',label:'Verify current official recruitment/exam syllabus',url:'',lastVerified:''},
      subjects:competitionSubjects, syllabus:flattenSubjects(competitionSubjects)
    },
    {
      id:'ctet-paper1', type:'competition', title:'CTET Paper 1 — Complete Prep', subtitle:'CDP • Maths • EVS/GS • Language • Current Affairs support',
      exam:'CTET', days:75, minutes:150, revisionEvery:6, testEvery:7,
      source:{status:'NEEDS REVIEW',label:'Verify current official CTET information bulletin',url:'',lastVerified:''},
      subjects:ctetSubjects, syllabus:flattenSubjects(ctetSubjects)
    }
  ];

  window.SKY_DEFAULT_MASTER_TOPIC = (window.SKY_SHARED_CONTENT&&window.SKY_SHARED_CONTENT.Percentage)
    ? {...window.SKY_SHARED_CONTENT.Percentage,
       boardWork:window.SKY_SHARED_CONTENT.Percentage.boardWork||window.SKY_SHARED_CONTENT.Percentage.board||[],
       practice:window.SKY_SHARED_CONTENT.Percentage.practice||window.SKY_SHARED_CONTENT.Percentage.dpp||[],
       commonMistake:window.SKY_SHARED_CONTENT.Percentage.commonMistake||(window.SKY_SHARED_CONTENT.Percentage.commonMistakes||[])[0]||'',
       sourceRefs:window.SKY_SHARED_CONTENT.Percentage.sourceRefs||[], status:window.SKY_SHARED_CONTENT.Percentage.status||'DRAFT'}
    : {title:'Percentage',subject:'Mathematics',chapter:'Arithmetic',explanation:'Shared content file is required.',sourceRefs:[],status:'NEEDS REVIEW',version:1};
})();
