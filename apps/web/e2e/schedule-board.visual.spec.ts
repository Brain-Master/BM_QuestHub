import { expect, test, type Page, type TestInfo } from "@playwright/test";

const FROZEN_NOW = "2026-05-20T12:00:00.000Z";

async function prepareVisualPage(page: Page, testInfo: TestInfo) {
  test.skip(
    testInfo.project.name !== "chromium",
    "Visual baselines are captured once in the desktop Chromium project.",
  );

  await page.addInitScript((now) => {
    const fixedNow = new Date(now).valueOf();
    const RealDate = Date;

    class FrozenDate extends RealDate {
      constructor(...args: ConstructorParameters<typeof Date>) {
        super(...(args.length ? args : [fixedNow]));
      }

      static now() {
        return fixedNow;
      }
    }

    globalThis.Date = FrozenDate as DateConstructor;
  }, FROZEN_NOW);
}

async function stabilizeScheduleBoard(page: Page) {
  await expect(page.getByTestId("schedule-toolbar")).toBeVisible();
  await expect(page.getByTestId("schedule-card").first()).toBeVisible();
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        caret-color: transparent !important;
      }
    `,
  });
  await page.evaluate(() => document.fonts.ready);
}

test.describe("Schedule Board visual regression", () => {
  test("detailed card keeps the selling layout", async ({ page }, testInfo) => {
    await prepareVisualPage(page, testInfo);
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.goto("/agenda");
    await page.getByRole("button", { name: "Подробный вид" }).click();
    await stabilizeScheduleBoard(page);

    const firstCard = page.getByTestId("schedule-card").first();
    await expect(firstCard).toHaveScreenshot("schedule-board-detailed-card.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.02,
    });
  });

  test("compact card keeps comparison information visible", async ({
    page,
  }, testInfo) => {
    await prepareVisualPage(page, testInfo);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/agenda");
    await stabilizeScheduleBoard(page);

    const firstCard = page.getByTestId("schedule-card").first();
    await expect(firstCard).toHaveScreenshot("schedule-board-compact-card.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.02,
    });
  });

  test("mobile board keeps filters and first card in one column", async ({
    page,
  }, testInfo) => {
    await prepareVisualPage(page, testInfo);
    await page.setViewportSize({ width: 375, height: 1100 });
    await page.goto("/agenda");
    await stabilizeScheduleBoard(page);

    await expect(page).toHaveScreenshot("schedule-board-mobile.png", {
      animations: "disabled",
      fullPage: false,
      maxDiffPixelRatio: 0.02,
    });
  });
});
