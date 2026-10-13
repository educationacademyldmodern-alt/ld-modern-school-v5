V308 — HEADER + ABSENCE CALENDAR + COMBINED FEE CORRECTIONS

Apply over your existing V306/V307 ERP. This ZIP is a patch, not a full ERP. Keep all prior ERP assets, exam and UDISE dependencies installed.

BACKUP
Download existing index.html, dashboard-v304.js/css and absence-followup-v307.js before replacing them. Keep a Supabase database backup/export.

UPLOAD / REPLACE in the ERP root (the folder containing index.html):
1. index.html — replace
2. dashboard-v304.js — replace/upload; repaired multi-student fee bindings
3. dashboard-v304.css — replace/upload; required dependency included so missing prior CSS is restored
4. absence-followup-v307.js — replace; shows calendar scope notice and exposes navigation safety guard
5. corrections-v308.js — NEW upload
6. corrections-v308.css — NEW upload
Do not upload README or test results as application assets.

SQL
1. RUN_V304_MULTI_FEE_SAFE.sql: run its entire content once in Supabase SQL Editor if combined fee migration was not applied. It can be run again without resetting saved receipt data (tested in isolated database). Needed for combined payment saving; frontend alone cannot save a batch.
2. RUN_V308_CALENDAR_ABSENCE_SAFE.sql: run entire content once. This supersedes the previous V307/V307A absence SQL. It creates school_holidays only when that table is missing, and configures the V307 follow-up service. Existing calendar rows and policies remain unchanged. Existing students and attendance records are not updated or removed.
Do not run old SQL excerpts or manually remove security permissions. Neither script contains DROP, TRUNCATE or DELETE commands. SQL contains feature-scoped CREATE OR REPLACE / REVOKE / GRANT and security configuration; an editor may still show generic schema/security confirmation. Warning disappearance was not tested or promised.

AFTER UPLOAD
Close and reopen the ERP / hard refresh so the new version query strings load fresh scripts. Dashboard should show a compact 3-column mobile control grid, refresh inside header, a Multi-student Fee instruction and Open Combined Fee Counter. Desktop uses wider grid. Existing buttons/actions remain.
If browser/service-worker cache still serves old files, clear this site's cached files and reopen; preserve locally stored UDISE snapshots if clearing browser storage. Prefer cache-only clearing.

ABSENT LIST
The earlier screenshot's calendar setup error occurred because school_holidays was missing. The new migration supplies that prerequisite without fabricating holiday dates. Sundays are skipped automatically; other configured non-working holidays are skipped, explicitly working Sundays count.
IMPORTANT: In Supabase Table Editor, school_holidays, enter the school's ACTUAL additional holidays before relying on streak reports. Required: holiday_date YYYY-MM-DD; holiday_name; is_working_day=false for a holiday, true for an explicitly working Sunday. Blank calendar means Sundays only; the list explicitly warns that extra holidays have not been entered in the window. No national/school holiday dates were guessed or auto-inserted.
Admin gets school scope; an approved active Teacher requires an active is_class_teacher assignment for the session. Subject-only teachers do not get another class's students. Missing/Leave/Present/unresolved conflicting school-day attendance breaks a confirmed streak. Today unmarked may display confirmed prior-day streak, clearly labelled. Four or more confirmed school days qualifies.
Call opens the device dialer only; enter actual result and shared remark manually. Desktop needs a call handler for tel: links. Remarks do not change attendance. Shared history refreshes when reloaded; there is no automated call/SMS service.

FEE
Search Student/Father/Mobile/Admission/Roll, choose + Add or Add All Results after checking identity, enter each child's Discount (with reason) and Paid/Partial/Advance amount, review combined total, Save Combined Payment, then Print/Save PDF from the saved receipt.
Multi-student counter is available in the dashboard and as a direct sidebar entry. Dashboard replacement now remounts missing controls instead of depending only on a short timer. Payment and follow-up retries retain guards to prevent navigation while save outcome is unknown. No combined payment is claimed successful before server confirmation.
The receipt print action uses the existing ERP v14Print flow. Actual printer/telephone connection and live payment database were not tested.

TESTED SCOPE
27 Chromium 153 browser checks with actual admin dashboard template/styles, production module scripts and controlled RPC fixture. Checked mobile header widths/page overflow, refresh position, late dashboard replacement, multi-student fee selections, discount/partial totals, combined saved receipt and print action, filters, Admin/Teacher shared remark visibility, missing setup and network retry. Teacher browser test uses controlled dashboard shell, not live login.
32 isolated PGlite PostgreSQL calendar/absence checks: missing calendar creation, no fabricated dates, RLS, access control, holidays, conflicts, current-day option, remark replay protection and migration re-run preservation.
26 fee checks with JSDOM and isolated PostgreSQL: payment/discount/advance, transactions, stale dues, rollback and replay safety.
29 exam regression checks, 30 UDISE core checks, 6 prior behavior checks and 129 inline-script syntax checks passed. No real school/test data was written into your database. Live deployed ERP / Supabase were not accessed.

ROLLBACK
Restore backed-up frontend files and remove corrections-v308.js/css references through the backed-up index. Leave saved follow-up and receipt tables in place to retain real history. Do not delete tables to roll back the UI.
