import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// Node built-ins are available under Vitest's node environment; @types/node is
// intentionally not an apps/admin dependency (M1-07 forbids lockfile changes).
// @ts-expect-error -- no @types/node in apps/admin
import fs from "node:fs";
// @ts-expect-error -- no @types/node in apps/admin
import path from "node:path";
// @ts-expect-error -- no @types/node in apps/admin
import { fileURLToPath } from "node:url";

const PRIVATE_KEY = "contentAdminToken";
const SRC_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

describe("legacy token adapter", () => {
  let store: Map<string, string>;

  beforeEach(() => {
    vi.resetModules();
    store = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
      key: (index: number) => [...store.keys()][index] ?? null,
      get length() {
        return store.size;
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("reads the current legacy token from sessionStorage", async () => {
    store.set(PRIVATE_KEY, "stored-token");
    const { legacyTokenAdapter } = await import("./legacy-token-adapter");
    expect(legacyTokenAdapter.read()).toBe("stored-token");
  });

  it("returns an empty string when the legacy token is absent", async () => {
    const { legacyTokenAdapter } = await import("./legacy-token-adapter");
    expect(legacyTokenAdapter.read()).toBe("");
  });

  it("writes a trimmed token to the private legacy key", async () => {
    const { legacyTokenAdapter } = await import("./legacy-token-adapter");
    legacyTokenAdapter.write("  keep  internal  ");
    expect([...store.entries()]).toEqual([
      [PRIVATE_KEY, "keep  internal"],
    ]);
  });

  it("preserves the legacy empty-string write behavior", async () => {
    store.set(PRIVATE_KEY, "previous");
    const { legacyTokenAdapter } = await import("./legacy-token-adapter");
    legacyTokenAdapter.write("   ");
    expect(store.has(PRIVATE_KEY)).toBe(true);
    expect(store.get(PRIVATE_KEY)).toBe("");
  });

  it("accesses sessionStorage lazily after module evaluation", async () => {
    vi.unstubAllGlobals();
    vi.resetModules();

    expect("sessionStorage" in globalThis).toBe(false);

    const { legacyTokenAdapter } =
      await import("./legacy-token-adapter");

    const getItem = vi.fn((key: string) => store.get(key) ?? null);
    const setItem = vi.fn((key: string, value: string) => {
      store.set(key, value);
    });
    vi.stubGlobal("sessionStorage", {
      getItem,
      setItem,
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
      key: (index: number) => [...store.keys()][index] ?? null,
      get length() {
        return store.size;
      },
    });

    legacyTokenAdapter.read();
    expect(getItem).toHaveBeenCalledTimes(1);
    legacyTokenAdapter.write("x");
    expect(setItem).toHaveBeenCalledTimes(1);
  });

  it("propagates storage failures without fallback", async () => {
    const boom = new Error("sessionStorage unavailable");
    vi.stubGlobal("sessionStorage", {
      getItem: () => {
        throw boom;
      },
      setItem: () => {
        throw boom;
      },
      removeItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      length: 0,
    });

    const { legacyTokenAdapter } = await import("./legacy-token-adapter");

    let readError: unknown;
    try {
      legacyTokenAdapter.read();
    } catch (error) {
      readError = error;
    }
    expect(readError).toBe(boom);

    let writeError: unknown;
    try {
      legacyTokenAdapter.write("x");
    } catch (error) {
      writeError = error;
    }
    expect(writeError).toBe(boom);
  });

  it("does not log token values during reads or writes", async () => {
    const info = vi.spyOn(console, "info");
    const log = vi.spyOn(console, "log");
    const debug = vi.spyOn(console, "debug");
    const warn = vi.spyOn(console, "warn");
    const error = vi.spyOn(console, "error");

    store.set(PRIVATE_KEY, "secret-token-value");
    const { legacyTokenAdapter } = await import("./legacy-token-adapter");
    legacyTokenAdapter.read();
    legacyTokenAdapter.write(" another-secret ");

    for (const spy of [info, log, debug, warn, error]) {
      expect(spy).not.toHaveBeenCalled();
    }
  });

  it("keeps product storage access and the legacy key inside the adapter module", () => {
    const productFiles: string[] = [];

    function walk(dir: string) {
      for (const name of fs.readdirSync(dir)) {
        const abs = path.join(dir, name);
        const st = fs.statSync(abs);
        if (st.isDirectory()) {
          if (name === "test-fixtures") continue;
          walk(abs);
          continue;
        }
        if (!/\.(ts|tsx)$/.test(name)) continue;
        if (name.endsWith(".test.ts") || name.endsWith(".test.tsx")) continue;
        productFiles.push(abs);
      }
    }

    walk(SRC_ROOT);

    const sessionStorageFiles: string[] = [];
    const keyFiles: string[] = [];
    let adapterSource = "";
    let appSource = "";
    let apiSource = "";

    for (const abs of productFiles) {
      const rel = path.relative(SRC_ROOT, abs).replace(/\\/g, "/");
      const text = fs.readFileSync(abs, "utf8");
      if (rel === "legacy-token-adapter.ts") adapterSource = text;
      if (rel === "App.tsx") appSource = text;
      if (rel === "api.ts") apiSource = text;
      if (text.includes("sessionStorage")) sessionStorageFiles.push(rel);
      if (text.includes("contentAdminToken")) keyFiles.push(rel);
    }

    expect(sessionStorageFiles).toEqual(["legacy-token-adapter.ts"]);
    expect(keyFiles).toEqual(["legacy-token-adapter.ts"]);
    expect(adapterSource).toContain("@deprecated");
    expect(adapterSource).toMatch(/M3/);
    expect(adapterSource).toMatch(/server-side session/);
    expect(appSource).toMatch(/legacyTokenAdapter/);
    expect(apiSource).toMatch(/legacyTokenAdapter/);
    expect(appSource).not.toContain("sessionStorage");
  });
});
