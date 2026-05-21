import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import {
  hasRefreshToken,
  loadStoredTokens,
  saveStoredTokens,
} from "./google-drive-oauth.mjs";
import { resolveDriveAccessToken } from "./google-drive-sync.mjs";

describe("hasRefreshToken", () => {
  it("returns false when token file is missing", () => {
    assert.equal(hasRefreshToken(path.join(os.tmpdir(), "bmqh-missing-oauth-token.json")), false);
  });

  it("returns true when refresh_token is present", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bmqh-oauth-"));
    const tokenPath = path.join(dir, "token.json");
    saveStoredTokens(tokenPath, { refresh_token: "rt-test", access_token: "at" });
    assert.equal(hasRefreshToken(tokenPath), true);
    assert.equal(loadStoredTokens(tokenPath).refresh_token, "rt-test");
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe("resolveDriveAccessToken", () => {
  it("uses oauth when GOOGLE_DRIVE_AUTH=oauth and refresh token exists", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bmqh-resolve-"));
    const tokenPath = path.join(dir, "token.json");
    saveStoredTokens(tokenPath, { refresh_token: "rt" });

    const prev = process.env.GOOGLE_DRIVE_AUTH;
    process.env.GOOGLE_DRIVE_AUTH = "oauth";
    try {
      const result = await resolveDriveAccessToken({
        driveAuth: "oauth",
        tokenPath,
        getDriveOAuthAccessToken: async () => "oauth-bearer",
      });
      assert.equal(result.auth, "oauth");
      assert.equal(result.token, "oauth-bearer");
    } finally {
      if (prev === undefined) delete process.env.GOOGLE_DRIVE_AUTH;
      else process.env.GOOGLE_DRIVE_AUTH = prev;
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("oauth-first prefers token over service account", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bmqh-resolve-"));
    const tokenPath = path.join(dir, "token.json");
    saveStoredTokens(tokenPath, { refresh_token: "rt" });

    const prevAuth = process.env.GOOGLE_DRIVE_AUTH;
    const prevSa = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    delete process.env.GOOGLE_DRIVE_AUTH;
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({
      client_email: "sa@test.iam.gserviceaccount.com",
      project_id: "test",
    });

    try {
      const result = await resolveDriveAccessToken({
        tokenPath,
        getDriveOAuthAccessToken: async () => "oauth-first",
        credentials: { client_email: "sa@test.iam.gserviceaccount.com" },
      });
      assert.equal(result.auth, "oauth");
      assert.equal(result.token, "oauth-first");
    } finally {
      if (prevAuth === undefined) delete process.env.GOOGLE_DRIVE_AUTH;
      else process.env.GOOGLE_DRIVE_AUTH = prevAuth;
      if (prevSa === undefined) delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
      else process.env.GOOGLE_SERVICE_ACCOUNT_JSON = prevSa;
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("service_account mode ignores oauth token", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bmqh-resolve-"));
    const tokenPath = path.join(dir, "token.json");
    saveStoredTokens(tokenPath, { refresh_token: "rt" });

    let oauthCalled = false;
    const result = await resolveDriveAccessToken({
      driveAuth: "service_account",
      tokenPath,
      getDriveOAuthAccessToken: async () => {
        oauthCalled = true;
        return "oauth-bearer";
      },
      getDriveAccessToken: async () => "sa-bearer",
      credentials: { client_email: "sa@test.iam.gserviceaccount.com", project_id: "p" },
    });

    assert.equal(oauthCalled, false);
    assert.equal(result.auth, "service_account");
    assert.equal(result.clientEmail, "sa@test.iam.gserviceaccount.com");
    assert.equal(result.token, "sa-bearer");
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("throws when no credentials (oauth-first)", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bmqh-resolve-"));
    const tokenPath = path.join(dir, "no-token.json");

    const prevAuth = process.env.GOOGLE_DRIVE_AUTH;
    const prevSa = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    delete process.env.GOOGLE_DRIVE_AUTH;
    delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

    try {
      await assert.rejects(
        () => resolveDriveAccessToken({ tokenPath }),
        /design-pack-oauth-login/,
      );
    } finally {
      if (prevAuth === undefined) delete process.env.GOOGLE_DRIVE_AUTH;
      else process.env.GOOGLE_DRIVE_AUTH = prevAuth;
      if (prevSa === undefined) delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
      else process.env.GOOGLE_SERVICE_ACCOUNT_JSON = prevSa;
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
