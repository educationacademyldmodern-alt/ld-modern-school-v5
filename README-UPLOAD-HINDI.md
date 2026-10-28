# केवल सुधार वाली वेबसाइट फाइलें — V468 तक

इस ZIP में 25 application files हैं। आपकी पहले दी हुई मूल ERP ZIP से लेकर V464 audit, V465 Marks, V466 Parent Due और V467–V468 Login/Performance तक के latest corrected files साथ हैं। यह केवल V467→V468 delta नहीं है। “V288” नाम वाली मूल ZIP में पहले से बाद के versions का code था; इसे pristine historical V288 नहीं माना गया है।

1. मौजूदा website/project का backup लें। मूल दी गई ZIP से मिलते project पर यह patch लगाएँ। किसी अलग/newer production source पर बिना compare overwrite न करें; ऐसे में पूरा V468 package उपयोग करें।
2. इस ZIP को Extract करें। index.html तथा अन्य code/assets को उसी existing website root में रखें; api/ folder को api/ में merge करें। केवल इन files को replace करें; बाकी files/folders delete न करें।
3. Existing hosting environment variables, Supabase configuration और API deployment सुरक्षित रखें। ZIP के अंदर एक extra nested folder बनाकर upload न करें। Source update अकेले existing Supabase RPC dependencies install नहीं करता।
4. Deploy और एक बार refresh करें। Login, Search, Save/reopen, Attendance, assigned Bell Marks और Parent/Admin due test accounts से जाँचें।

SQL इस ZIP में नहीं है। अलग LDM-MARKS-PARENT-DUE-SQL.zip में पहले तैयार V465/V466 scripts हैं। V467/V468 का नया SQL नहीं है। पहले से installed migration को अनावश्यक दोबारा न चलाएँ। Missing/भिन्न RPC पर SQL के preflight result और live definitions review जरूरी है।

इन application files के bytes verified full V468 ZIP से समान हैं। कोई नया source-code edit नहीं किया गया; यह tested files का अलग cumulative package है। पिछली दो rounds में 167–167 local case runs पास थे, backend mocked/SQL fixture-based था; live production E2E/log ingestion अभी unverified है। Production data/SQL इस packaging में नहीं बदला।
