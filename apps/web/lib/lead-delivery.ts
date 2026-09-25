/** Transport confirmation only. No automatic retries: an uncertain POST may have arrived. */
export class LeadDeliveryError extends Error {
  constructor(readonly errorCode: "delivery_failed" | "network", readonly httpStatus = 0) {
    super("LEAD_DELIVERY_UNCONFIRMED");
    this.name = "LeadDeliveryError";
  }
}

export async function confirmLeadDelivery(url: string, payload: unknown, {
  fetchImpl = fetch, timeoutMs = 35_000,
}: { fetchImpl?: typeof fetch; timeoutMs?: number } = {}): Promise<void> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { reject(new LeadDeliveryError("network")); controller.abort(); }, timeoutMs);
  });
  const request = async () => {
    const response = await fetchImpl(url, {
      method: "POST", redirect: "error", signal: controller.signal,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    if (controller.signal.aborted) throw new LeadDeliveryError("network");
    if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) throw new LeadDeliveryError("delivery_failed", response.status);
    const reader = response.body?.getReader();
    if (!reader) throw new LeadDeliveryError("delivery_failed", response.status);
    const cancel = () => { void reader.cancel().catch(() => {}); };
    controller.signal.addEventListener("abort", cancel, { once: true });
    let size = 0; let text = ""; const decoder = new TextDecoder();
    try {
      for (;;) {
        const { done, value } = await reader.read(); if (done) break;
        size += value.byteLength;
        if (size > 32_768) throw Error("LEAD_DELIVERY_UNCONFIRMED");
        text += decoder.decode(value, { stream: true });
      }
      text += decoder.decode();
      const result: unknown = JSON.parse(text);
      if (!result || typeof result !== "object" || !("ok" in result) || result.ok !== true) throw Error("LEAD_DELIVERY_UNCONFIRMED");
    } catch { throw new LeadDeliveryError("delivery_failed", response.status); }
    finally { controller.signal.removeEventListener("abort", cancel); cancel(); }
  };
  try { await Promise.race([request(), deadline]); }
  finally { clearTimeout(timer); controller.abort(); }
}
