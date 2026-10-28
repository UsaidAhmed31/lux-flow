"""Single-file, mobile Lux Flow prototype: everything (runtime, React, components, all 27 images) inside one HTML.
On phones / narrow windows it runs full-screen. On wider screens it shows the same file inside a 390x844 phone frame,
so the mobile layout is what you see everywhere."""
import base64, json, os, re
ROOT = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.join(ROOT, 'lux', 'project')
EXP = os.path.join(ROOT, 'export', 'lux-flow-export')
OUT = '/mnt/user-data/outputs/lux-flow-complete.html'
REACT = 'https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js'
REACTDOM = 'https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js'
b64 = lambda p: base64.b64encode(open(p, 'rb').read()).decode()

html = open(os.path.join(PROJ, 'Main.dc.html'), encoding='utf-8').read()
LOC = json.loads(re.search(r'var IMG_LOCAL = (\{.*?\});', html).group(1))
DATA = {}
for k, rel in LOC.items():
    mime = 'image/webp' if rel.endswith('.webp') else 'image/jpeg'
    DATA[k] = 'data:%s;base64,%s' % (mime, b64(os.path.join(EXP, rel)))
html = html.replace(re.search(r'var IMG = \{.*?\};', html).group(0), 'var IMG = ' + json.dumps(DATA) + ';')
html = html.replace(re.search(r'var IMG_LOCAL = \{.*?\};', html).group(0), 'var IMG_LOCAL = IMG; /* single-file build: every image is embedded */')
html = html.replace('<title>Lux Flow prototype</title>', '<title>Lux Flow — Phase 1 prototype (mobile, web, admin)</title>\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cut">\n<meta name="theme-color" content="#0A0912">\n<style>html,body{scrollbar-width:none}html::-webkit-scrollbar,body::-webkit-scrollbar{display:none}</style>')
assert '/_blob/' not in html

boot = '''<script>
/* Lux Flow prototype — single self-contained file with a Web / Mobile view switch. */
(function(){
  var R = __LF_RES__; window.__LF_R = R;
  var framed = window.self !== window.top;
  var phone = window.innerWidth <= 600;
  if (!framed && !phone) {
    /* Viewer shell: a Web / Mobile switch above the prototype. The prototype itself runs in a frame of this same file. */
    window.__lfFramePage = true;
    var ADMIN_HTML = __LF_ADMIN__;
    var mode = 'web'; try { mode = localStorage.getItem('lf-view') || 'web'; } catch (e) {}
    document.write('<style>x-dc{display:none !important}html,body{margin:0;height:100%;overflow:hidden;background:#07060D;color:#C7C3DA;font:14px/1.4 "Inter Tight","Helvetica Neue",Helvetica,Arial,sans-serif}'
      + '.lf-bar{height:56px;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:0 20px;box-sizing:border-box;border-bottom:1px solid #26233A;background:#0D0B16}'
      + '.lf-title{font-weight:700;color:#F4F2FB;font-size:15px;letter-spacing:-.01em}.lf-title span{color:#9C97B5;font-weight:500;margin-left:8px}'
      + '.lf-seg{display:flex;padding:4px;border-radius:999px;background:#17151F;box-shadow:inset 0 0 0 1px #2C2940}'
      + '.lf-seg button{all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:8px;height:34px;padding:0 16px;border-radius:999px;color:#C7C3DA;font-weight:600;font-size:13.5px}'
      + '.lf-seg button:focus-visible{outline:2px solid #8E7EFF;outline-offset:2px}'
      + '.lf-seg button[aria-checked="true"]{background:linear-gradient(180deg,#8E7EFF,#4E36E6);color:#fff;box-shadow:0 6px 18px -6px rgba(122,104,255,.7)}'
      + '.lf-seg svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}'
      + '.lf-stage{height:calc(100% - 56px);display:flex;align-items:center;justify-content:center;box-sizing:border-box}'
      + '.lf-stage.web iframe{width:100%;height:100%;border:0;display:block}'
      + '.lf-stage.mobile{padding:20px;background:radial-gradient(900px 600px at 50% 20%,rgba(122,104,255,.16),transparent 60%)}'
      + '.lf-stage.mobile .lf-phone{width:390px;height:min(844px,100%);border-radius:44px;padding:12px;box-sizing:border-box;background:#1B1828;box-shadow:inset 0 0 0 1px #34304A,0 40px 90px -30px rgba(0,0,0,.9)}'
      + '.lf-stage.web .lf-phone{width:100%;height:100%}'
      + '.lf-stage.mobile iframe{width:100%;height:100%;border:0;border-radius:33px;display:block;background:#0A0912}'
      + '.lf-stage.admin{padding:0}.lf-stage.admin .lf-phone{width:100%;height:100%}.lf-stage iframe.lf-admin{width:100%;height:100%;border:0;display:none;background:#0A0912}.lf-stage.admin iframe.lf-app{display:none}.lf-stage.admin iframe.lf-admin{display:block}.lf-stage.admin .lf-phone{padding:0;border-radius:0;background:none;box-shadow:none}'
      + '.lf-seg button[data-m="admin"][aria-checked="true"]{background:linear-gradient(180deg,#FFD58A,#F2A04F);color:#2A1204}'
      + '@media (max-width:820px){.lf-title span{display:none}.lf-seg button{padding:0 10px}}</style>');
    document.addEventListener('DOMContentLoaded', function(){
      var bar = document.createElement('div'); bar.className = 'lf-bar';
      bar.innerHTML = '<div class="lf-title">Lux Flow<span>Phase 1 · Connect prototype</span></div>'
        + '<div class="lf-seg" role="radiogroup" aria-label="Preview size">'
        + '<button type="button" role="radio" data-m="web"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>Web view</button>'
        + '<button type="button" role="radio" data-m="mobile"><svg viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>Mobile view</button>'
        + '<button type="button" role="radio" data-m="admin"><svg viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6zM9 12l2 2 4-4"/></svg>Admin</button></div>';
      var stage = document.createElement('div');
      stage.innerHTML = '<div class="lf-phone"><iframe class="lf-app" title="Lux Flow member app" src="' + location.href.split('#')[0] + '#lf-frame"></iframe><iframe class="lf-admin" title="Lux Flow admin console"></iframe></div>';
      var adminFrame = stage.querySelector('.lf-admin'), adminLoaded = false;
      document.body.appendChild(bar); document.body.appendChild(stage);
      function set(m){ mode = m; if (m === 'admin' && !adminLoaded) { adminLoaded = true; adminFrame.srcdoc = ADMIN_HTML; } stage.className = 'lf-stage ' + m; [].forEach.call(bar.querySelectorAll('[data-m]'), function(b){ b.setAttribute('aria-checked', b.getAttribute('data-m') === m ? 'true' : 'false'); b.tabIndex = b.getAttribute('data-m') === m ? 0 : -1; }); try { localStorage.setItem('lf-view', m); } catch (e) {} }
      bar.addEventListener('click', function(e){ var b = e.target.closest('[data-m]'); if (b) set(b.getAttribute('data-m')); });
      bar.addEventListener('keydown', function(e){ if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { var order = ['web', 'mobile', 'admin']; var i = order.indexOf(mode); set(order[(i + (e.key === 'ArrowRight' ? 1 : 2)) % 3]); bar.querySelector('[aria-checked="true"]').focus(); } });
      set(['web', 'mobile', 'admin'].indexOf(mode) >= 0 ? mode : 'web');
    });
    return;
  }
  function blob(b, type){ var s = atob(b), u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return new Blob([u], {type:type}); }
  window.__resources = {}; window.__resourceBlobs = {};
  window.__resources[R.reactUrl] = URL.createObjectURL(blob(R.react, 'text/javascript'));
  window.__resources[R.reactDomUrl] = URL.createObjectURL(blob(R.reactDom, 'text/javascript'));
  window.__resources['./Flower.dc.html'] = 'dc:Flower'; window.__resourceBlobs['dc:Flower'] = blob(R.flower, 'text/html');
  var rt = document.createElement('script'); rt.text = new TextDecoder().decode(new Uint8Array(atob(R.runtime).split('').map(function(c){ return c.charCodeAt(0); })));
  document.head.appendChild(rt);
})();
</script>'''
res = {'reactUrl': REACT, 'reactDomUrl': REACTDOM, 'react': b64(os.path.join(ROOT, 'vendor/react.production.min.js')),
       'reactDom': b64(os.path.join(ROOT, 'vendor/react-dom.production.min.js')), 'flower': b64(os.path.join(PROJ, 'Flower.dc.html')),
       'runtime': b64(os.path.join(ROOT, 'render/support.js'))}
boot = boot.replace('__LF_RES__', json.dumps(res))
adm = open(os.path.join(PROJ, 'Admin.dc.html'), encoding='utf-8').read()
aboot = '''<meta name="viewport" content="width=device-width, initial-scale=1">
<script>
(function(){ var R = window.parent.__LF_R;
  function blob(b, type){ var s = atob(b), u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return new Blob([u], {type:type}); }
  window.__resources = {}; window.__resourceBlobs = {};
  window.__resources[R.reactUrl] = URL.createObjectURL(blob(R.react, 'text/javascript'));
  window.__resources[R.reactDomUrl] = URL.createObjectURL(blob(R.reactDom, 'text/javascript'));
  window.__resources['./Flower.dc.html'] = 'dc:Flower'; window.__resourceBlobs['dc:Flower'] = blob(R.flower, 'text/html');
  var rt = document.createElement('script'); rt.text = new TextDecoder().decode(new Uint8Array(atob(R.runtime).split('').map(function(c){ return c.charCodeAt(0); })));
  document.head.appendChild(rt);
})();
</script>'''
assert adm.count('<script src="./support.js"></script>') == 1
adm = adm.replace('<script src="./support.js"></script>', aboot)
boot = boot.replace('__LF_ADMIN__', json.dumps(adm).replace('</', '<\\/'))
assert html.count('<script src="./support.js"></script>') == 1
html = html.replace('<script src="./support.js"></script>', boot)
open(OUT, 'w', encoding='utf-8').write(html)
print(OUT, round(os.path.getsize(OUT) / 1048576, 2), 'MB')
