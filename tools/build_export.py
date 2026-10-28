"""Build a self-contained, portable export of the Lux Flow prototype.
Output: export/lux-flow-export/ (+ zip). Works from file:// with no Claude services:
- images copied from the artifact asset store copies into assets/images/ with relative paths
- dc runtime + React vendored locally (window.__resources overrides the CDN URLs)
- sibling components (Flower, Logo) embedded as Blobs via window.__resourceBlobs (no fetch needed on file://)
"""
import base64, json, os, re, shutil, hashlib
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.join(ROOT, 'lux', 'project')
BLOB = os.path.join(ROOT, 'render', '_blob')
OUT = os.path.join(ROOT, 'export', 'lux-flow-export')
REACT = 'https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js'
REACTDOM = 'https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js'

shutil.rmtree(OUT, ignore_errors=True)
for d in ['runtime', 'vendor', 'assets/images/people', 'assets/images/scenes', 'assets/images/illustrations', 'assets/images/banners', 'assets/brand']:
    os.makedirs(os.path.join(OUT, d), exist_ok=True)

main = open(os.path.join(PROJ, 'Main.dc.html'), encoding='utf-8').read()
IMG = json.loads(re.search(r'var IMG = (\{.*?\});', main).group(1))
LOC = json.loads(re.search(r'var IMG_LOCAL = (\{.*?\});', main).group(1))
assert set(IMG) == set(LOC)

# 1. images: copy byte-identical originals (no re-encoding, so crops/transparency/quality are preserved)
seen = {}
report = []
for k, url in IMG.items():
    src = os.path.join(BLOB, url.split('/')[-1])
    dst = os.path.join(OUT, LOC[k])
    data = open(src, 'rb').read()
    h = hashlib.sha256(data).hexdigest()
    if h in seen: print('DUPLICATE', k, 'same bytes as', seen[h])
    seen[h] = k
    open(dst, 'wb').write(data)
    im = Image.open(dst)
    expected = 'WEBP' if dst.endswith('.webp') else 'JPEG'
    assert im.format == expected, (k, im.format)
    report.append((LOC[k], im.format, im.size, im.mode, len(data)))
shutil.copy(os.path.join(PROJ, 'assets', 'ten-systems-flower.svg'), os.path.join(OUT, 'assets/brand/ten-systems-flower.svg'))

# 2. runtime + vendor
shutil.copy(os.path.join(ROOT, 'render', 'support.js'), os.path.join(OUT, 'runtime/dc-runtime.js'))
shutil.copy(os.path.join(ROOT, 'vendor', 'react.production.min.js'), os.path.join(OUT, 'vendor/react.production.min.js'))
shutil.copy(os.path.join(ROOT, 'vendor', 'react-dom.production.min.js'), os.path.join(OUT, 'vendor/react-dom.production.min.js'))

def components_used(html):
    return sorted(set(re.findall(r'<dc-import name="([A-Za-z]+)"', html)))

def bootstrap(names):
    res = {REACT: 'vendor/react.production.min.js', REACTDOM: 'vendor/react-dom.production.min.js'}
    blobs = {}
    for n in names:
        res['./%s.dc.html' % n] = 'dc:%s' % n
        blobs['dc:%s' % n] = base64.b64encode(open(os.path.join(PROJ, n + '.dc.html'), 'rb').read()).decode()
    return ('<script>\n/* Portable export: resolve the runtime\'s CDN scripts and sibling components locally (works from file://) */\n'
            'window.__resources = ' + json.dumps(res) + ';\n'
            '(function(b){ var o = {}; for (var k in b) { var s = atob(b[k]), u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); o[k] = new Blob([u], {type:"text/html"}); } window.__resourceBlobs = o; })('
            + json.dumps(blobs) + ');\n</script>\n<script src="runtime/dc-runtime.js"></script>')

def export_page(src_name, out_name, transform=None):
    html = open(os.path.join(PROJ, src_name), encoding='utf-8').read()
    if transform: html = transform(html)
    names = components_used(html)
    # components may import other components
    for n in list(names):
        for m in components_used(open(os.path.join(PROJ, n + '.dc.html'), encoding='utf-8').read()):
            if m not in names: names.append(m)
    assert html.count('<script src="./support.js"></script>') == 1
    html = html.replace('<script src="./support.js"></script>', bootstrap(names))
    assert '/_blob/' not in html, src_name
    open(os.path.join(OUT, out_name), 'w', encoding='utf-8').write(html)
    return names

def main_local(html):
    # point the primary map at the portable files too, so nothing ever requests the hosted store
    old = re.search(r'var IMG = \{.*?\};', html).group(0)
    return html.replace(old, 'var IMG = ' + json.dumps(LOC) + ';').replace('<title>Lux Flow prototype</title>', '<title>Lux Flow — prototype</title>')

pages = {'index.html': export_page('Main.dc.html', 'index.html', main_local),
         'foundations.html': export_page('Foundations.dc.html', 'foundations.html'),
         'brand.html': export_page('Brand.dc.html', 'brand.html'),
         'admin.html': export_page('Admin.dc.html', 'admin.html')}

open(os.path.join(OUT, 'README.txt'), 'w').write('''Lux Flow — portable prototype export
=====================================
Open index.html in a browser (double-click works; no server needed).
  index.html        Prototype. Mobile layout below 960px wide, desktop layout above.
  foundations.html  Living design system.
  brand.html        Brand exploration board (proposals) incl. website mock.
  admin.html        Admin console (Trust & Safety / Integrity).

Everything the pages need is in this folder:
  runtime/          Prototype runtime
  vendor/           React 18.3.1 (local copy, so it also works offline)
  assets/images/    people/ (avatars), scenes/ (post, community and System photos), illustrations/ (Ten Systems figure)
  assets/brand/     Ten Systems flower (SVG)

Only the Inter Tight web font loads from Google Fonts; offline, text falls back to Helvetica/Arial.
Prototype data is saved in your browser's local storage; use "Reset demo data" in Prototype controls to start over.
Photography: Pexels License (see the project notes); replace identifiable people with owned/model-released images before production.
''')
for r in report: print('%-58s %-4s %-11s %-4s %7d' % (r[0], r[1], '%dx%d' % r[2], r[3], r[4]))
print('pages', pages)
