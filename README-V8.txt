L D MODERN EDUCATION ACADEMY - Final V8

V8 upgrades:
1. Modern Admission Management with complete application, student, parent, address, previous-school, transport, fee-plan and photo fields.
2. Student photo has separate Upload and REAL live Camera buttons. Camera uses browser camera permission and captures directly from live video.
3. Smart Fee system supports Monthly, Installment, Custom and One-Time plans, billing cycles, month/installment labels, grace days and late-fee rules.
4. Dedicated Search by Name at the top of supported ERP modules, plus full-field search.
5. Home Page Settings can upload School Logo and Hero/Background directly to Supabase Storage, or use a public URL.
6. Gallery photo/video upload remains cloud-based.
7. Existing role-based Add/Edit/Delete and cloud sync retained.

Deployment order:
A) Run supabase-v8-master.sql in the SAME existing Supabase project.
B) Upload/replace V8 files in the existing GitHub repo.
C) Commit changes and allow Vercel to deploy automatically.
D) Hard refresh the website (Ctrl+Shift+R).
