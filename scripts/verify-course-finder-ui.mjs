import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
const require=createRequire(new URL('../apps/web/package.json',import.meta.url));
const {chromium,expect}=require('@playwright/test');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:3194';
const output=process.env.QA_OUTPUT||'/tmp/questhub-finder-qa';
const snapshot=JSON.parse(await fs.readFile(new URL('../apps/web/data/offers-snapshot.json',import.meta.url),'utf8'));
const siteConfig=JSON.parse(await fs.readFile(new URL('../apps/web/data/v2/site-config.json',import.meta.url),'utf8'));
const venues=JSON.parse(await fs.readFile(new URL('../apps/web/data/v2/map-snapshot.json',import.meta.url),'utf8')).venues;
const annual=snapshot.offersByQuest.shmi;
const checks=[],errors=[],blockedWrites=[],a11y=[];
const bookingCalls=[];
const mockedFailureReports=[];
let bookingResponse=200;
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/home/xipsin/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome'});
try {
 const context=await browser.newContext({viewport:{width:1440,height:1050}});
 context.on('page',page=>page.on('pageerror',e=>errors.push(e.message)));
 await context.route('**/*',async route=>{
   const request=route.request();
   let payload;try{payload=request.postDataJSON();}catch{}
   if(request.method()==='POST'&&request.url()===siteConfig.brand.contacts.opsReportUrl&&payload?.source==='bm-questhub-static'&&payload?.event==='lead.client_submit_failed'&&payload?.lead?.parentName==='Тестовый Родитель'){
     mockedFailureReports.push({errorCode:payload.errorCode,httpStatus:payload.httpStatus});
     return route.fulfill({status:204,body:''});
   }
   if(request.method()==='POST'&&payload?.offerId&&payload?.source==='bm-questhub-static'){
     bookingCalls.push(payload);
     await new Promise(resolve=>setTimeout(resolve,700));
     return bookingResponse===0?route.abort():route.fulfill({status:bookingResponse,json:{ok:bookingResponse===200}});
   }
   if(!['GET','HEAD'].includes(request.method())){blockedWrites.push({method:request.method(),url:request.url()});return route.abort();}
   return request.url().startsWith(base)?route.continue():route.abort();
 });
 const page=await context.newPage();
 const finder=page.getByTestId('course-finder');
 async function goto(path){await page.goto(base+path,{waitUntil:'networkidle'});const consent=page.getByRole('button',{name:'Только необходимое'});if(await consent.isVisible())await consent.click();await finder.waitFor();}
 async function count(n){await expect(page.getByTestId('finder-count')).toHaveText(String(n));}
 async function scan(label){
   await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
   const report=await page.evaluate(()=>window.axe.run({include:['[data-testid="course-finder"]','body > div header','header:has(nav[aria-label="Основная навигация"])']},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
   a11y.push({label,violations:report.violations,incomplete:report.incomplete.map(item=>({id:item.id,nodes:item.nodes.length}))});
   assert.deepEqual(report.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],label);
 }
 await goto('/agenda/');await count(51);
 assert.equal(await finder.getByRole('combobox',{name:'Площадка',exact:true}).locator('option:not([disabled])').count(),7);
 assert.equal(await finder.getByRole('combobox',{name:'Программа',exact:true}).locator('option:not([disabled])').count(),2);
 assert.equal(await page.locator('[data-campus]').count(),8);
 assert.equal(await page.locator('[data-annual-group]').count(),52);
 assert.equal(new Set(await page.locator('[data-annual-group]').evaluateAll(rows=>rows.map(row=>row.dataset.annualGroup))).size,51);
 await finder.getByRole('button',{name:'По программам',exact:true}).click();
 assert.equal(await page.locator('[data-programme="shmi"]').count(),1);
 assert.equal(await page.locator('[data-weekday]').count(),new Set(annual.flatMap(offer=>offer.weeklySlots.map(slot=>slot.weekday))).size);
 await scan('dark full schedule');
 await page.screenshot({path:output+'/full-desktop.png'});
 checks.push('Real data: 51 unique groups, 52 weekday rows, eight campuses, one canonical SHMI programme');

 await goto('/agenda/');
 const compact=page.locator('[data-annual-group]').filter({has:page.locator('button:not([disabled])')}).first();
 await expect(compact.locator('details')).not.toHaveAttribute('open');
 await expect(compact.locator('[data-booking-variant] strong').first()).toBeVisible();
 const compactBook=compact.locator('[data-booking-variant] button').first();
 await expect(compactBook).toBeVisible();await compactBook.click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.keyboard.press('Escape');await expect(compactBook).toBeFocused();
 await expect(compact.locator('details')).not.toHaveAttribute('open');
 await page.evaluate(()=>localStorage.setItem('bm.questhub.preferredSchool.v1',JSON.stringify({slug:'school-937',name:'Школа №937'})));
 await page.reload({waitUntil:'networkidle'});
 const nav=page.getByRole('navigation',{name:'Основная навигация'});
 await expect(nav.getByRole('link',{name:'Расписание',exact:true})).toHaveAttribute('href','/agenda/');
 await nav.getByRole('link',{name:'Расписание',exact:true}).click();await count(51);
 const annualMenu=nav.locator('summary').filter({hasText:'Годовые курсы'});
 await annualMenu.focus();await page.keyboard.press('Enter');
 const shmiMenu=nav.locator('summary').filter({hasText:'Школа Молодого IT-Инженера'});
 await shmiMenu.focus();await page.keyboard.press('Enter');
 await expect(nav.getByRole('link',{name:'ШМИ-1 · 1-й год обучения',exact:true})).toHaveAttribute('href','/agenda/?programme=shmi&level=1');
 await nav.getByRole('link',{name:'ШМИ-1 · 1-й год обучения',exact:true}).click();
 await count(annual.filter(o=>o.annual.studyYear===1).length);
 checks.push('Collapsed cards expose price and booking; modal restores focus without opening details; remembered school cannot narrow global navigation; nested SHMI menu filters actual first-year groups');
 await goto('/agenda/');

 const responsiveAge=finder.getByRole('combobox',{name:'Возраст ребёнка',exact:true});
 await responsiveAge.focus();
 await page.setViewportSize({width:390,height:1000});
 await expect(responsiveAge).toBeVisible();await expect(responsiveAge).toBeFocused();
 await expect(finder.getByRole('button',{name:/Изменить условия/})).toHaveAttribute('aria-expanded','true');
 await page.keyboard.press('Tab');await expect(finder.getByRole('combobox',{name:'День занятий',exact:true})).toBeFocused();
 await page.setViewportSize({width:1440,height:1050});
 checks.push('Same-page desktop → mobile preserves focused filter and expanded state; Tab continues through filters without reload');

 await goto('/sites/school-2044/agenda/');
 await expect(finder.getByRole('heading',{level:1})).toHaveText('В каком корпусе удобнее?');
 await expect(finder.getByRole('button',{name:/Все корпуса ·/})).toHaveAttribute('aria-pressed','true');
 await scan('light wizard campus');
 await page.screenshot({path:output+'/wizard-desktop-campus.png'});
 await finder.getByRole('button',{name:'Дальше →',exact:true}).focus();await page.keyboard.press('Enter');
 await expect(finder.getByRole('heading',{level:1})).toBeFocused();
 await finder.getByRole('button',{name:/Школа Молодого IT-Инженера/}).click();
 await expect(finder.getByRole('button',{name:'ШМИ-1',exact:true})).toBeVisible();
 assert.equal(await finder.getByRole('button',{name:'ШМИ-2',exact:true}).count(),0);
 assert.equal(await finder.getByRole('button',{name:/Инженерная IT-Академия/}).count(),0);
 await page.screenshot({path:output+'/wizard-desktop-programme.png'});
 await finder.getByRole('button',{name:'Посмотреть время →',exact:true}).click();await count(23);
 assert.equal(await page.locator('[data-campus]').count(),2);
 await scan('light wizard results');
 await page.screenshot({path:output+'/wizard-desktop-results.png'});
 checks.push('School QR starts with all its campuses; keyboard moves through programme → time with heading focus');

 await finder.getByRole('button',{name:'Полное расписание ↗',exact:true}).click();
 await finder.getByRole('button',{name:'Подобрать кружок →',exact:true}).click();
 await expect(finder.getByRole('heading',{level:1})).toHaveText('Выберите удобное время');await count(23);
 checks.push('Completed wizard returns to results after catalogue mode, without repeating questions');

 await finder.getByRole('button',{name:/Изменить условия/}).click();
 await finder.getByRole('combobox',{name:'Возраст ребёнка',exact:true}).focus();
 await finder.getByRole('combobox',{name:'Возраст ребёнка',exact:true}).selectOption('11');
 await expect(finder.getByRole('combobox',{name:'Возраст ребёнка',exact:true})).toBeFocused();
 await finder.getByRole('combobox',{name:'День занятий',exact:true}).selectOption('2');
 const campus2044=venues.filter(v=>v.schoolScopeSlug==='school-2044');
 const eligibleCampus=campus2044.find(v=>annual.some(o=>o.venueSlug===v.slug&&o.weeklySlots.some(slot=>slot.weekday==='Вторник')&&(o.annual.ageMin===null||o.annual.ageMin<=11)&&(o.annual.ageMax===null||o.annual.ageMax>=11)));
 assert.ok(eligibleCampus);
 await finder.getByRole('combobox',{name:'Корпус / адрес',exact:true}).selectOption(eligibleCampus.slug);
 for(const option of await finder.getByRole('combobox',{name:'Корпус / адрес',exact:true}).locator('option:not([disabled])').all()){
   const value=await option.getAttribute('value');if(value!=='all')assert.ok(annual.some(o=>o.venueSlug===value&&o.weeklySlots.some(slot=>slot.weekday==='Вторник')&&(o.annual.ageMin===null||o.annual.ageMin<=11)&&(o.annual.ageMax===null||o.annual.ageMax>=11)));
 }
 assert.equal(new URL(page.url()).searchParams.get('age'),'11');
 assert.equal(new URL(page.url()).searchParams.get('day'),'2');
 assert.equal(new URL(page.url()).searchParams.get('programme'),'shmi');
 const before=page.url();
 await finder.getByRole('button',{name:'Полное расписание ↗',exact:true}).click();
 await expect(finder).toHaveAttribute('data-view','catalogue');
 assert.equal(new URL(page.url()).searchParams.get('venue'),eligibleCampus.slug);
 await page.goBack();await expect(finder).toHaveAttribute('data-view','wizard');assert.equal(page.url(),before);
 await page.goForward();await expect(finder).toHaveAttribute('data-view','catalogue');
 await page.reload({waitUntil:'networkidle'});assert.equal(new URL(page.url()).searchParams.get('age'),'11');
 await finder.getByRole('button',{name:'Поделиться',exact:true}).click();
 const shared=await finder.getByRole('textbox',{name:'Ссылка на выбранное расписание'}).inputValue();
 assert.ok(!shared.includes('=all')&&!new URL(shared).searchParams.has('school')&&!new URL(shared).searchParams.has('method')&&!new URL(shared).searchParams.has('grouping'));
 const other=await context.newPage();await other.goto(shared,{waitUntil:'networkidle'});
 assert.equal(new URL(other.url()).searchParams.get('day'),'2');
 assert.equal(await other.getByTestId('finder-count').innerText(),await page.getByTestId('finder-count').innerText());await other.close();
 checks.push('Campus, age, day and programme survive mode change, Back/Forward, reload and shared new tab');

 for(const venueSlug of new Set(annual.map(offer=>offer.venueSlug))){
   const venue=venues.find(candidate=>candidate.slug===venueSlug),school=venue.schoolScopeSlug??venue.slug;
   await goto(`/sites/${school}/campuses/${venueSlug}/agenda/?school=foreign&venue=foreign`);
   const expected=annual.filter(offer=>offer.venueSlug===venueSlug);
   await count(expected.length);
   assert.equal(await page.locator('[data-campus]').count(),1);
   assert.equal(await page.locator('[data-campus]').getAttribute('data-campus'),venueSlug);
   assert.equal(await page.locator('main h1').count(),1);
   const summary=page.locator('[data-annual-group] > details > summary').first();await summary.focus();await page.keyboard.press('Enter');
   const detail=page.locator('[data-annual-group]:has(> details[open])').first();
   const href=await detail.getByRole('link',{name:'О курсе и этой группе'}).getAttribute('href');
   const url=new URL(href,base);assert.equal(url.searchParams.get('school'),school);assert.equal(url.searchParams.get('venue'),venueSlug);
   assert.ok(expected.some(offer=>offer.id===url.searchParams.get('offer')));
 }
 checks.push('All eight exact-campus routes ignore conflicting school/venue queries and retain exact identities in onward links');
 await goto('/sites/2044/agenda/');await expect(finder.getByRole('heading',{level:1})).toHaveText('В каком корпусе удобнее?');
 await goto('/agenda/?school=2044');await count(23);
 for(const query of ['venue=missing','programme=missing','school=missing','offer=year:missing']){
   await goto('/agenda/?'+query);assert.equal(await page.locator('[data-annual-group]').count(),0);
   assert.ok(await finder.getByRole('alert').count());
 }
 const missing=await page.goto(base+'/sites/school-2044/campuses/missing/agenda/');assert.equal(missing.status(),404);
 checks.push('School aliases resolve; unknown entities and offers fail closed; unknown exact-campus route 404');

 const paired=annual.find(offer=>offer.id==='year:К1981-26'),venue=venues.find(v=>v.slug===paired.venueSlug);
 await goto(`/sites/${venue.schoolScopeSlug}/agenda/?view=wizard&offer=${encodeURIComponent(paired.id)}&venue=${venue.slug}`);
 assert.equal(await page.locator('[data-selected="true"]').count(),2);
 for(const detail of await page.locator('[data-selected="true"]').all()){
   assert.equal(await detail.locator(':scope > details').evaluate(el=>el.open),true);
   assert.match(await detail.innerText(),/Вторник.*Четверг/);
 }
 const selected=page.locator('[data-selected="true"]').first();
 await selected.getByRole('button',{name:'Поделиться группой'}).click();
 const groupShare=await finder.getByRole('textbox').inputValue();
 assert.equal(new URL(groupShare).searchParams.get('offer'),paired.id);
 const href=await selected.getByRole('link',{name:'О курсе и этой группе'}).getAttribute('href');
 await page.goto(base+href,{waitUntil:'networkidle'});
 assert.equal(await page.locator('[data-annual-group]:has(> details[open])').count(),1);
 assert.equal(await page.locator('[data-annual-group]:has(> details[open])').getAttribute('data-annual-group'),paired.id);
 await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('[data-campus]').count(),1);
 checks.push('Two-day group has distinct disclosures but one ID; sharing and existing course page retain the selected offer');

 await goto('/agenda/?programme=projects');await count(0);await expect(finder.getByRole('heading',{name:'По этим условиям пока нет групп'})).toBeVisible();
 assert.equal(await finder.getByRole('combobox',{name:'Программа',exact:true}).locator('option:not([disabled])').count(),2);
 await expect(finder.getByRole('combobox',{name:'Программа',exact:true}).locator('option[value="projects"]')).toHaveJSProperty('disabled',true);
 checks.push('Only programmes with groups are selectable; old empty-programme URL is preserved with disabled explanation and recovery');

 await goto('/sites/school-2044/agenda/?view=wizard&step=interest&programme=projects');
 await finder.getByRole('button',{name:'По возрасту',exact:true}).click();
 await finder.getByLabel('Сколько лет ребёнку?').selectOption('11');
 await finder.getByRole('button',{name:'Посмотреть время →',exact:true}).click();
 assert.equal(new URL(page.url()).searchParams.get('programme'),null);
 assert.ok(Number(await page.getByTestId('finder-count').innerText())>0);
 const exact=campus2044[0];
 await goto(`/sites/school-2044/campuses/${exact.slug}/agenda/?programme=shmi&age=11`);
 await finder.getByRole('button',{name:'Все корпуса',exact:true}).click();
 await page.waitForURL('**/sites/school-2044/agenda/**');
 await expect(finder.getByRole('heading',{level:1})).toBeFocused();
 assert.equal(new URL(page.url()).searchParams.get('age'),'11');
 await goto(`/agenda/?offer=${encodeURIComponent(paired.id)}&programme=shmi`);
 await finder.getByRole('button',{name:'По программам',exact:true}).click();
 assert.equal(new URL(page.url()).searchParams.get('offer'),paired.id);
 assert.equal(await page.locator('[data-selected="true"]:has(> details[open])').count(),2);
 checks.push('Method switch clears incompatible programme; exact-campus route change restores focus; regrouping retains selected two-day group');

 await page.emulateMedia({reducedMotion:'reduce'});
 const openOffer=annual.find(offer=>offer.annual.admission==='open'&&offer.annual.freeSeats>0);
 const openVenue=venues.find(v=>v.slug===openOffer.venueSlug);
 for(const response of [200,400,503,0]){
   bookingResponse=response;
   await goto(`/agenda/?offer=${encodeURIComponent(openOffer.id)}&venue=${openVenue.slug}`);
   const row=page.locator('[data-selected="true"]').first();
   const variant=row.locator('[data-booking-variant]').first(),variantId=await variant.getAttribute('data-booking-variant');
   const trigger=variant.getByRole('button');await trigger.click();
   const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
   await expect(dialog.getByRole('checkbox')).not.toBeChecked();
   await dialog.getByLabel('Имя родителя').fill('Тестовый Родитель');
   await dialog.getByLabel('Телефон').fill('+79991234567');
   await dialog.getByLabel('Имя и фамилия ребёнка').fill('Тестовый Ребёнок');
   await dialog.getByLabel('Возраст полных лет').fill('11');
   const submit=dialog.locator('button[type="submit"]'),beforeCalls=bookingCalls.length;
   await submit.click();assert.equal(bookingCalls.length,beforeCalls,'No submission without consent');
   await dialog.getByRole('checkbox').check();await submit.click();
   await expect(submit).toBeDisabled();
   await expect(dialog.getByTestId(response===200?'mos-success':'mos-success-fallback')).toBeVisible();
   assert.equal(bookingCalls.length,beforeCalls+1);
   const payload=bookingCalls.at(-1);
   assert.equal(payload.offerId,openOffer.id);assert.equal(payload.variantId,variantId);
   assert.equal(payload.venueSlug,openVenue.slug);assert.equal(payload.schoolSlug,openVenue.schoolScopeSlug??openVenue.slug);
   assert.equal(payload.consent,true);assert.ok(payload.policyVersion);assert.ok(payload.consentAt);
   await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
 }
 const closed=annual.filter(offer=>offer.annual.admission==='closed');
 for(const offer of closed){await goto(`/agenda/?offer=${encodeURIComponent(offer.id)}`);await expect(page.locator('[data-selected="true"]').first().locator('[data-booking-variant] button').first()).toBeDisabled();}
 checks.push('Booking is mocked only: consent required, exact offer/variant/venue/school payload, pending disabled, 200/400/503/network outcomes truthful, five closed groups disabled, dialog focus returned');

 await goto('/agenda/');
 const legacy=page.getByTestId('legacy-intensive-schedule');await legacy.locator('summary').click();
 await legacy.getByRole('button',{name:/Фильтры/}).click();
 await legacy.getByTestId('schedule-archive-toggle').check();
 await expect(legacy.getByTestId('schedule-card')).toHaveCount(25);
 const intensive=Object.entries(snapshot.offersByQuest).find(([slug])=>slug!=='shmi')[1][0];
 await page.goto(`${base}/agenda/?offer=${encodeURIComponent(intensive.id)}`,{waitUntil:'networkidle'});
 await expect(legacy).toHaveAttribute('open','');
 await expect(page.getByRole('heading',{level:1})).toHaveText('Квесты и смены');
 await expect(legacy.getByTestId('schedule-card')).toHaveCount(1);
 assert.ok((await legacy.innerText()).includes(intensive.scheduleCard?.programFilterLabel??''));
 assert.equal(await page.getByTestId('course-finder').count(),0);
 checks.push('Existing dated schedule and archive reachable with all 25 cards; intensive deep link opens its own schedule, not annual not-found');
 const school937=Object.entries(snapshot.offersByQuest).filter(([slug])=>slug!=='shmi').flatMap(([,offers])=>offers).find(offer=>venues.find(v=>v.slug===offer.venueSlug)?.schoolScopeSlug==='school-937');
 assert.ok(school937);
 await goto(`/agenda/?school=school-1212&offer=${encodeURIComponent(school937.id)}`);
 await expect(finder.getByRole('alert')).toBeVisible();
 assert.equal(await page.getByTestId('legacy-intensive-schedule').getAttribute('open'),null);
 await page.goto(`${base}/agenda/?school=937&offer=${encodeURIComponent(school937.id)}`,{waitUntil:'networkidle'});
 await expect(legacy.getByTestId('schedule-card')).toHaveCount(1);
 const intensiveHref=await legacy.locator('a[href*="/quests/"]').first().getAttribute('href');
 assert.equal(new URL(intensiveHref,base).searchParams.get('school'),'school-937');
 checks.push('Intensive wrong-school query fails closed; short school alias gives canonical onward link');

 let responseMode='error';
 await page.route('**/data/offers-snapshot.json',route=>responseMode==='error'?route.fulfill({status:503,body:'PRIVATE_DIAGNOSTIC'}):responseMode==='malformed'?route.fulfill({json:{bad:'PRIVATE_DIAGNOSTIC'}}):route.fulfill({json:responseMode==='empty'?{...snapshot,offersByQuest:{}}:snapshot}));
 await goto('/sites/school-2044/agenda/?view=catalogue&programme=shmi');await count(23);
 await expect(finder.getByRole('button',{name:'Повторить загрузку',exact:true})).toBeVisible();
 assert.ok(!(await finder.innerText()).includes('PRIVATE_DIAGNOSTIC'));
 responseMode='malformed';await finder.getByRole('button',{name:'Повторить загрузку'}).click();
 await expect(finder.getByRole('button',{name:'Повторить загрузку'})).toBeEnabled();await count(23);
 responseMode='empty';await finder.getByRole('button',{name:'Повторить загрузку'}).click();await count(0);
 responseMode='valid';await finder.getByRole('button',{name:'Обновить расписание'}).click();await count(23);
 assert.equal(new URL(page.url()).searchParams.get('programme'),'shmi');
 await page.unroute('**/data/offers-snapshot.json');
 checks.push('503/malformed retain safe fallback; successful empty clears offers; retry restores groups without clearing filters');

 for(const width of [1440,768,390,320]){
   await page.setViewportSize({width,height:1000});
   for(const [screen,path] of [
     ['campus','/sites/school-2044/agenda/'],
     ['interest','/sites/school-2044/agenda/?view=wizard&step=interest&programme=shmi'],
     ['results','/sites/school-2044/agenda/?view=wizard&step=results&programme=shmi'],
     ['catalogue','/agenda/?school=school-2044'],
   ]){
     await goto(path);
     assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`${screen} ${width} reflow`);
     const clipping=await finder.evaluate(el=>['hidden','clip'].includes(getComputedStyle(el).overflowX));assert.equal(clipping,false);
     const small=await finder.locator('button:visible,select:visible').evaluateAll(els=>els.filter(el=>el.getBoundingClientRect().height<43.5).map(el=>el.textContent));assert.deepEqual(small,[],`${screen} ${width} touch targets`);
     if(width===390){await scan(`${screen} mobile`);}
     if(width===390||width===320)await page.screenshot({path:`${output}/${screen}-${width}.png`});
   }
 }
 await page.emulateMedia({reducedMotion:'reduce'});
 await goto('/agenda/');
 const menuButton=page.getByRole('button',{name:'Открыть меню',exact:true});
 await menuButton.click();
 const menuDialog=page.getByRole('dialog',{name:'Меню',exact:true});
 await expect(menuDialog).toBeVisible();
 await menuDialog.locator('summary').filter({hasText:'Годовые курсы'}).click();
 await menuDialog.locator('summary').filter({hasText:'Школа Молодого IT-Инженера'}).click();
 await expect(menuDialog.getByRole('link',{name:'ШМИ-3 · 3-й год обучения'})).toBeVisible();
 await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
 const menuAxe=await page.evaluate(()=>window.axe.run('[role="dialog"]',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
 a11y.push({label:'mobile open navigation',violations:menuAxe.violations});assert.deepEqual(menuAxe.violations,[]);
 assert.equal(await menuDialog.evaluate(el=>el.scrollWidth>el.clientWidth+1),false);
 await page.screenshot({path:output+'/navigation-mobile.png'});
 await page.keyboard.press('Escape');
 if(await menuDialog.isVisible())await page.keyboard.press('Escape');
 await expect(menuDialog).not.toBeVisible();await expect(menuButton).toBeFocused();
 checks.push('Mobile nested navigation opens by keyboard/native controls; Escape closes and restores focus');
 for(const width of [1440,390,320]){
   await page.setViewportSize({width,height:1050});
   await page.goto(base+'/sites/school-2044/',{waitUntil:'networkidle'});
   await expect(page.locator('main h1')).toContainText('имени Героя Советского Союза А. М. Серебрякова');
   await expect(page.locator('main h1')).toHaveCount(1);
   await expect(finder).toHaveAttribute('data-view','catalogue'); await count(23);
   assert.equal(await finder.locator('[data-campus]').count(),2);
   await finder.getByRole('button',{name:'По программам',exact:true}).click();
   assert.equal(await finder.locator('[data-programme="shmi"]').count(),1);
   const schoolImages=page.locator('main img[src*="/sites/school-2044/"]');
   assert.ok(await schoolImages.count()>=3);
   for(const img of await schoolImages.all()){await img.scrollIntoViewIfNeeded();await expect(img).toBeVisible();await expect.poll(()=>img.evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);}
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
   await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`${output}/school-2044-${width}.png`,fullPage:true});
 }
 checks.push('School2044 full honorary name and all three real assets render at 1440/390/320 without page overflow');
 checks.push('Embedded school schedule has one page H1, same 23 groups/two campuses and selectable day-based grouping as standalone');
 await goto('/sites/school-2044/');
 await finder.getByRole('button',{name:'Подобрать кружок →',exact:true}).click();
 await expect(finder).toHaveAttribute('data-view','wizard');
 await page.reload({waitUntil:'networkidle'});await expect(finder).toHaveAttribute('data-view','wizard');
 await page.goBack({waitUntil:'networkidle'});await expect(finder).toHaveAttribute('data-view','catalogue');
 await goto('/sites/school-2044/agenda/?view=wizard&step=interest&programme=shmi&level=2');
 await expect(finder.getByRole('status').filter({hasText:'По сохранённым условиям'})).toContainText('ШМИ-2');
 await finder.getByRole('button',{name:'Сбросить условия',exact:true}).click();
 await expect(finder.getByRole('button',{name:'ШМИ-2',exact:true})).toHaveCount(0);
 checks.push('Embedded wizard compact URL survives reload/Back; unavailable saved study year is explained and resettable');
 await page.setViewportSize({width:1440,height:1000});
 await page.goto(base+'/sites/?view=map&q=zz-no-campus-match',{waitUntil:'networkidle'});
 await expect(page.getByText('Нет площадок по выбранным условиям',{exact:true})).toBeVisible();
 await page.getByRole('region',{name:'Фильтры площадок',exact:true}).getByRole('button',{name:/^Фильтры/}).click();
 await expect(page.getByRole('textbox',{name:'Поиск',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Сбросить фильтры',exact:true}).click();
 await expect(page.getByText('Нет площадок по выбранным условиям',{exact:true})).toHaveCount(0);
 checks.push('Empty filtered map retains search/reset and recovers without browser Back');
 for(const view of ['grid','list']){
   await page.goto(base+`/sites/?view=${view}`,{waitUntil:'networkidle'});
   await expect(page.locator('article[data-site]')).toHaveCount(10);
   const inactive=page.locator('article[data-site][data-inactive="true"]');await expect(inactive).toHaveCount(4);
   for(const card of await inactive.all()){
     assert.equal(await card.evaluate(el=>getComputedStyle(el).filter),'grayscale(1)');
     await expect(card.getByRole('link',{name:'О площадке',exact:true})).toBeVisible();
   }
 }
 await page.goto(base+'/sites/?view=grid&q=Мехвариум',{waitUntil:'networkidle'});
 await expect(page.locator('article[data-site]')).toHaveCount(1);
 await page.getByRole('link',{name:'О площадке',exact:true}).focus();await page.keyboard.press('Enter');
 await expect(page.locator('main h1')).toHaveText('Мехвариум — база BrainMaster');
 await expect(page.getByRole('note').filter({hasText:'Готовится к открытию'})).toBeVisible();
 await expect(page.locator('main')).toContainText('Рязанский проспект, 38');
 await expect(page.locator('[data-annual-group]')).toHaveCount(0);
 await page.screenshot({path:output+'/mechvarium-preparing.png',fullPage:true});
 for(const mapColors of ['default','site']){
   await page.goto(base+`/sites/?view=map&mapColors=${mapColors}`,{waitUntil:'networkidle'});
   const markers=page.locator('[data-campus-marker][data-inactive="true"]');
   await expect.poll(()=>markers.count()).toBeGreaterThan(0);
   for(const marker of await markers.all()){
     assert.equal(await marker.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(148, 163, 184)');
     await expect(marker).toHaveAttribute('aria-label',/сейчас нет групп/);
   }
   await page.screenshot({path:output+`/inactive-map-${mapColors}.png`});
   const marker=markers.first();const campus=await marker.getAttribute('data-campus-marker');
   const school=venues.find(v=>v.slug===campus);const schoolSlug=school.schoolScopeSlug||school.slug;
   await marker.click();
   const info=page.getByRole('link',{name:'О площадке · в этом корпусе пока нет групп',exact:true});
   await expect(info).toBeVisible();await expect(info).toHaveAttribute('href',`/sites/${schoolSlug}/`);
   await expect(page.getByRole('button',{name:/Открыть расписание выбранной площадки/})).toHaveCount(0);
   await info.focus();await page.keyboard.press('Enter');
   await expect(page).toHaveURL(new RegExp(`/sites/${schoolSlug}/$`));
 }
 await goto('/sites/school-1212/agenda/?view=catalogue');
 await expect(page.locator('[data-annual-group]')).toHaveCount(6);
 for(const group of await page.locator('[data-annual-group]').all()){
   await group.locator('summary').click();
   await expect(group).toContainText('Толмачева Василиса Владимировна');
   await expect(group).toContainText('Преподаватель подтверждён командой BrainMaster');
 }
 checks.push('Owner data: 1212 teacher confirmed, base preparing without classes; ten directory cards, four gray/clickable; zero-campus markers gray in both color modes');
 await page.goto(base+'/year-courses/schedule/',{waitUntil:'networkidle'});
 const annualSchool=page.getByRole('combobox',{name:'Школа',exact:true});
 const school2044Label=(await annualSchool.locator('option').allTextContents()).find(s=>s.includes('2044'));
 await annualSchool.selectOption({label:school2044Label});
 assert.equal(await page.getByRole('combobox',{name:'Адрес',exact:true}).locator('option:not([disabled])').count(),3);
 await page.getByRole('searchbox').fill('zz-no-group-match');
 assert.equal(await page.getByRole('combobox',{name:'Адрес',exact:true}).locator('option:not([disabled])').count(),1);
 await page.getByRole('button',{name:'Сбросить фильтры',exact:true}).click();
 assert.equal(await page.locator('[data-group-id]').count(),51);
 checks.push('Annual table facets honor school/search; only two 2044 addresses and zero irrelevant options under empty search');
 await page.goto(base+'/catalog/?school=school-2044',{waitUntil:'networkidle'});
 const formatFilter=page.getByTestId('catalog-format-filter');
 if(!await formatFilter.isVisible())await page.getByRole('button',{name:/Фильтры курсов/}).click();
 await formatFilter.click();
 await expect(page.getByRole('option')).toHaveCount(2);
 await page.getByRole('option',{name:'Годовой трек',exact:true}).click();
 await expect.poll(()=>new URL(page.url()).searchParams.get('format')).toBe('year');
 await page.goBack({waitUntil:'networkidle'});await expect.poll(()=>new URL(page.url()).searchParams.get('format')).toBe(null);
 await page.goto(base+'/catalog/?format=missing',{waitUntil:'networkidle'});
 await expect(page.getByText(/Ничего не найдено/)).toBeVisible();
 if(!await page.getByRole('button',{name:'Сбросить фильтры',exact:true}).isVisible())await page.getByRole('button',{name:/Фильтры курсов/}).click();
 await page.getByRole('button',{name:'Сбросить фильтры',exact:true}).click();
 await expect(page.getByText(/Ничего не найдено/)).toHaveCount(0);
 checks.push('Catalogue offers only matching format; client filter/reset/Back work on static export, invalid format stays empty');
 await page.goto(base+'/catalog/?school=all',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:/Фильтры курсов/}).click();
 await page.getByTestId('catalog-site-filter').click();
 await expect(page.getByRole('option',{name:'Все площадки',exact:true})).toHaveCount(1);
 await expect(page.getByRole('option',{name:/нет групп/})).toHaveCount(0);
 await page.keyboard.press('Escape');
 for(const schoolSlug of ['school-17','school-875','school-1212','school-1383','school-1517','school-2103','school-937','mduc-ekt']){
   await page.setViewportSize({width:390,height:1000});
   await page.goto(base+`/sites/${schoolSlug}/`,{waitUntil:'networkidle'});
   await expect(page.locator('main h1')).toHaveCount(1);
   const photos=page.locator(`main img[src*="/sites/${schoolSlug}/"]`);
   assert.ok(await photos.count()>=1,schoolSlug);
   for(const img of await photos.all()){await img.scrollIntoViewIfNeeded();await expect.poll(()=>img.evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);}
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,schoolSlug);
   await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`${output}/${schoolSlug}-390.png`,fullPage:true});
 }
 checks.push('All nine researched profiles retain routes and real photos, including schools without active groups; 390px reflow verified');
 await page.setViewportSize({width:844,height:390});await goto('/agenda/');
 const landscapeNav=page.getByRole('navigation',{name:'Основная навигация'});
 await landscapeNav.locator('summary').filter({hasText:'Годовые курсы'}).click();
 await landscapeNav.locator('summary').filter({hasText:'Школа Молодого IT-Инженера'}).click();
 const olympiad=landscapeNav.getByRole('link',{name:'Олимпиадная Лига',exact:true});
 await olympiad.scrollIntoViewIfNeeded();await expect(olympiad).toBeInViewport();
 await olympiad.click();await page.waitForURL('**/year-courses/olympiad-league/');
 await page.goto(base+'/year-courses/schedule/',{waitUntil:'networkidle'});
 for(const offer of annual.filter(o=>o.annual.refreshError==='MOS_GROUP_NOT_FOUND')){
   const row=page.locator(`[data-group-id="${offer.id.slice(5)}"]`);
   await expect(row).toContainText('Карточка на проверке');assert.equal(await row.locator('a[href*="mos.ru"]').count(),0);
 }
 checks.push('844x390 expanded annual navigation scrolls to last item; old annual table cannot bypass unresolved-identity booking guard');
 checks.push('1440/768/390/320 all screens: no overflow/clipping, 44px controls, scoped axe scan desktop/mobile');
 assert.deepEqual(errors,[]);
 assert.deepEqual(mockedFailureReports,[{errorCode:'delivery_failed',httpStatus:400},{errorCode:'delivery_failed',httpStatus:503},{errorCode:'network',httpStatus:0}]);
 assert.deepEqual(blockedWrites,[],'Unexpected write attempts must fail browser acceptance');
 await fs.writeFile(output+'/results.json',JSON.stringify({passed:checks.length,checks,errors,blockedWrites,bookingChecks:bookingCalls.length,mockedFailureReports,a11y},null,2));
 console.log(JSON.stringify({passed:checks.length,output}));
} finally {await browser.close();}
