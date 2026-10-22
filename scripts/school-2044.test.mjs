import fs from 'node:fs';import assert from 'node:assert/strict';import {test} from 'node:test';import {createRequire} from 'node:module';
import {composeSchool2044,school2044Identities} from './lib/school-2044-source.mjs';
import {isRetiredAnnualGroup} from '../apps/web/content/annual-retirements.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const base=read('scripts/fixtures/annual-89-before-2044/source.json'),addition=read('apps/web/content/annual-additions/school-2044.json');
const source=read('apps/web/content/year-schedule.generated.json'),registry=read('apps/web/content/annual-mos-refresh.generated.json'),snapshot=read('apps/web/data/offers-snapshot.json');
const all=Object.values(snapshot.offersByQuest).flat();const codes=new Set(school2044Identities.map(r=>r[0]));
test('append five exact groups and one campus; historical source and identities stay immutable',()=>{
 const out=composeSchool2044(base,addition);assert.deepEqual(out,source);assert.equal(out.groups.length,94);assert.deepEqual(out.groups.slice(0,89),base.groups);assert.deepEqual(out.locations.slice(0,-1),base.locations);
 assert.equal(out.groups.filter(g=>!isRetiredAnnualGroup(g)).length,72);assert.equal(registry.expectedGroups,94);assert.equal(Object.keys(registry.groups).length,86);assert.equal(registry.ok,false);
});
test('identity, private fields, wrong campus and schedule are rejected',()=>{
 for(const mutate of [a=>a.groups[0].cardId='1076242',a=>a.groups[0].listingId='2589338',a=>a.groups[0].slots[0].start='14:00',a=>a.groups[0].locationId='LOC-008',a=>a.groups[0].organization='Other school',a=>a.groups[0].phone='PRIVATE',a=>a.groups[0].freeSeats=13,a=>a.locations[0].address='Other campus',a=>a.ownerTeacher='Other teacher']){const a=structuredClone(addition);mutate(a);assert.throws(()=>composeSchool2044(base,a));}
 const b=structuredClone(base);b.groups[0].freeSeats=0;assert.throws(()=>composeSchool2044(b,addition));
});
test('public projection uses owner teacher but registry preserves portal provenance; cancelled camp does not remove annual campus',()=>{
 const rows=all.filter(o=>codes.has(o.annual?.groupCode));assert.equal(rows.length,5);assert.equal(all.length,134);
 const camp=all.find(o=>o.id==='autumn-2026-2044-dolgoprudnaya-16');assert.equal(camp,undefined);
 for(const [code,card,listing,hour,min,max] of school2044Identities){const o=rows.find(o=>o.annual.groupCode===code);assert.equal(o.venueSlug,'autumn-2026-2044-dolgoprudnaya-16-venue');assert.equal(o.mosBookingUrl,'https://www.mos.ru/pgu2/activity/card/'+card);assert.equal(o.startTime,hour+':00');assert.equal(o.annual.listingId,listing);assert.equal(o.annual.teacher,'Локтеева Ирина Дмитриевна');assert.equal(o.annual.teacherSourceConflict,true);assert.equal(o.annual.studyYear,1);assert.equal(o.annual.ageMin,min);assert.equal(o.annual.ageMax,max);assert.equal(o.annual.lessonPrice,1000);assert.equal(o.annual.coursePrice,32000);assert.equal(registry.groups[code].teacher,'Киселёв Александр Вячеславович');assert.match(registry.groups[code].title,/Халаджан/);assert.equal(o.annual.sourceSha256,source.sourceSha256);}
 assert.equal(all.reduce((n,o)=>n+(o.annual?.legacyReservation?.places??0),0),51);
 const venues=read('apps/web/data/v2/map-snapshot.json').venues;const matching=venues.filter(v=>v.address==='Долгопрудная аллея, 16');assert.equal(matching.length,1);assert.equal(matching[0].preliminaryVenue,undefined);assert.equal(matching[0].listedOnSites,true);assert.equal(matching[0].latitude,undefined);assert.deepEqual(matching[0].photos,[]);
});
test('five new registry bindings are fetchable; embedded old registry fails closed',async()=>{
 process.env.TSX_TSCONFIG_PATH=new URL('../apps/web/tsconfig.json',import.meta.url).pathname;const req=createRequire(new URL('./package.json',import.meta.url));const tsRequire=req('tsx/cjs/api').require;const {refreshMosAvailability}=tsRequire('./lib/mos-live-capacity.ts',import.meta.url);
 const subset={...snapshot,offersByQuest:{shmi:all.filter(o=>codes.has(o.annual?.groupCode))}};let calls=0;
 const out=await refreshMosAvailability(subset,registry.groups,undefined,{now:()=>new Date('2026-10-10T21:00:00Z'),fetchCard:async id=>{calls++;return Object.values(registry.groups).find(c=>c.cardId===id);}});assert.equal(calls,5);assert.equal(out.verified,5);assert.deepEqual(out.errors,[]);
 const old=Object.fromEntries(Object.entries(registry.groups).filter(([code])=>!codes.has(code)));const bad=await refreshMosAvailability(subset,old,undefined,{fetchCard:async()=>{throw Error('unexpected')}});assert.equal(bad.errors.length,5);assert.ok(bad.errors.every(e=>e.code==='MOS_IDENTITY_REVIEW_REQUIRED'));
});
test('ordered camp/annual cycles retain promoted campus and rebuild it when missing',async t=>{
 const {default:os}=await import('node:os');const {default:path}=await import('node:path');const {spawnSync}=await import('node:child_process');const root=new URL('../',import.meta.url).pathname;
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'questhub2044-cycle-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 for(const p of ['apps/web/content','apps/web/lib','apps/web/data','scripts/lib'])fs.cpSync(path.join(root,p),path.join(dir,p),{recursive:true});
 for(const p of ['scripts/integrate-autumn-camps.ts','scripts/integrate-year-schedule.ts','scripts/integrate-local-annual.ts','scripts/annual-publish-tier.mjs','apps/web/tsconfig.json'])fs.copyFileSync(path.join(root,p),path.join(dir,p));
 fs.mkdirSync(path.join(dir,'apps/lead-service'),{recursive:true});fs.copyFileSync(path.join(root,'apps/lead-service/local-groups.json'),path.join(dir,'apps/lead-service/local-groups.json'));
 fs.symlinkSync(path.join(root,'apps/web/node_modules'),path.join(dir,'apps/web/node_modules'),'dir');
 const run=(file,action='--write')=>{const r=spawnSync(process.execPath,[path.join(root,'apps/web/node_modules/tsx/dist/cli.mjs'),'--tsconfig',path.join(dir,'apps/web/tsconfig.json'),path.join(dir,'scripts',file),action],{cwd:dir,encoding:'utf8'});assert.equal(r.status,0,r.stderr);};
 const paths=['offers-snapshot.json','v2/map-snapshot.json','v2/site-manifest.json'];const bytes=()=>paths.map(p=>fs.readFileSync(path.join(dir,'apps/web/data',p),'utf8'));const before=bytes();
 for(let i=0;i<2;i++){run('integrate-autumn-camps.ts');run('integrate-year-schedule.ts');assert.deepEqual(bytes(),before);}
 const mapPath=path.join(dir,'apps/web/data/v2/map-snapshot.json'),map=JSON.parse(fs.readFileSync(mapPath));map.venues=map.venues.filter(v=>v.slug!=='autumn-2026-2044-dolgoprudnaya-16-venue');fs.writeFileSync(mapPath,JSON.stringify(map));
 run('integrate-autumn-camps.ts');run('integrate-year-schedule.ts');assert.deepEqual(bytes(),before);run('integrate-autumn-camps.ts','--check');run('integrate-year-schedule.ts','--check');
});
