export type BookingAction =
  | { kind: "mos"; url: string }
  | { kind: "form" };

function isValidExternalBookingUrl(url: string | null | undefined): url is string {
  if (!url || typeof url !== "string") return false;
  const t = url.trim();
  if (!t.startsWith("https://") && !t.startsWith("http://")) return false;
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Определяет: внешняя запись или модалка с формой (нет валидной ссылки). */
export function resolveBookingAction(
  mosBookingUrl: string | null | undefined,
): BookingAction {
  if (isValidExternalBookingUrl(mosBookingUrl)) {
    return { kind: "mos", url: mosBookingUrl.trim() };
  }
  return { kind: "form" };
}
