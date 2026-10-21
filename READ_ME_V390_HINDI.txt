LDM V390 — Desktop headers, IST greeting, fresh student records, automatic QR + Print

यह मौजूदा ERP के लिए cumulative replacement-files update है; standalone नई installation नहीं है। पिछले V389/V388 सुधार शामिल हैं। Mobile dashboard layout और Teacher dashboard की working arrangement नहीं बदली गई है।

पूरा upload तरीका
1. पहले खुले काम Save करें और मौजूदा website files का backup लें।
2. ZIP extract करें। नीचे की सभी 19 code files को उसी ERP root folder में एक साथ upload / Replace करें जहाँ पुराना index.html है। नया subfolder बनाकर उसके अंदर न रखें। बाकी website files, logo, fonts और assets न हटाएँ।
   a4-preview-v337.html
   a4-preview-v337.js
   a4-print-v337.js
   admin-documents-v389.js
   admit-layout-v339.css
   admit-layout-v339.js
   corrections-v308.js
   dashboard-order-v350.js
   dashboard-v332.js
   desktop-premium-v378.css
   desktop-premium-v378.js
   documents-v345.js
   index.html
   marksheet-core.css
   marksheet-core.js
   paper-premium-v381.js
   runtime-v347.js
   smart-work-v333.js
   teacher-paper-form-v343.html
3. QA JSON, SHA256.json और README website पर upload नहीं करने हैं।
4. Upload पूरा होने पर laptop पर Ctrl+Shift+R करें या नया Incognito tab खोलें। पुराने खुले tabs बंद करके login करें।
5. Admin, Teacher और Parent desktop पर dashboard और एक function खोलें। School name, Back/Home/Menu/Logout, header की ऊँचाई और page scroll देखें। Mobile dashboard का क्रम पहले जैसा रहेगा।
6. Admit Center → Exam → Classes → Students/Refresh → Smart Admit Card Batches में फीस विकल्प और विद्यार्थी चुनें। एक, चुने हुए या पूरी Class चुनी जा सकती है।
7. “QR अपने-आप तैयार करें” चालू है: “Preview + Auto QR” या “चुने Print / Save PDF” दबाने पर ताजा Student Master पढ़ा जाएगा और QR अपने-आप तैयार होंगे। चार requests साथ चल सकती हैं; कुल समय internet/server पर निर्भर है। हर विद्यार्थी का अलग toast नहीं आएगा। काम रोकने का बटन भी है; बन चुके QR सुरक्षित रहेंगे।
8. Status में तैयार संख्या और नीचे नाम/Admission/Class सहित समस्या का विवरण देखें। वास्तव में खाली पिता-नाम वाले छात्र को अलग रखा जाता है; बाकी तैयार छात्रों का Print/PDF खुलता है। Student Master सही करके नया Preview बनाएँ। पुराने Preview का stale पिता-नाम इस्तेमाल नहीं होगा।
9. A4 preview के “Print / Save PDF” से printer या Save as PDF चुनें। 3 cards में सामग्री न समाए तो layout कम cards/page में समायोजित होता है। सही पुराने document का Reprint पुरानी जारी प्रति खोलता है।
10. Marksheet Center में Exam/Class चुनें → विद्यार्थी लोड करें → चयन करें। Complete marksheets का Auto QR होगा; अधूरे marks/attendance का कारण अलग दिखेगा।

QR विकल्प और फीस
- Preview + Auto QR चालू होने पर दस्तावेज़ central registry में जारी होता है; यह केवल देखने का draft नहीं है। बिना issuance देखना हो तो “QR अपने-आप तैयार करें” बंद करें; फिर draft/provisional Preview/Print उपलब्ध है।
- Admin “बकाया सहित • Admin अनुमति” चुनकर due वाले छात्रों को शामिल कर सकता है। Hold शामिल करने का अलग checkbox है। इससे फीस बकाया/ledger नहीं बदलता।
- Parent publication का अलग नियंत्रण जस का तस है।
- किसी वास्तविक missing/duplicate/inactive/session mismatch रिकॉर्ड का नाम अनुमान लगाकर नहीं भरा जाता। कारण दिखाकर बाकी तैयार दस्तावेज़ खुले रहते हैं।

Desktop correction
- Admin school name और address को उचित जगह; buttons compact, एक Menu/Back/Home/Logout set।
- Teacher dashboard arrangement preserved; function खोलने पर compact header और पूरी उपलब्ध width।
- Parent desktop में outer page और portal का double vertical scroll हटाया।
- Greeting IST पर: 05–11 Morning, 12–16 Afternoon, 17–20 Evening, 21–04 Night; midnight और boundary tests शामिल हैं।
- Desktop dashboard खुलते ही Fee Search अपने-आप page नीचे नहीं खींचता। जानबूझकर Fee Counter खोलना / Next Student जैसी actions उपलब्ध हैं।

SQL और बाकी files
इस V390 सुधार के लिए नई SQL नहीं चलानी है। मौजूदा V345 document registry issue/lookup services आवश्यक हैं; उनके बिना fake QR नहीं बनता और कारण दिखता है।
optional_previous_setup केवल पुराने V388 atomic timetable setup के लिए है। पहले लागू है तो दोबारा न चलाएँ। यदि वह सुविधा लगानी हो तभी उसकी README के अनुसार चलाएँ; SQL file 25KB से छोटी है।
support_original में पुराने unmodified paper support scripts हैं; संबंधित file गायब हो तभी copy करें, मौजूद newer version को overwrite न करें।

क्या जाँचा गया
Actual ERP scripts/markup को Chromium में mock Admin/Teacher logins और synthetic school records के साथ चलाया गया। 390/900px पर mobile baseline समान, 901/1024/1366/1920px पर desktop headers/width, Teacher arrangement, Parent scroll और 8 IST clock boundaries जाँचीं।
130 विद्यार्थियों में stale father recovered; वास्तव में एक खाली father को report करके बाकी 129 का Print, फिर master correction पर सभी 130 QR/Print जाँचे। Lost network response पर same request retry से duplicate document नहीं बना। QR pause/resume और Marksheets के complete/incomplete records भी जाँचे। Navigation tests में Menu/Back/Home, repeated login/render, save guard और logout जाँचा।
Live school database/login उपलब्ध नहीं है, इसलिए production deployment या हर ERP module की live verification का दावा नहीं है। साथ दिए QA JSON में scope और परिणाम हैं।
