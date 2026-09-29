/** Owner-confirmed first-year addition; previous source stages remain immutable. */
import {digest} from './school-2103-source.mjs';
import {validateProjectedMosCard} from './mos-annual-cards.mjs';
export const school937Year1Base = 'b31c7abb0ede346497f752b4effa4fa2e6cd7c19ff63cc83cc754881a828e893';
export const school937Year1Identities = [
 ['К2211-26','1049842','2573566',1,'14:00','14:45'],
 ['К2212-26','1049844','2573569',1,'15:00','15:45'],
 ['К2213-26','1049847','2573572',1,'16:00','16:45'],
 ['К2214-26','1049848','2573574',1,'17:00','17:45'],
 ['К2215-26','1049854','2573579',2,'14:00','14:45'],
 ['К2216-26','1049859','2573583',2,'15:00','15:45'],
 ['К2217-26','1049862','2573587',2,'16:00','16:45'],
 ['К2218-26','1049865','2573589',2,'17:00','17:45'],
];
const rawKeys=['groupCode','listingId','title','locationId','teacher','status','totalSeats','freeSeats','ageMin','ageMax','lessonPrice','coursePrice','courseStart','courseEnd','slots','link'];
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
export function composeSchool937Year1(base,addition) {
 if(base.sourceSha256!==school937Year1Base||digest(canonical(base))!=='9ec0b4757d6178a03a01c76ed8b5838c52a05f67005f2847988415c99f783b51')throw Error('SCHOOL937_BASE_MISMATCH');
 if(addition.version!==1||addition.baseSourceSha256!==school937Year1Base||addition.reviewedAt!=='2026-09-28'||addition.groups.length!==8||
 addition.ownerContext.teacher!=='Локтеева Ирина Дмитриевна'||addition.ownerContext.ageMin!==6||addition.ownerContext.ageMax!==13)throw Error('SCHOOL937_SOURCE_INVALID');
 const address=base.locations.find(l=>l.id==='LOC-011')?.address;
 if(address!=='г. Москва, вн.тер. м.о. Орехово-Борисово Северное, ул. Маршала Захарова, д. 25')throw Error('SCHOOL937_CAMPUS_MISMATCH');
 const added=[];
 for(const [code,card,listing,year,start,end] of school937Year1Identities){
  const rows=addition.groups.filter(g=>g.groupCode===code),g=rows[0];
  if(rows.length!==1)throw Error('SCHOOL937_IDENTITY_MISMATCH');
  validateProjectedMosCard(g);
  if(Object.keys(g).some(k=>![...rawKeys,'cardId','organization','address','refreshedAt','studyYear'].includes(k)))throw Error('SCHOOL937_PRIVATE_FIELD');
  if(g.cardId!==card||g.listingId!==listing||g.studyYear!==year||g.locationId!=='LOC-011'||g.address!==address||
   g.courseStart!=='2026-09-28'||g.courseEnd!=='2027-05-31'||!g.organization.includes('Школа № 937')||
   !g.refreshedAt.startsWith('2026-09-28T')||!Number.isFinite(Date.parse(g.refreshedAt))||
   JSON.stringify(g.slots)!==JSON.stringify([{weekday:year===1?'Среда':'Пятница',start,end}]))throw Error('SCHOOL937_IDENTITY_MISMATCH');
  if(year===1){
   if(base.groups.some(x=>x.id===code))throw Error('SCHOOL937_DUPLICATE');
   added.push({id:code,programme:'shmi',...Object.fromEntries(rawKeys.map(k=>[k,g[k]])),
    title:'Школа Молодого IT-Инженера — 1-й год обучения',linkKind:'card',limitedSource:false});
  }else if(!base.groups.some(x=>x.id===code&&x.listingId===listing&&x.link===g.link))throw Error('SCHOOL937_EXISTING_IDENTITY_MISMATCH');
 }
 return {...structuredClone(base),sourceSha256:digest(canonical({version:1,base,addition})),groups:[...base.groups,...added]};
}
