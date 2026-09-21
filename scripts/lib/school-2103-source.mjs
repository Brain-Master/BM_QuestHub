/** Explicit, deterministic extension of the reviewed September 8 CSV source. */
import crypto from 'node:crypto';
import {validateProjectedMosCard} from './mos-annual-cards.mjs';
export const baseSourceDigest = 'ecf2aa67d7490a5de15e1242ec333ac3c3b34ccc52167c4f0fcee474d98f8de7';
const baseProjectionDigest = '7b32e4a3db772c4f0eb02deee33263adba4ab7800dfaedc4e28e1941727e4cdb';
export const school2103Identities = [
  ['К3015-26','1029263','2560824','LOC-009'], ['К3016-26','1029267','2560824','LOC-009'],
  ['К3020-26','1029383','2560863','LOC-010'], ['К3021-26','1029384','2560863','LOC-010'],
  ['К3022-26','1029393','2560874','LOC-010'], ['К3024-26','1029398','2560874','LOC-010'],
  ['К3025-26','1029402','2560874','LOC-010'], ['К3026-26','1029407','2560883','LOC-010'],
  ['К3027-26','1029412','2560883','LOC-010'],
];
export const digest = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function composeSchool2103(base, addition) {
  if (base.sourceSha256 !== baseSourceDigest || digest(base) !== baseProjectionDigest) throw Error('ANNUAL_BASE_PREIMAGE_MISMATCH');
  if (addition.version !== 1 || addition.baseSourceSha256 !== baseSourceDigest || addition.groups.length !== 9 || addition.locations.length !== 2) throw Error('ANNUAL_ADDITION_INVALID');
  const expectedLocations = [
    ['LOC-009','г. Москва, вн.тер. м.о. Ясенево, Голубинская ул., д. 13, к. 2'],
    ['LOC-010','г. Москва, вн.тер. м.о. Ясенево, Голубинская ул., д. 5, к. 4'],
  ];
  for (const [id,address] of expectedLocations) {
    const location = addition.locations.filter(l => l.id === id);
    if (location.length !== 1 || location[0].address !== address || location[0].school !== 'Школа № 2103') throw Error('ANNUAL_ADDITION_LOCATION');
  }
  const groups = school2103Identities.map(([code,cardId,listingId,locationId]) => {
    const rows = addition.groups.filter(g => g.groupCode === code);
    if (rows.length !== 1) throw Error('ANNUAL_ADDITION_IDENTITY');
    const g = rows[0]; validateProjectedMosCard(g);
    if (g.cardId !== cardId || g.listingId !== listingId || g.locationId !== locationId ||
        g.address !== addition.locations.find(l => l.id === locationId).address ||
        g.organization !== 'Государственное бюджетное общеобразовательное учреждение города Москвы "Школа № 2103"' ||
        !Number.isFinite(Date.parse(g.refreshedAt)) || !g.refreshedAt.startsWith(addition.reviewedAt)) throw Error('ANNUAL_ADDITION_IDENTITY');
    return {id:code,groupCode:code,listingId,programme:'shmi',title:g.title,locationId,
      teacher:g.teacher,status:g.status,totalSeats:g.totalSeats,freeSeats:g.freeSeats,ageMin:g.ageMin,ageMax:g.ageMax,
      lessonPrice:g.lessonPrice,coursePrice:g.coursePrice,courseStart:g.courseStart,courseEnd:g.courseEnd,
      slots:g.slots,link:g.link,linkKind:'card',limitedSource:false};
  });
  return {...structuredClone(base),sourceSha256:digest({version:1,baseSourceDigest,addition}),
    locations:[...base.locations,...addition.locations],groups:[...base.groups,...groups]};
}
