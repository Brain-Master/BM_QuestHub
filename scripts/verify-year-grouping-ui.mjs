import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
const require=createRequire(new URL('../apps/web/package.json',import.meta.url));
const {chromium}=require('playwright');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:3194';
const output=process.env.QA_OUTPUT||'/tmp/questhub-year-grouping-qa';
await fs.mkdir(output,{recursive:true});
const b=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/home/xipsin/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome'});
const checks=[];
try {
 const p=await b.newPage({viewport:{width:1440,height:1000}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/*',r=>r.request().url().startsWith(base)&&['GET','HEAD'].includes(r.request().method())?r.continue():r.abort());
 await p.goto(base+'/agenda/',{waitUntil:'networkidle'});
 await p.getByRole('button',{name:'По программам',exact:true}).click();
 assert.equal(await p.locator('[data-programme]').count(),1);
 assert.equal(await p.locator('[data-programme="shmi"] > header h3').innerText(),'Школа Молодого IT-Инженера');
 await p.getByRole('button',{name:'По площадкам',exact:true}).click();
 assert.equal(await p.locator('[data-campus]').count(),8);
 assert.equal(await p.locator('[data-annual-group]').count(),52);
 assert.equal(new Set(await p.locator('[data-annual-group]').evaluateAll(xs=>xs.map(x=>x.dataset.annualGroup))).size,51);
 const summaries=await p.locator('[data-annual-group] > summary').allTextContents();
 assert.ok(summaries.every(t=>!t.includes('(платно)')&&!t.includes('Научно - исследовательский')));
 checks.push('One SHMI programme, eight campuses, 51 independent groups / 52 slots, canonical names');
 const data=JSON.parse(await fs.readFile(new URL('../apps/web/data/v2/map-snapshot.json',import.meta.url),'utf8')).venues;
 const campusSlugs=await p.locator('[data-campus]').evaluateAll(xs=>xs.map(x=>x.dataset.campus));
 const targets=campusSlugs.map(campus=>({campus,url:`/sites/${data.find(v=>v.slug===campus).schoolScopeSlug??campus}/campuses/${campus}/agenda/`}));
 for(const target of targets) {
  await p.goto(base+target.url,{waitUntil:'networkidle'});
  assert.equal(await p.locator('[data-campus]').count(),1);
  assert.equal(await p.locator('[data-campus]').getAttribute('data-campus'),target.campus);
  assert.ok(await p.locator('[data-annual-group]').count()>0);
  assert.equal(await p.getByRole('heading',{level:1}).count(),1);
 }
 checks.push('All eight permanent campus routes display only their own address');
 const summary=p.locator('[data-annual-group] > summary').first();
 await summary.focus();await p.keyboard.press('Enter');
 assert.equal(await p.locator('[data-annual-group]').first().evaluate(el=>el.open),true);
 const link=p.locator('[data-annual-group]').first().locator('a[href*="/quests/shmi"]').first();
 const href=await link.getAttribute('href');assert.ok(href.includes('venue='));
 await link.click();await p.waitForURL('**/quests/shmi/**');
 await p.locator('[data-campus]').waitFor();
 assert.equal(await p.locator('[data-campus]').count(),1);
 assert.equal(await p.locator('[data-annual-group][open]').count(),1);
 await p.reload({waitUntil:'networkidle'});
 assert.equal(await p.locator('[data-campus]').count(),1);
 await p.locator('[data-programme] > header img').evaluate(img=>img.decode());
 assert.ok((await p.locator('[data-programme] > header img').getAttribute('src')).includes('shmi-robot'));
 checks.push('Keyboard disclosure and group→course link retain exact campus and selected offer after reload');
 await p.goto(base+'/quests/shmi/?school=school-2044&venue=missing',{waitUntil:'networkidle'});
 assert.equal(await p.locator('[data-annual-group]').count(),0);
 checks.push('Unknown campus query fails closed');
 for(const width of [1440,390,320]){
  await p.setViewportSize({width,height:1000});
  await p.goto(base+'/sites/school-2044/agenda/?view=catalogue',{waitUntil:'networkidle'});
  assert.equal(await p.locator('[data-campus]').count(),2);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await p.screenshot({path:output+`/school-2044-${width}.png`,fullPage:true});
 }
 checks.push('School groups both own campuses; 1440/390/320 reflow');
 assert.deepEqual(errors,[]);
 await fs.writeFile(output+'/results.json',JSON.stringify({checks,errors},null,2));
 console.log(JSON.stringify({passed:checks.length,output}));
}finally{await b.close();}
