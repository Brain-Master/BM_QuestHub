import {ScheduleRedirect} from '@/components/schedule-redirect';
export const metadata={title:'Лагерные смены',alternates:{canonical:'/camp/'},robots:{index:false,follow:true}};
export default function Page(){return <main className="mx-auto max-w-6xl px-4 py-10"><h1 className="mb-4 text-3xl font-bold">Лагерные смены BrainMaster</h1><ScheduleRedirect/></main>;}
