import fs from 'node:fs';import assert from 'node:assert/strict';import {test} from 'node:test';import {createRequire} from 'node:module';
import {composeSchool1539,school1539Base,school1539Identities} from './lib/school-1539-source.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const source=read('apps/web/content/year-schedule.generated.json'),addition=read('apps/web/content/annual-additions/school-1539.json'),registry=read('apps/web/content/annual-mos-refresh.generated.json'),snapshot=read('apps/web/data/offers-snapshot.json');
const codes=new Set(school1539Identities.map(r=>r[0]));
const base={...source,sourceSha256:school1539Base,locations:source.locations.filter(l=>l.id!=='LOC-014'),groups:source.groups.filter(g=>!codes.has(g.id))};
test('school1539 transition appends four exact groups and preserves all previous source records',()=>{assert.equal(base.groups.length,94);assert.deepEqual(composeSchool1539(base,addition),source);assert.equal(source.groups.length,98);assert.deepEqual(source.groups.slice(0,94),base.groups);assert.deepEqual(source.locations.slice(0,-1),base.locations);});
test('school1539 rejects wrong building, duplicate identity, altered duration/price/admission or private fields',()=>{
 for(const mutate of [a=>a.groups[0].cardId='1099232',a=>a.groups.push(a.groups[0]),a=>a.locations[0].address='Новомосковская, 7',a=>a.groups[0].slots[0].end='15:30',a=>a.groups[0].lessonPrice=900,a=>a.groups[3].admissionEnd='2027-02-28',a=>a.groups[0].phone='private',a=>a.ownerTeacher='Other']){const a=structuredClone(addition);mutate(a);assert.throws(()=>composeSchool1539(base,a));}
 const bad=structuredClone(base);bad.groups[0].freeSeats=0;assert.throws(()=>composeSchool1539(bad,addition));assert.throws(()=>composeSchool1539(source,addition));
});
test('four new MOS runtime bindings verify; outdated registry does not silently accept them',async()=>{
 process.env.TSX_TSCONFIG_PATH=new URL('../apps/web/tsconfig.json',import.meta.url).pathname;const req=createRequire(new URL('./package.json',import.meta.url));const tsRequire=req('tsx/cjs/api').require;const {refreshMosAvailability}=tsRequire('./lib/mos-live-capacity.ts',import.meta.url);
 const rows=Object.values(snapshot.offersByQuest).flat().filter(o=>codes.has(o.annual?.groupCode));const subset={...snapshot,offersByQuest:{shmi:rows}};let calls=0;
 const out=await refreshMosAvailability(subset,registry.groups,undefined,{now:()=>new Date('2026-11-18T10:00:00Z'),fetchCard:async id=>{calls++;return Object.values(registry.groups).find(c=>c.cardId===id);}});assert.equal(calls,4);assert.equal(out.verified,4);assert.deepEqual(out.errors,[]);
 const old=Object.fromEntries(Object.entries(registry.groups).filter(([code])=>!codes.has(code)));const bad=await refreshMosAvailability(subset,old,undefined,{fetchCard:async()=>{throw Error('unexpected')}});assert.equal(bad.errors.length,4);assert.ok(bad.errors.every(e=>e.code==='MOS_IDENTITY_REVIEW_REQUIRED'));
});
