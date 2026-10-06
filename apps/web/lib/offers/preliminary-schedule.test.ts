import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {venueOfferSchema} from '../schemas';
import {eventV2Schema} from '../data/v2/entities';
import {venueOfferToEventV2} from '../data/v2/v1-to-v2';
import {scheduleV2ToOffersSnapshotV1} from '../data/v2/v2-to-v1';
import {getScheduleBookingMode,isOfferAutoArchived} from './schedule-board';
import {compileAutumnCamps} from '../../../../scripts/integrate-autumn-camps';
const read=(p:string)=>JSON.parse(fs.readFileSync(new URL('../../data/'+p,import.meta.url),'utf8'));
const input={offers:read('offers-snapshot.json'),catalog:read('v2/catalog-snapshot.json'),map:read('v2/map-snapshot.json'),manifest:read('v2/site-manifest.json')};
const rows=Object.values(input.offers.offersByQuest).flat().map(o=>venueOfferSchema.parse(o));
const camps=rows.filter(o=>o.preliminary);
test('ten preliminary offers preserve unknowns and override direct MOS booking',()=>{
 assert.equal(camps.length,10);assert.equal(rows.filter(o=>o.annual).length,89);assert.equal(rows.filter(o=>!o.annual&&!o.preliminary).length,25);
 assert.equal(rows.reduce((n,o)=>n+(o.annual?.legacyReservation?.places??0),0),51);
 for(const o of camps){assert.equal(getScheduleBookingMode(o,'Скоро старт').kind,'waitlist');assert.equal(isOfferAutoArchived(o,new Date('2026-10-06')),false);assert.equal(o.enrolled,undefined);}
 const ekt=camps.find(o=>o.id==='autumn-2026-ekt')!;assert.match(ekt.mosBookingUrl!,/1071480$/);
});
test('empty schedule gated to paired nonannual preliminary records',()=>{
 const c=camps.find(o=>o.id==='autumn-2026-1383')!;assert.equal(c.startDate,'');assert.equal(c.startTime,'');
 assert.equal(venueOfferSchema.safeParse({...c,preliminary:undefined}).success,false);
 assert.equal(venueOfferSchema.safeParse({...c,endDate:'2026-10-30'}).success,false);
 assert.equal(venueOfferSchema.safeParse({...c,endTime:'12:30'}).success,false);
 assert.equal(venueOfferSchema.safeParse({...c,annual:rows.find(o=>o.annual)!.annual}).success,false);
});
test('v2 roundtrip never manufactures dates/time or switches preliminary to MOS',()=>{
 for(const o of camps){const event=eventV2Schema.parse(venueOfferToEventV2('camp',o));const out=scheduleV2ToOffersSnapshotV1({version:2,generatedAt:'2026-10-06T00:00:00Z',source:'test',events:[event]}).offersByQuest.camp[0];
  venueOfferSchema.parse(out);assert.equal(out.preliminary,true);assert.equal(out.startDate,o.startDate);assert.equal(out.startTime,o.startTime);assert.equal(out.endTime,o.endTime);assert.equal(out.scheduleCard?.registrationChannel,'brainmaster');assert.equal(getScheduleBookingMode(out,'Скоро старт').kind,'waitlist');assert.doesNotMatch(out.dateRange,/undefined/);
 }
});
test('compiler restores deleted Sheets camp rows, is idempotent, never rewrites other offers',()=>{
 const a=compileAutumnCamps(input);const b=compileAutumnCamps({offers:a['data/offers-snapshot.json'],catalog:a['data/v2/catalog-snapshot.json'],map:a['data/v2/map-snapshot.json'],manifest:a['data/v2/site-manifest.json']});assert.deepEqual(a,b);
 const without=structuredClone(input);for(const [k,v] of Object.entries(without.offers.offersByQuest))without.offers.offersByQuest[k]=(v as {preliminary?:boolean}[]).filter(o=>!o.preliminary);
 assert.deepEqual(compileAutumnCamps(without),a);
 for(const v of a['data/v2/map-snapshot.json'].venues.filter((v:{preliminaryVenue?:boolean})=>v.preliminaryVenue)){assert.equal(v.latitude,undefined);assert.equal(v.longitude,undefined);assert.equal(v.photos.length,0);}
});

test('cold Sheets reset restores missing reviewed annual-added camp venues before annual compiler',()=>{
 const cold=structuredClone(input);cold.catalog.courses=cold.catalog.courses.filter((c:{slug:string})=>c.slug!=='autumn-creative');
 cold.map.venues=cold.map.venues.filter((v:{slug:string;preliminaryVenue?:boolean})=>!v.preliminaryVenue&&!['school-1212-vilnyusskaya-14','school-37-michurinsky-28','school-2044-dmitrovskoe-169b'].includes(v.slug));
 const out=compileAutumnCamps(cold);const venues=new Set(out['data/v2/map-snapshot.json'].venues.map((v:{slug:string})=>v.slug));
 for(const c of Object.values(out['data/offers-snapshot.json'].offersByQuest).flat().map(o=>venueOfferSchema.parse(o)).filter(o=>o.preliminary))assert.ok(venues.has(c.venueSlug));
});
