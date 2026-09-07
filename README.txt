L D MODERN EDUCATION ACADEMY — FINAL PREMIUM V5

Built from the supplied School ERP System and Website Requirements.

PUBLIC WEBSITE
Home, About School, Principal/Director Message, Faculty & Staff, Facilities, Photo/Video Gallery,
Events, News/Announcements, Notices/Downloads, Contact, Online Admission Application, Result Search,
mobile responsive public pages and ERP Login.

ERP
Student database/profile/parent/document identifiers/class-section/status
Admission approval/process
Academic sessions/classes/sections/subjects/teachers/subject assignment/timetable/homework
Student + Staff Attendance, automatic class attendance
Exams: internal/external marks, total, percentage, grade, approval/publish and public result search
Fees: installment, discount, paid/due, receipt number, reminder Call/WhatsApp/SMS
Staff database, teaching/non-teaching, designation, leave, payroll/salary history
Events/PTM/Holidays, Notices, Gallery, Enquiries
Transport, Library, Income, Expenses, Balance Sheet
Role logins + Student/Parent linked Admission No.
Excel Import/Export
Editable school logo/hero background/about/principal message/contact

INSTALL / UPGRADE
1. Extract ZIP.
2. Supabase > SQL Editor: run supabase-schema.sql.
3. Upload/replace index.html, style.css, app.js, vercel.json and manifest.json in GitHub root.
4. Commit. Vercel redeploys.
5. Open website. ERP Login uses the same Supabase project and existing auth accounts.
6. ERP > Website & Settings: edit branding/content.

IMPORTANT SECURITY
The UI filters Student/Parent records by linked Admission No., but production privacy must also be enforced
with matching database RLS policies before real student/parent sensitive data is exposed. The supplied schema
still has broad authenticated read access for operational simplicity.

AUTOMATED COMMUNICATION
Call/WhatsApp/SMS buttons open device apps with prefilled fee reminder text. Fully unattended automatic SMS,
WhatsApp Business messages, email, and online payment require external providers/APIs and are not included as
a free background service in this static package.
