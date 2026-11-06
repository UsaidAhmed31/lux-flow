const fs=require('fs');
const src=fs.readFileSync('check.js','utf8').replace('new Component({}).renderVals();console.log("ok")','');
const store={};
global.window={localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v;},removeItem:k=>{delete store[k];}}};
const pre=`class DCLogic{constructor(p){this.props=p||{};} setState(u){this.prev=this.state; this.state=Object.assign({},this.state,typeof u==='function'?u(this.state):u); this.renderVals(); if(this.componentDidUpdate) this.componentDidUpdate({}, this.prev);}};`;
global.setTimeout=(f)=>{f(); return 0;}; global.clearTimeout=()=>{};
eval(pre+src.replace('class DCLogic{};','')+`
global.C=Component; global.TODAY=TODAY;`);
let c=new C({}); c.componentDidMount();
const rv=()=>c.renderVals();
let v=rv();
const ok=(cond,msg)=>{ if(!cond){ console.log('FAIL:',msg); process.exitCode=1; } else console.log('ok -',msg); };
// every screen renders
for(const sc of ['home','flow','post','people','profile','create','communities','community','chat','convo','archive','verify','privacy','system','journal','calendar','settings','trusted','admin']){ c.setState({screen:sc, openPost:'p1', openComm:'garden', openConv:'d-amara', openSys:'wisdom'}); v=rv(); }
c.setState({screen:'home',hist:[]}); v=rv();
ok(v.obShow && v.obSteps.length===4 && v.obProgress==='0 of 4 done' || v.obProgress.indexOf('of 4')>0,'onboarding visible '+v.obProgress);
ok(v.nextItems.length>=2,'next items: '+v.nextItems.map(n=>n.title).join(' | '));
// system explorer
v.obSteps[0].go(); v=rv(); ok(c.state.screen==='system' && v.sysReady,'system explorer opens');
ok(v.sysx.name && v.sysx.posts.length>=0,'sysx '+v.sysx.name+' posts '+v.sysx.posts.length+' people '+v.sysx.people.length+' comms '+v.sysx.comms.length);
v.sysChipsAll[3].pick(); v=rv(); ok(v.sysx.name==='Wisdom' && v.sysx.posts.length===2,'wisdom posts '+v.sysx.posts.length);
c.setState({netFail:true}); v=rv(); ok(v.sysError,'system error state'); c.setState({netFail:false}); v.retrySys(); v=rv(); ok(v.sysReady,'system retry');
v.sysx.openFlow(); v=rv(); ok(c.state.screen==='flow' && v.flowReady && v.feed.every(p=>p.sysName==='Wisdom'),'system → flow filtered');
// flow states & refresh
c.setState({flowSys:'all'}); c.setState({netFail:true}); v=rv(); ok(v.flowError,'flow error'); c.setState({netFail:false}); v.retryFlow(); v=rv(); ok(v.flowReady && v.feed.length===5,'flow retry ok');
c.setState({flowSort:'global'}); v=rv(); v.refreshFlow(); v=rv(); ok(v.feed[0].title==='Ten minutes of doing nothing','refresh brings new post'); v.refreshFlow(); v=rv(); ok(v.feed.filter(p=>p.title==='Ten minutes of doing nothing').length===1,'second refresh adds nothing');
v.sortForYou(); v=rv(); ok(v.feed.length===5,'for you'); v.sortLatest(); v=rv();
const p2=v.feed.find(p=>p.hasComm); ok(!!p2,'post with community link: '+(p2&&p2.commName));
v.feed[1].openSys(); v=rv(); ok(c.state.screen==='system','post ctx → system'); v.back&&v.back(); v=rv();
// post detail: reflect / discuss / save, author nav
c.setState({screen:'flow'}); v=rv(); v.feed[1].open(); v=rv(); ok(c.state.screen==='post' && v.hasCur,'post detail '+v.cur.title);
v.cur.signals[1].toggle(); v=rv(); ok(c.state.ob.reflect && c.state.ob.read,'onboarding marks read+reflect');
// create event with validation
v.goCreate(); v=rv(); ok(v.cr.types.every(t=>!t.disabled),'all 8 types enabled');
v.cr.types[5].pick(); v=rv(); ok(v.crx.isEvent,'event fields');
v.cr.onTitle({target:{value:'Saturday sketch walk'}}); v=rv(); v.cr.onBody({target:{value:'Bring a pencil.'}}); v=rv(); v.cr.sysChips[0].pick(); v=rv(); v.cr.tagChips[0].pick(); v=rv(); v.cr.auds[0].pick(); v=rv();
ok(v.cr.cantPublish,'event incomplete without date');
v.crx.onDate({target:{value:'2026-10-01'}}); v=rv(); ok(v.crx.dateErr,'past date error');
v.crx.onDate({target:{value:'2026-10-31'}}); v=rv(); v.crx.onTime({target:{value:'10:30'}}); v=rv(); v.crx.onCap({target:{value:'abc'}}); v=rv(); ok(v.crx.capErr && v.cr.cantPublish,'capacity validation');
v.crx.onCap({target:{value:'12'}}); v=rv(); v.crx.onPlace({target:{value:'Riverside Park gate'}}); v=rv(); ok(!v.cr.cantPublish,'event complete');
v.cr.publish(); v=rv(); ok(c.state.dialog && c.state.dialog.kind==='gtk','good-to-know confirm shown'); v.gtk.confirm(); v=rv(); ok(v.cr.done,'published'); const newId=c.state.createDone; v.cr.openPublished(); v=rv(); ok(c.state.screen==='post' && v.cur.title==='Saturday sketch walk' && v.curMine,'opened own post, when='+v.cur.when);
c.setState({screen:'calendar', calSel:'2026-10-31', calMonth:'2026-10'}); v=rv(); ok(v.calx.dayItems.some(i=>i.title==='Saturday sketch walk'),'hosted event in calendar');
c.setState({screen:'profile', openPerson:null}); v=rv(); ok(v.prof.posts.some(p=>p.title==='Saturday sketch walk'),'appears on profile');
c.setState({screen:'flow'}); v=rv(); ok(v.feed.some(p=>p.title==='Saturday sketch walk'),'appears in flow');
// discard confirmation
v.goCreate(); v=rv(); v.cr.types[0].pick(); v=rv(); v.cr.onTitle({target:{value:'x'}}); v=rv(); v.cr.discard(); v=rv(); ok(v.dlg.discard,'discard confirm'); v.confirmDiscard(); v=rv(); ok(!c.state.create.title,'discarded');
// edit large → review → admin reject → appeal → other reviewer
c.setState({screen:'post', openPost:newId}); v=rv(); v.curEdit(); v=rv(); v.onEditDraft({target:{value:'Bring a pencil and a small sketchbook, a flask of tea and something to sit on. We will walk slowly along the river.'}}); v=rv(); v.saveEdit(); v=rv(); ok(v.pend.review,'edit under review');
v.openAdmin(); v=rv(); ok(v.dlg.adminSignIn,'admin sign-in dialog'); v.adminSignIn[0].pick(); v=rv(); ok(v.isAdminMode && v.ad.authorized,'admin console');
c.setState({adminTab:'edits'}); v=rv(); ok(v.ad.edits.length===2,'two edits pending (seed + mine)');
v.ad.edits.find(e=>e.author==='Rae Lindqvist').reject(); v=rv(); ok(v.ad.confirmDisabled,'reason required'); v.ad.reasons[0].pick(); v=rv(); v.ad.confirm(); v=rv(); ok(c.state.audit[0].action==='Rejected edit','rejected + audit');
v.ad.exit(); c.setState({screen:'post', openPost:newId}); v=rv(); ok(v.pend.rejected && v.pend.reason.indexOf('Original Meaning')===0,'user sees rejection reason');
v.pend.appeal(); v=rv(); ok(v.pend.appealed,'appealed');
v.adminSignIn[0].pick(); c.setState({adminTab:'appeals'}); v=rv(); ok(v.ad.appeals[0].blocked,'same reviewer blocked from appeal');
v.ad.switchTo(); v=rv(); ok(v.ad.appeals[0].canDecide,'other reviewer can decide'); v.ad.appeals[0].overturn(); v=rv(); v.ad.reasons[0].pick(); v=rv(); v.ad.confirm(); v=rv();
c.setState({screen:'post', openPost:newId}); v=rv(); ok(v.cur.edited && /sketchbook/.test(v.cur.paras[0].text),'overturned edit live');
// report → admin queue → remove → archive shows removed
c.setState({screen:'flow'}); v=rv(); const tgt=v.feed.find(p=>p.title.indexOf('emergency')>=0) ; c.setState({saved:Object.assign({},c.state.saved)});
c.setState({dialog:{kind:'report', title:'Report', who:'Elias', target:'p6'}, reportReason:'Spam or scam'}); v=rv(); v.submitReport(); v=rv(); ok(c.state.reportsQ[0].reporter==='You','report queued');
c.setState({screen:'privacy'}); v=rv(); ok(v.hasMyReports,'my reports listed');
v.adminSignIn[0].pick(); c.setState({adminTab:'reports'}); v=rv(); const r=v.ad.reports.find(x=>x.reporter.indexOf('Rae')===0); ok(r && r.canRemove,'can remove post'); r.remove(); v=rv(); v.ad.reasons[2].pick(); v=rv(); v.ad.confirm(); v=rv();
c.setState({screen:'archive'}); v=rv(); const ai=v.archItems.find(i=>/emergency/.test(i.title)); ok(ai && ai.gone && /Removed/.test(ai.goneText),'archive shows removed');
// conv report with included messages
c.setState({dialog:{kind:'report', title:'Report', who:'Amara', target:'d-amara'}, reportReason:'Harassment or threats'}); v=rv(); ok(v.isConvReport,'conv report toggle'); v.submitReport(); v=rv(); ok(c.state.reportsQ[0].priority==='urgent' && /Included/.test(c.state.reportsQ[0].excerpt),'conv report urgent+included');
// trusted
c.setState({screen:'trusted'}); v=rv(); ok(v.tr.canApply,'can apply trusted'); v.tr.submit(); v=rv(); ok(v.tr.pathErr && v.tr.whyErr && v.tr.ackErr,'trusted validation');
v.tr.onPath({target:{value:'Co-hosting Alder Street work days'}}); v=rv(); v.tr.onWhy({target:{value:'I have helped at three work days and brought tools for newcomers each time.'}}); v=rv(); v.tr.toggleAck(); v=rv(); v.tr.submit(); v=rv(); ok(v.tr.isPending && !v.trusted,'pending, not trusted automatically');
v.adminSignIn[1].pick(); c.setState({adminTab:'trusted'}); v=rv(); v.ad.trust[0].approve(); v=rv(); v.ad.reasons[0].pick(); v=rv(); v.ad.confirm(); v=rv(); ok(v.trusted,'trusted after human approval');
c.setState({adminTab:'users'}); v=rv(); v.ad.users[0].restrict(); v=rv(); v.ad.reasons[1].pick(); v=rv(); v.ad.confirm(); v=rv(); ok(v.meRestricted,'rae restricted');
c.setState({screen:'convo', openConv:'d-amara'}); v=rv(); ok(!v.cv.canSend && v.cv.restrictedMe,'restricted cannot send');
c.setState({adminTab:'users', screen:'admin'}); v=rv(); v.ad.users[0].lift(); v=rv(); v.ad.reasons[0].pick(); v=rv(); v.ad.confirm(); v=rv(); ok(!v.meRestricted,'lifted'); ok(v.ad.audit.length>=7,'audit entries '+v.ad.audit.length);
c.setState({adminTab:'flags'}); v=rv(); v.ad.flags[0].distinct(); v=rv(); v.ad.reasons[0].pick(); v=rv(); v.ad.confirm(); v=rv(); ok(v.ad.flags[0].closed,'flag closed');
// chat: send fail retry, ordering, new message
c.setState({screen:'chat', openConv:null}); v=rv(); const before=v.convs.map(x=>x.id); v.convs[3].open(); v=rv(); const cid=c.state.openConv;
c.setState({netFail:true}); v=rv(); v.onDraft({target:{value:'Hello there'}}); v=rv(); v.send(); v=rv(); const last=v.cv.msgs[v.cv.msgs.length-1]; ok(last.failed,'message failed offline'); c.setState({netFail:false}); v=rv(); v.cv.msgs[v.cv.msgs.length-1].retry(); v=rv(); ok(!v.cv.msgs[v.cv.msgs.length-1].failed,'retry sent');
c.setState({screen:'chat', openConv:null}); v=rv(); ok(v.convs[0].id===cid,'conversation moved to top ('+before[3]+')');
v.onDraft({target:{value:'   '}}); v=rv(); ok(v.cantSend,'empty message blocked');
v.openNewMsg(); v=rv(); ok(v.newMsgList.length===3,'new message list'); v.newMsgList[0].pick(); v=rv();
// communities: tabs, join, post, members, leave, request
c.setState({screen:'community', openComm:'quiet', cmTab:'about'}); v=rv(); ok(v.cmx.tabs.length===3,'community tabs');
v.cm.act(); v=rv(); ok(c.state.member.quiet==='joined','joined quiet'); v.cmx.tabs[1].pick(); v=rv(); v.cmx.onDraft({target:{value:'See you Sunday'}}); v=rv(); v.cmx.post(); v=rv(); ok(v.cmx.threads.some(t=>t.text==='See you Sunday'),'community post');
v.cmx.tabs[2].pick(); v=rv(); ok(v.cmx.memberList.some(m=>/you/.test(m.name)),'members incl you');
c.setState({openComm:'readers'}); v=rv(); v.cm.act(); v=rv(); ok(c.state.member.readers==='pending','request pending'); c.setState({cmTab:'members'}); v=rv(); ok(v.cmx.membersLocked,'members locked');
c.setState({openComm:'nope'}); v=rv(); ok(v.commMissing,'missing community state');
// profile
c.setState({screen:'profile', openPerson:'priya'}); v=rv(); ok(v.profx.hasShared,'shared communities: '+v.profx.shared);
c.setState({openPerson:'ghost'}); v=rv(); ok(v.prof.missing,'missing profile');
// journal
c.setState({screen:'journal', jView:'list'}); v=rv(); ok(v.jx.entries[0].pinned,'pinned first'); v.jx.newEntry(); v=rv(); ok(v.jx.saveDisabled,'empty entry blocked');
v.jx.onTitle({target:{value:'Test'}}); v=rv(); v.jx.onBody({target:{value:'A private note.'}}); v=rv(); v.jx.sysChips[3].pick(); v=rv(); v.jx.save(); v=rv(); ok(v.jx.detail && v.jx.cur.sysName==='Presence','saved entry');
v.jx.backToList(); v=rv(); c.setState({jQuery:'zzz'}); v=rv(); ok(v.jx.empty && /match/.test(v.jx.emptyText),'journal no match'); c.setState({jQuery:''}); v=rv();
v.jx.entries[0].toggleMenu(); v=rv(); v.jx.entries[0].showMove(); v=rv(); v.jx.entries[0].moves[1].pick(); v=rv(); v.jx.entries[0].toggleMenu && 0;
v.jx.entries[1].del(); v=rv(); ok(v.dlg.jDel,'delete confirm'); v.confirmJDel(); v=rv();
v.jx.newFolder(); v=rv(); v.onFolderDraft({target:{value:'Gratitude'}}); v=rv(); v.createJFolder(); v=rv(); ok(c.state.jFolder==='Gratitude' && v.jx.empty && /folder is empty/.test(v.jx.emptyTitle),'empty folder');
v.jx.entries.length===0 && c.setState({jFolder:'all'}); v=rv(); v.jx.entries[0].edit(); v=rv(); v.jx.onBody({target:{value:'changed'}}); v=rv(); v.jx.cancel(); v=rv(); ok(v.dlg.jDiscard,'journal discard confirm'); v.confirmJDiscard(); v=rv();
// calendar
c.setState({screen:'calendar', calSel:TODAY, calMonth:'2026-10', jView:'list'}); v=rv(); v.calx.add(); v=rv(); ok(v.calAddOpts[4].disabled,'inner practice disabled');
v.calAddOpts[0].pick(); v=rv(); v.cfm.save(); v=rv(); ok(v.cfm.titleErr && v.cfm.timeErr,'cal form validation'); v.cfm.onTitle({target:{value:'Dentist'}}); v=rv(); v.cfm.onTime({target:{value:'15:00'}}); v=rv(); v.cfm.save(); v=rv(); ok(v.calx.dayItems.some(i=>i.title==='Dentist'),'personal event added');
v.calx.add(); v=rv(); v.calAddOpts[3].pick(); v=rv(); v.cfm.repeatSeg[1].pick(); v=rv(); v.cfm.saveRefl(); v=rv(); const ri=v.calx.dayItems.find(i=>i.isRefl); ok(ri && ri.reflOpen,'reflection scheduled');
ri.write(); v=rv(); v.calx.onRefl({target:{value:'The heron again.'}}); v=rv(); v.calx.submit(); v=rv(); v.confirmReflLock(); v=rv(); ok(v.calx.writeLocked && c.state.journal[0].body==='The heron again.','reflection locked → journal');
c.setState({calSel:'2026-10-22'}); v=rv(); ok(v.calx.dayItems.some(i=>i.isRefl),'daily repeat next day');
c.setState({calSel:'2026-10-25'}); v=rv(); const qh=v.calx.dayItems.find(i=>i.isCommunity); ok(qh,'RSVP event in calendar'); qh.cancel(); v=rv(); ok(!v.calx.dayItems.some(i=>i.isCommunity),'cancelled RSVP');
v.calx.next(); v=rv(); v.calx.next(); v=rv(); v.calx.next(); v=rv(); ok(c.state.calMonth==='2026-12' && v.calx.nextDisabled,'month bounds');
// settings / sign out / reset / persistence
c.setState({screen:'settings'}); v=rv(); v.setx.toggleLT(); v=rv(); ok(/lg-text/.test(v.appCls),'large text'); v.setx.toggleRM(); v=rv(); ok(/ rm/.test(v.appCls),'reduce motion');
v.setx.signOut(); v=rv(); v.confirmSignOut(); v=rv(); ok(v.signedOut && /mode-out/.test(v.appCls),'signed out'); v.signIn(); v=rv(); ok(!v.signedOut,'signed in');
v.hideOb(); v=rv(); ok(!v.obShow,'ob hidden'); v.setx.showGuide(); v=rv(); ok(v.obShow,'ob shown again');
c.persistSoon(); ok(!!store['luxflow-proto-v3'],'persisted '+Math.round(store['luxflow-proto-v3'].length/1024)+'KB');
const c2=new C({}); ok(c2.state.firstVisit===false && c2.state.journal[0].body==='The heron again.' && c2.state.adminRole===null,'reload restores data (returning, admin signed out)');
c=c2; v=rv(); ok(/Welcome back/.test(v.homeGreet),'returning greeting');
v.askReset(); v=rv(); v.confirmReset(); v=rv(); ok(!store['luxflow-proto-v3'] || JSON.parse(store['luxflow-proto-v3']).journal.length===3,'reset');
// unverified gates
v.setUnverified(); v=rv(); c.setState({screen:'system', openSys:'unity', sysLoading:false}); v=rv(); ok(v.sysx.peopleLocked,'unverified people locked in system');
console.log(process.exitCode? 'SOME FAILED':'ALL OK');
