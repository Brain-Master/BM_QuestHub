import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LiveAgenda } from "@/components/live-agenda";
import { loadQuests, loadVenues, loadWorlds } from "@/lib/content/load";

type Props={params:Promise<{school:string;campus:string}>};
export async function generateStaticParams(){
  return (await loadVenues()).map(v=>({school:v.schoolScopeSlug??v.slug,campus:v.slug}));
}
async function campusFor({params}:Props){
  const {school,campus}=await params;
  const venues=await loadVenues();
  const venue=venues.find(v=>v.slug===campus&&(v.schoolScopeSlug??v.slug)===school);
  if(!venue)notFound();
  return {school,venue,venues};
}
export async function generateMetadata(props:Props):Promise<Metadata>{
  const {venue}=await campusFor(props);
  return {title:`Расписание · ${venue.name} · ${venue.address}`,description:`Группы BrainMaster по адресу ${venue.address}: дни, время занятий и запись.`};
}
export default async function CampusAgenda(props:Props){
  const {school,venue,venues}=await campusFor(props);
  const [quests,worlds]=await Promise.all([loadQuests(),loadWorlds()]);
  const map=venue.latitude!==undefined&&venue.longitude!==undefined?`https://yandex.ru/maps/?pt=${venue.longitude},${venue.latitude}&z=17&l=map`:null;
  return <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-8">
    <nav aria-label="Хлебные крошки" className="mb-6 flex flex-wrap gap-2 text-sm"><Link href="/sites/">Площадки</Link><span aria-hidden>/</span><Link href={`/sites/${school}/`}>{venue.name}</Link><span aria-hidden>/</span><span aria-current="page">Расписание корпуса</span></nav>
    <header className="mb-6 space-y-2"><p className="break-words text-lg">{venue.name} · {venue.address}</p>{map&&<a href={map} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-primary underline">Здание на карте — новое окно</a>}</header>
    <LiveAgenda baseQuests={quests} venues={venues} worlds={worlds} schoolSlug={school} venueSlug={venue.slug} schoolName={venue.name} hideScheduleTitle hideCommunityPanel />
    <p className="mt-8"><Link href={`/sites/${school}/agenda/`} className="text-primary underline">Все корпуса этой школы</Link></p>
  </main>;
}
