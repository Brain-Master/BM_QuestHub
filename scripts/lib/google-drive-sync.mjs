/**
 * Minimal Google Drive sync helpers (service account, Drive API v3).
 */
import fs from "node:fs";
import path from "node:path";

import { GoogleAuth } from "google-auth-library";

import {
  DRIVE_SCOPE,
  defaultOAuthTokenPath,
  getDriveOAuthAccessToken,
  hasRefreshToken,
} from "./google-drive-oauth.mjs";

export { DRIVE_SCOPE };

const MIME_BY_EXT = {
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".csv": "text/csv",
  ".txt": "text/plain",
  ".psd": "image/vnd.adobe.photoshop",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".zip": "application/zip",
};

export function guessMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

export function escapeDriveQueryString(s) {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function parseServiceAccountJson() {
  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!inline) return null;
  return JSON.parse(inline);
}

/**
 * OAuth-first unless GOOGLE_DRIVE_AUTH forces a mode.
 * @returns {{ token: string, auth: 'oauth' | 'service_account', clientEmail?: string }}
 */
export async function resolveDriveAccessToken(options = {}) {
  const driveAuth = (
    options.driveAuth ??
    process.env.GOOGLE_DRIVE_AUTH ??
    ""
  )
    .trim()
    .toLowerCase();
  const root = options.root;
  const tokenPath = options.tokenPath ?? defaultOAuthTokenPath(root);
  const checkRefresh =
    options.hasRefreshToken ?? (() => hasRefreshToken(tokenPath));
  const getOAuth =
    options.getDriveOAuthAccessToken ??
    ((opts) => getDriveOAuthAccessToken({ ...opts, root, tokenPath }));
  const getSaToken =
    options.getDriveAccessToken ??
    ((creds, saOpts) => getDriveAccessToken(creds, saOpts));

  const useOAuth = async () => {
    const token = await getOAuth({ root, tokenPath });
    return { token, auth: "oauth" };
  };

  const useServiceAccount = async () => {
    const credentials = options.credentials ?? parseServiceAccountJson();
    if (!credentials) {
      throw new Error(
        "GOOGLE_SERVICE_ACCOUNT_JSON missing — same as scripts/sheets.env, or use OAuth: make design-pack-oauth-login",
      );
    }
    const impersonate =
      options.impersonateEmail ??
      (process.env.GOOGLE_DRIVE_IMPERSONATE_EMAIL?.trim() || undefined);
    const token = await getSaToken(credentials, { impersonateEmail: impersonate });
    return {
      token,
      auth: "service_account",
      clientEmail: credentials.client_email,
    };
  };

  if (driveAuth === "service_account") return useServiceAccount();
  if (driveAuth === "oauth") return useOAuth();

  if (checkRefresh(tokenPath)) return useOAuth();
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim()) return useServiceAccount();

  throw new Error(
    "No Drive credentials — run: make design-pack-oauth-login (personal Gmail) or set GOOGLE_SERVICE_ACCOUNT_JSON (Shared drive / Workspace)",
  );
}

export async function getDriveAccessToken(credentials, options = {}) {
  const auth = new GoogleAuth({
    credentials,
    scopes: [DRIVE_SCOPE],
    ...(options.impersonateEmail
      ? { clientOptions: { subject: options.impersonateEmail } }
      : {}),
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) throw new Error("Google Drive: no access token");
  return token.token;
}

/** Returns metadata; `driveId` set when folder lives on a Shared drive. */
export async function getFileMetadata(token, fileId) {
  const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?supportsAllDrives=true&fields=id,name,driveId,mimeType`;
  return driveJson(token, url);
}

function driveFetchTimeoutMs(options) {
  const fromEnv = Number(process.env.GOOGLE_DRIVE_FETCH_TIMEOUT_MS);
  if (Number.isFinite(fromEnv) && fromEnv > 0) return fromEnv;
  const body = options.body;
  const bytes = Buffer.isBuffer(body) ? body.length : 0;
  if (bytes > 5_000_000) return 300_000;
  return 120_000;
}

function isRetryableNetworkError(err) {
  const msg = err instanceof Error ? err.message : String(err);
  const code = err?.cause?.code ?? err?.code ?? "";
  return (
    msg.includes("fetch failed") ||
    code === "UND_ERR_CONNECT_TIMEOUT" ||
    code === "ETIMEDOUT" ||
    code === "ECONNRESET" ||
    code === "ENOTFOUND"
  );
}

async function driveJson(token, url, options = {}) {
  const maxAttempts = 4;
  const timeoutMs = driveFetchTimeoutMs(options);
  let lastErr;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const res = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          Authorization: `Bearer ${token}`,
          ...(options.body && !(options.body instanceof FormData)
            ? { "Content-Type": "application/json" }
            : {}),
          ...options.headers,
        },
      });
      const text = await res.text();
      let data = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = { raw: text };
        }
      }
      if (!res.ok) {
        throw new Error(
          `Drive API ${res.status}: ${data?.error?.message ?? text.slice(0, 400)}`,
        );
      }
      return data;
    } catch (err) {
      lastErr = err;
      if (!isRetryableNetworkError(err) || attempt === maxAttempts) break;
      const waitMs = 2000 * attempt;
      console.warn(
        `[drive] network error, retry ${attempt}/${maxAttempts - 1} in ${waitMs / 1000}s…`,
      );
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }

  throw new Error(
    `Google Drive API unreachable (timeout/firewall/VPN?). Set GOOGLE_DRIVE_FETCH_TIMEOUT_MS or HTTPS_PROXY if needed. ${lastErr instanceof Error ? lastErr.message : lastErr}`,
    { cause: lastErr },
  );
}

export async function findFolderByName(token, parentId, name) {
  const q = `'${parentId}' in parents and name='${escapeDriveQueryString(name)}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const url = `https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&includeItemsFromAllDrives=true&q=${encodeURIComponent(q)}&fields=files(id,name)`;
  const data = await driveJson(token, url);
  return data.files?.[0] ?? null;
}

export async function findFileByName(token, parentId, name) {
  const q = `'${parentId}' in parents and name='${escapeDriveQueryString(name)}' and mimeType!='application/vnd.google-apps.folder' and trashed=false`;
  const url = `https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&includeItemsFromAllDrives=true&q=${encodeURIComponent(q)}&fields=files(id,name,mimeType)`;
  const data = await driveJson(token, url);
  return data.files?.[0] ?? null;
}

export async function createFolder(token, parentId, name) {
  return driveJson(token, "https://www.googleapis.com/drive/v3/files?supportsAllDrives=true", {
    method: "POST",
    body: JSON.stringify({
      name,
      parents: [parentId],
      mimeType: "application/vnd.google-apps.folder",
    }),
  });
}

export async function ensureFolder(token, parentId, name) {
  const existing = await findFolderByName(token, parentId, name);
  if (existing) return existing.id;
  const created = await createFolder(token, parentId, name);
  return created.id;
}

async function uploadMultipart(token, metadata, buffer, mimeType) {
  const boundary = `bmqh_${Date.now()}`;
  const metaPart = JSON.stringify(metadata);
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metaPart}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`),
    buffer,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  return driveJson(
    token,
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true",
    {
      method: "POST",
      headers: {
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );
}

async function updateFileContent(token, fileId, buffer, mimeType) {
  return driveJson(
    token,
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media&supportsAllDrives=true`,
    {
      method: "PATCH",
      headers: { "Content-Type": mimeType },
      body: buffer,
    },
  );
}

export async function uploadOrUpdateFile(token, parentId, localPath) {
  const name = path.basename(localPath);
  console.log(`[design-pack-drive] upload: ${name}`);
  const mimeType = guessMime(localPath);
  const buffer = fs.readFileSync(localPath);
  const existing = await findFileByName(token, parentId, name);
  if (existing) {
    await updateFileContent(token, existing.id, buffer, mimeType);
    return { id: existing.id, updated: true };
  }
  const created = await uploadMultipart(
    token,
    { name, parents: [parentId] },
    buffer,
    mimeType,
  );
  return { id: created.id, updated: false };
}

/**
 * Mirror local directory tree into a Drive folder (replace files by name).
 */
export async function syncDirectoryToDrive(token, localDir, driveFolderId, stats = { files: 0, dirs: 0 }) {
  const entries = fs.readdirSync(localDir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(localDir, ent.name);
    if (ent.isDirectory()) {
      const subId = await ensureFolder(token, driveFolderId, ent.name);
      stats.dirs += 1;
      await syncDirectoryToDrive(token, full, subId, stats);
      continue;
    }
    if (!ent.isFile()) continue;
    await uploadOrUpdateFile(token, driveFolderId, full);
    stats.files += 1;
  }
  return stats;
}
