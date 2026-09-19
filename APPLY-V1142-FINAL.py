#!/usr/bin/env python3
from pathlib import Path
import re, sys

p=Path("index.html")
if not p.exists():
    raise SystemExit("ERROR: index.html not found. Run this from repo root.")

s=p.read_text(encoding="utf-8")

# Remove only earlier external links for these final patch assets; never touch app functions.
patterns=[
    r'\s*<link[^>]+href=["\'][^"\']*public-final\.css[^"\']*["\'][^>]*>',
    r'\s*<link[^>]+href=["\'][^"\']*dashboard-final\.css[^"\']*["\'][^>]*>',
    r'\s*<script[^>]+src=["\'][^"\']*public-final\.js[^"\']*["\'][^>]*>\s*</script>',
    r'\s*<script[^>]+src=["\'][^"\']*website-control\.js[^"\']*["\'][^>]*>\s*</script>',
    r'\s*<script[^>]+src=["\'][^"\']*dashboard-final\.js[^"\']*["\'][^>]*>\s*</script>',
]
for pat in patterns:
    s=re.sub(pat,'',s,flags=re.I)

head=s.lower().rfind("</head>")
body=s.lower().rfind("</body>")
if head<0 or body<0:
    raise SystemExit("ERROR: index.html head/body closing tag not found.")

css='\n<link rel="stylesheet" href="public-final.css?v=V1142FINAL1">\n<link rel="stylesheet" href="dashboard-final.css?v=V1142FINAL1">\n'
s=s[:head]+css+s[head:]

# body index moved after CSS insertion
body=s.lower().rfind("</body>")
js='\n<script src="public-final.js?v=V1142FINAL1"></script>\n<script src="website-control.js?v=V1142FINAL1"></script>\n<script src="dashboard-final.js?v=V1142FINAL1"></script>\n'
s=s[:body]+js+s[body:]

p.write_text(s,encoding="utf-8")

checks={
 "PUBLIC CSS":s.count('public-final.css?v=V1142FINAL1'),
 "DASH CSS":s.count('dashboard-final.css?v=V1142FINAL1'),
 "PUBLIC JS":s.count('public-final.js?v=V1142FINAL1'),
 "WEBSITE CONTROL JS":s.count('website-control.js?v=V1142FINAL1'),
 "DASH JS":s.count('dashboard-final.js?v=V1142FINAL1'),
}
for k,v in checks.items(): print(f"{k} = {v}")
if any(v!=1 for v in checks.values()):
    raise SystemExit("ERROR: link count is not exactly 1")
print("PATCH LINKING COMPLETE")
