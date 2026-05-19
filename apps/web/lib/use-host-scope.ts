"use client";

import * as React from "react";

import type { HostAliasesDocument, ParsedSchoolHost } from "@/lib/host-scope";
import { parseSchoolHost } from "@/lib/host-scope";

type HostScopeState = {
  aliases: HostAliasesDocument | null;
  school: ParsedSchoolHost | null;
  ready: boolean;
};

let cachedAliases: HostAliasesDocument | null = null;
let loadPromise: Promise<HostAliasesDocument> | null = null;

async function loadHostAliases(): Promise<HostAliasesDocument> {
  if (cachedAliases) return cachedAliases;
  if (!loadPromise) {
    loadPromise = fetch("/host-aliases.json")
      .then((res) => {
        if (!res.ok) throw new Error(`host-aliases.json ${res.status}`);
        return res.json() as Promise<HostAliasesDocument>;
      })
      .then((doc) => {
        cachedAliases = doc;
        return doc;
      });
  }
  return loadPromise;
}

export function useHostScope(): HostScopeState {
  const [state, setState] = React.useState<HostScopeState>({
    aliases: cachedAliases,
    school: null,
    ready: false,
  });

  React.useEffect(() => {
    let cancelled = false;

    void loadHostAliases().then((aliases) => {
      if (cancelled) return;
      const school =
        typeof window !== "undefined"
          ? parseSchoolHost(window.location.hostname, aliases)
          : null;
      setState({ aliases, school, ready: true });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
