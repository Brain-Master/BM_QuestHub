import {SchedulePage, type SchedulePageProps} from "@/components/schedule-page";
export {campusParams as generateStaticParams} from "@/components/schedule-page";
export const metadata = {title:"Всё расписание · BrainMaster"};
export default function Page({params}:SchedulePageProps){return <SchedulePage mode="all" params={params}/>;}
