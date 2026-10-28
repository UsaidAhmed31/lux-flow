/* ===== Lux Flow Integrity — admin console prototype (simulated). Everything runs in this browser; nothing is sent anywhere.
   Permissions are simulated to show the intended boundaries — they are not production security. ===== */
var STORE = 'luxflow-admin-v1';
var ICN = __ICONS__;
ICN.sun = 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4';
ICN.moon = 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z';
ICN.queue = 'M4 6h16M4 12h16M4 18h10';
ICN.scale = 'M12 4v16M7 20h10M5 8h14M5 8l-2.5 6a3 3 0 0 0 5 0zM19 8l-2.5 6a3 3 0 0 0 5 0zM12 4l-2 1M12 4l2 1';
ICN.idcard = 'M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM9 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 16c.4-1.4 1.6-2.2 3-2.2s2.6.8 3 2.2M14 10h4M14 13h3';
ICN.log = 'M7 4h10a1 1 0 0 1 1 1v15H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9 9h6M9 12h6M9 15h4';
ICN.alert = 'M12 4l9 16H3zM12 10v4M12 17h.01';
ICN.download = 'M12 4v11M7 10l5 5 5-5M5 20h14';
ICN.signout = 'M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3M10 16l4-4-4-4M14 12H4';
ICN.swap = 'M7 7h12l-3-3M17 17H5l3 3';
ICN.ai = 'M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6zM18.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z';

var STAFF = {
  quinn:{id:'quinn', name:'Quinn', full:'Quinn (founder)', role:'Admin · primary reviewer', kind:'admin', ini:'Q', av:'av av-q', canDecide:true, last:'Now'},
  dana:{id:'dana', name:'Dana Ruiz', full:'Dana Ruiz', role:'Reviewer', kind:'reviewer', ini:'DR', av:'av av-d', canDecide:true, last:'Today · 7:58 AM'},
  ops:{id:'ops', name:'Ops support', full:'Ops support', role:'Operator · view only', kind:'operator', ini:'OS', av:'av av-o', canDecide:false, last:'Yesterday'}
};
var ROLE_LABEL = {admin:'Admin · primary reviewer', reviewer:'Reviewer', operator:'Operator · view only'};
var PERMS = [['Review the queue and case records', 'yes', 'yes', 'view'], ['Decide reports and edits', 'yes', 'yes', 'no'], ['Decide appeals of someone else’s decision', 'yes', 'yes', 'no'], ['Confirm a suspension as second reviewer', 'yes', 'yes', 'no'], ['Trusted applications and verification flags', 'yes', 'yes', 'no'], ['Export the audit log', 'yes', 'yes', 'no'], ['Manage the team and roles', 'yes', 'no', 'no'], ['Change AI and alert settings', 'yes', 'no', 'no'], ['Read Journals or unreported private chats', 'no', 'no', 'no']];
var WEEK = [{d:'Fri', r:5, x:4}, {d:'Sat', r:8, x:7}, {d:'Sun', r:6, x:6}, {d:'Mon', r:9, x:8}, {d:'Tue', r:4, x:5}, {d:'Wed', r:7, x:6}];
var POLICIES = ['Harassment or threats', 'Child safety', 'Shares private information', 'Spam or scam', 'Impersonation', 'Nudity (not allowed in Phase 1)', 'Other — explained in the note'];
var OUTCOMES = [
  {id:'dismiss', label:'No violation found', hint:'Close the report. Content and account stay as they are.', needsPolicy:false},
  {id:'guidance', label:'Send guidance', hint:'A friendly reminder of the community standards. No restriction.', needsPolicy:true},
  {id:'remove', label:'Remove content', hint:'The item disappears from Flow, profiles, communities, search and share links.', needsPolicy:true},
  {id:'warn', label:'Remove content and warn', hint:'Removes the item and records a warning on the account.', needsPolicy:true},
  {id:'limit', label:'Temporary limit', hint:'Pauses posting and messaging for a set time. Removes the item.', needsPolicy:true},
  {id:'suspend', label:'Suspend account', hint:'Needs a second reviewer to confirm before it takes effect.', needsPolicy:true}
];
var LIMITS = ['24 hours', '3 days', '7 days'];
var EDIT_AREAS = ['Original Meaning', 'Factual Corrections', 'Context Integrity', 'Creative Integrity', 'Safety & Privacy', 'Platform Policy'];
var URGENT_TYPES = {threat:'Threat', child:'Child safety', privacy:'Exposed private details'};

var MEMBERS = [
  {id:'spark44', name:'@spark_44', handle:'spark_44', ini:'S4', joined:'Sep 2026', ver:'Verified', trust:'—', standing:'Good standing', area:'Alder Street area', notes:''},
  {id:'deals4u', name:'@deals4u', handle:'deals4u', ini:'D4', joined:'Today', ver:'Unverified', trust:'—', standing:'Good standing', area:'—', notes:''},
  {id:'mira', name:'Mira Solano', handle:'mira.s', ini:'MS', joined:'Aug 2026', ver:'Verified', trust:'—', standing:'Good standing', area:'Riverside', notes:''},
  {id:'artforteens', name:'@free_art_lessons', handle:'free_art_lessons', ini:'FA', joined:'3 days ago', ver:'Pending', trust:'—', standing:'Good standing', area:'—', notes:''},
  {id:'kai', name:'@wanderlust_kai', handle:'wanderlust_kai', ini:'WK', joined:'Jul 2026', ver:'Verified', trust:'—', standing:'Warned', area:'—', notes:''},
  {id:'luxhelp', name:'@luxflow_support_team', handle:'luxflow_support_team', ini:'LS', joined:'Yesterday', ver:'Unverified', trust:'—', standing:'Good standing', area:'—', notes:''},
  {id:'theo', name:'Theo Marsh', handle:'theo.m', ini:'TM', joined:'Sep 2026', ver:'Verified', trust:'—', standing:'Good standing', area:'Eastside', notes:''},
  {id:'amara', name:'Amara Okafor', handle:'amara', ini:'AO', joined:'Jun 2026', ver:'Verified', trust:'—', standing:'Good standing', area:'Northside', notes:''},
  {id:'leilani', name:'Leilani Kahale', handle:'leilani', ini:'LK', joined:'Jun 2026', ver:'Verified', trust:'—', standing:'Good standing', area:'—', notes:''},
  {id:'priya', name:'Priya Raman', handle:'priya', ini:'PR', joined:'May 2026', ver:'Verified', trust:'—', standing:'Good standing', area:'Eastside', notes:''},
  {id:'tomas', name:'Tomás Reyes', handle:'tomasr', ini:'TR', joined:'May 2026', ver:'Verified', trust:'Trusted · Event organizer', standing:'Good standing', area:'Alder Street', notes:''},
  {id:'noor', name:'Noor Haddad', handle:'noor', ini:'NH', joined:'Jul 2026', ver:'Verified', trust:'—', standing:'Good standing', area:'—', notes:''},
  {id:'jun', name:'Jun Park', handle:'junpark', ini:'JP', joined:'May 2026', ver:'Verified', trust:'—', standing:'Good standing', area:'Riverside', notes:''},
  {id:'jpstudio', name:'@jpark_studio', handle:'jpark_studio', ini:'JS', joined:'Today', ver:'Needs information', trust:'—', standing:'Good standing', area:'—', notes:''},
  {id:'ellie', name:'Ellie Wren', handle:'ellie.w', ini:'EW', joined:'Today', ver:'Needs information', trust:'—', standing:'Good standing', area:'—', notes:''},
  {id:'sam', name:'Sam Whitfield', handle:'samw', ini:'SW', joined:'Jun 2026', ver:'Verified', trust:'—', standing:'Good standing', area:'—', notes:''}
];

var CASES = [
  {id:'C-1042', kind:'report', priority:'urgent', urgent:'threat', category:'Harassment or threats', objType:'Comment', title:'Comment on “Alder Street beds need two more hands”', where:'Alder Street Growers · community post', excerpt:'You’d better not show up on Saturday. I know which bus you take.', reporter:'Tomás Reyes', reporterNote:'This is aimed at a new volunteer who said she’d come. She’s scared to go now.', subject:'spark44', ageMin:34, status:'open', assignee:null, ai:'Sorted as urgent: possible threat of harm. A person decides the outcome.', reports:2},
  {id:'C-1041', kind:'report', priority:'urgent', urgent:'privacy', category:'Shares private information', objType:'Group message', title:'Message in the Riverside Quiet Hour group', where:'Riverside Quiet Hour · group chat (reported message only)', excerpt:'For anyone who wants to drop round: Jun lives at [house number withheld in review] Willow Lane, the blue door.', reporter:'Jun Park', reporterNote:'That’s my home address. I never shared it in the group.', subject:'mira', ageMin:72, status:'review', assignee:'quinn', ai:'Sorted as urgent: a home address may be exposed. Protective action is available while you review.', reports:1},
  {id:'C-1040', kind:'report', priority:'urgent', urgent:'child', category:'Child safety', objType:'Post', title:'Post by @free_art_lessons', where:'Global · Radiance', excerpt:'Teens who want free drawing lessons — message me privately. No need to involve your parents.', reporter:'Leilani Kahale', reporterNote:'Asking under-18s to message privately and keep it from parents.', subject:'artforteens', ageMin:18, status:'open', assignee:null, ai:'Sorted as urgent: child-safety signals. Follow the child-safety escalation steps.', reports:3},
  {id:'C-1039', kind:'report', priority:'high', urgent:null, category:'Spam or scam', objType:'Post', title:'Post by @deals4u — “Earn $500/day from home”', where:'Global · Foundation', excerpt:'Earn $500/day from home, no experience needed! Sign up at the link before spots run out.', reporter:'Elias Brandt', reporterNote:'Same link posted in three communities.', subject:'deals4u', ageMin:150, status:'open', assignee:null, ai:'Pattern flagged: 14 reports in 1 hour, and 6 new accounts from one device posted the same link.', reports:14},
  {id:'C-1038', kind:'report', priority:'normal', urgent:null, category:'Harassment or threats', objType:'Direct message', title:'Direct message to Noor Haddad', where:'Direct chat (reported message only)', excerpt:'Why are you ignoring me? I’ll keep messaging until you answer.', reporter:'Noor Haddad', reporterNote:'I asked him to stop twice. I’ve blocked him now.', subject:'theo', ageMin:260, status:'open', assignee:'dana', ai:'Sorted as normal. The reporter has already blocked this account.', reports:1},
  {id:'C-1037', kind:'report', priority:'normal', urgent:null, category:'Impersonation', objType:'Profile', title:'Profile @luxflow_support_team', where:'Profile', excerpt:'Bio: “Official Lux Flow Support. Send us your login code to verify your account.”', reporter:'Priya Raman', reporterNote:'Pretending to be staff and asking for codes.', subject:'luxhelp', ageMin:300, status:'open', assignee:null, ai:'Possible impersonation of staff. Lux Flow never asks members for login codes.', reports:4},
  {id:'C-1036', kind:'report', priority:'normal', urgent:null, category:'Nudity (not allowed in Phase 1)', objType:'Image post', title:'Image post by @wanderlust_kai', where:'Global · Journey', excerpt:'Caption: “Sunrise swim at the lake.” Image hidden by default.', reporter:'Sam Whitfield', reporterNote:'Image shows nudity.', subject:'kai', ageMin:520, status:'protect', assignee:'dana', ai:'Image hidden while under review (protective action by Dana Ruiz).', reports:1, image:true},
  {id:'E-221', kind:'edit', priority:'normal', urgent:null, category:'Edit review', objType:'Post edit', title:'Edit to “Re-reading feels like learning. Usually it isn’t.”', where:'Amara Okafor · Global · Wisdom', subject:'amara', ageMin:95, status:'open', assignee:null, ai:'AI checked the six areas and escalated: Context Integrity needs a person.',
    areas:[{n:'Original Meaning', ok:true, note:'Same main point.'}, {n:'Factual Corrections', ok:true, note:'Adds a source year.'}, {n:'Context Integrity', ok:false, note:'Swaps the cited study for a different one — readers’ earlier replies refer to the original.'}, {n:'Creative Integrity', ok:true, note:'—'}, {n:'Safety & Privacy', ok:true, note:'—'}, {n:'Platform Policy', ok:true, note:'—'}],
    orig:[{t:'When you re-read your notes, the material starts to feel familiar. '}, {t:'A 2006 study of students', c:'del'}, {t:' found that familiarity is easy to mistake for knowing it.'}],
    next:[{t:'When you re-read your notes, the material starts to feel familiar. '}, {t:'A 2011 review of 700 learners', c:'add'}, {t:' found that familiarity is easy to mistake for knowing it.'}]},
  {id:'E-220', kind:'edit', priority:'high', urgent:null, category:'Edit review', objType:'Post edit', title:'Edit to “Watercolor morning, Alder Street”', where:'Leilani Kahale · Local · Radiance', subject:'leilani', ageMin:40, status:'open', assignee:null, ai:'AI escalated: Safety & Privacy — the edit adds another person’s full name and street.',
    areas:[{n:'Original Meaning', ok:true, note:'—'}, {n:'Factual Corrections', ok:true, note:'—'}, {n:'Context Integrity', ok:true, note:'—'}, {n:'Creative Integrity', ok:true, note:'—'}, {n:'Safety & Privacy', ok:false, note:'Names a neighbour and their street.'}, {n:'Platform Policy', ok:true, note:'—'}],
    orig:[{t:'Painted the blue door on the corner this morning. '}, {t:'Light was perfect.'}],
    next:[{t:'Painted the blue door on the corner this morning. '}, {t:'That’s Ana Petrov’s house on Willow Lane — ', c:'add'}, {t:'Light was perfect.'}]}
];
var APPEALS = [
  {id:'A-310', caseRef:'C-0991', member:'kai', title:'Removal of a comment on “Night trains across Europe”', decision:'Removed content · Harassment or threats', by:'quinn', statement:'I was quoting a song lyric, not threatening anyone. The person I replied to is my friend and wasn’t upset.', ageMin:200, status:'open'},
  {id:'A-309', caseRef:'E-198', member:'sam', title:'Rejected edit to “Taking the long way round”', decision:'Edit rejected · Context Integrity', by:'dana', statement:'I only fixed the train times — the route is the same. The old times were wrong and people were missing connections.', ageMin:410, status:'open'}
];
var APPS = [
  {id:'T-58', member:'priya', path:'Community host', ageMin:1440, status:'pending',
    answers:[{q:'Which responsibility would you like to take on?', a:'Hosting the Newcomers’ Table — monthly dinners for people who just moved to the area.'}, {q:'Why, and what have you done so far?', a:'I’ve hosted six dinners since June. I check dietary needs ahead, keep groups to eight and meet first-time guests at the door.'}],
    record:[{l:'Identity', v:'Verified · Jun 2026', k:'rec'}, {l:'Events hosted', v:'6 events, 41 RSVPs recorded', k:'rec'}, {l:'Hosting experience', v:'“Hosted similar dinners at my old church”', k:'self'}, {l:'Reports about this member', v:'1 report — reviewed, no violation found', k:'rec'}, {l:'Supported findings', v:'None', k:'rec'}]},
  {id:'T-57', member:'noor', path:'Mentor · Oral histories', ageMin:2880, status:'pending',
    answers:[{q:'Which responsibility would you like to take on?', a:'Mentoring members who want to record family stories.'}, {q:'Why, and what have you done so far?', a:'I’ve recorded my grandmother’s town for two years and run a small reading circle.'}],
    record:[{l:'Identity', v:'Verified · Jul 2026', k:'rec'}, {l:'Community roles', v:'Member of Oral Histories (no hosting yet)', k:'rec'}, {l:'Experience', v:'“Two years of interviews with elders”', k:'self'}, {l:'Reports about this member', v:'None', k:'rec'}, {l:'Supported findings', v:'None', k:'rec'}]},
  {id:'T-55', member:'tomas', path:'Event organizer', ageMin:20160, status:'approved', decidedBy:'quinn', note:'Consistent organising record; volunteer days ran safely.',
    answers:[{q:'Which responsibility would you like to take on?', a:'Co-hosting Alder Street work days.'}, {q:'Why, and what have you done so far?', a:'I’ve coordinated the beds for a year.'}],
    record:[{l:'Identity', v:'Verified · May 2026', k:'rec'}, {l:'Events hosted', v:'9 events, 120 RSVPs recorded', k:'rec'}, {l:'Supported findings', v:'None', k:'rec'}]}
];
var VFLAGS = [
  {id:'V-77', kind:'duplicate', title:'Possible duplicate identity', ageMin:65, status:'open', accounts:['jpstudio', 'jun'],
    detail:'The identity provider returned a match between new account @jpark_studio and an existing verified member, Jun Park. It may be a second account by the same person, or a provider error. Nothing has been restricted automatically.'},
  {id:'V-76', kind:'age', title:'Age check inconclusive', ageMin:130, status:'open', accounts:['ellie'],
    detail:'The provider couldn’t confirm the date of birth from the submitted document (glare). The member can try again. An unsuccessful check is not evidence of dishonesty.'},
  {id:'V-74', kind:'pending', title:'Verification still pending after 48 hours', ageMin:3100, status:'open', accounts:['artforteens'],
    detail:'The provider hasn’t returned a result. This account is also the subject of an urgent child-safety report (C-1040).'}
];
var AUDIT = [
  {id:'L-10', at:'Today · 8:20 AM', who:'quinn', action:'Dismissed report', target:'C-1031 · Post by Sam Whitfield', reason:'No violation found'},
  {id:'L-11', at:'Today · 8:05 AM', who:'dana', action:'Approved edit', target:'E-219 · Edit by Priya Raman', reason:'Passes the six-area check'},
  {id:'L-9', at:'Today · 7:58 AM', who:'dana', action:'Took protective action', target:'C-1036 · Image post by @wanderlust_kai', reason:'Image hidden while under review'},
  {id:'L-8', at:'Today · 7:45 AM', who:'quinn', action:'Assigned to self', target:'C-1041 · Message in the Riverside Quiet Hour group', reason:'—'},
  {id:'L-7', at:'Yesterday · 4:10 PM', who:'quinn', action:'Removed content', target:'C-0991 · Comment by @wanderlust_kai', reason:'Harassment or threats'},
  {id:'L-6', at:'Yesterday · 2:02 PM', who:'dana', action:'Rejected edit', target:'E-198 · Edit by Sam Whitfield', reason:'Context Integrity'},
  {id:'L-5', at:'Oct 26 · 11:20 AM', who:'quinn', action:'Approved Trusted application', target:'T-55 · Tomás Reyes · Event organizer', reason:'Consistent organising record'},
  {id:'L-4', at:'Oct 25 · 9:05 AM', who:'dana', action:'Dismissed report', target:'C-0950 · Post by Priya Raman', reason:'No violation found'}
];
var NOTE_TEMPLATES = {
  dismiss:'',
  guidance:'Hi — a member raised a concern about something you shared. We’re not taking action, but here’s a reminder of the community standards so everyone feels welcome.',
  remove:'We removed your {obj} because it goes against our community standards ({policy}). You can ask for a review if you think we got this wrong.',
  warn:'We removed your {obj} and added a warning to your account because it goes against our community standards ({policy}). You can ask for a review.',
  limit:'We removed your {obj} and paused posting and messaging for {limit} because it goes against our community standards ({policy}). You can ask for a review.',
  suspend:'Your account has been suspended because of a serious breach of our community standards ({policy}). You can ask for a review by a different reviewer.'
};
function adFresh(){ var c = function(x){ return JSON.parse(JSON.stringify(x)); };
  return {v:1, signedIn:false, signStep:'pick', who:'quinn', code:'', codeErr:'', theme:'dark', page:'overview', sel:null, navOpen:false,
    cases:c(CASES).map(function(x){ x.history = [{at:x.ageMin + ' min ago', who:'system', what:x.kind === 'edit' ? 'Edit submitted and checked by AI' : 'Report received' + (x.reports > 1 ? ' (' + x.reports + ' reports)' : ''), tone:''}].concat(x.assignee ? [{at:'Earlier today', who:x.assignee, what:'Assigned to ' + STAFF[x.assignee].name, tone:'acc'}] : []).concat(x.status === 'protect' ? [{at:'Today · 7:58 AM', who:x.assignee, what:'Protective action: hidden while under review', tone:'bad'}] : []); return x; }),
    appeals:c(APPEALS), apps:c(APPS), vflags:c(VFLAGS), members:c(MEMBERS), audit:c(AUDIT), pending:[],
    qType:'all', qPri:'all', qStatus:'active', qSearch:'', mSearch:'', mFilter:'all', lWho:'all', lSearch:'', gSearch:'', aTab:'mine', tTab:'pending',
    roles:{}, inactive:{}, invites:[], dlg:null, toast:null, popAlerts:false, popMe:false, reveal:{}, settings:{email:true, push:true, aiSort:true, aiEdits:true, aiPatterns:true}};
}
function adLoad(){ var f = adFresh(); try { var raw = window.localStorage.getItem(STORE); if (!raw) return f; var s = JSON.parse(raw); if (!s || s.v !== 1) return f; ['dlg', 'toast', 'popAlerts', 'popMe', 'navOpen', 'reveal'].forEach(function(k){ delete s[k]; }); return Object.assign(f, s); } catch (e) { return f; } }
function adSave(s){ try { window.localStorage.setItem(STORE, JSON.stringify(s)); } catch (e) {} }
function adAge(m){ if (m < 60) return m + ' min'; if (m < 1440) return Math.floor(m / 60) + 'h ' + (m % 60 ? (m % 60) + 'm' : ''); return Math.floor(m / 1440) + 'd'; }
function adNow(){ var d = new Date(); var h = d.getHours(), mi = d.getMinutes(); return 'Today · ' + ((h % 12) || 12) + ':' + (mi < 10 ? '0' : '') + mi + (h < 12 ? ' AM' : ' PM'); }
var PRI_ORDER = {urgent:0, high:1, normal:2, low:3};
var STATUS_LABEL = {open:'Open', review:'In review', protect:'Protective action', confirm:'Awaiting 2nd reviewer', resolved:'Resolved'};
var STATUS_CLS = {open:'badge b-open', review:'badge b-review', protect:'badge b-protect', confirm:'badge b-confirm', resolved:'badge b-done'};
var PRI_LABEL = {urgent:'Urgent', high:'High', normal:'Normal', low:'Low'};
