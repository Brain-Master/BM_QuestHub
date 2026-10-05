import type { Metadata } from "next";
import { AutumnCamps } from "@/components/autumn-camps";
export const metadata: Metadata = { title: "Осенние лагеря 2026 · BrainMaster", description: "Осенние инженерные интенсивы. Предварительная регистрация BrainMaster.", alternates: { canonical: "/camps/" } };
export default function CampsPage() {
  return <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10"><h1 className="text-3xl font-bold">Осенние лагеря BrainMaster · 2026</h1><AutumnCamps /></main>;
}
