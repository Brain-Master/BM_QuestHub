"use strict";

const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

const SNAPSHOT_KEYS = {
  catalog: "data/v2/catalog-snapshot.json",
  map: "data/v2/map-snapshot.json",
  site: "data/v2/site-config.json",
  manifest: "data/v2/site-manifest.json",
  offers: "data/offers-snapshot.json",
};

function readEnv(name, options = {}) {
  const value = process.env[name]?.trim();
  if (!value && options.required) throw new Error(`Missing env: ${name}`);
  return value ?? "";
}

function corsHeaders(origin) {
  const allowed = readEnv("ALLOWED_ORIGINS")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const allowOrigin =
    allowed.length === 0 || allowed.includes("*")
      ? "*"
      : origin && allowed.includes(origin)
        ? origin
        : allowed[0];
  return {
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-methods": "GET, PUT, POST, OPTIONS",
    "access-control-allow-headers": "content-type, authorization, x-content-token",
    vary: "Origin",
  };
}

function response(statusCode, body, origin) {
  return {
    statusCode,
    headers: { ...JSON_HEADERS, ...corsHeaders(origin) },
    body: JSON.stringify(body),
  };
}

function unauthorized(origin) {
  return response(401, { ok: false, error: "unauthorized" }, origin);
}

function checkAuth(event, origin) {
  const token = readEnv("CONTENT_ADMIN_TOKEN", { required: true });
  const headers = event.headers ?? {};
  const direct =
    headers["X-Content-Token"] ||
    headers["x-content-token"] ||
    "";
  if (direct === token) return null;

  // Authorization is consumed by Yandex HTTP invoke — do not rely on it in production.
  const bearer =
    headers.Authorization || headers.authorization || "";
  const expected = `Bearer ${token}`;
  if (bearer === expected) return null;

  return unauthorized(origin);
}

function publicBase() {
  return readEnv("S3_PUBLIC_BASE_URL", { required: true }).replace(/\/$/, "");
}

function s3Client() {
  return new S3Client({
    region: readEnv("AWS_DEFAULT_REGION") || "ru-1",
    endpoint: readEnv("S3_ENDPOINT") || "https://s3.twcstorage.ru",
    credentials: {
      accessKeyId: readEnv("AWS_ACCESS_KEY_ID", { required: true }),
      secretAccessKey: readEnv("AWS_SECRET_ACCESS_KEY", { required: true }),
    },
    forcePathStyle: false,
  });
}

async function fetchPublicJson(key) {
  const url = `${publicBase()}/${key.replace(/^\//, "")}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`fetch ${key}: HTTP ${res.status}`);
  return res.json();
}

async function putPublicJson(key, data) {
  const bucket = readEnv("S3_BUCKET", { required: true });
  const client = s3Client();
  const body = `${JSON.stringify(data, null, 2)}\n`;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "application/json; charset=utf-8",
      CacheControl: "public, max-age=60",
    }),
  );
}

async function triggerSheetSyncWorkflow(tier) {
  const token = readEnv("CONTENT_REBUILD_GITHUB_TOKEN");
  const repository = readEnv("CONTENT_REBUILD_REPOSITORY");
  const workflow = readEnv("SHEET_SYNC_WORKFLOW") || "sheet-sync.yml";
  const ref = readEnv("CONTENT_REBUILD_REF") || "main";

  if (!token || !repository) {
    return {
      ok: false,
      skipped: true,
      reason: "set CONTENT_REBUILD_GITHUB_TOKEN and CONTENT_REBUILD_REPOSITORY",
    };
  }

  const safeTier = tier === "cold" ? "cold" : "hot";
  const url = `https://api.github.com/repos/${repository}/actions/workflows/${workflow}/dispatches`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ref, inputs: { tier: safeTier } }),
  });

  if (!res.ok) {
    const text = await res.text();
    const hint =
      res.status === 404
        ? " Проверьте CONTENT_REBUILD_GITHUB_TOKEN (repo + workflow) и CONTENT_REBUILD_REPOSITORY."
        : "";
    const err = new Error(`GitHub sheet-sync ${res.status}: ${text}${hint}`);
    err.statusCode = res.status === 404 ? 502 : 502;
    throw err;
  }

  return { ok: true, skipped: false, tier: safeTier, workflow, repository, ref };
}

async function triggerTimewebDeploy() {
  const token = readEnv("TIMEWEB_API_TOKEN");
  const appId = readEnv("TIMEWEB_APP_ID");
  if (!token || !appId) {
    return { ok: false, skipped: true, reason: "timeweb env not configured" };
  }
  const res = await fetch(
    `https://api.timeweb.cloud/api/v1/apps/${appId}/deploy`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Timeweb deploy ${res.status}: ${text}`);
  }
  const body = await res.json();
  return { ok: true, skipped: false, deploy: body };
}

function routePath(event) {
  const httpPath = event.requestContext?.http?.path;
  if (httpPath && httpPath !== "/") return httpPath;

  const raw = event.url || "/";
  try {
    const pathname = new URL(raw, "https://local").pathname;
    if (pathname && pathname !== "/") return pathname;
  } catch {
    if (raw.startsWith("/") && raw !== "/") return raw;
  }

  const qsPath = event.queryStringParameters?.path;
  if (qsPath) return qsPath.startsWith("/") ? qsPath : `/${qsPath}`;

  if (event.body) {
    try {
      const parsed = JSON.parse(event.body);
      if (typeof parsed.path === "string" && parsed.path.trim()) {
        const p = parsed.path.trim();
        return p.startsWith("/") ? p : `/${p}`;
      }
    } catch {
      /* ignore */
    }
  }

  return "/";
}

exports.handler = async function handler(event) {
  const method = (event.httpMethod || event.requestContext?.http?.method || "GET").toUpperCase();
  const origin = event.headers?.origin || event.headers?.Origin || "";
  const path = routePath(event);

  if (method === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(origin), body: "" };
  }

  const authErr = checkAuth(event, origin);
  if (authErr) return authErr;

  try {
    if (method === "GET" && path === "/snapshots") {
      const [catalog, map, site, manifest, offers] = await Promise.all([
        fetchPublicJson(SNAPSHOT_KEYS.catalog),
        fetchPublicJson(SNAPSHOT_KEYS.map),
        fetchPublicJson(SNAPSHOT_KEYS.site),
        fetchPublicJson(SNAPSHOT_KEYS.manifest).catch(() => null),
        fetchPublicJson(SNAPSHOT_KEYS.offers).catch(() => null),
      ]);
      return response(200, { ok: true, catalog, map, site, manifest, offers }, origin);
    }

    if (method === "PUT" && path.startsWith("/snapshots/")) {
      const type = path.split("/").pop();
      const key = SNAPSHOT_KEYS[type];
      if (!key) {
        return response(400, { ok: false, error: "unknown snapshot type" }, origin);
      }
      const body = JSON.parse(event.body || "{}");
      const payload = body.data ?? body;
      payload.generatedAt = new Date().toISOString();
      payload.source = payload.source || "content-admin";
      await putPublicJson(key, payload);
      return response(200, { ok: true, type, key }, origin);
    }

    if (method === "POST" && path === "/sync/hot") {
      const workflow = await triggerSheetSyncWorkflow("hot");
      return response(
        200,
        {
          ok: true,
          tier: "hot",
          message:
            "Sheet sync started in GitHub Actions (~1–3 min). Site updates ~1 min after workflow finishes.",
          workflow,
        },
        origin,
      );
    }

    if (method === "POST" && path === "/sync/cold") {
      const workflow = await triggerSheetSyncWorkflow("cold");
      return response(
        200,
        {
          ok: true,
          tier: "cold",
          message:
            "Cold sync + Timeweb deploy started in GitHub Actions (~3–8 min).",
          workflow,
        },
        origin,
      );
    }

    if (method === "POST" && path === "/publish") {
      const parsed = event.body ? JSON.parse(event.body) : {};
      const tier = parsed.tier === "hot" ? "hot" : "cold";
      const workflow = await triggerSheetSyncWorkflow(tier);
      return response(200, { ok: true, tier, workflow }, origin);
    }

    return response(404, { ok: false, error: "not found" }, origin);
  } catch (e) {
    console.error(e);
    const status = e.statusCode === 502 ? 502 : 500;
    return response(status, { ok: false, error: String(e.message || e) }, origin);
  }
};
