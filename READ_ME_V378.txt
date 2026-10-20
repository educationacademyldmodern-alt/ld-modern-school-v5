L D MODERN ERP — V378 DESKTOP PREMIUM

Admin और Teacher dashboard के laptop/computer layout का update.

INSTALL
1. अपने चालू ERP की नीचे दी गई 7 files का backup लें.
2. ZIP की ये 7 web files उसी ERP folder में upload/replace करें जहाँ index.html है:
   index.html
   dashboard-order-v350.js
   desktop-premium-v378.css
   desktop-premium-v378.js
   dashboard-parent-style-v374.css
   paper-center-v343.js
   paper-smart-v358.js
3. बाकी ERP files रहने दें. यह existing updated ERP का patch है, standalone ERP नहीं.
4. Browser में Ctrl+Shift+R करें, फिर Admin और Teacher login से Dashboard खोलें.
5. School navigation के लिए ऊपर Menu खोलें. Paper Inbox/My Papers ऊपर उपलब्ध है.

इस update के लिए SQL नहीं चलाना है.

SCOPE
नया layout केवल dashboard route पर screen width 901px या अधिक में लागू होता है.
Mobile widths 900px और नीचे पर नया layout mount नहीं होता.
Parent dashboard पर नया layout लागू नहीं होता.
एक समान school banner, profile/welcome section, summary और रंगीन module cards.
बड़े helper/development panels modules के बाद आते हैं.
पुराने modules, उनकी permissions और save/send handlers रखे गए हैं.
Paper Center के V377 fixes इस ZIP में बिना बदलाव शामिल हैं.

VERIFICATION
Actual retained Admin/Teacher render functions and dashboard scripts tested locally
with representative in-memory context, summary HTML and mocked server responses.
Admin + Teacher at 1024, 1366, 1600px: no horizontal overflow or clipped module cards;
Menu, Profile, Paper route, Attendance route and resize restoration passed.
Admin + Teacher at 390, 768, 900px: ERP DOM and module card computed styles identical.
All preexisting inline JavaScript blocks in index.html are byte-identical to V377.
No additional database request or polling is introduced by the desktop theme.
Live production ERP/database and your physical devices have not been tested here.
QA_DESKTOP_MOBILE.json has the local verification results.

ROLLBACK
Restore the backed-up files, remove the two desktop-premium-v378 files if desired,
and hard-refresh the browser.
