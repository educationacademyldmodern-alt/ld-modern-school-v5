L D MODERN EDUCATION ACADEMY — V54 FINAL INTEGRATION
Base: V53 FINAL POLISHED / production reference cb3ec25
Added safely:
- Parent My Children switcher; one active child at a time, no sibling data mixing in dashboard view.
- Parent Leave and Timetable quick actions tied to selected child.
- Parent/Teacher Change Password option after login.
- Mandatory first-login password screen when profiles.must_change_password=true.
- Mobile/browser Back remains inside authenticated ERP via existing V53 guard; Logout stays explicit.
- Extra stray /n/n cleanup.
- Print page-break guards added for fee/document cards.
- SQL migration is additive/idempotent and does not mass-force existing users.
IMPORTANT: Run supabase-v54-final-integration.sql in Supabase SQL Editor. When Admin gives/resets a temporary password, set that user's profiles.must_change_password=true so first-login change is enforced.
