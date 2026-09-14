from pathlib import Path
import re, sys

p = Path("index.html")
if not p.exists():
    raise SystemExit("STOP: index.html not found. Run this from the repository root.")

s = p.read_text(encoding="utf-8")
original = s

# 1) Remove old generated visual layers that are fighting with the approved V94 UI.
style_ids = [
    "v93-approved-admin-ui",
    "v92-hide-welcome",
    "v92-admin-topbar-fix",
    "v92-admin-readability-fix",
    "v92-compact-admin",
    "v92-admin-firstpage-compact",
]
for sid in style_ids:
    s = re.sub(
        rf'<style\s+id=["\']{re.escape(sid)}["\'][^>]*>.*?</style>',
        "",
        s,
        flags=re.I | re.S,
    )

old_assets = [
    r'<link[^>]+href=["\']premium-role-ui\.css[^"\']*["\'][^>]*>',
    r'<link[^>]+href=["\']premium-dashboard-v93\.css[^"\']*["\'][^>]*>',
    r'<script[^>]+src=["\']premium-dashboard-v93\.js[^"\']*["\'][^>]*>\s*</script>',
    r'<link[^>]+href=["\']v94-final-approved-ui\.css[^"\']*["\'][^>]*>',
    r'<script[^>]+src=["\']v94-final-approved-ui\.js[^"\']*["\'][^>]*>\s*</script>',
]
for pat in old_assets:
    s = re.sub(pat, "", s, flags=re.I)

# 2) Repair the malformed V69 instruction string that currently contains a raw newline
#    inside a single-quoted JavaScript string.
bad1 = "inst=v69CurrentExam?.instructions||'Bring this Admit Card and School ID.\nReach the examination room on time.';"
good1 = "inst=v69CurrentExam?.instructions||'Bring this Admit Card and School ID.\\nReach the examination room on time.';"
s = s.replace(bad1, good1)

bad2 = "inst=v69CurrentExam?.instructions||'Bring this Admit Card and School ID.\r\nReach the examination room on time.';"
s = s.replace(bad2, good1)

# 3) Link ONLY the final approved V94.4 layer.
css_file = Path("v94-final-approved-ui.css")
js_file = Path("v94-final-approved-ui.js")
if not css_file.exists() or not js_file.exists():
    raise SystemExit("STOP: v94-final-approved-ui.css / .js missing. Upload them first.")

css = '<link rel="stylesheet" href="v94-final-approved-ui.css?v=94.4">'
js = '<script defer src="v94-final-approved-ui.js?v=94.4"></script>'

if "</head>" not in s or "</body>" not in s:
    raise SystemExit("STOP: index.html head/body closing tag not found.")

s = s.replace("</head>", css + "</head>", 1)
s = s.replace("</body>", js + "</body>", 1)

# 4) Sanity checks before writing.
checks = {
    "old premium-role removed": "premium-role-ui.css" not in s,
    "old V93 CSS removed": "premium-dashboard-v93.css" not in s,
    "old V93 JS removed": "premium-dashboard-v93.js" not in s,
    "V94 CSS linked once": s.count("v94-final-approved-ui.css") == 1,
    "V94 JS linked once": s.count("v94-final-approved-ui.js") == 1,
    "V69 malformed newline repaired": bad1 not in s and bad2 not in s,
}
failed = [k for k,v in checks.items() if not v]
if failed:
    print("STOP CHECK FAILED:")
    for x in failed:
        print(" -", x)
    sys.exit(2)

p.write_text(s, encoding="utf-8")

print("V95 INDEX CLEAN + V94.4 BOOT REPAIR APPLIED")
for k,v in checks.items():
    print(("OK  " if v else "FAIL"), k)
print("index.html changed:", s != original)
