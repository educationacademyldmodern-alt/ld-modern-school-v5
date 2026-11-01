L D MODERN EDUCATION ACADEMY — Rechecked Assign Work + Premium Cards

Completed:
- Existing shared colourful 2-column function cards retained.
- Shared ERP header controls use normal flow and wrap; search input shrinks within available width. Duplicate legacy Home hidden when current Home exists; original handlers unchanged.
- Assign Work Add/Edit, Reassign, Workload, Categories, Progress and History forms open inline in the same page.
- Work assignment/workload report previews open inline in an iframe; browser Print/Save PDF remains available.
- Shared toast notifications inside logged-in ERP/Parent screens now render as persistent inline status text. Login feedback remains available.
- Save failure keeps entered values, re-enables controls, and permits safe retry. Search filters remain after reload. Unsaved-change, archive and other safety confirmations remain.
- Async History errors are ignored if the editor has been closed.

Rechecked:
- Card layouts: 320,360,390,688,768,820,1024,1280,1440,1920 px; 2 columns, no page overflow, preserved handlers/hidden/disabled states, dynamic rerender without duplicate icons.
- Header/search/inline forms: 320,390,768,1024,1440 px; header and content do not overlap, Back control clickable, search preserved, scoped assignment payload, single write, failed Save retains data, retry succeeds, inline report opens/closes without new browser window.
- 128 inline scripts and external scripts parsed; changed code reviewed twice. Tests use mocked browser fixtures, not live production logins.
- Previous SQL split executed in order twice on local PostgreSQL-compatible fixture; 25 authorization/workflow checks passed. SQL unchanged in this update.

Pending / limits:
- Live Admin/Teacher/Parent login tests and real-device acceptance remain pending.
- This is the complete changed-files patch for this conversation, not a standalone full ERP.
- Other ERP modules' bespoke dialogs, alert()/prompt() calls and native document print dialogs have not been globally removed. Shared notices and Assign Work dialogs are addressed; no blind global popup suppression.
- Emoji appearance depends on device fonts.

Install:
1. Back up current project and database first.
2. If this conversation's ASSIGN-WORK-MASTER.sql already succeeded, do not install the same migration again just for layout.
3. Otherwise choose EITHER the master SQL OR sql-parts/PART-01 through PART-06 in order. Stop on error. Each part is independently committed; all six must succeed before deploying frontend. Do not run only selected parts.
4. Replace the 10 frontend files at original project-root paths; retain all other existing ERP files.
5. Test in staging before production. No deployment or live SQL execution was performed.
