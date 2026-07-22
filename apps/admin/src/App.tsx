import { useCallback, useEffect, useState } from "react";

import {
  hasApiUrl,
  loadSnapshots,
  publishContent,
  saveSnapshot,
} from "./api";
import {
  authFailureTransition,
  READY_AUTH_STATE,
  type AdminAuthState,
} from "./auth-failure-state";
import { legacyTokenAdapter } from "./legacy-token-adapter";

type Tab = "catalog" | "map" | "site" | "offers" | "publish";

export function App() {
  const [tab, setTab] = useState<Tab>("catalog");
  const [tokenInput, setTokenInput] = useState(
    () => legacyTokenAdapter.read(),
  );
  const [authState, setAuthState] =
    useState<AdminAuthState>(READY_AUTH_STATE);
  const [catalogJson, setCatalogJson] = useState("");
  const [mapJson, setMapJson] = useState("");
  const [siteJson, setSiteJson] = useState("");
  const [offersJson, setOffersJson] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const handleRequestError = useCallback((error: unknown) => {
    const transition = authFailureTransition(error);

    if (transition) {
      legacyTokenAdapter.clear();
      setTokenInput(transition.nextTokenInput);
      setAuthState(transition.nextAuthState);
      setStatus(transition.message);
      return;
    }

    setStatus(error instanceof Error ? error.message : String(error));
  }, []);

  const refresh = useCallback(async () => {
    if (!hasApiUrl()) {
      setStatus("Укажите VITE_CONTENT_ADMIN_URL при сборке admin");
      return;
    }
    setBusy(true);
    setStatus("Загрузка…");
    try {
      const data = await loadSnapshots();
      setCatalogJson(JSON.stringify(data.catalog, null, 2));
      setMapJson(JSON.stringify(data.map, null, 2));
      setSiteJson(JSON.stringify(data.site, null, 2));
      setOffersJson(
        data.offers ? JSON.stringify(data.offers, null, 2) : "{}",
      );
      setStatus("Снимки загружены");
    } catch (e) {
      handleRequestError(e);
    } finally {
      setBusy(false);
    }
  }, [handleRequestError]);

  const applyToken = () => {
    legacyTokenAdapter.write(tokenInput);
    setAuthState(READY_AUTH_STATE);
    setStatus("Токен сохранён");
    void refresh();
  };

  useEffect(() => {
    if (legacyTokenAdapter.read()) void refresh();
  }, [refresh]);

  async function saveCurrent() {
    setBusy(true);
    try {
      if (tab === "catalog") {
        await saveSnapshot("catalog", JSON.parse(catalogJson));
      } else if (tab === "map") {
        await saveSnapshot("map", JSON.parse(mapJson));
      } else if (tab === "site") {
        await saveSnapshot("site", JSON.parse(siteJson));
      } else if (tab === "offers") {
        await saveSnapshot("offers", JSON.parse(offersJson));
      }
      setStatus(`Сохранено: ${tab}`);
    } catch (e) {
      handleRequestError(e);
    } finally {
      setBusy(false);
    }
  }

  async function runPublish(tier: "hot" | "cold") {
    setBusy(true);
    try {
      if (tier === "hot" && tab === "offers") {
        await saveSnapshot("offers", JSON.parse(offersJson));
      }
      const result = await publishContent(tier);
      setStatus(
        result.message ??
          (tier === "hot"
            ? "Расписание: синк запущен (~1–3 мин). Сайт обновится за ~1 мин."
            : `Cold: синк + deploy запущены. ${JSON.stringify(result.workflow ?? {})}`),
      );
    } catch (e) {
      handleRequestError(e);
    } finally {
      setBusy(false);
    }
  }

  const editorValue =
    tab === "catalog"
      ? catalogJson
      : tab === "map"
        ? mapJson
        : tab === "offers"
          ? offersJson
          : siteJson;
  const setEditorValue =
    tab === "catalog"
      ? setCatalogJson
      : tab === "map"
        ? setMapJson
        : tab === "offers"
          ? setOffersJson
          : setSiteJson;

  return (
    <div className="layout">
      <header className="header">
        <h1>Quest Hub — редактор</h1>
        <p className="muted">
          Горячее расписание — без rebuild. Холодный контент — Timeweb API.
        </p>
      </header>

      <section className="panel">
        <label>
          API URL:{" "}
          <code>{import.meta.env.VITE_CONTENT_ADMIN_URL || "не задан"}</code>
        </label>
        <label className="row">
          Bearer token
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="CONTENT_ADMIN_TOKEN"
          />
          <button type="button" onClick={applyToken}>
            Сохранить
          </button>
          <button type="button" onClick={() => void refresh()} disabled={busy}>
            Обновить
          </button>
        </label>
        <p className="status" role="status" data-auth-state={authState.status}>
          {status}
        </p>
      </section>

      <nav className="tabs">
        {(
          [
            ["catalog", "Каталог"],
            ["map", "Площадки"],
            ["site", "Site config"],
            ["offers", "Расписание"],
            ["publish", "Публикация"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "publish" ? (
        <section className="panel">
          <p>
            Сначала сохраните JSON на вкладках. Расписание обновляется на сайте
            без пересборки; тексты курсов требуют Timeweb deploy (2–5 мин).
          </p>
          <div className="row" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              type="button"
              className="primary"
              onClick={() => void runPublish("hot")}
              disabled={busy}
            >
              Опубликовать расписание (hot)
            </button>
            <button
              type="button"
              className="primary"
              onClick={() => void runPublish("cold")}
              disabled={busy}
            >
              Опубликовать контент сайта (cold)
            </button>
          </div>
          <p className="muted">
            CLI: <code>node apps/producer/publish.mjs --hot-only</code> или{" "}
            <code>make content-publish</code>
          </p>
        </section>
      ) : (
        <section className="panel editor">
          <textarea
            value={editorValue}
            onChange={(e) => setEditorValue(e.target.value)}
            spellCheck={false}
          />
          <button
            type="button"
            className="primary"
            onClick={() => void saveCurrent()}
            disabled={busy}
          >
            Сохранить в S3
          </button>
        </section>
      )}
    </div>
  );
}
