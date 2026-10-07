"use client";
import {Suspense,useEffect} from 'react';
import {useRouter,useSearchParams} from 'next/navigation';
import Link from 'next/link';
function Redirect(){const router=useRouter(),query=useSearchParams();const next=new URLSearchParams(query);next.delete('format');const href='/camp/'+(next.size?'?'+next:'');useEffect(()=>{router.replace(href);},[router,href]);return <Link href={href}>Открыть лагерные смены →</Link>;}
export function ScheduleRedirect(){return <Suspense fallback={<Link href="/camp/">Открыть лагерные смены →</Link>}><Redirect/></Suspense>;}
