import {notFound} from 'next/navigation';
import {UnifiedWizard} from './unified-wizard';
import {loadQuestsShell,loadScheduleSnapshotGeneratedAt,loadVenues,loadWorlds} from '@/lib/content/load';
import {getSchoolScopes,resolveSchoolScope} from '@/lib/offers/agenda';
export async function wizardSchoolParams(){return getSchoolScopes(await loadVenues()).flatMap(s=>s.routeSlugs.map(school=>({school})));}
export async function WizardPage({params}:{params?:Promise<{school:string}>}){
 const [baseQuests,venues,worlds,initialSnapshotGeneratedAt,route]=await Promise.all([loadQuestsShell(),loadVenues(),loadWorlds(),loadScheduleSnapshotGeneratedAt(),params]);
 const school=route?resolveSchoolScope(venues,route.school):undefined;if(route&&!school)notFound();
 return <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10"><UnifiedWizard baseQuests={baseQuests} venues={venues} worlds={worlds} initialSnapshotGeneratedAt={initialSnapshotGeneratedAt} schoolSlug={school?.slug}/></main>;
}
