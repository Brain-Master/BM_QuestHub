import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {test} from 'node:test';
import {historical69,composeConfirmedSchools} from './lib/confirmed-school-source.mjs';
import {composeSchool37,school37BaseDigest,school37Identities} from './lib/school-37-source.mjs';
import {baseSourceDigest,composeSchool2103} from './lib/school-2103-source.mjs';
import {restorePublishedAnnual} from './lib/mos-annual-published.mjs';
import {refreshAnnualCards} from './lib/mos-annual-refresh.mjs';
import {isRetiredAnnualGroup} from '../apps/web/content/annual-retirements.mjs';
const root=new URL('../',import.meta.url).pathname;
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
// Admission/capacity are mutable. Historical migration hashes use frozen inputs,
// not today's portal facts; the current completed import is checked separately.
const historicalOffers=read('scripts/fixtures/annual-69-before-1517/offers.json');
const historicalRegistry=read('scripts/fixtures/annual-69-before-1517/registry.json');
const source=historical69(read('apps/web/content/year-schedule.generated.json'));
const addition=read('apps/web/content/annual-additions/school-37.json');
const ids=new Set(school37Identities.map(([id])=>id));
const base={...source,sourceSha256:school37BaseDigest,groups:source.groups.filter(g=>!ids.has(g.id)),locations:source.locations.filter(l=>l.id!=='LOC-012')};
test('school37 appends exact9 without changing previous60; original CSV chain reproduces69',()=>{
  assert.equal(base.groups.length,60);assert.equal(source.groups.length,69);
  assert.deepEqual(composeSchool37(base,addition),source);
  assert.deepEqual(source.groups.slice(0,60),base.groups);
  const prior=read('apps/web/content/annual-additions/school-2103.json');
  const oldIds=new Set(prior.groups.map(g=>g.groupCode));
  const csv={...base,sourceSha256:baseSourceDigest,groups:base.groups.filter(g=>!oldIds.has(g.id)),locations:base.locations.filter(l=>!['LOC-009','LOC-010'].includes(l.id))};
  assert.equal(csv.groups.length,51);assert.deepEqual(composeSchool2103(csv,prior),base);
  const r=spawnSync(process.execPath,[path.join(root,'scripts/compose-annual-additions.mjs')],{input:JSON.stringify(csv),encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);assert.deepEqual(JSON.parse(r.stdout),composeConfirmedSchools(source,read('apps/web/content/annual-additions/school-1212.json'),read('apps/web/content/annual-additions/school-937.json')));
  assert.ok(!source.locations.some(l=>l.id==='LOC-011'),'unconfirmed937 excluded');
  const previousOffers=structuredClone(historicalOffers.offersByQuest.shmi).filter(o=>!ids.has(o.annual?.groupCode));
  assert.equal(previousOffers.length,60);
  for(const o of previousOffers)delete o.annual.sourceSha256;
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(previousOffers)).digest('hex'),'9538bd0121aeb7ca4fc8974d08db3569e1fea98860729f1a9160b1b572e44458');
});
test('wrong preimage, duplicate code/card, listing, campus, times or invalid date fail closed',()=>{
  const badBase=structuredClone(base);badBase.groups[0].freeSeats=0;
  assert.throws(()=>composeSchool37(badBase,addition),/PREIMAGE/);
  for(const mutate of [
    a=>a.groups[1].groupCode=a.groups[0].groupCode,a=>a.groups[1].cardId=a.groups[0].cardId,
    a=>a.groups[0].listingId='1',a=>a.groups[0].locationId='LOC-011',
    a=>a.groups[0].address='Wrong building',a=>a.groups[0].organization='Other school',
    a=>a.groups[0].slots[0].weekday='Вторник',a=>a.groups[0].slots[0].start='13:15',
    a=>a.groups[0].courseStart='2026-02-30',a=>a.locations[0].id='LOC-011',
    a=>a.groups[0].freeSeats=13,a=>a.groups[0].refreshedAt='invalid',
  ]){const bad=structuredClone(addition);mutate(bad);assert.throws(()=>composeSchool37(base,bad));}
});
test('refresh uses all nine direct card identities; public teacher never replaces raw source teacher',async()=>{
  const r=historicalRegistry;
  const rows=historicalOffers.offersByQuest.shmi.filter(o=>ids.has(o.annual?.groupCode));
  const registry={...r,groups:Object.fromEntries([...ids].map(id=>[id,r.groups[id]])),expectedGroups:9,verifiedGroups:9,archivedGroups:0,ok:true,errors:[]};
  const mapping={asOf:source.asOf,venueByGroup:Object.fromEntries([...ids].map(id=>[id,'school-37-michurinsky-28'])),studyYearByGroup:Object.fromEntries(school37Identities.map(([id,,,,,year])=>[id,year]))};
  const newer=rows.map(o=>({...o,annual:{...o.annual,refreshedAt:'2026-09-23T12:00:00.000Z'}}));
  const restored=restorePublishedAnnual(registry,newer,mapping);
  const requests=[];
  const fresh=await refreshAnnualCards(restored,{fetchCard:async(cardId,expected)=>{
    requests.push([cardId,expected.groupCode]);return registry.groups[expected.groupCode];
  },now:()=> '2026-09-24T12:00:00.000Z',sourceGroups:Object.fromEntries(source.groups.filter(g=>ids.has(g.id)).map(g=>[g.id,g]))});
  assert.equal(fresh.ok,true);assert.equal(fresh.verifiedGroups,9);
  assert.deepEqual(requests.sort(),school37Identities.map(([code,card])=>[card,code]).sort());
  for(const g of Object.values(restored.groups))assert.equal(g.teacher,'Серегина Мария Владимировна');
  assert.equal(r.ok,false,'nine verified additions do not turn incomplete whole-registry sync green');
});
test('migration reruns are byte-idempotent and conflicting files reject before writes',t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'questhub37-migration-test-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  for(const rel of ['apps/web/content','apps/web/lib','apps/web/data','scripts/lib'])fs.cpSync(path.join(root,rel),path.join(dir,rel),{recursive:true});
  for(const rel of ['scripts/import-school-37.ts','scripts/integrate-year-schedule.ts','scripts/annual-publish-tier.mjs','apps/web/tsconfig.json'])fs.copyFileSync(path.join(root,rel),path.join(dir,rel));
  fs.symlinkSync(path.join(root,'apps/web/node_modules'),path.join(dir,'apps/web/node_modules'),'dir');
  fs.writeFileSync(path.join(dir,'apps/web/content/year-schedule.generated.json'),JSON.stringify(source,null,2)+'\n');
  fs.writeFileSync(path.join(dir,'apps/web/content/annual-mos-refresh.generated.json'),JSON.stringify(historicalRegistry,null,2)+'\n');
  fs.writeFileSync(path.join(dir,'apps/web/data/offers-snapshot.json'),JSON.stringify(historicalOffers,null,2)+'\n');
  const files=['content/year-schedule.generated.json','content/annual-mos-refresh.generated.json','data/offers-snapshot.json'];
  const bytes=()=>files.map(f=>fs.readFileSync(path.join(dir,'apps/web',f),'utf8'));
  const run=(action='--write')=>spawnSync(process.execPath,[path.join(root,'apps/web/node_modules/tsx/dist/cli.mjs'),'--tsconfig',path.join(dir,'apps/web/tsconfig.json'),path.join(dir,'scripts/import-school-37.ts'),action],{encoding:'utf8',cwd:dir});
  const original=bytes();assert.equal(run().status,0);assert.deepEqual(bytes(),original);
  const putOffers=value=>fs.writeFileSync(path.join(dir,'apps/web',files[2]),JSON.stringify(value,null,2)+'\n');
  const intermediate=JSON.parse(original[2]);
  intermediate.offersByQuest.shmi=intermediate.offersByQuest.shmi.filter(o=>!ids.has(o.annual?.groupCode));
  intermediate.generatedAt='2026-09-21T12:07:11.930Z';
  const oldRegistry=JSON.parse(original[1]);oldRegistry.sourceSha256=school37BaseDigest;oldRegistry.expectedGroups=60;
  for(const id of ids)delete oldRegistry.groups[id];
  const oldOffers=structuredClone(intermediate);
  for(const row of oldOffers.offersByQuest.shmi)row.annual.sourceSha256=school37BaseDigest;
  [base,oldRegistry,oldOffers].forEach((v,i)=>fs.writeFileSync(path.join(dir,'apps/web',files[i]),JSON.stringify(v,null,2)+'\n'));
  const first=run();assert.equal(first.status,0,first.stderr);assert.match(first.stdout,/"alreadyImported":false/);
  const firstBytes=bytes();
  for(let i=0;i<2;i++){const r=run();assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/"needsCompilation":true/);assert.deepEqual(bytes(),firstBytes);}
  const compiled=spawnSync(process.execPath,[path.join(root,'apps/web/node_modules/tsx/dist/cli.mjs'),'--tsconfig',path.join(dir,'apps/web/tsconfig.json'),path.join(dir,'scripts/integrate-year-schedule.ts'),'--write'],{encoding:'utf8',cwd:dir});
  const expectedAfterCompilation=JSON.parse(original[2]);
  for(const rows of Object.values(expectedAfterCompilation.offersByQuest))for(const row of rows)
    if(isRetiredAnnualGroup(row))row.scheduleCard.isArchived=true;
  // Historical input remains immutable; current compiler applies today's owner rule.
  for(const row of expectedAfterCompilation.offersByQuest.shmi)if(row.venueSlug.startsWith('school-1212-')){
    row.annual={sourceTitle:row.annual.sourceTitle,studyYear:1,...row.annual};
    row.shiftLabel='ШМИ · 1-й год';row.scheduleCard.displayTitle='ШМИ · 1-й год';
  }
  assert.equal(compiled.status,0,compiled.stderr);
  assert.deepEqual(bytes(),[original[0],original[1],JSON.stringify(expectedAfterCompilation,null,2)+'\n']);
  assert.equal(run().status,0);
  putOffers(intermediate);
  const paused=bytes();
  for(let i=0;i<2;i++){const r=run();assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/"needsCompilation":true/);assert.deepEqual(bytes(),paused);}
  for(const mutate of [
    g=>g.lessonPrice=1,
    g=>g.slots=[{weekday:'Вторник',start:'13:15',end:'14:00'}],
    g=>g.teacher='Unreviewed teacher',
    g=>g.freeSeats=0,
  ]){
    const changed=JSON.parse(paused[1]);mutate(changed.groups['К2763-26']);
    fs.writeFileSync(path.join(dir,'apps/web',files[1]),JSON.stringify(changed,null,2)+'\n');
    const before=bytes();
    for(const action of ['--check','--write']){
      const r=run(action);assert.notEqual(r.status,0);assert.match(r.stderr,/INTERMEDIATE_CARD_CHANGED/);assert.deepEqual(bytes(),before);
    }
  }
  fs.writeFileSync(path.join(dir,'apps/web',files[1]),paused[1]);
  intermediate.offersByQuest.shmi[0].annual.freeSeats=0;putOffers(intermediate);
  const damaged=bytes();assert.notEqual(run().status,0);assert.deepEqual(bytes(),damaged);
  const retained=JSON.parse(original[2]);
  retained.offersByQuest.shmi.push({...structuredClone(retained.offersByQuest.shmi[0]),id:'year:another-reviewed-source'});
  putOffers(retained);const beforeExtra=bytes();
  assert.equal(run().status,0);assert.deepEqual(bytes(),beforeExtra);
  retained.offersByQuest.shmi.at(-1).annual.sourceSha256='0'.repeat(64);putOffers(retained);
  const incompatible=bytes();assert.notEqual(run().status,0);assert.deepEqual(bytes(),incompatible);
  for(const [index,mutate] of [
    [0,s=>s.groups[0].lessonPrice=1],
    [1,s=>s.sourceSha256='0'.repeat(64)],
    [2,s=>s.offersByQuest.shmi[0].annual.sourceSha256='0'.repeat(64)],
    [2,s=>s.offersByQuest.shmi.pop()],
    [2,s=>s.offersByQuest.shmi.push(structuredClone(s.offersByQuest.shmi[0]))],
  ]){
    original.forEach((b,i)=>fs.writeFileSync(path.join(dir,'apps/web',files[i]),b));
    const data=JSON.parse(original[index]);mutate(data);fs.writeFileSync(path.join(dir,'apps/web',files[index]),JSON.stringify(data));
    const before=bytes();assert.notEqual(run().status,0);assert.deepEqual(bytes(),before);
  }
});
test('historical fixtures retain exact pre-refresh bytes; current complete import still validates after refresh',()=>{
  for(const [file,hash] of [
    ['registry','854b6cb411a2a42908a6ca6e5f470830fbdba25da72affae8d19be10e182d392'],
    ['offers','6ef0df9c9f25b81f15be22c35a1b721bc77c2abe78b861672d6ea51d820e9d26'],
  ])assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,`scripts/fixtures/annual-69-before-1517/${file}.json`))).digest('hex'),hash);
  const r=spawnSync(process.execPath,[path.join(root,'apps/web/node_modules/tsx/dist/cli.mjs'),'--tsconfig',path.join(root,'apps/web/tsconfig.json'),path.join(root,'scripts/import-confirmed-school-groups.ts'),'--check'],{cwd:root,encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/"alreadyImported":true/);
});
