# SKY SIR FULL STATIC + TEACHER EXAM HUB F2

This build upgrades the existing Teacher Exam F1 package into a self-contained static preparation hub.

## What the teacher/student sees
1. Open Competition Hub.
2. Use FULL STATIC on UP Primary/TRE cards, or open Full Static Master Library.
3. Choose Exam filter → Subject → Chapter.
4. Read Complete Static Notes + Exam Focus + One-Line Revision.
5. Run Chapter Quiz or Subject Test.
6. Press ONE-CLICK PPT to download a 16:9 PPTX of that static chapter.
7. Print Notes if required.

## Important
- No login is required to read the preloaded static library.
- `config.js` is intentionally not included in the safe-upload package; keep the existing configured file in GitHub.
- No SQL rerun is required for F2 static content.
- Current Affairs stays separate because static packaging must not silently turn old current affairs into current facts.

## Upload
Upload/replace all files from the F2 safe-upload ZIP into the existing `sky-sir-teaching-studio` repository root. Keep the existing `config.js`. Commit and allow Vercel to redeploy.
