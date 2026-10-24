V443 — QR Camera recovery + आसान Admit / Desk / Daily + Exam scanner

किस पर लगाएँ
यह V442 के ऊपर scanner-only update है। पहले के fee / logs fixes इसमें बदले नहीं गए हैं। पुरानी V438/V440 index इसके ऊपर दोबारा न चढ़ाएँ। मौजूदा index.html और attendance-scan-v412.js का backup पहले रखें।

लगाने के तीन चरण
1. Supabase SQL Editor में SQL/01_QR_DAILY_EXAM_V443.sql चलाएँ। यह V440 का वही atomic Daily + Exam scan backend है, mixed approved teacher access सहित। अंत में API schema reload notification जोड़ी है। पहले V440 लगी हो तब भी rerun सुरक्षित है। कोई student/fee/marks/attendance record इस install से मिटता नहीं है।
2. वेबसाइट root में index.html, attendance-scan-v412.js, qr-decode-worker-v443.js और पूरा vendor folder upload करें। SQL और README website पर upload करने की जरूरत नहीं है। Worker और vendor file index के साथ उसी root में दिए स्थान पर रहें।
3. सभी teachers नया page खोलें/refresh करें। QR → Camera शुरू करें → Allow। Camera permission पहले बंद हो तो Chrome site controls → Permissions → Camera → Allow; Android Settings → Apps → Chrome → Permissions → Camera भी Allow करें। App/WhatsApp के अंदर page हो तो ERP सीधे Chrome में खोलें। HTTPS जरूरी है। Browser/phone permission को code जबरन खोल नहीं सकता।

क्या बदला
• Camera permission तुरंत user click से माँगता है; decoder/CDN के पीछे नहीं अटकता।
• Unsupported native QR detector पर अपनी website का jsQR decoder है। Software decoding worker में होती है जहाँ Worker उपलब्ध है; पुराने browser में सीमित resolution वाला local fallback है। कोई QR photo upload नहीं होती।
• QR फोटो चुनें, USB scanner/text, camera selector, उपलब्ध camera पर continuous focus / zoom / torch। Native detection चूकने पर बीच का crop software decoder से भी पढ़ता है। दूर की निश्चित दूरी की गारंटी नहीं; QR पूरा, साफ, पर्याप्त बड़ा और अच्छी रोशनी में होना चाहिए।
• Permission denied / दूसरे app का camera lock / HTTPS या frame-policy block की अलग मदद। Permission popup pending हो तो Camera रद्द करें और बंद करें काम करते हैं; बाद में मिला stream तुरंत बंद होता है।
• लगातार decode calls overlap नहीं होते; एक frame के बाद ही अगला। एक save चल रहा हो तो दूसरा नहीं। एक ही QR रुका रहने पर duplicate write नहीं। Settled closed scanner में कोई camera / decode loop / business polling नहीं।
• Scanner में हर scan पर mobile keyboard अपने आप नहीं खुलेगा। पूरा ERP दोबारा render नहीं करता।
• Teacher permission, missing QR SQL, Desk registration और exam Start setup की errors स्पष्ट। Definitive rejected save पर pending साफ होती है; unknown network failure पर केवल वही UUID वाला manual retry रहता है।

Teachers / Daily / Exam
• Active profile और Active + Approved Teacher Master mapping आवश्यक। Mixed class exam day पर हर approved teacher QR scan कर सकता है। Fee/marks/student edit की सामान्य permissions नहीं बढ़ाई गई हैं।
• Daily-only scan में teacher की assigned class access लागू है। Admit Card वर्तमान issued/active हो। Desk QR उसी registered seating plan का हो; Admin उसी plan का Preview खोलकर registration कर सकता है।
• आज का सही exam timetable, session, class/section और Admin का Start/maximum-marks setup आवश्यक। एक paper हो तो auto; कई हों तो subject चुनकर फिर QR scan। Daily और Exam एक transaction में save होते हैं; एक विफल हो तो दोनों साथ rollback। पहले से Absent/Leave या published attendance हो तो सुधार का कारण माँगता है।
• SQL/02_READ_ONLY_QR_CHECK.sql वैकल्पिक read-only जाँच है। पहले flags true हों। Active Teacher Login और approved Teacher Master links की गिनती अलग हो तो Admin संबंधित account mapping जाँचे। Accounts bulk approve नहीं करता।

जाँच और सीमा
दो rounds में 18 runtime checks पास: open पर no media/DB, camera start/stop, focus/zoom/torch, denied recovery, वास्तविक QR raster को असली jsQR worker से decode, admit/desk save routing, duplicate suppression, teacher denial, late permission cleanup और idle no RPC। Camera और server इन tests में mocks हैं; यह physical phone / live Supabase test नहीं है। Native browser install उपलब्ध नहीं हो पाया, इसलिए full browser rendering का सत्यापन नहीं किया गया। JavaScript syntax और index में केवल scanner cache version बदलने की अलग जाँच हुई। Backend V440 transaction logic अपरिवर्तित है; live installation और approvals की पुष्टि इस package से अपने आप नहीं होती।

Vendor: jsQR 1.4.0; original Apache 2.0 license vendor/jsQR-LICENSE.txt साथ रखें।
