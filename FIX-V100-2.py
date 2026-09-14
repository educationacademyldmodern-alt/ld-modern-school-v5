from pathlib import Path
import re, sys, subprocess

INDEX=Path('index.html')
CSS=Path('premium-dashboard-v100.css')
JS=Path('premium-dashboard-v100.js')
for f in (INDEX,CSS,JS):
    if not f.exists():
        raise SystemExit(f'STOP: {f.name} not found. Run this in repository root.')

s=INDEX.read_text(encoding='utf-8')
js=JS.read_text(encoding='utf-8')
css=CSS.read_text(encoding='utf-8')

# 1) V100 CSS accidentally landed inside Admit Card print HTML.
# Remove every V100 stylesheet tag and insert one at the REAL page head/body boundary.
s=re.sub(r'<link[^>]+href=["\']premium-dashboard-v100\.css(?:\?[^"\']*)?["\'][^>]*>', '', s, flags=re.I)
real=re.search(r'</head>\s*<body>', s, flags=re.I)
if not real:
    raise SystemExit('STOP: real </head><body> boundary not found.')
link='<link rel="stylesheet" href="premium-dashboard-v100.css?v=100.2">'
s=s[:real.start()]+link+s[real.start():]

# Keep one V100 JS at the real final document body.
s=re.sub(r'<script[^>]+src=["\']premium-dashboard-v100\.js(?:\?[^"\']*)?["\'][^>]*>\s*</script>', '', s, flags=re.I)
body=s.lower().rfind('</body>')
if body < 0:
    raise SystemExit('STOP: final </body> not found.')
s=s[:body]+'<script src="premium-dashboard-v100.js?v=100.2"></script>'+s[body:]

# 2) Do not default an unknown/loading role to Teacher navigation.
old="const role100=()=>String(window.profile?.role||'viewer').toLowerCase();\n  const isAdmin100=()=>['super_admin','admin','principal'].includes(role100());\n  const isTeacher100=()=>role100()==='teacher';"
new="\n".join([
"const role100=()=>{",
"    let raw='';",
"    try{raw=window.profile?.role||((typeof profile!=='undefined'&&profile?.role)||'')}catch(_e){}",
"    return String(raw||'').trim().toLowerCase().replace(/[\\s-]+/g,'_');",
"  };",
"  const isAdmin100=()=>['super_admin','superadmin','admin','principal'].includes(role100());",
"  const isTeacher100=()=>role100()==='teacher';"
])
if old not in js:
    raise SystemExit('STOP: V100 role block not found.')
js=js.replace(old,new,1)

old="const nav=isAdmin100()?ADMIN_NAV100:TEACHER_NAV100;\n    const expected=nav.map(x=>x[0]);"
new="const nav=isAdmin100()?ADMIN_NAV100:(isTeacher100()?TEACHER_NAV100:null);\n    if(!nav)return;\n    const expected=nav.map(x=>x[0]);"
if old not in js:
    raise SystemExit('STOP: V100 nav block not found.')
js=js.replace(old,new,1)

# Header remembers role and is rebuilt if profile role changes after login finishes.
old="top.dataset.v100='1';"
new="top.dataset.v100='1';\n    top.dataset.v100Role=role100();"
if old not in js:
    raise SystemExit('STOP: V100 header marker not found.')
js=js.replace(old,new,1)

old="""const bad=top&&!top.classList.contains('v100Top');
        const legacy=top&&q(LEGACY_TOP100,top);
        if(bad||legacy)header100(activeRoute100);
        removeLegacyTop100();
        const nav=document.getElementById('erpNav');
        if(nav)buildNav100(activeRoute100);"""
new="""const bad=top&&!top.classList.contains('v100Top');
        const legacy=top&&q(LEGACY_TOP100,top);
        const knownRole=isAdmin100()||isTeacher100();
        const wrongRole=knownRole&&top&&top.dataset.v100Role!==role100();
        if(bad||legacy||wrongRole)header100(activeRoute100);
        removeLegacyTop100();
        const nav=document.getElementById('erpNav');
        if(nav&&knownRole)buildNav100(activeRoute100);"""
if old not in js:
    raise SystemExit('STOP: V100 ensureClean block not found.')
js=js.replace(old,new,1)

# 3) Stronger final CSS against older inline V63 styles.
marker='/* V100.2 FINAL ADMIN NAV + CSS CASCADE FIX */'
extra='''
/* V100.2 FINAL ADMIN NAV + CSS CASCADE FIX */
#erp.v100Shell .v100SideBrand:before{display:none!important;content:none!important}
#erp.v100Shell #erpNav.v100Nav{display:grid!important;gap:3px!important;padding-top:9px!important}
#erp.v100Shell #erpNav.v100Nav button{width:100%!important;margin:0!important;min-height:42px!important;border:0!important;background:transparent!important;color:#eaf4ff!important;display:grid!important;grid-template-columns:28px 1fr!important;align-items:center!important;text-align:left!important;padding:8px 9px!important;border-radius:10px!important;transform:none!important;box-shadow:none!important}
#erp.v100Shell #erpNav.v100Nav button:hover,#erp.v100Shell #erpNav.v100Nav button.active{background:linear-gradient(90deg,#10a0ff,#1474e8)!important;color:#fff!important;transform:none!important;box-shadow:0 8px 18px rgba(0,76,180,.20)!important}
#erp.v100Shell #erpContent:before{display:none!important;content:none!important;background:none!important}
#erp.v100Shell .dashHero{background:none!important;margin-top:0!important}
#erp.v100Shell .erpTop.v100Top{background:linear-gradient(90deg,#0754c0,#0b78e7)!important}
'''
if marker not in css:
    css += '\n'+extra+'\n'

checks={
    'V100 CSS linked once': s.count('premium-dashboard-v100.css')==1,
    'V100 CSS in real main head': s.find('premium-dashboard-v100.css') < s.find('<body'),
    'V100 JS linked once': s.count('premium-dashboard-v100.js')==1,
    'V100 JS at final body': s.rfind('premium-dashboard-v100.js') > s.rfind('<!-- ===== END V92 ===== -->'),
    'role normalization installed': "replace(/[\\s-]+/g,'_')" in js,
    'unknown role does not become teacher': '(isTeacher100()?TEACHER_NAV100:null)' in js,
    'role-aware nav refresh installed': 'if(nav&&knownRole)buildNav100(activeRoute100);' in js,
    'strong V100.2 CSS override installed': marker in css,
}
bad=[k for k,v in checks.items() if not v]
if bad:
    print('STOP — V100.2 CHECK FAILED')
    for k in bad: print('FAIL',k)
    sys.exit(2)

# JS syntax check before writing.
tmp=Path('.v1002-check.js')
tmp.write_text(js,encoding='utf-8')
try:
    r=subprocess.run(['node','--check',str(tmp)],capture_output=True,text=True)
    if r.returncode!=0:
        print(r.stderr)
        raise SystemExit('STOP: V100.2 JS syntax check failed.')
finally:
    try: tmp.unlink()
    except: pass

INDEX.write_text(s,encoding='utf-8')
JS.write_text(js,encoding='utf-8')
CSS.write_text(css,encoding='utf-8')

print('V100.2 ADMIN NAV + MAIN CSS FIX APPLIED')
for k,v in checks.items(): print('OK  ',k)
print('V100.2 JS syntax: PASS')
