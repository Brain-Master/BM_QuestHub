import assert from 'node:assert/strict';
import {digest} from './school-2103-source.mjs';
import {canonical} from './school-2103-replacement-source.mjs';
import {validateProjectedMosCard} from './mos-annual-cards.mjs';
export const school937ReplacementBase='9d307834776b63b209c5e08bdff1a3f81914d4001df39ce8db4f475fe4f8edab';
export function composeSchool937Replacement(base,a){
 assert.equal(base.sourceSha256,school937ReplacementBase);assert.equal(digest(canonical(base)),'e1df78624746c7aa0d887dd50101362e057d4caa7d3df4da1e903a57a435f727');
 assert.equal(a.version,1);assert.equal(a.baseSourceSha256,school937ReplacementBase);assert.equal(a.reviewedAt,'2026-11-21');assert.deepEqual(a.ownerAge,{ageMin:6,ageMax:13});assert.equal(a.admissionStart,'2026-11-18');assert.equal(a.admissionEnd,'2027-05-01');
 assert.deepEqual(base.groups.filter(g=>g.id==='К2213-26'),[a.retiredGroup]);assert.ok(!base.groups.some(g=>g.id==='К2339-26'));
 const g=a.group;validateProjectedMosCard(g);assert.equal(g.address,base.locations.find(l=>l.id==='LOC-011').address);assert.equal(g.organization,'Государственное бюджетное общеобразовательное учреждение города Москвы "Школа № 937 имени Героя Российской Федерации А.В. Перова"');
 for(const [key,value] of Object.entries({cardId:'1099851',listingId:'2600825',groupCode:'К2339-26',title:'26/27 Школа молодого инженера. Второй год обучения.',teacher:'Локтеева Ирина Дмитриевна',ageMin:6,ageMax:16,lessonPrice:1000,coursePrice:28000,courseStart:'2026-11-25',courseEnd:'2027-05-31',totalSeats:12,freeSeats:12,status:'open',link:'https://www.mos.ru/pgu2/activity/card/1099851',refreshedAt:'2026-11-21T00:00:00.000Z'}))assert.equal(g[key],value);
 assert.deepEqual(g.slots,[{weekday:'Среда',start:'16:00',end:'16:45'}]);
 const allowed=['cardId','listingId','groupCode','title','teacher','ageMin','ageMax','lessonPrice','coursePrice','courseStart','courseEnd','totalSeats','freeSeats','status','link','refreshedAt','slots','address','organization'];assert.ok(Object.keys(g).every(k=>allowed.includes(k)));
 const replacement={...a.retiredGroup,...Object.fromEntries(Object.keys(a.retiredGroup).filter(k=>Object.hasOwn(g,k)).map(k=>[k,g[k]])),id:g.groupCode};
 return {...structuredClone(base),sourceSha256:digest(canonical({version:1,base,addition:a})),groups:base.groups.map(g=>g.id===a.retiredGroup.id?replacement:g)};
}
