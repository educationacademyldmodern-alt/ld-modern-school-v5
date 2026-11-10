LD MODERN SCHOOL ERP — V500 SAFE PARTIAL BUILD (10 NOV 2026)
=======================================================
Main input: ld-modern-school-v5-Mark-entery.zip

क्या लागू किया गया:
- Main project में नया 3D Premium Universal ERP Control Card, A–Z authenticated-route shortcuts, quick search और cached dashboard status.
- Verified teacher-work report load-on-demand: existing timetable, teaching_diary, v90_marks_check_status sources; requests ONLY on click, cache 2 minutes. Print reports show only retrieved records.
- A4 status preview and browser print / Save as PDF flow.
- Central Exam teacher mode: authorized Exam/Class/Subject selection, selected paper का auto-load, Student Name + Father's Name + Roll, mobile Present/Absent buttons, unified Save All (existing RPC authorization and idempotent retry preserved).
- Marks auto-save debounce 900 -> 2600ms to reduce per-keystroke request volume.
- Class Marksheet Preview: 100 -> 24 records per preview page; DOM rendering chunks 20 -> 8 per browser frame. Print whole class requires ALL batches.
- Existing student tables WITHOUT editing inputs get in-memory Search & Sort toolbar; server/database rows not changed.
- Premium visual CSS and compact desktop spacing, minimal duplicate school identity detection, teacher header image styling, responsive touch controls.
- Existing files/pages/routes retained; no existing files removed.

सुरक्षा और सीमाएँ:
- यह सुरक्षित आंशिक Upgrade है, 13 सभी requirements के पूर्ण होने का दावा नहीं।
- Supabase connection इस session में उपलब्ध नहीं (project list empty); database में कोई SQL migration apply नहीं किया गया।
- Admin Assistant को Database-level Full Operational Delegation / RLS विस्तार अभी नहीं मिला। केवल existing authorized Work Delegation route उपलब्ध है. किसी RLS को bypass नहीं किया गया।
- iPad Safari Login, refresh popup root cause, all user table/module end-to-end Search/Sort, native PDF direct download, Print और real Supabase save अभी live-device पर verify करने हैं।
- Log Ingestion ठीक 0 होना गारंटी नहीं; जरूरी Auth/DB/Audit Logs चलते रहेंगे।
- Marks Delete/Clear के server-supported semantics verify किए बिना destructive action नहीं जोड़ा गया।

Deploy करने के लिए:
1) Source और Production database का backup लें।
2) Updated FULL ZIP खोलें; उसके outer folder के अंदर का पूरा static project Vercel/Git repo में रखें।
3) Staging Preview Deployment करें; पहले Admin और Teacher Login तथा Central Exam save test करें।
4) iPad Safari, Android Chrome, Laptop/Desktop पर Login/Print/Save की जाँच करें।
5) Supabase dashboard में permissions, RPC compatibility और log ingestion compare करें।
6) सब ठीक हो तभी Production में promote करें। जरूरत पड़े तो original ZIP Restore करें।

फाइलें जोड़ी/बदली गईं:
index.html                — smaller class preview batches + new script/style links
exam-central-v320.js      — filtering, P/A controls, Save All, auto-save coalescing
ldm-premium-v500.js       — universal launcher, monitoring and read-only table toolbar
ldm-premium-v500.css      — premium style / mobile responsive
FUNCTION_MAP_V500.csv     — static route mapping (not a permission guarantee)
README_V500_HINDI.txt      — इस फाइल में चरण और सीमाएँ
QA_V500_REPORT.json       — tests and pending items

IMPORTANT: Real student data is not included in testing results. Mock records used during UI smoke tests.
