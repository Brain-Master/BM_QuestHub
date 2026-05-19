#!/usr/bin/env node
/**
 * Link App Platform domains via Timeweb DNS API v2 (app_id on A record).
 *
 *   node scripts/timeweb-domains.mjs link --app 195536 --host quest.b-master.pro
 *   node scripts/timeweb-domains.mjs link --app 195536 --host 1517.b-master.pro --create-subdomain
 *
 * TIMEWEB_API_TOKEN in scripts/timeweb.env
 */
import { loadRepoEnv } from "./load-dotenv.mjs";

const API = "https://api.timeweb.cloud";

async function api(pathname, options = {}) {
  const token = process.env.TIMEWEB_API_TOKEN?.trim();
  if (!token) {
    console.error("[timeweb-domains] set TIMEWEB_API_TOKEN in scripts/timeweb.env");
    process.exit(1);
  }
  const res = await fetch(`${API}${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    console.error(`[timeweb-domains] ${res.status} ${pathname}`, body);
    process.exit(1);
  }
  return body;
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      out[key] = argv[i + 1];
      i++;
    } else {
      out._.push(a);
    }
  }
  return out;
}

function apexFromHost(host) {
  const parts = host.split(".");
  if (parts.length < 2) return host;
  return parts.slice(-2).join(".");
}

function labelFromHost(host, apex) {
  const suffix = `.${apex}`;
  if (!host.endsWith(suffix)) return host;
  return host.slice(0, -suffix.length);
}

async function ensureSubdomain(apex, host) {
  const label = labelFromHost(host, apex);
  if (!label || label === apex) return;
  const domain = await api(`/api/v1/domains/${encodeURIComponent(apex)}`);
  const exists = (domain?.domain?.subdomains ?? []).some((s) => s.fqdn === host);
  if (exists) {
    console.log(`[timeweb-domains] subdomain ${host} already exists`);
    return;
  }
  const created = await api(
    `/api/v1/domains/${encodeURIComponent(apex)}/subdomains/${encodeURIComponent(label)}`,
    { method: "POST" },
  );
  console.log(`[timeweb-domains] created subdomain`, created?.subdomain?.fqdn ?? host);
}

async function fetchApp(appId) {
  const body = await api(`/api/v1/apps/${appId}`);
  return body?.app;
}

async function linkHost(appId, host, { createSubdomain }) {
  const app = await fetchApp(appId);
  const ip = app?.ip;
  if (!ip) {
    console.error("[timeweb-domains] app has no ip — is deploy active?");
    process.exit(1);
  }
  const apex = apexFromHost(host);
  if (createSubdomain && host !== apex) {
    await ensureSubdomain(apex, host);
  }

  const existing = await api(`/api/v1/domains/${encodeURIComponent(host)}/dns-records`);
  const aRecord = (existing?.dns_records ?? []).find((r) => r.type === "A");
  const payload = { type: "A", value: ip, app_id: Number(appId), ttl: 600 };

  if (aRecord?.id) {
    const updated = await api(
      `/api/v2/domains/${encodeURIComponent(host)}/dns-records/${aRecord.id}`,
      { method: "PATCH", body: JSON.stringify(payload) },
    );
    console.log(`[timeweb-domains] patched A ${host} -> app ${appId} (${ip})`);
    return updated;
  }

  const created = await api(`/api/v2/domains/${encodeURIComponent(host)}/dns-records`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  console.log(`[timeweb-domains] created A ${host} -> app ${appId} (${ip})`);
  return created;
}

async function main() {
  loadRepoEnv();
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0] || "help";
  const appId = args.app;
  const host = args.host;

  if (cmd === "link") {
    if (!appId || !host) {
      console.error("Usage: link --app <id> --host <fqdn> [--create-subdomain]");
      process.exit(1);
    }
    await linkHost(appId, host, { createSubdomain: Boolean(args["create-subdomain"]) });
    const app = await fetchApp(appId);
    console.log("[timeweb-domains] app domains:", (app?.domains ?? []).map((d) => d.fqdn).join(", "));
    return;
  }

  if (cmd === "status") {
    if (!appId) {
      console.error("Usage: status --app <id>");
      process.exit(1);
    }
    const app = await fetchApp(appId);
    console.log(JSON.stringify({ id: app.id, ip: app.ip, domains: app.domains }, null, 2));
    return;
  }

  console.error(`Usage:
  node scripts/timeweb-domains.mjs link --app 195536 --host quest.b-master.pro [--create-subdomain]
  node scripts/timeweb-domains.mjs status --app 195536`);
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
