LDM V373 — Rendering / Paper Setup / Search performance fix

V372 के ऊपर लगाएँ। इस ZIP में केवल 8 बदली/नई web files हैं।
नया SQL नहीं चलाना है। V372 का पहले दिया SQL लगा रहना चाहिए।

ZIP extract करें। नीचे की आठों files ERP की उसी root directory में upload/replace करें जहाँ index.html है। सभी आठ साथ upload करें। पुराने नाम न बदलें। नया folder नहीं बनाना है।
• index.html
• teacher-paper-form-v343.html
• teacher-editor-v350.js
• paper-center-v343.js
• paper-smart-v358.js
• paper-workspace-v371.js
• ui-v337.js
• paper-performance-v373.js

मौजूदा paper-import-v369-assets और बाकी ERP files रहने दें। केवल README/QA/SHA256 जानकारी के लिए हैं; इन्हें ERP में upload करना जरूरी नहीं। Upload के बाद app reload करें; जरूरत हो तो एक बार logout/login करें।

क्या सुधरा:
1. Edit/Setup के पीछे छिपे PDF पन्ने बार-बार नहीं बनते। Preview/Print पर ही layout बनता है।
2. बिना बदलाव वही Preview दोबारा माँगने पर मौजूदा layout इस्तेमाल होता है। Print और screen के अलग क्रम सही रहते हैं।
3. बड़े पेपर में atomic question blocks एक साथ मापे जाते हैं; हर प्रश्न जोड़कर बार-बार पूरे पन्ने का layout पढ़ना कम किया। असामान्य सामग्री पर मूल exact pagination fallback और overflow validation सुरक्षित है।
4. Teacher typing में बार-बार पूरा प्रश्न-पाठ split करने वाला quadratic काम हटाया। एक row बदलने पर छिपा editor/preview दोबारा नहीं बनता।
5. Device draft writes छोटे batch में होते हैं। Save/Send/capture, तुरंत editor बंद करने, page hide और app exit पर pending draft तत्काल flush होता है।
6. Paper Center शुरू में केवल 40 records वाला एक page पढ़ता है। Admin की सभी papers की summary खुद-ब-खुद पूरी paged सूची नहीं पढ़ती। पूरी स्थिति के लिए परीक्षा/कक्षा चुनें या स्थिति देखें दबाएँ। केंद्रीय records छिपाए/हटाए नहीं गए हैं; अगला page और search उपलब्ध हैं।
7. Search typing debounce, in-flight समान list request reuse और पुराने reply को discard करना; result आने पर search input फिर से नहीं बनता।
8. Paper form asset का request URL cache के लिए स्थिर रखा है। हर login और paper का draft key URL fragment से अलग रहता है; पुराने V372 draft keys संगत हैं। अलग papers की recovery आपस में नहीं मिलती।
9. पूरे ERP के साझा language observer में जोड़े गए nodes के parent/child deduplication का quadratic loop हटाकर ancestor lookup किया। भाषा और user-entered data का व्यवहार वही है।

जाँच:
• 147 JavaScript syntax checks, asset version references और ZIP hashes।
• Teacher/Admin पर 200 और 1,000 प्रश्न। Edit/typing में शून्य वास्तविक hidden layouts; unchanged Preview reuse; typing burst में एक batched device write।
• इसी स्थानीय run में Teacher के 200-question paper पर 20 input events लगभग 304 ms से 7 ms हुए। ये development environment के measurements हैं; browser, CPU और network से समय बदलता है।
• 8,000-count वाली synthetic paper list: initial one 40-record read; 20 rapid inputs → एक search; पुराने slow reply ने नए result को overwrite नहीं किया।
• Teacher/Admin के 24 editor open/close cycles और कुल 60 seconds idle: बढ़ते iframe/DOM या अतिरिक्त idle reads नहीं मिले। अलग cache run में भी 24 cycles और हर paper की स्वतंत्र draft key जाँची।
• टाइप करके तुरंत dispose/exit और reopen पर आखिरी keystroke सुरक्षित मिला।
• PostgreSQL engine में existing central save/send, retries, ownership/audit, 248 प्रश्न और 20+ खंड की जाँच पास।
• Add/Delete/Undo, Imports, custom font, matching, portrait/landscape duplex, 20-year Nursery–UKG bank, first-page-only school heading और PDF जाँच पास। 125-question PDF में सभी प्रश्न ठीक एक बार और school heading एक बार।

Production database या live website को इस काम के दौरान बदला नहीं गया। यह performance patch है; सभी उपकरणों/नेटवर्क पर हमेशा zero delay होने का दावा नहीं है।
