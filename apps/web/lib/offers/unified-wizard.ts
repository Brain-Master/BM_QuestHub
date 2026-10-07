import type {AgendaOfferItem} from './agenda';
import {campActive} from './camp-finder';
export type ActivityCategory='year'|'camp'|'other';
export const categoryLabels:Record<ActivityCategory,string>={year:'Годовые курсы',camp:'Лагерные смены',other:'Квесты и другие мероприятия'};
/** Existing intensives remain camps; only explicit source format can identify another event. */
export function activityCategory(item:AgendaOfferItem):ActivityCategory {
 if(item.quest.format==='year')return 'year';
 return /квест|мастер[ -]?класс|мероприятие/i.test(item.offer.scheduleCard?.formatType??'')?'other':'camp';
}
export function scopedActivities(items:AgendaOfferItem[],school:string,venue:string,now:Date){
 return items.filter(i=>campActive(i,now)&&(school==='all'||(i.venue.schoolScopeSlug??i.venue.slug)===school)&&(venue==='all'||i.venue.slug===venue));
}
export function availableCategories(items:AgendaOfferItem[]){
 return (['year','camp','other'] as const).map(kind=>({kind,label:categoryLabels[kind],count:items.filter(i=>activityCategory(i)===kind).length})).filter(c=>c.count>0);
}
export function wizardHref(school?:string,venue?:string){
 const q=new URLSearchParams();if(venue&&venue!=='all')q.set('venue',venue);
 const path=school&&school!=='all'?`/sites/${encodeURIComponent(school)}/wizard/`:'/wizard/';
 return path+(q.size?'?'+q:'');
}

export function resolveWizardCategory(categories:ReturnType<typeof availableCategories>,requested:string|null,ready:boolean){
 const kind=requested??(ready&&categories.length===1?categories[0].kind:null);
 return {kind,missing:!!kind&&kind!=='all'&&!categories.some(c=>c.kind===kind)};
}

/** Mixed results expose only location and age; stale format-specific filters cannot restrict them. */
export function sharedAgeQuery(query: Pick<URLSearchParams, 'get'>): URLSearchParams {
 const result=new URLSearchParams();
 for(const key of ['school','venue','campus','age']){const value=query.get(key);if(value)result.set(key,value);}
 return result;
}
