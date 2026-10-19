LDM V372 — FINAL RECHECKED / अपलोड निर्देश

यह V370 FIXED DOWNLOAD के ऊपर लगाने वाला सुधार पैकेज है। V371 के सभी सुधार भी इसमें शामिल हैं; V371 अलग से upload करने की जरूरत नहीं।

1. पहले SQL_RUN_FIRST/01_PAPER_QUESTION_CAPACITY_SAFE.sql को अपने database के SQL Editor में एक बार चलाएँ। यह 1.6 KB से छोटा सुरक्षित अपडेट है। न कोई record हटता है, न table बदलती है, न permission/audit हटता है। पुरानी 20 खंड और प्रति खंड 100 प्रश्न की validation रोक हटती है। इसे दोबारा चलाना भी सुरक्षित है। Result question_capacity_ready = true आना चाहिए। यह पहले से लागू V362 central service और V364 audit fix के ऊपर चलेगा।

2. ZIP extract करके नीचे दी गई 11 web files उसी ERP root में upload/replace करें जहाँ index.html है। नाम बिल्कुल यही रखें। ZIP खुद upload न करें। नई web file paper-workspace-v371.js भी इसी root में रखें। नया folder नहीं बनाना है।

   index.html
   runtime-v347.js
   dashboard-order-v350.css
   teacher-paper-form-v343.html
   teacher-editor-v350.js
   paper-center-v343.js
   paper-center-v343.css
   paper-import-v369.js
   question-paper-studio-v325.html
   resources-v334.js
   paper-workspace-v371.js

3. मौजूदा paper-import-v369-assets folder और उसकी pdf.mjs / pdf.worker.mjs files रहने दें। बाकी ERP files या data न हटाएँ। SQL_RUN_FIRST folder को website में upload करने की जरूरत नहीं। README/QA/SHA256 केवल जानकारी के लिए हैं।

4. Deploy के बाद app reload करें। Teacher के पुराने session में जरूरत पड़े तो एक बार logout/login करें।

Teacher प्रश्न संपादन:
• खंड के पास और नीचे Add Question; अथवा प्रश्न लिखकर Add Question।
• एक साथ प्रश्न संख्या देकर खाली खंड जोड़ सकते हैं। 100 प्रश्न / 20 खंड की पुरानी रोक हटाई गई है।
• हर प्रश्न पर Delete; आखिरी हटाया प्रश्न या खंड Undo से वापस। बाद में लिखे दूसरे प्रश्न सुरक्षित रहेंगे।
• क्रम बदलने, जोड़ने और हटाने पर क्रमांक अपने आप बदलेंगे। Auto चालू हो तो पूर्णांक भी मिलेंगे; Auto बंद करके अलग अंक रख सकते हैं।
• सभी प्रश्न हटाने पर खाली draft रख सकते हैं; भेजने से पहले प्रश्न भरना जरूरी है। पुराने पेपर को Edit करके Save/Send करें; अलग duplicate paper नहीं बनता।
• खाली उत्तरों की जगह सुरक्षित रहती है; उत्तरमाला गलत प्रश्न से नहीं जुड़ती।
• प्रश्नों की संख्या पर पुरानी गिनती वाली रोक नहीं है। मौजूदा लगभग 2 MB केंद्रीय document सीमा और device memory लागू हैं; बहुत बड़ी file को अलग पेपर में रखें। Browser में allocation से पहले आकार जाँचा जाता है।

Paper headings / 20 वर्ष संग्रह:
• Nursery, LKG, UKG के 20 वर्ष वाले 1,200 model papers और Original Studio में स्कूल, परीक्षा और विद्यार्थी विवरण पहले logical पन्ने पर ही। अगले पन्नों पर प्रश्न जारी।
• Landscape में अलग-अलग पूर्ण पेपर की copies हों तो हर copy के पहले पन्ने पर heading आती है। उसी copy के आगे के पन्नों पर नहीं।
• Portrait, landscape duplex/booklet, black-and-white, default Cambria, 1.0 question line spacing और matching format जारी हैं। Cambria device में न हो तो fallback चलता है; अपनी वैध font file Setup से दे सकते हैं।

V371 सुधार शामिल:
• Laptop admin cards स्पष्ट और responsive; Teacher menu पहले login और navigation पर पूरा।
• Edit / Setup-Import / Preview एक जगह; duplicate controls और बिखरा setup ठीक।
• DOCX numbered questions/options, text PDF, TXT, inert HTML, ERP JSON import; review, backup, Undo और गलत file पर स्पष्ट संदेश। Scan/photo PDF के लिए OCR text आवश्यक है।

जाँच:
पहला दौर: संबंधित code, validation, answer positions, numbering, SQL और resource references।
दूसरा दौर: mobile/laptop/browser, वास्तविक PostgreSQL engine में synthetic records पर Save/Send, Admin edit, retry और audit।
147 JavaScript syntax checks; 118 marks-allocation cases (2,501 प्रश्न तक); 248-question central save/send; एक खंड में 125 प्रश्न SQL submit; 20 से अधिक खंड; Delete/Undo/reorder; बड़े Imports।
20-वर्ष बैंक के 1,200 papers और Studio के 4,320 वर्ष/परीक्षा/कक्षा/विषय/Form combinations; 60 rendered bank layouts। 125-question PDF में सभी प्रश्न एक-एक बार और स्कूल नाम सिर्फ पहले पन्ने पर।
SQL दोबारा लगाने पर stored record ज्यों का त्यों मिला। ZIP CRC, extraction और source hashes जाँचे गए।
ये स्थानीय जाँचें हैं। Live ERP पर यह पैकेज अपने आप deploy नहीं किया गया है।
