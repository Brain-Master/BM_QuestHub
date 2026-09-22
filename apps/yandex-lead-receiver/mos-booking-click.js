"use strict";

const OFFERS_URL = "https://storage.yandexcloud.net/bm-questhub/data/offers-snapshot.json";
const VENUES_URL = "https://storage.yandexcloud.net/bm-questhub/data/v2/map-snapshot.json";
const EVENT = "booking.mos_click";
const fields = new Set(["event", "eventId", "questSlug", "offerId", "venueSlug", "variantId"]);
const id = value => typeof value === "string" && /^[\p{L}\p{N}_:. -]{1,320}$/u.test(value);
const slug = value => typeof value === "string" && /^[a-z0-9][a-z0-9-]{0,119}$/.test(value);
const html = value => String(value ?? "").slice(0, 320).replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[char]);

function validPayload(payload) {
  return !!payload && typeof payload === "object" && !Array.isArray(payload)
    && Object.keys(payload).every(key => fields.has(key))
    && payload.event === EVENT
    && typeof payload.eventId === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.eventId)
    && slug(payload.questSlug) && slug(payload.venueSlug) && id(payload.offerId)
    && (!Object.hasOwn(payload, "variantId") || id(payload.variantId));
}

function canonicalTarget(payload, offers, venues) {
  const candidates = offers?.offersByQuest?.[payload.questSlug];
  if (!Array.isArray(candidates) || !Array.isArray(venues?.venues)) return null;
  const matches = candidates.filter(o => o.id === payload.offerId && o.venueSlug === payload.venueSlug);
  const places = venues.venues.filter(v => v.slug === payload.venueSlug);
  if (matches.length !== 1 || places.length !== 1) return null;
  const offer = matches[0], venue = places[0];
  const variants = offer.scheduleCard?.variants ?? [];
  // The frontend creates an offer.id variant when a legacy card has no variants.
  const variant = payload.variantId ? variants.find(v => v.id === payload.variantId) : undefined;
  if (payload.variantId && !variant && !(variants.length === 0 && payload.variantId === offer.id)) return null;
  const url = variant?.mosBookingUrl ?? offer.mosBookingUrl;
  // Source is trusted for identity, not for arbitrary destinations/HTML.
  if (typeof url !== "string" || !/^https:\/\/(?:www\.)?mos\.ru\/pgu2\/activity\/(?:card\/\d+\/?|groups\?keyword=\d+)$/.test(url)) return null;
  return { offer, venue, variant, url };
}

function formatClickMessage(target) {
  const { offer, venue, variant, url } = target;
  return [
    "↗ <b>Нажата ссылка на mos.ru</b>",
    "Нажата ссылка. Это не заявка и не подтверждение записи.",
    "Контактные данные в этом событии не передаются.",
    "",
    `<b>${html(offer.scheduleCard?.displayTitle || offer.shiftLabel || offer.id)}</b>`,
    `Площадка: ${html(venue.name)}`,
    `Адрес: ${html(venue.address)}`,
    `Группа: ${html(offer.annual?.groupCode || offer.id)}`,
    `Время: ${html(variant?.time || offer.daySchedule)}`,
    `Вариант: ${html(variant?.type || "Основной")}`,
    `Статус в источнике: ${html(offer.annual?.admission === "closed" ? "Приём закрыт" : offer.sheetStatus || "Не указан")}`,
    `<a href="${html(url)}">Открыть карточку на mos.ru</a>`,
  ].join("\n");
}

/** All maps are per warm instance, bounded, ephemeral; not global anti-abuse or exactly-once. */
function createMosClickHandler({ boundedRequest, deliveryBudget, readEnv, response, now = Date.now }) {
  const ledger = new Map(), recentTargets = new Map(), canonicalTargets = new Map();
  let windowAt = 0, admitted = 0, sourceCache, sourceAt = 0, sourcePending;
  async function sources(budget) {
    if (sourceCache && now() - sourceAt < 30_000) return sourceCache;
    if (!sourcePending) {
      sourcePending = Promise.all([
        boundedRequest("mos_click_offers", OFFERS_URL, { redirect: "error", credentials: "omit" }, budget,
          { timeoutMs: 3000, maxResponseBytes: 2 * 1024 * 1024, validate: value => value?.version === 1 && !!value.offersByQuest }),
        boundedRequest("mos_click_venues", VENUES_URL, { redirect: "error", credentials: "omit" }, budget,
          { timeoutMs: 3000, maxResponseBytes: 2 * 1024 * 1024, validate: value => Array.isArray(value?.venues) }),
      ]).then(results => { sourceCache = results.map(result => result.json); sourceAt = now(); return sourceCache; })
        .finally(() => { sourcePending = undefined; });
    }
    return sourcePending;
  }
  return async (payload, origin, requestId) => {
    const origins = readEnv("ALLOWED_ORIGINS").split(",").map(s => s.trim()).filter(Boolean);
    // Fail closed for events; never change the existing lead CORS contract.
    if (!origin || !origins.includes(origin) || origin === "null" || origin === "*")
      return response(403, { ok: false, error: "Origin not allowed" }, origin);
    if (!validPayload(payload)) return response(400, { ok: false, error: "Invalid click event" }, origin);
    const time = now();
    for (const [key, entry] of ledger) if (time - entry.at >= 600_000) ledger.delete(key);
    for (const [key, at] of recentTargets) if (time - at >= 30_000) recentTargets.delete(key);
    for (const [key, at] of canonicalTargets) if (time - at >= 30_000) canonicalTargets.delete(key);
    const key = JSON.stringify([payload.questSlug, payload.offerId, payload.venueSlug, payload.variantId]);
    const previous = ledger.get(payload.eventId);
    if (previous) {
      if (previous.key !== key) return response(409, { ok: false, error: "Event identity conflict" }, origin);
      return response(previous.notified ? 200 : 202, { ok: true, notified: previous.notified, duplicate: true }, origin);
    }
    if (time - windowAt >= 60_000) { windowAt = time; admitted = 0; }
    if (ledger.size >= 256 || admitted >= 30 || recentTargets.has(key))
      return response(429, { ok: false, error: "Click notification limited" }, origin);
    admitted += 1;
    const entry = { key, at: time, notified: false };
    ledger.set(payload.eventId, entry);
    recentTargets.set(key, time);
    const budget = deliveryBudget(requestId, 8000);
    try {
      const token = readEnv("TELEGRAM_BOT_TOKEN", { required: true });
      const chatId = readEnv("TELEGRAM_CHAT_ID", { required: true });
      const [offers, venues] = await sources(budget);
      const target = canonicalTarget(payload, offers, venues);
      if (!target) return response(400, { ok: false, error: "Unknown booking target" }, origin);
      // Omitted/main/fallback variants can be aliases of the same portal card.
      // Reserve after lookup with no await before the Telegram POST.
      const canonicalKey = JSON.stringify([payload.questSlug, target.offer.id, target.venue.slug, target.url]);
      const recentCanonical = canonicalTargets.get(canonicalKey);
      if ((recentCanonical !== undefined && now() - recentCanonical < 30_000) || canonicalTargets.size >= 256)
        return response(429, { ok: false, error: "Click notification limited" }, origin);
      canonicalTargets.set(canonicalKey, now());
      await boundedRequest("mos_click_telegram", `https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST", redirect: "error", headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: formatClickMessage(target), parse_mode: "HTML", disable_web_page_preview: true }),
      }, budget, { timeoutMs: 3000, validate: json => json?.ok === true && Number.isInteger(json?.result?.message_id) });
      entry.notified = true;
      return response(200, { ok: true, notified: true }, origin);
    } catch {
      // Unknown delivery stays in the ledger; never retry an uncertain Telegram POST.
      return response(502, { ok: false, notified: false, error: "Click notification unavailable" }, origin);
    }
  };
}

module.exports = { createMosClickHandler, validPayload, canonicalTarget, formatClickMessage, OFFERS_URL, VENUES_URL };
