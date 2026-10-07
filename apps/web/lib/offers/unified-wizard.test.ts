import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {questSchema,venueSchema,worldSchema} from '../schemas';import {buildAgendaItems,type AgendaOfferItem} from './agenda';
import {activityCategory,availableCategories,scopedActivities,resolveWizardCategory,wizardHref,sharedAgeQuery} from './unified-wizard';
const read=(p:string)=>JSON.parse(fs.readFileSync('data/'+p,'utf8'));const cat=read('v2/catalog-snapshot.json'),snap=read('offers-snapshot.json');const quests=questSchema.array().parse(cat.courses.map((q:{slug:string})=>({...q,offers:snap.offersByQuest[q.slug]??[]})));const venues=venueSchema.array().parse(read('v2/map-snapshot.json').venues);const items=buildAgendaItems({quests,venues,worlds:worldSchema.array().parse(cat.worlds)});const now=new Date('2026-10-07');
test('school categories contain only active offers and exact campus constrains them',()=>{
 assert.deepEqual(availableCategories(scopedActivities(items,'school-2044','all',now)).map(c=>c.kind),['year','camp']);
 const one=availableCategories(scopedActivities(items,'school-2044','missing-campus',now));
 // Verify using the actual venue id from the existing autumn offer.
 const venue=items.find(i=>i.offer.id==='autumn-2026-2044-dolgoprudnaya-16')!.venue.slug;
 assert.deepEqual(availableCategories(scopedActivities(items,'school-2044',venue,now)).map(c=>c.kind),['camp']);
 assert.equal(one.length,0);assert.deepEqual(availableCategories(scopedActivities(items,'missing','all',now)),[]);
 assert.equal(availableCategories(scopedActivities(items,'all','all',now)).some(c=>c.kind==='other'),false);
});
test('single category skip waits for successful source; selected missing kind never substituted',()=>{
 const cats=[{kind:'camp' as const,label:'Лагерные смены',count:1}];
 assert.equal(resolveWizardCategory(cats,null,false).kind,null);assert.equal(resolveWizardCategory(cats,null,true).kind,'camp');
 assert.deepEqual(resolveWizardCategory(cats,'year',true),{kind:'year',missing:true});assert.deepEqual(resolveWizardCategory(cats,'all',true),{kind:'all',missing:false});assert.equal(resolveWizardCategory([],null,true).kind,null);
});
test('other category requires explicit formatType and disappears when cancelled or archived',()=>{
 const base=items.find(i=>i.offer.id==='autumn-2026-ekt')!;
 const event:AgendaOfferItem={...base,offer:{...base.offer,scheduleCard:{...base.offer.scheduleCard!,formatType:'Мастер-класс'}}};
 assert.equal(activityCategory(base),'camp');assert.equal(activityCategory(event),'other');
 assert.equal(availableCategories(scopedActivities([event],'all','all',now))[0].kind,'other');
 for(const patch of [{isArchived:true},{status:'Отменено'}])assert.equal(scopedActivities([{...event,offer:{...event.offer,scheduleCard:{...event.offer.scheduleCard!,...patch}}}],'all','all',now).length,0);
});
test('unified school and exact campus links keep stable public scope',()=>{assert.equal(wizardHref(),'/wizard/');assert.equal(wizardHref('school-2044'),'/sites/school-2044/wizard/');assert.equal(wizardHref('school-2044','school-2044-dmitrovskoe-169b'),'/sites/school-2044/wizard/?venue=school-2044-dmitrovskoe-169b');});

test('mixed results retain only scope and age',()=>{
 assert.equal(sharedAgeQuery(new URLSearchParams('school=school-2044&venue=v&age=9&programme=missing&day=7&period=missing&offer=missing&archive=1')).toString(),'school=school-2044&venue=v&age=9');
});
