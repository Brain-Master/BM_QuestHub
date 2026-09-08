import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(new URL('../apps/web/package.json',import.meta.url));
const {chromium}=require('playwright');
const origin=process.env.PREVIEW_URL||'http://127.0.0.1:3188';
const output=process.env.QA_OUTPUT||'/tmp/questhub-year-qa';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const checks=[];
try {
 const page=await browser.newPage();
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 // Restrict this acceptance run to local HTTP, with external writes impossible.
 await page.route('**/*',route=>route.request().url().startsWith(origin)||route.request().url().startsWith('data:')?route.continue():route.abort());
 for(const width of [1440,390,320]) {
  await page.setViewportSize({width,height:960});
  for(const slug of ['', 'shmi/','it-academy/','projects/','olympiad-league/']) {
   const path='/year-courses/'+slug;
   const response=await page.goto(origin+path,{waitUntil:'networkidle'});
   assert.equal(response.status(),200,path);
   assert.equal(await page.locator('main h1').count(),1);
   for(const img of await page.locator('main img').all()) {
    await img.scrollIntoViewIfNeeded();
    await img.evaluate(el=>Promise.race([el.decode(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Image decode timeout')),10000))]));
   }
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
   assert.equal(overflow,false,`${width} ${path}: horizontal overflow`);
   assert.ok(await page.locator('main a[href="https://vk.com/brainmaster"]').count());
   checks.push({width,path,status:'passed'});
  }
  await page.goto(origin+'/year-courses/',{waitUntil:'networkidle'});
  const consent=page.getByRole('button',{name:'Только необходимое'});
  if(await consent.isVisible()) await consent.click();
  for(const img of await page.locator('main img').all()) {
   await img.scrollIntoViewIfNeeded();
   await img.evaluate(el=>el.decode());
  }
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await page.screenshot({path:`${output}/annual-${width}.png`,fullPage:true});
  await page.screenshot({path:`${output}/annual-top-${width}.png`});
 }
 await page.setViewportSize({width:1440,height:960});
 await page.goto(origin+'/year-courses/',{waitUntil:'networkidle'});
 await page.locator('.yc-card[href="/year-courses/shmi/"]').click();
 await page.waitForURL('**/year-courses/shmi/');
 await page.reload({waitUntil:'networkidle'});
 assert.match(await page.locator('h1').innerText(),/Школа/);
 await page.goBack({waitUntil:'networkidle'});
 assert.equal(new URL(page.url()).pathname,'/year-courses/');
 await page.getByText('А если ребёнок никогда не программировал?',{exact:true}).click();
 assert.ok(await page.locator('details').first().getAttribute('open')!==null);
 const video=page.locator('video');
 assert.equal(await video.getAttribute('preload'),'none');
 assert.equal(await video.getAttribute('autoplay'),null);
 await video.scrollIntoViewIfNeeded();
 await video.evaluate(async el=>{await Promise.race([el.play(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Video playback timeout')),15000))]);});
 await page.waitForFunction(()=>document.querySelector('video').currentTime>0.1);
 assert.equal(await video.evaluate(el=>el.error),null);
 await video.evaluate(el=>el.pause());
 await page.emulateMedia({reducedMotion:'reduce'});
 assert.equal(await page.locator('.yc-card').first().evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
 await page.locator('.yc-card').first().focus();
 await page.keyboard.press('Tab');
 await page.keyboard.press('Shift+Tab');
 assert.notEqual(await page.locator('.yc-card').first().evaluate(el=>getComputedStyle(el).outlineStyle),'none');
 checks.push({navigation:'card / reload / Back',video:'playback passed',keyboard:'card focus visible',reducedMotion:'passed'});
 // Shared hero smoke checks only, not a full booking acceptance.
 for(const path of ['/','/catalog/','/agenda/','/sites/','/legal/']) {
  const response=await page.goto(origin+path,{waitUntil:'domcontentloaded'});
  assert.equal(response.status(),200,path);
  await page.locator('main').waitFor({state:'visible',timeout:30000});
  await page.locator('main h1, main h2').first().waitFor({state:'visible',timeout:30000});
  checks.push({path,status:'HTTP 200 and rendered main content',h1Count:await page.locator('main h1').count()});
 }
 assert.deepEqual(errors,[],'Browser runtime errors');
 await writeFile(`${output}/results.json`,JSON.stringify({checks,errors},null,2)+'\n');
 console.log(JSON.stringify({passed:checks.length,output}));
} finally {await browser.close();}
