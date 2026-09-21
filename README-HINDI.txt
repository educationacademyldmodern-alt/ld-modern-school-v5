L D MODERN EDUCATION ACADEMY — V64.20 FINAL STABLE AUDITED SAFE FIX

यह package V64.17 पर हुए audit/fix और V64.19 recheck के बाद final cleanup build है।

Deploy order:
1) Production backup/branch सुरक्षित रखें।
2) Supabase SQL Editor में LDMEA-V64.20-SAFE-MIGRATION-2026-09-20.sql run करें।
3) index.html को पहले preview/test branch पर deploy करें।
4) Admin/Teacher/Parent login, session, navigation, photo/camera, fee notice, mobile और desktop live test करें।
5) Live checks pass होने के बाद ही Production promote करें।

SQL non-destructive/idempotent support migration है। Live diagnostic proof के बिना किसी trigger/RLS को blindly drop/replace नहीं किया गया है।
