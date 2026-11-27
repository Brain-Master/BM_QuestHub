/** Reviewed append-only public source transition; source portal teacher is retained. */
import {digest} from './school-2103-source.mjs';
import {canonical} from './school-2103-replacement-source.mjs';
import {validateProjectedMosCard} from './mos-annual-cards.mjs';
export const school1539TuesdayBase='21002d7a9af5db12a2ab13032038b933d0b3bcedbd6b2f7cea40b0c772073a9d';
export const school1539TuesdayIdentities=[["К5384-26", "1103584", "2603040", "14:30", "15:29"], ["К5385-26", "1103598", "2603044", "15:30", "16:30"], ["К5386-26", "1103619", "2603050", "16:30", "17:29"], ["К5387-26", "1103630", "2603063", "17:30", "18:29"]];
const rawKeys=['groupCode','listingId','title','locationId','teacher','status','totalSeats','freeSeats','ageMin','ageMax','lessonPrice','coursePrice','courseStart','courseEnd','slots','link'];
export function composeSchool1539Tuesday(base, addition) {
 if(base.sourceSha256!==school1539TuesdayBase || digest(canonical(base))!=='0aef336dee7a9404af8247ec24ff667215b7ed7d1d4d7f543a948d926721fe1e') throw Error('SCHOOL1539_TUESDAY_BASE');
 if(addition.version!==1 || addition.groups.length!==4) throw Error('SCHOOL1539_TUESDAY_SOURCE');
 const groups=school1539TuesdayIdentities.map(([code,card,listing,start,end],i)=>{
   const g=addition.groups[i];
   validateProjectedMosCard(g);
   if(g.groupCode!==code || g.cardId!==card || g.listingId!==listing || g.locationId!=='LOC-014' || g.address!==base.locations.find(l=>l.id==='LOC-014')?.address || JSON.stringify(g.slots)!==JSON.stringify([{weekday:'Вторник',start,end}]) || base.groups.some(r=>r.id===code || r.link===g.link)) throw Error('SCHOOL1539_TUESDAY_IDENTITY');
   return {id:code,programme:'shmi',...Object.fromEntries(rawKeys.map(k=>[k,g[k]])),linkKind:'card',limitedSource:false};
 });
 return {...structuredClone(base),sourceSha256:digest(canonical({version:1,base,addition})),groups:[...base.groups,...groups]};
}
