(()=>{
'use strict';
const D=window.SKY_COMPETITION_DATA;if(!D)return;
const clone=o=>JSON.parse(JSON.stringify(o||{}));
const map={
 'Number System':'Natural Whole Integers',
 'Simplification':'Simplification and BODMAS',
 'Profit and Loss':'Profit Loss and Discount',
 'Basic Algebraic Identities':'Algebraic Identities',
 'Series':'Number Series',
 'Ranking':'Ranking and Order',
 'Mirror and Water Image':'Mirror Image',
 'Force and Motion':'Force and Newton Laws',
 'Important Organizations':'International Organizations',
 'Awards':'Major Awards',
 'Sports Basics':'Major Sports Terms',
 'शब्द ज्ञान':'एक शब्द',
 'Hardware and Software':'Hardware',
 'MS Office Basics':'MS Word',
 'Internet and Networking':'Computer Network',
 'Cyber Safety':'Cyber Security',
 'Learning Theories':'Constructivism',
 'Assessment':'Assessment for Learning',
 'Force':'Force and Newton Laws',
 'Work and Energy':'Work Energy Power',
 'Acid Base Salt':'Acids Bases and Salts',
 'Human Systems':'Circulation',
 'Disease':'Diseases and Immunity',
 'Socio Religious Reform':'Socio Religious Reform Movements',
 'Freedom and Partition':'Partition and Independence',
 'Physical Divisions':'Physiographic Divisions of India',
 'Rivers':'Indian Rivers',
 'Climate':'Indian Climate',
 'Agriculture':'Agriculture in India',
 'Latitude Longitude':'Latitude and Longitude',
 'Earth Interior':'Interior of Earth',
 'Budget':'Union Budget Basics',
 'Poverty and Employment':'Poverty',
 'Food Chain':'Food Chain and Food Web'
};
Object.entries(map).forEach(([legacy,source])=>{
 const src=D.verifiedTopics?.[source]; if(!src)return;
 const old=D.verifiedTopics?.[legacy]||{}; const x=clone(src);
 x.subject=old.subject||x.subject; x.chapter=old.chapter||x.chapter;
 x.mapping=`${x.subject} → ${x.chapter} → ${legacy}`;
 x.relevance=`${legacy} का core concept ${source} के canonical material से reuse किया गया है; selected exam का exact weightage/current pattern official source से verify करें.`;
 x.status='CORE READY'; x.aliasOf=source;
 D.verifiedTopics[legacy]={...x,title:legacy};
});
D.verifiedTopics['Subject-Verb Agreement']={
 subject:'English',chapter:'Grammar',status:'CORE READY',
 overview:'Subject–Verb Agreement में verb का form subject के number/person तथा sentence structure के अनुसार चुना जाता है.',
 relevance:'SSC, Banking, Teaching, Railway और अन्य objective English sections में error detection, sentence improvement और fill-in-the-blank में उपयोगी.',
 mapping:'English → Grammar → Subject-Verb Agreement',
 basic:['Singular subject सामान्यतः singular verb लेता है; plural subject plural verb.','I/you के साथ verb pattern अलग हो सकता है.','Subject पहचानने से पहले intervening phrase से भ्रमित न हों.','Either/or, neither/nor, collective nouns और each/every special patterns बनाते हैं.'],
 theory:['The boy plays; the boys play.','Each/every + singular noun सामान्यतः singular verb लेता है.','Either A or B में verb nearest subject से agree कर सकता है, standard exam grammar के अनुसार context check करें.','Along with/as well as जैसे phrases मुख्य subject का number नहीं बदलते.','There is/are constructions में real subject बाद में आता है.','Amount/time/distance as one unit singular sense ले सकता है.'],
 script:['Subject identify कराएँ.','Main verb identify कराएँ.','Intervening phrase हटाकर core sentence पढ़ाएँ.','Singular/plural rule apply कराएँ.','Special cases पर error detection कराएँ.','Rapid mixed practice से close करें.'],
 board:['Subject → Number/Person','Main Verb','Intervening phrase ≠ subject','Each/Every → singular pattern','Either/Or → nearest-subject check'],
 notes:['Singular subject → singular verb form.','Plural subject → base/plural verb form.','Each/Every/Everyone generally singular.','As well as/along with does not change main subject.','There is/are: agree with following subject.','Special structures require sentence-based checking.'],
 deep:['Agreement केवल nearest noun से नहीं, grammatical subject से होता है.','Indefinite pronouns के agreement patterns अलग हो सकते हैं.','Collective noun singular/plural sense context-dependent हो सकता है.','Relative clause में antecedent subject को identify करें.','Correlative conjunctions में coordinated subjects ध्यान से पढ़ें.','Error detection में tense और agreement दोनों अलग-अलग verify करें.'],
 facts:['Subject और verb grammatical agreement रखते हैं.','Intervening prepositional phrase मुख्य subject नहीं बदलता.','Each/every patterns exam में frequent traps हैं.'],
 examples:['The list of items is on the table.','Each student has a notebook.','The teachers play; the teacher plays.'],
 commonMistakes:['Nearest noun को subject मान लेना.','Each/every के बाद plural verb लगा देना.','Tense error को agreement error समझ लेना.'],
 trap:'“The quality of the apples ___ good” में subject “quality” है, “apples” नहीं.',
 oneLine:['पहले subject पहचानो, फिर number/person, फिर verb form.'],
 formula:[],tricks:['Sentence का extra phrase bracket में mentally हटाकर subject–verb pair पढ़ें.']
};
D.verifiedTopics['Cell']={
 subject:'Science',chapter:'Biology',status:'CORE READY',
 overview:'Cell जीवों की basic structural and functional unit है. Prokaryotic और eukaryotic cells organization और organelles में भिन्न होते हैं.',
 relevance:'General Science, Teaching exams, Railway/Police और school-level science questions में cell structure, organelles और functions बार-बार पूछे जाते हैं.',
 mapping:'Science → Biology → Cell',
 basic:['Cell basic structural and functional unit है.','Cell membrane boundary और selective transport में भूमिका निभाती है.','Cytoplasm में अनेक cellular processes होते हैं.','Genetic material hereditary information रखता है.'],
 theory:['Prokaryotic cells में membrane-bound nucleus नहीं होता.','Eukaryotic cells में true nucleus और membrane-bound organelles होते हैं.','Mitochondria cellular respiration/ATP production से जुड़े हैं.','Ribosomes protein synthesis से जुड़े हैं.','Plant cells में cell wall, large vacuole और plastids प्रमुख differences हो सकते हैं.','Animal cells में cell wall/chloroplast सामान्यतः नहीं होते.'],
 script:['Cell को city/factory analogy से hook करें.','Plant vs animal cell diagram दिखाएँ.','Nucleus, mitochondria, ribosome, membrane functions explain करें.','Prokaryote vs eukaryote compare करें.','Organelle-function MCQ कराएँ.','Diagram label recall से close करें.'],
 board:['Cell = structural + functional unit','Prokaryote vs Eukaryote','Nucleus → genetic control','Mitochondria → respiration/ATP','Ribosome → protein synthesis'],
 notes:['Cell membrane selective barrier.','Cytoplasm reaction medium.','Nucleus genetic material/control.','Mitochondria energy metabolism.','Ribosome protein synthesis.','Plant cell: wall + plastids + large vacuole.'],
 deep:['Membrane phospholipid-based selective boundary है.','Organelle specialization eukaryotic compartmentalization बढ़ाती है.','Prokaryotes simpler internal organization रखते हैं.','Cell size/shape function के अनुसार vary कर सकती है.','Cell division growth/reproduction से जुड़ा है.','Microscopy cell biology study का आधार है.'],
 facts:['Robert Hooke ने cork observations में “cell” term दिया.','Ribosomes protein synthesis के sites हैं.','Plant cell wall मुख्यतः cellulose से बनी होती है.','Mitochondria aerobic respiration से जुड़ा organelle है.'],
 examples:['Onion peel plant cells.','Cheek epithelial animal cells.','Bacterial cell as prokaryote.'],
 commonMistakes:['Cell wall और cell membrane को same समझना.','Mitochondria को protein synthesis site मानना.','हर cell में nucleus होने का assumption.'],
 trap:'Prokaryote में genetic material होता है, पर membrane-bound true nucleus नहीं.',
 oneLine:['Cell → membrane + cytoplasm + genetic system; eukaryotes में specialized organelles.'],
 formula:[],tricks:['Organelle-function pairs को diagram labels के साथ revise करें.']
};
D.verifiedTopics['Human Body Basics']={
 subject:'General Studies',chapter:'Science',status:'CORE READY',
 overview:'Human body को organ systems के integrated network के रूप में समझा जाता है—digestive, respiratory, circulatory, excretory, nervous, endocrine, skeletal, muscular और reproductive systems मिलकर homeostasis बनाए रखते हैं.',
 relevance:'General Science sections में organs, systems, functions, hormones, blood circulation और basic health questions frequently पूछे जाते हैं.',
 mapping:'General Studies → Science → Human Body Basics',
 basic:['Organ → organ system → integrated body function.','Digestive system nutrients breakdown/absorption से जुड़ा है.','Respiratory system gas exchange से जुड़ा है.','Circulatory system transport करता है.'],
 theory:['Heart blood circulation का central pump है.','Lungs alveoli gas exchange के प्रमुख sites हैं.','Small intestine nutrient absorption का मुख्य site है.','Kidneys blood filtration और urine formation से जुड़े हैं.','Brain/spinal cord central nervous system बनाते हैं.','Endocrine glands hormones release कर body functions regulate करती हैं.'],
 script:['Body systems overview diagram से शुरू करें.','Digestive-respiratory-circulatory link बताएं.','Kidney और nervous system functions जोड़ें.','Major organs map कराएँ.','System-function matching MCQ कराएँ.','Homeostasis idea से recap करें.'],
 board:['Digestive → nutrients','Respiratory → O₂/CO₂ exchange','Circulatory → transport','Excretory → waste/fluid balance','Nervous/Endocrine → control'],
 notes:['Heart → circulation.','Lungs → gas exchange.','Small intestine → major absorption.','Kidney → filtration/urine.','Brain + spinal cord → CNS.','Hormones → endocrine chemical signals.'],
 deep:['Systems isolated नहीं, interdependent होते हैं.','Blood oxygen/nutrients/hormones transport करता है.','Homeostasis internal conditions regulate करने की process है.','Nervous control fast electrical/chemical signaling से जुड़ा है.','Endocrine control hormone-mediated होता है.','Health questions में organ-function pairing core है.'],
 facts:['Adult human heart four chambers का होता है.','Alveoli lungs में gas exchange surfaces हैं.','Nephron kidney की functional unit है.'],
 examples:['Exercise में respiratory and circulatory demand बढ़ना.','Meal के बाद digestion and absorption.','Dehydration में kidney water balance response.'],
 commonMistakes:['Organ और organ system mix करना.','Small intestine और large intestine functions confuse करना.','Artery/vein को oxygen content से हमेशा define करना.'],
 trap:'Artery का basic definition blood को heart से away ले जाना है; oxygenation के exceptions exist करते हैं.',
 oneLine:['Human body = coordinated organ systems maintaining transport, control, nutrition, exchange and waste balance.'],
 formula:[],tricks:['System → main organ → main function तीन-column table से revise करें.']
};
})();
