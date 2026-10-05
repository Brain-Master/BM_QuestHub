import {digest} from './school-2103-source.mjs';
import {validateProjectedMosCard} from './mos-annual-cards.mjs';
import {school2103Replacements} from '../../apps/web/content/school-2103-transfer.mjs';
export const school2103ReplacementBase='633d56e4a55a8a574fe49f66e144dcde1a2f49087a03a67b6c3578c3c8d8936a';
export const replacementIdentities=[
 ['К3128-26','1071988','2586499',1,'Понедельник','14:00','LOC-009'],
 ['К3119-26','1071199','2586499',1,'Понедельник','15:00','LOC-009'],
 ['К3129-26','1071989','2586499',1,'Понедельник','16:00','LOC-009'],
 ['К3120-26','1071202','2586503',1,'Понедельник','14:00','LOC-010'],
 ['К3121-26','1071205','2586503',1,'Среда','14:00','LOC-010'],
 ['К3122-26','1071211','2586507',2,'Понедельник','16:00','LOC-010'],
 ['К3123-26','1071212','2586507',2,'Вторник','14:00','LOC-010'],
 ['К3124-26','1071215','2586507',2,'Вторник','15:00','LOC-010'],
 ['К3125-26','1071219','2586507',2,'Среда','15:00','LOC-010'],
 ['К3126-26','1071224','2586517',3,'Понедельник','15:00','LOC-010'],
 ['К3127-26','1071227','2586517',3,'Вторник','16:00','LOC-010'],
];
const rawKeys=['groupCode','listingId','title','locationId','teacher','status','totalSeats','freeSeats','ageMin','ageMax','lessonPrice','coursePrice','courseStart','courseEnd','slots','link'];
export const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
export function composeSchool2103Replacement(base,addition){
 if(base.sourceSha256!==school2103ReplacementBase||digest(canonical(base))!=="8a4af2ecfa3ff8e263da53f1efbec07c93365bd7333b2de2c1f4d2008cbfa470")throw Error('SCHOOL2103_BASE_MISMATCH');
 if(addition.version!==1||addition.baseSourceSha256!==school2103ReplacementBase||addition.reviewedAt!=='2026-10-05'||addition.transferPolicy!=='hold-old-reserve-until-owner-reconciliation'||addition.groups.length!==11||addition.legacyOccupancy.length!==9)throw Error('SCHOOL2103_SOURCE_INVALID');
 const occupied={'К3015-26':1,'К3016-26':2,'К3020-26':3,'К3021-26':5,'К3022-26':5,'К3024-26':12,'К3025-26':10,'К3026-26':6,'К3027-26':7};
 for(const [oldCode,newCode] of Object.entries(school2103Replacements)){
  const records=addition.legacyOccupancy.filter(r=>r.oldGroupCode===oldCode),r=records[0];
  const old=base.groups.find(g=>g.groupCode===oldCode);
  if(records.length!==1||r.newGroupCode!==newCode||r.occupied!==occupied[oldCode]||old?.link!==`https://www.mos.ru/pgu2/activity/card/${r.oldCardId}`||!r.checkedAt?.startsWith('2026-10-02T')||!Number.isFinite(Date.parse(r.checkedAt)))throw Error('SCHOOL2103_RESERVE_MISMATCH');
 }
 const groups=replacementIdentities.map(([code,card,listing,year,weekday,start,locationId])=>{
  const rows=addition.groups.filter(g=>g.groupCode===code),g=rows[0];if(rows.length!==1)throw Error('SCHOOL2103_IDENTITY_MISMATCH');validateProjectedMosCard(g);
  if(Object.keys(g).some(k=>![...rawKeys,'cardId','organization','address','refreshedAt','studyYear'].includes(k)))throw Error('SCHOOL2103_PRIVATE_FIELD');
  if(g.cardId!==card||g.listingId!==listing||g.studyYear!==year||g.locationId!==locationId||g.address!==base.locations.find(l=>l.id===locationId)?.address||g.organization!=='Государственное бюджетное общеобразовательное учреждение города Москвы "Школа № 2103"'||g.courseStart!=='2026-10-05'||g.courseEnd!=='2027-05-31'||g.lessonPrice!==1000||!g.refreshedAt.startsWith('2026-10-05T')||!Number.isFinite(Date.parse(g.refreshedAt))||JSON.stringify(g.slots)!==JSON.stringify([{weekday,start,end:start.slice(0,2)+':45'}])||base.groups.some(x=>x.id===code))throw Error('SCHOOL2103_IDENTITY_MISMATCH');
  return {id:code,programme:'shmi',...Object.fromEntries(rawKeys.map(k=>[k,g[k]])),linkKind:'card',limitedSource:false};
 });
 return {...structuredClone(base),sourceSha256:digest(canonical({version:1,base,addition})),groups:[...base.groups,...groups]};
}
