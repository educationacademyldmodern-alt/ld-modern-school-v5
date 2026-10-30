L D MODERN EDUCATION ACADEMY ERP — V496 ROOT FIXES

इस पैकेज में आपके चारों बिंदु जोड़े गए हैं:
1. Laptop Admin Dashboard: 1280–1599px desktop/laptop width पर stats, quick links और function cards को fit किया; cards कटने/overflow होने से रोकने के responsive नियम जोड़े।
2. Teacher Exam Marks: Teacher अपने assigned class + subject से सीधे Exams & Marks खोलकर exam के प्राप्तांक दर्ज/बदल सकेगा। Assignment Center में “Subject Exam Marks Entry” route भी उपलब्ध है। Marks केवल assigned class/subject में सेव होते हैं।
3. Parent Fee: Parent के linked बच्चे का due central RPC `ldm_v491_parent_fee_due(text)` से refresh होगा। Refresh verify न हो तो amount के स्थान पर “जाँच बाकी” रहेगा।
4. Admin Assign Work: Dashboard के सभी कामकाजी function routes assignment dropdown में हैं। Admin एक/कई teachers को चुने हुए module का पूरा module workflow active work date के दौरान दे सकता है। Assignment खत्म/बंद होने पर access नहीं रहता। Teacher को global Admin role नहीं दिया जाता और Work Delegation/role management केवल Admin के पास रहता है।

बदलने वाली source files:
- index.html
- admin-desktop-v445.css
- portal-flow-v455.js
- smart-work-v403.js
- V496_ASSIGNED_DASHBOARD_FUNCTIONS_SAFE.sql

इंस्टॉल:
A. मौजूदा site/source का backup लें। पहली चार files को उसी ERP root में replace करें।
B. Supabase SQL Editor में `V496_ASSIGNED_DASHBOARD_FUNCTIONS_SAFE.sql` एक बार चलाएँ। यह केवल Admin Dashboard routes को मौजूदा exact-assignment/date delegation allowlist में जोड़ता है; user roles नहीं बदलता।
C. Deploy के बाद laptop और teacher/parent portal पर hard refresh करें।

ज़रूरी स्थिति:
- Parent central due के लिए पहले से मौजूद V491 RPC और central due snapshot dependency installed होना जरूरी है। इस package में parent SQL नहीं बदला गया।
- SQL migration route assignment enable करती है। ERP के module-specific database policies अभी भी लागू रहेंगी; database से अस्वीकृत write को UI bypass नहीं करता।
- यह source update है; live database/site पर apply या deploy नहीं किया गया।
