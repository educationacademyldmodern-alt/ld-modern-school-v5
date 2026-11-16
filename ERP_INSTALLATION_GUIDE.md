# ERP Installation Guide — V525

यह staging candidate है; सभी 16 समस्याओं का production-ready acceptance पूरा नहीं है।

1. वर्तमान deployed files और database का अपना backup रखें। इस काम ने production को नहीं बदला।
2. आधार: `ld-modern-school-v5-Mark-entery(1).zip`, SHA256 `26b461c4d62493eada8e9fb8ca971ab28e54e0166925936ce4ed767382746cbc`. Original ZIP untouched रखें।
3. `ERP_APPLY_CHECKED_PATCH.py`, `ERP_CHANGED_FILES_MANIFEST.json`, `ERP_FIXED_FILES_ONLY.zip` एक folder में रखें।
4. चलाएँ: `python ERP_APPLY_CHECKED_PATCH.py ORIGINAL.zip --output ERP_STAGING.zip`। Script source/old/new hashes और archive entries जाँचती है; wrong source पर रुकती है; output/original overwrite नहीं करती।
5. V521/V522 staging ZIP को installer input न दें; V525 cumulative patch को original ZIP से assemble करें। Changed paths project root के नीचे हैं; folder nesting दो बार न करें। सभी अन्य original assets जरूरी हैं।
6. Staging server पर केवल ERP_STAGING.zip की project contents रखें; reports/tests/helper scripts public site पर upload न करें। Session सुरक्षित रखते हुए changed assets का नया version load होने की पुष्टि करें।
7. Admin और अधिकृत Teacher test accounts से register के प्रत्येक acceptance workflow जाँचें; failed/slow request, repeated click, account/session/route change, preserved filters/scroll और role denial जाँचें। Actual fee ledger/receipt/history तथा marks/attendance integrity staging backend में जाँचें।
8. 360/390,768,1024/1366,1920px और वास्तविक iPad/browser पर प्रभावित pages जाँचें। Report Preview→Print→Save as PDF; long lists and each QR density पर A4 pagination/labels जाँचें। 100% scale पर print करके actual camera scan करें।
9. कोई database migration आवश्यक सिद्ध नहीं हुई; `ERP_DATABASE_FIX.sql` जानबूझकर नहीं दिया गया। Existing SQL को अंधाधुंध rerun न करें। Backend blockers के लिए real schema/RLS/RPC audit जरूरी है।
10. Failed staging acceptance पर production में release न करें।

Rollback: untouched original ZIP के manifest में दिए बारह paths restore करें, same asset cache policy refresh करें। No database rollback needed because no database migration/write was performed. Existing user edits/data को overwrite या reset न करें।

V525: 12 patched paths (11 replacements + 1 new search-scroll-v525.js). Rollback restores original replacement files and removes the new helper. Use the supplied checksum installer against untouched original, not a prior patched ZIP.
