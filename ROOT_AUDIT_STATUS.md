# L D MODERN EDUCATION ACADEMY — Consolidated Root Audit

## Scope
Audited supplied consolidated exam-central-v320.js, exam-dates-v475.js, safe diagnostic SQL and prior notes. This is a targeted patch, **not a verified complete ERP**. No full dashboard, Assign Work router, Supabase live instance, or current deployment repository was supplied.

## Root-level findings and status
| Area | Finding | Status |
|---|---|---|
| JS syntax | Both bundled JS parse with node --check | PASS (static) |
| ZIP | Archive verified with unzip -t | PASS |
| Save-before-switch | Previously awaited Save without explicitly testing boolean confirmation | PATCHED; live test pending |
| Retry after error | Pending request retained; recovery controls shown | EXISTING; live test pending |
| Auto-save off | Stale timeout could still invoke save | PATCHED; live test pending |
| Unsaved marks draft | Browser session storage for pending mark edits | EXISTING; live test pending |
| Maximum marks | UI checks 0..max; server must also validate | EXISTING; live test pending |
| Paper selector | Teacher list uses ldm_teacher_list471; admin uses ldm_v320_exam_list | NOT FIXED backend; SQL definition/assignments needed |
| Assign Work | Separate routing and exam_help assignments are not included | NOT VERIFIED |
| Mobile table | Horizontal scroll and sticky student name | STATIC CSS; device test pending |
| Save→reload→result | Teacher RPC ldm_teacher_exam_action475; publish/result separate | NOT TESTED live |
| Security | No RLS disabled, no blanket teacher grant | PRESERVED |

## Safe deployment
1. Backup the current production JS and database.
2. Replace files only at their original paths on a staging branch; do not load duplicate scripts.
3. Test teacher paper list, save one valid test mark, reload, switch papers, and verify admin sees the same mark.
4. If no papers show, inspect the actual definition of public.ldm_teacher_list471 and teacher's class/section/subject/session mapping. Do not bypass RLS.
5. If Save fails, keep pending request and capture the exact RPC error. Avoid repeated new requests before checking server values.

## Missing to finish full ERP
Full current ERP ZIP including Teacher Dashboard, Assign Work router, and current Supabase functions/RLS for teacher list and save. Without these, a complete production guarantee would be misleading.
