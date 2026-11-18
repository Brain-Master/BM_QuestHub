/** Reviewed append-only public source transition; source portal teacher is retained. */
import {digest} from './school-2103-source.mjs';
import {canonical} from './school-2103-replacement-source.mjs';
import {validateProjectedMosCard} from './mos-annual-cards.mjs';
export const school1539Base='4d57eb55f7fce6182b274ef487a0741c0a1a7300c7844e795b45e12e3faface0';
export const school1539Identities=[['К5359-26','1098766','2600129',14],['К5368-26','1099232','2600434',15],['К5369-26','1099240','2600446',16],['К5370-26','1099251','2600451',17]];
const rawKeys=['groupCode','listingId','title','locationId','teacher','status','totalSeats','freeSeats','ageMin','ageMax','lessonPrice','coursePrice','courseStart','courseEnd','slots','link'];
export function composeSchool1539(base,addition){
 if(base.sourceSha256!==school1539Base||digest(canonical(base))!=='ad0a61f19df54b5b2cfa5a07d287a54aa253493ebdaf6793879dde33297122c2')throw Error('SCHOOL1539_BASE_MISMATCH');
 if(addition.version!==1||addition.baseSourceSha256!==school1539Base||addition.reviewedAt!=='2026-11-18'||addition.ownerTeacher!=='Тихомирова Марина Дмитриевна'||addition.groups.length!==4||addition.locations.length!==1)throw Error('SCHOOL1539_SOURCE_INVALID');
 const location=addition.locations[0];
 if(JSON.stringify(location)!==JSON.stringify({id:'LOC-014',school:'Школа № 1539',address:'г. Москва, вн.тер. м.о. Алексеевский, Маломосковская ул., д. 7',metro:'Алексеевская'}))throw Error('SCHOOL1539_CAMPUS_INVALID');
 const groups=school1539Identities.map(([code,card,listing,hour],i)=>{
  const rows=addition.groups.filter(g=>g.groupCode===code),g=rows[0];if(rows.length!==1)throw Error('SCHOOL1539_IDENTITY_INVALID');validateProjectedMosCard(g);
  if(Object.keys(g).some(k=>![...rawKeys,'cardId','organization','address','refreshedAt','admissionStart','admissionEnd'].includes(k)))throw Error('SCHOOL1539_PRIVATE_FIELD');
  if(g.cardId!==card||g.listingId!==listing||g.locationId!==location.id||g.address!==location.address||g.organization!=='Государственное бюджетное общеобразовательное учреждение города Москвы "Школа № 1539"'||g.ageMin!==6||g.ageMax!==14||g.courseStart!=='2026-12-01'||g.courseEnd!=='2027-05-31'||g.lessonPrice!==1000||g.coursePrice!==24000||g.totalSeats!==15||g.freeSeats!==15||g.status!=='open'||g.teacher!=='Варфоломеева Алина Александровна'||g.admissionStart!=='2026-11-17'||g.admissionEnd!==(i===3?'2027-01-31':'2027-02-28')||!g.refreshedAt.startsWith('2026-11-18T')||!Number.isFinite(Date.parse(g.refreshedAt))||JSON.stringify(g.slots)!==JSON.stringify([{weekday:'Пятница',start:`${hour}:30`,end:`${hour+1}:29`}])||base.groups.some(r=>r.id===code))throw Error('SCHOOL1539_IDENTITY_INVALID');
  return {id:code,programme:'shmi',...Object.fromEntries(rawKeys.map(k=>[k,g[k]])),linkKind:'card',limitedSource:false};
 });
 return {...structuredClone(base),sourceSha256:digest(canonical({version:1,base,addition})),locations:[...base.locations,location],groups:[...base.groups,...groups]};
}
