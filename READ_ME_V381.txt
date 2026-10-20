L D MODERN EDUCATION ACADEMY
PREMIUM PAPER CENTRE — ADMIN + TEACHER — V381

UPLOAD / REPLACE THESE 5 FILES IN YOUR EXISTING ERP ROOT:
1. paper-center-v343.js
2. paper-center-v343.css
3. teacher-paper-form-v343.html
4. paper-premium-v381.js
5. paper-premium-v381.css

Extract the ZIP first. Upload the five files together into the same folder as index.html.
Do not upload this ZIP as an HTML link. No SQL is required.
Then refresh the ERP, close any paper already open and reopen Paper Centre.
On a computer use Ctrl+Shift+R if the old screen remains cached.
This is a changed-files patch for the existing V373/V378/V379/V380 Paper Centre,
not a standalone replacement ERP. Existing editor/import/typography/performance
assets already installed on the ERP are still needed.
The previous hindi-typing-v379.js / hindi-typing-v380.js files are no longer referenced
by this form. They do not need to be deleted. Do not add them to index.html.

WHAT YOU GET
- Premium desktop Paper Centre cards and full editor styling for both roles.
- Teacher: exam details in a desktop side panel, large question fields,
  collapsible quick-add composer and the existing question / marks workflow.
- Admin: clear exam details, model-paper cards and the existing inbox filters.
- Hindi / English language switch.
- Roman -> Hindi: namaste + Space = नमस्ते; bharat = भारत; vidyalay = विद्यालय.
- Direct Keyboard: use Hindi keyboard, pasted Hindi, English or mixed formulas.
- Up to five local word suggestions while typing; click one or use Alt+1 to Alt+5.
- Arrow keys select a suggestion; Tab accepts the selected suggestion.
  With no suggestion selected, Tab keeps its normal field-navigation behavior.
- Typing tools: optional autocorrection for a bounded list of common mistakes,
  suggestion switch, Undo, math symbols, and ready-made Hindi/English instructions.
- Autocorrection starts OFF. Roman-to-Hindi is phonetic conversion, not translation.
  This is a small school-vocabulary helper, not a full Hindi/English dictionary.
- Ctrl+Enter adds a question in the Teacher quick composer or adds a blank row
  when editing a Teacher question. Admin legacy composer also supports Ctrl+Enter.
  Admin model-paper fields use normal Tab navigation.
- Ctrl+Shift+Z restores the last typing-helper replacement; normal Ctrl+Z remains
  the browser's editing undo. Helper Undo works while its field is still present.
- Voice inserts into the last chosen question/option/answer field. Browser speech
  recognition and microphone permission are required. Speech availability and
  language accuracy depend on the browser/device; a browser may use online speech.
- Local draft behavior and existing central Save / Send remain distinct.
  Use Save draft / Send at the top for central storage.

LIGHTWEIGHT BEHAVIOR
The new helper runs only inside the paper editor. It adds no background polling,
large image assets, external typing libraries or remote suggestion requests.
Suggestions use a 90ms debounce and at most five choices. Preview is on demand.
The existing mobile form stays a single column; the added typing row is compact.
There is no guarantee of zero lag on every device or an untested live database.

TWO VERIFICATION ROUNDS
Round 1: executable inline scripts plus both changed JS files parsed successfully;
46 real Chromium browser checks passed with the actual parent Paper Centre and
iframe editor. Save requests used a mock RPC server, not your production database.
Round 2: 36 additional browser checks passed, plus review of all changed code,
file diffs, bounded work, IME, selection handling and cleanup.
Tested sizes: 360, 390, 768, 1024, 1366, 1440 and 1920 pixel widths across checks.
Each role handled 300 input events without new preview pagination or network calls.
These are short synthetic tests; they are not an all-day real-device soak test.
Voice insertion was tested using mocked speech events, not a physical microphone.
Print CSS hiding and preview data consistency were tested; physical print and live
ERP login, real role permissions, production RPC/database writes were not tested.
Existing login, index.html, student records and database schema were not modified.
See QA_V381.json and SHA256.json for the check results and file hashes.
