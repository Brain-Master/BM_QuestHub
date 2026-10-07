import {SchedulePage, type SchedulePageProps} from "@/components/schedule-page";
export {schoolParams as generateStaticParams} from "@/components/schedule-page";
export const metadata = {title:"Лагерные смены · BrainMaster"};
export default function Page({params}:SchedulePageProps){return <SchedulePage mode="camp" params={params}/>;}
