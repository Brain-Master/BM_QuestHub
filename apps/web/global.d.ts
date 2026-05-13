export {};

declare global {
  interface Window {
    ym?: (
      id: number,
      method: "reachGoal" | "hit" | string,
      ...args: unknown[]
    ) => void;
  }
}
