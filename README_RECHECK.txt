L D MODERN EDUCATION ACADEMY - V482 TARGETED CENTRAL EXAM PATCH

Scope: Only supplied exam-central-v320.js and exam-dates-v475.js.
This is NOT a verified complete ERP repair. Existing database rows unchanged.

Compared against supplied V481 source, two review passes:
1. Verified teacher vs admin RPC routing, save confirmation, pending storage, auto-save and attendance handling.
2. Added explicit server revision check for a rejected save; never overwrite a row if its revision changed. Added conflict notice for browser drafts; saved marks filter no longer hides records when attendance differs.

When save is rejected: use Check Latest Revision, then Retry Same Save only when server row revisions match. If conflicts are reported, stop and reconcile; do NOT discard existing marks. A timeout may mean the server committed: verify saved values before retry.

Replace these files ONLY at existing repo paths; do not create duplicate scripts. Backup old files and database. Deploy to staging first.

TESTED: node --check both JS files; static assertions; ZIP integrity.
NOT TESTED: live Supabase RPC/RLS, deployed routes, mobile browser, Assign Work, Question Paper, Marksheet, QR/daily attendance. No schema-changing SQL is supplied. 01_SAFE_CENTRAL_CHECK.sql is READ ONLY.
