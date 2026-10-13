V307 PATCH — 4+ SCHOOL DAYS ABSENCE / CALL / SHARED REMARKS

यह incremental patch आपके पहले वाले V306 ERP के ऊपर लगाएँ। V304/V305/V306 की बाकी files पहले से server पर होनी चाहिए। केवल इस ZIP में दिए बदलाव upload करें।

BACKUP FIRST
1. Server से मौजूदा index.html और udise-app-v306.js की copies download कर अलग backup folder में रखें।
2. Supabase database का backup/export सुरक्षित रखें। SQL चलाने से पहले backup उपलब्ध हो।

UPLOAD / REPLACE (उसी root folder में जहाँ ERP का index.html है)
- index.html: Replace
- udise-app-v306.js: Replace (पुराने PDF navigation guard के साथ integration)
- absence-followup-v307.js: New upload
- absence-followup-v307.css: New upload
- RUN_V307_ABSENCE_FOLLOWUP_SAFE.sql: Supabase SQL Editor में पूरा content एक बार Run करें। Web root में upload जरूरी नहीं।
- README_V307.txt और V307_TEST_RESULTS.json: instructions/audit, server upload जरूरी नहीं।

DATABASE MIGRATION जरूरी है
SQL केवल नया shared follow-up table, access helpers, narrowly scoped RPC functions और उसी नए table की read policy जोड़ता है। पुरानी attendance/student rows या पुरानी policies नहीं बदलता। SQL हमारे isolated PostgreSQL fixture में दो बार चला कर जाँचा गया है। आपके live Supabase पर नहीं चलाया गया है।
Existing prerequisites: profiles, students, attendance, teacher_profiles, teacher_class_assignments और school_holidays tables (आपके supplied ERP schema के अनुसार)। यदि calendar/setup missing हो तो guessed list के बजाय setup error दिखेगा।
Teacher का active, approved profile और selected session में active is_class_teacher assignment जरूरी है। Subject-only assignment से दूसरे बच्चों का follow-up नहीं दिखेगा।

AFTER INSTALL
Hard refresh करें। Admin और Class Teacher dashboard पर “4+ Days Absent / Follow-up” दिखेगा। Admin सभी permitted classes देख सकता है; Teacher अपनी assigned Class Teacher classes। Full List में class/search/as-of filters, mobile dialer Call link, contact result, remark, optional next follow-up date और shared history उपलब्ध हैं। दूसरे account/device पर नवीनतम remarks के लिए Refresh List करें।

RULES
- “3 दिन से ज्यादा” = कम से कम 4 लगातार confirmed school days।
- रविवार और calendar की non-working holidays skip; explicitly working Sunday count होता है।
- Present, Leave, missing या unresolved conflicting attendance streak तोड़ती है। आज की attendance अभी unmarked हो तो default option केवल पिछले school day तक की confirmed streak दिखाता है; आज को Absent नहीं मानता। यह option बंद किया जा सकता है।
- Current selected academic session, as-of date और अधिकतम पिछले 120 calendar days की window इस्तेमाल होती है। यदि streak window तक जारी हो तो ≥ दिखेगा। School holidays सही maintain रखें।
- Duplicate admission identities सुरक्षित रूप से exclude; conflicting attendance होने पर existing resolution RPC उपलब्ध हो तो उसका chosen status लिया जाता है।
- Call button केवल dialer खोलता है। Desktop पर call handler/app आवश्यक हो सकती है। Actual result manually चुनें; call button दबाने से Connected या save अपने-आप नहीं होगा।
- Remarks attendance नहीं बदलते। Shared history append-only है; Resolved result से बच्चा future confirmed-streak list से अपने-आप नहीं हटता।
- Next follow-up date stored field है; automated calls/SMS/reminders नहीं भेजता।
- Network outcome unknown हो तो Same Request retry करें; repeated network retry से duplicate log नहीं बनता।

VALIDATION
28 database checks: isolated PGlite PostgreSQL; migration rerun, streaks/calendar/conflicts/current-day option, teacher permissions, shared log, RLS, retry idempotency, attendance unchanged.
18 browser checks: actual Chromium 153 engine, production module code with isolated RPC fixture; admin dashboard template and teacher dashboard shell, shared remarks, call link, filtering, mobile layout, bundled Hindi font, retry/error states. Teacher browser fixture uses controlled dashboard shell; live login flow not tested.
Existing 30 UDISE core checks, 6 previous ERP regression checks and 129 inline script syntax checks passed. No real student/test records were written into your database. Live Supabase permissions, deployed ERP and actual telephone connection have not been tested.

ROLLBACK
Restore backed-up index.html and udise-app-v306.js, remove the two new JS/CSS files if desired, hard refresh. Do not drop the follow-up table if it contains real saved history; keeping it does not modify old attendance functionality.
