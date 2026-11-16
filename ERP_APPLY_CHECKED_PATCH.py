"""Offline, checksum-gated patch assembly. Original ZIP is never changed."""
import argparse,hashlib,json,zipfile
from pathlib import Path

def digest(data):return hashlib.sha256(data).hexdigest()
def main():
 p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('--output',required=True,type=Path);a=p.parse_args()
 here=Path(__file__).resolve().parent;m=json.loads((here/'ERP_CHANGED_FILES_MANIFEST.json').read_text());patch=here/'ERP_FIXED_FILES_ONLY.zip'
 if a.output.exists():p.error('Output already exists; choose a new path.')
 if a.source.resolve()==a.output.resolve():p.error('Original ZIP cannot be overwritten.')
 if digest(a.source.read_bytes())!=m['source_sha256']:p.error('Source mismatch. Do not apply this patch to a different ERP ZIP.')
 with zipfile.ZipFile(a.source) as original,zipfile.ZipFile(patch) as changed:
  if original.testzip() or changed.testzip():p.error('Damaged archive.')
  expected={f['path'] for f in m['files']}
  if set(changed.namelist())!=expected:p.error('Patch entry mismatch.')
  if len(set(original.namelist()))!=len(original.namelist()):p.error('Duplicate source entries.')
  for f in m['files']:
   if (f['old_sha256'] is None and f['path'] in original.namelist()) or (f['old_sha256'] is not None and digest(original.read(f['path']))!=f['old_sha256']) or digest(changed.read(f['path']))!=f['new_sha256']:p.error('File checksum mismatch: '+f['path'])
  with a.output.open('xb') as stream:
   with zipfile.ZipFile(stream,'w',zipfile.ZIP_DEFLATED) as result:
    for info in original.infolist():result.writestr(info,changed.read(info.filename) if info.filename in expected else original.read(info.filename))
    for f in m['files']:
     if f['old_sha256'] is None:result.writestr(f['path'],changed.read(f['path']))
 print('Created separate staging ZIP. Original unchanged. Test before deploying:',a.output)
if __name__=='__main__':main()
