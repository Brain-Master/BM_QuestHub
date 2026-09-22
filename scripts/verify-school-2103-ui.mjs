/** Local read-only browser acceptance; external requests and all writes are blocked. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../apps/web/package.json',import.meta.url));
const {chromium,expect}=require('@playwright/test');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:3197';
const output=process.env.QA_OUTPUT||'/tmp/questhub-school2103-qa';
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(base))throw Error('Local preview required');
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/home/xipsin/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome'});
const errors=[],writes=[],checks=[];
try{
 const context=await browser.newContext({viewport:{width:1440,height:1050}});
 context.setDefaultTimeout(10000);
 await context.route('**/*',route=>{
   const r=route.request();if(!['GET','HEAD'].includes(r.method())){writes.push(r.url());return route.abort();}
   return r.url().startsWith(base+'/')?route.continue():route.abort();
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const finder=page.getByTestId('course-finder');
 const slots=page.locator('[data-annual-group]');
 async function go(path){await page.goto(base+path,{waitUntil:'networkidle'});const consent=page.getByRole('button',{name:'Только необходимое'});if(await consent.isVisible())await consent.click();}
 async function count(n){await expect(page.getByTestId('finder-count')).toHaveText(String(n));await expect(slots).toHaveCount(n);}
 async function correctPrices(n){await count(n);for(const slot of await slots.all()){
   await expect(slot.getByText('1 000 ₽ / занятие · 1 акад. час (45 мин)',{exact:true})).toBeVisible();
   await expect(slot.getByRole('link',{name:/Записаться на mos.ru/})).toBeVisible();
   assert.ok(!(await slot.innerText()).includes('888'));
 }}
 await go('/agenda/');await expect(page.getByTestId('finder-count')).toHaveText('60');
 await finder.getByRole('combobox',{name:'Площадка',exact:true}).selectOption('school-2103');await correctPrices(9);
 await go('/sites/school-2103/agenda/?view=catalogue');await correctPrices(9);
 await expect(finder.locator('[data-campus]')).toHaveCount(2);
 await page.screenshot({path:output+'/school2103-desktop.png',fullPage:true});
 const switcher=finder.getByRole('group',{name:'Быстрое переключение корпуса'});
 await switcher.getByRole('button',{name:'Голубинская ул., 13, корп. 2',exact:true}).click();await correctPrices(2);
 await switcher.getByRole('button',{name:'Голубинская ул., 5, корп. 4',exact:true}).click();await correctPrices(7);
 await page.reload({waitUntil:'networkidle'});await correctPrices(7);
 await finder.getByRole('combobox',{name:'Программа',exact:true}).selectOption('shmi');
 await finder.getByRole('combobox',{name:'Год обучения',exact:true}).selectOption('2');await correctPrices(3);
 checks.push('Global60; school9; campuses2/7; SHMI2 three groups; reload retains choice; compact price+booking');
 for(const [campus,n] of [['school-2103-yasenevo',2],['school-2103-golubinskaya-5k4',7]]){
   await go(`/sites/school-2103/campuses/${campus}/agenda/?view=catalogue`);await correctPrices(n);
 }
 await page.setViewportSize({width:390,height:844});
 await go('/sites/school-2103/agenda/');
 await expect(finder.getByRole('heading',{level:1})).toHaveText('В каком корпусе удобнее?');
 await finder.getByRole('button',{name:'Дальше →',exact:true}).focus();await page.keyboard.press('Enter');
 await expect(finder.getByRole('heading',{level:1})).toBeFocused();
 await finder.getByRole('button',{name:/Школа Молодого IT-Инженера/}).click();
 await finder.getByRole('button',{name:'ШМИ-3',exact:true}).click();
 await finder.getByRole('button',{name:'Посмотреть время →',exact:true}).click();await correctPrices(2);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.screenshot({path:output+'/school2103-mobile.png',fullPage:true});
 checks.push('Both campus routes; mobile QR wizard keyboard/focus; SHMI3 two groups; no horizontal overflow');
 await go('/year-courses/schedule/');
 const schoolSelect=page.getByRole('combobox',{name:'Школа',exact:true});
 const schoolLabel=(await schoolSelect.locator('option').allTextContents()).find(s=>s.includes('2103'));
 assert.ok(schoolLabel);await schoolSelect.selectOption({label:schoolLabel});
 const tableRows=page.locator('[data-group-id]');await expect(tableRows).toHaveCount(9);
 for(const row of await tableRows.all()){
   await expect(row.locator('dd').filter({hasText:/1\s000\s*₽\s*\/ занятие/})).toBeVisible();
   assert.ok(!(await row.innerText()).includes('888'));
 }
 checks.push('Annual table shows all9 with1000 RUB, no raw888 displayed');
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
 const report={ok:true,checks,errors,writes,output};
 await fs.writeFile(output+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();}
