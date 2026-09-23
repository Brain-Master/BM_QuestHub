/** Local export acceptance. No external requests, enrollments or chat joins. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../apps/web/package.json',import.meta.url));
const {chromium,expect}=require('@playwright/test');
const root=new URL('../',import.meta.url).pathname;
const base=process.env.PREVIEW_URL||'http://127.0.0.1:3199';
const output=process.env.QA_OUTPUT||'/tmp/questhub-school37-qa';
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(base))throw Error('Local preview required');
await fs.mkdir(output,{recursive:true});
// Inspect string values too, including exported HTML, RSC and JS, not only JSON keys.
function privateText(text){
  for(let i=0;i<2;i++){text=text.replace(/\\u([\da-f]{4})/gi,(_,code)=>String.fromCharCode(parseInt(code,16))).replace(/\\\//g,'/');try{text=decodeURIComponent(text);}catch{/* ordinary percent text */}}
  return /\bmax\.(?:ru|im)\b|\bmax:\/\/|ФИО ученика|ФИО заявителя|Дата рождения ученика|Номер заявления/i.test(text);
}
for(const synthetic of ['https://max.ru/join/SYNTHETIC','max://join/SYNTHETIC','https%3A%2F%2Fmax.ru%2Fjoin%2FSYNTHETIC','https://max.im/join/SYNTHETIC']){
  assert.equal(privateText(JSON.stringify({contactNote:synthetic})),true);
}
let privacyFiles=0;
for(const dir of ['apps/web/content','apps/web/data','apps/web/out']){
  for(const rel of await fs.readdir(path.join(root,dir),{recursive:true})){
    if(!/\.(?:json|tsx?|jsx?|html|txt)$/.test(rel))continue;
    const target=path.join(root,dir,rel);
    if(!(await fs.stat(target)).isFile())continue;
    assert.equal(privateText(await fs.readFile(target,'utf8')),false,`Private content in ${dir}/${rel}`);
    privacyFiles++;
  }
}
const browser=await chromium.launch({headless:true,executablePath:'/home/xipsin/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome'});
const errors=[],writes=[],checks=[],scans=[];
try{
 const context=await browser.newContext({viewport:{width:1440,height:1050}});
 context.setDefaultTimeout(10000);
 await context.route('**/*',route=>{
   const r=route.request();if(!['GET','HEAD'].includes(r.method())){writes.push(r.url());return route.abort();}
   return r.url().startsWith(base+'/')?route.continue():route.abort();
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const finder=page.getByTestId('course-finder'),slots=page.locator('[data-annual-group]');
 async function go(p){await page.goto(base+p,{waitUntil:'networkidle'});const consent=page.getByRole('button',{name:'Только необходимое'});if(await consent.isVisible())await consent.click();}
 async function count(n){await expect(page.getByTestId('finder-count')).toHaveText(String(n));await expect(slots).toHaveCount(n);}
 async function scan(label){
   await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
   const report=await page.evaluate(()=>window.axe.run('[data-testid="course-finder"]',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
   scans.push({label,violations:report.violations.map(v=>v.id),incomplete:report.incomplete.map(v=>v.id)});
   assert.deepEqual(scans.at(-1).violations,[],label);
 }
 async function schoolRows(n){
   await count(n);
   for(const row of await slots.all()){
     await expect(row).toContainText('1375 ₽ / занятие');
     await expect(row.getByRole('link',{name:/Записаться на mos.ru/})).toBeVisible();
     assert.ok(!(await row.innerText()).includes('Уровень уточняется'));
   }
 }
 await go('/agenda/');await expect(page.getByTestId('finder-count')).toHaveText('70');
 await finder.getByRole('combobox',{name:'Площадка',exact:true}).selectOption('school-37');await schoolRows(9);
 await finder.getByRole('combobox',{name:'Программа',exact:true}).selectOption('shmi');
 await finder.getByRole('combobox',{name:'Год обучения',exact:true}).selectOption('1');await schoolRows(6);
 await finder.getByRole('combobox',{name:'Год обучения',exact:true}).selectOption('2');await schoolRows(3);
 await page.goBack({waitUntil:'networkidle'});await schoolRows(6);
 await page.goForward({waitUntil:'networkidle'});await schoolRows(3);
 await page.reload({waitUntil:'networkidle'});await schoolRows(3);
 checks.push('Global70; school37 nine; SHMI1 six/SHMI2 three; Back/Forward/reload preserved');
 await go('/sites/school-37/agenda/?view=catalogue');await schoolRows(9);
 const cardIds=['1019233','1019236','1019244','1019286','1019288','1019293','1019299','1019455','1019466'];
 for(let i=0;i<9;i++){
   const row=page.locator(`[data-annual-group="year:К${2763+i}-26"]`);
   await expect(row.getByRole('link',{name:/Записаться на mos.ru/})).toHaveAttribute('href',`https://www.mos.ru/pgu2/activity/card/${cardIds[i]}`);
   await expect(row).toContainText('Кузнецова');
 }
 await page.screenshot({path:output+'/school37-desktop.png',fullPage:true});
 await scan('school37 desktop');
 const trigger=slots.first().getByRole('link',{name:/Записаться на mos.ru/});
 await trigger.focus();await page.keyboard.press('Enter');
 await expect(page.getByRole('heading',{name:'Запись на mos.ru',exact:true})).toBeFocused();
 await page.getByRole('button',{name:'Остановить таймер'}).click();
 await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
 checks.push('Exact9 direct MOS links; correct teacher; keyboard popup focus and cancel; no writes');
 await go('/sites/37/agenda/?view=catalogue');await schoolRows(9);
 await go('/sites/school-37/campuses/school-37-michurinsky-28/agenda/?view=catalogue');await schoolRows(9);
 await go('/sites/school-37/');await expect(page.getByRole('heading',{level:1})).toContainText('37');
 await expect(page.getByText('Мичуринский проспект, 28',{exact:true}).first()).toBeVisible();
 await go('/sites/');
 const school=page.locator('article[data-site="school-37"]');await expect(school).toHaveCount(1);
 assert.notEqual(await school.getAttribute('data-inactive'),'true');
 checks.push('Landing, numeric alias and campus route; active school visible in sites directory');
 for(const width of [390,320]){
   await page.setViewportSize({width,height:844});await go('/sites/school-37/agenda/');
   await finder.getByRole('button',{name:'Дальше →',exact:true}).focus();await page.keyboard.press('Enter');
   await expect(finder.getByRole('heading',{level:1})).toBeFocused();
   await finder.getByRole('button',{name:/Школа Молодого IT-Инженера/}).click();
   await finder.getByRole('button',{name:'ШМИ-2',exact:true}).click();
   await finder.getByRole('button',{name:'Посмотреть время →',exact:true}).click();await schoolRows(3);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   assert.equal(privateText(await page.content()),false);
   await scan(`school37 ${width}px`);
   await page.screenshot({path:`${output}/school37-mobile-${width}.png`,fullPage:true});
 }
 checks.push('QR wizard at390/320px; keyboard/focus; three SHMI2 slots; no horizontal overflow');
 await go('/year-courses/schedule/');
 const schoolSelect=page.getByRole('combobox',{name:'Школа',exact:true});
 const label=(await schoolSelect.locator('option').allTextContents()).find(s=>/№\s*37(?:[»\s]|$)/.test(s));
 assert.ok(label);await schoolSelect.selectOption({label});
 await expect(page.locator('[data-group-id]')).toHaveCount(9);
 checks.push('Annual table has same nine groups; public content/export/bundle privacy scan passed');
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
 const report={ok:true,checks,errors,writes,scans,privacyFiles,output,evidence:'LOCAL EXPORT; no production, MOS submissions or MAX joins; automated axe is not a full accessibility audit'};
 await fs.writeFile(output+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();}
