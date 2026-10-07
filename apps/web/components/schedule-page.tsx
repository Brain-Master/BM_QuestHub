import {notFound} from 'next/navigation';
import {LiveAgenda} from '@/components/live-agenda';
import {loadQuestsShell,loadScheduleSnapshotGeneratedAt,loadVenues,loadWorlds} from '@/lib/content/load';
import {resolveScheduleRoute,scheduleRouteParams,type ScheduleMode} from '@/lib/offers/schedule-routes';
export type SchedulePageProps={params:Promise<{school?:string;campus?:string}>};
export async function schoolParams(){return scheduleRouteParams(await loadVenues());}
export async function campusParams(){return scheduleRouteParams(await loadVenues(),true);}
export async function SchedulePage({mode,params}:{mode:ScheduleMode;params?:SchedulePageProps['params']}) {
 const [baseQuests,venues,worlds,initialSnapshotGeneratedAt,route]=await Promise.all([loadQuestsShell(),loadVenues(),loadWorlds(),loadScheduleSnapshotGeneratedAt(),params??Promise.resolve({school:undefined,campus:undefined})]);
 const scope=resolveScheduleRoute(venues,route.school,route.campus);if(!scope.valid)notFound();
 return <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10"><LiveAgenda baseQuests={baseQuests} venues={venues} worlds={worlds} initialSnapshotGeneratedAt={initialSnapshotGeneratedAt} mode={mode} schoolSlug={scope.school?.slug} schoolName={scope.school?.name} venueSlug={scope.venue?.slug}/></main>;
}
