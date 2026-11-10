# V508 — इंस्टॉल करने से पहले पढ़ें

- **FULL:** `LD_ERP_V508_FULL_PROJECT_STAGING.zip` पूरे V508 staging project की archive है; latest status `V508_REVIEW/V508_RECHECK_REPORT_HINDI.md` में है।
- **ONLY-CHANGED:** `LD_ERP_V508_ONLY_CHANGED_FROM_V507.zip` में केवल 3 production files हैं: `index.html`, `id-card-v447.js`, `id-card-v447.css`। इसे full blank hosting install के लिए इस्तेमाल न करें; केवल existing V507 staging की same-path files replace करें।
- पुराना V507 ZIP सुरक्षित रखें। पहले testing/staging site पर phone/desktop camera, photo save/remove, preview, print, Teacher assignment और RLS के cases test करें।
- Connected Supabase projects नहीं दिखे; इस release में DB migration नहीं की गई। Production deployment / final acceptance अभी रोकी गई है।
- Rollback के लिए पिछले V507 backup से केवल ये तीन files restore करें।
