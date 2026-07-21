#!/usr/bin/env node
/**
 * Node built-in tests for admin-cms-ci-guard (exactly 16).
 */
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import {
  forbiddenChangedPathReason,
  isPublicEnvExample,
  normalizeRepoPath,
  parseManifestLine,
  parseVitestSummary,
  verifyDocumentationManifest,
  verifyVitestSummary,
  verifyWorkflowPolicy,
} from "./admin-cms-ci-guard.mjs";

function vitestBlock({ files, tests }) {
  return [
    " RUN  v4.1.10 /tmp/admin",
    "",
    ` Test Files  ${files}`,
    `      Tests  ${tests}`,
    "   Start at  10:00:00",
    "   Duration  1.00s",
    "",
  ].join("\n");
}

const GOOD_WORKFLOW = `
name: Admin CMS CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: admin-cms-ci-\${{ github.workflow }}-\${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

jobs:
  admin-cms-quality:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          persist-credentials: false
      - uses: actions/setup-node@v4
        with:
          node-version: 22.23.1
      - name: Install
        run: npm ci
      - name: Secret scan
        run: make secret-scan
`.trimStart();

describe("admin CMS CI guard", () => {
  it("normalizes repository paths safely", () => {
    assert.equal(normalizeRepoPath("./apps/admin/src/api.ts"), "apps/admin/src/api.ts");
    assert.equal(normalizeRepoPath("apps\\admin\\src\\api.ts"), "apps/admin/src/api.ts");
    assert.equal(normalizeRepoPath("apps//admin/src/api.ts"), "apps/admin/src/api.ts");
  });

  it("rejects absolute and traversal paths", () => {
    assert.throws(() => normalizeRepoPath("/etc/passwd"), /absolute|unsafe|traversal|invalid/);
    assert.throws(() => normalizeRepoPath("C:\\\\Windows\\\\system32"), /absolute|unsafe|invalid/);
    assert.throws(() => normalizeRepoPath("../secret"), /traversal|invalid/);
    assert.throws(() => normalizeRepoPath(""), /empty|invalid/);
  });

  it("allows only public environment examples", () => {
    assert.equal(isPublicEnvExample(".env.example"), true);
    assert.equal(isPublicEnvExample("apps/web/timeweb.app.env.example"), true);
    assert.equal(isPublicEnvExample("config/.env.example"), true);
    assert.equal(isPublicEnvExample(".env"), false);
    assert.equal(isPublicEnvExample(".env.local"), false);
    assert.equal(isPublicEnvExample("apps/web/.env.production"), false);
  });

  it("rejects admin and secret-scan ephemeral paths", () => {
    assert.equal(forbiddenChangedPathReason("apps/admin/dist/index.html"), "admin-dist");
    assert.equal(forbiddenChangedPathReason("apps/admin/node_modules/x"), "admin-node-modules");
    assert.equal(
      forbiddenChangedPathReason("tools/secret-scan/node_modules/secretlint/package.json"),
      "secret-scan-node-modules",
    );
  });

  it("rejects secret credential path patterns", () => {
    assert.equal(forbiddenChangedPathReason("secret/token.txt"), "secret-dir");
    assert.equal(forbiddenChangedPathReason(".env"), "env-secret");
    assert.equal(forbiddenChangedPathReason("apps/admin/.env.local"), "env-secret");
    assert.equal(forbiddenChangedPathReason("certs/server.pem"), "pem");
    assert.equal(forbiddenChangedPathReason("keys/id_rsa.key"), "key");
    assert.equal(
      forbiddenChangedPathReason("ops/Google-Service-Account.json"),
      "service-account-json",
    );
    assert.equal(forbiddenChangedPathReason(".env.example"), null);
  });

  it("rejects root source documentation package", () => {
    assert.equal(
      forbiddenChangedPathReason("BM_QuestHub_CMS_Document_Package/README.md"),
      "source-doc-package",
    );
  });

  it("does not reject ordinary product paths", () => {
    assert.equal(forbiddenChangedPathReason("apps/web/data/offers-snapshot.json"), null);
    assert.equal(forbiddenChangedPathReason("apps/admin/src/api.ts"), null);
    assert.equal(forbiddenChangedPathReason("Makefile"), null);
    assert.equal(forbiddenChangedPathReason("docs/admin-cms/README.md"), null);
  });

  it("parses canonical manifest rows", () => {
    const row = parseManifestLine(
      "8dbac1fc97fb5f102195a619ec20ca294bb85e63cd8651ff06d5349a9f95f708  00_foundation/00_PRODUCT_VISION.md",
    );
    assert.equal(row.hash.length, 64);
    assert.equal(row.path, "00_foundation/00_PRODUCT_VISION.md");
  });

  it("rejects malformed/duplicate/traversing manifest rows", () => {
    assert.throws(() => parseManifestLine(""), /blank|malformed/);
    assert.throws(() => parseManifestLine("not-a-hash  file.md"), /malformed/);
    assert.throws(() => parseManifestLine(`${"a".repeat(64)}  ../x.md`), /unsafe|traversal/);
    assert.throws(() => parseManifestLine(`${"a".repeat(64)}  /abs.md`), /unsafe|traversal/);
  });

  it("accepts a fully matching temporary manifest", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "admin-cms-manifest-ok-"));
    try {
      const body = "hello-manifest\n";
      const rel = "README.md";
      fs.writeFileSync(path.join(dir, rel), body);
      const hash = crypto.createHash("sha256").update(body).digest("hex");
      const manifestPath = path.join(dir, "MANIFEST.sha256");
      fs.writeFileSync(manifestPath, `${hash}  ${rel}\n`);
      const result = verifyDocumentationManifest({
        repoRoot: dir,
        manifestPath,
        packageRoot: dir,
        expectedEntries: 1,
      });
      assert.deepEqual(result, { entries: 1, valid: 1 });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("rejects hash mismatch without exposing content", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "admin-cms-manifest-bad-"));
    try {
      const body = "secret-content-should-not-leak\n";
      fs.writeFileSync(path.join(dir, "README.md"), body);
      const manifestPath = path.join(dir, "MANIFEST.sha256");
      fs.writeFileSync(manifestPath, `${"0".repeat(64)}  README.md\n`);
      let err;
      try {
        verifyDocumentationManifest({
          repoRoot: dir,
          manifestPath,
          packageRoot: dir,
          expectedEntries: 1,
        });
      } catch (e) {
        err = e;
      }
      assert.ok(err);
      assert.match(String(err.message), /hash mismatch/);
      assert.equal(String(err.message).includes("secret-content-should-not-leak"), false);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("accepts Vitest summary at baseline", () => {
    const summary = parseVitestSummary(
      vitestBlock({ files: "5 passed (5)", tests: "53 passed (53)" }),
    );
    assert.equal(summary.passedFiles, 5);
    assert.equal(summary.passedTests, 53);
    assert.equal(verifyVitestSummary(summary), true);
  });

  it("accepts test-count growth", () => {
    const summary = parseVitestSummary(
      vitestBlock({ files: "6 passed (6)", tests: "60 passed (60)" }),
    );
    assert.equal(verifyVitestSummary(summary), true);
  });

  it("rejects failures/skips/below-baseline", () => {
    assert.throws(
      () =>
        verifyVitestSummary(
          parseVitestSummary(
            vitestBlock({ files: "4 passed | 1 failed (5)", tests: "52 passed | 1 failed (53)" }),
          ),
        ),
      /failures|below baseline/,
    );
    assert.throws(
      () =>
        verifyVitestSummary(
          parseVitestSummary(
            vitestBlock({ files: "5 passed (5)", tests: "50 passed | 3 skipped (53)" }),
          ),
        ),
      /skipped|todo/,
    );
    assert.throws(
      () =>
        verifyVitestSummary(
          parseVitestSummary(vitestBlock({ files: "4 passed (4)", tests: "52 passed (52)" })),
        ),
      /below baseline/,
    );
  });

  it("accepts required read-only workflow policy", () => {
    assert.equal(verifyWorkflowPolicy(GOOD_WORKFLOW), true);
  });

  it("rejects secret/write/pull-request-target workflow policy", () => {
    assert.throws(
      () => verifyWorkflowPolicy(GOOD_WORKFLOW.replace("pull_request:", "pull_request_target:")),
      /forbidden snippet/,
    );
    assert.throws(
      () =>
        verifyWorkflowPolicy(
          GOOD_WORKFLOW.replace("contents: read", "contents: write"),
        ),
      /forbidden snippet/,
    );
    assert.throws(
      () => verifyWorkflowPolicy(`${GOOD_WORKFLOW}\n      env:\n        TOKEN: \${{ secrets.X }}\n`),
      /forbidden snippet/,
    );
  });
});
