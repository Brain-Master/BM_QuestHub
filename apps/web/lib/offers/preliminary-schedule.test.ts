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
test('nine preliminary offers preserve unknowns while three EKT offers open MOS booking',()=>{
 assert.equal(camps.length,9);assert.equal(rows.filter(o=>o.annual).length,94);assert.equal(rows.filter(o=>!o.annual&&!o.id.startsWith('autumn-2026-')).length,25);
 assert.equal(rows.reduce((n,o)=>n+(o.annual?.legacyReservation?.places??0),0),51);
 for(const o of camps){assert.equal(getScheduleBookingMode(o,'Скоро старт').kind,'waitlist');assert.equal(isOfferAutoArchived(o,new Date('2026-10-06')),false);assert.equal(o.enrolled,undefined);}
 const ekt=rows.find(o=>o.id==='autumn-2026-ekt')!;assert.match(ekt.mosBookingUrl!,/1071480$/);
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
 const without=structuredClone(input);for(const [k,v] of Object.entries(without.offers.offersByQuest))without.offers.offersByQuest[k]=(v as {id:string}[]).filter(o=>!o.id.startsWith('autumn-2026-'));
 assert.deepEqual(compileAutumnCamps(without),a);
 for(const v of a['data/v2/map-snapshot.json'].venues.filter((v:{preliminaryVenue?:boolean})=>v.preliminaryVenue)){assert.equal(v.latitude,undefined);assert.equal(v.longitude,undefined);assert.equal(v.photos.length,0);}
});

test('cold Sheets reset restores missing reviewed annual-added camp venues before annual compiler',()=>{
 const cold=structuredClone(input);cold.catalog.courses=cold.catalog.courses.filter((c:{slug:string})=>c.slug!=='autumn-creative');
 cold.map.venues=cold.map.venues.filter((v:{slug:string;preliminaryVenue?:boolean})=>!v.preliminaryVenue&&!['school-1212-vilnyusskaya-14','school-37-michurinsky-28','school-2044-dmitrovskoe-169b','mduc-ekt-chertanovskaya','mduc-ekt-odesskaya','mduc-ekt-mosfilmovskaya'].includes(v.slug));
 const out=compileAutumnCamps(cold);const venues=new Set(out['data/v2/map-snapshot.json'].venues.map((v:{slug:string})=>v.slug));
 for(const c of Object.values(out['data/offers-snapshot.json'].offersByQuest).flat().map(o=>venueOfferSchema.parse(o)).filter(o=>o.id.startsWith('autumn-2026-')))assert.ok(venues.has(c.venueSlug));
});

test('three official EKT bindings survive v2 roundtrip with dated seats and MOS registration',()=>{
 const expected=[['autumn-2026-ekt','1071480','2586628',12],['autumn-2026-ekt-chertanovskaya','1075590','2588951',12],['autumn-2026-ekt-odesskaya','1075237','2588749',8]] as const;
 for(const [id,card,listing,total] of expected){const o=rows.find(r=>r.id===id)!;assert.ok(o);assert.equal(o.preliminary,undefined);assert.equal(o.startDate,'2026-10-26');assert.equal(o.endDate,'2026-10-30');assert.equal(o.maxCapacity,total);assert.equal(o.enrolled,0);assert.equal(o.scheduleCard?.registrationChannel,'mos_ru');assert.equal(o.scheduleCard?.allowPreliminaryRegistration,false);assert.equal(o.scheduleCard?.mosRuCode,listing);assert.match(o.includedNote!,/10.10.2026/);assert.match(o.priceLabel,/12\s950/);
 const event=eventV2Schema.parse(venueOfferToEventV2('camp',o));const round=scheduleV2ToOffersSnapshotV1({version:2,generatedAt:'2026-10-10T00:00:00Z',source:'test',events:[event]}).offersByQuest.camp[0];
 assert.equal(round.maxCapacity,total);assert.equal(round.enrolled,0);assert.equal(round.scheduleCard?.variants[0].mosRuCode,listing);assert.deepEqual(getScheduleBookingMode(round,'Идет прием'),{kind:'mos',label:'Записаться (Mos.ru)',url:'https://www.mos.ru/pgu2/activity/card/'+card});
 }
 const venue=input.map.venues.find((v:{slug:string})=>v.slug==='mduc-ekt-chertanovskaya');assert.equal(venue.address,'Чертановская ул., 58А');assert.equal(venue.latitude,undefined);assert.equal(venue.photos.length,0);
});
