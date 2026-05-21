#!/usr/bin/env node
/**
 * HTTP smoke checks for production URLs → bm-lead-ops-reporter on failure.
 * Designed for GitHub Actions cron (no VPS). Requires OPS_REPORT_URL + OPS_REPORT_TOKEN.
 *
 *   node scripts/site-health-check.mjs
 *   SITE_HEALTH_INTERVAL_MIN=15 node scripts/site-health-check.mjs
 */
import { loadRepoEnv } from "./load-dotenv.mjs";

loadRepoEnv();

const DEFAULT_URLS = [
  "https://quest.b-master.pro/",
  "https://quest.b-master.pro/catalog",
];
const TIMEOUT_MS = Number(process.env.SITE_HEALTH_TIMEOUT_MS) || 20_000;
const SLOW_MS = Number(process.env.SITE_HEALTH_SLOW_MS) || 8_000;
const MIN_BODY_BYTES = Number(process.env.SITE_HEALTH_MIN_BODY_BYTES) || 500;
const MUST_CONTAIN = (process.env.SITE_HEALTH_MUST_CONTAIN ?? "BrainMaster|Quest Hub")
  .split("|")
  .map((s) => s.trim())
  .filter(Boolean);

function parseUrls() {
  const raw = process.env.SITE_HEALTH_URLS?.trim();
  if (!raw) return DEFAULT_URLS;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function checkUrl(url) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "BM-QuestHub-Health/1.0 (+https://quest.b-master.pro)",
        accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timer);
    const elapsed = Date.now() - started;
    const body = await res.text();
    const issues = [`URL: ${url}`, `Время ответа: ${elapsed} ms`];

    if (!res.ok) {
      return {
        ok: false,
        errorCode: "site_unreachable",
        errorMessage: `Страница не открывается: ${url} (HTTP ${res.status})`,
        httpStatus: res.status,
        issues,
      };
    }

    if (elapsed > SLOW_MS) {
      return {
        ok: false,
        errorCode: "site_slow",
        errorMessage: `Сайт отвечает слишком долго: ${url} (${elapsed} ms)`,
        httpStatus: res.status,
        issues,
      };
    }

    if (body.length < MIN_BODY_BYTES) {
      issues.push(`Размер ответа: ${body.length} байт (ожидали ≥ ${MIN_BODY_BYTES})`);
      return {
        ok: false,
        errorCode: "site_bad_response",
        errorMessage: `Подозрительно короткий ответ: ${url}`,
        httpStatus: res.status,
        issues,
      };
    }

    const missing = MUST_CONTAIN.filter((needle) => !body.includes(needle));
    if (missing.length > 0) {
      issues.push(`В HTML нет: ${missing.join(", ")}`);
      return {
        ok: false,
        errorCode: "site_bad_response",
        errorMessage: `Страница открылась, но контент не похож на Quest Hub: ${url}`,
        httpStatus: res.status,
        issues,
      };
    }

    console.log(`[health] OK ${url} (${elapsed} ms, HTTP ${res.status})`);
    return { ok: true };
  } catch (error) {
    clearTimeout(timer);
    const message = error?.name === "AbortError" ? "таймаут" : String(error);
    return {
      ok: false,
      errorCode: "site_unreachable",
      errorMessage: `Не удалось открыть ${url}: ${message}`,
      httpStatus: 0,
      issues: [`URL: ${url}`, `Ошибка: ${message}`],
    };
  }
}

async function reportFailure(failure) {
  const opsUrl = process.env.OPS_REPORT_URL?.trim();
  const opsToken = process.env.OPS_REPORT_TOKEN?.trim();
  if (!opsUrl || !opsToken) {
    console.error("[health] OPS_REPORT_URL and OPS_REPORT_TOKEN required");
    process.exit(2);
  }

  const payload = {
    event: "site.health_check_failed",
    source: "bm-site-health",
    occurredAt: new Date().toISOString(),
    httpStatus: failure.httpStatus,
    errorCode: failure.errorCode,
    errorMessage: failure.errorMessage,
    issues: failure.issues,
    requestId: `health-${Date.now()}`,
  };

  const res = await fetch(opsUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-ops-token": opsToken,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`[health] ops report failed ${res.status}: ${text.slice(0, 300)}`);
    process.exit(1);
  }
  console.log(`[health] alert sent (${res.status})`);
}

async function main() {
  const urls = parseUrls();
  console.log(`[health] checking ${urls.length} URL(s), timeout ${TIMEOUT_MS} ms`);

  const failures = [];
  for (const url of urls) {
    const result = await checkUrl(url);
    if (!result.ok) failures.push(result);
  }

  if (failures.length === 0) {
    console.log("[health] all checks passed");
    return;
  }

  for (const failure of failures) {
    console.error(`[health] FAIL ${failure.errorMessage}`);
    await reportFailure(failure);
  }
  process.exit(1);
}

main().catch((err) => {
  console.error("[health]", err.message || err);
  process.exit(1);
});
