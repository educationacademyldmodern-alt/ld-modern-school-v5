L D MODERN EDUCATION ACADEMY — FINAL V7

V7 improvements:
- All role-authorized modules keep Add / Edit / Delete actions.
- Enquiries upgraded with Date, Source, Status, Follow-up Date, Assigned To, Admin Note, Converted Admission No.
- Public Contact form automatically records Date + Website source + New status.
- Enquiry staff roles: Super Admin, Admin, Principal, Admission Staff can read/edit/delete.
- Gallery photo/video upload, Admission/Student photo + camera, Flexible Fee Structure from V6 remain included.
- Cloud data remains in Supabase; website remains deployable as static Vercel site.

DEPLOY:
1. In existing Supabase project, run supabase-v7-master.sql once.
2. Upload/replace V7 web files in the same GitHub repository.
3. Commit to main. Vercel should auto-deploy.
4. Hard refresh website (Ctrl+Shift+R).
5. Test Enquiries Add/Edit/Delete, Admissions, Students, Fees, Gallery.

Security note:
Student/Parent strict row-level privacy should be hardened further before issuing real parent/student portal accounts widely.
