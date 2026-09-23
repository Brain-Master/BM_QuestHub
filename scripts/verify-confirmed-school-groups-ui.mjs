/** Local-only browser acceptance using public fixture responses. Never enrolls. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../apps/web/package.json',import.meta.url));
const {chromium,expect}=require('@playwright/test');
const root=new URL('../',import.meta.url).pathname;
const base=process.env.PREVIEW_URL||'http://127.0.0.1:3199';
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(base))throw Error('LOCAL_ONLY');
const browser=await chromium.launch({headless:true,executablePath:'/home/xipsin/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome'});
const checks=[],errors=[],writes=[],scans=[];
const out='/tmp/questhub-confirmed-schools-qa';await fs.mkdir(out,{recursive:true});
const current=await fs.readFile(root+'apps/web/data/offers-snapshot.json','utf8');
const old=await fs.readFile(root+'scripts/fixtures/annual-69-before-1517/offers.json','utf8');
let stale=false;
try{
 const context=await browser.newContext();context.setDefaultTimeout(10000);
 await context.route('**/*',r=>{
  const request=r.request(),url=request.url();
  if(!['GET','HEAD'].includes(request.method())){writes.push(url);return r.abort();}
  if(!url.startsWith(base+'/'))return r.abort();
  if(url.endsWith('/data/offers-snapshot.json'))return r.fulfill({contentType:'application/json',body:stale?old:current});
  if(url.endsWith('/ops/public/mos-availability.json'))return r.fulfill({contentType:'application/json',body:JSON.stringify({version:1,attemptedAt:'2026-09-23T00:00:00.000Z',completedAt:'2026-09-23T00:00:00.000Z',expected:0,verified:0,archived:0,errors:[],entries:{}})});
  return r.continue();
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const go=async p=>{await page.goto(base+p,{waitUntil:'networkidle'});const consent=page.getByRole('button',{name:'Только необходимое'});if(await consent.isVisible())await consent.click();};
 const count=async n=>{await expect(page.getByTestId('finder-count')).toHaveText(String(n));await expect(page.locator('[data-annual-group]')).toHaveCount(n);};
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:950});
  await go('/sites/school-1212/agenda/?view=catalogue');await count(7);
  const row=page.locator('[data-annual-group="year:К4609-26"]');
  await expect(row).toContainText('13:30');await expect(row).toContainText('Свободно 14 из 20');
  await expect(row.getByRole('meter')).toHaveAttribute('aria-valuenow','6');
  await expect(row.getByRole('link',{name:/Записаться на mos.ru/})).toHaveAttribute('href','https://www.mos.ru/pgu2/activity/card/984756');
  await row.locator('summary').click();await expect(row).toContainText('Толмачева Василиса Владимировна');
  await expect(page.locator('[data-annual-group="year:К4617-26"]')).toContainText('Свободно 3 из 15');
  await page.screenshot({path:`${out}/1212-${width}.png`,fullPage:true});
  await go('/sites/school-937/agenda/?view=catalogue');await count(4);
  for(const r of await page.locator('[data-annual-group]').all()){
   await expect(r).toContainText('2-й год');await expect(r).toContainText('6–13');
   await r.locator('summary').click();await expect(r).toContainText('Локтеева Ирина Дмитриевна');
  }
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  const scan=await page.evaluate(()=>window.axe.run('[data-testid="course-finder"]',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
  scans.push({width,violations:scan.violations.map(v=>v.id)});assert.deepEqual(scans.at(-1).violations,[]);
  await page.screenshot({path:`${out}/937-${width}.png`,fullPage:true});
  checks.push({width,school1212:7,school937:4,capacity:true,bookingLinks:true});
 }
 await go('/agenda/');await expect(page.getByTestId('finder-count')).toHaveText('70');
 await go('/sites/school-37/agenda/?view=catalogue');await count(9);
 await go('/sites/');await expect(page.locator('[data-site="school-937"]')).not.toHaveAttribute('data-inactive','true');
 stale=true;
 for(const school of ['1212','937']){
  await go(`/sites/school-${school}/agenda/?view=catalogue`);await count(school==='1212'?7:4);
 }
 checks.push('Delayed old69 hot cannot erase five new groups or overwrite owner corrections');
 await go('/sites/school-937/agenda/');
 const finder=page.getByTestId('course-finder');
 await finder.getByRole('button',{name:'Дальше →',exact:true}).focus();await page.keyboard.press('Enter');
 await expect(finder.getByRole('heading',{level:1})).toBeFocused();
 await finder.getByRole('button',{name:/Школа Молодого IT-Инженера/}).click();
 await finder.getByRole('button',{name:'ШМИ-2',exact:true}).click();
 await finder.getByRole('button',{name:'Посмотреть время →',exact:true}).click();await count(4);
 await page.reload({waitUntil:'networkidle'});await count(4);checks.push('QR wizard, keyboard focus, filters and reload');
 await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
 const wizardScan=await page.evaluate(()=>window.axe.run('[data-testid="course-finder"]',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
 scans.push({view:'wizard',violations:wizardScan.violations.map(v=>v.id)});assert.deepEqual(scans.at(-1).violations,[]);
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
 await fs.writeFile(out+'/report.json',JSON.stringify({base,checks,scans,errors,writes},null,2)+'\n');
 console.log(JSON.stringify({base,checks,scans,errors,writes,out}));
}finally{await browser.close();}
