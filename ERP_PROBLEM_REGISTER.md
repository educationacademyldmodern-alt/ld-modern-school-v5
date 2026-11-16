# ERP Problem Register — V524 targeted candidate

Source SHA-256: `26b461c4d62493eada8e9fb8ca971ab28e54e0166925936ce4ed767382746cbc`

यह पूरे ERP का सत्यापित अंतिम सुधार नहीं है। सभी 16 requirements नीचे trace की गई हैं। पूर्ण मूल आवश्यकताएँ `ERP_PROBLEM_REGISTER_ORIGINAL.md` में सुरक्षित हैं।

| ID | क्षेत्र | वास्तविक बदलाव | स्थिति |
|---|---|---|---|
| ERP-01 | Due Fee Print/PDF | सक्रिय shared print binding गलत पुराने ID को खोज रहा था। वर्तमान v261DuePrintable से जोड़ा; landscape. | Code corrected; browser/live NOT VERIFIED |
| ERP-02 | Global output / stale preview | Class/exam बदलने पर पुराने marksheet output और generation token साफ; current due report global picker में. | PARTIAL; all-module PDF pagination NOT VERIFIED |
| ERP-03 | Pending approval | Summary card सीधे existing master_requests खोलता है; Pending default और existing approve/reject बने हैं. | Code corrected; live decisions/count sync NOT VERIFIED |
| ERP-04 | Master reports | नौ cards सुरक्षित; central report registry, paginated reads, class और व्यक्ति/ID search, shared A4; report audit call सुरक्षित. | PARTIAL; schema/live values and all filters NOT VERIFIED |
| ERP-05 | Notification bell | Panel header से बाहर fixed, viewport-clamped; resize/scroll positioning और Escape close. | Layout code corrected; notification counts/device test NOT VERIFIED |
| ERP-06 | Refresh messages | Routine success notify call हटाया; failure और unsaved-data confirmation सुरक्षित. | PARTIAL; other notification producers/navigation regression NOT VERIFIED |
| ERP-07 | Routine save popups | Due row save अब inline error और silent success; duplicate per-row submit blocked. | PARTIAL; attendance/OMR/all save paths unchanged |
| ERP-08 | Server/performance | Reported undefined key exception fixed; fee save no full-list reload; one readback per current month; QR sequential visible-row work. | PARTIAL; live RPC/RLS/log metrics/20-teacher load NOT VERIFIED |
| ERP-09 | Academic Monitoring | मौजूदा Management card छिपाने वाला code हटाया; existing handler/data source सुरक्षित. | PARTIAL; underlying module failure not reproduced live |
| ERP-10 | Central Assign Work | Default central tasks tab; old/access tabs सुरक्षित. | PARTIAL; backend assignment systems not merged; cross-entry parity NOT VERIFIED |
| ERP-11 | Eligible assignees | Viewer/admin/super_admin और inactive roles selector में नहीं; teacher/staff/accounts/admission/transport/librarian allowed. Users/grants unchanged. | PARTIAL; server authorization and staff eligibility live NOT VERIFIED |
| ERP-12 | Teacher count/detail | Counter teacher_profiles से था, link staff खोलता था। अब उसी approved-active criterion का teacher register, search/sort/filtered A4; Staff Database button सुरक्षित. | Code corrected; actual 12 records/RLS NOT VERIFIED |
| ERP-13 | Same-row due save | Selected inputs before await; row-only disable; identity check; existing writer; single-student readback; current total/summary updated without re-render. | Mock PASS; real ledger/partial-write recovery NOT VERIFIED |
| ERP-14 | QR/storage | Visible QR auto-load, bounded sequential requests, inline failures, print image validation, regenerated token repaint. | PARTIAL; Storage cleanup/usage unchanged and NOT VERIFIED |
| ERP-15 | Desktop/layout | Bell panel no longer participates in header flex/grid; original academic card remains. | PARTIAL; universal-card/header/menu responsive tests NOT VERIFIED |
| ERP-16 | Universal QR/A4 | Existing central token RPC reused, no print-time regeneration; multi-class/search; 4/10/20/30/40/custom1–100, portrait/landscape, two compact label lines. | Digital QR decode PASS; actual print/label layout/camera/distance and cross-module permissions NOT VERIFIED |

## V524 में अतिरिक्त वास्तविक सुधार

- ERP-04: नए report load पर पिछले request को AbortSignal से cancel; stale account/response से UI या audit नहीं। दो controlled tests Pass.
- ERP-09: शिक्षक A फिर B चुनने पर A का देर से response B के academic data को overwrite करता था। Revision/account/route guard अब data commit से पहले है। Reload failure पर inline Retry; दो controlled tests Pass. Card-to-module browser acceptance Not Verified.
- ERP-13: V522 account/session guards, runtime write lock और invalid monthly fee validation सुरक्षित हैं; सात V522 regression tests फिर Pass. Atomic database transaction Not Verified.
- ERP-14: QR token/library wait अब 15 seconds पर recoverable failure; supported RPC reads aborted, auto-retry नहीं। Storage late response अगली route को replace नहीं करता। Inventory category/orphan values अब स्पष्ट रूप से अधिकतम 500 listed files के हैं; global summary अलग है। तीन controlled tests Pass. Storage cleanup transaction/permissions Not Verified.
- ERP-07/08: exam-central-v320.js active save path source inspection में inline status, request ID, retry और server confirmation पहले से मौजूद हैं; इसे बदला नहीं। Real server/concurrency Not Verified.

## पूरी मूल आवश्यकताएँ

नीचे मूल register के reported symptoms/acceptance criteria संदर्भ के लिए हैं। पुराने diagnosis और “सुधार नहीं” शब्द ऐतिहासिक हैं; ऊपर की V524 स्थिति वर्तमान है।

## विस्तार: प्रभावित मॉड्यूल, अपेक्षा और स्वीकृति

### ERP-01 — Central Current Due Fee Report: Print / PDF निष्क्रिय
**प्रभावित मॉड्यूल:** Central Current Due Fee Report (उदाहरण: Nursery)।  
**देखी गई समस्या:** रिपोर्ट का डेटा आता है, लेकिन `Print / PDF` क्लिक पर Preview, Print Dialog या अन्य अपेक्षित प्रतिक्रिया नहीं होती।  
**अपेक्षित सुधार:** मौजूदा रिपोर्ट का सही डेटा लेकर A4 Preview, Save as PDF/Download और Print उपलब्ध हों।  
**स्वीकृति:** रिपोर्ट लोड → Print/PDF क्लिक → सही A4 प्रिंट-योग्य रिपोर्ट/प्रिंट विकल्प; डेटा और फिल्टर सुरक्षित; खाली/निष्क्रिय बटन नहीं।  
**संभावित कारण (पुराने V504 Source में):** अंतिम सक्रिय Print handler अलग `window.open()` विंडो पर निर्भर है। Browser में popup रोकने पर Print शुरू नहीं होता। यह वास्तविक user device पर root-cause proof नहीं है। **Candidate समाधान:** वही रिपोर्ट वर्तमान पेज पर अस्थायी A4 landscape print view से `window.print()` द्वारा print हो; `Print → Save as PDF` उपलब्ध हो। **स्थिति:** V504 static patch; production Not Verified.

### ERP-02 — Global A4 Preview / PDF / Print
**प्रभावित मॉड्यूल:** जहाँ भी पहले से Preview/Print/PDF उपलब्ध है—Marksheet, Admit Card, Fees, Receipts, Reports, Certificates, ID Cards और अन्य संबंधित दस्तावेज़।  
**देखी गई समस्या:** अलग-अलग जगह Preview/PDF/Print में खराबी की शिकायत; Global Toolbar में दस्तावेज़ खुला न होने का संदेश भी देखा गया।  
**अपेक्षित सुधार:** प्रत्येक संबंधित दस्तावेज़ का सही, वर्तमान, अलग-थलग Preview; एक रिपोर्ट के नीचे पिछली रिपोर्ट का Preview न रहे; A4 पर सटीक margin, page break, header, page numbering (जहाँ लागू), PDF और Print।  
**स्वीकृति:** प्रत्येक प्रभावित मॉड्यूल में फ़िल्टर/कक्षा चुनें → Preview → Download PDF → Print; लंबी सूची पर सही pagination; mobile/laptop/desktop पर अपेक्षित संचालन।  
**सीमा:** Preview के लिए आवश्यक Print Dialog को अनावश्यक Popup समझकर बंद न करें।  
**रूट-कॉज़:** Not Verified.

### ERP-03 — Pending Requests: Direct Approval / Reject
**प्रभावित मॉड्यूल:** Admin Dashboard का `Pending Requests` कार्ड और Approval Center।  
**देखी गई समस्या:** लंबित अनुरोध पर निर्णय लेने के लिए अलग स्क्रीन और अधिक Scroll करना पड़ता है।  
**अपेक्षित सुधार:** कार्ड क्लिक → संबंधित Pending Requests सीधे ऊपर दिखें → प्रत्येक के सामने अधिकृत Admin के लिए Approve/Reject विकल्प; निर्णय के बाद अनुरोध की स्थिति और कार्ड Count अपडेट।  
**स्वीकृति:** Dashboard के कार्ड से लंबित अनुरोध पर बिना लंबे स्क्रॉल पहुँचना, सही कार्रवाई, सही Count, permission सुरक्षित।  
**रूट-कॉज़:** Not Verified.

### ERP-04 — Master Official Reports: एक Central Report Hub
**प्रभावित मॉड्यूल:** Dashboard `Generate Report` → Master Official Reports।  
**वर्तमान कार्ड:** Daily Fee Collection; Due Fee Report; Student Attendance; Teacher/Staff Attendance; Admission Register; Teacher/Staff Register; Income Report; Expense Report; Daily Teaching Update।  
**अपेक्षित सुधार:** प्रत्येक मौजूदा रिपोर्ट कार्ड सही खुलकर वास्तविक ERP डेटा दिखाए; मौजूदा अन्य संबंधित ERP रिपोर्टों के लिए भी इसी हब से प्रवेश उपलब्ध हो, बिना डुप्लिकेट डेटा स्टोर/रिपोर्ट लॉजिक बनाए।  
**फ़िल्टर:** All Classes, चुनी गई Class/Section, एक Student, एक Teacher, All Teachers, Date/Month/Academic Session और संबंधित Report Type—केवल जहाँ ये वास्तव में लागू हों।  
**आउटपुट:** एक कक्षा या शिक्षक की अलग रिपोर्ट समेत A4 Preview, PDF और Print; बिना अनावश्यक खाली पेज/पुराने Preview।  
**स्वीकृति:** रिपोर्ट प्रकार + उपयुक्त फ़िल्टर → वही रिकॉर्ड → सही total/column → A4 Preview → PDF/Print; अन्य रिपोर्ट और permissions सुरक्षित।  
**रूट-कॉज़:** Not Verified.

### ERP-05 — Global Notification Bell
**प्रभावित मॉड्यूल:** Header में Bell तथा Notification Panel, सभी संबंधित Admin पेज।  
**देखी गई समस्या:** Bell खोलते ही लंबा/संकरी जगह वाला Panel बाईं ओर खुलता है, Header असामान्य ऊँचा होकर दूसरे controls खिसकाता है।  
**अपेक्षित सुधार:** Bell के पास छोटा, viewport के भीतर, Scrollable और बंद हो सकने वाला Panel; वास्तविक एवं अधिकृत notifications, सही Count, संबंधित रिकॉर्ड/मॉड्यूल तक Direct Navigation।  
**स्वीकृति:** Bell click → स्थिर Header → सूचना देखें/खोलें → संबंधित रिकॉर्ड पहुँचे → बाहर क्लिक/Close से पैनल बंद; गलत count या layout overlap न हो।  
**रूट-कॉज़:** Not Verified.

### ERP-06 — Refresh पर Duplicate Success Banners
**प्रभावित मॉड्यूल:** Admin Dashboard और जहाँ भी एक जैसी समस्या वाला Refresh है।  
**देखी गई समस्या:** `✓ dashboard • डेटा अपडेट किया गया` जैसे दो समान status banners, जो कंटेंट को नीचे धकेलते हैं।  
**अपेक्षित सुधार:** Routine Refresh पर Silent Data Refresh; Duplicate Success Notice न आए; पेज, Header, Cards, Position और Navigation सुरक्षित रहें; अनावश्यक repeated requests न हों।  
**स्वीकृति:** Refresh → वर्तमान पेज पर नया डेटा, कोई डुप्लिकेट संदेश या Jump नहीं।  
**रूट-कॉज़:** Not Verified.

### ERP-07 — सामान्य ERP कार्यों पर अनावश्यक Popup हटाना
**प्रभावित मॉड्यूल:** Student Attendance, Exam Marks Entry/Edit/Save All, QR/OMR Scan, Fee Payment/Update, Student/Teacher Records, Routine Auto-Save/Refresh।  
**देखी गई समस्या:** सामान्य डेटा सेव/अपडेट पर अनावश्यक Popup, Alert, Toast या दोहराए Success Banner।  
**अपेक्षित सुधार:** सफल Routine Action में बाधारहित काम; डेटा वास्तविक रूप में सुरक्षित; Save failure/validation के लिए संबंधित field/row के पास संक्षिप्त Inline Error तथा Retry; स्क्रीन Jump/Freeze नहीं।  
**स्वीकृति:** Save/Update/Scan → सफल वास्तविक डेटा बदलाव → कोई बाधक Popup नहीं; असफलता पर स्पष्ट Inline Status; जरूरी सुरक्षा confirmation तथा Print Dialog सुरक्षित।  
**रूट-कॉज़:** Not Verified.

### ERP-08 — Server Stability और Low Log Ingestion
**प्रभावित मॉड्यूल:** Supabase Backend, Data Access/RPC, Attendance, Marks, Fees, Scanning, Report/Preview, सभी संबंधित calls।  
**देखी गई समस्या:** कभी Save चलता है, कभी Server Error; repeated API, long Loading, बढ़ता Log Ingestion, Preview/Rendering की Performance शिकायत।  
**अपेक्षित सुधार:** समस्या-आधारित API/request/subscription/render analysis; सुरक्षित request deduplication, timeout/error handling, loading-state recovery, आवश्यक DB/index/RPC optimizations; data integrity और RLS/roles सुरक्षित।  
**लोड लक्ष्य:** लगभग 20 शिक्षकों के एक साथ महत्वपूर्ण Save/Edit कार्यों का परीक्षण जहाँ test infrastructure उपलब्ध हो।  
**स्वीकृति:** कोई अनियंत्रित retry-loop नहीं; failed requests recoverable; डेटा न गायब/duplicate हो; request/log metrics में सत्यापित सुधार; concurrency test परिणाम दर्ज।  
**सीमा:** शाब्दिक शून्य Logs या बिना load test के 20 teachers के लिए गारंटी नहीं; जरूरी security/error/audit logs बंद न हों।  
**रूट-कॉज़:** Not Verified.

### ERP-09 — Academic Monitoring Card
**प्रभावित मॉड्यूल:** Admin Dashboard → Management Center → `Academic Monitoring` (`Teaching • Copy Check • Bell Tests`)।  
**देखी गई समस्या:** कार्ड क्लिक करने पर अपेक्षित मॉड्यूल नहीं खुलता।  
**अपेक्षित सुधार:** मौजूदा Intended Module तक सही route/event handler; उपलब्ध teaching monitoring, copy check और bell-test कार्य व डेटा अपनी मौजूदा वास्तविक क्षमता के अनुसार खुलें।  
**स्वीकृति:** कार्ड → मॉड्यूल → मौजूदा कार्य → Back/Home; क्लिक निष्क्रिय न हो, अन्य कार्ड सुरक्षित।  
**सीमा:** असंबंधित नया academic feature कल्पना से न बनाया जाए।  
**रूट-कॉज़:** Not Verified.

### ERP-10 — एक Central Assign Work / Work Delegation
**प्रभावित मॉड्यूल:** Universal ERP Control Center → `Admin Work`; Admin Dashboard → `Assign Work`; School Control Center → `Assistant / Work Delegation`।  
**देखी गई समस्या:** एक ही कार्य के लिए कई entry points और अलग-अलग कार्यप्रणाली का जोखिम।  
**अपेक्षित सुधार:** मौजूदा तीनों कार्ड सुरक्षित रखकर एक ही Central Assignment Module/Source of Truth से जोड़ना; teacher/work/permissions/progress एक जगह; Class/Subject/Exam Scope का मान्य निर्धारण।  
**स्वीकृति:** तीनों links एक ही केंद्रीय कार्यप्रणाली खोलें; assign/edit/progress सभी जगह समान; शिक्षक केवल अधिकृत कार्य करें।  
**रूट-कॉज़:** Not Verified.

### ERP-11 — Assign Work में पात्र व्यक्ति और One Function = One Central System
**प्रभावित मॉड्यूल:** Assign Work → कर्मचारी/व्यक्ति चयन Dropdown; duplicate-function entry points।  
**देखी गई समस्या:** Teacher के साथ अन्य viewer/super_admin और email-जैसे user accounts भी assignment list में दिखाई देते हैं; मोबाइल selector बहुत बड़ा है।  
**अपेक्षित सुधार:** वास्तव में पात्र Teacher/Staff को आसानी से खोज/चुन सकें; अनुपयुक्त role/accounts केवल उस सूची से हटें, database से delete या role change न हों; पढ़ने योग्य Name + Role; प्रत्येक दोहराए ERP कार्य का एक केंद्रीय backend/source, पुराने कार्ड shortcut के रूप में रहें।  
**स्वीकृति:** सही पात्र व्यक्ति, Search और Select; viewer/अनधिकृत account पर गलत delegation न हो; दूसरे मॉड्यूल सुरक्षित।  
**रूट-कॉज़:** Not Verified.

### ERP-12 — Total Teachers से Staff Database का खाली डेटा
**प्रभावित मॉड्यूल:** Dashboard `Total Teachers` Card और Staff Database।  
**देखी गई समस्या:** Dashboard में 12 Teachers का Counter दिखाई देता है, लेकिन खुलने वाले Staff Database में Headers के नीचे records नहीं दिखते।  
**अपेक्षित सुधार:** data fetch/filter/RLS/role mapping की जाँच कर वास्तविक अधिकृत records दिखें; Teacher Count और Staff/Teacher category के अर्थ सही मिलें; Search/Sort/Details/Excel मौजूदा रूप में कार्यरत रहें; संबंधित Teacher/All Teachers का A4 Preview/PDF/Print।  
**स्वीकृति:** Card → सही records → Search → एक Teacher या All Teachers → Preview/PDF/Print; डेटा अनुपलब्ध/त्रुटि को स्पष्ट रूप से दर्शाना।  
**रूट-कॉज़:** Not Verified.

### ERP-13 — Master Due Fee Update: Same-Row Save
**प्रभावित मॉड्यूल:** Master Due Fee Update, Class/Month selector, student fee table/ledger।  
**देखी गई समस्या:** फीस Update के बाद Duplicate `Central due updated` banners, view jump, list/rows का क्षणिक गायब होना या selection खोना।  
**अपेक्षित सुधार:** Student Row पर Save के बाद वहीं बने रहें; Class, Due Till Month, Search Filter, Vertical/Horizontal Scroll और focus न खोएँ; उसी Row में नया due/status दिखे; Popup नहीं; failed Save पर inline error।  
**सुरक्षा:** Payment History, Receipt, Ledger, Monthly Fee और balances सही रहें; पुराने भुगतान न बदलें।  
**स्वीकृति:** किसी एक विद्यार्थी का Update → Save → उसी Row में सही डेटा → बिना Scroll Jump/Popup/Blank Screen; ledger integrity verified।  
**रूट-कॉज़:** Not Verified.

### ERP-14 — QR / Storage Quick Access तथा Student QR Center
**प्रभावित मॉड्यूल:** Dashboard के `QR Gate & Presence`, `Admin QR Scanner`, `Student QR Center`, `Storage Center` कार्ड।  
**देखी गई समस्या:** QR Center में एक विद्यार्थी का QR दिखता है, अन्य स्थानों पर QR खाली दिख रहे हैं; सभी जुड़े हुए कार्ड/कार्य सही चलने चाहिए।  
**अपेक्षित सुधार:** सभी चार कार्ड सही route खोलें; प्रत्येक Student का सही Central QR View/Generate/Print/Regenerate; Search/Class Filter; Gate/Entry/Exit/Presence तथा Scanner सही विद्यार्थी पर कार्य करे; Storage Usage सही और Cleanup सुरक्षित।  
**स्वीकृति:** प्रत्येक कार्ड → संबंधित कार्य सफल; QR data और scan पहचान सुसंगत; Print/PDF सही; केवल अधिकृत regeneration; महत्वपूर्ण files/records अनजाने में delete नहीं।  
**नोट:** खाली QR area का कारण lazy loading या generation भी हो सकता है; जाँच से पहले कारण निर्धारित नहीं।  
**रूट-कॉज़:** Not Verified.

### ERP-15 — Laptop/Desktop Admin Layout, Header और Menu
**प्रभावित मॉड्यूल:** Admin Pages, Dashboard, Global Header, Menu/Submenu, Universal ERP Card, Navigation।  
**देखी गई समस्या:** Mobile पर Layout अधिकांशतः सही है; Laptop/Desktop पर Header, Menu, Cards और responsive sizing/position की जाँच व सुधार अपेक्षित।  
**अपेक्षित सुधार:** School Name एक बार; Home/Back/Refresh/Lock/Bell/Menu सही; sticky Header दूसरों को न ढके; कार्ड overlapping/oversized न हों; सही spacing, widths और desktop navigation; tablet/iPad भी काम करे।  
**स्वीकृति:** Mobile design बना रहे; Tablet, Laptop और Desktop पर scroll, route, menu, header, cards का responsive/regression test; कोई card हटे नहीं।  
**रूट-कॉज़:** Not Verified.

### ERP-16 — Central Universal QR Scanner और Custom A4 Print
**प्रभावित मॉड्यूल:** Student QR Center, Admin/Teacher Scanners, Attendance, Transport, Exam और Gate modules; A4 QR Sheet generator।  
**उपयोगकर्ता द्वारा स्वीकृत डिजाइन:** एक A4 पेज पर **10, 20, 30, 40 अथवा custom** संख्या में विद्यार्थियों के QR छोटे grid में; 4-per-page विकल्प भी उपयोगी है। `Portrait` / `Landscape` और आकार/गणना समायोजन।  
**हर QR के ठीक नीचे:** अलग बड़े कार्ड नहीं; केवल **1 या अधिकतम 2 compact lines** में (1) विद्यार्थी का नाम, (2) कक्षा, (3) पिता का नाम—जैसे `राहुल कुमार | कक्षा 5` / `पिता: रमेश कुमार`।  
**फ़ंक्शन:** एक Class, कई Classes या All Classes चुनें; Preview → A4 PDF → Print; अलग-अलग पेजों में उचित pagination; कोई नाम/Code कटे या overlapping न हों।  
**एक Code, कई संदर्भ:** समान स्थिर सुरक्षित Student QR Identifier का Admin और अधिकृत Teacher द्वारा Attendance, Transport, Exam/Gate में प्रयोग; Scan event के संदर्भ और role/class permissions के अनुसार सुरक्षित कार्रवाई।  
**Fast Scan:** high contrast (काला/सफेद), quiet zone, उचित QR version/payload length/error correction, 300 DPI या बेहतर प्रिंट; camera auto-focus/continuous scanning, debounce, duplicate protection, बिना बाधक popup अगले Scan के लिए तैयार।  
**दीर्घकालिक स्थायित्व:** सामान्य Print/Reprint पर QR बदले या expire न हो; उचित प्रशासनिक कारण से ही नियंत्रित Regenerate/Revoke; व्यक्तिगत जानकारी QR payload में सीधे embed न करना।  
**स्वीकृति:** 10/20/30/40/Custom A4 print + 1–2 लाइन label → वास्तविक QR Decode → विद्यार्थी सही match → Admin/Teacher (अधिकृत) से संबंधित कार्य सही दर्ज; कई लगातार Scan; printer/camera/distance पर वास्तविक परीक्षण।  
**तकनीकी सीमा:** एक A4 पर 40 छोटे QRs, 10 बड़े QRs जितनी दूर से नहीं पढ़े जा सकते। वास्तविक दूरी camera, प्रकाश, Code size और printed sharpness पर निर्भर है; बिना परीक्षण दूर से स्कैन की गारंटी नहीं।  
**स्थिति:** Demo Design पसंद/स्वीकृत; ERP integration और actual source-code tests **Not Verified**।

---



## V524 — वर्तमान अतिरिक्त निष्कर्ष

ERP-04: रिपोर्ट UI में केवल संबंधित date/class/identity filters दिखते हैं; exact admission_no, employee_id, teacher_name और supported section/session filters query में लागू होते हैं। Students/Due का चुना session load के दौरान capture होता है। Invalid date range और cancelled requests reader में भी reject होते हैं।
ERP-06: Refresh के await के बाद route/account बदला हो तो पुराने filters/scroll नए पेज पर नहीं लगते; final button recovery सुरक्षित।
ERP-10: source trace में Universal Admin Work (ldm-premium-v500.js), Dashboard Assign Work (controls-v323.js) और School Control Work (school-control-v405.js) सभी work_delegation route खोलते हैं। Backend models का consolidation तथा permissions/progress parity अभी Not Verified; blind migration नहीं।
ERP-14/16: Student QR roster में hard limit(3000) था; अब stable ID tie-breaker के साथ paginated reads, हर page पर existing teacher class scope, cancellation check और incomplete response error हैं। 100,000-row safety cap पर explicit error; truncated sheet को complete नहीं बताया जाएगा।

आठ नए assertions/scenarios Pass: चार report query filter cases, date/cancel rejection, refresh route-change recovery, QR pagination/scope और cancelled QR reads. Test sources/evidence tests/filters524.json, tests/qr_roster524.json में हैं। पिछली आवश्यक जाँच फिर की गई: syntax 138/0 errors; fee/report regression और V522 route/account tests Pass.

### शेष वास्तविक blockers
- Browser/device और print acceptance: environment Chromium socket startup blocked; usable staging URL/browser चाहिए।
- Fee transaction atomicity, Storage check/delete race, assignment models/security and live RPC/RLS: connected project/schema तथा authorized staging fixtures चाहिए। Current Supabase project list खाली मिली थी।
- Broad routine save/scan popup removal, full report parity, responsive/print regression और actual concurrent users: अभी पूर्ण नहीं। Source changes alone पर्याप्त proof नहीं।

इन blockers के कारण सभी 16 issues fixed या production-ready का दावा नहीं। यह cumulative candidate original ZIP पर लागू है।


## V525 latest: user screenshots/search/scroll
- New search reset button on explicit ERP search field allowlist; clears/focuses search only and dispatches one input event, keeps class/filter and record-edit fields. No backend request handler replaced. Disabled fields remain protected.
- Marksheet search now shows inline loading/errors; late old query cannot overwrite latest query. Clearing search invalidates pending student-load token.
- Screen-only table-wrapper horizontal/vertical overflow and keyboard focus support; marksheet preview horizontal overflow retained; print hides new search buttons. Does not load additional rows in unrelated paginated modules.
- Literal ${E(API.termNames...)} was inside a single-quoted string nested in a template; now interpolated correctly.
- Admin document load/build uses “लोड हो रहा है…”; locked error path no longer also toasts. Existing issue/revoke safeguards retained. Other legacy print/issue flows and duplicate controls are not fully consolidated in this release.
- Four controlled checks pass: clear/disabled/non-edit-field behavior; real term template; inline failure/control recovery; late search race. Syntax evidence updated. Actual scrolling/touch/layout, server timeout and whole ERP coverage are NOT VERIFIED. No claim that all screenshots/issues are fully resolved.
