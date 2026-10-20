LDM V389 — Admit Card / Marksheet Admin selection + complete Print/PDF correction

यह पिछले V388 सुधार सहित cumulative replacement-files ZIP है। V388 की दूसरी ZIP अलग से लगाने की जरूरत नहीं।
यह मौजूदा working ERP को update करता है; standalone नई ERP installation नहीं है। बाकी modules/assets नहीं हटाने हैं।

लगाने के चरण
1. मौजूदा files का backup लें और खुले काम Save करें।
2. ZIP के root में दी गई इन 17 code files को ERP root में एक साथ upload/replace करें:
   index.html
   runtime-v347.js
   dashboard-order-v350.js
   desktop-premium-v378.js
   desktop-premium-v378.css
   paper-premium-v381.js
   teacher-paper-form-v343.html
   smart-work-v333.js
   admin-documents-v389.js
   admit-layout-v339.js
   admit-layout-v339.css
   a4-print-v337.js
   a4-preview-v337.js
   a4-preview-v337.html
   documents-v345.js
   marksheet-core.js
   marksheet-core.css
3. Browser hard refresh करें / नया Incognito tab खोलें। बदली print/document files के URL versions 389 हैं।
QA JSON और यह README website पर upload करने की जरूरत नहीं।
इन Admit/Marksheet सुधारों के लिए नई SQL नहीं है; मौजूदा V345 QR issue/lookup registry services उपयोग होती हैं।
optional_previous_setup में केवल पिछली V388 timetable SQL है। V388 में नहीं चलाई थी और atomic timetable सुविधा चाहिए तभी चलाएँ। वह 25 KB से छोटी है।
support_original में पुराने unmodified paper support scripts हैं; ERP root में संबंधित file गायब हो तभी copy करें, मौजूद newer file overwrite न करें।

Admit Card — Admin कैसे उपयोग करें
Exam & Admit Card Center → Exam चुनें → ऊपर Classes चुनें → Students/Refresh.
Smart Admit Card card में नया “Admin • चुने हुए Admit Cards” भाग मिलेगा।
- “केवल फीस-साफ” या “बकाया सहित • Admin अनुमति” चुनें।
- एक छात्र tick करें, दिख रहे सभी चुनें या पूरी चुनी Class चुनें। कई Exam Classes भी चुनी जा सकती हैं।
- Explicit Admin Hold वाले भी चाहिए तो अलग “Admin Hold वाले भी शामिल करें” tick करें। Hold रिकॉर्ड अपने-आप हटाया नहीं जाता।
- चुने Preview बनाएँ → देखकर “Preview जाँचकर जारी करें + QR” → चुने Print / Save PDF.
- Print/PDF बटन A4 preview खोलता है। उसके अंदर Print / Save PDF से printer या Save as PDF चुनें।
- “जारी प्रति / Reprint PDF” पुरानी जारी central snapshot खोलता है; नया document number नहीं बनाता।
पुराने automatic फीस-साफ New Batch / Reprint / Finish विकल्प बने हैं। नया चयन Preview और पुराने batch की स्थिति अलग सँभाली जाती है।
नई QR issuance की संख्या उसके status और QR registry में दिखती है; यह पुराने automatic batch का Finish नहीं करती।

Marksheet — Admin कैसे उपयोग करें
Marksheet Center → Exam नाम और Class चुनें → “Class के विद्यार्थी लोड करें”.
फीस विकल्प चुनें → एक / चुने हुए / पूरी Class चुनें → Preview → जाँचकर QR जारी करें → Print / Save PDF.
पुराना single-student Search/Edit और Generate Class काम भी बने हैं।
फीस बाकी होने से Admin की चुनी Preview/Print/Issue नहीं रुकती जब “बकाया सहित” चुना हो।
अधूरे अंक, असत्यापित exam attendance या जरूरी result rules का मुद्दा अलग है; ऐसी Marksheet draft Preview बन सकती है, final issue से पहले उन्हें पूरा करें।
यह फीचर फीस माफ/paid दर्ज नहीं करता और Parent के लिए result/admit publication अपने-आप नहीं बदलता।

Admit का कटना और Print बंद होना
- Footer, QR, document number और दोनों signatures के लिए card के अंदर जगह रखी है।
- नाम/पिता/कक्षा की font inheritance सुधारी है; चुने text को छोटे पुराने CSS नियम नहीं दबाते।
- सामान्य 8-paper sample में 10pt पर तीन पूरे cards एक A4 पर जाँचे गए।
- 8/10/12 पेपर, चारों designs, 8.5pt और 10pt पर सभी 24 print cases पास हुए।
- Content बड़ा हो तो A4 Preview अपने-आप 3 से 2 या 1 card/page करता है और कारण दिखाता है। अक्षर चुपके से छोटे नहीं किए जाते।
- पिता का नाम/समय-सारणी जैसी जरूरी जानकारी गलत/गायब हो तो स्पष्ट त्रुटि रहती है; उसे छुपाकर print नहीं किया जाता।
- Printer paper A4, Scale 100%, headers/footers off रखें। Preview में दिखी cards/page संख्या ही print होगी।

सुरक्षा / स्थिति
- Default फीस-साफ विकल्प में Preview/Issue से पहले फीस फिर सत्यापित होती है।
- बिना Hold अनुमति के चुने Admit की latest Hold स्थिति फिर देखी जाती है।
- Issue के समय दूसरे actions रोके जाते हैं। Response खोने पर उसी Preview पर Issue Retry करें; वही request key रहती है।
- कई दस्तावेज़ों में कुछ सफल और बाद में error आए तो सफल संख्या दिखाई जाती है; पूरी batch सफल होने का झूठा संदेश नहीं दिया जाता।
- गलत selection / Exam / Class बदलने पर पुराना Preview final issue के लिए उपयोग नहीं होता।

सत्यापन
Original ERP HTML और scripts Chromium में mock account/data के साथ चलाए गए:
- एक / selected / class selection, फीस-साफ / due / Hold विकल्प;
- due Admit व complete due Marksheet Preview, QR issue, Reprint, Print/PDF;
- lost-response Retry, missing identity, incomplete marks और Teacher access rejection;
- फीस ledger / payments / Parent publication में कोई बदलाव नहीं;
- Admit का actual A4 PDF: 3 पूरे cards, नीचे signatures सुरक्षित;
- issued Marksheet actual A4 PDF: 2 छात्रों की 2 pages, QR और signatures सहित;
- 24 Admit layout cases, automatic 2-card और long-content 1-card fallback;
- 390/900/901/1024/1366/1920 widths पर dashboard/navigation regression, Back/Home/Menu/Login/Logout;
- पुराने V388 Dashboard, Teacher/mobile styling, keyboard और paper files byte-identical रखे हैं।
JSON reports और SHA256 hashes ZIP में हैं। Browser screenshots/PDF test samples deliverable में शामिल नहीं हैं।

सीमा
यह local/browser verification है। Live school database, वास्तविक account/RLS permissions और printer hardware पर test नहीं किया गया है।
