/** Append-only public source; never consumes application records or chat invitations. */
import {digest} from './school-2103-source.mjs';
import {validateProjectedMosCard} from './mos-annual-cards.mjs';
export const school37BaseDigest = '23b9dbb84ccb2e2eb577efaf94ecdca1c952603ab5ea6ebb9cb5b68d6c594c97';
const baseProjectionDigest = 'a6e74117cedf5ff7833fd072bfcc0df6215a85c30604bd0b4621e3e773e0322e';
export const school37Identities = [
  ['К2763-26','1019233','Среда','14:15','15:00',1],
  ['К2764-26','1019236','Среда','15:15','16:00',1],
  ['К2765-26','1019244','Среда','16:15','17:00',2],
  ['К2766-26','1019286','Четверг','14:15','15:00',1],
  ['К2767-26','1019288','Четверг','15:15','16:00',1],
  ['К2768-26','1019293','Четверг','16:15','17:00',2],
  ['К2769-26','1019299','Пятница','14:15','15:00',1],
  ['К2770-26','1019455','Пятница','15:15','16:00',1],
  ['К2771-26','1019466','Пятница','16:15','17:00',2],
];
const address='г. Москва, вн.тер. м.о. Раменки, Мичуринский пр-кт, д. 28';
export function composeSchool37(base, addition) {
  if(base.sourceSha256!==school37BaseDigest || digest(base)!==baseProjectionDigest) throw Error('SCHOOL37_BASE_PREIMAGE_MISMATCH');
  if(addition.version!==1 || addition.reviewedAt!=='2026-09-22' || addition.baseSourceSha256!==school37BaseDigest ||
     addition.groups?.length!==9 || JSON.stringify(addition.locations)!==JSON.stringify([{id:'LOC-012',school:'Школа № 37',address,metro:'Раменки'}])) throw Error('SCHOOL37_ADDITION_INVALID');
  const groups=school37Identities.map(([code,cardId,weekday,start,end])=>{
    const rows=addition.groups.filter(g=>g.groupCode===code);
    if(rows.length!==1)throw Error('SCHOOL37_IDENTITY');
    const g=rows[0]; validateProjectedMosCard(g);
    if(g.cardId!==cardId || g.listingId!=='2553800' || g.locationId!=='LOC-012' || g.address!==address ||
      g.organization!=='Государственное бюджетное общеобразовательное учреждение города Москвы "Школа № 37"' ||
      g.courseStart!=='2026-09-14' || g.courseEnd!=='2027-05-31' ||
      JSON.stringify(g.slots)!==JSON.stringify([{weekday,start,end}]) ||
      !Number.isFinite(Date.parse(g.refreshedAt)) || !g.refreshedAt.startsWith(addition.reviewedAt)) throw Error('SCHOOL37_IDENTITY');
    return {id:code,groupCode:code,listingId:g.listingId,programme:'shmi',title:g.title,locationId:g.locationId,
      teacher:g.teacher,status:g.status,totalSeats:g.totalSeats,freeSeats:g.freeSeats,ageMin:g.ageMin,ageMax:g.ageMax,
      lessonPrice:g.lessonPrice,coursePrice:g.coursePrice,courseStart:g.courseStart,courseEnd:g.courseEnd,
      slots:g.slots,link:g.link,linkKind:'card',limitedSource:false};
  });
  return {...structuredClone(base),sourceSha256:digest({version:1,school37BaseDigest,addition}),
    locations:[...base.locations,...addition.locations],groups:[...base.groups,...groups]};
}
