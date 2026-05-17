import { expect, test, type Page, type TestInfo } from "@playwright/test";

const FROZEN_NOW = "2026-05-20T12:00:00.000Z";
const QUEST_PATH = "/quests/minecraft-probuzhdenie-strazhey";

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

async function stabilizeCatalogPage(page: Page) {
  await expect(page.getByRole("heading", { name: "Каталог миссий" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Открыть досье/ }).first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

async function expectScrollToTopButtonInViewport(page: Page) {
  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForFunction(() => window.scrollY > 400);

  const topButton = page.getByRole("button", { name: "Наверх" });
  await expect
    .poll(() => topButton.evaluate((button) => getComputedStyle(button).opacity))
    .toBe("1");

  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    )
    .toBe(true);

  const box = await topButton.boundingBox();
  expect(box).not.toBeNull();

  const viewportWidth = await page.evaluate(() => window.innerWidth);
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewportWidth);
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

  test("mobile quest schedule keeps dense tariff cards", async ({ page }, testInfo) => {
    await prepareVisualPage(page, testInfo);
    await page.setViewportSize({ width: 375, height: 1100 });
    await page.goto(QUEST_PATH);
    await stabilizeScheduleBoard(page);

    const firstCard = page.getByTestId("schedule-card").first();
    await expect(firstCard.getByTestId("schedule-tariffs")).toBeVisible();
    await expect(firstCard).toHaveScreenshot("schedule-board-quest-mobile-card.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.02,
    });
  });

  test("mobile quest schedule reveals venue details", async ({ page }, testInfo) => {
    await prepareVisualPage(page, testInfo);
    await page.setViewportSize({ width: 375, height: 1100 });
    await page.goto(QUEST_PATH);
    await stabilizeScheduleBoard(page);

    const firstCard = page.getByTestId("schedule-card").first();
    await firstCard.getByTestId("schedule-quest-details-toggle").click();
    await expect(firstCard.getByTestId("schedule-quest-details")).toBeVisible();
    await expect(firstCard).toHaveScreenshot("schedule-board-quest-mobile-details.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.02,
    });
  });

  const scrollToTopRoutes = [
    {
      name: "agenda",
      path: "/agenda",
      stabilize: stabilizeScheduleBoard,
    },
    {
      name: "catalog",
      path: "/catalog",
      stabilize: stabilizeCatalogPage,
    },
  ];

  for (const route of scrollToTopRoutes) {
    test(`mobile scroll-to-top button stays inside the viewport on ${route.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(route.path);
      await route.stabilize(page);

      await expectScrollToTopButtonInViewport(page);
    });
  }
});
