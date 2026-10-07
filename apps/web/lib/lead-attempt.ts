const attempts = new Map<string, string>();
/** Only a digest and random ID are persisted; never contact or child fields. */
export async function leadAttempt(payload: Record<string, unknown>, storage?: Pick<Storage, "getItem" | "setItem">) {
  const canonical = JSON.stringify(Object.fromEntries(Object.entries(payload)
    .filter(([key]) => !["consentAt", "submittedAt", "receivedAt", "requestId"].includes(key))
    .sort(([a], [b]) => a.localeCompare(b))));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  const key = "bm-lead-attempt:" + Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
  let id = attempts.get(key);
  try {
    storage ??= sessionStorage;
    const saved = storage.getItem(key);
    if (saved && /^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(saved)) id = saved;
  } catch { /* In-memory identity still protects retries if browser storage is blocked. */ }
  id ??= crypto.randomUUID();
  attempts.set(key, id);
  try { storage?.setItem(key, id); } catch { /* Storage can be unavailable. */ }
  return id;
}
