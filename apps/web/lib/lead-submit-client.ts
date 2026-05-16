import type { LeadPayload } from "@/lib/schemas";

export type SubmitLeadResult =
  | { ok: true }
  | { ok: false; error: string };

const leadSubmitUrl = process.env.NEXT_PUBLIC_LEAD_SUBMIT_URL?.trim() ?? "";

export async function submitLeadToYandex(
  data: LeadPayload,
): Promise<SubmitLeadResult> {
  if (!leadSubmitUrl) {
    return {
      ok: false,
      error: "Приём заявок пока не настроен. Напишите нам напрямую.",
    };
  }

  try {
    const res = await fetch(leadSubmitUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        submittedAt: new Date().toISOString(),
        source: "bm-questhub-static",
      }),
    });

    if (!res.ok) {
      return { ok: false, error: "Сервис заявок временно недоступен" };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Не удалось отправить заявку. Попробуйте ещё раз." };
  }
}
