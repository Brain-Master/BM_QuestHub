const MAX_BYTES = 15 * 1024 * 1024;

const VK_HOST_RE = /(^|\.)vk\.com$|(^|\.)vkvideo\.ru$|(^|\.)vk\.ru$/i;

function parseUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error(`Некорректный URL: ${raw}`);
  }
  if (url.protocol !== "https:") {
    throw new Error(`Поддерживается только https: ${raw}`);
  }
  if (VK_HOST_RE.test(url.hostname)) {
    throw new Error(
      "VK-ссылки не скачиваются автоматически — экспортируйте файл в Google Drive и укажите ссылку на Drive",
    );
  }
  return url;
}

function extractGoogleDriveFileId(url: URL): string | null {
  const pathMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
  if (pathMatch) return pathMatch[1];
  const id = url.searchParams.get("id");
  if (id && url.pathname.includes("/open")) return id;
  return null;
}

function googleDriveDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`;
}

async function readResponseBody(res: Response, sourceLabel: string): Promise<Buffer> {
  const len = res.headers.get("content-length");
  if (len) {
    const n = Number(len);
    if (Number.isFinite(n) && n > MAX_BYTES) {
      throw new Error(`${sourceLabel}: файл больше 15 MB`);
    }
  }
  const ab = await res.arrayBuffer();
  if (ab.byteLength > MAX_BYTES) {
    throw new Error(`${sourceLabel}: файл больше 15 MB`);
  }
  return Buffer.from(ab);
}

/**
 * Download image (or other binary) from HTTPS URL or Google Drive share link.
 */
export async function downloadMediaSource(url: string): Promise<Buffer> {
  const parsed = parseUrl(url);
  const driveId = extractGoogleDriveFileId(parsed);
  const fetchUrl = driveId ? googleDriveDownloadUrl(driveId) : parsed.toString();

  const res = await fetch(fetchUrl, {
    redirect: "follow",
    headers: { "User-Agent": "BM-QuestHub-Media-Ingest/1.0" },
  });
  if (!res.ok) {
    throw new Error(`Не удалось скачать (${res.status}): ${url}`);
  }
  return readResponseBody(res, url);
}
