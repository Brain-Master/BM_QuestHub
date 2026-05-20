/**
 * Google Apps Script — paste into each spreadsheet (Extensions → Apps Script).
 *
 * Script properties (Project settings):
 *   CONTENT_ADMIN_URL  — Yandex content-admin function URL
 *   CONTENT_ADMIN_TOKEN — same as CONTENT_ADMIN_TOKEN on the function
 *   SYNC_TIER — "hot" for schedule spreadsheet, "cold" for catalog spreadsheet
 *
 * Then reload the sheet → menu BrainMaster → Опубликовать
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("BrainMaster")
    .addItem("Опубликовать", "publishToSite")
    .addToUi();
}

function publishToSite() {
  const props = PropertiesService.getScriptProperties();
  const baseUrl = props.getProperty("CONTENT_ADMIN_URL");
  const token = props.getProperty("CONTENT_ADMIN_TOKEN");
  const tier = props.getProperty("SYNC_TIER") || "hot";

  if (!baseUrl || !token) {
    SpreadsheetApp.getUi().alert(
      "Задайте Script properties: CONTENT_ADMIN_URL и CONTENT_ADMIN_TOKEN",
    );
    return;
  }

  const path = tier === "cold" ? "/sync/cold" : "/sync/hot";
  // Yandex HTTP invoke often drops JSON body from UrlFetchApp — pass route via query string.
  const url =
    baseUrl.replace(/\/$/, "") +
    "?path=" +
    encodeURIComponent(path) +
    "&tier=" +
    encodeURIComponent(tier);

  const response = UrlFetchApp.fetch(url, {
    method: "post",
    headers: {
      "X-Content-Token": token,
      "Content-Type": "application/json",
    },
    payload: "{}",
    muteHttpExceptions: true,
  });

  const code = response.getResponseCode();
  const body = response.getContentText();

  if (code >= 200 && code < 300) {
    SpreadsheetApp.getUi().alert(
      "Публикация запущена.\n\n" + body,
    );
    return;
  }

  SpreadsheetApp.getUi().alert(
    "Ошибка HTTP " + code + ":\n" + body,
  );
}
