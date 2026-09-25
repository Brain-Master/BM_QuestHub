import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {isRetiredSchool} from '../../content/retired-schools.mjs';
import {isRetiredAnnualGroup} from '../../content/annual-retirements.mjs';
import {questSchema,venueSchema,worldSchema} from '../schemas';
import {buildAgendaItems,getSchoolScopes} from '../offers/agenda';
import {getScheduleBookingMode} from '../offers/schedule-board';
import {buildSiteScopeCards} from './scope-card';
import {mergeMosAvailability,mosAvailabilityBinding,type MosAvailability} from '../offers/mos-availability';
const read=(p:string)=>JSON.parse(fs.readFileSync(p,'utf8'));
const hot=read('data/offers-snapshot.json'),catalog=read('data/v2/catalog-snapshot.json');
const venues=venueSchema.array().parse(read('data/v2/map-snapshot.json').venues);
const quests=questSchema.array().parse(catalog.courses.map((q:{slug:string})=>({...q,offers:hot.offersByQuest[q.slug]??[]})));
const worlds=worldSchema.array().parse(catalog.worlds);

test('withdrawal is exact, covers both campuses and future groups; sources remain intact',()=>{
 for(const v of [null,{},'school-8750','school-1875'])assert.equal(isRetiredSchool(v),false);
 for(const v of ['875','school-875','school-875-yugo-zapadnaya','school-875-vernadskogo-99k2'])assert.equal(isRetiredSchool(v),true);
 assert.equal(venues.filter(isRetiredSchool).length,2);
 assert.equal(quests.flatMap(q=>q.offers).filter(o=>o.annual).length,74);
 assert.ok(read('content/annual-mos-refresh.generated.json').groups['К1981-26']);
 assert.equal(isRetiredAnnualGroup({venueSlug:'school-875-new-campus',annual:{listingId:'new'}}),true);
 const scopes=getSchoolScopes(venues);assert.ok(scopes.every(s=>!isRetiredSchool(s.slug)));
 const cards=buildSiteScopeCards({venues,quests,worlds,scopes,includeInactive:true});
 assert.ok(cards.every(c=>!isRetiredSchool(c.slug)&&c.campuses.every(v=>!isRetiredSchool(v))));
});
test('old unarchived hot offer and fresh capacity cannot resurrect display or booking',()=>{
 const quest=quests.find(q=>q.slug==='shmi')!;
 const original=quest.offers.find(o=>o.id==='year:К1981-26')!;assert.ok(original);
 const offer={...original,scheduleCard:{...original.scheduleCard,isArchived:false}};
 const at='2026-09-25T12:00:00.000Z',binding=mosAvailabilityBinding(offer)!;assert.ok(binding);
 const sidecar:MosAvailability={version:1,attemptedAt:at,completedAt:at,expected:1,verified:1,archived:0,errors:[],entries:{[offer.id]:{binding,availability:{checkedAt:at,totalSeats:20,freeSeats:20,admission:'open'}}}};
 const merged=mergeMosAvailability([{...quest,offers:[offer]}],sidecar,new Date(at));
 assert.equal(merged[0].offers[0],offer);
 assert.deepEqual(buildAgendaItems({quests:merged,venues,worlds}),[]);
 assert.equal(getScheduleBookingMode(offer,'Идёт набор',undefined,new Date(at)).kind,'disabled');
});
