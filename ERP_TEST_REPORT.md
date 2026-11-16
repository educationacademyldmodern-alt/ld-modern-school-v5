# ERP Test Report — V524

## निष्कर्ष

Controlled checks Pass; full production acceptance **Not Verified**. No deployment or live data writes. 138 JavaScript syntax checks, zero errors; 10 existing functional/geometry assertions, 7 V522 regression scenarios, 5 V524 academic/QR/Storage scenarios, 2 V524 report scenarios; 12 actual QR raster decode cases Pass. Geometry checks are numeric; raster decode is not real printed-camera testing.

| Issue | Evidence / result | Remaining acceptance |
|---|---|---|
|01|Active due-report print binding static check Pass|Browser Print/PDF Not Verified|
|02|Marksheet selection invalidation source correction|All-module pagination/preview Not Verified|
|03|Pending route points to existing approval center|Approval, count and permissions Not Verified|
|04|605-row pagination/search/escaping and superseded/account response tests Pass|Live schema, all filters, PDF Not Verified|
|05|Panel outside header with viewport position source correction|Device layout/count/links Not Verified|
|06|Routine refresh success notification removed|All refresh paths/scroll Not Verified|
|07|Due-save inline flow tests Pass; central exam already inline in source|Other save/scan flows Not Verified|
|08|Missing-key, duplicate-save and request cancellation fixtures Pass|Real RPC, logs, 20-user load Not Verified|
|09|Late teacher response and load-failure Retry fixtures Pass|Real records/module navigation Not Verified|
|10|Existing task tab default; legacy workflows preserved|Backend consolidation/parity Not Verified|
|11|Eligible assignee filter source correction|Backend role enforcement Not Verified|
|12|Count-aligned teacher register and stale account guard|Live records/details/export parity Not Verified|
|13|Same-row save, failure, duplicate submit, invalid input, account/session tests Pass|Ledger transaction atomicity Not Verified|
|14|QR timeout/abort and stale Storage success/failure tests Pass|Real usage data and safe deletion Not Verified|
|15|Scoped layout source corrections|Mobile/iPad/laptop/desktop Not Verified|
|16|12 raster QR decode cases Pass across density/orientation|Physical print labels/camera/distance/scoped actions Not Verified|

## Environment limitations

Chromium could not start: socket Operation not permitted. No browser result counted as Pass. No connected Supabase project was available; no live RLS/schema/function or concurrency test counted as Pass. Existing fee writer is multi-step; frontend guards cannot establish atomicity. Storage reference-check and delete remain separate operations; deletion race is unresolved. No speculative migration supplied.

## Reproduction

Evidence and test sources are in `tests/` in the full bundle. Tests expect `work/ld-modern-school-v5-Mark-entery` and `checks` below the current directory. Use the patched staging project at that work path. Run Python validate.py, Node tests.cjs, recheck_tests.cjs, tests523.cjs, report523.cjs, qr_test.cjs. QR test requires @napi-rs/canvas and existing vendor QR libraries. These are controlled fixture tests, not a browser test suite.

Secret scan examined changed files for JWT payload roles, private-key markers and Supabase secret-key markers: no privileged matches found. Existing public anon client configuration is retained; this is a bounded scan, not exhaustive secret certification.


## V524 — वर्तमान अतिरिक्त निष्कर्ष

ERP-04: रिपोर्ट UI में केवल संबंधित date/class/identity filters दिखते हैं; exact admission_no, employee_id, teacher_name और supported section/session filters query में लागू होते हैं। Students/Due का चुना session load के दौरान capture होता है। Invalid date range और cancelled requests reader में भी reject होते हैं।
ERP-06: Refresh के await के बाद route/account बदला हो तो पुराने filters/scroll नए पेज पर नहीं लगते; final button recovery सुरक्षित।
ERP-10: source trace में Universal Admin Work (ldm-premium-v500.js), Dashboard Assign Work (controls-v323.js) और School Control Work (school-control-v405.js) सभी work_delegation route खोलते हैं। Backend models का consolidation तथा permissions/progress parity अभी Not Verified; blind migration नहीं।
ERP-14/16: Student QR roster में hard limit(3000) था; अब stable ID tie-breaker के साथ paginated reads, हर page पर existing teacher class scope, cancellation check और incomplete response error हैं। 100,000-row safety cap पर explicit error; truncated sheet को complete नहीं बताया जाएगा।

आठ नए assertions/scenarios Pass: चार report query filter cases, date/cancel rejection, refresh route-change recovery, QR pagination/scope और cancelled QR reads. Test sources/evidence tests/filters524.json, tests/qr_roster524.json में हैं। पिछली आवश्यक जाँच फिर की गई: syntax 138/0 errors; fee/report regression और V522 route/account tests Pass.

### शेष वास्तविक blockers
- Browser/device और print acceptance: environment Chromium socket startup blocked; usable staging URL/browser चाहिए।
- Fee transaction atomicity, Storage check/delete race, assignment models/security and live RPC/RLS: connected project/schema तथा authorized staging fixtures चाहिए। Current Supabase project list खाली मिली थी।
- Broad routine save/scan popup removal, full report parity, responsive/print regression और actual concurrent users: अभी पूर्ण नहीं। Source changes alone पर्याप्त proof नहीं।

इन blockers के कारण सभी 16 issues fixed या production-ready का दावा नहीं। यह cumulative candidate original ZIP पर लागू है।


## V525 latest: user screenshots/search/scroll
- New search reset button on explicit ERP search field allowlist; clears/focuses search only and dispatches one input event, keeps class/filter and record-edit fields. No backend request handler replaced. Disabled fields remain protected.
- Marksheet search now shows inline loading/errors; late old query cannot overwrite latest query. Clearing search invalidates pending student-load token.
- Screen-only table-wrapper horizontal/vertical overflow and keyboard focus support; marksheet preview horizontal overflow retained; print hides new search buttons. Does not load additional rows in unrelated paginated modules.
- Literal ${E(API.termNames...)} was inside a single-quoted string nested in a template; now interpolated correctly.
- Admin document load/build uses “लोड हो रहा है…”; locked error path no longer also toasts. Existing issue/revoke safeguards retained. Other legacy print/issue flows and duplicate controls are not fully consolidated in this release.
- Four controlled checks pass: clear/disabled/non-edit-field behavior; real term template; inline failure/control recovery; late search race. Syntax evidence updated. Actual scrolling/touch/layout, server timeout and whole ERP coverage are NOT VERIFIED. No claim that all screenshots/issues are fully resolved.
