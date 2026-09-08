L D MODERN EDUCATION ACADEMY - FINAL V6 CLOUD ERP

V6 additions
- Add / Edit / Delete across authorized ERP modules
- Admission and Student photo upload + mobile camera option
- Public online admission photo upload/camera
- Gallery direct photo/video upload to Supabase Storage
- Flexible Fee Structure: Monthly / Installment / Custom / One Time
- Editable Fee Plans, Installments/Months and Fee Heads
- Existing Fee collection remains with reminders
- Result print opens a clean result-only print page
- Responsive mobile/desktop UI

IMPORTANT SETUP
1. Use the SAME Supabase project already connected to your V5 website.
2. In Supabase SQL Editor run supabase-v6-master.sql once.
3. Upload all V6 website files to your GitHub repository (replace old index.html, app.js, style.css, etc.).
4. Commit changes. Vercel will redeploy automatically.
5. Hard refresh the live site (Ctrl+Shift+R).
6. Login as super_admin/admin.

STORAGE
- gallery-media bucket: public photo/video gallery
- student-media bucket: private student/admission photos
- Public admission may upload only into public-admission/ path; files remain private.

NOTES
- Camera capture depends on browser/device support. On mobile it can open the camera; desktop normally shows file chooser/webcam options provided by the OS/browser.
- WhatsApp/SMS buttons open device apps with prefilled messages; unattended background sending requires an external messaging provider.
- Online payment gateway is not included.
- Keep your Supabase secret/service-role key out of browser code. Use only Project URL + Publishable key.
