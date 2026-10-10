/** Append-only public source transition. Existing groups and portal identities are immutable. */
import {digest} from './school-2103-source.mjs';
import {canonical} from './school-2103-replacement-source.mjs';
import {validateProjectedMosCard} from './mos-annual-cards.mjs';
export const school2044Base='8669e5232d1a943d711f32155f577a5382e15209297d8c03cd1665a053f57f12';
export const school2044Identities=[['К4114-26','1076240','2589337',13,6,8],['К4115-26','1076242','2589338',14,6,10],['К4116-26','1076241','2589339',15,7,11],['К4117-26','1076245','2589340',16,7,13],['К4118-26','1076244','2589341',17,10,13]];
const rawKeys=['groupCode','listingId','title','locationId','teacher','status','totalSeats','freeSeats','ageMin','ageMax','lessonPrice','coursePrice','courseStart','courseEnd','slots','link'];
export function composeSchool2044(base,addition){
 if(base.sourceSha256!==school2044Base||digest(canonical(base))!=='3dec527256ea9f888b7936c66f398ce3b55180e933f4a28dc16a469354f9afff')throw Error('SCHOOL2044_BASE_MISMATCH');
 if(addition.version!==1||addition.baseSourceSha256!==school2044Base||addition.reviewedAt!=='2026-10-10'||addition.ownerTeacher!=='Локтеева Ирина Дмитриевна'||addition.groups.length!==5||addition.locations.length!==1)throw Error('SCHOOL2044_SOURCE_INVALID');
 const location=addition.locations[0];
 if(JSON.stringify(location)!==JSON.stringify({id:'LOC-013',school:'Школа № 2044',address:'г. Москва, вн.тер. м.о. Северный, Долгопрудная ал., д. 16',metro:'Долгопрудная'}))throw Error('SCHOOL2044_CAMPUS_INVALID');
 const groups=school2044Identities.map(([code,card,listing,hour,ageMin,ageMax],i)=>{
  const rows=addition.groups.filter(g=>g.groupCode===code),g=rows[0];if(rows.length!==1)throw Error('SCHOOL2044_IDENTITY_INVALID');validateProjectedMosCard(g);
  if(Object.keys(g).some(k=>![...rawKeys,'cardId','organization','address','refreshedAt','programmeTitle'].includes(k)))throw Error('SCHOOL2044_PRIVATE_FIELD');
  const classes=['1 класс','1-3 класс','2-4 класс','2-6 класс','5-6 класс'][i];
  if(g.cardId!==card||g.listingId!==listing||g.locationId!==location.id||g.address!==location.address||g.organization!=='Государственное бюджетное общеобразовательное учреждение города Москвы "Школа № 2044 имени Героя Советского Союза А.М. Серебрякова"'||g.ageMin!==ageMin||g.ageMax!==ageMax||g.programmeTitle!==`Школа Молодого IT-Инженера BrainMaster ${classes}. Робототехника.`||g.courseStart!=='2026-10-15'||g.courseEnd!=='2027-05-28'||g.lessonPrice!==1000||g.coursePrice!==32000||g.totalSeats!==12||!g.refreshedAt.startsWith('2026-10-10T')||!Number.isFinite(Date.parse(g.refreshedAt))||JSON.stringify(g.slots)!==JSON.stringify([{weekday:'Четверг',start:`${hour}:00`,end:`${hour}:45`}])||base.groups.some(r=>r.id===code))throw Error('SCHOOL2044_IDENTITY_INVALID');
  return {id:code,programme:'shmi',...Object.fromEntries(rawKeys.map(k=>[k,g[k]])),title:g.programmeTitle,linkKind:'card',limitedSource:false};
 });
 return {...structuredClone(base),sourceSha256:digest(canonical({version:1,base,addition})),locations:[...base.locations,location],groups:[...base.groups,...groups]};
}
