LDMEA V64.22 — FINAL SYNTAX-CORRECTED BUILD

Base: verified V64.20, not the corrupted V64.21 HTML.
Reason: V64.21 patch had been injected into print-template strings and caused JavaScript syntax errors.

V64.22 safely appends one final runtime block only before the real closing BODY tag.
Included live corrections:
- Parent compact menu and role-shell separation.
- Teacher Employee ID field system-owned; DB trigger generates a unique ID on NEW staff rows.
- Master Due Update: Student, Father, Till selected month Due, Fixed Fee/Month, Total Balance, Status, Update.
- Existing V64.20 stability, responsive and search fixes preserved.

RUN ORDER:
1) Upload index.html to TEST/PREVIEW branch.
2) Verify public page + Admin login.
3) Run LDMEA-V64.22-SAFE-MIGRATION-2026-09-20.sql in Supabase SQL Editor.
4) Test Add Teacher -> Create Login -> Logout -> Teacher Re-login -> Logout -> Parent Login.
5) Test Master Due Update and existing fee reports/notices.
6) Promote to Production only after live tests pass.

Static verification: 74 inline scripts syntax PASS; 6/6 existing behavior tests PASS.
Live Supabase/browser tests are still required.
