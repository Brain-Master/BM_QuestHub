import type { AgendaOfferItem } from './agenda';
import { isOfferAutoArchived, resolveScheduleStatusKey } from './schedule-board';
export type CampSelection={school:string;venue:string;period:string;age:string;archive:boolean;programme?:string};
export function campActive(item:AgendaOfferItem,now?:Date){return !isOfferAutoArchived(item.offer,now)&&!['finished','cancelled'].includes(resolveScheduleStatusKey(item.offer,now));}
export function campAge(item:AgendaOfferItem):[number,number]|null {
 // Use the group's explicit age only; a generic course range is not proof.
 const label=item.offer.scheduleCard?.ageLabel??'';
 const match=label.match(/(\d+)\s*[-–—]\s*(\d+)/);return match?[Number(match[1]),Number(match[2])]:null;
}
export function campMatches(item:AgendaOfferItem,s:CampSelection,now?:Date) {
 if(item.quest.format==='year'||(!s.archive&&!campActive(item,now)))return false;
 if(s.school!=='all'&&(item.venue.schoolScopeSlug??item.venue.slug)!==s.school)return false;
 if(s.programme&&s.programme!=='all'&&item.quest.slug!==s.programme)return false;
 if(s.venue!=='all'&&item.venue.slug!==s.venue)return false;
 if(s.period==='pending'&&item.offer.startDate)return false;
 if(s.period!=='all'&&s.period!=='pending'&&item.offer.startDate&&item.offer.startDate!==s.period)return false;
 const ages=campAge(item);if(s.age!=='all'&&(!/^\d{1,2}$/.test(s.age)||+s.age<3||+s.age>18))return false;
 if(s.age!=='all'&&ages&&(+s.age<ages[0]||+s.age>ages[1]))return false;
 return true;
}
export function campNeedsClarification(item:AgendaOfferItem,s:CampSelection) {
 return (s.period!=='all'&&!item.offer.startDate)||(s.age!=='all'&&!campAge(item));
}
export function campSteps(items:AgendaOfferItem[],school?:string,venue?:string,now?:Date) {
 const active=items.filter(i=>campActive(i,now)&&(!school||(i.venue.schoolScopeSlug??i.venue.slug)===school)&&(!venue||i.venue.slug===venue));
 const places=new Set(active.map(i=>i.venue.slug));const dates=new Set(active.map(i=>i.offer.startDate).filter(Boolean));
 const unknownPlace=active.some(i=>/уточняется/i.test(i.venue.address));
 const unknownDate=active.some(i=>!i.offer.startDate);
 return [...((!venue&&(!school||places.size>1))||unknownPlace?['place']:[]),...(active.length&&(dates.size!==1||unknownDate)?['dates']:[]),'age','results'];
}

/** Public filter links remain useful; bare camp routes start with the guided flow. */
export function campPresentation(query:Pick<URLSearchParams,'get'|'has'>,steps:string[],embedded=false){
 const wizard=!embedded&&query.get('view')!=='catalogue';
 const requested=query.get('step');
 const hasFilters=['school','venue','campus','programme','period','age','archive'].some(key=>query.has(key));
 const step=!wizard||query.get('offer')?'results':requested&&steps.includes(requested)?requested:hasFilters&&!requested?'results':steps[0];
 return {wizard,step};
}
export function campChoiceCount(items:AgendaOfferItem[],selection:CampSelection,field:'school'|'venue'|'programme'|'period'|'age',value:string,now?:Date){
 const next={...selection,[field]:value};
 if(field==='school'){next.venue='all';next.period='all';}
 if(field==='venue')next.period='all';
 return items.filter(item=>campMatches(item,next,now)).length;
}
