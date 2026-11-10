# LD MODERN SCHOOL ERP — V505 Correction Status (10 November 2026)

## जरूरी सच
V504 के पूरे source से V505 बनाया गया। मूल V504 ZIP में कोई बदलाव नहीं किया गया। **यह स्थानीय code सुधार और browser mock test वाला build है; Live ERP या Live Supabase Database पर पूरी तरह सत्यापित build नहीं है।** Supabase project connection सूची खाली मिली, इसलिए Live SQL migration, Live RLS जाँच और वास्तविक Teacher/Staff authentication नहीं चलायी गयी।

## आपके बताए 11 बिंदु — स्थिति

1. **Central Exam Total / Maximum Marks** — Admin/Principal के लिए पहले से निर्धारित maximum बदलने का input/button खोला; नए maximum से कम/अधिक saved marks की जाँच; server को existing `setup` RPC भेजता है। **आंशिक**: पुराना server function existing maximum संशोधन अनुमति न दे तो inline error देगा। Backend SQL fix verified नहीं है।
2. **Marksheet Center Refresh पर दो Success Messages** — Refresh के समय extra success notice हटाई और duplicate notices रोकने की DOM जाँच जोड़ी। **Local mock में PASS**, Live screenshot scenario अभी test नहीं।
3. **Marks / Attendance Save/Update Popup नहीं** — Attendance correction के पुराने prompt/confirm को inline form confirmation से बदला। **आंशिक**: अन्य पुराने exam/marks modules में सभी alerts audited/removed नहीं हैं; सुरक्षा-संबंधी delete/discard confirmations यथावत।
4. **Admin Assign Work का मौजूदा Marks Function वही रहे** — पुराना marks assignment module और database data नहीं हटाया। **Source preservation PASS**।
5. **Marks Save पर List ऊपर jump करती है** — Central Exam paint में existing scroll, student input focus, search और filter बचाना। **70 छात्रों के Mock Save में PASS**; ~18px layout difference मापा गया, top jump नहीं हुआ।
6. **Dashboard Cards कभी ऊपर कभी नीचे** — Universal Hero और पुराना Admin Work Control canonical order में रखा; older module के reorder के बाद repair; CSS ordering। **Mobile/Desktop Mock PASS**।
7. **Universal A–Z Card Full View cluttered** — mobile/desktop/tablet पर header और scrollable card body अलग, card sizes कम, modal scroll reset। **390/768/1024/1180px local browser PASS**; 26 distinct routes।
8. **Universal सभी Cards Admin Assign Work से Full Assigned Module Access** — Universal routes को Assign Work select list में जोड़ा; existing server-allowed permissions के लिए Full Assigned Module checkbox button। **आंशिक/Backend Pending**: बहुत-से Universal routes के लिए corresponding Supabase authorization अभी उपलब्ध/verified नहीं है। इन routes को `Server access pending` के रूप में दिखाया और unsafe task grants block रखे। User की मांग के अनुसार सभी modules को Full Access देना अभी complete नहीं है।
9. **Supabase Log Ingestion = 0** — **पूरा नहीं**: Supabase platform तथा database requests के जरूरी logs को app UI से 0 करने की guarantee संभव नहीं। कोई fake zero claim नहीं किया।
10. **Marksheet/Admit/All-Student Previews पर Log Ingestion न बढ़े** — Student-photo signed URLs के 1-per-photo requests को batch signing में बदला; 230 unique photos के local mock में 5 Storage Signing requests (50 per batch), 0 one-by-one। **आंशिक**: सभी Preview URLs, logs, and Live Supabase ingestion unverified; zero logging guarantee नहीं।
11. **Welcome Wishes कभी hidden** — Existing canonical renderer को dashboard reopen/remount पर call करता है; visibility restore, old modules के header nesting के साथ stable। **Local DOM Mock PASS**।

## दो जाँचें (स्थानीय)

- **जाँच 1**: 390px mobile और 1180px desktop — Universal Card modal, 26 routes, duplicate notice, greeting hide/remount, canonical order; role check (Admin hero Teacher को नहीं); 70-student marks + max mock, scroll position, no code exceptions।
- **जाँच 2**: 150 external JS + 128 embedded executable JS, Node syntax 0 errors; 768px/1024px modal; signed-photo batch 230 unique paths -> 5 calls; original ZIP से source SHA-256 comparison, **572 original files मौजूद**, किसी पुराने file की deletion नहीं।

**ध्यान दें:** ये 2 **code/browser checks** हैं, Live Supabase checks नहीं। वास्तविक ERP 2 गुना तेज है या बिल्कुल bug-free है — ऐसा benchmark नहीं किया जा सका और ऐसी guarantee नहीं दी जा सकती।

## Install / सुरक्षा

1. पहले **Original ERP V504** और **Supabase Database** का अलग backup लें।
2. `LD_ERP_V505_ONLY_CHANGED_FILES.zip` में बदली हुई files को मौजूदा relative paths में merge करें, या staging में `LD_ERP_V505_FULL_PROJECT.zip` deploy करें।
3. **सभी SQL migration एक साथ न चलाएँ।** `V505_SUPABASE_BACKEND_READ_ONLY_AUDIT.sql` सिर्फ SELECT जाँच है; इस build में कोई नई database-changing migration नहीं है।
4. पहले staging में Admin और Teacher login, Assign Work, Central Exam (new/existing Maximum Marks), P/A Save/Edit, Marks Save All, Marksheet/Admit Preview, Dashboard Cards, Welcome Wishes और Print/PDF की वास्तविक database के साथ जाँच करें।
5. अगर existing Maximum Marks बदलने पर Backend reject करे, तो function signature/body एवं RLS की जाँच के बाद **अलग सुरक्षित migration** आवश्यक होगी। किसी teacher को बिना सही server-side RLS/RPC permission के access न दें।
6. Live से तुलना के लिए Supabase Usage/Logs देखें; Preview से पहले/बाद log ingestion metrics compare करें। Platform logs पूरी तरह बंद न करें।

## बदली हुई Production Files

- `exam-central-v320.js`
- `index.html`
- `ldm-premium-v500.css`
- `ldm-premium-v500.js`
- `smart-work-v403.js`

**नई Production File:** `erp-v505-stability.js`

**Read-only SQL (नई):** `V505_SUPABASE_BACKEND_READ_ONLY_AUDIT.sql`

**मूल Source में Deleted Files:** कोई नहीं।
