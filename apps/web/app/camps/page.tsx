import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Осенние лагеря · Расписание BrainMaster", alternates: {canonical: "/agenda/?format=intensive"}, robots: {index:false,follow:true} };
export default function CampsPage() {return <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10"><h1 className="text-3xl font-bold">Осенние лагеря BrainMaster</h1><p className="my-4">Все группы и предварительная регистрация теперь в общем расписании квестов и смен.</p><Link className="inline-block rounded-lg bg-cyan-300 px-5 py-3 font-semibold text-slate-950" href="/agenda/?format=intensive">Открыть расписание лагерей</Link></main>;}
