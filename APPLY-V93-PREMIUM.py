from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
css='premium-dashboard-v93.css'
js='premium-dashboard-v93.js'
css_tag=f'<link rel="stylesheet" href="{css}?v=93">'
js_tag=f'<script defer src="{js}?v=93"></script>'
changed=False
if css not in s:
    s=s.replace("</head>",css_tag+"</head>",1); changed=True
if js not in s:
    s=s.replace("</head>",js_tag+"</head>",1); changed=True
p.write_text(s,encoding="utf-8")
print("V93 PREMIUM DASHBOARD LINKED" if changed else "V93 ALREADY LINKED")
