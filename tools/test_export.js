// Independent test of the export: file:// URLs, all http(s) network blocked, fresh browser profile per page.
const { chromium } = require('playwright');
const path = require('path');
const DIR = path.join(__dirname, 'export', 'lux-flow-export');
const url = f => 'file://' + path.join(DIR, f);
const S = {
  home:{firstVisit:false}, homeSel:{firstVisit:false, sysSel:'connection'}, flow:{screen:'flow'}, flowMore:{screen:'flow', batch:2},
  post:{screen:'post', openPost:'p2'}, system:{screen:'system', openSys:'unity'}, systemWis:{screen:'system', openSys:'wisdom'},
  people:{screen:'people'}, profile:{screen:'profile'}, other:{screen:'profile', openPerson:'priya'},
  comms:{screen:'communities'}, comm:{screen:'community', openComm:'garden', cmTab:'members'}, commDisc:{screen:'community', openComm:'quiet', cmTab:'discussion', member:{garden:'joined', quiet:'joined', readers:'none', oral:'none', table:'none', sketch:'none', budget:'none'}},
  chat:{screen:'chat'}, convo:{screen:'convo', openConv:'g-garden', chats:{'g-garden':[{day:'Today'},{who:'tomas', text:'Here are the beds', time:'8:10 AM'},{who:'me', text:'', attach:'garden-beds.jpg', attachKind:'image', time:'Now', local:true}], 'd-amara':[{day:'Today'},{who:'amara', text:'Hi', share:'p1', time:'8:05 AM'}]}},
  archive:{screen:'archive'}, archiveEmpty:{screen:'archive', saved:{}, snapshots:[]},
  create:{screen:'create', create:{type:'story', title:'A walk', body:'Long way home.', sys:'journey', tag:null, img:true, promptOn:false, prompt:'', aud:null, view:'write', x:{}}},
  journal:{screen:'journal'}, calendar:{screen:'calendar'}, settings:{screen:'settings'}, trusted:{screen:'trusted'}, privacy:{screen:'privacy'}
};
(async () => {
  const b = await chromium.launch(); let bad = 0; const rows = [];
  for (const [w, h] of [[390, 844], [1440, 900]]) for (const [name, st] of Object.entries(S)) {
    const ctx = await b.newContext({viewport:{width:w, height:h}});
    await ctx.route(/^https?:/, r => r.abort());           // nothing from the network
    const p = await ctx.newPage(); const fails = []; const errs = [];
    p.on('requestfailed', r => { const u = r.url(); if (!/^https?:/.test(u) && !u.includes('%7B%7B')) fails.push(u.replace(/^file:\/\/.*lux-flow-export\//, '')); });
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(v => { try { localStorage.setItem('luxflow-proto-v3', v); } catch (e) {} }, JSON.stringify(Object.assign({v:3}, st)));
    await p.goto(url('index.html')); await p.waitForTimeout(1600);
    // scroll through so lazy images load, then measure every <img>
    await p.evaluate(async () => { const s = document.querySelector('.scroll'); if (!s) return; for (let y = 0; y <= s.scrollHeight; y += 500) { s.scrollTop = y; await new Promise(r => setTimeout(r, 120)); } s.scrollTop = 0; });
    await p.waitForTimeout(500);
    const r = await p.evaluate(() => { const all = [...document.querySelectorAll('img')]; const imgs = all.filter(i => i.getClientRects().length > 0); const hidden = all.length - imgs.length; const broken = imgs.filter(i => !i.complete || i.naturalWidth === 0).map(i => i.getAttribute('src'));
      return {n:imgs.length + '+' + hidden + ' hidden', broken, srcs:[...new Set(imgs.map(i => i.currentSrc.replace(/^.*lux-flow-export\//, '')))], fallbacks:document.querySelectorAll('.media-fail, .fig-fallback').length, noAlt:imgs.filter(i => !i.hasAttribute('alt')).length}; });
    const ok = !r.broken.length && !fails.length && !r.fallbacks && !errs.length && !r.noAlt;
    if (!ok) bad++;
    rows.push((ok ? 'ok ' : '!! ') + w + ' ' + name.padEnd(12) + ' imgs ' + String(r.n).padStart(2) + (r.broken.length ? ' BROKEN ' + r.broken.join(',') : '') + (fails.length ? ' FAILED ' + fails.join(',') : '') + (r.fallbacks ? ' FALLBACKS ' + r.fallbacks : '') + (r.noAlt ? ' NOALT ' + r.noAlt : '') + (errs.length ? ' ERR ' + errs[0] : ''));
    if (name === 'home' || name === 'convo') rows.push('     loaded: ' + r.srcs.filter(Boolean).join(' '));
    await ctx.close();
  }
  for (const f of ['foundations.html', 'brand.html']) {
    const ctx = await b.newContext({viewport:{width:1440, height:900}}); await ctx.route(/^https?:/, r => r.abort());
    const p = await ctx.newPage(); const errs = []; const fails = []; p.on('pageerror', e => errs.push(e.message)); p.on('requestfailed', r => { if (!/^https?:/.test(r.url()) && !r.url().includes('%7B%7B')) fails.push(r.url()); });
    await p.goto(url(f)); await p.waitForTimeout(2500);
    const n = await p.evaluate(() => [document.querySelectorAll('svg.lf-flower').length, document.querySelectorAll('svg.lf-logo').length, document.body.innerText.length]);
    rows.push(((errs.length || fails.length || !n[0]) ? '!! ' : 'ok ') + f + ' flowers ' + n[0] + ' logos ' + n[1] + ' text ' + n[2] + (errs.length ? ' ERR ' + errs[0] : '') + (fails.length ? ' FAILED ' + fails.join(',') : ''));
    if (errs.length || fails.length || !n[0]) bad++;
    await ctx.close();
  }
  console.log(rows.join('\n')); console.log(bad ? bad + ' PROBLEMS' : 'ALL IMAGES LOAD'); await b.close();
})();
