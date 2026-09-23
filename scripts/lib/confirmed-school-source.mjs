/** Ordered, public-only 69 -> 74 transition. Historical source bytes stay immutable. */
import {digest} from './school-2103-source.mjs';
import {validateProjectedMosCard} from './mos-annual-cards.mjs';
export const confirmedBaseDigest='a4ab9b9c82b4e99b57c6dab369be6cd03091e2dcc44240364b48a4fc7b3b6794';
const projectionDigest='af72ad45eac29591558349925b4a4b8250a78700bc5050bbba20fcf49e1de458';
export const newConfirmedIds=['К4609-26','К2215-26','К2216-26','К2217-26','К2218-26'];
export const confirmedIdentities=[
 ['К4609-26','984756','2533333','LOC-003','Четверг','13:30','14:15'],
 ['К4613-26','985251','2533414','LOC-003','Четверг','14:30','15:15'],
 ['К4611-26','985173','2533414','LOC-003','Четверг','15:30','16:15'],
 ['К4615-26','985282','2533414','LOC-003','Четверг','16:30','17:15'],
 ['К4617-26','985781','2533899','LOC-004','Понедельник','14:20','15:05'],
 ['К4618-26','985925','2533899','LOC-004','Понедельник','15:20','16:05'],
 ['К4619-26','985956','2533899','LOC-004','Понедельник','16:20','17:05'],
 ['К2215-26','1049854','2573579','LOC-011','Пятница','14:00','14:45'],
 ['К2216-26','1049859','2573583','LOC-011','Пятница','15:00','15:45'],
 ['К2217-26','1049862','2573587','LOC-011','Пятница','16:00','16:45'],
 ['К2218-26','1049865','2573589','LOC-011','Пятница','17:00','17:45'],
];
const rawKeys=['groupCode','listingId','title','locationId','teacher','status','totalSeats','freeSeats','ageMin','ageMax','lessonPrice','coursePrice','courseStart','courseEnd','slots','link'];
export function historical69(source) {
 const base={...structuredClone(source),sourceSha256:confirmedBaseDigest,
  groups:source.groups.filter(g=>!newConfirmedIds.includes(g.id)),locations:source.locations.filter(l=>l.id!=='LOC-011')};
 if(digest(base)!==projectionDigest)throw Error('CONFIRMED_BASE_PREIMAGE_MISMATCH');
 return base;
}
export function composeConfirmedSchools(base,school1212,school937) {
 if(base.sourceSha256!==confirmedBaseDigest||digest(base)!==projectionDigest)throw Error('CONFIRMED_BASE_PREIMAGE_MISMATCH');
 if(school1212.version!==1||school1212.baseSourceSha256!==confirmedBaseDigest||school1212.groups.length!==7||
    school1212.ownerContext.studyYear!==1||school937.groups.length!==4||school937.locations.length!==1||
    school937.unresolved.length||school937.ownerContext.teacher!=='Локтеева Ирина Дмитриевна'||
    school937.ownerContext.studyYear!==2||school937.ownerContext.ageMin!==6||school937.ownerContext.ageMax!==13)
  throw Error('CONFIRMED_ADDITION_INVALID');
 const location=school937.locations[0];
 if(location.id!=='LOC-011'||location.address!=='г. Москва, вн.тер. м.о. Орехово-Борисово Северное, ул. Маршала Захарова, д. 25')throw Error('CONFIRMED_CAMPUS_INVALID');
 const locations=[...base.locations,location],cards=[...school1212.groups,...school937.groups];
 for(const [code,card,listing,loc,weekday,start,end] of confirmedIdentities){
  const rows=cards.filter(g=>g.groupCode===code),g=rows[0];
  if(rows.length!==1)throw Error('CONFIRMED_IDENTITY_INVALID');
  validateProjectedMosCard(g);
  if(Object.keys(g).some(k=>![...rawKeys,'cardId','organization','address','refreshedAt'].includes(k)))throw Error('CONFIRMED_PRIVATE_FIELD');
  const expectedSchool=loc==='LOC-011'?'937':'1212';
  if(g.cardId!==card||g.listingId!==listing||g.locationId!==loc||
   g.address!==locations.find(l=>l.id===loc)?.address||!g.organization.includes(`Школа № ${expectedSchool}`)||
   JSON.stringify(g.slots)!==JSON.stringify([{weekday,start,end}])||!Number.isFinite(Date.parse(g.refreshedAt)))throw Error('CONFIRMED_IDENTITY_INVALID');
 }
 const added=cards.filter(g=>newConfirmedIds.includes(g.groupCode)).map(g=>({id:g.groupCode,programme:'shmi',
  ...Object.fromEntries(rawKeys.map(k=>[k,g[k]])),linkKind:'card',limitedSource:false}));
 return {...structuredClone(base),sourceSha256:digest({version:1,confirmedBaseDigest,school1212,school937}),
  locations,groups:[...base.groups,...added]};
}
