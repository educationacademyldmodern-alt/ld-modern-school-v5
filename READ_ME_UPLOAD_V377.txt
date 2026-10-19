V377 — Parent-style shared role header + stable All Received paper inbox

V375/V376 के ऊपर नीचे की चार files एक साथ ERP root में upload/replace करें:
index.html
dashboard-parent-style-v374.css
paper-center-v343.js
paper-smart-v358.js

पहले इन चारों की backup copies रख लें। नया folder नहीं बनाना। बाकी files रहने दें। नया SQL नहीं है। Upload के बाद laptop पर Ctrl+Shift+R दबाएँ। पुराने V374/V375/V376 index को इसके बाद ऊपर replace न करें।

HEADER:
अब केवल gradient नहीं: Admin और Teacher header में Parent के वही v114PortalHero, v114PortalHeroText, v114PortalHeroStudent और v114StudentBadge के संरचनात्मक हिस्से हैं। बाईं तरफ India समय के अनुसार तारीख, greeting, subtitle और पीला italic motto; दाईं तरफ व्यक्ति का नाम/पहचान, avatar/initials और Profile button है। उपलब्ध सुरक्षित profile image हो तो दिखाई जाती है।
Teacher Profile बटन existing teacher_profile route खोलता है; Admin का existing v97_profile route। नाम/role/विवरण उनके अपने हैं। Parent का student data दूसरे roles में copy नहीं होता। Admin के Academic Analysis और Assign Work functions अपने existing main cards/navigation में रहते हैं।
Desktop cards और font में V376 सुधार शामिल हैं। Sidebar और module grouping अभी भी अपने roles के अनुसार हैं; इसलिए पूरा page screenshot का pixel-for-pixel duplicate नहीं है। Shared header का design और typography Parent reference के अनुसार है।

PAPER INBOX:
V375 summary reset fix और request-race protection शामिल हैं।
एक और UI कारण सुधारा: Admin Inbox खोलते समय पुरानी चुनी session/exam/class scope अपने आप लौट आती थी। अब Admin का पहला view सभी received papers है, सभी sessions सहित। Teacher के private drafts इसमें शामिल नहीं किए गए हैं।
Toolbar में सभी भेजे पेपर / All received button है। इससे exam/class/teacher/search filters साफ करके received inbox खुलता है। Active filter हो तो paper count के पास साफ संकेत दिखता है।
Refresh/वापस आने पर cached snapshot के बजाय मौजूदा list response से summary बनती है। Network failure पर पिछली सूची के साथ error दिखता है; false zero नहीं। बड़े inbox में एक पृष्ठ की bounded read रहती है और शिक्षक cards की partial गिनती labelled रहती है।

SAVE/SEND:
Existing save/submit, idempotent request UUID, retry, revision validation और permission logic नहीं बदले गए। Backend की retained V362 SQL definition में भी submitted paper को सामान्य save पर submitted रखने का नियम मिला। इस package ने SQL नहीं बदला और live database पर इस function की वर्तमान definition नहीं जाँची।

LOCAL VALIDATION:
• 1024/1366/1600px, Admin और Teacher: header के 42 computed style properties Parent reference से मिले; Profile click test पास।
• Inbox के 14 checks पास: पहली entry, refresh, home/reopen, stale replies, failed responses, pagination, 8,000 papers की one-page initial read, account switch, Teacher draft visibility।
• अलग Teacher/Admin sessions और in-memory central RPC model में 7 checks पास: submit→admin, दूसरे session का received paper, submitted paper edit/save, filter clear, reopen, commit के बाद reply खोने पर same-request retry, admin refresh पर दोनों submissions।
• 128 inline script syntax और दोनों paper JavaScript syntax checks पास।
• Parent portal renderer, security client initialization, Teacher module buttons और paper open/save/retry/mutate/close/preview functions पुराने version से byte-identical हैं।

यह production database या user के live laptop session का परीक्षण नहीं है। Live deployment नहीं बदला गया। Local fixtures/central model tests को live database confirmation न समझें।

ROLLBACK:
चारों backup files साथ वापस रखें; database rollback की जरूरत नहीं।
