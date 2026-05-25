import fs from "node:fs";
import path from "node:path";

/** Gitignored: JSON object { "name": "value", ... } from browser DevTools. */
export const COOKIES_FILE_REL = "secret/mos-enrolled-sync.cookies.json";

/**
 * @param {string} root
 * @returns {Record<string, string>}
 */
export function loadMosEnrolledCookies(root) {
  const jsonEnv = process.env.MOS_ENROLLED_COOKIES_JSON?.trim();
  if (jsonEnv) {
    try {
      const obj = JSON.parse(jsonEnv);
      const out = {};
      for (const [k, v] of Object.entries(obj)) {
        if (k.startsWith("_")) continue;
        if (v !== undefined && v !== null) out[k] = String(v);
      }
      return out;
    } catch {
      /* fall through */
    }
  }

  const inline = process.env.MOS_ENROLLED_COOKIE?.trim();
  if (inline) {
    return parseCookieHeader(inline);
  }

  const filePath = path.join(root, COOKIES_FILE_REL);
  if (!fs.existsSync(filePath)) return {};

  const raw = fs.readFileSync(filePath, "utf8").trim();
  if (!raw) return {};

  if (raw.startsWith("{")) {
    const obj = JSON.parse(raw);
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined && v !== null) out[k] = String(v);
    }
    return out;
  }

  return parseCookieHeader(raw);
}

/**
 * @param {Record<string, string>} jar
 */
export function cookieHeaderFromJar(jar) {
  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

/**
 * @param {string} header "a=1; b=2" or raw header value
 * @returns {Record<string, string>}
 */
export function parseCookieHeader(header) {
  const out = {};
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    const key = part.slice(0, eq).trim();
    const val = part.slice(eq + 1).trim();
    if (key) out[key] = val;
  }
  return out;
}

/**
 * Merge Set-Cookie response headers into an existing jar.
 * @param {Record<string, string>} jar
 * @param {import("node:http").IncomingHttpHeaders} headers
 */
export function mergeSetCookieIntoJar(jar, headers) {
  const raw = headers["set-cookie"];
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  for (const line of list) {
    const part = String(line).split(";")[0]?.trim();
    if (!part) continue;
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    const key = part.slice(0, eq).trim();
    const val = part.slice(eq + 1).trim();
    if (key) jar[key] = val;
  }
}
