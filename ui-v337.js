/* Local interface language only: names, record values and typed text are never translated. */
(()=>{'use strict';const W=window,$=id=>document.getElementById(id);let lang='hi';try{lang=localStorage.getItem('ldm_ui_language_v337')==='en'?'en':'hi'}catch(_){}
const pairs=[
["Admin Full Access – A to Z Modules", "सभी प्रशासनिक कार्य"],
["⌃ Hide / Show", "⌃ छिपाएँ / दिखाएँ"],
["School Status Today", "आज विद्यालय की स्थिति"],
["Live Overview", "वर्तमान स्थिति"],
["Universal ERP Control Center", "सार्वभौमिक ईआरपी नियंत्रण केंद्र"],
["LD Modern Premium ERP • A–Z Status • All Existing Functions", "एल डी मॉडर्न ईआरपी • स्थिति • सभी उपलब्ध कार्य"],
["OPEN A–Z CENTER →", "सभी कार्य खोलें →"],
["Student Photos", "विद्यार्थी फोटो"],
["Students & Staff", "विद्यार्थी एवं कर्मचारी"],
["Teaching & Checking", "शिक्षण एवं जाँच"],
["Exams & Marks", "परीक्षा एवं अंक"],
["Admin Work", "प्रशासनिक कार्य"],
["Office", "कार्यालय"],
["School Administration", "विद्यालय प्रशासन"],
["Profile", "प्रोफाइल"],
["Your school’s progress is our priority.", "आपके विद्यालय की प्रगति हमारी प्राथमिकता है।"],
["Support • Guide • Encourage • Excel", "सहयोग • मार्गदर्शन • प्रोत्साहन • उत्कृष्टता"],
["Auto view", "स्वचालित दृश्य"],
["Mobile", "मोबाइल"],
["Desktop", "डेस्कटॉप"],
["Change photo", "फोटो बदलें"],
["Daily Quick Desk", "दैनिक त्वरित कार्य केंद्र"],
["QR Gate & Presence", "क्यूआर प्रवेश एवं उपस्थिति"],
["Entered • Inside • Exited • Not Arrived", "प्रवेश • अंदर • बाहर • नहीं पहुँचे"],
["Admin QR Scanner", "प्रशासनिक क्यूआर स्कैनर"],
["Entry / Exit / Teacher Gate", "प्रवेश / निकास / शिक्षक द्वार"],
["Student QR Center", "विद्यार्थी क्यूआर केंद्र"],
["View • Print • Regenerate", "देखें • प्रिंट • पुनः बनाएँ"],
["Storage Center", "भंडारण केंद्र"],
["Usage • Safe Cleanup", "उपयोग • सुरक्षित सफाई"],
["Attendance Status", "उपस्थिति स्थिति"],
["Class-wise done / not marked", "कक्षावार दर्ज / अदर्ज"],
["Attendance Conflicts", "उपस्थिति विसंगतियाँ"],
["Duplicate • Resolve • History", "दोहराव • समाधान • इतिहास"],
["Exam Participation", "परीक्षा सहभागिता"],
["Selected • Admit • Appeared", "चयनित • प्रवेश पत्र • उपस्थित"],
["Marks Entry Progress", "अंक प्रविष्टि प्रगति"],
["Teacher • Subject • Pending", "शिक्षक • विषय • लंबित"],
["Transport Trip", "परिवहन यात्रा"],
["Pickup / Drop attendance", "चढ़ने / उतरने की उपस्थिति"],
["Presence & Leave", "उपस्थिति एवं अवकाश"],
["Students + Teachers today", "आज के विद्यार्थी एवं शिक्षक"],
["Student Requests", "विद्यार्थी अनुरोध"],
["Leave • Correction • Add/Remove", "अवकाश • सुधार • जोड़ें/हटाएँ"],
["Teacher Requests", "शिक्षक अनुरोध"],
["Personal + class related", "व्यक्तिगत एवं कक्षा संबंधी"],
["Timetable Master", "मुख्य समय सारणी"],
["Fast bell + whole week", "घंटी एवं पूरे सप्ताह की सारणी"],
["Daily Teaching", "दैनिक शिक्षण"],
["Timetable → lesson update", "समय सारणी → पाठ अपडेट"],
["Academic Monitoring", "शैक्षणिक निगरानी"],
["Teaching • Copy Check • Bell Tests", "शिक्षण • कॉपी जाँच • लघु परीक्षा"],
["Master Gate Pass", "मुख्य प्रवेश-निकास अनुमति"],
["Early Leave • Group • Approval", "शीघ्र छुट्टी • समूह • अनुमोदन"],
["Parent Data Updates", "अभिभावक विवरण सुधार"],
["Approve once → sync everywhere", "एक बार अनुमोदन → सभी जगह अपडेट"],
["Admit Publish", "प्रवेश पत्र प्रकाशन"],
["Fee clear • Select • Parent show", "शुल्क स्थिति • चयन • अभिभावक दृश्य"],
["Student / Parent Login", "विद्यार्थी / अभिभावक लॉगिन"],
["One Password • Live Status", "एक पासवर्ड • वर्तमान स्थिति"],
["Class Teacher Control", "कक्षा शिक्षक नियंत्रण"],
["Assign • Repair • Change • Handover • Open Class", "आवंटन • सुधार • बदलाव • हस्तांतरण • कक्षा खोलें"],
["Full Details • Edit • Correct • Update • Delete Safety", "पूरा विवरण • संपादन • सुधार • अपडेट • सुरक्षित हटाएँ"],
["Quick Due Fee Update", "त्वरित बकाया शुल्क अपडेट"],
["Central Ledger • Monthly • Installment • Reminder", "केंद्रीय लेखा • मासिक • किस्त • अनुस्मारक"],
["ID Card Center", "पहचान पत्र केंद्र"],
["10 Formats • Preview • A4 Print", "10 प्रारूप • पूर्वावलोकन • ए4 प्रिंट"],
["Assistant / Work Delegation", "सहायक / कार्य आवंटन"],
["Assign • Multi Teacher • Responsibility • Off", "आवंटन • अनेक शिक्षक • दायित्व • बंद"],
["Premium Certificate Center", "प्रीमियम प्रमाणपत्र केंद्र"],
["10 A4 Formats • Photo • QR • PDF", "10 ए4 प्रारूप • फोटो • क्यूआर • पीडीएफ"],
["School Documents & Certificates", "विद्यालय दस्तावेज एवं प्रमाणपत्र"],
["TC • Birthday • Bonafide • Character • ID • Admit • Letters", "टीसी • जन्मदिन • वास्तविकता • चरित्र • पहचान • प्रवेश • पत्र"],
["UP Board 9–12 Control", "यूपी बोर्ड 9–12 नियंत्रण"],
["Registration • Exam Form • Practical • Admit • Result • Certificates", "पंजीकरण • परीक्षा फॉर्म • प्रायोगिक • प्रवेश • परिणाम • प्रमाणपत्र"],
["UDISE+ Control Center", "यूडाइस+ नियंत्रण केंद्र"],
["Profile • Facilities • Students • Teachers • Readiness", "प्रोफाइल • सुविधाएँ • विद्यार्थी • शिक्षक • तैयारी"],
["Advocate Control Center", "अधिवक्ता नियंत्रण केंद्र"],
["FIR/CNR • Cases • Hearings • Drafting • Legal Books", "एफआईआर/सीएनआर • मुकदमे • सुनवाई • प्रारूप • विधि पुस्तकें"],
["ERP Builder & Developer Studio", "ईआरपी निर्माण एवं विकास केंद्र"],
["Sector ERP • Requirements • Security Gate • Version • Delivery", "ईआरपी क्षेत्र • आवश्यकताएँ • सुरक्षा • संस्करण • वितरण"],
["LDM Smart Study & Competition Hub", "एलडीएम अध्ययन एवं प्रतियोगिता केंद्र"],
["Board Class • Competitive Exams • Current Affairs • Test • PPT • Notes", "बोर्ड कक्षा • प्रतियोगी परीक्षा • समसामयिकी • टेस्ट • पीपीटी • नोट्स"],
["Admin Link Manager", "प्रशासनिक लिंक प्रबंधक"],
["Add / Edit / Hide / Sort Links", "लिंक जोड़ें / संपादित करें / छिपाएँ / क्रमबद्ध करें"],
["Morning Assembly", "प्रातःकालीन सभा"],
["Owner Money Ledger", "स्वामी धन लेखा"],
["Central Examination", "केंद्रीय परीक्षा"],
["Paper • P/A • Marks", "प्रश्नपत्र • उपस्थिति • अंक"],
["Preview • A4 Print • PDF", "पूर्वावलोकन • ए4 प्रिंट • पीडीएफ"],
["Admit Cards", "प्रवेश पत्र"],
["Exam • Admit • Print", "परीक्षा • प्रवेश पत्र • प्रिंट"],
["Fee & Accounts", "शुल्क एवं लेखा"],
["Collection • Due • Reports", "संग्रह • बकाया • रिपोर्ट"],
["Presence • Leave", "उपस्थिति • अवकाश"],
["Result Receipt", "परिणाम प्राप्ति रसीद"],
["Marksheet / TC Receipt", "अंकपत्र / टीसी रसीद"],
["Teaching Progress", "शिक्षण प्रगति"],
["Checking & Homework", "जाँच एवं गृहकार्य"],
["Student Attendance", "विद्यार्थी उपस्थिति"],
["Marks & Progress", "अंक एवं प्रगति"],
["Fee Due Control", "बकाया शुल्क नियंत्रण"],
["Student ID Cards", "विद्यार्थी पहचान पत्र"],
["Certificates", "प्रमाणपत्र"],
["Notice & Communication", "सूचना एवं संचार"],
["Daily Presence", "दैनिक उपस्थिति"],
["Transport", "परिवहन"],
["Work Delegation", "कार्य आवंटन"],
["Admin Settings", "प्रशासनिक सेटिंग"],
["All Reports", "सभी रिपोर्ट"],
["Admission • Search • Records", "प्रवेश • खोज • अभिलेख"],
["Staff • Profiles • Attendance", "कर्मचारी • प्रोफाइल • उपस्थिति"],
["Lessons • Periods • Syllabus", "पाठ • कालांश • पाठ्यक्रम"],
["Homework • Copy Checking", "गृहकार्य • कॉपी जाँच"],
["Classes • Schedule • Bell", "कक्षाएँ • समय सारणी • घंटी"],
["Daily • Monthly • Correction", "दैनिक • मासिक • सुधार"],
["Teacher • Class • Subject", "शिक्षक • कक्षा • विषय"],
["Correction • Ledger", "सुधार • लेखा"],
["Student Photos • Print", "विद्यार्थी फोटो • प्रिंट"],
["School • Premium Certificates", "विद्यालय • प्रीमियम प्रमाणपत्र"],
["Class • Section • Assign", "कक्षा • अनुभाग • आवंटन"],
["Notices • Announcements", "सूचनाएँ • घोषणाएँ"],
["Student • Teacher Status", "विद्यार्थी • शिक्षक स्थिति"],
["Pending • Corrections", "लंबित • सुधार"],
["Route • Attendance", "मार्ग • उपस्थिति"],
["Assistants • Assigned Work", "सहायक • आवंटित कार्य"],
["School • Security • Options", "विद्यालय • सुरक्षा • विकल्प"],
["Preview • Print • Export", "पूर्वावलोकन • प्रिंट • निर्यात"],
["Teacher • Work • Leave", "शिक्षक • कार्य • अवकाश"],
["Quick Links", "त्वरित लिंक"],
["Total Students", "कुल विद्यार्थी"],
["Total Teachers", "कुल शिक्षक"],
["Fee Collection", "शुल्क संग्रह"],
["Pending Requests", "लंबित अनुरोध"],
["Today’s five-minute Principal Assembly Pack", "आज का पाँच मिनट का प्राचार्य सभा पैक"],
["Receipts • Payments • Party Balance • Owner Only", "लेना • देना • पक्षकार शेष • केवल स्वामी"],
["All school management functions in one place", "विद्यालय प्रबंधन के सभी कार्य एक स्थान पर"],
["Pay Fee", "शुल्क जमा करें"],
["Attendance", "उपस्थिति"],
["Fee Collection Today", "आज का शुल्क संग्रह"],
["Total Due", "कुल बकाया"],

['Dashboard','डैशबोर्ड'],['Master Plan','मास्टर प्लान'],['FINAL MASTER PLAN','मुख्य कार्य केंद्र'],['Home','होम'],['Back','वापस'],['Menu','मेन्यू'],['Lock','लॉक'],['Website','वेबसाइट'],['View Website','वेबसाइट देखें'],['Refresh / अपडेट','अपडेट'],['Refresh','अपडेट'],['Search','खोजें'],['Save','सेव करें'],['Update','अपडेट करें'],['Cancel','रद्द करें'],['Close','बंद करें'],['Open','खोलें'],['OPEN →','खोलें →'],['OPEN PAPERS →','प्रश्नपत्र खोलें →'],['Print','प्रिंट'],['Preview','प्रीव्यू'],['Print / Save PDF','प्रिंट / PDF सेव करें'],['PDF / A4 Preview','PDF / A4 प्रीव्यू'],['Student photos','विद्यार्थी फोटो'],['Student photo & ID centre','विद्यार्थी फोटो एवं ID केंद्र'],
['Students','विद्यार्थी'],['STUDENTS','विद्यार्थी'],['Teachers','शिक्षक'],['TEACHERS','शिक्षक'],['Fee & Accounts','फीस एवं खाते'],['FEE & ACCOUNTS','फीस एवं खाते'],['Exam & Results','परीक्षा एवं परिणाम'],['EXAM & RESULTS','परीक्षा एवं परिणाम'],['Academics','शैक्षणिक कार्य'],['ACADEMICS','शैक्षणिक कार्य'],['Transport','परिवहन'],['TRANSPORT','परिवहन'],['Communication','संचार'],['COMMUNICATION','संचार'],['Reports & Settings','रिपोर्ट एवं सेटिंग'],['REPORTS & SETTINGS','रिपोर्ट एवं सेटिंग'],['Logout','लॉग आउट'],
['School Work Assistant','स्कूल कार्य सहायक'],['स्कूल कार्य सहायक','School Work Assistant'],['School status today','आज स्कूल की स्थिति'],['मेरी जगह स्कूल देखो','School status today'],['All tasks','सभी कार्य'],['सभी कार्य','All tasks'],['Today’s priorities • fee plans • parent support • day close','आज के जरूरी काम • फीस योजना • अभिभावक सहायता • दिन समाप्ति'],['Assign Work / काम दें','कार्य सौंपें'],['Assign Work','कार्य सौंपें'],['Teacher Academic Analysis','शिक्षक शैक्षणिक समीक्षा'],['Academic Analysis','शैक्षणिक समीक्षा'],['Question Paper Center','प्रश्नपत्र केंद्र'],['Work Alarm','लंबित कार्य'],['शिक्षक / जिम्मेदारी / प्रगति','Teacher / responsibility / progress'],['Select Teacher → Full Syllabus • Teaching • Copy Check • Bell Test','पाठ्यक्रम • शिक्षण • कॉपी जाँच • टेस्ट'],['सभी पेपर • HTML / ZIP / लिंक जोड़ें','Papers • HTML / ZIP / links'],['Daily Fee Top 25','बकाया फीस · Top 25'],['बकाया सूची / चयन / रिमाइंडर खोलें','Due list / selection / reminders'],['Daily Quick Desk','दैनिक काम'],['DAILY COUNTER','दैनिक कार्यालय'],['फीस, विद्यार्थी, प्रवेश और रसीद — सभी दैनिक काम एक जगह','Fees, students, admissions and receipts in one place'],
['Fee Enquiry & Collection','फीस पूछें / जमा करें'],['फीस पूछें / जमा करें','Fee Enquiry & Collection'],['Add Student','विद्यार्थी जोड़ें'],['विद्यार्थी जोड़ें','Add Student'],['New Admission','नया प्रवेश'],['नया प्रवेश','New Admission'],['Student Search & Details','विद्यार्थी खोजें'],['विद्यार्थी खोजें','Student Search & Details'],['Receipt & Ledger','रसीद और खाता'],['रसीद और खाता','Receipt & Ledger'],['Add Teacher','शिक्षक जोड़ें'],['Mark Attendance','उपस्थिति दर्ज करें'],['Add Expense','खर्च जोड़ें'],['Generate Report','रिपोर्ट बनाएँ'],['Send Notice','सूचना भेजें'],['Settings','सेटिंग'],['Quick Links','त्वरित विकल्प'],
['Student','विद्यार्थी'],['Student Name','विद्यार्थी का नाम'],['Father','पिता'],['Father Name','पिता का नाम'],['Mother Name','माता का नाम'],['Class','क्लास'],['All Classes','सभी क्लास'],['Select Class','क्लास चुनें'],['Section','सेक्शन'],['Roll No.','रोल नंबर'],['Admission No.','प्रवेश संख्या'],['Mobile','मोबाइल'],['Phone','फोन'],['Address','पता'],['Date','तारीख'],['Status','स्थिति'],['Actions','कार्रवाई'],['Details','विवरण'],['Full Details','पूरा विवरण'],['Name','नाम'],['Amount','राशि'],['Paid','जमा'],['Due','बकाया'],['Total','कुल'],['Total Due','कुल बकाया'],['Fee Clear','फीस साफ'],['Published','प्रकाशित'],['Held','रोका गया'],['Present','उपस्थित'],['Absent','अनुपस्थित'],['Leave','अवकाश'],['Not Marked','दर्ज नहीं'],['Attendance','उपस्थिति'],['Student Attendance (Today)','आज विद्यार्थी उपस्थिति'],['View Details →','विवरण देखें →'],
['Master Official Reports','आधिकारिक रिपोर्ट'],['Student Data Hub','विद्यार्थी डेटा केंद्र'],['Excel Center','एक्सेल केंद्र'],['Master Fee','मुख्य फीस केंद्र'],['Master Due Fee','मुख्य बकाया फीस'],['Class Due Fee','क्लास बकाया फीस'],['Master Attendance','मुख्य उपस्थिति'],['Master Due Fee Update','केंद्रीय बकाया फीस अपडेट'],['Due Till Month','इस महीने तक बकाया'],['Load Current Data','वर्तमान डेटा लाएँ'],['Save Till Month','महीना सेव करें'],['Total Students','कुल विद्यार्थी'],['Due Students','बकाया वाले विद्यार्थी'],['Clear Students','फीस साफ विद्यार्थी'],['Total Current Due','कुल वर्तमान बकाया'],['Master Search: पूरे school data में खोजें','Master Search: search school records'],['Student Name / Father / Admission / Roll / Mobile','नाम / पिता / प्रवेश संख्या / रोल / मोबाइल'],['नाम / पिता / मोबाइल / प्रवेश संख्या / रोल नंबर','Name / father / mobile / admission / roll'],['नाम / पिता / मोबाइल लिखें, Search करें और सही विद्यार्थियों को + Add से जोड़ें।','Search by name / father / mobile, then use + Add for the correct students.'],
['Student Register','विद्यार्थी रजिस्टर'],['Admission Register','प्रवेश रजिस्टर'],['Smart Student Attendance','विद्यार्थी उपस्थिति'],['Smart Marksheet Center','मार्कशीट केंद्र'],['Marksheet','मार्कशीट'],['ID Card','ID कार्ड'],['Admit Card','प्रवेश पत्र'],['Transfer Certificate','स्थानांतरण प्रमाणपत्र'],['Fee Dashboard','फीस डैशबोर्ड'],['Pay Fee','फीस जमा करें'],['Fee Card','फीस कार्ड'],['Fee Structure','फीस संरचना'],['Income','आय'],['Expenses','खर्च'],['Balance Sheet','बैलेंस शीट'],['Parent Access Center','अभिभावक लॉगिन केंद्र'],['Student Master Control','विद्यार्थी मास्टर केंद्र'],['Teacher Approval','शिक्षक अनुमोदन'],['Staff Attendance','स्टाफ उपस्थिति'],['Payroll','वेतन'],['Teacher Requests','शिक्षक अनुरोध'],['Teacher Bell','शिक्षण घंटी'],['Daily Teaching Monitor','दैनिक शिक्षण समीक्षा'],['My Profile','मेरा प्रोफाइल'],['My Password','मेरा पासवर्ड'],['My Class','मेरी क्लास'],['My Teaching Bell','मेरी शिक्षण घंटी'],['My Teaching Performance','मेरा शिक्षण प्रदर्शन'],['Homework','गृहकार्य'],['Marks Entry','अंक दर्ज करें'],['My Requests','मेरे अनुरोध'],['Orders / Notices','आदेश / सूचनाएँ'],['My Notes','मेरे नोट्स'],['Class Opinion','क्लास सुझाव'],['Student Photos','विद्यार्थी फोटो'],['Exam & Admit Card','परीक्षा एवं प्रवेश पत्र'],['Publish Result','परिणाम प्रकाशित करें'],['Result','परिणाम'],['Timetable Master','समय-सारणी'],['School Documents','स्कूल दस्तावेज़'],['School Control Center','स्कूल नियंत्रण केंद्र'],
['Your school assistant','आपका स्कूल सहायक'],['आपका स्कूल सहायक','Your school assistant'],['Today’s essential work','आज का जरूरी काम'],['आज का जरूरी काम','Today’s essential work'],['Date-based fee plan','तारीख वाली फीस योजना'],['तारीख वाली फीस योजना','Date-based fee plan'],['Student / parent support','विद्यार्थी / अभिभावक सहायता'],['विद्यार्थी / अभिभावक सहायता','Student / parent support'],['Exam preparation','परीक्षा तैयारी'],['परीक्षा तैयारी','Exam preparation'],['Student support','विद्यार्थी सहायता'],['विद्यार्थी सहायता','Student support'],['Substitute periods','वैकल्पिक पीरियड'],['वैकल्पिक पीरियड','Substitute periods'],['Validation checks','गलती जाँच'],['गलती जाँच','Validation checks'],['Change history','बदलाव का हिसाब'],['बदलाव का हिसाब','Change history'],['Backup and restore','बैकअप और बहाली'],['बैकअप और बहाली','Backup and restore'],['New session preparation','नए सत्र की तैयारी'],['नए सत्र की तैयारी','New session preparation'],['Day close','दिन समाप्ति'],['दिन समाप्ति','Day close'],['Teacher development','शिक्षक विकास'],['शिक्षक विकास','Teacher development'],['Saved drafts','सुरक्षित ड्राफ्ट'],['सुरक्षित ड्राफ्ट','Saved drafts'],['Daily teacher development','दैनिक शिक्षक विकास'],['दैनिक शिक्षक विकास','Daily teacher development'],['आज का अध्ययन पढ़ें','Read today’s learning'],['शैक्षिक सत्र','Academic session'],['प्रकार','Type'],['मासिक','Monthly'],['किस्त','Installment'],['खोजें','Search'],['Saving…','सेव हो रहा है…'],['Loading…','लोड हो रहा है…'],['Saved','सेव हुआ'],['Previous','पिछला'],['Next','अगला'],['Retry Same Save','उसी सेव का Retry'],['Approved','स्वीकृत'],['Rejected','अस्वीकृत'],['Pending','लंबित'],['Approve','स्वीकृत करें'],['Reject','अस्वीकार करें'],['Print All','सभी प्रिंट करें'],['PDF All','सभी की PDF'],['Select All','सभी चुनें'],['Unselect','चयन हटाएँ'],['Select All Visible','दिख रहे सभी चुनें'],['Publish Selected','चुने हुए प्रकाशित करें'],['Unpublish Selected','चुने हुए अप्रकाशित करें'],['Open A4 Print Center','A4 प्रिंट केंद्र खोलें'],['Select Fee-Clear','फीस साफ विद्यार्थी चुनें']
];
pairs.push(...[["List too large; narrow the class/section.", "सूची बहुत बड़ी है; क्लास/सेक्शन सीमित करें।"], ["Some central student photos could not be verified; check record access before printing.", "कुछ विद्यार्थियों की केंद्रीय फोटो नहीं मिली; प्रिंट से पहले रिकॉर्ड की अनुमति जाँचें।"], ["Choose a JPG, PNG or WebP photo.", "JPG, PNG या WebP फोटो चुनें।"], ["Photo must be at most 15 MB.", "फोटो अधिकतम 15 MB रखें।"], ["Class", "क्लास"], ["Upload photo", "फोटो अपलोड"], ["Mobile camera", "मोबाइल कैमरा"], ["Open camera", "कैमरा खोलें"], ["Remove photo", "फोटो हटाएँ"], ["Take photo", "फोटो लें"], ["Zoom", "ज़ूम"], ["Horizontal", "दाएँ / बाएँ"], ["Vertical", "ऊपर / नीचे"], ["Rotate", "घुमाएँ"], ["Save photo", "फोटो सेव करें"], ["Close", "बंद करें"], ["Use mobile camera or Upload on this device.", "इस डिवाइस पर मोबाइल कैमरा या Upload चुनें।"], ["Remove this student’s central photo from newly generated documents?", "इस विद्यार्थी की केंद्रीय फोटो हटाएँ? आगे बनने वाले सभी दस्तावेज़ों से हटेगी।"], ["✓ Photo saved to the central student record.", "✓ फोटो केंद्रीय रिकॉर्ड में सेव हुई।"], [" — Retry the same Save.", " — उसी Save का Retry करें।"], ["Confirm / Retry same photo Save", "उसी फोटो Save की पुष्टि / Retry"], ["students", "विद्यार्थी"], ["change photo", "की फोटो बदलें"], ["Add photo", "फोटो जोड़ें"], ["Father", "पिता"], ["Class", "क्लास"], ["Roll", "रोल"], ["Admission", "प्रवेश संख्या"], ["Photo / camera / replace", "फोटो / कैमरा / बदलें"], ["No students found.", "कोई विद्यार्थी नहीं मिला।"], ["Authorized Admin only", "केवल अधिकृत Admin"], ["Confirm the previous photo Save first.", "पहले पिछले फोटो Save की पुष्टि करें।"], ["Student photo & ID centre", "विद्यार्थी फोटो एवं ID केंद्र"], ["Student photo & ID centre", "विद्यार्थी फोटो एवं ID केंद्र"], ["One central photo • Profile • ID • Marksheet • Admit Card • TC", "एक केंद्रीय फोटो • प्रोफाइल • ID • मार्कशीट • Admit Card • TC"], ["Class", "क्लास"], ["Select class", "क्लास चुनें"], ["Section", "सेक्शन"], ["All", "सभी"], ["Photo status", "फोटो स्थिति"], ["All", "सभी"], ["Without photo", "बिना फोटो"], ["With photo", "फोटो उपलब्ध"], ["Name / father / mobile / admission", "नाम / पिता / मोबाइल / प्रवेश संख्या"], ["Reload", "ताजा सूची"], ["Dashboard", "डैशबोर्ड"], ["Loading student records and photos…", "फोटो और विद्यार्थी रिकॉर्ड लोड हो रहे हैं…"], ["All", "सभी"], ["Choose a photo; details come from the central student record.", "फोटो चुनें; बाकी विवरण केंद्रीय विद्यार्थी रिकॉर्ड से भरा है।"], ["Select a class.", "क्लास चुनें।"], ["Complete the photo Save / Retry first.", "पहले फोटो Save / Retry पूरा करें।"], ["Previous photo Save needs confirmation.", "पिछले फोटो Save की पुष्टि बाकी है।"], ["Previous photo Save needs confirmation. ", "पिछले फोटो Save की पुष्टि बाकी है। "], ["Retry same Save", "उसी Save का Retry"], ["QR / diagram could not be copied.", "QR/चित्र कॉपी नहीं हो सका।"], ["Open a document / report first.", "पहले दस्तावेज़ / रिपोर्ट खोलें।"], ["Allow popups for preview.", "प्रीव्यू के लिए popup की अनुमति दें।"], ["Preview did not load; check that the new print files were uploaded.", "प्रीव्यू नहीं खुला; नई print फाइलें upload हैं या नहीं जाँचें।"], ["Complete student register", "पूरा विद्यार्थी रजिस्टर"], ["Class", "क्लास"], ["All classes", "सभी क्लास"], ["students", "विद्यार्थी"], ["PDF / A4 Preview", "PDF / A4 प्रीव्यू"], ["Choose a document. Current screen prints the displayed data; use complete register for every student.", "दस्तावेज़ चुनें। वर्तमान स्क्रीन में दिखाई दे रहा डेटा ही उस विकल्प में आएगा; सभी विद्यार्थियों के लिए पूरा रजिस्टर चुनें।"], ["Complete student register — all pages", "पूरा विद्यार्थी रजिस्टर — सभी पन्ने"], ["Open a PDF file", "अपनी PDF खोलें"], ["Close", "बंद करें"], ["Preview current screen", "वर्तमान स्क्रीन का प्रीव्यू"], ["This contains current screen data.", "यह वर्तमान स्क्रीन का डेटा है।"]]);
pairs.push(...[
 ['ALL FUNCTIONS • ONE SECTOR','सभी कार्य • एक केंद्र'],['A–Z School Management & Services','सम्पूर्ण विद्यालय प्रबंधन एवं सेवाएँ'],['All existing ERP modules','सभी उपलब्ध ERP मॉड्यूल'],['ERP • LIVE ROUTES','ERP • सक्रिय सुविधाएँ'],['Filter ERP modules','ERP मॉड्यूल छाँटें'],['All Cards','सभी कार्ड'],['Students & Admission','विद्यार्थी एवं प्रवेश'],['Teacher & Staff','शिक्षक एवं कर्मचारी'],['Exams & Academic','परीक्षा एवं शिक्षण'],['Finance & Fees','शुल्क एवं लेखा'],['Documents & ID','दस्तावेज एवं पहचान'],['QR & Security','क्यूआर एवं सुरक्षा'],['Management','प्रबंधन एवं नियंत्रण'],['Reports & Utilities','रिपोर्ट एवं अन्य कार्य'],['Search loaded ERP cards','उपलब्ध ERP कार्ड खोजें'],['Search cards / topics / work…','कार्ड / विषय / काम खोजें…'],['No matching card found.','इस खोज से मेल खाने वाला कार्ड नहीं मिला।'],['Open existing ERP function','मूल ERP सुविधा खोलें'],['All functions','सभी कार्य'],['Teacher Work Center','शिक्षक कार्य केंद्र'],['Office','कार्यालय'],['Today’s attendance graph','उपस्थिति • आज का ग्राफ़ देखें'],['Dashboard view','डैशबोर्ड दृश्य'],['Mobile','मोबाइल'],['Desktop','डेस्कटॉप'],['Auto view','स्वचालित दृश्य'],['Upload photo','अपनी फ़ोटो'],['Change photo','फ़ोटो बदलें'],['Search school records…','विद्यालय के रिकॉर्ड खोजें…'],['Your students’ progress is our priority.','आपके विद्यार्थियों की प्रगति हमारी प्राथमिकता है।'],['Your school’s progress is our priority.','आपके विद्यालय की प्रगति हमारी प्राथमिकता है।'],['Support • Guide • Encourage • Excel','सहयोग • मार्गदर्शन • प्रोत्साहन • उत्कृष्टता']]);
const lookup=new Map();for(const [a,b]of pairs){const both=/[\u0900-\u097f]/.test(a)&&/[\u0900-\u097f]/.test(b);const en=both?a.split('/')[0].trim():/[\u0900-\u097f]/.test(a)?b:a,hi=both?b:/[\u0900-\u097f]/.test(a)?a:b;for(const k of[a,b])if(!lookup.has(k))lookup.set(k,{en,hi})}
for(const [en,hi,alias] of [["Settings", "सेटिंग्स", ""], ["Admin Settings", "प्रशासक सेटिंग्स", ""], ["School Settings", "विद्यालय सेटिंग्स", ""], ["Website & Settings", "वेबसाइट और सेटिंग्स", ""], ["Website Look & Contact", "वेबसाइट का रूप और संपर्क", ""], ["Long-term • Low Storage • Wallpapers • Running Notice", "कम संग्रहण • पृष्ठभूमि चित्र • चलती सूचना", ""], ["Low-Storage Mode ON", "कम संग्रहण मोड चालू", ""], ["School Name", "विद्यालय का नाम", ""], ["Tagline", "ध्येय वाक्य", ""], ["Phone", "फ़ोन", ""], ["Address", "पता", ""], ["Hero Title", "मुख्य शीर्षक", ""], ["Hero Text", "मुख्य परिचय", ""], ["About Text", "विद्यालय का परिचय", ""], ["Principal Message", "प्रधानाचार्य का संदेश", ""], ["School Logo • Admit Card / Result / ID", "विद्यालय का प्रतीक चिह्न • प्रवेश पत्र / परिणाम / पहचान पत्र", ""], ["Save All Settings", "सभी सेटिंग्स सहेजें", ""], ["Hero Image", "मुख्य चित्र", ""], ["3-Colour Running Notice", "तीन रंगों की चलती सूचना", ""], ["ON", "चालू", ""], ["OFF", "बंद", ""], ["Wallpaper Control", "पृष्ठभूमि चित्र की सेटिंग्स", ""], ["Download Backup", "बैकअप डाउनलोड करें", ""], ["Password Login System", "पासवर्ड से प्रवेश", ""], ["Image upload; browser validation enabled.", "चित्र चुनें। ब्राउज़र इसकी जाँच करेगा।", ""], ["Remove", "हटाएँ", ""], ["Admin Dashboard", "प्रशासक डैशबोर्ड", ""], ["Teacher Dashboard", "शिक्षक डैशबोर्ड", ""], ["Parent Dashboard", "अभिभावक डैशबोर्ड", ""], ["Public Website", "सार्वजनिक वेबसाइट", ""], ["Theme", "थीम", ""], ["Appearance", "दिखावट", ""], ["Dashboard view", "डैशबोर्ड दृश्य", ""], ["Auto", "स्वचालित", ""], ["Mobile", "मोबाइल", ""], ["Desktop", "डेस्कटॉप", ""], ["Blue notice line", "नीली सूचना पट्टी", ""], ["Red notice line", "लाल सूचना पट्टी", ""], ["Green notice line", "हरी सूचना पट्टी", ""], ["Student photo and camera uploads use about 10–25 KB. Gallery images use about 15–50 KB. Report cards, IDs, fee PDFs and spreadsheets download on this device without saving a generated copy to the database.", "विद्यार्थी फ़ोटो लगभग 10–25 KB और गैलरी चित्र लगभग 15–50 KB लेते हैं। अंकपत्र, पहचान पत्र, शुल्क की पीडीएफ और स्प्रेडशीट इसी उपकरण पर डाउनलोड होती हैं। इनकी बनी हुई प्रति डेटाबेस में नहीं सहेजी जाती।", ""], ["Edit the public website text, logo and main banner here.", "सार्वजनिक वेबसाइट का परिचय, प्रतीक चिह्न और मुख्य चित्र यहाँ बदलें।", "Public website का basic text, logo और hero यहीं से edit करें."], ["Choose the new school logo and select", "नया विद्यालय चिह्न चुनकर", "Admin यहाँ नया logo चुनकर"], ["to use it on admit cards, results, marksheets and ID cards.", "दबाएँ। यही चिह्न प्रवेश पत्र, परिणाम, अंकपत्र और पहचान पत्र पर लगेगा।", "करे. यही logo Admit Card, Result/Marksheet और ID Card में automatically लगेगा."], ["Each notice runs in its own strip. Empty notices stay hidden.", "हर सूचना अलग पट्टी में चलेगी। खाली पट्टी अपने आप छिप जाएगी।", "तीनों line अलग strip में website के ऊपर चलेंगी. खाली line अपने-आप hide रहेगी."], ["Set a separate background for the website and each dashboard. Select Remove to clear it.", "वेबसाइट और हर डैशबोर्ड के लिए अलग पृष्ठभूमि चुनें। उसे साफ़ करने के लिए हटाएँ दबाएँ।", "Public Website, Admin, Teacher और Parent के अलग wallpaper. जरूरत न हो तो Remove करें."], ["Theme", "थीम", "थीम / Theme"], ["Dashboard view", "डैशबोर्ड दृश्य", "डैशबोर्ड दृश्य / Dashboard view"], ["Auto view", "स्वचालित दृश्य", "दृश्य · Auto"], ["Teachers and parents sign in with email or mobile number and password. Link and OTP sign-in options are hidden.", "शिक्षक और अभिभावक ईमेल या मोबाइल नंबर और पासवर्ड से प्रवेश करेंगे। लिंक और एकबारगी कोड वाले विकल्प छिपे रहेंगे।", "Teacher और Parent केवल Email/Mobile + Password से login करेंगे. Website UI में कोई Magic Link / Secure Link / OTP login option नहीं दिखेगा."], ["Database setup is complete. This V35 file requires no further SQL.", "डेटाबेस तैयार है। इस V35 फ़ाइल के लिए दोबारा SQL चलाने की आवश्यकता नहीं है।", "Database setup पहले से complete है; इस V35 file के लिए SQL दोबारा चलाने की जरूरत नहीं है."], ["Student photo and camera uploads use about 10–25 KB. Gallery images use about 15–50 KB. Report cards, IDs, fee PDFs and spreadsheets download on this device without saving a generated copy to the database.", "विद्यार्थी फ़ोटो लगभग 10–25 KB और गैलरी चित्र लगभग 15–50 KB लेते हैं। अंकपत्र, पहचान पत्र, शुल्क की पीडीएफ और स्प्रेडशीट इसी उपकरण पर डाउनलोड होती हैं। इनकी बनी हुई प्रति डेटाबेस में नहीं सहेजी जाती।", "✓ Student photo upload/camera: लगभग 10–25 KB • Gallery: लगभग 15–50 KB • Report Card/ID/Fee PDF और Excel browser में generate होकर सीधे उसी device में download होते हैं; database में generated copy save नहीं होती."]]){for(const key of [en,hi,alias])if(key)lookup.set(key,{en,hi})}
lookup.set("आज का 5 मिनट का Principal Assembly Pack",{"hi": "आज का पाँच मिनट का प्राचार्य सभा पैक", "en": "Today’s five-minute Principal Assembly Pack"});
lookup.set("लेना • देना • Party Balance • Owner Only",{"hi": "लेना • देना • पक्षकार शेष • केवल स्वामी", "en": "Receipts • Payments • Party Balance • Owner Only"});
lookup.set("School Management के सभी कार्य एक स्थान पर",{"hi": "विद्यालय प्रबंधन के सभी कार्य एक स्थान पर", "en": "All school management functions in one place"});
lookup.set("Fee Pay / फीस जमा",{"hi": "शुल्क जमा करें", "en": "Pay Fee"});
lookup.set("कुल विद्यार्थी / Total Students",{"hi": "कुल विद्यार्थी", "en": "Total Students"});
lookup.set("कुल शिक्षक / Total Teachers",{"hi": "कुल शिक्षक", "en": "Total Teachers"});
lookup.set("उपस्थिति / Attendance",{"hi": "उपस्थिति", "en": "Attendance"});
lookup.set("आज का शुल्क / Fee Collection",{"hi": "आज का शुल्क संग्रह", "en": "Fee Collection Today"});
lookup.set("कुल बकाया / Total Due",{"hi": "कुल बकाया", "en": "Total Due"});
lookup.set("लंबित अनुरोध / Pending Requests",{"hi": "लंबित अनुरोध", "en": "Pending Requests"});
const source=new WeakMap();
function translate(text){const trimmed=String(text).trim();let found=lookup.get(trimmed);if(found)return String(text).replace(trimmed,found[lang]);const m=trimmed.match(/^([^\p{L}\p{N}]*)(.*)$/u);if(m&&lookup.has(m[2]))return String(text).replace(trimmed,m[1]+lookup.get(m[2])[lang]);const alarm=trimmed.match(/^(?:🚨\s*)?Work Alarm\s*[•·]\s*(\d+)\s*Pending$/i)||trimmed.match(/^लंबित कार्य\s*[•·]\s*(\d+)$/);if(alarm)return lang==='hi'?`लंबित कार्य · ${alarm[1]}`:`Work Alarm · ${alarm[1]} Pending`;return text}
function apply(root=document.getElementById('erp')){if(!root)return;document.documentElement.lang=lang;const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){return n.parentElement&&!n.parentElement.closest('script,style,textarea,input,td,option:not([value]),[data-ui-lang],[data-lang]:is(button),[data-no-translate],#a337Preview,[contenteditable]')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT}});let n;while(n=walker.nextNode()){const prev=source.get(n),original=prev&&n.nodeValue===prev.rendered?prev.original:n.nodeValue,rendered=translate(original);if(n.nodeValue!==rendered)n.nodeValue=rendered;source.set(n,{original,rendered})}
 root.querySelectorAll('[placeholder],[aria-label]').forEach(el=>{for(const attr of['placeholder','aria-label']){if(!el.hasAttribute(attr))continue;const k='i18n'+attr.replace('-',''),now=el.getAttribute(attr),record=el[k],original=record&&record.rendered===now?record.original:now,rendered=translate(original);if(now!==rendered)el.setAttribute(attr,rendered);el[k]={original,rendered}}});document.querySelectorAll('button[data-ui-lang],button[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.uiLang||b.dataset.lang)===lang)))}
function language(){return lang}function setLanguage(value){if(value!=='hi'&&value!=='en')return;lang=value;try{localStorage.setItem('ldm_ui_language_v337',lang)}catch(_){}apply();apply($('parentDashboard'));greeting();W.dispatchEvent(new CustomEvent('ldm:language-changed',{detail:{language:lang}}))}
function greeting(now=new Date()){
 const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',hourCycle:'h23'}).format(now));
 const phase=hour<5||hour>=21?3:hour<12?0:hour<17?1:2;
 const wish=(lang==='hi'?['सुप्रभात','शुभ दोपहर','शुभ संध्या','शुभ रात्रि']:['Good Morning','Good Afternoon','Good Evening','Good Night'])[phase];
 const date=new Intl.DateTimeFormat(lang==='hi'?'hi-IN':'en-IN',{timeZone:'Asia/Kolkata',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(now);
 const set=(node,value)=>{if(node&&node.textContent!==value)node.textContent=value};
 document.querySelectorAll('[data-ldm-role-greeting]').forEach(h=>{const teacher=h.dataset.ldmRoleGreeting==='teacher';set(h,wish+', '+(lang==='hi'?(teacher?'शिक्षक':'प्रशासक'):(teacher?'Teacher':'Admin')))});
 document.querySelectorAll('[data-ldm-role-date]').forEach(n=>set(n,date));
 const g=$('v233Greeting');if(!g)return;const p=typeof profile!=='undefined'?profile:W.profile,name=String(p?.full_name||'').trim();
 set(g.querySelector('.v271GreetingCopy b'),wish+' · '+(name&&!name.includes('@')?name:lang==='hi'?'प्रधानाचार्य':'Principal'));
 set(g.querySelector('.v271GreetingCopy small'),date);
}
function mount(translateAll=true){const erp=$('erp');if(!erp)return;const top=erp.querySelector('.erpTop')||$('erpContent');if(top&&!$('v337Toolbar')){const bar=document.createElement('div');bar.id='v337Toolbar';bar.innerHTML='<div class="v337Language" aria-label="Interface language"><button type="button" data-ui-lang="hi">हिंदी</button><button type="button" data-ui-lang="en">English</button></div><div class="v337Tools"><button type="button" id="v337PhotoEntry">📷 Student photos</button><button type="button" id="v337PrintEntry">PDF / A4 Preview</button></div>';top.after(bar);bar.querySelectorAll('[data-ui-lang]').forEach(b=>b.onclick=()=>setLanguage(b.dataset.uiLang));$('v337PhotoEntry').onclick=()=>W.render('student_photo_center');$('v337PrintEntry').onclick=()=>W.LDM_A4_V337?.choose()}
 const p=typeof profile!=='undefined'?profile:W.profile;const isAdmin=['admin','super_admin','principal'].includes(String(p?.role||'').toLowerCase());if($('v337PhotoEntry'))$('v337PhotoEntry').hidden=!isAdmin;
 const master=document.querySelector('.v53Hub');if(isAdmin&&master&&!$('v337MasterPhoto')){const b=document.createElement('button');b.id='v337MasterPhoto';b.innerHTML='<b>📷 Student photos</b><small>Profile · ID · Marksheet · Admit Card · TC</small>';b.onclick=()=>W.render('student_photo_center');master.append(b)}
 greeting();if(translateAll)apply(erp)}
let queued=false,observer,targets=new Set();function schedule(records=[]){for(const r of records){if(r.type==='characterData'){if(r.target.parentElement)targets.add(r.target.parentElement)}else for(const n of r.addedNodes)if(n.nodeType===1)targets.add(n);else if(n.nodeType===3&&n.parentElement)targets.add(n.parentElement)}if(queued||!targets.size)return;queued=true;requestAnimationFrame(()=>{queued=false;const erp=$('erp');if(!erp){targets.clear();return}observer?.disconnect();try{const list=[...targets].filter(n=>n.isConnected),roots=new Set(list);targets.clear();for(const n of list){let parent=n.parentElement,covered=false;while(parent){if(roots.has(parent)){covered=true;break}parent=parent.parentElement}if(!covered)apply(n);}mount(false)}finally{observer?.observe(erp,{childList:true,subtree:true,characterData:true})}})}
function install(){mount();W.setInterval(()=>{if(!document.hidden)greeting()},30000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)greeting()});const erp=$('erp');if(erp){observer=new MutationObserver(schedule);observer.observe(erp,{childList:true,subtree:true,characterData:true})}}

const toast=W.toast;if(typeof toast==='function')W.toast=function(text,...args){return toast.call(this,translate(text),...args)};
W.LDM_V337_UI={language,setLanguage,translate,refreshGreeting:greeting,t:(hi,en)=>lang==='hi'?hi:en,apply,mount};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
