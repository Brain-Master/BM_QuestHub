import assert from 'node:assert/strict';import {test} from 'node:test';import fs from 'node:fs';import {questSchema,venueSchema,worldSchema} from '../schemas';import {buildAgendaItems} from './agenda';import {campMatches,campNeedsClarification,campSteps,campPresentation,campChoiceCount} from './camp-finder';
const read=(p:string)=>JSON.parse(fs.readFileSync('data/'+p,'utf8'));const cat=read('v2/catalog-snapshot.json'),snapshot=read('offers-snapshot.json');const quests=questSchema.array().parse(cat.courses.map((q:{slug:string})=>({...q,offers:snapshot.offersByQuest[q.slug]??[]})));const venues=venueSchema.array().parse(read('v2/map-snapshot.json').venues);const items=buildAgendaItems({quests,venues,worlds:worldSchema.array().parse(cat.worlds)}).filter(i=>i.quest.format!=='year');const base={school:'all',venue:'all',period:'all',age:'all',archive:false};const now=new Date('2026-10-07');
test('twelve active camps and25archive; annual rows never leak into camp selection',()=>{assert.equal(items.filter(i=>campMatches(i,base,now)).length,12);assert.equal(items.filter(i=>campMatches(i,{...base,archive:true},now)).length,37);});
test('unknown dates/ages survive filtering but explicit incompatible ages do not',()=>{const unknown=items.find(i=>i.offer.id==='autumn-2026-1517')!,ekt=items.find(i=>i.offer.id==='autumn-2026-ekt')!;const s={...base,period:'2026-10-26',age:'16'};assert.equal(campMatches(unknown,s,now),true);assert.equal(campNeedsClarification(unknown,s),true);assert.equal(campMatches(ekt,s,now),false);assert.equal(campMatches(unknown,{...base,age:'garbage'},now),false);assert.equal(campMatches(ekt,{...base,period:'pending'},now),false);});
test('school and exact building filters remain conjunctive',()=>{const s={...base,school:'school-2044'};assert.equal(items.filter(i=>campMatches(i,s,now)).length,2);assert.equal(items.filter(i=>campMatches(i,{...s,venue:'school-2044-dmitrovskoe-169b'},now)).length,1);assert.equal(items.filter(i=>campMatches(i,{...s,venue:'mduc-ekt-mosfilmovskaya'},now)).length,0);});
test('wizard skips established scope/single date but keeps uncertain location visible',()=>{assert.deepEqual(campSteps(items,'mduc-ekt','mduc-ekt-mosfilmovskaya',now),['age','results']);assert.ok(campSteps(items,'school-2044',undefined,now).includes('place'));assert.ok(campSteps(items,'school-1517',undefined,now).includes('place'));assert.ok(campSteps(items,undefined,undefined,now).includes('dates'));});

test('unresolved school dates and virtual campus never look like confirmed single choice',()=>{assert.ok(campSteps(items,'school-1517',undefined,now).includes('dates'));assert.ok(campSteps(items,'school-1517','autumn-2026-1517-venue',now).includes('place'));});

test('bare camp routes start wizard; catalogue, embedded and share links reach results',()=>{
 const steps=['place','dates','age','results'];
 assert.deepEqual(campPresentation(new URLSearchParams(),steps),{wizard:true,step:'place'});
 assert.deepEqual(campPresentation(new URLSearchParams(),['age','results']),{wizard:true,step:'age'});
 for(const q of ['school=school-2044','venue=school-2044-dmitrovskoe-169b','campus=school-2044-dmitrovskoe-169b','view=catalogue','offer=autumn-2026-ekt','programme=mekhvarium-laboratoriya-kineticheskih-monstrov','age=9'])assert.equal(campPresentation(new URLSearchParams(q),steps).step,'results');
 assert.deepEqual(campPresentation(new URLSearchParams('view=wizard'),steps,true),{wizard:false,step:'results'});
 assert.equal(campPresentation(new URLSearchParams('age=9&step=age'),steps).step,'age');
});
test('programme filter stays conjunctive, unknown fails closed, own facet excludes own selection',()=>{
 const ekt=items.find(i=>i.offer.id==='autumn-2026-ekt')!;const selection={...base,programme:ekt.quest.slug};
 assert.ok(items.filter(i=>campMatches(i,selection,now)).every(i=>i.quest.slug===ekt.quest.slug));
 assert.equal(items.filter(i=>campMatches(i,{...selection,programme:'missing'},now)).length,0);
 assert.equal(campChoiceCount(items,{...selection,programme:'missing'},'programme',ekt.quest.slug,now),items.filter(i=>campMatches(i,selection,now)).length);
 const scoped={...base,school:'school-2044',venue:'school-2044-dmitrovskoe-169b'};
 assert.equal(campChoiceCount(items,scoped,'school','school-937',now),1);
 assert.equal(campChoiceCount(items,base,'period','2026-10-26',now),items.filter(i=>campMatches(i,{...base,period:'2026-10-26'},now)).length);
 assert.equal(campChoiceCount(items,{...base,archive:true},'school','all',now),37);
});

test('confirmed2103 and17 camp scopes skip known place and dates',()=>{for(const [school,venue] of [['school-2103','school-2103-golubinskaya-5k4'],['school-17','school-17-belyaevo']])assert.deepEqual(campSteps(items,school,venue,now),['age','results']);});

test('confirmed937 camp keeps exact campus and age16 eligible',()=>{const i=items.find(i=>i.offer.id==='autumn-2026-937')!;assert.deepEqual(campSteps(items,'school-937','school-937-marshala-zakharova-25',now),['age','results']);assert.equal(campMatches(i,{...base,age:'16'},now),true);assert.equal(campMatches(i,{...base,age:'17'},now),false);assert.equal(campMatches(i,{...base,venue:'school-937-orekhovo'},now),false);assert.equal(i.offer.maxCapacity,15);assert.equal(i.offer.enrolled,1);assert.equal(i.offer.mosBookingUrl,'https://www.mos.ru/pgu2/activity/card/1084865');assert.match(i.offer.includedNote!,/25.10.2026 22:00 МСК/);});
