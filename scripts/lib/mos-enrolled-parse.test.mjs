import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

import {
  extractEnrolledFromGroupsApi,
  extractEnrolledFromHtml,
  extractEnrolledFromJson,
  normalizeMosActivityUrl,
} from "./mos-enrolled-parse.mjs";
import { hotEnrolledTotalForUrl } from "./mos-enrolled-sync.mjs";

const FIXTURE = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../fixtures/mos-card-next-data.json",
);

describe("normalizeMosActivityUrl", () => {
  it("normalizes mos.ru card links", () => {
    assert.equal(
      normalizeMosActivityUrl("https://www.mos.ru/pgu2/activity/card/842871/"),
      "https://www.mos.ru/pgu2/activity/card/842871",
    );
    assert.equal(normalizeMosActivityUrl("https://example.com/x"), null);
  });
});

describe("extractEnrolledFromGroupsApi", () => {
  it("sums capacity.booked across groups array", () => {
    const data = JSON.parse(
      readFileSync(
        path.join(path.dirname(fileURLToPath(import.meta.url)), "../fixtures/mos-groups-api-sample.json"),
        "utf8",
      ),
    );
    const hit = extractEnrolledFromGroupsApi(data);
    assert.ok(hit);
    assert.equal(hit.count, 5);
  });

  it("reads placeCount - freeSpace from pgu2 data.item.group", () => {
    const data = JSON.parse(
      readFileSync(
        path.join(
          path.dirname(fileURLToPath(import.meta.url)),
          "../fixtures/mos-groups-api-pgu2-item.json",
        ),
        "utf8",
      ),
    );
    const hit = extractEnrolledFromGroupsApi(data);
    assert.ok(hit);
    assert.equal(hit.count, 3);
    assert.match(hit.source, /placeCount-freeSpace/);
  });
});

describe("extractEnrolledFromJson", () => {
  it("reads capacity.booked from nested payload", () => {
    const data = JSON.parse(readFileSync(FIXTURE, "utf8"));
    const hit = extractEnrolledFromJson(data);
    assert.ok(hit);
    assert.equal(hit.count, 7);
    assert.match(hit.source, /capacity\.booked/);
  });
});

describe("extractEnrolledFromHtml", () => {
  it("parses __NEXT_DATA__ script", () => {
    const data = readFileSync(FIXTURE, "utf8");
    const html = `<html><script id="__NEXT_DATA__" type="application/json">${data}</script></html>`;
    const hit = extractEnrolledFromHtml(html);
    assert.ok(hit);
    assert.equal(hit.count, 7);
  });

  it("parses Russian «N из M мест»", () => {
    const hit = extractEnrolledFromHtml("<p>Записано 12 из 24 мест</p>");
    assert.ok(hit);
    assert.equal(hit.count, 12);
  });
});

describe("hotEnrolledTotalForUrl", () => {
  it("dedupes identical enrolled across format rows", () => {
    assert.equal(
      hotEnrolledTotalForUrl([{ enrolled: 5 }, { enrolled: 5 }]),
      5,
    );
  });

  it("sums different per-format enrollments", () => {
    assert.equal(
      hotEnrolledTotalForUrl([{ enrolled: 3 }, { enrolled: 5 }]),
      8,
    );
  });
});
