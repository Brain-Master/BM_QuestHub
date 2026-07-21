import { describe, expect, it } from "vitest";

import {
  hasApiUrl,
  loadSnapshots,
  publishContent,
  saveSnapshot,
} from "./api";

describe("admin API module", () => {
  it("exports the current admin API surface", () => {
    expect(loadSnapshots).toBeTypeOf("function");
    expect(saveSnapshot).toBeTypeOf("function");
    expect(publishContent).toBeTypeOf("function");
    expect(hasApiUrl()).toBeTypeOf("boolean");
  });
});
