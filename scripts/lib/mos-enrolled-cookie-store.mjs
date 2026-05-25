import fs from "node:fs";
import path from "node:path";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { formatS3Error, isSoftS3Error, withS3Timeout } from "./mos-ops-s3.mjs";
import { mosSyncDebug, mosSyncDebugWarn } from "./mos-sync-debug.mjs";

import {
  COOKIES_FILE_REL,
  cookieHeaderFromJar,
  loadMosEnrolledCookies,
  mergeSetCookieIntoJar,
  parseCookieHeader,
} from "./mos-enrolled-cookies.mjs";

export const DEFAULT_COOKIES_S3_KEY = "ops/mos-enrolled-sync.cookies.json";

/** @type {Record<string, string> | null} */
let sessionJar = null;
let sessionDirty = false;

function s3Key() {
  return (
    process.env.MOS_ENROLLED_COOKIES_S3_KEY?.trim() || DEFAULT_COOKIES_S3_KEY
  );
}

function s3Client() {
  const bucket = process.env.S3_BUCKET?.trim();
  if (!bucket) return null;
  return {
    client: new S3Client({
      region: process.env.AWS_DEFAULT_REGION?.trim() || "ru-1",
      endpoint: process.env.S3_ENDPOINT?.trim() || "https://s3.twcstorage.ru",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID?.trim() || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY?.trim() || "",
      },
    }),
    bucket,
  };
}

/**
 * @param {Record<string, string>} jar
 */
function jarToJson(jar) {
  const sorted = Object.keys(jar).sort();
  const out = {};
  for (const k of sorted) out[k] = jar[k];
  out._updatedAt = new Date().toISOString();
  return JSON.stringify(out, null, 2);
}

/**
 * @param {string} raw
 * @returns {Record<string, string>}
 */
function parseJarJson(raw) {
  const obj = JSON.parse(raw);
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith("_")) continue;
    if (v !== undefined && v !== null) out[k] = String(v);
  }
  return out;
}

async function loadCookiesFromS3() {
  const cfg = s3Client();
  if (!cfg) return null;
  try {
    const res = await withS3Timeout(
      cfg.client.send(new GetObjectCommand({ Bucket: cfg.bucket, Key: s3Key() })),
    );
    const raw = await res.Body?.transformToString("utf8");
    if (!raw?.trim()) return null;
    return parseJarJson(raw);
  } catch (err) {
    if (isSoftS3Error(err)) {
      console.warn(`[mos-cookies] load S3: ${formatS3Error(err)}`);
      return null;
    }
    console.error(`[mos-cookies] load S3:`, formatS3Error(err));
    return null;
  }
}

/**
 * @param {Record<string, string>} jar
 */
export async function saveCookiesToS3(jar) {
  const cfg = s3Client();
  if (!cfg) return false;
  try {
    await withS3Timeout(
      cfg.client.send(
        new PutObjectCommand({
          Bucket: cfg.bucket,
          Key: s3Key(),
          Body: jarToJson(jar),
          ContentType: "application/json",
          CacheControl: "private, no-store",
        }),
      ),
    );
    return true;
  } catch (err) {
    console.warn(`[mos-cookies] save S3: ${formatS3Error(err)}`);
    return false;
  }
}

/**
 * @param {string} root
 */
function skipS3Cookies() {
  return process.env.MOS_ENROLLED_SKIP_S3_COOKIES === "1";
}

function cookiePersistenceEnabled() {
  if (skipS3Cookies() && process.env.MOS_ENROLLED_SKIP_LOCAL_COOKIE_WRITE === "1") {
    return false;
  }
  return true;
}

export async function initMosCookieSession(root) {
  sessionJar = null;
  sessionDirty = false;

  if (skipS3Cookies()) {
    mosSyncDebug("[mos-cookies] init: skip S3 cookie load");
  } else {
    const fromS3 = await loadCookiesFromS3();
    if (fromS3 && Object.keys(fromS3).length > 0) {
      sessionJar = fromS3;
      return { source: `s3:${s3Key()}`, count: Object.keys(sessionJar).length };
    }
  }

  sessionJar = loadMosEnrolledCookies(root);
  const source = skipS3Cookies()
    ? "skip-s3"
    : process.env.MOS_ENROLLED_COOKIES_JSON?.trim()
      ? "env:MOS_ENROLLED_COOKIES_JSON"
      : fs.existsSync(path.join(root, COOKIES_FILE_REL))
        ? COOKIES_FILE_REL
        : "empty";
  return { source, count: Object.keys(sessionJar).length };
}

export function getMosCookieJar() {
  return sessionJar ?? {};
}

/**
 * @param {import("node:http").IncomingHttpHeaders} headers
 */
export function trackMosSetCookie(headers) {
  if (!cookiePersistenceEnabled()) return;
  if (!sessionJar) sessionJar = {};
  const before = JSON.stringify(sessionJar);
  mergeSetCookieIntoJar(sessionJar, headers);
  if (JSON.stringify(sessionJar) !== before) {
    sessionDirty = true;
    mosSyncDebug(
      `[mos-cookies] Set-Cookie merged (${Object.keys(sessionJar).length} keys)`,
    );
  }
}

/**
 * @param {string} root
 */
export async function persistMosCookieSession(root) {
  if (!sessionJar || !sessionDirty) {
    return { saved: false, skipped: true, reason: "clean" };
  }

  if (!cookiePersistenceEnabled()) {
    sessionDirty = false;
    mosSyncDebug("[mos-cookies] persist skipped (S3+local disabled)");
    return { saved: false, skipped: true, reason: "persistence_disabled" };
  }

  let savedTo = "";
  if (!skipS3Cookies() && (await saveCookiesToS3(sessionJar))) {
    savedTo = `s3:${s3Key()}`;
  }

  const localPath = path.join(root, COOKIES_FILE_REL);
  if (!process.env.MOS_ENROLLED_SKIP_LOCAL_COOKIE_WRITE) {
    fs.mkdirSync(path.dirname(localPath), { recursive: true });
    fs.writeFileSync(localPath, jarToJson(sessionJar), "utf8");
    savedTo = savedTo ? `${savedTo}+local` : "local";
  }

  sessionDirty = false;
  if (!savedTo) {
    console.warn("[mos-cookies] persist failed — no target written");
    return { saved: false, skipped: false, reason: "write_failed" };
  }
  mosSyncDebug(`[mos-cookies] persist ok → ${savedTo}`);
  return { saved: true, target: savedTo };
}

/**
 * @param {number} status
 * @param {string} body
 */
export function isMosAuthFailure(status, body) {
  if (status === 401 || status === 403) return true;
  const t = body.slice(0, 2000).toLowerCase();
  if (t.includes("gosuslugi") && t.includes("login")) return true;
  if (t.includes("авториз") && t.includes("войти")) return true;
  if (status === 200 && t.includes("<html") && !t.includes('"status":"success"')) {
    return t.includes("login") || t.includes("auth");
  }
  return false;
}

export async function notifyMosCookiesExpired(reason) {
  const { sendTelegramAlert } = await import("./telegram-alert.mjs");
  const text = [
    "⚠️ Quest Hub: mos.ru API недоступен",
    "",
    reason,
    "",
    "Обычно помогает (опционально): cookies из браузера →",
    "  make upload-mos-enrolled-cookies",
    "Проверьте также VPN и доступ с IP YCF к mos.ru.",
  ].join("\n");
  await sendTelegramAlert(text);
}

export { cookieHeaderFromJar, parseCookieHeader };
