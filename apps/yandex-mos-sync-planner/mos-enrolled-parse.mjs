const CARD_PATH_RE = /\/pgu2\/activity\/card\/(\d+)\/?$/i;

/** @param {string | undefined | null} raw */
export function normalizeMosActivityUrl(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    if (!/\.?mos\.ru$/i.test(u.hostname)) return null;
    const m = u.pathname.match(CARD_PATH_RE);
    if (!m) return null;
    return `https://www.mos.ru/pgu2/activity/card/${m[1]}`;
  } catch {
    return null;
  }
}

/** @param {string} normalizedUrl */
export function cardIdFromMosUrl(normalizedUrl) {
  const m = normalizedUrl.match(CARD_PATH_RE);
  return m?.[1] ?? null;
}

/**
 * @param {unknown} value
 * @returns {number | undefined}
 */
function asHeadcount(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const n = Math.round(value);
  if (n < 0 || n > 5000) return undefined;
  return n;
}

/**
 * Deep-search JSON for enrollment / capacity.booked.
 * @param {unknown} root
 * @returns {{ count: number, source: string } | null}
 */
export function extractEnrolledFromJson(root) {
  /** @type {{ count: number, source: string, priority: number }[]} */
  const hits = [];

  /** @param {unknown} node @param {string} path */
  function walk(node, path) {
    if (node === null || node === undefined) return;
    if (typeof node !== "object") return;

    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) walk(node[i], `${path}[${i}]`);
      return;
    }

    const obj = /** @type {Record<string, unknown>} */ (node);

    if (obj.capacity && typeof obj.capacity === "object" && !Array.isArray(obj.capacity)) {
      const cap = /** @type {Record<string, unknown>} */ (obj.capacity);
      const booked = asHeadcount(cap.booked);
      if (booked !== undefined) {
        hits.push({ count: booked, source: `${path}.capacity.booked`, priority: 0 });
      }
      const enrolled = asHeadcount(cap.enrolled);
      if (enrolled !== undefined) {
        hits.push({ count: enrolled, source: `${path}.capacity.enrolled`, priority: 1 });
      }
    }

    for (const [key, val] of Object.entries(obj)) {
      const kl = key.toLowerCase();
      if (
        [
          "enrolled",
          "booked",
          "registered",
          "registeredcount",
          "enrollmentcount",
          "countenrolled",
          "occupiedcount",
          "currentenrollment",
          "applicationcount",
          "applicationscount",
        ].includes(kl)
      ) {
        const n = asHeadcount(val);
        if (n !== undefined) {
          hits.push({
            count: n,
            source: `${path}.${key}`,
            priority: kl === "booked" ? 2 : 3,
          });
        }
      }
      walk(val, path ? `${path}.${key}` : key);
    }
  }

  walk(root, "");
  if (hits.length === 0) return null;
  hits.sort((a, b) => a.priority - b.priority);
  const best = hits[0];
  return { count: best.count, source: best.source };
}

const GROUP_COUNT_KEYS = [
  "booked",
  "enrolled",
  "registered",
  "occupied",
  "applications_count",
  "applicationcount",
  "count_enrolled",
  "current_enrollment",
];

/**
 * placeCount - freeSpace on a mos.ru group object.
 * @param {Record<string, unknown>} g
 */
function enrolledFromPlaceAndFree(g) {
  const total = asHeadcount(g.placeCount) ?? asHeadcount(g.place_count);
  const free = asHeadcount(g.freeSpace) ?? asHeadcount(g.free_space);
  if (total === undefined || free === undefined) return undefined;
  const booked = total - free;
  if (booked < 0 || booked > total) return undefined;
  return booked;
}

/**
 * GET /pgu2/activity/api/groups/{cardId}
 * @param {unknown} root
 * @returns {{ count: number, source: string } | null}
 */
export function extractEnrolledFromGroupsApi(root) {
  if (root && typeof root === "object" && !Array.isArray(root)) {
    const o = /** @type {Record<string, unknown>} */ (root);
    const data = o.data;
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const d = /** @type {Record<string, unknown>} */ (data);
      const item = d.item;
      if (item && typeof item === "object" && !Array.isArray(item)) {
        const it = /** @type {Record<string, unknown>} */ (item);
        const group = it.group;
        if (group && typeof group === "object" && !Array.isArray(group)) {
          const n = enrolledFromPlaceAndFree(
            /** @type {Record<string, unknown>} */ (group),
          );
          if (n !== undefined) {
            return { count: n, source: "data.item.group.placeCount-freeSpace" };
          }
        }
      }
      const other = d.otherItems;
      if (Array.isArray(other) && other.length > 0) {
        let sum = 0;
        let parts = 0;
        for (const entry of other) {
          if (!entry || typeof entry !== "object") continue;
          const g = /** @type {Record<string, unknown>} */ (entry).group;
          if (!g || typeof g !== "object") continue;
          const n = enrolledFromPlaceAndFree(
            /** @type {Record<string, unknown>} */ (g),
          );
          if (n !== undefined) {
            sum += n;
            parts++;
          }
        }
        if (parts > 0) {
          return { count: sum, source: `data.otherItems[${parts}].group` };
        }
      }
    }
  }

  const candidates = [];
  if (Array.isArray(root)) candidates.push(root);
  if (root && typeof root === "object") {
    const o = /** @type {Record<string, unknown>} */ (root);
    for (const key of ["groups", "data", "items", "result"]) {
      const v = o[key];
      if (Array.isArray(v)) candidates.push(v);
      if (v && typeof v === "object" && !Array.isArray(v)) {
        const inner = /** @type {Record<string, unknown>} */ (v);
        for (const k2 of ["groups", "items", "list"]) {
          if (Array.isArray(inner[k2])) candidates.push(inner[k2]);
        }
        const group = inner.group;
        if (group && typeof group === "object") {
          const n = enrolledFromPlaceAndFree(
            /** @type {Record<string, unknown>} */ (group),
          );
          if (n !== undefined) {
            return { count: n, source: "group.placeCount-freeSpace" };
          }
        }
      }
    }
  }

  for (const groups of candidates) {
    let sum = 0;
    let parts = 0;
    for (const item of groups) {
      if (!item || typeof item !== "object") continue;
      const g = /** @type {Record<string, unknown>} */ (item);
      let n = enrolledFromPlaceAndFree(g);
      if (g.group && typeof g.group === "object") {
        n = enrolledFromPlaceAndFree(
          /** @type {Record<string, unknown>} */ (g.group),
        );
      }
      if (g.capacity && typeof g.capacity === "object") {
        const cap = /** @type {Record<string, unknown>} */ (g.capacity);
        n =
          asHeadcount(cap.booked) ??
          asHeadcount(cap.enrolled) ??
          asHeadcount(cap.occupied);
      }
      if (n === undefined) {
        for (const key of GROUP_COUNT_KEYS) {
          const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
          n = asHeadcount(g[key]) ?? asHeadcount(g[camel]);
          if (n !== undefined) break;
        }
      }
      if (n !== undefined) {
        sum += n;
        parts++;
      }
    }
    if (parts > 0) {
      return { count: sum, source: `groups[${parts}].sum` };
    }
  }

  return extractEnrolledFromJson(root);
}

/**
 * @param {string} html
 * @returns {{ count: number, source: string } | null}
 */
export function extractEnrolledFromHtml(html) {
  const next = html.match(
    /<script[^>]+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i,
  );
  if (next?.[1]) {
    try {
      const data = JSON.parse(next[1]);
      const fromJson = extractEnrolledFromJson(data);
      if (fromJson) return { ...fromJson, source: `__NEXT_DATA__:${fromJson.source}` };
    } catch {
      /* fall through */
    }
  }

  const state = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});/);
  if (state?.[1]) {
    try {
      const data = JSON.parse(state[1]);
      const fromJson = extractEnrolledFromJson(data);
      if (fromJson) return { ...fromJson, source: `__INITIAL_STATE__:${fromJson.source}` };
    } catch {
      /* fall through */
    }
  }

  const jsonLd = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const m of jsonLd) {
    try {
      const data = JSON.parse(m[1]);
      const fromJson = extractEnrolledFromJson(data);
      if (fromJson) return { ...fromJson, source: `ld+json:${fromJson.source}` };
    } catch {
      /* continue */
    }
  }

  const recorded = html.match(
    /(?:записан[оаы]*|занято|оформлен[оаы]*)\s*[:\-]?\s*(\d{1,4})/i,
  );
  if (recorded?.[1]) {
    const n = Number(recorded[1]);
    if (Number.isFinite(n) && n >= 0 && n <= 5000) {
      return { count: n, source: "text:записано" };
    }
  }

  const ofTotal = html.match(/(\d{1,4})\s*(?:из|\/)\s*(\d{1,4})\s*мест/i);
  if (ofTotal?.[1] && ofTotal?.[2]) {
    const booked = Number(ofTotal[1]);
    const total = Number(ofTotal[2]);
    if (
      Number.isFinite(booked) &&
      Number.isFinite(total) &&
      booked >= 0 &&
      booked <= total &&
      total <= 5000
    ) {
      return { count: booked, source: "text:N из M мест" };
    }
  }

  const freeLeft = html.match(/(?:свободн[оаы]*|осталось)\s*(\d{1,4})\s*(?:из|\/)\s*(\d{1,4})/i);
  if (freeLeft?.[1] && freeLeft?.[2]) {
    const free = Number(freeLeft[1]);
    const total = Number(freeLeft[2]);
    if (Number.isFinite(free) && Number.isFinite(total) && free >= 0 && total >= free) {
      return { count: total - free, source: "text:свободно из" };
    }
  }

  return null;
}

/**
 * Try to parse any JSON blobs embedded in HTML (API responses inlined in SPA).
 * @param {string} html
 */
export function extractEnrolledFromEmbeddedJson(html) {
  const re = /\{[^{}]*"(?:booked|enrolled|capacity)"[^{}]*\}/g;
  for (const chunk of html.match(re) ?? []) {
    try {
      const data = JSON.parse(chunk);
      const hit = extractEnrolledFromJson(data);
      if (hit) return { ...hit, source: `embedded:${hit.source}` };
    } catch {
      /* continue */
    }
  }
  return null;
}
