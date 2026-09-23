/** Local-only selection/UI regression; never follows booking links or sends forms. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../apps/web/package.json',import.meta.url));
const {chromium,expect}=require('@playwright/test');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:3199';
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(base))throw Error('LOCAL_ONLY');
const output=process.env.QA_OUTPUT||'/tmp/questhub-1517-qa';
await fs.mkdir(output,{recursive:true});
const read=async p=>JSON.parse(await fs.readFile(new URL('../'+p,import.meta.url),'utf8'));
const before=await read('scripts/fixtures/annual-69-before-1517/offers.json');
const after=await read('apps/web/data/offers-snapshot.json');
const baseline=await read('scripts/fixtures/annual-69-before-1517/registry.json');
const registry=await read('apps/web/content/annual-mos-refresh.generated.json');
const selected=['listing:2415012','К7648-26','К7651-26','listing:2542312','К7733-26'];
const offerIds=new Set(selected.map(id=>'year:'+id));
assert.deepEqual(registry.errors,baseline.errors);
assert.deepEqual(registry.candidates,baseline.candidates);
assert.equal(registry.ok,false);assert.equal(registry.verifiedGroups,5);
for(const [id,card] of Object.entries(baseline.groups))if(!selected.includes(id))assert.deepEqual(registry.groups[id],card);
for(const [quest,rows] of Object.entries(before.offersByQuest)){
  assert.deepEqual(after.offersByQuest[quest].filter(o=>!offerIds.has(o.id)),rows.filter(o=>!offerIds.has(o.id)));
}
const rows=after.offersByQuest.shmi.filter(o=>offerIds.has(o.id));
assert.equal(rows.length,5);
for(const row of rows){
 const card=registry.groups[row.id.slice(5)];
 assert.equal(row.annual.freeSeats,card.freeSeats);assert.equal(row.annual.totalSeats,card.totalSeats);
 assert.equal(row.maxCapacity,card.totalSeats);assert.equal(row.enrolled,card.totalSeats-card.freeSeats);
 assert.equal(row.annual.admission,card.status);assert.equal(row.annual.refreshedAt,card.refreshedAt);
 assert.equal(row.mosBookingUrl,card.link);assert.equal(row.annual.studyYear,before.offersByQuest.shmi.find(o=>o.id===row.id).annual.studyYear);
}
const browser=await chromium.launch({headless:true,executablePath:'/home/xipsin/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome'});
const errors=[],writes=[],checks=[],scans=[];
try{
 const context=await browser.newContext();
 await context.route('**/*',route=>{const r=route.request();if(!['GET','HEAD'].includes(r.method())){writes.push(r.method());return route.abort();}return r.url().startsWith(base+'/')?route.continue():route.abort();});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const go=async p=>{await page.goto(base+p,{waitUntil:'networkidle'});const consent=page.getByRole('button',{name:'Только необходимое'});if(await consent.isVisible())await consent.click();};
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:1000});
  for(const view of ['grid','list']){
   await go(`/sites/?view=${view}`);
   const school=page.locator('article[data-site="school-1517"]');
   await expect(school).toContainText(/5\s*групп\s*в расписании/);
   await expect(school).not.toContainText('открыто');
   assert.notEqual(await school.getAttribute('data-inactive'),'true');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
   checks.push(`${width}px ${view}:5 scheduled; honest label; active; no overflow`);
  }
  await go('/sites/school-1517/agenda/?view=catalogue');
  await expect(page.getByTestId('finder-count')).toHaveText('5');
  for(const row of rows){
   const card=page.locator(`[data-annual-group="${row.id}"]`);
   await expect(card.getByRole('link',{name:/Записаться на mos.ru/})).toHaveAttribute('href',row.mosBookingUrl);
   await card.locator('summary').click();
   await expect(card).toContainText(`Свободные места по последней проверке: ${row.annual.freeSeats} из ${row.annual.totalSeats}`);
   await expect(card).toContainText('23.09.2026');
  }
  await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  const scan=await page.evaluate(()=>window.axe.run('[data-testid="course-finder"]',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
  scans.push({width,violations:scan.violations.map(v=>v.id),incomplete:scan.incomplete.map(v=>v.id)});
  assert.deepEqual(scan.violations,[]);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await page.screenshot({path:path.join(output,`school-1517-${width}.png`),fullPage:true});
  checks.push(`${width}px schedule:five direct links, correct seats and check date`);
 }
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
}finally{await browser.close();}
const report={checkedAt:new Date().toISOString(),base,preservation:{otherAnnualOffers:64,otherRegistryCards:56,errors:true,candidates:true},checks,scans,errors,writes};
await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
