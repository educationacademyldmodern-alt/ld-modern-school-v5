from pathlib import Path
import re
p=Path("index.html")
s=p.read_text(encoding="utf-8")

# Remove ONLY older generated dashboard visual layers so they cannot overlap V94.
# Core historical app CSS/JS and all data/auth/business logic remain untouched.
style_ids=[
  'v93-approved-admin-ui','v92-hide-welcome','v92-admin-topbar-fix',
  'v92-admin-readability-fix','v92-compact-admin','v92-admin-firstpage-compact'
]
for sid in style_ids:
    s=re.sub(r'<style\\s+id=["\\\']'+re.escape(sid)+r'["\\\'][^>]*>.*?</style>','',s,flags=re.I|re.S)

patterns=[
 r'<link[^>]+href=["\\\']premium-role-ui\\.css[^"\\\']*["\\\'][^>]*>',
 r'<link[^>]+href=["\\\']premium-dashboard-v93\\.css[^"\\\']*["\\\'][^>]*>',
 r'<script[^>]+src=["\\\']premium-dashboard-v93\\.js[^"\\\']*["\\\'][^>]*>\\s*</script>',
 r'<link[^>]+href=["\\\']v94-final-approved-ui\\.css[^"\\\']*["\\\'][^>]*>',
 r'<script[^>]+src=["\\\']v94-final-approved-ui\\.js[^"\\\']*["\\\'][^>]*>\\s*</script>',
]
for pat in patterns:
    s=re.sub(pat,'',s,flags=re.I)

css='<link rel="stylesheet" href="v94-final-approved-ui.css?v=94.3">'
js='<script defer src="v94-final-approved-ui.js?v=94.3"></script>'
s=s.replace('</head>',css+'</head>',1)
s=s.replace('</body>',js+'</body>',1)
p.write_text(s,encoding='utf-8')
print('V94.3 CLEAN + FAST APPROVED UI LINKED')
