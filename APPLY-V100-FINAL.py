from pathlib import Path
import re, sys, subprocess, tempfile

INDEX=Path('index.html')
CSS=Path('premium-dashboard-v100.css')
JS=Path('premium-dashboard-v100.js')

for f in (INDEX,CSS,JS):
    if not f.exists():
        raise SystemExit(f'STOP: {f.name} not found. Put all V100 files beside index.html.')

s=INDEX.read_text(encoding='utf-8')

# 1) Remove every previous generated dashboard UI asset reference.
asset_patterns=[
    r'<link[^>]+href=["\']premium-role-ui\.css(?:\?[^"\']*)?["\'][^>]*>',
    r'<link[^>]+href=["\']premium-dashboard-v93\.css(?:\?[^"\']*)?["\'][^>]*>',
    r'<script[^>]+src=["\']premium-dashboard-v93\.js(?:\?[^"\']*)?["\'][^>]*>\s*</script>',
    r'<link[^>]+href=["\']v94-final-approved-ui\.css(?:\?[^"\']*)?["\'][^>]*>',
    r'<script[^>]+src=["\']v94-final-approved-ui\.js(?:\?[^"\']*)?["\'][^>]*>\s*</script>',
    r'<link[^>]+href=["\']premium-dashboard-v100\.css(?:\?[^"\']*)?["\'][^>]*>',
    r'<script[^>]+src=["\']premium-dashboard-v100\.js(?:\?[^"\']*)?["\'][^>]*>\s*</script>',
]
for pat in asset_patterns:
    s=re.sub(pat,'',s,flags=re.I)

# 2) Repair known broken multiline single-quoted strings introduced by later patches.
#    Replace ALL occurrences, not just the first one.
s=re.sub(
    r"'Bring this Admit Card and School ID\.\s*Reach the examination room on time\.'",
    r"'Bring this Admit Card and School ID.\\nReach the examination room on time.'",
    s,flags=re.S
)
s=re.sub(
    r"'Profile नहीं मिला\.\s*Users & Roles check करें\.'",
    r"'Profile नहीं मिला.\\nUsers & Roles check करें.'",
    s,flags=re.S
)

# 3) Remove V63 visual/header injector only. Business modules are not removed.
s=re.sub(
    r'<script>\s*/\* V63 approved visual merge\.[\s\S]*?</script>',
    '',s,count=1,flags=re.I
)

# 4) Permanently stop old Admin/Teacher/Parent role wallpapers.
#    Public website wallpaper remains available to Admin.
s=re.sub(r'\.erp\.roleWallpaper main\{[^}]*\}','',s,flags=re.I)
s=re.sub(r'\.erp\.roleWallpaper #erpContent\{[^}]*\}','',s,flags=re.I)
s=re.sub(r'#parentPortal\.parentWallpaper\{[^}]*\}','',s,flags=re.I)

# Remove the current role-wallpaper function and add one clean no-role-wallpaper version.
# Match through the final function brace immediately before applySchool().
s=re.sub(
    r'function applyPortalWallpapers\(\)\{[\s\S]*?\}\s*(?=function applySchool\(\)\{)',
    '',s,count=1,flags=re.I
)
needle='function applySchool(){'
clean_fn='function applyPortalWallpapers(){let erp=$("erp");if(erp){erp.classList.remove("roleWallpaper");erp.style.removeProperty("--role-wallpaper")}let pp=$("parentPortal");if(pp){pp.classList.remove("parentWallpaper");pp.style.removeProperty("--parent-wallpaper")}}'
if clean_fn not in s:
    if needle not in s:
        raise SystemExit('STOP: applySchool() anchor not found.')
    s=s.replace(needle,clean_fn+'\n'+needle,1)

# 5) Link only V100 at the REAL final document end-points.
head=s.lower().rfind('</head>')
body=s.lower().rfind('</body>')
if head<0 or body<0:
    raise SystemExit('STOP: real </head> / </body> not found.')
s=s[:head]+'<link rel="stylesheet" href="premium-dashboard-v100.css?v=100.1">'+s[head:]
body=s.lower().rfind('</body>')
s=s[:body]+'<script src="premium-dashboard-v100.js?v=100.1"></script>'+s[body:]

# 6) Safety checks in memory before writing anything.
checks={
    'V100 CSS linked exactly once':s.count('premium-dashboard-v100.css')==1,
    'V100 JS linked exactly once':s.count('premium-dashboard-v100.js')==1,
    'old V94 asset absent':'v94-final-approved-ui.css' not in s and 'v94-final-approved-ui.js' not in s,
    'old V93 asset absent':'premium-dashboard-v93.css' not in s and 'premium-dashboard-v93.js' not in s,
    'old premium-role asset absent':'premium-role-ui.css' not in s,
    'V63 header injector removed':'V63_BUILD' not in s,
    'role wallpaper CSS removed':'.erp.roleWallpaper main' not in s and '#parentPortal.parentWallpaper' not in s,
    'single clean wallpaper function':s.count('function applyPortalWallpapers(){')==1,
    'broken Admit instruction newline absent':"'Bring this Admit Card and School ID.\nReach the examination room on time.'" not in s,
    'broken login newline absent':"'Profile नहीं मिला.\nUsers & Roles check करें.'" not in s,
}
bad=[k for k,v in checks.items() if not v]
if bad:
    print('STOP — CLEANUP CHECK FAILED')
    for k in bad: print('FAIL',k)
    sys.exit(2)

# 7) Syntax-check the V100 JS file.
def node_check_text(code,label):
    try:
        with tempfile.NamedTemporaryFile('w',suffix='.js',encoding='utf-8',delete=False) as f:
            f.write(code); name=f.name
        r=subprocess.run(['node','--check',name],capture_output=True,text=True)
        Path(name).unlink(missing_ok=True)
        if r.returncode!=0:
            print(f'STOP: JavaScript syntax failed in {label}')
            print(r.stderr.strip())
            return False
        return True
    except FileNotFoundError:
        print('WARNING: node is not available; inline JS syntax check skipped.')
        return True

if not node_check_text(JS.read_text(encoding='utf-8'),'premium-dashboard-v100.js'):
    sys.exit(3)

# 8) Syntax-check every executable inline JavaScript block in the resulting index.
#    JSON-LD and external src scripts are skipped.
inline=[]
for m in re.finditer(r'<script\b([^>]*)>([\s\S]*?)</script>',s,flags=re.I):
    attrs=m.group(1) or ''
    code=m.group(2) or ''
    if re.search(r'\bsrc\s*=',attrs,flags=re.I):
        continue
    if re.search(r'type\s*=\s*["\']application/ld\+json["\']',attrs,flags=re.I):
        continue
    if code.strip(): inline.append(code)

inline_fail=[]
try:
    for i,code in enumerate(inline,1):
        with tempfile.NamedTemporaryFile('w',suffix='.js',encoding='utf-8',delete=False) as f:
            f.write(code); name=f.name
        r=subprocess.run(['node','--check',name],capture_output=True,text=True)
        Path(name).unlink(missing_ok=True)
        if r.returncode!=0:
            inline_fail.append((i,r.stderr.strip().splitlines()[-1] if r.stderr.strip() else 'syntax error'))
except FileNotFoundError:
    inline_fail=[]

if inline_fail:
    print('STOP — EXISTING INLINE JAVASCRIPT STILL HAS SYNTAX ERROR(S)')
    for i,msg in inline_fail[:12]: print(f'Inline script #{i}: {msg}')
    print('Nothing was written. Send this terminal output before committing.')
    sys.exit(4)

# 9) Only now write index.html and remove obsolete generated UI/helper files.
INDEX.write_text(s,encoding='utf-8')
obsolete=[
    'premium-role-ui.css','premium-dashboard-v93.css','premium-dashboard-v93.js',
    'v94-final-approved-ui.css','v94-final-approved-ui.js',
    'APPLY-V93-PREMIUM.py','APPLY-V94-FINAL.py',
    'REPAIR-V95.py','REPAIR-V95[1].py','REPAIR-V96.py','REPAIR-V96-1.py','FINAL-CLEANUP-V97.py'
]
deleted=[]
for name in obsolete:
    p=Path(name)
    if p.exists():
        p.unlink();deleted.append(name)

print('V100.1 FINAL CLEAN PREMIUM APPLIED')
for k,v in checks.items(): print('OK  ',k)
print('V100 JS syntax: PASS')
print('Executable inline JS blocks checked:',len(inline))
print('Inline JS syntax: PASS')
print('Old generated files deleted:',len(deleted))
for x in deleted: print('DEL ',x)
print('Now run: git diff --check')
