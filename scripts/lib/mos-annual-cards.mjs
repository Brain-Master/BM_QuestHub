/** Public mos.ru read adapter. Never authenticates, subscribes or submits applications. */
const API = "https://www.mos.ru/pgu2/activity/api";
const DAYS = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];
const digits = value => /^\d+$/.test(String(value ?? ""));
const count = value => Number.isSafeInteger(value) && value >= 0 ? value : null;
const date = value => {
  const match = String(value ?? "").match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  const iso = `${match[3]}-${match[2]}-${match[1]}`;
  return Number.isFinite(Date.parse(iso)) && new Date(iso).toISOString().startsWith(iso) ? iso : null;
};

/** Same public boundary constraints before counting an individual card successful. */
export function validateProjectedMosCard(card) {
  if (!digits(card.cardId) || !digits(card.listingId) || card.link !== `https://www.mos.ru/pgu2/activity/card/${card.cardId}` ||
    [card.groupCode,card.title,card.address,card.organization].some(v=>typeof v!=="string"||!v.trim()) ||
    !["open","closed"].includes(card.status) || (card.teacher!==null && typeof card.teacher!=="string")) throw Error("MOS_INVALID_CARD_FIELDS");
  for (const key of ["totalSeats","freeSeats","ageMin","ageMax","lessonPrice","coursePrice"]) {
    if(card[key]!==null && count(card[key])===null)throw Error("MOS_INVALID_CARD_FIELDS");
  }
  if (card.ageMin!==null && card.ageMax!==null && card.ageMin>card.ageMax) throw Error("MOS_INVALID_AGES");
  if (card.totalSeats!==null && card.freeSeats!==null && card.freeSeats>card.totalSeats)throw Error("MOS_INVALID_CAPACITY");
  for(const key of ["courseStart","courseEnd"]){const value=card[key];if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||!new Date(value).toISOString().startsWith(value))throw Error("MOS_INVALID_DATES_STATUS");}
  if(card.courseStart>card.courseEnd)throw Error("MOS_INVALID_DATES_STATUS");
  if(!Array.isArray(card.slots)||!card.slots.length)throw Error("MOS_MISSING_SLOTS");
  const keys=new Set();
  for(const s of card.slots){const key=`${s.weekday}:${s.start}:${s.end}`;
    if(!DAYS.includes(s.weekday)||!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(s.start)||!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(s.end)||s.start>=s.end||keys.has(key))throw Error("MOS_INVALID_SLOT");
    keys.add(key);
  }
  return card;
}

export async function requestMosJson(route, body, { fetchImpl = fetch, timeoutMs = 18000 } = {}) {
  if (!/^\/groups\/(?:\d+|search)$/.test(route)) throw Error("MOS_ROUTE_DENIED");
  if ((route === "/groups/search") !== (body !== undefined)) throw Error("MOS_METHOD_DENIED");
  const response = await fetchImpl(`${API}${route}`, {
    method: body === undefined ? "GET" : "POST", redirect: "error",
    signal: AbortSignal.timeout(timeoutMs),
    headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) throw Error(`MOS_HTTP_${response.status}`);
  if (!response.headers.get("content-type")?.includes("application/json")) throw Error("MOS_NON_JSON");
  const reader = response.body.getReader(); let size = 0; const chunks = [];
  try {
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength; if (size > 2_000_000) throw Error("MOS_RESPONSE_TOO_LARGE");
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  const payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (payload?.status !== "success" || !payload.data || typeof payload.data !== "object") throw Error("MOS_INVALID_RESPONSE");
  return payload.data;
}

export async function searchMosListing(listingId, options) {
  if (!digits(listingId)) throw Error("MOS_INVALID_LISTING");
  const items = []; const seen = new Set(); let expected;
  for (let page = 1; page <= 20; page++) {
    const data = await requestMosJson("/groups/search", { keyword: String(listingId), page, limit: 100, sortOrder: 1 }, options);
    if (!Array.isArray(data.items) || !Number.isSafeInteger(data.total) || data.total < 0) throw Error("MOS_INVALID_SEARCH");
    if (expected !== undefined && expected !== data.total) throw Error("MOS_SEARCH_CHANGED");
    expected = data.total;
    for (const item of data.items) {
      if (!digits(item.group?.id) || seen.has(String(item.group.id))) throw Error("MOS_SEARCH_DUPLICATE");
      seen.add(String(item.group.id)); items.push(item);
    }
    if (items.length >= expected) return items.filter(item => String(item.circle?.number) === String(listingId));
    if (!data.items.length) throw Error("MOS_SEARCH_INCOMPLETE");
  }
  throw Error("MOS_SEARCH_LIMIT");
}

/** Select only the requested group, never data.otherItems or sums of neighbours. */
export function projectMosCard(item, expected) {
  const group = item?.group, circle = item?.circle;
  if (!group || !circle || !digits(group.id) || String(circle.number) !== expected.listingId) throw Error("MOS_LISTING_MISMATCH");
  if (expected.groupCode && group.number !== expected.groupCode) throw Error("MOS_GROUP_MISMATCH");
  const courseStart = date(group.classStartDate), courseEnd = date(group.classEndDate);
  if (!courseStart || !courseEnd || courseStart > courseEnd || typeof group.isOpen !== "boolean") throw Error("MOS_INVALID_DATES_STATUS");
  const slots = []; const seen = new Set();
  for (const schedule of group.schedules ?? []) {
    for (const slot of schedule.dates ?? []) {
      if (!Number.isInteger(slot.day) || slot.day < 1 || slot.day > 7 ||
        !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(slot.startDate) ||
        !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(slot.endDate) || slot.startDate >= slot.endDate) throw Error("MOS_INVALID_SLOT");
      const key = `${slot.day}:${slot.startDate}:${slot.endDate}`;
      if (!seen.has(key)) slots.push({ weekday: DAYS[slot.day - 1], start: slot.startDate, end: slot.endDate });
      seen.add(key);
    }
  }
  if (!slots.length) throw Error("MOS_MISSING_SLOTS");
  const totalSeats = count(group.placeCount), freeSeats = count(group.freeSpace);
  if (totalSeats !== null && freeSeats !== null && freeSeats > totalSeats) throw Error("MOS_INVALID_CAPACITY");
  const prices = Array.isArray(group.prices) ? group.prices : [];
  const lessonPrice = count(prices.find(p => p.name === "За одно занятие")?.value);
  const coursePrice = count(prices.find(p => p.name === "За полный курс занятий")?.value);
  const teacher = (group.persons ?? []).map(p => p.fullName).filter(v => typeof v === "string" && v.trim()).join(", ") || null;
  return validateProjectedMosCard({
    cardId: String(group.id), listingId: String(circle.number), groupCode: group.number ?? null,
    title: group.name, address: group.fullAddress, organization: circle.organizationName,
    teacher, totalSeats, freeSeats, ageMin: count(group.ageFrom), ageMax: count(group.ageTo),
    lessonPrice, coursePrice, courseStart, courseEnd, slots,
    status: group.isOpen ? "open" : "closed", link: `https://www.mos.ru/pgu2/activity/card/${group.id}`,
  });
}

export async function fetchMosCard(cardId, expected, options) {
  if (!digits(cardId)) throw Error("MOS_INVALID_CARD");
  const data = await requestMosJson(`/groups/${cardId}`, undefined, options);
  if (String(data.item?.group?.id) !== String(cardId)) throw Error("MOS_CARD_MISMATCH");
  return projectMosCard(data.item, expected);
}
