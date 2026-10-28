class Component extends DCLogic {
  constructor(a, b){ super(a, b); this.state = adLoad(); this.scrollEl = null; this.dlgEl = null; }
  componentDidUpdate(pp, ps){
    var s = this.state, self = this;
    clearTimeout(this.pt); this.pt = setTimeout(function(){ adSave(self.state); }, 200);
    if (ps && (ps.page !== s.page || ps.sel !== s.sel) && this.scrollEl) this.scrollEl.scrollTop = 0;
    if (ps && ps.dlg && !s.dlg && this.lastFocus && this.lastFocus.focus) { try { this.lastFocus.focus(); } catch (e) {} }
  }
  componentWillUnmount(){ clearTimeout(this.pt); clearTimeout(this.tt); }
  set(o){ this.setState(o); }
  staff(){ var s = this.state, out = {}; Object.keys(STAFF).forEach(function(id){ var b = STAFF[id]; var kind = id === 'quinn' ? 'admin' : ((s.roles || {})[id] || b.kind); var act = !(s.inactive || {})[id]; out[id] = Object.assign({}, b, {kind:kind, role:ROLE_LABEL[kind] + (act ? '' : ' · deactivated'), canDecide:act && kind !== 'operator', active:act}); }); return out; }
  reviewersIf(id, kind, active){ var s = this.state; var n = 0; var st = this.staff(); Object.keys(st).forEach(function(k){ var kk = k === id ? kind : st[k].kind; var a = k === id ? active : st[k].active; if (a && kk !== 'operator') n++; }); return n; }
  setRole(id, kind){ var st = this.staff(); if (st[id].kind === kind) return; if (this.reviewersIf(id, kind, st[id].active) < 2) { this.toast('Phase 1 needs at least two active reviewers. Make someone else a reviewer first.'); return; } var r = Object.assign({}, this.state.roles); r[id] = kind; this.setState({roles:r, audit:this.log('Changed role', st[id].name, 'Now ' + ROLE_LABEL[kind])}); this.toast(st[id].name + ' is now ' + (kind === 'operator' ? 'an operator (view only).' : 'a reviewer.')); }
  setActive(id, on){ var st = this.staff(); if (!on && this.reviewersIf(id, st[id].kind, false) < 2) { this.toast('Phase 1 needs at least two active reviewers. Make someone else a reviewer first.'); return; } var ia = Object.assign({}, this.state.inactive); if (on) delete ia[id]; else ia[id] = true; this.setState({inactive:ia, audit:this.log(on ? 'Reactivated team member' : 'Deactivated team member', st[id].name)}); this.toast(st[id].name + (on ? ' can sign in again.' : ' can no longer sign in.')); }
  toast(msg){ var self = this; clearTimeout(this.tt); this.setState({toast:msg}); this.tt = setTimeout(function(){ self.setState({toast:null}); }, 4200); }
  log(action, target, reason){ var e = {id:'L-' + Date.now(), at:adNow(), who:this.state.who, action:action, target:target, reason:reason || '—'}; return [e].concat(this.state.audit); }
  go(page, sel){ this.setState({page:page, sel:sel == null ? null : sel, navOpen:false, popAlerts:false, popMe:false, gSearch:''}); }
  member(id){ return this.state.members.filter(function(m){ return m.id === id; })[0] || {id:id, name:id, handle:id, ini:'?', joined:'—', ver:'—', trust:'—', standing:'Good standing', area:'—'}; }
  updCase(id, patch, histItem){ return this.state.cases.map(function(c){ if (c.id !== id) return c; var n = Object.assign({}, c, patch); if (histItem) n.history = (c.history || []).concat([histItem]); return n; }); }
  updMember(id, patch){ return this.state.members.map(function(m){ return m.id === id ? Object.assign({}, m, patch) : m; }); }
  hist(what, tone){ return {at:adNow(), who:this.state.who, what:what, tone:tone || 'acc'}; }

  openDlg(d){ var base = {outcome:null, policy:null, limit:'3 days', archive:false, note:'', internal:'', err:''}; this.lastFocus = document.activeElement; this.setState({dlg:Object.assign(base, d), popAlerts:false, popMe:false}); setTimeout(function(){ var dl = document.querySelector('.ad .dialog'); if (!dl) return; var f = dl.querySelector('.opt-row, textarea, .dialog-actions .btn:last-child'); if (f) f.focus(); }, 60); }
  patchDlg(p){ this.setState({dlg:Object.assign({}, this.state.dlg, p)}); }

  /* ---------- decisions ---------- */
  submit(){
    var s = this.state, d = s.dlg, self = this; if (!d) return;
    var fail = function(msg){ self.patchDlg({err:msg}); };
    var who = STAFF[s.who].name;
    if (d.kind === 'decide') {
      var c = s.cases.filter(function(x){ return x.id === d.ref; })[0]; var oc = OUTCOMES.filter(function(o){ return o.id === d.outcome; })[0];
      if (!oc) return fail('Choose an outcome.');
      if (oc.needsPolicy && !d.policy) return fail('Choose the standard this breaks.');
      if (oc.id !== 'dismiss' && !d.note.trim()) return fail('Add a message for the member — they need to know why.');
      var label = oc.label + (oc.id === 'limit' ? ' · ' + d.limit : '') + (d.policy ? ' · ' + d.policy : '');
      var upd = {dlg:null};
      if (oc.id === 'suspend') {
        upd.cases = this.updCase(c.id, {status:'confirm', proposal:{label:label, note:d.note, policy:d.policy, by:s.who, archive:d.archive}}, this.hist('Proposed suspension — waiting for a second reviewer', 'bad'));
        upd.pending = s.pending.concat([{id:'P-' + Date.now(), kind:'case', ref:c.id, member:c.subject, by:s.who, policy:d.policy}]);
        upd.audit = this.log('Proposed suspension', c.id + ' · ' + c.title, d.policy);
        this.setState(upd); this.toast('Suspension proposed. The other reviewer needs to confirm it.'); return;
      }
      var mPatch = {};
      if (oc.id === 'warn') mPatch.standing = 'Warned';
      if (oc.id === 'limit') mPatch.standing = 'Limited · ' + d.limit;
      upd.cases = this.updCase(c.id, {status:'resolved', outcome:label, decidedBy:s.who, memberNote:d.note, archive:d.archive}, this.hist('Decided: ' + label + (d.archive ? ' · saved Archive copies cleared' : ''), oc.id === 'dismiss' ? 'ok' : 'bad'));
      if (Object.keys(mPatch).length) upd.members = this.updMember(c.subject, mPatch);
      upd.audit = this.log(oc.label, c.id + ' · ' + c.title, (d.policy || 'No violation found') + (d.internal.trim() ? ' — ' + d.internal.trim() : ''));
      this.setState(upd); this.toast('Decision saved and the member notified. It’s in the audit log.'); return;
    }
    if (d.kind === 'edit') {
      var e = s.cases.filter(function(x){ return x.id === d.ref; })[0];
      if (d.mode === 'reject') { if (!d.policy) return fail('Choose which area the edit fails.'); if (!d.note.trim()) return fail('Explain the reason to the author.'); }
      var lbl = d.mode === 'approve' ? 'Edit approved — post shows an Edited label' : 'Edit rejected · ' + d.policy;
      this.setState({dlg:null, cases:this.updCase(e.id, {status:'resolved', outcome:lbl, decidedBy:s.who, memberNote:d.note}, this.hist(lbl, d.mode === 'approve' ? 'ok' : 'bad')), audit:this.log(d.mode === 'approve' ? 'Approved edit' : 'Rejected edit', e.id + ' · ' + e.title, d.mode === 'approve' ? 'Passes the six-area check' : d.policy)});
      this.toast(d.mode === 'approve' ? 'Edit approved. The post now shows an Edited label.' : 'Edit rejected. The author sees the reason and can appeal.'); return;
    }
    if (d.kind === 'appeal') {
      var ap = s.appeals.filter(function(x){ return x.id === d.ref; })[0];
      if (!d.outcome) return fail('Choose an outcome.');
      if (!d.note.trim()) return fail('Explain the outcome to the member.');
      var names = {uphold:'Original decision upheld', overturn:'Overturned — content and permissions restored', modify:'Modified — lighter outcome applied'};
      var upd2 = {dlg:null, appeals:s.appeals.map(function(x){ return x.id === ap.id ? Object.assign({}, x, {status:d.outcome, decidedBy:s.who, outcome:names[d.outcome], note:d.note}) : x; }), audit:this.log(names[d.outcome].split(' —')[0], ap.id + ' · ' + ap.title, d.note.trim())};
      if (d.outcome === 'overturn') upd2.members = this.updMember(ap.member, {standing:'Good standing'});
      this.setState(upd2); this.toast('Appeal decided. The member has been told the outcome.'); return;
    }
    if (d.kind === 'trust') {
      var t = s.apps.filter(function(x){ return x.id === d.ref; })[0];
      if (!d.note.trim()) return fail(d.mode === 'info' ? 'Say what information you need.' : 'Add a short reason — it’s shared with the applicant.');
      var map = {approve:['approved', 'Approved Trusted application'], decline:['declined', 'Declined Trusted application'], info:['info', 'Asked for more information'], revoke:['revoked', 'Removed Trusted status']};
      var m2 = map[d.mode]; var upd3 = {dlg:null, apps:s.apps.map(function(x){ return x.id === t.id ? Object.assign({}, x, {status:m2[0], decidedBy:s.who, note:d.note, hist:(x.hist || []).concat([{at:adNow(), who:s.who, what:m2[1]}])}) : x; }), audit:this.log(m2[1], t.id + ' · ' + this.member(t.member).name + ' · ' + t.path, d.note.trim())};
      if (d.mode === 'approve') upd3.members = this.updMember(t.member, {trust:'Trusted · ' + t.path});
      if (d.mode === 'revoke') upd3.members = this.updMember(t.member, {trust:'—'});
      this.setState(upd3); this.toast(m2[1] + '. The applicant has been told.'); return;
    }
    if (d.kind === 'vflag') {
      var v = s.vflags.filter(function(x){ return x.id === d.ref; })[0];
      if (!d.outcome) return fail('Choose an outcome.');
      if (!d.note.trim()) return fail('Add a reason for the record.');
      var vo = this.vOptions(v).filter(function(o){ return o.id === d.outcome; })[0];
      this.setState({dlg:null, vflags:s.vflags.map(function(x){ return x.id === v.id ? Object.assign({}, x, {status:'resolved', outcome:vo.label, decidedBy:s.who}) : x; }), audit:this.log('Resolved verification flag', v.id + ' · ' + v.title, vo.label + ' — ' + d.note.trim())});
      this.toast('Flag resolved and recorded.'); return;
    }
    if (d.kind === 'member') {
      var mm = this.member(d.ref);
      if (!d.note.trim()) return fail('Add a reason — it’s recorded and shared with the member where appropriate.');
      var acts = {warn:['Warned', 'Added a warning'], limit:['Limited · ' + d.limit, 'Applied a temporary limit'], lift:['Good standing', 'Lifted restriction'], signout:[null, 'Signed out all sessions']};
      if (d.mode === 'suspend') { this.setState({dlg:null, pending:s.pending.concat([{id:'P-' + Date.now(), kind:'member', ref:mm.id, member:mm.id, by:s.who, policy:d.note.trim()}]), audit:this.log('Proposed suspension', mm.name, d.note.trim())}); this.toast('Suspension proposed. The other reviewer needs to confirm it.'); return; }
      var a = acts[d.mode]; var up = {dlg:null, audit:this.log(a[1], mm.name, d.note.trim())}; if (a[0]) up.members = this.updMember(mm.id, {standing:a[0]});
      this.setState(up); this.toast(a[1] + '. It’s in the audit log.'); return;
    }
    if (d.kind === 'sendback') {
      if (!d.note.trim()) return fail('Tell the other reviewer why you’re sending it back.');
      var pb = s.pending.filter(function(p){ return p.id === d.ref; })[0];
      var upd4 = {dlg:null, pending:s.pending.filter(function(p){ return p.id !== d.ref; }), audit:this.log('Sent back suspension', pb.kind === 'case' ? pb.ref : this.member(pb.member).name, d.note.trim())};
      if (pb.kind === 'case') upd4.cases = this.updCase(pb.ref, {status:'review', proposal:null}, this.hist('Suspension sent back: ' + d.note.trim(), 'acc'));
      this.setState(upd4); this.toast('Sent back to ' + STAFF[pb.by].name + '.'); return;
    }
    if (d.kind === 'invite') { var nm = (d.name || '').trim(); if (nm.length < 2) return fail('Add the person’s name.'); this.setState({dlg:null, invites:(s.invites || []).concat([{name:nm, kind:d.outcome || 'reviewer', at:adNow().replace('Today · ', 'today ')}]), audit:this.log('Invited team member', nm, ROLE_LABEL[d.outcome || 'reviewer'])}); this.toast('Invite sent to ' + nm + '.'); return; }
    if (d.kind === 'reset') { var f = adFresh(); f.signedIn = true; f.who = s.who; f.theme = s.theme; this.setState(f); this.toast('Demo data reset.'); return; }
  }
  confirmPending(pid){
    var s = this.state; var p = s.pending.filter(function(x){ return x.id === pid; })[0]; if (!p) return;
    var upd = {pending:s.pending.filter(function(x){ return x.id !== pid; }), members:this.updMember(p.member, {standing:'Suspended'})};
    if (p.kind === 'case') { var c = s.cases.filter(function(x){ return x.id === p.ref; })[0]; upd.cases = this.updCase(p.ref, {status:'resolved', outcome:c.proposal ? c.proposal.label : 'Account suspended', decidedBy:p.by, confirmedBy:s.who, memberNote:c.proposal ? c.proposal.note : ''}, this.hist('Second reviewer confirmed the suspension', 'bad')); }
    upd.audit = this.log('Confirmed suspension', p.kind === 'case' ? p.ref : this.member(p.member).name, 'Proposed by ' + STAFF[p.by].name);
    this.setState(upd); this.toast('Suspension confirmed. The member was notified and can appeal.');
  }
  vOptions(v){
    if (v.kind === 'duplicate') return [{id:'notdup', label:'Not a duplicate — provider error', hint:'Clear the flag. Both accounts carry on as normal.'}, {id:'ask', label:'Ask the member to confirm their accounts', hint:'Send a private message asking which account they want to keep.'}, {id:'same', label:'Same person — keep one account active', hint:'The newer account is paused after the member chooses. Nothing is deleted.'}];
    if (v.kind === 'age') return [{id:'retry', label:'Invite the member to try again', hint:'Send tips for a clear photo. Their account stays Unverified meanwhile.'}, {id:'support', label:'Route to support', hint:'A person helps them with another way to verify.'}];
    return [{id:'nudge', label:'Ask the provider for an update', hint:'Simulated — the request is recorded.'}, {id:'keep', label:'Keep pending and check again tomorrow', hint:'Nothing changes for the member.'}];
  }

  renderVals(){
    var s = this.state, self = this; var STF = this.staff(); var me = STF[s.who] || STF.quinn; var canDecide = me.canDecide; var isAdmin = s.who === 'quinn';
    var o = {ic:ICN, me:Object.assign({first:me.name.split(' ')[0]}, me), meAv:me.av, signedIn:s.signedIn, signedOut:!s.signedIn, gSearch:s.gSearch, qSearch:s.qSearch, mSearch:s.mSearch, lSearch:s.lSearch,
      appCls:'ad' + (s.theme === 'light' ? ' light' : '') + (s.navOpen ? ' nav-open' : '') + (s.signedIn ? (isAdmin ? ' is-admin' : ' is-desk') : ''), isAdmin:s.signedIn && isAdmin, notAdmin:s.signedIn && !isAdmin, goTeam:function(){ self.go('team'); }, viewOnly:s.signedIn && !canDecide, popAlerts:s.popAlerts, popMe:s.popMe,
      hasToast:!!s.toast, toast:s.toast || '', closeToast:function(){ self.set({toast:null}); },
      stop:function(e){ e.stopPropagation(); }, setScroll:function(el){ self.scrollEl = el; }, setDlg:function(el){ self.dlgEl = el; },
      skipToMain:function(){ var m = self.scrollEl; if (m) { m.setAttribute('tabindex', '-1'); m.focus(); } },
      onKey:function(e){ if (e.key === 'Escape') { if (s.dlg) self.set({dlg:null}); else if (s.popAlerts || s.popMe || s.gSearch || s.navOpen) self.set({popAlerts:false, popMe:false, gSearch:'', navOpen:false}); }
        if (e.key === 'Tab' && s.dlg && document.querySelector('.ad .dialog')) { var f = [].slice.call(document.querySelector('.ad .dialog').querySelectorAll('button:not([disabled]), textarea, input')); if (!f.length) return; var first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } } },
      openNav:function(){ self.set({navOpen:true}); }, closeNav:function(){ self.set({navOpen:false}); },
      toggleTheme:function(){ self.set({theme:s.theme === 'light' ? 'dark' : 'light'}); }, themeIcon:s.theme === 'light' ? ICN.moon : ICN.sun, themeAria:s.theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode',
      toggleAlerts:function(){ self.set({popAlerts:!s.popAlerts, popMe:false}); }, alertsExp:s.popAlerts ? 'true' : 'false',
      toggleMe:function(){ self.set({popMe:!s.popMe, popAlerts:false}); }, meExp:s.popMe ? 'true' : 'false', meAria:'Signed in as ' + me.name + ', ' + me.role + '. Account menu',
      signOut:function(){ self.set({signedIn:false, signStep:'pick', code:'', popMe:false, page:'overview', sel:null}); },
      onGSearch:function(e){ self.set({gSearch:e.target.value.slice(0, 60)}); }, onQSearch:function(e){ self.set({qSearch:e.target.value.slice(0, 60)}); }, onMSearch:function(e){ self.set({mSearch:e.target.value.slice(0, 60)}); }, onLSearch:function(e){ self.set({lSearch:e.target.value.slice(0, 60)}); },
      goQueue:function(){ self.go('queue'); }, goAudit:function(){ self.go('audit'); }, goSettings:function(){ self.go('settings'); }, goAppeals:function(){ self.go('appeals'); }, goTrusted:function(){ self.go('trusted'); }, goVerify:function(){ self.go('verify'); }, goMembers:function(){ self.go('members'); },
      todayLabel:new Date().toLocaleDateString('en-GB', {weekday:'long', day:'numeric', month:'long'}),
      aiMay:['Sort reports by type and priority', 'Check larger edits against six areas', 'Flag unusual patterns, like report bursts', 'Help with reviewer workflows'],
      aiNot:['Approve or decline Trusted applications', 'Read Journals or unreported private chats', 'Judge health, character or qualifications', 'Make final bans, suspensions or appeal outcomes']
    };
    /* sign in */
    o.si = {pick:s.signStep === 'pick', codeStep:s.signStep === 'code', code:s.code, hasErr:!!s.codeErr, err:s.codeErr, invalid:s.codeErr ? 'true' : 'false', name:me.full, role:me.role, av:me.av, ini:me.ini,
      accounts:['quinn', 'dana', 'ops'].map(function(id){ var a = STF[id]; var on = s.who === id; return {name:a.full, role:a.role, av:a.av, ini:a.ini, cls:'opt-row' + (on ? ' on' : ''), checked:on ? 'true' : 'false', pick:function(){ if (!a.active) { self.set({codeErr:''}); self.toast(a.name + '’s access is deactivated. The admin can reactivate it.'); return; } self.set({who:id}); }}; }),
      next:function(){ self.set({signStep:'code', code:'', codeErr:''}); }, back:function(){ self.set({signStep:'pick'}); },
      onCode:function(e){ self.set({code:e.target.value.replace(/\D/g, '').slice(0, 6), codeErr:''}); },
      submit:function(){ if (!/^\d{6}$/.test(s.code)) { self.set({codeErr:'Enter the 6-digit code from your authenticator app.'}); return; } self.setState({signedIn:true, signStep:'pick', code:'', page:'overview', sel:null, audit:[{id:'L-' + Date.now(), at:adNow(), who:s.who, action:'Signed in', target:'Admin console', reason:'—'}].concat(s.audit)}); },
      onCodeKey:function(e){ if (e.key === 'Enter') o.si.submit(); }};
    if (!s.signedIn) { o.pg = {}; o.dlg = {any:false}; o.nav = []; return o; }

    /* derived */
    var active = s.cases.filter(function(c){ return c.status !== 'resolved'; });
    var urgent = active.filter(function(c){ return c.priority === 'urgent'; }).sort(function(a, b){ return b.ageMin - a.ageMin; });
    var myAppeals = s.appeals.filter(function(a){ return a.status === 'open' && canDecide && a.by !== s.who; });
    var openAppeals = s.appeals.filter(function(a){ return a.status === 'open'; });
    var pendApps = s.apps.filter(function(a){ return a.status === 'pending' || a.status === 'info'; });
    var openFlags = s.vflags.filter(function(v){ return v.status === 'open'; });
    var myConfirms = s.pending.filter(function(p){ return canDecide && p.by !== s.who; });
    var openCase = function(id){ return function(){ self.go('case', id); }; };
    var whoOf = function(id){ return id ? STAFF[id] : null; };
    o.hasUrgent = urgent.length > 0; o.noUrgent = !urgent.length;
    o.alertsAria = urgent.length ? 'Urgent alerts, ' + urgent.length + ' open' : 'Urgent alerts, none open';
    o.urgentList = urgent.map(function(c){ var w = whoOf(c.assignee); return {id:c.id, type:URGENT_TYPES[c.urgent] || 'Urgent', title:c.title, age:adAge(c.ageMin), assigned:w ? 'Assigned to ' + w.name : 'Not assigned yet', go:openCase(c.id)}; });
    o.switchList = ['quinn', 'dana', 'ops'].filter(function(id){ return id !== s.who && STF[id].active; }).map(function(id){ var a = STF[id]; return {name:a.full, role:a.role, av:a.av, ini:a.ini, go:function(){ self.setState({who:id, popMe:false, audit:[{id:'L-' + Date.now(), at:adNow(), who:id, action:'Signed in', target:'Admin console', reason:'Switched reviewer (prototype)'}].concat(s.audit)}); self.toast('Now signed in as ' + a.name + '.'); }}; });
    var cnt = function(n, cls, aria){ return {count:String(n), hasCount:n > 0, countCls:'count' + (cls ? ' ' + cls : ''), countAria:n + ' ' + aria}; };
    var item = function(id, label, icon, c, also){ var on = s.page === id || (also && also.indexOf(s.page) >= 0); return Object.assign({isItem:true, isLabel:false, label:label, icon:icon, cls:'nav-item' + (on ? ' on' : ''), cur:on ? 'page' : undefined, go:function(){ self.go(id); }, hasCount:false}, c || {}); };
    o.nav = [item('overview', isAdmin ? 'Overview' : 'My desk', ICN.home), item('queue', 'Queue', ICN.queue, cnt(active.length, urgent.length ? 'hot' : '', 'open items' + (urgent.length ? ', ' + urgent.length + ' urgent' : '')), ['case']),
      item('appeals', 'Appeals', ICN.scale, cnt(myAppeals.length, 'acc', 'appeals assigned to you'), ['appeal']), item('trusted', 'Trusted applications', ICN.star, cnt(pendApps.length, '', 'waiting'), ['app']), item('verify', 'Verification', ICN.idcard, cnt(openFlags.length, '', 'open flags'), ['vflag']),
      {isLabel:true, isItem:false, label:'Records'}, item('members', 'Members', ICN.people, null, ['member'])].concat(isAdmin ? [item('team', 'Team & roles', ICN.user)] : []).concat([item('audit', 'Audit log', ICN.log), item('settings', 'Settings', ICN.settings)]);
    o.nav.forEach(function(n){ if (n.isItem) n.tnCls = 'tn-item' + (n.cls.indexOf(' on') > 0 ? ' on' : ''); });
    o.pg = {}; o.pg[s.page] = true; o.ovAdmin = s.page === 'overview' && isAdmin; o.ovDesk = s.page === 'overview' && !isAdmin; o.cantExport = !canDecide;
    if (s.page === 'case' && !s.cases.some(function(c){ return c.id === s.sel; })) { o.pg = {queue:true}; }

    /* global search */
    var gq = (s.gSearch || '').trim().toLowerCase();
    o.gs = {open:false};
    if (gq.length >= 2) { var res = [];
      s.cases.forEach(function(c){ var m = self.member(c.subject); if ((c.id + ' ' + c.title + ' ' + c.category + ' ' + m.name + ' ' + m.handle).toLowerCase().indexOf(gq) >= 0) res.push({icon:ICN.flag, title:c.title, sub:c.id + ' · ' + STATUS_LABEL[c.status], go:openCase(c.id)}); });
      s.members.forEach(function(m){ if ((m.name + ' ' + m.handle).toLowerCase().indexOf(gq) >= 0) res.push({icon:ICN.user, title:m.name, sub:'@' + m.handle + ' · ' + m.standing, go:function(){ self.go('member', m.id); }}); });
      o.gs = {open:true, items:res.slice(0, 7), none:!res.length}; }

    /* overview */
    var mine = [];
    myConfirms.forEach(function(p){ var m = self.member(p.member); mine.push({tag:'Confirm', badge:'badge b-confirm', title:'Confirm suspension of ' + m.name, sub:'Proposed by ' + STAFF[p.by].name + (p.policy ? ' · ' + p.policy : ''), go:p.kind === 'case' ? openCase(p.ref) : function(){ self.go('member', p.member); }}); });
    active.filter(function(c){ return c.assignee === s.who; }).forEach(function(c){ mine.push({tag:PRI_LABEL[c.priority], badge:'badge b-' + c.priority, title:c.title, sub:c.id + ' · ' + STATUS_LABEL[c.status] + ' · waiting ' + adAge(c.ageMin), go:openCase(c.id)}); });
    myAppeals.forEach(function(a){ mine.push({tag:'Appeal', badge:'badge b-review', title:a.title, sub:a.id + ' · assigned to you · waiting ' + adAge(a.ageMin), go:function(){ self.go('appeal', a.id); }}); });
    var oldest = active.slice().sort(function(a, b){ return b.ageMin - a.ageMin; })[0];
    var today = function(a){ return a.at.indexOf('Today') === 0; };
    var decisive = /Removed|Dismissed|Approved|Rejected|Declined|Confirmed|Overturned|Upheld|Modified|Send guidance|No violation|Temporary|Suspend|warn|Resolved/i;
    var decidedToday = s.audit.filter(function(a){ return today(a) && decisive.test(a.action); }).length;
    var rcvToday = s.cases.filter(function(c){ return c.ageMin < 1440; }).length;
    var wk = WEEK.concat([{d:'Today', r:rcvToday, x:decidedToday}]); var wmax = Math.max.apply(null, wk.map(function(w){ return Math.max(w.r, w.x); })) || 1;
    var load = ['quinn', 'dana'].map(function(id){ var a = STF[id]; var asg = active.filter(function(c){ return c.assignee === id; }).length; var dec = s.audit.filter(function(x){ return x.who === id && today(x) && decisive.test(x.action); }).length; return {id:id, a:a, asg:asg, dec:dec}; });
    var lmax = Math.max.apply(null, load.map(function(l){ return l.asg + l.dec; })) || 1;
    var reasons = {}; active.forEach(function(c){ var k = c.kind === 'edit' ? 'Edit reviews' : c.category; reasons[k] = (reasons[k] || 0) + 1; });
    var rlist = Object.keys(reasons).map(function(k){ return {label:k, n:reasons[k]}; }).sort(function(a, b){ return b.n - a.n; }); var rmax = rlist.length ? rlist[0].n : 1;
    var closedAp = s.appeals.filter(function(a){ return a.status !== 'open'; }); var over = closedAp.filter(function(a){ return a.status === 'overturn'; }).length;
    var allUrgentOk = urgent.every(function(c){ return c.ageMin < 1440; });
    var nxCase = myConfirms.length ? s.cases.filter(function(c){ return c.id === myConfirms[0].ref; })[0] : null;
    if (!nxCase) nxCase = active.filter(function(c){ return c.assignee === s.who && c.status !== 'confirm'; }).sort(function(a, b){ return (PRI_ORDER[a.priority] - PRI_ORDER[b.priority]) || (b.ageMin - a.ageMin); })[0];
    if (!nxCase) nxCase = active.filter(function(c){ return !c.assignee; }).sort(function(a, b){ return (PRI_ORDER[a.priority] - PRI_ORDER[b.priority]) || (b.ageMin - a.ageMin); })[0];
    o.nx = {has:!!nxCase, none:!nxCase};
    if (nxCase) o.nx = {has:true, none:false, eyebrow:nxCase.status === 'confirm' ? 'Next up · second review' : (nxCase.assignee === s.who ? 'Next up · assigned to you' : 'Next up · unassigned'), id:nxCase.id, title:nxCase.title, where:nxCase.where, category:nxCase.category, age:adAge(nxCase.ageMin), pri:PRI_LABEL[nxCase.priority], priCls:'badge b-' + nxCase.priority, cta:canDecide ? 'Start review' : 'Open case', go:openCase(nxCase.id)};
    o.ov = {urgentSub:'Oldest waiting ' + (urgent.length ? adAge(urgent[0].ageMin) : '—') + ' · both reviewers were alerted · same-day target',
      chartAria:'Bar chart of items received and decided over the last seven days. Today: ' + rcvToday + ' received, ' + decidedToday + ' decided.',
      week:wk.map(function(w){ return {d:w.d, r:w.r, x:w.x, rh:'height: ' + Math.max(4, w.r / wmax * 100) + '%', xh:'height: ' + Math.max(4, w.x / wmax * 100) + '%'}; }),
      load:load.map(function(l){ return {name:l.a.name + (l.id === s.who ? ' (you)' : ''), av:l.a.av + ' av-sm', ini:l.a.ini, line:l.asg + ' assigned · ' + l.dec + ' decided today', w:'width: ' + Math.max(4, (l.asg + l.dec) / lmax * 100) + '%'}; }),
      reasons:rlist.map(function(r){ return {label:r.label, n:r.n, w:'width: ' + (r.n / rmax * 100) + '%'}; }),
      waiting:[{icon:ICN.scale, label:'Suspensions to confirm', sub:'Need a second reviewer', n:s.pending.length, go:function(){ self.setState({page:'queue', qStatus:'active', qPri:'all', qType:'all'}); }},
        {icon:ICN.swap, label:'Appeals', sub:'Each goes to a different reviewer', n:openAppeals.length, go:function(){ self.setState({page:'appeals', aTab:'open'}); }},
        {icon:ICN.star, label:'Trusted applications', sub:'A person decides every one', n:pendApps.length, go:function(){ self.go('trusted'); }},
        {icon:ICN.idcard, label:'Verification flags', sub:'Never an automatic ban', n:openFlags.length, go:function(){ self.go('verify'); }}],
      stats:[{label:'Open items', n:active.length, sub:urgent.length + ' urgent · ' + active.filter(function(c){ return c.priority === 'high'; }).length + ' high', subCls:'stat-s', go:function(){ self.go('queue'); }},
        {label:'Urgent, same day', n:urgent.length ? (allUrgentOk ? 'On track' : 'Overdue') : 'Clear', sub:urgent.length ? urgent.length + ' open · oldest ' + adAge(urgent[0].ageMin) : 'No urgent cases', subCls:'stat-s' + (urgent.length && !allUrgentOk ? ' bad' : ' good'), go:function(){ self.setState({page:'queue', qPri:'urgent', qStatus:'active', qType:'all'}); }},
        {label:'Decided today', n:decidedToday, sub:'Median time to decision 3h 10m (sample)', subCls:'stat-s', go:function(){ self.go('audit'); }},
        {label:'Appeals overturned', n:closedAp.length ? Math.round(over / closedAp.length * 100) + '%' : '—', sub:closedAp.length ? over + ' of ' + closedAp.length + ' closed appeals' : 'No closed appeals yet', subCls:'stat-s', go:function(){ self.setState({page:'appeals', aTab:'closed'}); }}],
      deskStats:[{n:active.filter(function(c){ return c.assignee === s.who; }).length, label:'Assigned to you', go:function(){ self.setState({page:'queue', qStatus:'mine', qPri:'all', qType:'all'}); }},
        {n:active.filter(function(c){ return !c.assignee; }).length, label:'Unassigned', go:function(){ self.setState({page:'queue', qStatus:'unassigned', qPri:'all', qType:'all'}); }},
        {n:myAppeals.length + myConfirms.length, label:'Appeals & confirmations for you', go:function(){ self.go('appeals'); }}],
      summary:isAdmin ? (active.length + ' open items across the team' + (urgent.length ? ', ' + urgent.length + ' urgent' : '') + '. ' + decidedToday + ' decided today.') : (active.length ? active.length + ' items in the queue' + (urgent.length ? ', ' + urgent.length + ' urgent.' : '.') : 'The queue is clear.'),
      urgentTitle:urgent.length === 1 ? '1 urgent case is waiting' : urgent.length + ' urgent cases are waiting', openFirstUrgent:urgent.length ? openCase(urgent[0].id) : function(){},
      hasUrgentCards:urgent.length > 0, mine:mine, mineEmpty:!mine.length, mineCount:mine.length ? mine.length + ' item' + (mine.length > 1 ? 's' : '') : '',
      kpis:[{n:active.length, label:'Open in queue', sub:'Reports and edits', go:function(){ self.go('queue'); }},
        {n:urgent.length, label:'Urgent', sub:'Same-day target', hot:urgent.length > 0, go:function(){ self.setState({page:'queue', qPri:'urgent', qStatus:'active', qType:'all'}); }},
        {n:myAppeals.length, label:'Appeals for you', sub:openAppeals.length + ' open in total', go:function(){ self.go('appeals'); }},
        {n:pendApps.length, label:'Trusted applications', sub:'Waiting for a person', go:function(){ self.go('trusted'); }},
        {n:openFlags.length, label:'Verification flags', sub:'Never auto-banned', go:function(){ self.go('verify'); }},
        {n:oldest ? adAge(oldest.ageMin) : '—', label:'Oldest waiting', sub:oldest ? oldest.id : 'Nothing waiting', go:oldest ? openCase(oldest.id) : function(){}}].map(function(k){ k.cls = 'kpi' + (k.hot ? ' hot' : ''); return k; }),
      recent:s.audit.slice(0, 5).map(function(a){ return {who:STAFF[a.who] ? STAFF[a.who].name : a.who, action:a.action.charAt(0).toLowerCase() + a.action.slice(1), target:a.target, at:a.at}; })};

    /* queue */
    var qq = (s.qSearch || '').trim().toLowerCase();
    var rows = s.cases.filter(function(c){
      if (s.qType === 'reports' && c.kind !== 'report') return false; if (s.qType === 'edits' && c.kind !== 'edit') return false;
      if (s.qPri !== 'all' && c.priority !== s.qPri) return false;
      if (s.qStatus === 'active' && c.status === 'resolved') return false; if (s.qStatus === 'mine' && (c.assignee !== s.who || c.status === 'resolved')) return false;
      if (s.qStatus === 'unassigned' && (c.assignee || c.status === 'resolved')) return false; if (s.qStatus === 'resolved' && c.status !== 'resolved') return false;
      if (qq) { var m = self.member(c.subject); if ((c.id + ' ' + c.title + ' ' + c.category + ' ' + m.name + ' ' + m.handle).toLowerCase().indexOf(qq) < 0) return false; }
      return true; }).sort(function(a, b){ return (PRI_ORDER[a.priority] - PRI_ORDER[b.priority]) || (b.ageMin - a.ageMin); });
    var tab = function(key, cur, list, setKey){ return list.map(function(t){ var on = cur === t[0]; return {label:t[1], cls:on ? 'on' : '', pressed:on ? 'true' : 'false', pick:function(){ var u = {}; u[setKey] = t[0]; self.set(u); }}; }); };
    var chipTab = function(cur, list, setKey){ return list.map(function(t){ var on = cur === t[0]; return {label:t[1], cls:'chip' + (on ? ' on' : ''), pressed:on ? 'true' : 'false', pick:function(){ var u = {}; u[setKey] = t[0]; self.set(u); }}; }); };
    o.qf = {types:tab('t', s.qType, [['all', 'All'], ['reports', 'Reports'], ['edits', 'Edit reviews']], 'qType'),
      statuses:tab('s', s.qStatus, [['active', 'Active'], ['mine', 'Mine'], ['unassigned', 'Unassigned'], ['resolved', 'Resolved']], 'qStatus'),
      pris:chipTab(s.qPri, [['all', 'All'], ['urgent', 'Urgent'], ['high', 'High'], ['normal', 'Normal']], 'qPri'),
      count:rows.length, empty:!rows.length,
      emptyTitle:s.qStatus === 'mine' ? 'Nothing assigned to you' : (qq ? 'No items match' : 'All clear'),
      emptyText:s.qStatus === 'mine' ? 'Assign yourself an unassigned item to start.' : (qq ? 'Try another ID, member or reason.' : 'New reports and flagged edits will appear here.'),
      rows:rows.map(function(c){ var w = whoOf(c.assignee); var m = self.member(c.subject); return {id:c.id, title:c.title, sub:c.category + ' · ' + m.name, type:c.kind === 'edit' ? 'Edit review' : c.objType, age:adAge(c.ageMin), pri:PRI_LABEL[c.priority], priCls:'badge b-' + c.priority, st:STATUS_LABEL[c.status], stCls:STATUS_CLS[c.status], trCls:c.priority === 'urgent' && c.status !== 'resolved' ? 'is-urgent' : '', hasWho:!!w, whoAv:w ? w.av + ' av-sm' : '', whoIni:w ? w.ini : '', whoName:w ? w.name : 'Unassigned', open:openCase(c.id)}; })};

    /* case detail */
    var c = s.cases.filter(function(x){ return x.id === s.sel; })[0];
    o.cs = {};
    if (c) { var m = self.member(c.subject); var w = whoOf(c.assignee); var resolved = c.status === 'resolved'; var pend = s.pending.filter(function(p){ return p.kind === 'case' && p.ref === c.id; })[0];
      var others = s.cases.filter(function(x){ return x.subject === c.subject && x.id !== c.id && x.status !== 'resolved'; }).length;
      var past = s.cases.filter(function(x){ return x.subject === c.subject && x.id !== c.id && x.status === 'resolved' && x.outcome && x.outcome.indexOf('No violation') !== 0; });
      var locked = !canDecide || c.status === 'confirm';
      o.cs = {id:c.id, title:c.title, where:c.where, category:c.category, pri:PRI_LABEL[c.priority], priCls:'badge b-' + c.priority, st:STATUS_LABEL[c.status], stCls:STATUS_CLS[c.status], age:adAge(c.ageMin), ai:c.ai,
        isReport:c.kind === 'report', isEdit:c.kind === 'edit', isChild:c.urgent === 'child' && !resolved, objType:c.objType, excerpt:c.excerpt, reporter:c.reporter, reporterNote:c.reporterNote,
        reportsLine:(c.reports || 1) > 1 ? c.reports + ' members reported this. A report count isn’t proof on its own.' : '1 member reported this.',
        image:!!c.image, blurCls:'blurbox' + (s.reveal[c.id] ? ' shown' : ''), blurIcon:s.reveal[c.id] ? ICN.eye : ICN.eyeoff, blurText:s.reveal[c.id] ? 'Image revealed for review (placeholder — no real image in this prototype).' : 'Image hidden by default. Reveal only if you need it to decide.', revealLabel:s.reveal[c.id] ? 'Hide image' : 'Reveal image',
        toggleReveal:function(){ var r = Object.assign({}, s.reveal); r[c.id] = !r[c.id]; self.set({reveal:r}); },
        orig:(c.orig || []).map(function(g){ return {t:g.t, cls:g.c === 'del' ? 'd-del' : ''}; }), next:(c.next || []).map(function(g){ return {t:g.t, cls:g.c === 'add' ? 'd-add' : ''}; }),
        areas:(c.areas || []).map(function(a){ return {n:a.n, note:a.note, cls:'area ' + (a.ok ? 'pass' : 'flag'), icon:a.ok ? ICN.check : ICN.alert}; }),
        m:{ini:m.ini, name:m.name, handle:m.handle, joined:m.joined, ver:m.ver, trust:m.trust, standing:m.standing, stdCls:/Suspend|Limited/.test(m.standing) ? 'std-bad' : (m.standing === 'Warned' ? 'std-warn' : 'std-good'), openOther:others ? others + ' (unresolved — not findings)' : 'None', past:past.length ? past.map(function(x){ return x.outcome; }).join('; ') : 'None'},
        openMember:function(){ self.go('member', c.subject); },
        hasWho:!!w, whoAv:w ? w.av + ' av-sm' : '', whoIni:w ? w.ini : '', whoName:w ? (c.assignee === s.who ? 'You' : w.name) : 'Nobody yet',
        open:!resolved, done:resolved, locked:locked, lockText:!canDecide ? 'Your role can view cases but can’t act on them.' : 'Waiting for the second reviewer — actions are paused.',
        canTake:c.assignee !== s.who, take:function(){ self.setState({cases:self.updCase(c.id, {assignee:s.who, status:c.status === 'open' ? 'review' : c.status}, self.hist('Assigned to ' + me.name)), audit:self.log('Assigned to self', c.id + ' · ' + c.title)}); self.toast('Assigned to you.'); },
        canHand:true, handLabel:'Hand to ' + (s.who === 'dana' ? 'Quinn' : 'Dana Ruiz'), hand:function(){ var to = s.who === 'dana' ? 'quinn' : 'dana'; self.setState({cases:self.updCase(c.id, {assignee:to, status:c.status === 'open' ? 'review' : c.status}, self.hist('Handed to ' + STAFF[to].name)), audit:self.log('Reassigned', c.id + ' · ' + c.title, 'To ' + STAFF[to].name)}); self.toast('Handed to ' + STAFF[to].name + '.'); },
        protected:c.status === 'protect', protectPressed:c.status === 'protect' ? 'true' : 'false',
        toggleProtect:function(){ var on = c.status !== 'protect'; self.setState({cases:self.updCase(c.id, {status:on ? 'protect' : (c.assignee ? 'review' : 'open')}, self.hist(on ? 'Protective action: hidden while under review' : 'Protective action lifted', on ? 'bad' : 'acc')), audit:self.log(on ? 'Took protective action' : 'Lifted protective action', c.id + ' · ' + c.title, on ? 'Hidden while under review' : '—')}); self.toast(on ? 'Hidden while you review. This isn’t a finding.' : 'Item visible again.'); },
        decide:function(){ self.openDlg({kind:'decide', ref:c.id, title:'Decide ' + c.id, sub:c.title, archive:/private|Child/.test(c.category)}); },
        approveEdit:function(){ self.openDlg({kind:'edit', mode:'approve', ref:c.id, title:'Approve this edit?', sub:c.title, note:''}); },
        rejectEdit:function(){ var flagged = (c.areas || []).filter(function(a){ return !a.ok; })[0]; self.openDlg({kind:'edit', mode:'reject', ref:c.id, title:'Reject this edit', sub:c.title, policy:flagged ? flagged.n : null}); },
        outcome:c.outcome || '', outcomeBy:resolved ? 'Decided by ' + (STAFF[c.decidedBy] ? STAFF[c.decidedBy].name : '—') + (c.confirmedBy ? ', confirmed by ' + STAFF[c.confirmedBy].name : '') : '',
        hasMemberNote:resolved && !!c.memberNote, memberNote:c.memberNote || '',
        isConfirm:c.status === 'confirm' && !!pend, confirmTitle:pend ? (pend.by === s.who ? 'Waiting for a second reviewer.' : 'Second review needed.') : '',
        confirmText:pend ? (pend.by === s.who ? 'You proposed a suspension. The other reviewer has been asked to confirm it.' : STAFF[pend.by].name + ' proposed: ' + (c.proposal ? c.proposal.label : 'suspension') + '. Confirm only if you agree after reading the evidence.') : '',
        canConfirm:!!pend && pend.by !== s.who && canDecide, confirmSusp:function(){ if (pend) self.confirmPending(pend.id); }, sendBack:function(){ if (pend) self.openDlg({kind:'sendback', ref:pend.id, title:'Send the suspension back?', sub:'The case returns to ' + STAFF[pend.by].name + ' with your note.'}); },
        history:(c.history || []).slice().reverse().map(function(h){ return {what:h.what, at:h.at, who:STAFF[h.who] ? STAFF[h.who].name : 'System', dot:'tl-dot' + (h.tone ? ' ' + h.tone : '')}; })};
    }

    /* appeals */
    var apRows = s.appeals.filter(function(a){ if (s.aTab === 'mine') return a.status === 'open' && a.by !== s.who && canDecide; if (s.aTab === 'open') return a.status === 'open'; return a.status !== 'open'; });
    var apSt = {open:['Open', 'badge b-open'], uphold:['Upheld', 'badge b-neutral'], overturn:['Overturned', 'badge b-done'], modify:['Modified', 'badge b-review']};
    var assignee = function(a){ return a.by === 'quinn' ? STAFF.dana : STAFF.quinn; };
    o.ap = {tabs:tab('a', s.aTab, [['mine', 'Assigned to me'], ['open', 'All open'], ['closed', 'Closed']], 'aTab'), empty:!apRows.length,
      emptyTitle:s.aTab === 'mine' ? 'No appeals assigned to you' : 'No appeals here', emptyText:s.aTab === 'mine' ? (canDecide ? 'Appeals of your own decisions go to the other reviewer.' : 'Your role doesn’t decide appeals.') : 'Closed appeals stay here for the record.',
      rows:apRows.map(function(a){ var to = assignee(a); return {id:a.id, title:a.title, member:self.member(a.member).name, decision:a.decision, by:STAFF[a.by].name, to:to.id === s.who ? 'You' : to.name, toAv:to.av + ' av-sm', toIni:to.ini, age:adAge(a.ageMin), st:apSt[a.status][0], stCls:apSt[a.status][1], open:function(){ self.go('appeal', a.id); }}; })};
    var al = s.appeals.filter(function(a){ return a.id === s.sel; })[0]; o.al = {};
    if (al) { var to = assignee(al); var own = al.by === s.who; o.al = {id:al.id, caseRef:al.caseRef, title:al.title, decision:al.decision, by:STAFF[al.by].name, member:self.member(al.member).name, statement:al.statement, age:adAge(al.ageMin), st:apSt[al.status][0], stCls:apSt[al.status][1],
      assignText:'Assigned to ' + (to.id === s.who ? 'you' : to.name) + ' because ' + STAFF[al.by].name + ' made the original decision. The original reviewer can’t decide their own appeal.',
      open:al.status === 'open', done:al.status !== 'open', locked:own || !canDecide, lockText:own ? 'You made the original decision, so this appeal is for ' + to.name + '.' : 'Your role can view appeals but can’t decide them.',
      outcome:al.outcome || '', outcomeBy:al.decidedBy ? 'Decided by ' + STAFF[al.decidedBy].name + (al.note ? ' — ' + al.note : '') : '',
      decide:function(){ self.openDlg({kind:'appeal', ref:al.id, title:'Decide appeal ' + al.id, sub:al.title}); }}; }

    /* trusted */
    var tRows = s.apps.filter(function(a){ if (s.tTab === 'pending') return a.status === 'pending'; if (s.tTab === 'info') return a.status === 'info'; return a.status !== 'pending' && a.status !== 'info'; });
    var tSt = {pending:['Pending', 'badge b-open'], info:['Needs information', 'badge b-protect'], approved:['Approved', 'badge b-done'], declined:['Declined', 'badge b-neutral'], revoked:['Removed', 'badge b-neutral']};
    o.tr = {tabs:tab('t', s.tTab, [['pending', 'Pending'], ['info', 'Needs information'], ['decided', 'Decided']], 'tTab'), empty:!tRows.length,
      rows:tRows.map(function(a){ var m = self.member(a.member); return {id:a.id, name:m.name, ini:m.ini, path:a.path, age:adAge(a.ageMin), st:tSt[a.status][0], stCls:tSt[a.status][1], open:function(){ self.go('app', a.id); }}; })};
    var ta = s.apps.filter(function(a){ return a.id === s.sel; })[0]; o.ta = {};
    if (ta) { var tm = self.member(ta.member); var tdlg = function(mode, title){ return function(){ self.openDlg({kind:'trust', mode:mode, ref:ta.id, title:title, sub:tm.name + ' · ' + ta.path}); }; };
      var th = [{at:adAge(ta.ageMin) + ' ago', who:'Applicant', what:'Application submitted', dot:'tl-dot'}].concat(ta.decidedBy && !ta.hist ? [{at:'Earlier', who:STAFF[ta.decidedBy].name, what:'Approved', dot:'tl-dot ok'}] : []).concat((ta.hist || []).map(function(h){ return {at:h.at, who:STAFF[h.who].name, what:h.what, dot:'tl-dot acc'}; }));
      o.ta = {id:ta.id, name:tm.name, ini:tm.ini, path:ta.path, age:adAge(ta.ageMin), st:tSt[ta.status][0], stCls:tSt[ta.status][1], answers:ta.answers,
        record:ta.record.map(function(r){ return {l:r.l, v:r.v, kind:r.k === 'self' ? 'Self-reported' : 'Recorded', badge:r.k === 'self' ? 'badge b-protect' : 'badge b-neutral'}; }),
        isPending:ta.status === 'pending' || ta.status === 'info', isApproved:ta.status === 'approved', locked:!canDecide, hasNote:!!ta.note, noteTitle:ta.status === 'info' ? 'Asked the applicant' : 'Reason shared with the applicant', note:ta.note || '',
        approve:tdlg('approve', 'Approve Trusted application'), info:tdlg('info', 'Ask for more information'), decline:tdlg('decline', 'Decline application'), revoke:tdlg('revoke', 'Remove Trusted status'), history:th.reverse()}; }

    /* verification */
    o.vf = {rows:s.vflags.map(function(v){ return {id:v.id, title:v.title, who:v.accounts.map(function(id){ return self.member(id).name; }).join(' & '), age:adAge(v.ageMin), st:v.status === 'open' ? 'Open' : 'Resolved', stCls:v.status === 'open' ? 'badge b-open' : 'badge b-done', open:function(){ self.go('vflag', v.id); }}; })};
    var vd = s.vflags.filter(function(v){ return v.id === s.sel; })[0]; o.vd = {};
    if (vd) o.vd = {id:vd.id, title:vd.title, detail:vd.detail, age:adAge(vd.ageMin), st:vd.status === 'open' ? 'Open' : 'Resolved', stCls:vd.status === 'open' ? 'badge b-open' : 'badge b-done', open:vd.status === 'open', done:vd.status !== 'open', locked:!canDecide,
      outcome:vd.outcome || '', outcomeBy:vd.decidedBy ? 'Resolved by ' + STAFF[vd.decidedBy].name : '',
      accounts:vd.accounts.map(function(id){ var m = self.member(id); return {ini:m.ini, name:m.name, handle:m.handle, joined:m.joined, ver:m.ver, open:function(){ self.go('member', id); }}; }),
      resolve:function(){ self.openDlg({kind:'vflag', ref:vd.id, title:'Resolve ' + vd.id, sub:vd.title}); }};

    /* members */
    var mq = (s.mSearch || '').trim().toLowerCase();
    var openFor = function(id){ return s.cases.filter(function(x){ return x.subject === id && x.status !== 'resolved'; }).length; };
    var mRows = s.members.filter(function(m){ if (mq && (m.name + ' ' + m.handle).toLowerCase().indexOf(mq) < 0) return false;
      if (s.mFilter === 'attention') return openFor(m.id) > 0 || m.ver === 'Needs information' || m.ver === 'Pending';
      if (s.mFilter === 'restricted') return m.standing !== 'Good standing'; if (s.mFilter === 'trusted') return m.trust !== '—'; return true; });
    var verCls = function(v){ return v === 'Verified' ? 'badge b-done' : (v === 'Unverified' ? 'badge b-neutral' : 'badge b-protect'); };
    var stdCls = function(st){ return /Suspend|Limited/.test(st) ? 'std-bad' : (st === 'Warned' ? 'std-warn' : 'std-good'); };
    o.mb = {tabs:tab('m', s.mFilter, [['all', 'All'], ['attention', 'Needs attention'], ['restricted', 'Restricted'], ['trusted', 'Trusted']], 'mFilter'), empty:!mRows.length,
      rows:mRows.map(function(m){ return {name:m.name, handle:m.handle, ini:m.ini, ver:m.ver, verCls:verCls(m.ver), trust:m.trust, standing:m.standing, stdCls:stdCls(m.standing), openCnt:String(openFor(m.id)), joined:m.joined, open:function(){ self.go('member', m.id); }}; })};
    var md = s.members.filter(function(m){ return m.id === s.sel; })[0]; o.md = {};
    if (md) { var mcases = s.cases.filter(function(x){ return x.subject === md.id; }); var hist = s.audit.filter(function(a){ return a.target.indexOf(md.name) >= 0 || mcases.some(function(x){ return a.target.indexOf(x.id) === 0; }); });
      var pendS = s.pending.some(function(p){ return p.member === md.id; }); var restricted = md.standing !== 'Good standing';
      var mdlg = function(mode, title){ return function(){ self.openDlg({kind:'member', mode:mode, ref:md.id, title:title, sub:md.name}); }; };
      var acts = [{label:'Add a warning', cls:'btn btn-secondary', go:mdlg('warn', 'Add a warning')}, {label:'Temporary limit', cls:'btn btn-secondary', go:mdlg('limit', 'Apply a temporary limit')}, {label:'Suspend account', cls:'btn btn-secondary', go:mdlg('suspend', 'Propose a suspension'), disabled:pendS || md.standing === 'Suspended'}];
      if (restricted) acts.unshift({label:'Lift restriction', cls:'btn btn-ok', go:mdlg('lift', 'Lift restriction')});
      if (md.trust !== '—') acts.push({label:'Remove Trusted status', cls:'btn btn-ghost', go:function(){ var ap2 = s.apps.filter(function(a){ return a.member === md.id && a.status === 'approved'; })[0]; if (ap2) self.openDlg({kind:'trust', mode:'revoke', ref:ap2.id, title:'Remove Trusted status', sub:md.name}); }});
      acts.push({label:'Sign out all sessions', cls:'btn btn-ghost', go:mdlg('signout', 'Sign out all sessions')});
      acts.forEach(function(a){ a.disabled = !!a.disabled || !canDecide; });
      o.md = {name:md.name, handle:md.handle, ini:md.ini, joined:md.joined, ver:md.ver, trust:md.trust, standing:md.standing, stdCls:stdCls(md.standing), area:md.area, openReports:openFor(md.id) ? openFor(md.id) + ' (allegations, not findings)' : 'None',
        findings:(function(){ var f = mcases.filter(function(x){ return x.status === 'resolved' && x.outcome && x.outcome.indexOf('No violation') !== 0 && x.kind === 'report'; }); return f.length ? f.length + ' decided case' + (f.length > 1 ? 's' : '') : 'None'; })(),
        cases:mcases.map(function(x){ return {id:x.id, title:x.title, category:x.category, st:STATUS_LABEL[x.status], stCls:STATUS_CLS[x.status], open:openCase(x.id)}; }), noCases:!mcases.length,
        actions:acts, pendingSusp:pendS, history:hist.map(function(a){ return {action:a.action, who:STAFF[a.who] ? STAFF[a.who].name : a.who, at:a.at, reason:a.reason}; }), noHistory:!hist.length}; }

    /* audit */
    var lq = (s.lSearch || '').trim().toLowerCase();
    var lRows = s.audit.filter(function(a){ if (s.lWho !== 'all' && a.who !== s.lWho) return false; if (lq && (a.action + ' ' + a.target + ' ' + a.reason).toLowerCase().indexOf(lq) < 0) return false; return true; });
    o.lg = {tabs:tab('l', s.lWho, [['all', 'Everyone'], ['quinn', 'Quinn'], ['dana', 'Dana Ruiz'], ['ops', 'Ops support']], 'lWho'), empty:!lRows.length,
      rows:lRows.map(function(a){ var w = STAFF[a.who] || {name:a.who, ini:'?', av:'av'}; return {at:a.at, who:w.name, ini:w.ini, av:w.av + ' av-sm', action:a.action, target:a.target, reason:a.reason}; })};
    o.exportCsv = function(){ var esc = function(x){ return '"' + String(x).replace(/"/g, '""') + '"'; }; var csv = ['When,Reviewer,Action,Item,Reason'].concat(lRows.map(function(a){ return [a.at, STAFF[a.who] ? STAFF[a.who].name : a.who, a.action, a.target, a.reason].map(esc).join(','); })).join('\n');
      try { var url = URL.createObjectURL(new Blob([csv], {type:'text/csv'})); var l = document.createElement('a'); l.href = url; l.download = 'lux-flow-audit-log.csv'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(function(){ URL.revokeObjectURL(url); }, 1000); self.setState({audit:self.log('Exported audit log', lRows.length + ' entries', 'CSV')}); self.toast('Audit log exported (' + lRows.length + ' entries).'); } catch (e) { self.toast('Export isn’t available in this view.'); } };

    /* settings */
    var sw = function(key, label, hint, locked){ var on = !!s.settings[key]; return {label:label, hint:hint, on:on ? 'true' : 'false', cls:'toggle' + (on ? ' on' : ''), disabled:!isAdmin || !!locked, toggle:function(){ var st = Object.assign({}, s.settings); st[key] = !on; self.setState({settings:st, audit:self.log((on ? 'Turned off ' : 'Turned on ') + label.toLowerCase(), 'Settings')}); }}; };
    o.st = {team:['quinn', 'dana', 'ops'].map(function(id){ var a = STF[id]; return {name:a.full + (id === s.who ? ' (you)' : ''), role:a.role, av:a.av, ini:a.ini, can:a.canDecide ? 'Decides cases, appeals of the other reviewer’s decisions, Trusted applications and flags' : 'Can view queues and records. Can’t decide.'}; }),
      ai:[sw('aiSort', 'Sort reports by type and priority', 'Suggests a priority. A person can change it.'), sw('aiEdits', 'Check larger edits against six areas', 'May approve or escalate. Rejects only clear policy violations.'), sw('aiPatterns', 'Flag unusual patterns', 'For example, bursts of reports or many new accounts from one device.')],
      alerts:[sw('email', 'Email both reviewers', 'For threats, child safety and exposed private details.'), sw('push', 'Push notification to both reviewers', 'Arrives on the reviewer’s phone.')],
      darkCls:s.theme !== 'light' ? 'on' : '', lightCls:s.theme === 'light' ? 'on' : '', darkOn:s.theme !== 'light' ? 'true' : 'false', lightOn:s.theme === 'light' ? 'true' : 'false',
      setDark:function(){ self.set({theme:'dark'}); }, setLight:function(){ self.set({theme:'light'}); }};
    o.tm = {rule:'Phase 1 runs with at least two active reviewers. Quinn is admin and primary reviewer. The development team builds these tools but doesn’t moderate content.',
      invite:function(){ self.openDlg({kind:'invite', title:'Invite a team member', sub:'They’ll get an email to set up their staff account with two-step verification. (Simulated.)', outcome:'reviewer', name:''}); },
      rows:['quinn', 'dana', 'ops'].map(function(id){ var a = STF[id]; var rev = a.kind === 'reviewer'; return {name:a.full + (id === s.who ? ' (you)' : ''), note:id === 'quinn' ? 'Owner · can’t be changed here' : a.kind === 'operator' ? 'View only' : 'Decides cases', av:a.av + ' av-sm', ini:a.ini, fixed:id === 'quinn', editable:id !== 'quinn', role:a.role, roleAria:'Role for ' + a.name,
        revCls:rev ? 'on' : '', opCls:rev ? '' : 'on', revOn:rev ? 'true' : 'false', opOn:rev ? 'false' : 'true', setRev:function(){ self.setRole(id, 'reviewer'); }, setOp:function(){ self.setRole(id, 'operator'); },
        st:a.active ? 'Active' : 'Deactivated', stCls:a.active ? 'badge b-done' : 'badge b-neutral', last:a.active ? a.last : '—', hasAct:id !== 'quinn', actLabel:a.active ? 'Deactivate' : 'Reactivate', act:function(){ self.setActive(id, !a.active); }}; })
        .concat((s.invites || []).map(function(v, i){ return {name:v.name, note:'Invited ' + v.at, av:'av av-sm', ini:v.name.split(' ').map(function(x){ return x[0]; }).join('').slice(0, 2).toUpperCase(), fixed:true, editable:false, role:ROLE_LABEL[v.kind], st:'Invite sent', stCls:'badge b-open', last:'—', hasAct:true, actLabel:'Cancel invite', act:function(){ self.setState({invites:s.invites.filter(function(_, j){ return j !== i; }), audit:self.log('Cancelled invite', v.name)}); self.toast('Invite cancelled.'); }}; })),
      perms:PERMS.map(function(p){ var r = {label:p[0]}; p.slice(1).forEach(function(v, i){ var n = i + 1; r['c' + n + 'cls'] = 'perm perm-' + v; r['c' + n + 'icon'] = v === 'yes' ? ICN.check : (v === 'view' ? ICN.eye : ICN.block); r['c' + n + 'text'] = v === 'yes' ? 'Yes' : (v === 'view' ? 'View' : 'No'); }); return r; })};
    o.askReset = function(){ self.openDlg({kind:'reset', title:'Reset demo data?', sub:'All decisions in this browser will be cleared.'}); };

    /* dialog */
    var d = s.dlg; o.dlg = {any:!!d};
    o.closeDlg = function(){ self.set({dlg:null}); }; o.closeDlgBg = function(e){ if (e.target === e.currentTarget) self.set({dlg:null}); };
    if (d) { var D = {any:true, title:d.title, sub:d.sub || '', hasSub:!!d.sub, err:d.err, hasErr:!!d.err, cancel:'Cancel', okCls:'btn btn-primary', okLabel:'Save', ok:function(){ self.submit(); },
        note:d.note, internal:d.internal, onNote:function(e){ self.patchDlg({note:e.target.value.slice(0, 600), err:'', touched:true}); }, onInternal:function(e){ self.patchDlg({internal:e.target.value.slice(0, 600)}); }, noteInvalid:d.err && !d.note.trim() ? 'true' : 'false'};
      var radio = function(list, cur, key){ return list.map(function(x){ var on = cur === x.id; return {label:x.label, hint:x.hint || '', cls:'opt-row' + (on ? ' on' : ''), checked:on ? 'true' : 'false', pick:function(){ var p = {err:''}; p[key] = x.id; if (key === 'outcome' && d.kind === 'decide') { var cs2 = s.cases.filter(function(y){ return y.id === d.ref; })[0]; if (!d.policy && x.needsPolicy && POLICIES.indexOf(cs2.category) >= 0) p.policy = cs2.category; } if (key === 'outcome' && d.kind === 'decide' && !d.touched) { var cs2 = s.cases.filter(function(y){ return y.id === d.ref; })[0]; p.note = (NOTE_TEMPLATES[x.id] || '').replace('{obj}', cs2 ? cs2.objType.toLowerCase() : 'post').replace('{policy}', p.policy || d.policy || cs2.category).replace('{limit}', d.limit); } self.patchDlg(p); }}; }); };
      if (d.kind === 'decide') { var oc = OUTCOMES.filter(function(x){ return x.id === d.outcome; })[0]; var cs3 = s.cases.filter(function(y){ return y.id === d.ref; })[0];
        var forced = /private|Child/.test((d.policy || '') + ' ' + cs3.category) && oc && oc.id !== 'dismiss' && oc.id !== 'guidance';
        Object.assign(D, {hasOptions:true, optLegend:'Outcome', options:radio(OUTCOMES, d.outcome, 'outcome'), hasLimit:!!oc && oc.id === 'limit',
          limits:LIMITS.map(function(l){ var on = d.limit === l; return {label:l, cls:on ? 'on' : '', checked:on ? 'true' : 'false', pick:function(){ self.patchDlg({limit:l, note:d.touched ? d.note : (NOTE_TEMPLATES.limit).replace('{obj}', cs3.objType.toLowerCase()).replace('{policy}', d.policy || cs3.category).replace('{limit}', l)}); }}; }),
          hasPolicy:!!oc && oc.needsPolicy, policyLabel:'Which standard does it break?', policies:POLICIES.map(function(p){ var on = d.policy === p; return {label:p, cls:'chip' + (on ? ' on' : ''), checked:on ? 'true' : 'false', pick:function(){ var pp = {policy:p, err:''}; if (!d.touched && oc) pp.note = (NOTE_TEMPLATES[oc.id] || '').replace('{obj}', cs3.objType.toLowerCase()).replace('{policy}', p).replace('{limit}', d.limit); self.patchDlg(pp); }}; }),
          hasArchive:!!oc && oc.id !== 'dismiss' && oc.id !== 'guidance', archiveOn:d.archive || forced, archiveForced:forced, archivePressed:(d.archive || forced) ? 'true' : 'false', archiveCls:'opt-row' + ((d.archive || forced) ? ' on' : ''),
          archiveHint:forced ? 'Required for privacy, safety and legal removals — copies become a short “Removed” notice.' : 'Ordinary removals leave saved copies marked “No longer available at source”.', toggleArchive:function(){ self.patchDlg({archive:!d.archive}); },
          hasNote:!!oc && oc.id !== 'dismiss', noteLabel:'Message to the member', notePh:'Explain what happened and why, in plain words', noteHelp:'Shared with the member. Don’t include the reporter’s identity or anyone’s private details.',
          hasInternal:!!oc, hasPreview:!!oc && oc.id !== 'dismiss' && !!d.note.trim(), preview:d.note,
          okLabel:oc ? (oc.id === 'suspend' ? 'Propose suspension' : 'Confirm: ' + oc.label) : 'Save decision', okCls:oc && /remove|warn|limit|suspend/.test(oc.id) ? 'btn btn-danger' : 'btn btn-primary'}); }
      if (d.kind === 'edit') { var rej = d.mode === 'reject';
        Object.assign(D, {hasPolicy:rej, policyLabel:'Which area does the edit fail?', policies:EDIT_AREAS.map(function(p){ var on = d.policy === p; return {label:p, cls:'chip' + (on ? ' on' : ''), checked:on ? 'true' : 'false', pick:function(){ self.patchDlg({policy:p, err:''}); }}; }),
          hasNote:true, noteLabel:rej ? 'Reason for the author' : 'Note to the author (optional)', notePh:rej ? 'e.g. The edit swaps the cited study, which changes what earlier replies were responding to.' : 'Optional', noteHelp:rej ? 'The author sees this with an Appeal button. Appeals go to a different reviewer.' : 'The post updates and shows an Edited label with today’s date.',
          okLabel:rej ? 'Reject edit' : 'Approve edit', okCls:rej ? 'btn btn-danger' : 'btn btn-ok'}); }
      if (d.kind === 'appeal') { Object.assign(D, {hasOptions:true, optLegend:'Outcome', options:radio([{id:'uphold', label:'Uphold the original decision', hint:'The decision stands. The member is told why.'}, {id:'overturn', label:'Overturn', hint:'Restore the content and any affected permissions or indicators.'}, {id:'modify', label:'Modify', hint:'Apply a lighter outcome — for example, guidance instead of removal.'}], d.outcome, 'outcome'),
          hasNote:true, noteLabel:'Explanation for the member', notePh:'What you reviewed and why you reached this outcome', noteHelp:'Shared with the member and recorded in the audit log.', okLabel:'Save appeal decision'}); }
      if (d.kind === 'trust') { var lbls = {approve:['Approve', 'btn btn-ok', 'Why this person is ready for the responsibility'], decline:['Decline', 'btn btn-danger', 'What’s missing — kind, specific and fair'], info:['Send request', 'btn btn-primary', 'What would help you decide'], revoke:['Remove Trusted status', 'btn btn-danger', 'Why the status is being removed']}[d.mode];
        Object.assign(D, {hasText:true, text:d.mode === 'approve' ? 'Base this on the participation record and the application — not on verification alone, popularity or activity totals.' : (d.mode === 'revoke' ? 'Trusted status can be reviewed and removed. The member can ask for a review.' : 'The applicant is told the outcome. They can apply again later.'),
          hasNote:true, noteLabel:'Reason shared with the applicant', notePh:lbls[2], noteHelp:'Recorded in the decision history and the audit log.', okLabel:lbls[0], okCls:lbls[1]}); }
      if (d.kind === 'vflag') { var vv = s.vflags.filter(function(x){ return x.id === d.ref; })[0];
        Object.assign(D, {hasOptions:true, optLegend:'Outcome', options:radio(self.vOptions(vv), d.outcome, 'outcome'), hasText:true, text:'An automatic ban isn’t an option here. A flag or failed check doesn’t prove dishonesty.', hasNote:true, noteLabel:'Reason for the record', notePh:'What you checked', noteHelp:'Recorded in the audit log.', okLabel:'Resolve flag'}); }
      if (d.kind === 'member') { var mmd = {warn:['Add warning', 'btn btn-danger', 'A warning is recorded on the account. The member is told why and can appeal.'], limit:['Apply limit', 'btn btn-danger', 'Pauses posting and messaging. The member can still read, and is told when it ends.'], suspend:['Propose suspension', 'btn btn-danger', 'A suspension needs a second reviewer to confirm before it takes effect.'], lift:['Lift restriction', 'btn btn-ok', 'Restores normal participation and updates the member’s status.'], signout:['Sign out sessions', 'btn btn-primary', 'Use when an account may be compromised. The member signs in again.']}[d.mode];
        Object.assign(D, {hasText:true, text:mmd[2], hasLimit:d.mode === 'limit', limits:LIMITS.map(function(l){ var on = d.limit === l; return {label:l, cls:on ? 'on' : '', checked:on ? 'true' : 'false', pick:function(){ self.patchDlg({limit:l}); }}; }),
          hasNote:true, noteLabel:'Reason', notePh:'What happened and which standard applies', noteHelp:'Recorded in the audit log and shared with the member where appropriate.', okLabel:mmd[0], okCls:mmd[1]}); }
      if (d.kind === 'sendback') Object.assign(D, {hasNote:true, noteLabel:'Note for the other reviewer', notePh:'What you’d like them to reconsider', noteHelp:'Recorded in the case history.', okLabel:'Send back'});
      if (d.kind === 'invite') Object.assign(D, {hasName:true, name:d.name || '', onName:function(e){ self.patchDlg({name:e.target.value.slice(0, 60), err:''}); }, nameInvalid:d.err && !(d.name || '').trim() ? 'true' : 'false',
        hasOptions:true, optLegend:'Role', options:radio([{id:'reviewer', label:'Reviewer', hint:'Decides cases, edits, appeals of others’ decisions, Trusted applications and flags.'}, {id:'operator', label:'Operator', hint:'Can view queues and records. Can’t decide anything.'}], d.outcome, 'outcome'), okLabel:'Send invite'});
      if (d.kind === 'reset') Object.assign(D, {hasText:true, text:'Cases, appeals, applications, flags and the audit log go back to the sample data. You stay signed in.', okLabel:'Reset demo data', okCls:'btn btn-danger'});
      o.dlg = D; }
    return o;
  }
}
