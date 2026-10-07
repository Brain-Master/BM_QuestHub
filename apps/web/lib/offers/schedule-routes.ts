import type { Venue } from '../schemas';
import { getSchoolScopes, resolveSchoolScope } from './agenda';
export type ScheduleMode = 'all' | 'year' | 'camp';
export const scheduleRoots: Record<ScheduleMode,string> = {all:'/agenda/',year:'/courses/',camp:'/camp/'};
export const shortSchool = (school:string) => school.replace(/^school-/, '');
export function shortCampus(venue:Venue):string {
 if(/уточняется/i.test(venue.address))return 'address-pending';
 const school=shortSchool(venue.schoolScopeSlug??venue.slug);
 return venue.slug.replace(new RegExp(`^school-${school}-`),'').replace(new RegExp(`^autumn-2026-${school}-`),'').replace(/-venue$/,'');
}
export function scheduleHref(mode:ScheduleMode, school?:string, venue?:string, venues:Venue[]=[]):string {
 const scope=school&&school!=='all'?resolveSchoolScope(venues,school):undefined;
 const query=new URLSearchParams();let path=scheduleRoots[mode];
 if(scope)path+=`${shortSchool(scope.slug)}/`;
 else if(school&&school!=='all')query.set('school',school);
 if(venue&&venue!=='all'){
  const campus=scope?.venues.find(v=>v.slug===venue);
  if(campus)path+=`${shortCampus(campus)}/`;else query.set('venue',venue);
 }
 return path+(query.size?`?${query}`:'');
}
export function scheduleRouteParams(venues:Venue[],campus=false) {
 return getSchoolScopes(venues).flatMap(s=>campus?s.venues.map(v=>({school:shortSchool(s.slug),campus:shortCampus(v)})):[{school:shortSchool(s.slug)}]);
}
export function resolveScheduleRoute(venues:Venue[],school?:string,campus?:string) {
 const scope=school?resolveSchoolScope(venues,school):undefined;
 const venue=campus?scope?.venues.find(v=>shortCampus(v)===campus):undefined;
 return {school:scope,venue,valid:(!school||!!scope)&&(!campus||!!venue)};
}
export function modeFromPath(path:string):ScheduleMode {
 return path.startsWith('/camp/')||path==='/camp'?'camp':path.startsWith('/courses/')||path==='/courses'?'year':'all';
}
