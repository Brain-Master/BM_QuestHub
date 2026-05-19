import { GoogleAuth } from "google-auth-library";

function loadServiceAccountJson(): object {
  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!inline?.trim()) {
    throw new Error(
      "Задайте GOOGLE_SERVICE_ACCOUNT_JSON (JSON сервисного аккаунта одной строкой)",
    );
  }
  return JSON.parse(inline) as object;
}

/**
 * Читает raw values из Google Sheets API (приватная таблица, сервисный аккаунт).
 */
export async function fetchSheetValuesGrid(options: {
  spreadsheetId: string;
  range: string;
}): Promise<string[][]> {
  const { spreadsheetId, range } = options;

  const auth = new GoogleAuth({
    credentials: loadServiceAccountJson(),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) {
    throw new Error("Google: не удалось получить access token");
  }

  const url = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`,
  );
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token.token}` },
  });

  if (!res.ok) {
    const text = await res.text();
    const ct = res.headers.get("content-type");
    const finalUrl = res.url;
    throw new Error(
      `Google Sheets API ${res.status} (${ct ?? "no-content-type"}) @ ${finalUrl}: ${text.slice(0, 500)}`,
    );
  }

  const body = (await res.json()) as { values?: string[][] };
  if (!body.values || body.values.length === 0) {
    throw new Error(`Google Sheets: пустой ответ values (range=${range})`);
  }
  return body.values;
}
