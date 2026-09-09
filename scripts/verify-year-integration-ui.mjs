import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../apps/web/package.json',import.meta.url));
const {chromium}=require('playwright');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:3191';
const output=process.env.QA_OUTPUT||'/tmp/questhub-year-integration-ui';
const snapshot=JSON.parse(await fs.readFile(new URL('../apps/web/data/offers-snapshot.json',import.meta.url),'utf8'));
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const checks=[];
try {
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 const errors=[],writes=[];
 context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
 await context.route('**/*',r=>{
  const request=r.request();
  if(!['GET','HEAD'].includes(request.method())){writes.push(request.method());return r.abort();}
  return request.url().startsWith(base)?r.continue():r.abort();
 });
 const page=await context.newPage();
 await page.goto(base+'/year-courses/schedule/',{waitUntil:'networkidle'});
 const addresses=await page.getByRole('combobox',{name:'Адрес',exact:true}).locator('option').evaluateAll(xs=>xs.map(x=>x.value).filter(Boolean));
 assert.equal(addresses.length,8);
 for(const address of addresses) {
  await page.getByRole('combobox',{name:'Адрес',exact:true}).selectOption(address);
  assert.ok(await page.locator('.ys-card').count()>0);
  const mapLink=await page.locator('.ys-card a[href*="yandex.ru/maps"]').first().getAttribute('href');
  assert.match(mapLink,/pt=37\.[\d]+,55\.[\d]+/);
  const school=page.locator('.ys-card .yc-label a').first();
  const href=await school.getAttribute('href');
  await school.click();await page.waitForURL(base+href);
  assert.equal(await page.locator('main h1').count(),1);
  assert.ok(await page.locator('iframe').count()>0,'School includes the existing map widget');
  await page.locator('main a[href$="/agenda"], main a[href$="/agenda/"]').first().click();
  await page.waitForURL('**/agenda/');
  await page.getByRole('button',{name:'Дальше →',exact:true}).click();
  await page.getByText(/ШМИ|молодого/iu).first().waitFor();
  await page.goto(base+'/year-courses/schedule/',{waitUntil:'networkidle'});
 }
 checks.push('All 8 canonical campuses have groups, map coordinates and working school/map pages');
 for(const slug of ['shmi','it-academy','projects','olympiad-league']) {
  const response=await page.goto(base+'/quests/'+slug+'/',{waitUntil:'networkidle'});
  assert.equal(response.status(),200);assert.equal(await page.getByRole('heading',{level:1}).count(),1);
 }
 checks.push('All 4 annual programmes have common catalogue object pages');
 await page.route('**/data/offers-snapshot.json',r=>r.fulfill({status:503,body:'internal diagnostic must not appear'}));
 await page.goto(base+'/year-courses/schedule/',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Повторить',exact:true}).waitFor();
 assert.equal(await page.locator('.ys-card').count(),51);
 assert.ok(!(await page.locator('main').innerText()).includes('internal diagnostic'));
 await page.unroute('**/data/offers-snapshot.json');
 await page.route('**/data/offers-snapshot.json',r=>r.fulfill({json:{...snapshot,offersByQuest:{}}}));
 await page.getByRole('button',{name:'Повторить',exact:true}).click();
 await page.getByText('В загруженном расписании нет годовых групп.',{exact:true}).waitFor();
 assert.equal(await page.locator('.ys-card').count(),0);
 await page.unroute('**/data/offers-snapshot.json');
 await page.route('**/data/offers-snapshot.json',r=>r.fulfill({json:snapshot}));
 await page.getByRole('button',{name:'Обновить расписание',exact:true}).click();
 await page.locator('.ys-card').first().waitFor();assert.equal(await page.locator('.ys-card').count(),51);
 checks.push('HTTP failure preserves data with safe retry; valid empty clears data; retry restores groups');
 for(const width of [1440,320]) {
  await page.setViewportSize({width,height:960});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await page.screenshot({path:output+`/shared-schedule-${width}.png`});
 }
 assert.deepEqual(errors,[]);
 // Existing general course pages may request traffic telemetry; requests were blocked.
 checks.push('Desktop/mobile reflow and no browser runtime errors; external requests and writes blocked');
 await fs.writeFile(output+'/results.json',JSON.stringify({checks,blockedLegacyWrites:writes},null,2));
 console.log(JSON.stringify({passed:checks.length,output}));
}finally{await browser.close();}
