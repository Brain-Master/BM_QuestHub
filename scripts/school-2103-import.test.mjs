import assert from 'node:assert/strict';
import fs from 'node:fs';
import {test} from 'node:test';
import {spawnSync} from 'node:child_process';
import {composeSchool2103,baseSourceDigest} from './lib/school-2103-source.mjs';
import {restorePublishedAnnual} from './lib/mos-annual-published.mjs';
import {refreshAnnualCards} from './lib/mos-annual-refresh.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const source=read('../apps/web/content/year-schedule.generated.json');
const addition=read('../apps/web/content/annual-additions/school-2103.json');
const addedIds=new Set(addition.groups.map(g=>g.groupCode));
const base={...source,sourceSha256:baseSourceDigest,groups:source.groups.filter(g=>!addedIds.has(g.id)),locations:source.locations.filter(l=>!['LOC-009','LOC-010'].includes(l.id))};
test('shared composition preserves original51 exactly and the CSV stdin entry produces the same60',()=>{
  assert.deepEqual(composeSchool2103(base,addition),source);
  assert.deepEqual(source.groups.slice(0,51),base.groups);assert.equal(base.groups.length,51);
  const r=spawnSync(process.execPath,[new URL('./compose-school-2103.mjs',import.meta.url).pathname],{input:JSON.stringify(base),encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);assert.deepEqual(JSON.parse(r.stdout),source);
});
test('conflicting base, duplicate identities, wrong cards and wrong addresses are rejected',()=>{
  const altered=structuredClone(base);altered.groups[0].lessonPrice=1;
  assert.throws(()=>composeSchool2103(altered,addition),/PREIMAGE/);
  for(const mutate of [
    a=>a.groups[0].cardId='123',a=>a.groups[1].groupCode=a.groups[0].groupCode,
    a=>a.groups[0].address=a.groups[2].address,a=>a.groups[0].listingId='123',
    a=>a.locations[0].address='Wrong campus',a=>a.groups[0].organization='Other school',
  ]){const bad=structuredClone(addition);mutate(bad);assert.throws(()=>composeSchool2103(base,bad));}
});
test('published owner price never becomes raw mos price after restoration or failed refresh',async()=>{
  const full=read('../apps/web/content/annual-mos-refresh.generated.json');
  const id='К3015-26',row=read('../apps/web/data/offers-snapshot.json').offersByQuest.shmi.find(o=>o.id===`year:${id}`);
  const registry={...full,expectedGroups:1,verifiedGroups:1,ok:true,groups:{[id]:full.groups[id]},errors:[]};
  const mapping={asOf:source.asOf,venueByGroup:{[id]:row.venueSlug},studyYearByGroup:{[id]:1}};
  for(const rawPrice of [888,null]){
    const newer=structuredClone(row);newer.annual.refreshedAt='2026-09-22T12:00:00.000Z';newer.annual.sourceLessonPrice=rawPrice;
    const restored=restorePublishedAnnual(registry,[newer],mapping);
    assert.equal(restored.groups[id].lessonPrice,rawPrice);
    const failed=await refreshAnnualCards(restored,{fetchCard:async()=>{throw Error('MOS_TIMEOUT')},now:()=> '2026-09-23T12:00:00.000Z'});
    assert.equal(failed.groups[id].lessonPrice,rawPrice);assert.equal(failed.groups[id].refreshedAt,newer.annual.refreshedAt);
    const fresh=await refreshAnnualCards(restored,{fetchCard:async()=>({...full.groups[id],lessonPrice:888}),now:()=> '2026-09-23T12:00:00.000Z'});
    assert.equal(fresh.groups[id].lessonPrice,888);assert.equal(fresh.ok,true);
  }
  const broken=structuredClone(row);broken.annual.refreshedAt='2026-09-22T12:00:00.000Z';delete broken.annual.sourceLessonPrice;
  assert.throws(()=>restorePublishedAnnual(registry,[broken],mapping),/SOURCE_PRICE_MISSING/);
});
