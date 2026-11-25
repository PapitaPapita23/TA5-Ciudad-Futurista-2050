import sys, time, subprocess, tempfile, uno, os
from pathlib import Path
sys.path.insert(0, '/root/.claude/skills/synced/e5676100-3782-414b-9120-0fd63aab7b66_d7fdcbfc-a2b0-41a7-ba40-230fdb896c24/docx/scripts')
from office.soffice import get_soffice_env
from com.sun.star.beans import PropertyValue
def pv(n, v):
    p = PropertyValue(); p.Name = n; p.Value = v; return p
src, out = map(os.path.abspath, sys.argv[1:3])
prof = tempfile.mkdtemp(prefix='lo_prof_')
proc = subprocess.Popen(['soffice', f'-env:UserInstallation={Path(prof).as_uri()}', '--headless', '--invisible', '--norestore',
    '--accept=pipe,name=tocpipe;urp;'], env=get_soffice_env())
ctx = None
local = uno.getComponentContext()
resolver = local.ServiceManager.createInstanceWithContext('com.sun.star.bridge.UnoUrlResolver', local)
for _ in range(60):
    try:
        ctx = resolver.resolve('uno:pipe,name=tocpipe;urp;StarOffice.ComponentContext'); break
    except Exception:
        time.sleep(0.5)
desktop = ctx.ServiceManager.createInstanceWithContext('com.sun.star.frame.Desktop', ctx)
doc = desktop.loadComponentFromURL(uno.systemPathToFileUrl(src), '_blank', 0, (pv('Hidden', True),))
idx = doc.getDocumentIndexes()
for i in range(idx.getCount()): idx.getByIndex(i).update()
doc.refresh()
for i in range(idx.getCount()): idx.getByIndex(i).update()
print('indexes', idx.getCount())
doc.storeToURL(uno.systemPathToFileUrl(out), (pv('FilterName', 'writer_pdf_Export'),))
doc.close(True)
try: desktop.terminate()
except Exception: pass
proc.wait(timeout=30)
print('ok')
