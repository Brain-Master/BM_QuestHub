import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function fixture(t){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'questhub-annual-refresh-test-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  for(const rel of ['apps/web/lib','apps/web/content','apps/web/data'])fs.cpSync(path.join(repo,rel),path.join(dir,rel),{recursive:true});
  fs.mkdirSync(path.join(dir,'scripts'));
  fs.mkdirSync(path.join(dir,'scripts/lib'));
  fs.copyFileSync(path.join(repo,'scripts/lib/mos-annual-published.mjs'),path.join(dir,'scripts/lib/mos-annual-published.mjs'));
  for(const rel of ['apps/web/tsconfig.json','scripts/integrate-year-schedule.ts','scripts/annual-publish-tier.mjs'])fs.copyFileSync(path.join(repo,rel),path.join(dir,rel));
  fs.symlinkSync(path.join(repo,'apps/web/node_modules'),path.join(dir,'apps/web/node_modules'),'dir');
  const file=key=>path.join(dir,'apps/web/data',key);
  const read=key=>JSON.parse(fs.readFileSync(file(key),'utf8'));
  const write=(key,value)=>fs.writeFileSync(file(key),JSON.stringify(value,null,2)+'\n');
  const contents=()=>Object.fromEntries(fs.readdirSync(path.join(dir,'apps/web/data'),{recursive:true}).filter(k=>k.endsWith('.json')).map(k=>[k,fs.readFileSync(file(k),'utf8')]));
  const compile=(tier,check=false,backup)=>spawnSync(process.execPath,[path.join(repo,'apps/web/node_modules/tsx/dist/cli.mjs'),'--tsconfig',path.join(dir,'apps/web/tsconfig.json'),path.join(dir,'scripts/integrate-year-schedule.ts'),check?'--check':'--write',`--tier=${tier}`,...(backup?[`--restore-missing-venue-context=${backup}`]:[])],{encoding:'utf8',cwd:dir});
  return{read,write,contents,compile,dir};
}
test('undefined profile fields preserve existing context; explicit recovery restores only missing matching campus fields',t=>{
  const f=fixture(t),map=f.read('v2/map-snapshot.json');
  const id='mduc-ekt-odesskaya',v=map.venues.find(v=>v.slug===id);v.metro='Сохранённое метро';v.district='Сохранённый район';v.entranceNote='Заменяемое описание входа';
  const baseline=structuredClone(map),backup=path.join(f.dir,'baseline.json');fs.writeFileSync(backup,JSON.stringify(baseline));f.write('v2/map-snapshot.json',map);
  const r=f.compile('cold');assert.equal(r.status,0,r.stderr);
  const after=f.read('v2/map-snapshot.json').venues.find(v=>v.slug===id);assert.equal(after.metro,v.metro);assert.equal(after.district,v.district);
  const damaged=f.read('v2/map-snapshot.json');const target=damaged.venues.find(v=>v.slug===id);delete target.district;target.metro='Новое подтверждённое метро';f.write('v2/map-snapshot.json',damaged);
  const before=f.contents(),repaired=f.compile('cold',false,backup);assert.equal(repaired.status,0,repaired.stderr);
  const restored=f.read('v2/map-snapshot.json').venues.find(v=>v.slug===id);assert.equal(restored.district,'Сохранённый район');assert.equal(restored.metro,'Новое подтверждённое метро');
  assert.equal(f.contents()['offers-snapshot.json'],before['offers-snapshot.json']);
  assert.deepEqual({...restored,district:undefined},{...target,district:undefined});
  assert.notEqual(f.compile('hot',false,backup).status,0);
});
test('owner teacher assignments survive later portal refresh facts and repeated compilation',t=>{
 const f=fixture(t),hot=f.read('offers-snapshot.json');
 const rows=hot.offersByQuest.shmi.filter(o=>o.venueSlug.startsWith('school-1212-'));
 assert.equal(rows.length,6);
 for(const row of rows){row.annual.teacher='Portal placeholder';row.scheduleCard.teacherName='Portal placeholder';row.annual.refreshedAt='2026-09-10T12:00:00.000Z';}
 f.write('offers-snapshot.json',hot);
 for(let i=0;i<2;i++){const r=f.compile('hot');assert.equal(r.status,0,r.stderr);for(const row of f.read('offers-snapshot.json').offersByQuest.shmi.filter(o=>o.venueSlug.startsWith('school-1212-'))){assert.equal(row.annual.teacher,'Толмачева Василиса Владимировна');assert.equal(row.scheduleCard.teacherName,row.annual.teacher);assert.equal(row.annual.refreshedAt,'2026-09-10T12:00:00.000Z');}}
});
test('real hot compiler preserves updated/deleted legacy rows, new annual IDs and newer refresh time; never writes cold',t=>{
  const f=fixture(t),hot=f.read('offers-snapshot.json');
  const [legacy]=Object.keys(hot.offersByQuest).filter(k=>k!=='shmi');
  hot.offersByQuest[legacy]=hot.offersByQuest[legacy].slice(1);
  hot.offersByQuest[legacy][0].priceLabel='Обновлённая стоимость';
  const extra={...structuredClone(hot.offersByQuest.shmi[0]),id:'year:another-reviewed-source'};
  hot.offersByQuest.shmi=[extra]; // Sheets refresh no longer contains the 51 CSV rows.
  hot.generatedAt='2026-09-10T12:00:00.000Z';f.write('offers-snapshot.json',hot);
  const before=f.contents(),r=f.compile('hot');assert.equal(r.status,0,r.stderr);
  const after=f.read('offers-snapshot.json');
  assert.deepEqual(after.offersByQuest[legacy],hot.offersByQuest[legacy]);
  assert.equal(after.generatedAt,hot.generatedAt);
  assert.deepEqual(after.offersByQuest.shmi.find(o=>o.id===extra.id),extra);
  assert.equal(after.offersByQuest.shmi.length,52);
  for(const [key,bytes] of Object.entries(before))if(key!=='offers-snapshot.json')assert.equal(f.contents()[key],bytes,key);
  const frozen=f.contents();assert.equal(f.compile('hot').status,0);assert.deepEqual(f.contents(),frozen);assert.equal(f.compile('hot',true).status,0);
});
test('real cold compiler restores annual catalogue after refresh, keeps each newer timestamp, and leaves hot byte-identical',t=>{
  const f=fixture(t),catalog=f.read('v2/catalog-snapshot.json'),map=f.read('v2/map-snapshot.json'),manifest=f.read('v2/site-manifest.json');
  catalog.courses=catalog.courses.filter(c=>!['shmi','it-academy','projects','olympiad-league'].includes(c.slug));
  catalog.worlds=catalog.worlds.filter(w=>w.slug!=='brainmaster-engineering');
  map.venues=map.venues.filter(v=>!v.slug.includes('school-2044'));
  catalog.generatedAt='2026-09-11T11:00:00.000Z';map.generatedAt='2026-09-12T12:00:00.000Z';manifest.generatedAt='2026-09-13T13:00:00.000Z';
  catalog.courses[0].tagline='Обновлённое описание';
  f.write('v2/catalog-snapshot.json',catalog);f.write('v2/map-snapshot.json',map);f.write('v2/site-manifest.json',manifest);
  const before=f.contents(),r=f.compile('cold');assert.equal(r.status,0,r.stderr);
  assert.equal(f.contents()['offers-snapshot.json'],before['offers-snapshot.json']);
  assert.deepEqual(f.read('v2/catalog-snapshot.json').courses[0],catalog.courses[0]);
  assert.equal(f.read('v2/catalog-snapshot.json').courses.length,9);
  assert.equal(f.read('v2/map-snapshot.json').venues.length,16);
  assert.equal(f.read('v2/catalog-snapshot.json').generatedAt,catalog.generatedAt);
  assert.equal(f.read('v2/map-snapshot.json').generatedAt,map.generatedAt);
  assert.equal(f.read('v2/site-manifest.json').generatedAt,manifest.generatedAt);
  const frozen=f.contents();assert.equal(f.compile('cold').status,0);assert.deepEqual(f.contents(),frozen);assert.equal(f.compile('cold',true).status,0);
});
test('newer or conflicting owned annual revisions fail before any output write',t=>{
  const f=fixture(t);
  for(const revision of ['newer','conflict']){
    const hot=f.read('offers-snapshot.json');
    hot.offersByQuest.shmi[0].annual.asOf=revision==='newer'?'2026-09-10':'2026-09-08';
    if(revision==='conflict')hot.offersByQuest.shmi[0].annual.sourceSha256='a'.repeat(64);
    f.write('offers-snapshot.json',hot);const before=f.contents();const r=f.compile('hot');
    assert.notEqual(r.status,0);assert.match(r.stderr,/Newer or conflicting annual source revision/);assert.deepEqual(f.contents(),before);
  }
});

test('direct compiler preserves newer same-source card facts and refuses a moved venue',t=>{
  const f=fixture(t),hot=f.read('offers-snapshot.json');
  const row=hot.offersByQuest.shmi.find(o=>o.annual.refreshedAt);
  row.annual.refreshedAt='2026-09-10T12:00:00.000Z';
  row.annual.lessonPrice=1234;row.annual.freeSeats=0;row.annual.admission='closed';
  f.write('offers-snapshot.json',hot);
  const r=f.compile('hot');assert.equal(r.status,0,r.stderr);
  const after=f.read('offers-snapshot.json').offersByQuest.shmi.find(o=>o.id===row.id);
  assert.equal(after.annual.lessonPrice,1234);assert.equal(after.annual.freeSeats,0);assert.equal(after.annual.refreshedAt,row.annual.refreshedAt);
  assert.equal(after.annual.admission,'closed');assert.equal(after.priceLabel,'1234 ₽ / занятие');
  const unknown=f.read('offers-snapshot.json');unknown.offersByQuest.shmi.find(o=>o.id===row.id).annual.lessonPrice=null;
  f.write('offers-snapshot.json',unknown);const nullResult=f.compile('hot');assert.equal(nullResult.status,0,nullResult.stderr);
  const nullRow=f.read('offers-snapshot.json').offersByQuest.shmi.find(o=>o.id===row.id);
  assert.equal(nullRow.annual.lessonPrice,null);assert.equal(nullRow.priceLabel,'Стоимость уточняется');
  assert.equal(nullRow.annual.refreshedAt,row.annual.refreshedAt);
  const moved=f.read('offers-snapshot.json');moved.offersByQuest.shmi.find(o=>o.id===row.id).venueSlug='school-2044-dmitrovskoe-169b';
  f.write('offers-snapshot.json',moved);const before=f.contents();
  const fail=f.compile('hot');assert.notEqual(fail.status,0);assert.match(fail.stderr,/VENUE_MISMATCH/);assert.deepEqual(f.contents(),before);
});

test('unknown annual IDs with an incompatible revision fail before any output write',t=>{
  const f=fixture(t),hot=f.read('offers-snapshot.json');
  const extra={...structuredClone(hot.offersByQuest.shmi[0]),id:'year:new-source-not-yet-compatible'};
  extra.annual.asOf='2026-09-10';hot.offersByQuest.shmi.push(extra);
  f.write('offers-snapshot.json',hot);const before=f.contents();const r=f.compile('hot');
  assert.notEqual(r.status,0);assert.match(r.stderr,/Mixed annual source revisions/);assert.deepEqual(f.contents(),before);
});
