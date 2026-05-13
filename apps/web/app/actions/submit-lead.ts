"use server";

import { leadSchema, type LeadPayload } from "@/lib/schemas";

export type SubmitLeadResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitLead(
  data: LeadPayload,
): Promise<SubmitLeadResult> {
  const parsed = leadSchema.safeParse(data);
  if (!parsed.success) {
    const msg =
      parsed.error.flatten().fieldErrors.contact?.[0] ??
      parsed.error.flatten().fieldErrors.parentName?.[0] ??
      parsed.error.flatten().fieldErrors.consent?.[0] ??
      "Проверьте поля формы";
    return { ok: false, error: msg };
  }

  const webhook = process.env.LEAD_WEBHOOK_URL;
  const payload = {
    ...parsed.data,
    receivedAt: new Date().toISOString(),
  };

  if (webhook) {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      return { ok: false, error: "Сервис заявок временно недоступен" };
    }
  }

  return { ok: true };
}
