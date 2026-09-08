import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir,writeFile } from 'node:fs/promises';
const require=createRequire(new URL('../apps/web/package.json',import.meta.url));
const {chromium}=require('playwright');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:3188';
const output=process.env.QA_OUTPUT||'/tmp/questhub-year-schedule-qa';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const checks=[];
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[],writes=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push({method:r.method(),path:new URL(r.url()).pathname});});
 await page.route('**/*',r=>r.request().url().startsWith(base)&&(['GET','HEAD'].includes(r.request().method())||new URL(r.request().url()).pathname==='/__nextjs_original-stack-frames')?r.continue():r.abort());
 const response=await page.goto(base+'/year-courses/schedule/',{waitUntil:'networkidle'});
 assert.equal(response.status(),200);
 const cards=page.locator('.ys-card');
 assert.equal(await cards.count(),51);
 assert.equal(await page.locator('.ys-slots li').count(),52);
 assert.equal(await page.locator('.ys-open').count(),46);
 assert.equal(await page.locator('.ys-closed').count(),5);
 assert.equal(await page.getByRole('combobox',{name:'Адрес',exact:true}).locator('option').count(),9);
 assert.equal(await page.locator('main h1').count(),1);
 checks.push('51 groups / 52 weekly slots / 8 locations / 46 open / 5 closed');
 const links=await cards.locator('a').evaluateAll(a=>a.map(x=>x.href));
 assert.equal(links.filter(u=>u.includes('/card/')).length,13);
 assert.equal(new Set(links.filter(u=>u.includes('/card/'))).size,4);
 assert.ok(links.includes('https://www.mos.ru/pgu2/activity/card/965306'));
 assert.ok(links.includes('https://www.mos.ru/pgu2/activity/groups?keyword=2415012'));
 assert.ok(!links.some(u=>u.includes('/card/2521221')));
 checks.push('Direct IDs distinct from listing IDs; fallback search URLs preserved');
 const limited=cards.filter({has:page.locator('.ys-limited')});
 assert.equal(await limited.count(),2);
 for(const card of await limited.all()) {
  assert.ok((await card.innerText()).includes('Количество мест не подтверждено'));
  assert.ok(!(await card.innerText()).includes('12 из'));
 }
 await page.getByRole('combobox',{name:'Школа',exact:true}).selectOption('Школа № 1517');
 assert.equal(await cards.count(),5);
 await page.getByLabel('Только с открытым приёмом на дату среза').check();
 assert.equal(await cards.count(),1);
 assert.ok((await cards.innerText()).includes('2 из 12'));
 assert.equal(await cards.locator('a').getAttribute('href'),'https://www.mos.ru/pgu2/activity/card/965306');
 checks.push('1517 open group / 2 of 12 / direct card 965306');
 await page.getByRole('combobox',{name:'День недели',exact:true}).selectOption('Четверг');
 assert.equal(await cards.count(),0);
 await page.getByRole('heading',{name:'Таких групп в выгрузке нет'}).waitFor();
 await page.getByRole('button',{name:'Показать все группы'}).click();
 assert.equal(await cards.count(),51);
 await page.getByLabel('Поиск по названию, педагогу или коду').fill('К1981-26');
 assert.equal(await cards.count(),1);
 assert.equal(await cards.locator('.ys-slots li').count(),2);
 checks.push('Combined filters, empty/reset, multi-day group preserved');
 await page.getByRole('button',{name:'Сбросить фильтры'}).click();
 await page.getByRole('combobox',{name:'Школа',exact:true}).selectOption('Школа № 1212');
 assert.equal(await cards.count(),6);
 await page.getByRole('combobox',{name:'Адрес',exact:true}).selectOption('LOC-004');
 assert.equal(await cards.count(),3);
 await page.getByRole('combobox',{name:'Школа',exact:true}).selectOption('Школа № 17');
 assert.equal(await page.getByRole('combobox',{name:'Адрес',exact:true}).inputValue(),'');
 assert.equal(await cards.count(),6);
 checks.push('Exact campus filter and school change resets incompatible address');
 await page.getByRole('button',{name:'Сбросить фильтры'}).click();
 const body=await page.locator('main').innerText();
 assert.ok(!/СНИЛС|raw_application|registry_as_of|contact_phone|Вставленный текст/.test(body));
 for(const width of [1440,390,320]) {
  await page.setViewportSize({width,height:960});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  const consent=page.getByRole('button',{name:'Только необходимое'});
  if(await consent.isVisible())await consent.click();
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await page.screenshot({path:`${output}/schedule-${width}.png`});
 }
 await page.getByRole('combobox',{name:'Школа',exact:true}).focus();
 await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');
 assert.notEqual(await page.getByRole('combobox',{name:'Школа',exact:true}).evaluate(el=>getComputedStyle(el).outlineStyle),'none');
 checks.push('Privacy whitelist, 1440/390/320 reflow, keyboard focus');
 // Dev overlay POST resolves stack frames; it is not a product data mutation.
 const annualWrites=writes.filter(r=>r.path!=='/__nextjs_original-stack-frames');
 assert.deepEqual(annualWrites,[],'Annual schedule must not attempt writes');
 const beforeLegacyNavigation=writes.length;
 for(const path of ['/year-courses/','/year-courses/shmi/','/agenda/']) {
  await page.goto(base+path,{waitUntil:'networkidle'});
  await page.locator('.ys-entry a').waitFor();
  assert.equal(await page.locator('.ys-entry a').getAttribute('href'),'/year-courses/schedule/');
 }
 await page.locator('.ys-entry a').click();
 await page.waitForURL('**/year-courses/schedule/');
 await page.getByRole('heading',{name:'Группы ШМИ'}).waitFor();
 assert.equal(await page.locator('.ys-card').count(),51);
 assert.deepEqual(errors,[]);
 checks.push('Overview / SHMI / agenda navigation; no annual workspace writes or runtime errors');
 await writeFile(output+'/results.json',JSON.stringify({status:'passed',checks,annualWrites,legacyNavigationRequests:writes.slice(beforeLegacyNavigation),note:'All external requests and non-diagnostic local POSTs blocked. Existing agenda may attempt its traffic telemetry; not a new schedule write.'},null,2)+'\n');
 console.log(JSON.stringify({passed:checks.length,output}));
}finally{await browser.close();}
