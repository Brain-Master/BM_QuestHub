import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {test} from 'node:test';
import {composeConfirmedSchools,historical69,newConfirmedIds} from './lib/confirmed-school-source.mjs';
import {restorePublishedAnnual} from './lib/mos-annual-published.mjs';
import {refreshAnnualCards} from './lib/mos-annual-refresh.mjs';
const root=new URL('../',import.meta.url).pathname;
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const source=read('apps/web/content/year-schedule.generated.json');
const a=read('apps/web/content/annual-additions/school-1212.json'),b=read('apps/web/content/annual-additions/school-937.json');
test('append five, retain all69 raw records, replay deterministic source and no private fields',()=>{
 const base=historical69(source),composed=composeConfirmedSchools(base,a,b);
 assert.equal(composed.groups.length,74);assert.equal(composed.locations.length,12);
 assert.deepEqual(composed,source);assert.deepEqual(composed.groups.slice(0,69),base.groups);
 assert.deepEqual(composed.groups.slice(69).map(g=>g.id),newConfirmedIds);
 assert.doesNotMatch(JSON.stringify([a,b,composed]),/max\.ru\/join|ФИО ученика|ФИО заявителя|903.?562.?71.?77/);
 for(const mutate of [x=>x.groups[0].cardId='985956',x=>x.groups[0].listingId='2533899',x=>x.groups[0].locationId='LOC-004',x=>x.groups[0].slots[0].start='14:00',x=>x.groups[0].freeSeats=21,x=>x.groups[0].phone='SYNTHETIC-PRIVATE',x=>x.groups[1].groupCode=x.groups[0].groupCode]){
  const bad=structuredClone(a);mutate(bad);assert.throws(()=>composeConfirmedSchools(base,bad,b));
 }
 const bad=structuredClone(base);bad.groups[0].freeSeats=0;assert.throws(()=>composeConfirmedSchools(bad,a,b),/PREIMAGE/);
});
test('public age override never becomes raw portal age on restoration and refresh',async()=>{
 const registry=read('apps/web/content/annual-mos-refresh.generated.json');
 const offers=read('apps/web/data/offers-snapshot.json').offersByQuest.shmi.filter(o=>o.venueSlug==='school-937-marshala-zakharova-25');
 for(const o of offers)o.annual.refreshedAt='2026-09-24T12:00:00.000Z';
 const mapping={asOf:source.asOf,venueByGroup:Object.fromEntries(offers.map(o=>[o.annual.groupCode,o.venueSlug])),studyYearByGroup:Object.fromEntries(offers.map(o=>[o.annual.groupCode,2]))};
 const restored=restorePublishedAnnual(registry,offers,mapping);
 const ids=offers.map(o=>o.annual.groupCode);
 for(const id of ids){assert.equal(restored.groups[id].ageMax,18);assert.equal(restored.groups[id].teacher,'Балукова Мария Михайловна');}
 const subset={...restored,expectedGroups:4,verifiedGroups:4,archivedGroups:0,ok:true,errors:[],groups:Object.fromEntries(ids.map(id=>[id,restored.groups[id]]))};
 const refreshed=await refreshAnnualCards(subset,{fetchCard:async(_id,expected)=>subset.groups[expected.groupCode],now:()=> '2026-09-25T12:00:00.000Z'});
 assert.equal(refreshed.ok,true);for(const g of Object.values(refreshed.groups))assert.equal(g.ageMax,18);
});
test('completed migration reruns are byte stable and corrupt revisions fail without writes',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'questhub-confirmed-test-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 for(const p of ['apps/web/content','apps/web/lib','apps/web/data','scripts/lib'])fs.cpSync(path.join(root,p),path.join(dir,p),{recursive:true});
 for(const p of ['apps/web/tsconfig.json','scripts/import-confirmed-school-groups.ts'])fs.copyFileSync(path.join(root,p),path.join(dir,p));
 fs.symlinkSync(path.join(root,'apps/web/node_modules'),path.join(dir,'apps/web/node_modules'),'dir');
 const files=['content/year-schedule.generated.json','content/annual-mos-refresh.generated.json','data/offers-snapshot.json'];
 const bytes=()=>files.map(p=>fs.readFileSync(path.join(dir,'apps/web',p),'utf8'));
 const run=action=>spawnSync(process.execPath,[path.join(root,'apps/web/node_modules/tsx/dist/cli.mjs'),'--tsconfig',path.join(dir,'apps/web/tsconfig.json'),path.join(dir,'scripts/import-confirmed-school-groups.ts'),action],{cwd:dir,encoding:'utf8'});
 const before=bytes();for(const action of ['--check','--write','--check']){const r=run(action);assert.equal(r.status,0,r.stderr);assert.deepEqual(bytes(),before);}
 const registry=JSON.parse(before[1]);registry.sourceSha256='0'.repeat(64);
 fs.writeFileSync(path.join(dir,'apps/web',files[1]),JSON.stringify(registry));const corrupt=bytes();
 for(const action of ['--write','--check']){assert.notEqual(run(action).status,0);assert.deepEqual(bytes(),corrupt);}
});
