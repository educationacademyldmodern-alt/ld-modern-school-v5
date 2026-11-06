L D MODERN EDUCATION ACADEMY — Teacher Marks Entry targeted corrected package

इस ZIP में वर्तमान उपलब्ध Root Recheck का सबसे नया JS Patch है।
फाइलें: exam-central-v320.js, exam-dates-v475.js, 01_SAFE_CENTRAL_CHECK.sql, ROOT_AUDIT_STATUS.md.

सुधार: Save confirmation के बाद ही paper switch, pending retry, auto-save timer guard, local draft, maximum marks validation, mobile horizontal scroll.

महत्वपूर्ण: यह पूरा ERP नहीं है। Teacher paper-list backend permission, Assign Work router, Supabase live save और result synchronization को बिना पूरे root code और database definitions के verified FIXED नहीं कहा जा सकता।

इंस्टॉल: पुराने JS का backup लें, staging branch में original paths पर replace करें, duplicate scripts न जोड़ें, फिर teacher और admin दोनों से save/reload/subject change टेस्ट करें।
SQL केवल read-only diagnostic है, production schema modification नहीं।
