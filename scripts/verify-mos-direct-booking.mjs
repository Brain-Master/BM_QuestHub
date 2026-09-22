/** Local production export only; every remote request is intercepted, all POSTs synthetic. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../apps/web/package.json',import.meta.url));
const {chromium,expect}=require('@playwright/test');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:3198';
const output=process.env.QA_OUTPUT||'/tmp/questhub-mos-compact-qa';
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(base))throw Error('Local preview required');
const snapshot=JSON.parse(await fs.readFile(new URL('../apps/web/data/offers-snapshot.json',import.meta.url),'utf8'));
const config=JSON.parse(await fs.readFile(new URL('../apps/web/data/v2/site-config.json',import.meta.url),'utf8'));
const offer=snapshot.offersByQuest.shmi.find(o=>o.venueSlug.startsWith('school-2103')&&o.annual.admission==='open');
assert.ok(offer);
const variant=offer.scheduleCard.variants[0], mosUrl=variant.mosBookingUrl||offer.mosBookingUrl;
const path=`/sites/school-2103/agenda/?view=catalogue&offer=${encodeURIComponent(offer.id)}`;
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/home/xipsin/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome'});
const checks=[],errors=[],unexpected=[],clicks=[],leads=[],scans=[],departures=[];
let notification='ok',formResponse=200,releaseClick,releaseLead,sourceOverride;
try {
 const context=await browser.newContext({viewport:{width:1440,height:1050}});
 context.setDefaultTimeout(10000);
 context.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));
 await context.route('**/*',async route=>{
   const request=route.request();let data;try{data=request.postDataJSON();}catch{}
   if(request.url()===config.brand.contacts.leadSubmitUrl&&request.method()==='POST'){
     if(data?.event==='booking.mos_click'){
       clicks.push(data);
       if(notification==='hang')await new Promise(resolve=>{releaseClick=resolve;});
       if(notification==='abort')return route.abort();
       return route.fulfill({status:notification==='fail'?503:200,json:{ok:notification!=='fail',notified:notification!=='fail'}});
     }
     assert.equal(data.parentName,'Тестовый Родитель'); assert.equal(data.consent,true);
     leads.push(data);
     if(formResponse==='hold')await new Promise(resolve=>{releaseLead=resolve;});
     return route.fulfill({status:typeof formResponse==='number'?formResponse:200,json:{ok:formResponse!==503}});
   }
   if(request.url()===config.brand.contacts.opsReportUrl&&request.method()==='POST'&&data?.event==='lead.client_submit_failed')return route.fulfill({status:204,body:''});
   if(!['GET','HEAD'].includes(request.method())){unexpected.push(request.url());return route.abort();}
   if(sourceOverride&&request.url().startsWith(base+'/data/offers-snapshot.json'))return route.fulfill({json:sourceOverride});
   if(request.url()===mosUrl){departures.push(request.url());return route.fulfill({contentType:'text/html',body:'<title>Mock mos.ru card</title><h1>LOCAL MOCK — no enrollment</h1>'});}
   return request.url().startsWith(base+'/')?route.continue():route.abort();
 });
 const page=await context.newPage();
 await page.clock.install({time:new Date('2026-09-21T13:00:00Z')});
 const row=page.locator(`[data-annual-group="${offer.id}"]`).first();
 const direct=row.getByRole('link',{name:/Записаться на mos.ru/});
 async function go(route=path){await page.clock.resume();await page.goto(base+route,{waitUntil:'networkidle'});const consent=page.getByRole('button',{name:'Только необходимое'});if(await consent.isVisible())await consent.click();}
 async function freeze(){await page.clock.pauseAt(await page.evaluate(()=>Date.now())+100);}
 let openedAt=0;
 async function advanceTo(ms){await page.clock.runFor(ms-(await page.evaluate(()=>Date.now())-openedAt));}
 async function intro(keyboard=false){openedAt=await page.evaluate(()=>Date.now());if(keyboard){await direct.focus();await page.keyboard.press('Enter');}else await direct.click();await page.clock.runFor(250);await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByRole('heading',{name:'Запись на mos.ru',exact:true})).toBeFocused();}
 async function openOptional(){await intro();await page.getByRole('button',{name:'Заполнить анкету',exact:true}).click();await page.clock.runFor(250);}
 async function progressScale(){return page.getByTestId('mos-progress').evaluate(node=>new DOMMatrixReadOnly(getComputedStyle(node).transform).a);}
 async function openLink(action){const pending=context.waitForEvent('page');await action();const tab=await pending;await tab.waitForLoadState('domcontentloaded');assert.equal(tab.url(),mosUrl);await tab.close();}
 async function fill(){const dialog=page.getByRole('dialog');await dialog.getByLabel('Имя родителя').fill('Тестовый Родитель');await dialog.getByLabel('Телефон').fill('+79991234567');await dialog.getByLabel('Имя и фамилия ребёнка').fill('Тестовый Ребёнок');await dialog.getByLabel('Возраст полных лет').fill('11');return dialog;}
 async function scan(label,selector){await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});const report=await page.evaluate(selector=>window.axe.run({include:[selector]},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}),selector);scans.push({label,violations:report.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),incomplete:report.incomplete.map(v=>v.id)});assert.deepEqual(scans.at(-1).violations,[],label);}
 for(const outcome of ['ok','fail','abort','hang']){
   notification=outcome;await go();await expect(direct).toHaveAttribute('href',mosUrl);await expect(direct).toHaveAttribute('target','_blank');
   await freeze();const before=clicks.length,navigationBefore=departures.length;await intro();
   assert.equal(page.url(),base+path);assert.equal(clicks.length,before);
   await advanceTo(14999);await expect(page.getByTestId('mos-seconds')).toHaveText('1');
   await page.getByTestId('mos-proceed-now').click();await page.waitForURL(mosUrl,{waitUntil:'domcontentloaded'});
   await expect.poll(()=>clicks.length).toBe(before+1);await expect(page.getByRole('dialog')).toHaveCount(0);
   assert.equal(leads.length,0);assert.equal(context.pages().length,1);assert.equal(departures.length,navigationBefore+1);
   await page.clock.runFor(60000);assert.equal(departures.length,navigationBefore+1);
   assert.deepEqual(Object.keys(clicks.at(-1)).sort(),['event','eventId','offerId','questSlug','variantId','venueSlug']);
   assert.equal(clicks.at(-1).offerId,offer.id);assert.equal(clicks.at(-1).variantId,variant.id);
   if(outcome==='hang'){assert.equal(typeof releaseClick,'function');releaseClick();}
 }
 checks.push('Primary opens popup with no event/navigation; manual departure at14999ms reaches exact card in same tab despite200/503/network/hung notifier; no later duplicate navigation');
 notification='ok';
 await go();await freeze();const autoBefore=clicks.length,autoPages=context.pages().length,autoDepartures=departures.length;
 await intro(true);
 await expect(page.getByRole('timer')).toHaveAttribute('aria-live','off');
 await advanceTo(10000);assert.equal(page.url(),base+path);assert.equal(clicks.length,autoBefore);await expect(page.getByTestId('mos-seconds')).toHaveText('5');
 await advanceTo(14999);assert.equal(page.url(),base+path);assert.equal(clicks.length,autoBefore);
 await page.clock.runFor(1);await page.waitForURL(mosUrl,{waitUntil:'domcontentloaded'});
 await expect.poll(()=>clicks.length).toBe(autoBefore+1);assert.equal(context.pages().length,autoPages);assert.equal(departures.length,autoDepartures+1);
 checks.push('Enter opens popup; no departure at10seconds; exactly15seconds triggers one same-tab departure, not a popup; ticks not live-announced');
 await page.emulateMedia({reducedMotion:'no-preference'});await go();await freeze();await intro();
 const samples=[];
 for(const elapsed of [500,532,564,596,628,660,692,724]){await advanceTo(elapsed);samples.push(await progressScale());await expect(page.getByTestId('mos-seconds')).toHaveText('15');assert.ok(Math.abs(samples.at(-1)-(1-elapsed/15000))<0.0011);}
 assert.ok(samples.every((value,i)=>i===0||value<samples[i-1]),'Progress moves on every32ms sample inside a single displayed second');
 await page.emulateMedia({reducedMotion:'reduce'});await page.clock.runFor(64);await expect.poll(progressScale).toBe(1);
 await advanceTo(2250);assert.equal(await progressScale(),1);await expect(page.getByTestId('mos-seconds')).toHaveText('13');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.clock.runFor(64);await expect.poll(progressScale).toBeLessThan(0.9);
 await page.keyboard.press('Escape');await page.clock.runFor(60000);assert.equal(page.url(),base+path);
 await page.emulateMedia({reducedMotion:'reduce'});await go();await freeze();await intro();
 assert.equal(await progressScale(),1);await advanceTo(1250);assert.equal(await progressScale(),1);await expect(page.getByTestId('mos-seconds')).toHaveText('14');
 await page.keyboard.press('Escape');await page.emulateMedia({reducedMotion:'no-preference'});
 checks.push('Sub-second progress follows shared15s deadline; reduced-motion is static from first open and on preference change; switching back catches up without timer reset');
 for(const cancel of ['pause','escape','close','hidden','restored','form']){
   await go();await freeze();const before=clicks.length,navBefore=departures.length;await intro();await advanceTo(14000);
   if(cancel==='pause')await page.getByRole('button',{name:'Остановить таймер'}).click();
   if(cancel==='escape')await page.keyboard.press('Escape');
   if(cancel==='close')await page.getByRole('dialog').getByRole('button',{name:'Close',exact:true}).click();
   if(cancel==='hidden')await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'));});
   if(cancel==='restored')await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
   if(cancel==='form'){
     await page.getByRole('button',{name:'Заполнить анкету',exact:true}).click();
     await page.clock.runFor(250);
     await expect(page.getByRole('heading',{name:'Оставить контакты — по желанию'})).toBeFocused();
     await page.getByRole('button',{name:'Отправить контакты',exact:true}).click();assert.equal(leads.length,0);
   }
   await page.emulateMedia({reducedMotion:'reduce'});await page.emulateMedia({reducedMotion:'no-preference'});
   await page.clock.runFor(60000);assert.equal(page.url(),base+path);assert.equal(clicks.length,before);assert.equal(departures.length,navBefore);
   if(cancel==='hidden'){
     await page.evaluate(()=>{delete document.hidden;delete document.visibilityState;document.dispatchEvent(new Event('visibilitychange'));});
     await page.clock.runFor(60000);assert.equal(departures.length,navBefore);await expect(page.getByTestId('mos-departure')).toContainText('Автопереход выключен');
   }
   if(cancel==='escape'||cancel==='close'){
     await expect(direct).toBeFocused();await intro();await expect(page.getByTestId('mos-seconds')).toHaveText('15');
     await page.clock.runFor(1000);await expect(page.getByTestId('mos-seconds')).toHaveText('14');
   }
 }
 checks.push('Pause/Escape/close/hide/opt-in at14seconds prevent departure and notification for60seconds; visibility return cannot resume; reopening gets fresh15seconds; empty form validation cannot restart timer');
 for(const method of ['middle','modified']){
   await go();const before=clicks.length;
   await openLink(()=>direct.click(method==='middle'?{button:'middle'}:{modifiers:['Control']}));
   await expect.poll(()=>clicks.length).toBe(before+1);
   await expect(page.getByRole('dialog')).toHaveCount(0);
   await openLink(()=>direct.click({button:'middle'}));assert.equal(clicks.length,before+1,'Repeat native navigation still works; notification suppressed for30sec');
 }
 checks.push('Middle and Ctrl-click bypass popup natively; repeated native click retains per-tab notification suppression');
 await go();const markup=await direct.evaluate(node=>node.outerHTML);
 const noJs=await browser.newContext({javaScriptEnabled:false});
 await noJs.route('**/*',route=>route.request().url()===mosUrl?route.fulfill({body:'<title>Mock card</title>'}):route.abort());
 const plain=await noJs.newPage();await plain.setContent(markup);const tabPromise=noJs.waitForEvent('page');await plain.getByRole('link').click();const plainTab=await tabPromise;await plainTab.waitForLoadState();assert.equal(plainTab.url(),mosUrl);await noJs.close();
 checks.push('Actual rendered anchor works with JS disabled in isolation; full query-driven site cold-load still requires JS');
 await go();await scan('catalogue dark','[data-testid="course-finder"]');
 await freeze();await intro();await page.screenshot({animations:'disabled',path:output+'/popup-desktop.png'});
 await page.getByRole('button',{name:'Остановить таймер'}).click();await page.clock.resume();await scan('transition desktop','[role="dialog"]');await page.keyboard.press('Escape');
 await freeze();
 await openOptional();let dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
 await expect(dialog.getByRole('heading',{name:'Оставить контакты — по желанию'})).toBeVisible();
 await expect(dialog.getByRole('checkbox')).not.toBeChecked();
 await fill();await dialog.getByRole('button',{name:'Отправить контакты',exact:true}).click();assert.equal(leads.length,0);
 await dialog.getByRole('checkbox').check();formResponse=503;await dialog.getByRole('button',{name:'Отправить контакты',exact:true}).click();
 await expect(dialog.getByTestId('booking-submit-error')).toBeVisible();
 await page.clock.runFor(60000);assert.equal(page.url(),base+path);
 await expect(dialog.getByLabel('Имя родителя')).toHaveValue('Тестовый Родитель');await expect(dialog.getByRole('checkbox')).toBeChecked();
 await expect(dialog.getByRole('link',{name:/На mos.ru без анкеты/})).toBeVisible();
 formResponse=200;const beforePages=context.pages().length;
 await dialog.getByRole('button',{name:'Отправить контакты',exact:true}).click();await expect(dialog.getByTestId('mos-success')).toBeVisible();
 await expect(dialog.getByRole('heading',{name:'Контакты получены',level:2})).toBeFocused();
 await page.clock.runFor(60000);assert.equal(page.url(),base+path);assert.equal(context.pages().length,beforePages,'No automatic departure after success');
 assert.equal(leads.length,2);assert.equal(leads[1].offerId,offer.id);assert.equal(leads[1].variantId,variant.id);assert.ok(leads[1].consentAt);assert.ok(leads[1].policyVersion);
 await page.clock.resume();await scan('optional success','[role="dialog"]');
 await page.keyboard.press('Escape');await expect(direct).toBeFocused();
 checks.push('Optional consent form preserves data on503, retry succeeds, exact group metadata, success focus, no automatic duplicate tab, Escape returns focus');
 // Old success AND error must not replace or reset a newly edited form.
 for(const oldResponse of [200,503]){
   await go();await openOptional();dialog=await fill();await dialog.getByRole('checkbox').check();formResponse='hold';releaseLead=undefined;
   await dialog.getByRole('button',{name:'Отправить контакты',exact:true}).click();await expect.poll(()=>typeof releaseLead).toBe('function');
   await page.keyboard.press('Escape');await openOptional();const fresh=page.getByRole('dialog');
   await expect(fresh.getByLabel('Имя родителя')).toHaveValue('');await fresh.getByLabel('Имя родителя').fill('Новый Родитель');
   await fresh.getByRole('checkbox').check();formResponse=oldResponse;releaseLead();
   await expect(dialog.getByTestId('mos-success')).toHaveCount(0);
   await page.waitForTimeout(250);
   await expect(fresh.getByLabel('Имя родителя')).toHaveValue('Новый Родитель');await expect(fresh.getByRole('checkbox')).toBeChecked();
   await expect(fresh.getByTestId('booking-submit-error')).toHaveCount(0);await page.keyboard.press('Escape');
 }
 formResponse=200;
 checks.push('Dismissed success/error cannot alter new form values, consent, errors or view');
 for(const width of [390,320]){
   await page.setViewportSize({width,height:900});await go();await row.scrollIntoViewIfNeeded();
   await expect(direct).toBeVisible();
   const actions=row.locator('[data-mos-booking-actions]').first();
   await expect(actions.locator('a,button')).toHaveCount(1);await expect(actions.locator('p,button')).toHaveCount(0);
   await expect(actions).toHaveText('Записаться на mos.ru ↗');assert.equal(await direct.getAttribute('aria-describedby'),null);
   assert.ok((await direct.boundingBox()).height>=44);
   await row.screenshot({animations:'disabled',path:`${output}/compact-card-${width}.png`});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await freeze();await intro();await page.screenshot({animations:'disabled',path:`${output}/popup-mobile-${width}.png`});
   await page.getByRole('button',{name:'Остановить таймер'}).click();await page.clock.resume();await scan(`transition ${width}`,'[role="dialog"]');
   await page.keyboard.press('Escape');await expect(direct).toBeFocused();
   await openOptional();await scan(`optional form ${width}`,'[role="dialog"]');
   const close=page.getByRole('dialog').getByRole('button',{name:'Close',exact:true});
   assert.ok((await close.boundingBox()).height>=44);await page.screenshot({animations:'disabled',path:`${output}/optional-mobile-${width}.png`});
   await close.click();await expect(page.getByRole('dialog')).toHaveCount(0);await expect(direct).toBeFocused();
 }
 checks.push('390px and320px sole44px card CTA without helper copy/dangling description, reflow, dialog accessibility scans and focus; compact card/screenshots saved');
 await page.setViewportSize({width:320,height:568});await go();await freeze();await intro();
 await expect(page.getByTestId('mos-proceed-now')).toBeInViewport();await expect(page.getByRole('button',{name:'Остановить таймер'})).toBeInViewport();
 await expect(page.getByRole('dialog').getByRole('button',{name:'Close',exact:true})).toBeInViewport();
 await page.getByRole('button',{name:'Заполнить анкету',exact:true}).click();await page.clock.runFor(250);await expect(page.getByRole('heading',{name:'Оставить контакты — по желанию'})).toBeFocused();
 await expect(page.getByTestId('mos-proceed-now')).toBeInViewport();await page.keyboard.press('Escape');
 checks.push('320x568 short viewport keeps departure/pause/close reachable; form scrolls independently below header');
 await page.setViewportSize({width:1440,height:1050});
 await go();await freeze();await intro();await page.setViewportSize({width:390,height:844});await page.keyboard.press('Escape');await page.clock.runFor(250);await expect(direct).toBeFocused();
 await page.setViewportSize({width:1440,height:1050});await go();await freeze();const targetBefore=departures.length;await intro();await page.clock.runFor(6000);
 sourceOverride=structuredClone(snapshot);sourceOverride.generatedAt='2026-09-21T14:00:00.000Z';
 const changed=sourceOverride.offersByQuest.shmi.find(o=>o.id===offer.id);changed.mosBookingUrl='https://www.mos.ru/pgu2/activity/card/9999999';changed.scheduleCard.variants[0].mosBookingUrl=changed.mosBookingUrl;
 const refreshed=page.waitForResponse(response=>response.url().startsWith(base+'/data/offers-snapshot.json'));
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.clock.runFor(1);
 await refreshed;await expect(direct).toHaveAttribute('href',changed.mosBookingUrl);
 await page.clock.runFor(1000);await expect(page.getByRole('dialog')).toHaveCount(0);
 await expect(page.getByTestId('course-finder').getByRole('heading',{level:1})).toBeFocused();
 await page.clock.runFor(60000);assert.equal(departures.length,targetBefore);assert.equal(page.url(),base+path);sourceOverride=undefined;
 checks.push('Breakpoint close restores initiating control; live URL replacement closes old dialog, restores heading focus and cancels stale departure');
 await go('/year-courses/schedule/');const annual=page.locator(`[data-group-id="${offer.id.slice(5)}"]`);const before=clicks.length;
 await openLink(()=>annual.getByRole('link',{name:/Карточка на mos.ru/}).click());await expect.poll(()=>clicks.length).toBe(before+1);
 assert.equal(clicks.at(-1).offerId,offer.id);assert.equal(clicks.at(-1).variantId,undefined);
 checks.push('Existing annual table direct links also notify the canonical source offer without fabricated variants');
 assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);
 const report={ok:true,checks,scans,errors,unexpected,clickRequests:clicks.length,formRequests:leads.length,evidence:'LOCAL EXPORT + SYNTHETIC HTTP; no real Telegram or mos.ru submissions',output};
 await fs.writeFile(output+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
} finally { releaseClick?.();releaseLead?.();await browser.close(); }
