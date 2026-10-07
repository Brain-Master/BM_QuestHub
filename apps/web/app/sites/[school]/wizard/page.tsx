import {WizardPage,wizardSchoolParams} from '@/components/wizard-page';
export const metadata={title:'Подобрать занятия на площадке · BrainMaster'};
export const generateStaticParams=wizardSchoolParams;
export const dynamicParams=false;
export default function Page({params}:{params:Promise<{school:string}>}){return <WizardPage params={params}/>;}
