LDM V375 — Admin Teacher Paper Inbox fix + Parent-style dashboards

V373/V374 ERP root पर लगाएँ। पहले मौजूदा files का backup लें। केवल ये चार files उसी root folder में साथ upload/replace करें जहाँ index.html है:

index.html
dashboard-parent-style-v374.css
paper-center-v343.js
paper-smart-v358.js

बाकी ERP files रहने दें। नया folder बनाकर upload न करें। नया SQL नहीं है। Browser hard refresh करें; जरूरत पर एक बार logout/login करें। V374 Parent-style dashboard CSS और Security Step 1 index सुधार शामिल हैं। पुराना security index बाद में इसके ऊपर replace न करें।

मिला कारण:
Admin summary में परीक्षा/कक्षा खाली होने पर ensure(false) पहले से पुष्ट teacher cards और counts को reset करके — दिखा देता था। Status/Refresh से 1 दिखने के बाद अगली list update पर फिर खाली होने का code path मौजूद था।

सुधार:
• Admin summary अब दिखाई दे रही केंद्रीय Inbox page के उसी verified response से बनती है। सामान्य open/refresh पर पूरी database सूची की दूसरी scan नहीं होती।
• बड़े inbox में कुल paper count केंद्रीय result से; शिक्षक cards वर्तमान page के होते हैं। पूरे school का teacher count होने का गलत दावा नहीं: इस पृष्ठ के शिक्षक लिखा है। बाकी papers नीचे Next से मिलेंगे।
• सभी सत्र, परीक्षा/कक्षा filters और account बदलने पर summary scope सही reset होता है। My papers / Recycle Bin को received inbox नहीं माना जाता।
• खराब/अधूरे response को false zero नहीं दिखाया जाता। Network error पर पिछली सूची रहती है और refresh error स्पष्ट दिखता है।
• देर से आने वाला पुराना list response नए filter result को नहीं बदलता।
• दूसरी tab से लौटने पर visible paper list एक बार refresh होती है। Editor या Save/Send/Retry के बीच refresh नहीं होती। कोई नया polling interval नहीं जोड़ा गया।

Code recheck:
128 inline scripts और दोनों बदली JS files की syntax जाँची गई।
Open/Edit, Save/Send, Retry, mutate (Delete/Restore), Close और Preview/PDF functions पुराने V373 से byte-identical मिले।
V374 dashboard stylesheet byte-identical है। V374 index की तुलना में केवल दो JS asset versions बदले हैं ताकि browser नया code पढ़े।
QA_INBOX.json में वास्तविक local browser workflow checks की सूची है। QA_CODE_COMPARISON.json में comparison evidence है।

सीमा:
जाँच mocked central responses के साथ local Chromium में की गई; live Supabase या production logins का परीक्षण नहीं किया गया। इन फोटो से live RPC/RLS/data की अलग समस्या को पूरी तरह खारिज नहीं किया जा सकता। इस fix के बाद भी paper न मिले तो pc343Status का पूरा error/result जरूरी होगा।
Private draft Admin inbox में नहीं आता; Send to Admin की केंद्रीय confirmation जरूरी रहती है।

Security database audit अलग से बाकी है। पहले दिया 01_READ_ONLY_SECURITY_CHECK.sql इस design/inbox fix की अनिवार्य migration नहीं है; वह permissions की जाँच है और उसका result लौटाना बाकी है।

Rollback:
इन चारों files के backup साथ वापस रखें। Database rollback नहीं चाहिए; इस patch ने database/settings/data नहीं बदले।
