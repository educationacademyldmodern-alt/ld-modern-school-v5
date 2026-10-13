V309 — आपके बताए हिस्सों की ROOT CORRECTION PATCH

यह पूरी ERP ZIP नहीं है। आपके पहले लगाए V306/V307/V308 ERP के ऊपर लगाएँ। पुराने ERP assets, UDISE PDF/font dependencies और public page images/CSS पहले से मौजूद रहने चाहिए। अन्य dashboards का design बदलने का काम नहीं किया गया है।

1. BACKUP
Server से बदली जाने वाली files की copies सुरक्षित रखें। Supabase database का backup/export रखें। खासकर index.html, dashboard-v304.js, absence-followup-v307.js, corrections-v308.js, public-final.js और v57-school-operations.js का backup लें।

2. UPLOAD / REPLACE — उसी ERP root folder में जहाँ index.html है
REPLACE:
- index.html
- dashboard-v304.js
- absence-followup-v307.js
- corrections-v308.js
- public-final.js
- v57-school-operations.js
NEW UPLOAD:
- receipt-actions-v309.js
- scoped-fixes-v309.css
अन्य files/folders न हटाएँ। SQL, README और test-report का web server पर upload जरूरी नहीं।

3. SQL — Supabase SQL Editor में पूरा script चलाएँ
- RUN_V309_ABSENCE_FAST_SAFE.sql
- RUN_V309_FEE_AUDIT_OTHER_SAFE.sql
दोनों जरूरी हैं। ये इस feature के पिछले V307/V308 absence और V304 batch payment setup को supersede करते हैं; उन पुराने scripts को फिर चलाने की जरूरत नहीं। कोई script excerpt या अकेली line न चलाएँ।
Prerequisites आपके supplied ERP schema के अनुसार: profiles, students, attendance, teacher_profiles, teacher_class_assignments, fee_payments, fees, student_fee_schedules, income; existing central ldm_fee_due_snapshot_v2 और v65_add_fee_adjustment functions। Calendar missing हो तो school_holidays table बनाई जाती है। Existing calendar rows और policies को नहीं हटाया जाता।
Scripts में DROP / TRUNCATE / DELETE statements नहीं हैं। Setup पुराने student/attendance/payment rows को mass-update नहीं करता। Owned feature functions, indexes, private receipt/audit tables और permissions configure होते हैं। Generic SQL Editor security/schema warning गायब होगी, इसका दावा नहीं है।
IMPORTANT: केवल आपके explicit Confirm Reversal action पर संबंधित financial posting और schedule allocation UPDATE होते हैं। Original records delete नहीं होते; original receipt, payment/fee rows और schedule values immutable correction audit में सुरक्षित रहते हैं। Reversed fee/income की posted amount zero होती है, fee mirror status Reversed होता है। इसलिए original राशि देखने के लिए original receipt/audit इस्तेमाल करें। यह bank/UPI refund भेजने की सेवा नहीं है।

4. REOPEN
Upload/SQL के बाद ERP बंद करके reopen / hard refresh करें। New ?v=309 URLs दिए गए हैं। Cached files पुरानी मिलें तो cache-only clear करें; पूरा browser storage न मिटाएँ क्योंकि उसमें UDISE local snapshots हो सकते हैं।

CORRECTIONS
A. Admin management cards: grouping करके बड़े School Management Workspace cards बनाना हटाया गया। Original action grids और सभी पुराने buttons अपनी जगह रहते हैं। Teacher/Parent dashboards को नया layout नहीं दिया गया।
B. Absent: dropdown के लिए अलग lightweight class RPC; Admin को configured Nursery/LKG/UKG/1–10 और registered अतिरिक्त classes, Teacher को approved active Class Teacher assignment की classes। Empty class भी चुन सकते हैं। Class चुनने के बाद server उसी class की list निकालता है। पूरी school attendance अपने-आप load नहीं की जाती। Search local loaded class में काम करता है। Empty list स्पष्ट संदेश देती है; timeout/setup failure को zero students नहीं बताया जाता।
Query में repeated per-student permissions/duplicate scans हटे, attendance पहले aggregate होती है, today-status repeated scan के बजाय join है, conflict-resolution RPC प्रत्येक conflict date पर एक बार ही चलता है। Existing conflict resolution उपलब्ध हो तो उसका chosen status लिया जाता है; unresolved conflicts/missing school-day data streak तोड़ते हैं। Current session और 120 calendar days की window रहती है; longer confirmed prefix ≥ के साथ आता है।
Sundays skip, configured non-working holidays skip, explicitly working Sunday count। school_holidays में स्कूल की ACTUAL extra holidays पहले दर्ज रखें; कोई तारीख guess/auto-insert नहीं हुई। आज attendance unmarked हो तो default checkbox previous school-day तक का confirmed streak दिखाता है, आज को absent नहीं मानता।
Call dialer खोलता है; actual contact result और remark manually save करें। Admin/assigned Class Teacher shared history Refresh पर देखते हैं। Remarks attendance नहीं बदलते।
C. Fee: search Student/Father/Mobile/Admission/Roll; एक result और verified central balance मिले तो payment form automatically खुलेगा। Multiple results में प्रत्येक balance एक batch snapshot से आता है; पिता+पहला mobile दोनों समान हों तो matching label मिलता है। सिर्फ नाम/phone समान होने को confirmed family identity नहीं मानें; सही विद्यार्थियों का selection जाँचें। Add/Add All और maximum 50 students प्रति receipt। Missing balance को ₹0 नहीं बनाया जाता; invalid/missing due का payment form auto-open नहीं होगा।
Discount reason, full/partial/advance और combined totals बने रहते हैं। Save server confirmation के बाद ही receipt बनती है। Stale balance / reconciliation failure पर पूरा transaction rollback होगा। Network outcome uncertain हो तो Same Payment/Request retry करें; नई request न बनाएँ।
Paid confirmation पर Next Student / नई Search आता है। Back/Home/Website तथा नई route पर पुराना search/selection/form साफ होता है। Pending unknown save/reversal में navigation रुकेगा ताकि वही request safely retry हो। Back/Home saved payment undo नहीं करता।
D. Receipts: Print Receipt native A4 popup, Download PDF, Prepare Share PDF, फिर Share PDF। PDF A4 width पर अलग render होती है; mobile scroll वाली table PDF में नहीं कटती। Hindi font reused है। Supported browser/device में native file-share sheet; unsupported हो तो real PDF download। Physical printer, OS share targets या किसी व्यक्ति को delivery नहीं जाँची गई है।
E. Wrong payment: Save से पहले amount/mode/date/selection बदल सकते हैं। Save के बाद गलत Payment / Correction में reason और explicit confirmation देना होगा। पूरा combined receipt batch reverse होता है; सही payment नई search से दर्ज करें। Receipt Search / Correction में exact LDM-... या OTHER-... receipt number paste करके बाद में receipt खोल सकते हैं। Voided receipt स्पष्ट REVERSED label के साथ आती है।
Automatic reversal उन्हीं counter receipts पर भरोसे से चलता है जिनका allocation audit मौजूद है। V309 SQL लगने से पहले बने legacy receipts में audit न हो, adjustment metadata missing हो, ledger/schedule बदला हो, या central reconciliation fail हो तो reversal rollback/deny होता है; अनुमान से पुराने records नहीं बदलते। ऐसे receipt को manual authorized review चाहिए।
F. Tie / Other: पहले student search/select करें, Tie / Other Collection खोलें, सही student, Head/मद, Amount, Mode, Date और Note चुनें। Amount existing Income ledger में सही head पर जाता है; school fee balance नहीं बदलता। Separate Other Collection Receipt में Print/PDF/Share/Next और audit correction उपलब्ध हैं। Stock quantity स्वतः कम नहीं होती; यह amount collection सुविधा है।
G. Public: preferred reference home markup अब index.html में पहले से मौजूद है; delayed old-to-new page rebuild हटाया। Greeting की जगह पहले से रहती है; public async guidance उसे बार-बार हटाकर नहीं जोड़ती। Shared v57 changes केवल public path पर हैं; अन्य audience का पुराना path preserved है। Banner contain से पूरी image/text दिखती है। Login/navigation functions वही authoritative ERP functions हैं।

VALIDATION — सच में चली जाँच
- 38 Chromium 153 browser checks: production scripts, actual admin dashboard template/styles और controlled RPC fixture; original cards, single/multi fee balance, Next/Back, actual A4 popup, real PDF download, share fallback और mocked supported Share API, correction display, Tie receipt, class filters, remarks/retry और missing due handling। Teacher browser fixture controlled shell है; live login नहीं।
- 35 isolated PostgreSQL/PGlite absence checks: class permissions, holiday/conflict/missing records, aliases, re-run preservation, independent class dropdown और load fixture। 600 अतिरिक्त test students और 54,000+ attendance rows वाले test में latest measured query ~3.7 seconds; earlier repeated-scan version ~20 seconds। यह local fixture measurement है, live Supabase speed guarantee नहीं।
- 22 isolated financial database checks: transactions, allocations, advance (including future-month allocation reversal), replay protection, discounts, shared audit, fee/income reversal, void replay guards, changed-allocation rollback and old-audit guard।
- 7 public rendering checks: native layout before DOMContentLoaded, three existing login cards, greeting stability, mobile/desktop width, return-to-public stability and no script errors।
- 29 exam checks, 30 UDISE core checks, 6 previous ERP behavior checks और 129 inline scripts syntax checks passed। A4 PDF rendered and visually inspected: six columns and Hindi name visible; saved/native PDFs have A4 dimensions।
Live deployed ERP/Supabase was not accessed or tested. Real students or fake/demo rows were not written into your database. No UDISE upload claim is made.

ROLLBACK
Backed-up frontend files restore करें, नई receipt-actions-v309.js और scoped-fixes-v309.css references backed-up index के साथ हट जाएँगी। Saved receipts/correction/follow-up audit tables न हटाएँ। Old UI restore करने से posted corrections automatically undo नहीं होतीं; financial history सुरक्षित रखें।
