import https from "node:https";

import {
  cookieHeaderFromJar,
  getMosCookieJar,
  isMosAuthFailure,
  trackMosSetCookie,
} from "./mos-enrolled-cookie-store.mjs";
import { mosSyncDebug } from "./mos-sync-debug.mjs";
import {
  cardIdFromMosUrl,
  extractEnrolledFromEmbeddedJson,
  extractEnrolledFromGroupsApi,
  extractEnrolledFromHtml,
  extractEnrolledFromJson,
  normalizeMosActivityUrl,
} from "./mos-enrolled-parse.mjs";

const DEFAULT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36";

const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 6 });

export const GROUPS_API =
  "https://www.mos.ru/pgu2/activity/api/groups/{id}";

/**
 * @param {string} cardId
 */
function groupsApiUrl(cardId) {
  const custom = process.env.MOS_ENROLLED_API_URL?.trim();
  const tpl = custom || GROUPS_API;
  return tpl.replaceAll("{id}", cardId);
}

/**
 * @param {unknown} err
 */
function formatFetchError(err) {
  if (!(err instanceof Error)) return String(err);
  const parts = [err.message];
  const cause = err.cause;
  if (cause instanceof Error) {
    parts.push(`cause: ${cause.message}`);
    const code = /** @type {{ code?: string }} */ (cause).code;
    if (code) parts.push(`code: ${code}`);
  }
  return parts.join(" | ");
}

/**
 * @param {string} url
 * @param {Record<string, string>} headers
 */
function httpsGetText(url, headers) {
  const timeoutMs = Number(process.env.MOS_ENROLLED_FETCH_TIMEOUT_MS || 25_000);
  const u = new URL(url);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port || 443,
        path: `${u.pathname}${u.search}`,
        method: "GET",
        agent: httpsAgent,
        headers: {
          "User-Agent":
            process.env.MOS_ENROLLED_USER_AGENT?.trim() || DEFAULT_UA,
          Accept: "application/json, text/plain, */*",
          "Accept-Language": "ru,en;q=0.9",
          Connection: "keep-alive",
          ...headers,
        },
        timeout: timeoutMs,
      },
      (res) => {
        trackMosSetCookie(res.headers);
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          const status = res.statusCode ?? 0;
          resolve({
            ok: status >= 200 && status < 300,
            status,
            text,
            contentType:
              typeof res.headers["content-type"] === "string"
                ? res.headers["content-type"]
                : res.headers["content-type"]?.[0] ?? null,
          });
        });
      },
    );
    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`timeout after ${timeoutMs}ms`));
    });
    req.on("error", (err) => reject(new Error(formatFetchError(err))));
    req.end();
  });
}

/**
 * @param {string} cardId
 */
function mosRequestHeaders(cardId) {
  const cookie = cookieHeaderFromJar(getMosCookieJar());
  /** @type {Record<string, string>} */
  const headers = {
    Accept: "application/json, text/plain, */*",
    Referer: `https://www.mos.ru/pgu2/activity/card/${cardId}`,
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
  };
  if (cookie) headers.Cookie = cookie;
  return headers;
}

/**
 * @param {string} text
 * @param {string | null} contentType
 * @param {{ groupsApi?: boolean }} [opts]
 */
function parsePayload(text, contentType, opts = {}) {
  const trimmed = text.trim();
  if (
    contentType?.includes("application/json") ||
    trimmed.startsWith("{") ||
    trimmed.startsWith("[")
  ) {
    try {
      const json = JSON.parse(trimmed);
      if (opts.groupsApi) {
        const fromGroups = extractEnrolledFromGroupsApi(json);
        if (fromGroups) return fromGroups;
      }
      const hit = extractEnrolledFromJson(json);
      if (hit) return hit;
    } catch {
      /* try html */
    }
  }
  const fromNext = extractEnrolledFromHtml(text);
  if (fromNext) return fromNext;
  const embedded = extractEnrolledFromEmbeddedJson(text);
  if (embedded) return embedded;
  return null;
}

/**
 * @param {string} mosUrl Raw or normalized mos.ru activity card URL
 * @returns {Promise<{ url: string, cardId: string, count: number, source: string }>}
 */
export async function fetchMosEnrolledCount(mosUrl) {
  const url = normalizeMosActivityUrl(mosUrl);
  if (!url) throw new Error(`Not a mos.ru activity card URL: ${mosUrl}`);
  const cardId = cardIdFromMosUrl(url);
  if (!cardId) throw new Error(`Cannot parse card id from ${url}`);

  const apiUrl = groupsApiUrl(cardId);
  const t0 = Date.now();
  const res = await httpsGetText(apiUrl, mosRequestHeaders(cardId));
  mosSyncDebug(
    `GET groups/${cardId} HTTP ${res.status} ${Date.now() - t0}ms`,
  );

  if (isMosAuthFailure(res.status, res.text)) {
    throw new Error(
      `mos.ru blocked HTTP ${res.status} — попробуйте cookies: make upload-mos-enrolled-cookies`,
    );
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.text.slice(0, 200)}`);
  }

  const hit = parsePayload(res.text, res.contentType, { groupsApi: true });
  if (hit) {
    return { url, cardId, count: hit.count, source: `groups-api:${hit.source}` };
  }

  throw new Error(
    `no enrolled field in groups API (${res.text.slice(0, 300)}…)`,
  );
}

export { normalizeMosActivityUrl } from "./mos-enrolled-parse.mjs";
export { COOKIES_FILE_REL } from "./mos-enrolled-cookies.mjs";
