import { defineConfig } from "vitest/config";
import type { Reporter } from "vitest/node";

/**
 * Vitest treats unmatched --testNamePattern as skipped tests and exits 0.
 * M0-10 requires zero matched/passed tests to fail (false-pass guard).
 */
function rejectZeroPassedTests(): Reporter {
  let passed = 0;
  return {
    onTestCaseResult(testCase) {
      if (testCase.result().state === "passed") {
        passed += 1;
      }
    },
    onTestRunEnd() {
      if (passed === 0) {
        console.error(
          "No tests passed. Skipped/todo-only runs are treated as failure.",
        );
        process.exitCode = 1;
      }
    },
  };
}

export default defineConfig({
  test: {
    allowOnly: false,
    environment: "node",
    fileParallelism: false,
    include: ["src/**/*.test.ts"],
    maxWorkers: 1,
    passWithNoTests: false,
    restoreMocks: true,
    reporters: ["default", rejectZeroPassedTests()],
  },
});
