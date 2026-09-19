L D MODERN EDUCATION ACADEMY — V58 FINAL COMPLAINT + SMART OPERATIONS
Base: V57 Smart Operations; additive update only.

ADDED
- Admin Complaint & Discipline Center.
- Categories: Student Misbehaviour, Parent Complaint, Teacher/Staff Complaint, Academic, Fee, Transport, Safety, Discipline, Other.
- New / Under Review / Action Taken / Closed workflow.
- Related Student / Teacher linkage using permanent IDs; class auto-fills from Student Master.
- Confidential flag and Admin review/action note.
- Verified discipline history is created only after Admin chooses Verify Discipline Action.
- Public controlled confidential Complaint Box (text submission; no anonymous file upload to protect free-tier storage).
- Responsive mobile/desktop layout.

PRESERVED FROM V57
Smart Highest Due Center, Guidance, date/time/greetings, birthday wishes, teacher handover, central student principles, fee reminder preview/print and earlier V53-V57 fixes.

SQL
Run supabase-v58-complaint-discipline.sql after earlier migrations. It is additive/idempotent and contains no DROP TABLE/TRUNCATE/DELETE. The only DROP is DROP TRIGGER IF EXISTS so the same trigger can be safely recreated; no user data is removed.

IMPORTANT
Test on Vercel Preview with live Supabase/RLS before Production. Static checks cannot prove live permissions/data behavior.
