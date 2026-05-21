/**
 * OAuth (Desktop) for Google Drive — Design Pack CLI on personal My Drive.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { OAuth2Client } from "google-auth-library";

import { loadDotEnv } from "../load-dotenv.mjs";

export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";

const OAUTH_DIR = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = path.resolve(OAUTH_DIR, "..");
const REPO_ROOT = path.resolve(SCRIPTS_DIR, "..");

const DEFAULT_REDIRECT_URI = "http://127.0.0.1:53682";
export const OAUTH_REDIRECT_URI = DEFAULT_REDIRECT_URI;

export function defaultOAuthTokenPath(root = REPO_ROOT) {
  const custom = process.env.GOOGLE_DRIVE_OAUTH_TOKEN_PATH?.trim();
  if (custom) {
    return path.isAbsolute(custom) ? custom : path.join(root, custom);
  }
  return path.join(root, "scripts", "design-pack-oauth-token.json");
}

/** Load client_id/secret from process.env and scripts/design-pack-oauth.env */
export function loadOAuthClientConfig(root = REPO_ROOT) {
  loadDotEnv(path.join(root, "scripts", "design-pack-oauth.env"));
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error(
      "OAuth client missing — set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in scripts/design-pack-oauth.env (see design-pack-oauth.env.example)",
    );
  }
  return { clientId, clientSecret, redirectUri: OAUTH_REDIRECT_URI };
}

export function loadStoredTokens(tokenPath) {
  if (!fs.existsSync(tokenPath)) return null;
  const raw = fs.readFileSync(tokenPath, "utf8");
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`Invalid OAuth token file: ${tokenPath}`);
  }
}

export function saveStoredTokens(tokenPath, tokens) {
  fs.mkdirSync(path.dirname(tokenPath), { recursive: true });
  const tmp = `${tokenPath}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(tokens, null, 2)}\n`, "utf8");
  fs.renameSync(tmp, tokenPath);
}

export function hasRefreshToken(tokenPath) {
  const stored = loadStoredTokens(tokenPath);
  return Boolean(stored?.refresh_token?.trim());
}

function createOAuth2Client(config) {
  return new OAuth2Client(config.clientId, config.clientSecret, config.redirectUri);
}

function tokenStillValid(tokens) {
  if (!tokens?.access_token) return false;
  const expiry = tokens.expiry_date;
  if (!expiry) return true;
  return Date.now() < expiry - 60_000;
}

/** Returns Bearer access token; refreshes when expired. */
export async function getDriveOAuthAccessToken(options = {}) {
  const root = options.root ?? REPO_ROOT;
  const tokenPath = options.tokenPath ?? defaultOAuthTokenPath(root);
  const config = options.config ?? loadOAuthClientConfig(root);
  const stored = loadStoredTokens(tokenPath);
  if (!stored?.refresh_token) {
    throw new Error(
      `No OAuth refresh token at ${tokenPath} — run: make design-pack-oauth-login`,
    );
  }

  const client = createOAuth2Client(config);
  client.setCredentials(stored);

  if (tokenStillValid(stored)) {
    return stored.access_token;
  }

  const { credentials } = await client.refreshAccessToken();
  const merged = { ...stored, ...credentials };
  saveStoredTokens(tokenPath, merged);
  if (!merged.access_token) {
    throw new Error("Google Drive OAuth: no access token after refresh");
  }
  return merged.access_token;
}

export function createOAuth2ClientForLogin(
  root = REPO_ROOT,
  redirectUri = OAUTH_REDIRECT_URI,
) {
  loadDotEnv(path.join(root, "scripts", "design-pack-oauth.env"));
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error(
      "OAuth client missing — set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in scripts/design-pack-oauth.env",
    );
  }
  const config = { clientId, clientSecret, redirectUri };
  return { client: createOAuth2Client(config), config };
}

export function buildOAuthLoginUrl(client) {
  return client.generateAuthUrl({
    access_type: "offline",
    scope: [DRIVE_SCOPE],
    prompt: "consent",
  });
}
