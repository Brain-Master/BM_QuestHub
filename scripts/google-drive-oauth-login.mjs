#!/usr/bin/env node
/**
 * One-time OAuth login for Design Pack → Google Drive (personal My Drive).
 *
 * Prereqs: scripts/design-pack-oauth.env (client_id + client_secret)
 * Usage: make design-pack-oauth-login
 *
 * If the browser shows ERR_CONNECTION_REFUSED, copy the full address bar URL and run:
 *   node scripts/google-drive-oauth-login.mjs --redirect-url="PASTE_FULL_URL"
 */
import http from "node:http";
import { exec } from "node:child_process";
import path from "node:path";

import { loadDotEnv, loadRepoEnv } from "./load-dotenv.mjs";
import {
  buildOAuthLoginUrl,
  createOAuth2ClientForLogin,
  defaultOAuthTokenPath,
  saveStoredTokens,
} from "./lib/google-drive-oauth.mjs";

const ROOT = loadRepoEnv();
loadDotEnv(path.join(ROOT, "scripts", "design-pack-oauth.env"));

function parseArgs(argv) {
  let redirectUrl = null;
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith("--redirect-url=")) {
      redirectUrl = a.slice("--redirect-url=".length);
    } else if (a === "--redirect-url" && argv[i + 1]) {
      redirectUrl = argv[++i];
    }
  }
  return { redirectUrl };
}

function openBrowser(url) {
  const cmd =
    process.platform === "win32"
      ? `start "" "${url}"`
      : process.platform === "darwin"
        ? `open "${url}"`
        : `xdg-open "${url}"`;
  exec(cmd, (err) => {
    if (err) console.log(`[oauth-login] open browser manually:\n${url}\n`);
  });
}

function redirectUriFromCallbackUrl(callbackUrl) {
  const u = new URL(callbackUrl);
  return `${u.protocol}//${u.host}`;
}

/** OS picks a free port (avoids Windows EACCES on reserved ports like 53682). */
function startLoopbackServer() {
  return new Promise((resolve, reject) => {
    let codeResolve;
    const waitForCode = () =>
      new Promise((res, rej) => {
        codeResolve = res;
        server.once("error", rej);
      });

    let redirectUri = "";

    const server = http.createServer((req, res) => {
      const reqUrl = new URL(req.url ?? "/", redirectUri);
      const code = reqUrl.searchParams.get("code");
      const err = reqUrl.searchParams.get("error");

      if (err) {
        res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(`OAuth error: ${err}`);
        server.close();
        reject(new Error(`OAuth denied: ${err}`));
        return;
      }

      if (!code) {
        res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Missing code");
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(
        "<!DOCTYPE html><html><body><p>Авторизация успешна. Можно закрыть вкладку.</p></body></html>",
      );
      server.close();
      codeResolve(code);
    });

    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      redirectUri = `http://127.0.0.1:${port}`;
      resolve({ redirectUri, waitForCode });
    });
  });
}

async function fetchUserEmail(accessToken) {
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.email ?? null;
  } catch {
    return null;
  }
}

async function exchangeCodeAndSave(code, redirectUri) {
  const tokenPath = defaultOAuthTokenPath(ROOT);
  const { client } = createOAuth2ClientForLogin(ROOT, redirectUri);
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) {
    console.warn(
      "[oauth-login] No refresh_token — revoke app at https://myaccount.google.com/permissions and run login again.",
    );
  }
  saveStoredTokens(tokenPath, tokens);

  const email = tokens.access_token
    ? await fetchUserEmail(tokens.access_token)
    : null;

  console.log("[oauth-login] token saved:", tokenPath);
  if (email) console.log("[oauth-login] signed in as:", email);
  console.log("[oauth-login] Next: make design-pack-publish-drive");
}

async function main() {
  const { redirectUrl } = parseArgs(process.argv.slice(2));

  if (redirectUrl) {
    const callback = new URL(redirectUrl);
    const code = callback.searchParams.get("code");
    if (!code) {
      throw new Error("URL has no ?code= — paste the full address bar after Google redirect");
    }
    const redirectUri = redirectUriFromCallbackUrl(redirectUrl);
    console.log(`[oauth-login] using redirect ${redirectUri}`);
    await exchangeCodeAndSave(code, redirectUri);
    return;
  }

  const loopback = await startLoopbackServer();
  const codePromise = loopback.waitForCode();
  const { client } = createOAuth2ClientForLogin(ROOT, loopback.redirectUri);
  const authUrl = buildOAuthLoginUrl(client);

  console.log("[oauth-login] Sign in with the Gmail that owns BM_QuestHub_Media.");
  console.log(`[oauth-login] Local server: ${loopback.redirectUri}`);
  console.log("[oauth-login] If browser shows «connection refused», copy the FULL URL from the address bar:");
  console.log('  node scripts/google-drive-oauth-login.mjs --redirect-url="PASTE_URL"\n');
  console.log(`[oauth-login] Auth link:\n${authUrl}\n`);

  openBrowser(authUrl);
  const code = await codePromise;
  await exchangeCodeAndSave(code, loopback.redirectUri);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
