/** Keep the dated annual overlay in subsequent Sheets publications without crossing tiers. */
export function annualOverlayArgs(tier) {
  if (tier !== "hot" && tier !== "cold") throw new Error("Invalid annual publish tier");
  return ["--write", `--tier=${tier}`];
}

export function annualOverlayTimestamp(previous, source) {
  if (!Number.isFinite(Date.parse(previous)) || !Number.isFinite(Date.parse(source))) {
    throw new Error("Invalid annual publication timestamp");
  }
  return Date.parse(previous) > Date.parse(source) ? previous : source;
}

export function selectAnnualOutputs(outputs, tier = "all") {
  if (!["all", "hot", "cold"].includes(tier)) throw new Error("Invalid annual publish tier");
  return Object.fromEntries(Object.entries(outputs).filter(([key]) => {
    if (key === "data/offers-snapshot.json") return tier !== "cold";
    if (key.startsWith("data/v2/")) return tier !== "hot";
    throw new Error("Unexpected annual output path");
  }));
}
