"use client";

import { useState } from "react";
import source from "@/content/autumn-camps-2026.json";
import { BookingForm } from "@/components/booking-form";
import { LeadFormSuccess } from "@/components/lead-form-success";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { resolveRegistrationFlow } from "@/lib/registration-flow";
import { SCHEDULE_CTA } from "@/lib/offers/schedule-dictionaries";

const flow = resolveRegistrationFlow({ bookingMode: { kind: "waitlist", label: SCHEDULE_CTA.preliminary }, registrationChannel: "brainmaster" });
type Camp = (typeof source.offers)[number];
const schoolName = (camp: Camp) => camp.school === "ЭКТ" ? "МДЮЦ ЭКТ" : `Школа № ${camp.school}`;
const dates = (camp: Camp) => camp.startDate && camp.endDate ? `${camp.startDate.split("-").reverse().join(".")} — ${camp.endDate.split("-").reverse().join(".")}` : "Даты уточняются";
const hours = (camp: Camp) => camp.startTime && camp.endTime ? `${camp.startTime}–${camp.endTime}` : "Понедельник и вторник, по 2 часа. Время уточняется";
const price = (camp: Camp) => camp.priceRub === null ? "Цена уточняется" : `${camp.priceRub.toLocaleString("ru-RU")} ₽${camp.priceProvisional ? " · предварительная стоимость" : ""}`;

export function AutumnCamps({ schoolSlug }: { schoolSlug?: string }) {
  const [selected, setSelected] = useState<Camp | null>(null);
  const [success, setSuccess] = useState(false);
  const camps = source.offers.filter(c => !schoolSlug || c.schoolSlug === schoolSlug);
  if (!source.publicationEnabled || !camps.length) return null;
  function close() { setSelected(null); setSuccess(false); }
  return <section className="my-8" aria-label="Осенние лагеря 2026">
    <h2 className="text-2xl font-semibold">Осенние интенсивы · предварительная запись</h2>
    <p className="mt-3 max-w-3xl text-slate-300">Оставьте заявку BrainMaster: мы свяжемся с вами и подтвердим расписание, площадку и условия участия. Предварительная заявка не означает зачисление или бронирование места. Оплачивать сейчас ничего не нужно.</p>
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      {camps.map(camp => <article key={camp.id} data-camp-id={camp.id} className="flex flex-col gap-3 rounded-2xl border border-cyan-400/20 bg-slate-900/70 p-5">
        <p className="text-sm font-semibold text-cyan-200">{schoolName(camp)}</p>
        <h3 className="text-xl font-semibold">{camp.program}</h3>
        <p className="text-sm text-slate-300">{camp.address ?? "Адрес корпуса уточняется"}</p>
        <p>{dates(camp)}<br /><span className="text-sm text-slate-300">{hours(camp)}</span></p>
        {camp.description && <p className="text-sm text-slate-300">{camp.description}</p>}
        {camp.brainmasterOnlyPartOfSchoolIntensive && <p className="text-sm text-amber-200">BrainMaster проводит только два занятия в рамках школьного интенсива. Указанная стоимость — 9 500 ₽; состав программы и что входит в стоимость уточняются.</p>}
        {camp.programPendingConfirmation && <p className="text-sm text-slate-300">Подробности программы уточняются.</p>}
        <p className="mt-auto font-semibold">{price(camp)}</p>
        <button type="button" className="min-h-11 rounded-lg bg-cyan-300 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-200" onClick={() => { setSuccess(false); setSelected(camp); }}>Предварительная регистрация</button>
        {camp.mosBookingUrl && <a className="text-sm text-cyan-200 underline" href={camp.mosBookingUrl} target="_blank" rel="noopener noreferrer">Карточка и запись на mos.ru ↗</a>}
      </article>)}
    </div>
    <Dialog open={selected !== null} onOpenChange={open => { if (!open) close(); }}>
      <DialogContent className="z-[110] max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>Предварительная регистрация BrainMaster</DialogTitle></DialogHeader>
        {selected && (success ? <LeadFormSuccess title="Предварительная заявка принята" text="Мы свяжемся с вами, чтобы уточнить условия участия. Зачисление и место пока не подтверждены." onClose={close} /> : <>
          <div className="text-sm text-slate-300"><p className="font-semibold text-white">{selected.program} · {schoolName(selected)}</p><p>{selected.address ?? "Адрес корпуса уточняется"}</p><p>{dates(selected)} · {hours(selected)}</p><p>{price(selected)}</p></div>
          <BookingForm key={selected.id} defaults={{ leadType: "waitlist", registrationChannel: "brainmaster", questSlug: "autumn-camps-2026", questTitle: `Осень 2026 · ${selected.program}`, offerId: selected.id, venueSlug: selected.id, venueName: `${schoolName(selected)} · ${selected.address ?? "корпус уточняется"}`, schoolSlug: selected.schoolSlug, variantId: selected.id, variantTitle: `${dates(selected)}; ${hours(selected)}; ${price(selected)}` }} flowContext={flow} submitLabel="Отправить предварительную заявку" onSuccess={() => setSuccess(true)} />
        </>)}
      </DialogContent>
    </Dialog>
  </section>;
}
