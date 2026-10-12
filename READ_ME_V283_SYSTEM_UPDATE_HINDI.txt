L D MODERN EDUCATION ACADEMY — V283 SYSTEM & UPDATE CENTER

BASE: V282 ROOT CLEAN SELF-CONTAINED FINAL

नया क्या जोड़ा गया:
1. Admin System & Update Center
2. Current ERP Version / Environment
3. On-demand System Health Check
4. On-demand Security Audit
5. Update ZIP local validation + SHA-256
6. Deployment checklist copy
7. Existing safe Backup shortcut
8. Restore safety guidance
9. Dashboard + Settings + Admin sidebar shortcut

महत्वपूर्ण सुरक्षा नियम:
- ERP browser से production HTML/JS overwrite नहीं करता।
- कोई arbitrary code upload/execute नहीं होता।
- Update ZIP केवल local validation के लिए पढ़ी जाती है।
- Actual deployment GitHub/Vercel controlled रहेगा।
- कोई background polling/realtime/cron नहीं जोड़ा गया।
- इस V283 feature के लिए कोई नया SQL नहीं है।

Recommended update flow:
Backup → ZIP Validate → Preview Branch → Vercel Preview → Admin/Teacher live test → Production.
