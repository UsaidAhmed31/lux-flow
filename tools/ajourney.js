const { chromium } = require('playwright');
const ok=(c,m)=>{ if(!c){ console.log('FAIL - '+m); process.exitCode=1; } else console.log('ok - '+m); };
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1440,height:900}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8765/Admin.html'); await p.waitForTimeout(2000);
 await p.evaluate(()=>localStorage.removeItem('luxflow-admin-v1')); await p.reload(); await p.waitForTimeout(2000);
 const T=async t=>{ await p.getByRole('button',{name:t,exact:false}).first().click(); await p.waitForTimeout(250); };
 const txt=async()=>p.evaluate(()=>document.querySelector('.ad').innerText);
 // sign in validation
 await T('Continue'); await T('Sign in'); ok((await txt()).includes('Enter the 6-digit code'),'code validation');
 await p.fill('.input','123456'); await T('Sign in'); ok((await txt()).includes('Platform overview'),'signed in as Quinn (admin overview)');
 await p.getByRole('button',{name:'Queue'}).first().click(); await p.waitForTimeout(300);
 // decide C-1042 with warn
 await p.getByText('Comment on “Alder Street beds').first().click(); await p.waitForTimeout(300);
 await T('Assign to me'); ok((await txt()).includes('You'),'assigned to me');
 await T('Protective action'); ok((await txt()).includes('Protective action: hidden'),'protective action');
 await T('Make a decision'); await T('Save decision'); ok((await txt()).includes('Choose an outcome'),'outcome required');
 await p.getByRole('radio',{name:/Remove content and warn/}).click(); await p.waitForTimeout(200);
 ok(await p.$eval('textarea', e=>e.value.includes('Harassment or threats')),'policy preselected + note template');
 await T('Confirm: Remove content and warn'); await p.waitForTimeout(300); ok((await txt()).includes('Decided by Quinn'),'decision saved');
 // suspend C-1037 -> needs Dana
 await p.getByRole('button',{name:'Queue'}).first().click(); await p.waitForTimeout(300);
 await p.getByText('Profile @luxflow_support_team').first().click(); await p.waitForTimeout(300);
 await T('Make a decision'); await p.getByRole('radio',{name:/Suspend account/}).click(); await p.waitForTimeout(200); await T('Propose suspension'); await p.waitForTimeout(300);
 ok((await txt()).includes('Waiting for a second reviewer'),'suspension waits for 2nd reviewer');
 // switch to Dana
 await p.click('.top .pop-wrap:last-child > button'); await p.waitForTimeout(200); await T('Dana Ruiz'); await p.waitForTimeout(300);
 ok((await txt()).includes('Second review needed'),'Dana sees second review');
 await T('Confirm suspension'); await p.waitForTimeout(300); ok((await txt()).includes('confirmed by Dana Ruiz'),'suspension confirmed');
 // appeals: Dana decides A-310 (by quinn); A-309 locked for Dana
 await p.getByRole('button',{name:/^Appeals/}).first().click(); await p.waitForTimeout(300);
 ok((await txt()).includes('Removal of a comment'),'A-310 assigned to Dana');
 await p.getByRole('button',{name:/^Appeals/}).first().click(); await T('All open'); await p.getByText('Rejected edit to').first().click(); await p.waitForTimeout(300);
 ok(await p.$eval('.rail .btn-primary', e=>e.disabled),'own-decision appeal locked');
 await T('Appeals'); await T('Assigned to me'); await p.getByText('Removal of a comment').first().click(); await p.waitForTimeout(300);
 await T('Decide this appeal'); await p.getByRole('radio',{name:/Overturn/}).click(); await p.fill('textarea','The quote was a song lyric between friends; no threat.'); await T('Save appeal decision'); await p.waitForTimeout(300);
 ok((await txt()).includes('Overturned'),'appeal overturned');
 // trusted approve
 await p.getByRole('button',{name:/Trusted applications/}).first().click(); await p.getByText('Priya Raman').first().click(); await p.waitForTimeout(300);
 await T('Approve'); await p.fill('textarea','Six safe, well-run dinners and a clean record.'); await p.locator('.dialog .btn-ok').click(); await p.waitForTimeout(300);
 ok((await txt()).includes('Approved'),'trusted approved');
 // vflag
 await p.getByRole('button',{name:/Verification/}).first().click(); await p.getByText('Possible duplicate identity').first().click(); await p.waitForTimeout(300);
 await T('Choose an outcome'); await p.getByRole('radio',{name:/Ask the member/}).click(); await p.fill('textarea','Ask which account to keep.'); await T('Resolve flag'); await p.waitForTimeout(300);
 ok((await txt()).includes('Resolved by Dana'),'flag resolved');
 // member warn
 await p.getByRole('button',{name:'Members'}).first().click(); await p.fill('.page .search input','theo'); await p.waitForTimeout(200); await p.getByText('Theo Marsh').first().click(); await p.waitForTimeout(300);
 await T('Add a warning'); await p.fill('textarea','Kept messaging after being asked to stop.'); await p.locator('.dialog .btn-danger').click(); await p.waitForTimeout(300);
 ok((await txt()).includes('Warned'),'member warned');
 // audit + search + esc
 await p.getByRole('button',{name:'Audit log'}).first().click(); await p.waitForTimeout(300);
 const n=await p.$$eval('.tbl tbody tr', r=>r.length); ok(n>=12,'audit has entries ('+n+')');
 await p.fill('.top .search input','deals'); await p.waitForTimeout(300); ok(await p.$('.popover[role=listbox]')!==null,'global search results'); await p.keyboard.press('Escape');
 // operator view only
 await p.click('.top .pop-wrap:last-child > button'); await T('Ops support'); await p.waitForTimeout(300); ok((await txt()).includes('View-only role'),'operator view-only banner');
 await p.getByRole('button',{name:'Queue'}).first().click(); await p.getByText('Post by @deals4u').first().click(); await p.waitForTimeout(300); ok(await p.$eval('.rail .btn-primary', e=>e.disabled),'operator cannot decide');
 // dialog esc + focus trap
 await p.click('.top .pop-wrap:last-child > button'); await T('Quinn'); await p.waitForTimeout(300); await T('Make a decision'); await p.waitForTimeout(200);
 ok(await p.evaluate(()=>!!document.activeElement.closest('.dialog')),'focus moved into dialog');
 for (let i=0;i<30;i++) await p.keyboard.press('Tab'); ok(await p.evaluate(()=>!!document.activeElement.closest('.dialog')),'focus trapped in dialog');
 await p.keyboard.press('Escape'); await p.waitForTimeout(200); ok(await p.$('.dialog')===null,'Esc closes dialog');
 // reload persists
 await p.reload(); await p.waitForTimeout(2000); ok((await txt()).includes('Post by @deals4u'),'state persisted after reload');
 console.log(errs.length?'ERRORS '+errs.join(' | '):'no page errors'); await b.close(); })();
