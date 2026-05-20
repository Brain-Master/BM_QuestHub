export {};

declare global {
  interface Window {
    dataLayer?: unknown[];
    ym?: (
      id: number,
      method: "reachGoal" | "params" | "hit" | string,
      ...args: unknown[]
    ) => void;
  }
}
