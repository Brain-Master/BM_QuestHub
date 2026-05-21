import type { LeadPayload } from "@/lib/schemas";

export type SubmitLeadResult =
  | { ok: true }
  | { ok: false; error: string };

const leadSubmitUrl = process.env.NEXT_PUBLIC_LEAD_SUBMIT_URL?.trim() ?? "";
const opsReportUrl = process.env.NEXT_PUBLIC_OPS_REPORT_URL?.trim() ?? "";

const LEAD_SNAPSHOT_FIELDS = [
  "leadType",
  "registrationChannel",
  "questSlug",
  "questTitle",
  "offerId",
  "venueSlug",
  "venueName",
  "parentName",
  "contact",
  "childName",
  "childAge",
] as const;

function pickLeadSnapshot(data: LeadPayload) {
  const lead: Record<string, string> = {};
  for (const field of LEAD_SNAPSHOT_FIELDS) {
    const value = data[field];
    if (typeof value === "string" && value.trim().length > 0) {
      lead[field] = value.trim();
    }
  }
  return Object.keys(lead).length > 0 ? lead : undefined;
}

function reportClientLeadFailure({
  errorCode,
  errorMessage,
  httpStatus = 0,
  data,
}: {
  errorCode: "invalid_payload" | "delivery_failed" | "network" | "not_configured";
  errorMessage: string;
  httpStatus?: number;
  data: LeadPayload;
}) {
  if (!opsReportUrl) return;

  void fetch(opsReportUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: "lead.client_submit_failed",
      source: "bm-questhub-static",
      occurredAt: new Date().toISOString(),
      httpStatus,
      errorCode,
      errorMessage,
      lead: pickLeadSnapshot(data),
    }),
  }).catch(() => {});
}

export async function submitLeadToYandex(
  data: LeadPayload,
): Promise<SubmitLeadResult> {
  if (!leadSubmitUrl) {
    reportClientLeadFailure({
      errorCode: "not_configured",
      errorMessage: "Приём заявок пока не настроен. Напишите нам напрямую.",
      data,
    });
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
      reportClientLeadFailure({
        errorCode: "delivery_failed",
        errorMessage: "Сервис заявок временно недоступен",
        httpStatus: res.status,
        data,
      });
      return { ok: false, error: "Сервис заявок временно недоступен" };
    }

    return { ok: true };
  } catch {
    reportClientLeadFailure({
      errorCode: "network",
      errorMessage: "Не удалось отправить заявку. Попробуйте ещё раз.",
      data,
    });
    return { ok: false, error: "Не удалось отправить заявку. Попробуйте ещё раз." };
  }
}
