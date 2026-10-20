LDM V379 — PAPER HINDI TYPING

कारण: पहले Language=Hindi पेपर का भाषा/labels बदलता था; English keyboard की typing को हिन्दी में बदलने की सुविधा नहीं थी.

UPLOAD
1. पुराने teacher-paper-form-v343.html और paper-center-v343.js का backup लें.
2. ZIP की ये 3 web files उसी ERP root में upload/replace करें:
   teacher-paper-form-v343.html
   paper-center-v343.js
   hindi-typing-v379.js
3. बाकी files न हटाएँ. यह आपके existing updated ERP के लिए छोटा patch है.
4. Paper editor बन्द करें. ERP पर Ctrl+Shift+R / hard refresh करें, फिर पेपर खोलें.
SQL नहीं चलाना है. index.html और dashboard styles इस patch में नहीं बदले हैं.

USE
पेपर की भाषा हिन्दी चुनें. ऊपर "हिन्दी टाइपिंग / Typing" में:
- "सीधा Keyboard": हिन्दी keyboard से हिन्दी लिखें; English और गणित जैसा लिखें वैसा रहेगा.
- "Roman → हिन्दी": namaste लिखें, Space दबाएँ → नमस्ते.
  bhaarat → भारत; vidyaalay → विद्यालय; prashn → प्रश्न.
  प्रश्न, विकल्प, दायाँ मिलान और उत्तर में काम करता है.
- गलत बदला शब्द हो तो "आखिरी शब्द वापस करें" दबाएँ, या सीधा Keyboard चुनकर सुधारें.
यह phonetic typing है, translation या सभी English spellings का समझदार conversion नहीं.
पुराने प्रश्न, paste किया text और पहले से लिखी हिन्दी को अपने आप नहीं बदलता.
Hindi चुनने पर भी default सीधा Keyboard रहता है; Roman सुविधा स्वयं चुनें.
Mobile Gboard Hindi/native input और laptop Hindi keyboard भी इस्तेमाल कर सकते हैं.
बोलकर लिखने वाला पुराना button भी बना रहता है; उसकी उपलब्धता browser पर निर्भर है.
टाइप किया text conversion के लिए किसी external service को नहीं भेजा जाता.

CHECKED LOCALLY
Actual paper form + retained teacher editor/workspace/performance scripts.
Teacher/Admin at 390 and 1366px: direct Hindi, Roman input, undo, native composition,
English typing, draft preservation on language change, capture final word and Hindi payload.
Mobile-style insertText without keydown checked.
Teacher full Master and Admin model: question/options + preview checked.
Server save/send permissions and handlers unchanged; this is not a live production database test.
Dashboard design files unchanged. No SQL.
