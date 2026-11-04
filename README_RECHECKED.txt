L D MODERN EDUCATION ACADEMY — RECHECKED JS PATCH

Replace the contents of the existing exam-central-v320.js and exam-dates-v475.js with the corresponding RECHECKED files (keep original repository filenames). Do not paste into Supabase SQL Editor.

Checked: missing/non-function examDates475 guard; fallback to central marks when openTeacherEntry473 missing; blank marks cannot be saved as zero; empty authorized roster reported clearly; JavaScript syntax verified.

Important: The source SQL uses teacher bells filtering and existing V320 permissions. These files alone cannot guarantee all teachers can save marks. SQL function definitions and live Supabase permissions must be tested separately. No production/browser integration test performed.
