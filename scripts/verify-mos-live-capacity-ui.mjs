/** Synthetic HTTP availability, real public frontend. No production requests or registrations. */
import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import {createRequire} from 'node:module';
process.env.TSX_TSCONFIG_PATH=new URL('../apps/web/tsconfig.json',import.meta.url).pathname;
const {require:tsRequire}=await import('tsx/cjs/api');
const {mosAvailabilityBinding,mosAvailabilitySchema}=tsRequire('../apps/web/lib/offers/mos-availability.ts',import.meta.url);
const require=createRequire(new URL('../apps/web/package.json',import.meta.url));const {chromium,expect}=require('@playwright/test');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:3199';if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(base))throw Error('LOCAL_ONLY');
const output=process.env.QA_OUTPUT||'/tmp/questhub-capacity-ui';await fs.mkdir(output,{recursive:true});
const original=JSON.parse(await fs.readFile(new URL('../apps/web/data/offers-snapshot.json',import.meta.url),'utf8'));
const target=original.offersByQuest.shmi.find(o=>o.id==='year:К7648-26');const binding=mosAvailabilityBinding(target);
let source=structuredClone(original),free=2,status=200,error,checkedAt=new Date().toISOString();let requests=0;
const payload=()=>({version:1,attemptedAt:checkedAt,completedAt:checkedAt,expected:1,verified:error?0:1,archived:0,
 errors:error?[{offerId:target.id,code:error}]:[],entries:{[target.id]:{binding,availability:{checkedAt,totalSeats:15,freeSeats:free,admission:'open'},...(error?{error}: {})}}});
const errors=[],writes=[],checks=[],scans=[];const browser=await chromium.launch({headless:true,executablePath:'/home/xipsin/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome'});
try{
 const context=await browser.newContext();
 await context.route('**/*',route=>{const r=route.request();
  if(!['GET','HEAD'].includes(r.method())){writes.push(r.method());return route.abort();}
  if(!r.url().startsWith(base+'/'))return route.abort();
  if(new URL(r.url()).pathname==='/ops/public/mos-availability.json'){requests++;return route.fulfill({status,contentType:'application/json',body:JSON.stringify(payload())});}
  if(new URL(r.url()).pathname==='/data/offers-snapshot.json')return route.fulfill({contentType:'application/json',body:JSON.stringify(source)});
  return route.continue();
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const go=async()=>{await page.goto(base+'/sites/school-1517/agenda/?view=catalogue',{waitUntil:'networkidle'});const consent=page.getByRole('button',{name:'Только необходимое'});if(await consent.isVisible())await consent.click();};
 const card=()=>page.locator(`[data-annual-group="${target.id}"]`);
 const refresh=async()=>{const count=requests;await page.getByRole('button',{name:'Обновить расписание',exact:true}).click();await expect.poll(()=>requests).toBeGreaterThan(count);};
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:1000});await go();
  await expect(card().getByTestId('schedule-capacity')).toContainText('Свободно 2 из 15');
  await expect(card().getByRole('meter')).toHaveAttribute('aria-valuenow','13');
  await expect(card().getByRole('meter')).toBeVisible();assert.equal(await card().locator('details').getAttribute('open'),null);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  const scan=await page.evaluate(()=>window.axe.run('[data-testid="course-finder"]',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
  scans.push({width,violations:scan.violations.map(v=>v.id),incomplete:scan.incomplete.map(v=>v.id)});assert.deepEqual(scan.violations,[]);
  await page.screenshot({path:path.join(output,`capacity-${width}.png`),fullPage:true});
  await card().screenshot({path:path.join(output,`card-${width}.png`)});
  checks.push(`${width}px visible collapsed meter, exact free/booked counts, no overflow`);
 }
 free=0;checkedAt=new Date().toISOString();await refresh();await expect(card()).toContainText('Свободных мест нет');await expect(card().getByRole('meter')).toHaveAttribute('aria-valuenow','15');checks.push('full group is zero free, not unknown');
 free=15;checkedAt=new Date().toISOString();await refresh();await expect(card()).toContainText('Свободно 15 из 15');await expect(card().getByRole('meter')).toHaveAttribute('aria-valuenow','0');checks.push('empty group zero occupied, no artificial minimum bar width');
 status=503;await refresh();await expect(card()).toContainText('Обновление не удалось');await expect(card()).toContainText('Свободно 15 из 15');checks.push('HTTP failure retains counts and shows warning');
 status=200;free=2;checkedAt=new Date().toISOString();await refresh();await expect(card()).toContainText('Свободно 2 из 15');
 error='MOS_IDENTITY_CHANGED';checkedAt=new Date().toISOString();await refresh();await expect(card().getByRole('link',{name:/Записаться на mos.ru/})).toHaveCount(0);checks.push('identity error prevents direct booking even with retained free seats');
 error=undefined;source=structuredClone(original);source.offersByQuest.shmi.find(o=>o.id===target.id).annual.freeSeats=null;
 source.offersByQuest.shmi.find(o=>o.id===target.id).annual.sourceSha256='b'.repeat(64);
 await refresh();await expect(card()).toContainText('Количество мест не указано на mos.ru');await expect(card().getByRole('meter')).toHaveCount(0);checks.push('mismatched source ignored; unknown seats not zero or full');
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
}finally{await browser.close();}
const report={at:new Date().toISOString(),base,checks,scans,errors,writes,requests};await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
if(process.env.MOS_MANUAL_REPORT){
 const manual=mosAvailabilitySchema.parse(JSON.parse(await fs.readFile(process.env.MOS_MANUAL_REPORT,'utf8')));
 await fs.writeFile(path.join(output,'../manual-public-read.json'),JSON.stringify(manual,null,2)+'\n',{flag:'wx'});
}
