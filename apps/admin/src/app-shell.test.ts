import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
// Node built-ins are available under Vitest's node environment; @types/node is
// intentionally not an apps/admin dependency (M1-08 forbids lockfile changes).
// @ts-expect-error -- no @types/node in apps/admin
import fs from "node:fs";
// @ts-expect-error -- no @types/node in apps/admin
import path from "node:path";
// @ts-expect-error -- no @types/node in apps/admin
import { fileURLToPath } from "node:url";

import {
  APP_SHELL_STATES,
  AppShell,
  type AppShellProps,
  type AppShellState,
} from "./app-shell";

const SRC_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

const MARKER_CHILDREN = "AUTHORIZED_CONTENT_MARKER";
const MARKER_UTILITY = "UTILITY_REGION_MARKER";
const MARKER_NAV = "NAVIGATION_REGION_MARKER";
const MARKER_STATUS = "STATUS_REGION_MARKER";

function baseProps(
  overrides: Partial<AppShellProps> & { state: AppShellState },
): AppShellProps {
  return {
    title: "Quest Hub — редактор",
    description: "Описание shell",
    utility: createElement("div", null, MARKER_UTILITY),
    navigation: createElement("div", null, MARKER_NAV),
    status: createElement("p", null, MARKER_STATUS),
    children: createElement("div", null, MARKER_CHILDREN),
    ...overrides,
  };
}

function renderShell(
  overrides: Partial<AppShellProps> & { state: AppShellState },
): string {
  return renderToStaticMarkup(createElement(AppShell, baseProps(overrides)));
}

describe("admin app shell contract", () => {
  it("exposes a frozen three-state shell vocabulary", () => {
    expect([...APP_SHELL_STATES]).toEqual(["loading", "error", "authorized"]);
    expect(Object.isFrozen(APP_SHELL_STATES)).toBe(true);
    expect(() => {
      (APP_SHELL_STATES as unknown as string[]).push("permission");
    }).toThrow();
  });

  it("renders semantic shell landmarks in authorized state", () => {
    const html = renderShell({ state: { kind: "authorized" } });

    expect(html).toContain('class="app-shell"');
    expect(html).toContain('data-shell-state="authorized"');
    expect(html).toContain('class="app-shell__header"');
    expect(html).toContain('class="app-shell__utility"');
    expect(html).toContain('aria-label="Подключение и состояние"');
    expect(html).toContain('class="app-shell__navigation"');
    expect(html).toContain('aria-label="Разделы текущего инструмента"');
    expect(html).toContain('id="admin-main-content"');
    expect(html).toContain('class="app-shell__main"');
    expect(html).toMatch(/<main[^>]*tabindex="-1"/);
    expect(html).toContain("<header");
    expect(html).toContain("<nav");
    expect(html).toContain("<main");
  });

  it("provides a keyboard-visible skip link to main content", () => {
    const html = renderShell({ state: { kind: "authorized" } });
    expect(html).toContain('href="#admin-main-content"');
    expect(html).toContain("Перейти к основному содержимому");
    expect(html).toContain('class="skip-link"');
    expect(html).toMatch(
      /<main[^>]*id="admin-main-content"[^>]*>|<main[^>]*id="admin-main-content"/,
    );

    const css = fs.readFileSync(path.join(SRC_ROOT, "styles.css"), "utf8");
    expect(css).toMatch(/\.skip-link\s*\{/);
    expect(css).toMatch(/\.skip-link:focus/);
    expect(css).toMatch(/:focus-visible/);
  });

  it("renders authorized content only in authorized state", () => {
    const authorized = renderShell({ state: { kind: "authorized" } });
    expect(authorized).toContain(MARKER_CHILDREN);
    expect(authorized).not.toContain("Загрузка данных");
    expect(authorized).not.toContain("Данные не удалось загрузить");

    const loading = renderShell({
      state: { kind: "loading", message: "Загружаем данные" },
    });
    expect(loading).not.toContain(MARKER_CHILDREN);

    const errored = renderShell({
      state: { kind: "error", message: "Сбой загрузки" },
    });
    expect(errored).not.toContain(MARKER_CHILDREN);
  });

  it("renders loading feedback without authorized content", () => {
    const html = renderShell({
      state: { kind: "loading", message: "Загружаем данные" },
    });

    expect(html).toContain('data-shell-state="loading"');
    expect(html).toContain("Загрузка данных");
    expect(html).toContain("Загружаем данные");
    expect(html).toMatch(/aria-busy="true"/);
    expect(html).toMatch(/role="status"/);
    expect(html).toMatch(/aria-live="polite"/);
    expect(html).not.toContain(MARKER_CHILDREN);
    expect(html).not.toContain("Данные не удалось загрузить");
    expect(html).not.toContain("Повторить загрузку");
  });

  it("renders error feedback without authorized content", () => {
    const html = renderShell({
      state: { kind: "error", message: "Сбой загрузки" },
    });

    expect(html).toContain('data-shell-state="error"');
    expect(html).toContain("Данные не удалось загрузить");
    expect(html).toContain("Сбой загрузки");
    expect(html).toMatch(/aria-busy="false"/);
    expect(html).toMatch(/role="alert"/);
    expect(html).toMatch(/aria-live="assertive"/);
    expect(html).not.toContain(MARKER_CHILDREN);
    expect(html).not.toContain("Загрузка данных");
  });

  it("renders retry action only when available", () => {
    const withoutRetry = renderShell({
      state: { kind: "error", message: "Сбой" },
    });
    expect(withoutRetry).not.toContain("Повторить загрузку");
    expect(withoutRetry).not.toContain('class="app-shell__retry"');

    const withRetry = renderShell({
      state: { kind: "error", message: "Сбой" },
      onRetry: () => undefined,
    });
    expect(withRetry).toContain("Повторить загрузку");
    expect(withRetry).toContain('type="button"');
    expect(withRetry).toContain('class="app-shell__retry"');
  });

  it("preserves utility and navigation regions across all shell states", () => {
    for (const state of [
      { kind: "authorized" } as const,
      { kind: "loading", message: "Загружаем данные" } as const,
      { kind: "error", message: "Сбой" } as const,
    ]) {
      const html = renderShell({ state });
      expect(html).toContain(MARKER_UTILITY);
      expect(html).toContain(MARKER_NAV);
      expect(html).toContain(MARKER_STATUS);
      expect(html).toContain('aria-label="Подключение и состояние"');
      expect(html).toContain('aria-label="Разделы текущего инструмента"');
    }
  });

  it("keeps shell structure free of routing environment and permission claims", () => {
    const shellSource = fs.readFileSync(
      path.join(SRC_ROOT, "app-shell.tsx"),
      "utf8",
    );

    expect(shellSource).toMatch(
      /import type \{ ReactElement, ReactNode \} from "react";/,
    );
    expect(shellSource.match(/^import /gm) ?? []).toHaveLength(1);

    const forbidden = [
      "useState",
      "useEffect",
      "useCallback",
      "fetch(",
      "localStorage",
      "sessionStorage",
      "process.env",
      "import.meta.env",
      "react-router",
      "createBrowserRouter",
      "useNavigate",
      "useParams",
      "window.location",
      "VITE_",
      "loadSnapshots",
      "saveSnapshot",
      "publishContent",
      "formatUiError",
      "authFailure",
      "legacyToken",
      "console.",
      "createBrowserHistory",
      "useSearchParams",
      "hasApiUrl",
    ];
    for (const token of forbidden) {
      expect(shellSource).not.toContain(token);
    }

    // Clarifying comment is required; it is not an integration claim.
    expect(shellSource).toMatch(/not identity/i);
    expect(shellSource).toMatch(/RBAC/);
    expect(shellSource).not.toMatch(/useRouter|BrowserRouter|Routes\b/);
    expect(shellSource).not.toMatch(/environment badge|global search/i);
    expect(shellSource).not.toMatch(/can\(.*\)|hasPermission|checkPermission/);
  });

  it("wires App refresh through loading error and authorized shell states", () => {
    const appSource = fs.readFileSync(path.join(SRC_ROOT, "App.tsx"), "utf8");

    expect(appSource).toContain(
      'import { AppShell, type AppShellState } from "./app-shell";',
    );
    expect(appSource.match(/<AppShell\b/g) ?? []).toHaveLength(1);
    expect(appSource).toContain('kind: "authorized"');
    expect(appSource).toContain('kind: "loading"');
    expect(appSource).toContain('message: "Загружаем данные"');
    expect(appSource).toContain('kind: "error"');
    expect(appSource).toContain("MISSING_API_URL_MESSAGE");
    expect(appSource).toContain("formatUiError(e).text");
    expect(appSource).not.toContain("String(error)");
    expect(appSource).not.toContain("String(e)");
    expect(appSource).not.toContain("error.message");
    expect(appSource).not.toContain("e.message");
    expect(appSource).not.toContain("error.stack");
    expect(appSource).not.toContain("error.cause");
    expect(appSource).not.toContain("JSON.stringify(error)");
    expect(appSource).not.toContain("JSON.stringify(e)");

    const refreshStart = appSource.indexOf("const refresh = useCallback");
    expect(refreshStart).toBeGreaterThanOrEqual(0);
    const refreshEnd = appSource.indexOf("}, [handleRequestError]);", refreshStart);
    expect(refreshEnd).toBeGreaterThan(refreshStart);
    const refreshBlock = appSource.slice(refreshStart, refreshEnd);

    expect(refreshBlock).toContain('kind: "loading"');
    expect(refreshBlock).toContain('kind: "authorized"');
    expect(refreshBlock).toContain('kind: "error"');
    expect(refreshBlock).toContain("authFailureTransition(e)");
    expect(refreshBlock).toContain('setShellState({ kind: "authorized" })');
    expect(refreshBlock).toContain("formatUiError(e).text");
    expect(refreshBlock).toContain("hasApiUrl()");
    expect(refreshBlock).toContain("handleRequestError(e)");
    expect(refreshBlock).toMatch(
      /authFailureTransition\(e\)[\s\S]*setShellState\(\{\s*kind:\s*"authorized"\s*\}\)/,
    );
  });

  it("preserves legacy auth editor save and publish flows inside shell content", () => {
    const appSource = fs.readFileSync(path.join(SRC_ROOT, "App.tsx"), "utf8");

    expect(appSource).toContain("loadSnapshots");
    expect(appSource).toContain("saveSnapshot");
    expect(appSource).toContain("publishContent");
    expect(appSource).toContain("legacyTokenAdapter");
    expect(appSource).toContain("data-auth-state={authState.status}");
    expect(appSource).toContain('type="password"');
    expect(appSource).toContain("applyToken");
    expect(appSource).toContain("saveCurrent");
    expect(appSource).toContain("runPublish");
    expect(appSource).toContain("<textarea");
    expect(appSource).toContain("Сохранить в S3");
    expect(appSource).toContain("Опубликовать расписание (hot)");
    expect(appSource).toContain("Опубликовать контент сайта (cold)");

    for (const tab of ["catalog", "map", "site", "offers", "publish"]) {
      expect(appSource).toContain(`"${tab}"`);
    }

    const handlerMatches = appSource.match(
      /const handleRequestError\s*=\s*useCallback/g,
    );
    expect(handlerMatches).toHaveLength(1);

    const catchBlocks = [
      ...appSource.matchAll(/catch\s*\([^)]*\)\s*\{([^}]*)\}/g),
    ].map((m) => m[1]);
    const routed = catchBlocks.filter((body) =>
      body.includes("handleRequestError("),
    );
    expect(routed.length).toBe(3);

    expect(appSource).not.toMatch(/display:\s*none/);
    expect(appSource).not.toContain('hidden={true}');

    const refreshStart = appSource.indexOf("const refresh = useCallback");
    const refreshEnd = appSource.indexOf(
      "}, [handleRequestError]);",
      refreshStart,
    );
    const refreshBlock = appSource.slice(refreshStart, refreshEnd);
    expect(refreshBlock).toContain("authFailureTransition(e)");
    expect(refreshBlock).toContain('kind: "authorized"');
    expect(refreshBlock).toMatch(
      /if\s*\(\s*authFailureTransition\(e\)\s*\)/,
    );
  });

  it("provides responsive focus and reduced-motion shell styles", () => {
    const css = fs.readFileSync(path.join(SRC_ROOT, "styles.css"), "utf8");

    expect(css).toMatch(/\.skip-link\s*\{/);
    expect(css).toMatch(/\.skip-link:focus/);
    expect(css).toMatch(/:focus-visible/);
    expect(css).toMatch(/\.app-shell\s*\{/);
    expect(css).toMatch(/\.app-shell__header\s*\{/);
    expect(css).toMatch(/\.app-shell__title\s*\{/);
    expect(css).toMatch(/\.app-shell__description\s*\{/);
    expect(css).toMatch(/\.app-shell__utility\s*\{/);
    expect(css).toMatch(/\.app-shell__body\s*\{/);
    expect(css).toMatch(/\.app-shell__navigation\s*\{/);
    expect(css).toMatch(/\.app-shell__main\s*\{/);
    expect(css).toMatch(/\.app-shell__state\s*\{/);
    expect(css).toMatch(/\.app-shell__state-title\s*\{/);
    expect(css).toMatch(/\.app-shell__retry\s*\{/);
    expect(css).toMatch(/display:\s*grid/);
    expect(css).toMatch(/\.app-shell__main\s*\{[^}]*min-width:\s*0/s);
    expect(css).toMatch(/@media\s*\(\s*max-width:\s*52rem\s*\)/);
    expect(css).toMatch(
      /@media\s*\(\s*max-width:\s*52rem\s*\)\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s,
    );
    expect(css).toMatch(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/);

    // No global horizontal clipping that conceals overflow instead of reflow.
    for (const selector of [
      "html",
      "body",
      "#root",
      ".app-shell",
      ".app-shell__body",
      ".app-shell__utility",
      ".app-shell__main",
    ]) {
      const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const block = new RegExp(`${escaped}\\s*\\{[^}]*\\}`, "s");
      const match = css.match(block);
      if (match) {
        expect(match[0]).not.toMatch(/overflow-x:\s*(hidden|clip)/);
      }
    }
    expect(css).not.toMatch(
      /(?:^|[,}\s])(?:html|body|#root)\s*\{[^}]*overflow-x:\s*(?:hidden|clip)/s,
    );

    // Safe skip-link hiding: transform off-screen, not horizontal displacement.
    expect(css).not.toMatch(/left:\s*-9999px/);
    expect(css).not.toMatch(/right:\s*9999px/);
    expect(css).toMatch(
      /\.skip-link\s*\{[^}]*transform:\s*translateY\([^)]+\)/s,
    );
    expect(css).toMatch(
      /\.skip-link:focus(?:-visible)?(?:,\s*\.skip-link:focus(?:-visible)?)?\s*\{[^}]*transform:\s*translateY\(\s*0\s*\)/s,
    );

    // Technical values wrap; flex inputs can shrink within the viewport.
    expect(css).toMatch(
      /\.app-shell__utility\s*\{[^}]*min-width:\s*0[^}]*max-width:\s*100%/s,
    );
    expect(css).toMatch(
      /\.app-shell__main\s*\{[^}]*min-width:\s*0[^}]*max-width:\s*100%/s,
    );
    expect(css).toMatch(
      /\.panel\s*\{[^}]*min-width:\s*0[^}]*max-width:\s*100%/s,
    );
    expect(css).toMatch(
      /\.app-shell__utility\s+code\s*,\s*\.app-shell__main\s+code\s*\{[^}]*(?:overflow-wrap:\s*anywhere|word-break:\s*break-word)/s,
    );
    expect(css).toMatch(
      /\.app-shell__(?:utility|main)\s+code[\s\S]*?(?:overflow-wrap:\s*anywhere|word-break:\s*break-word)/,
    );
    expect(css).toMatch(
      /\.row\s+input\s*\{[^}]*(?:min-width:\s*min\(\s*12rem\s*,\s*100%\s*\)|max-width:\s*100%)/s,
    );

    expect(css).toMatch(/\.panel\s*\{/);
    expect(css).toMatch(/\.tabs\s*\{/);
    expect(css).toMatch(/\.editor textarea\s*\{/);
    expect(css).not.toMatch(/\.panel\s*\{[^}]*display:\s*none/s);
    expect(css).not.toMatch(/\.tabs\s*\{[^}]*display:\s*none/s);
    expect(css).not.toMatch(/\.editor\s*\{[^}]*display:\s*none/s);
  });
});
