LDM ERP Factory Pro V255 — Demo/Public Config Root Fix

WHAT IS FIXED
- Demo links work even when factory-public-config.js is still placeholder.
- Customer ERP links get the same fallback.
- Owner Studio uses its already-saved Studio URL + publishable/anon key and places ONLY that public bootstrap in the URL fragment (#ldmcfg=...).
- No service_role/private/provider secret is placed in links or frontend.
- If a real factory-public-config.js is deployed later, links automatically stay clean (no fragment fallback needed).
- ← ERP now returns to https://ld-modern-school-v5.vercel.app/

DEPLOY
Upload ALL files in this folder together to the existing ldm-erp-factory-pro Vercel project using the same Vercel Drop method.
After deploy, reopen Studio and use Send Demo / Copy Link again so a fresh fallback-capable demo link is generated.
Existing old token-only demo links created before V255 do not contain the fallback and should be re-shared.
