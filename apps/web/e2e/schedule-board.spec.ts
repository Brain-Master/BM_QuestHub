import { expect, test } from "@playwright/test";

test.describe("Schedule Board UX", () => {
  test("renders timeline cards with core decision data", async ({ page }, testInfo) => {
    await page.goto("/agenda");

    await expect(page.getByTestId("schedule-toolbar")).toBeVisible();
    const firstCard = page.getByTestId("schedule-card").first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard.getByTestId("schedule-status")).toBeVisible();
    if (testInfo.project.name === "mobile-chrome") {
      await expect(
        firstCard.getByRole("button", { name: /Показать форматы|Подробнее о смене/ }),
      ).toBeVisible();
      return;
    }
    await expect(firstCard.getByTestId("schedule-media")).toBeVisible();
    await expect(firstCard.getByTestId("schedule-tariffs")).toBeVisible();
    await expect(firstCard.getByTestId("schedule-tariff-row").first()).toBeVisible();
    await expect(
      firstCard.getByRole("link", { name: /Открыть|Minecraft|Мехвариум|Кибер/i }).first(),
    ).toBeVisible();
  });

  test("compact card with three or more formats renders all tariffs in footer", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name === "mobile-chrome",
      "Compact footer placement is a desktop layout pattern.",
    );

    await page.goto("/agenda");

    const footerCard = page
      .getByTestId("schedule-card")
      .filter({ has: page.getByTestId("schedule-card-tariff-footer") })
      .first();

    if ((await footerCard.count()) === 0) {
      test.skip(true, "Current snapshot has no shift with three or more formats.");
    }

    const tariffRows = footerCard.getByTestId("schedule-tariff-row");
    await expect(tariffRows.first()).toBeVisible();
    expect(await tariffRows.count()).toBeGreaterThanOrEqual(3);
  });

  test("starts in compact mode without losing cards or CTA zone", async ({
    page,
  }, testInfo) => {
    await page.goto("/agenda");

    const firstCard = page.getByTestId("schedule-card").first();
    await expect(firstCard).toBeVisible();
    if (testInfo.project.name === "mobile-chrome") {
      await expect(
        firstCard.getByRole("button", { name: /Показать форматы|Подробнее о смене/ }),
      ).toBeVisible();
      await expect(page.getByTestId("schedule-card")).not.toHaveCount(0);
      return;
    }

    const before = await firstCard.boundingBox();
    await firstCard.getByRole("button", { name: /Подробнее о смене/ }).click();
    await expect(firstCard.getByText(/Скрыть описание/)).toBeVisible();
    const after = await firstCard.boundingBox();
    expect(Math.round(after?.height ?? 0)).toBeGreaterThanOrEqual(
      Math.round(before?.height ?? 0),
    );
    await expect(page.getByTestId("schedule-card")).not.toHaveCount(0);
  });

  test("filters by program and site without losing visible cards", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name === "mobile-chrome",
      "Filter disclosure behavior is covered by quest mobile tests.",
    );

    await page.goto("/agenda");

    await expect(page.getByTestId("schedule-results-count")).toContainText(/найдено/);
    await expect(page.getByTestId("schedule-view-toggle")).toBeVisible();
    await expect(page.getByTestId("schedule-reset-filter")).toBeHidden();
    await page.getByRole("button", { name: /Фильтры расписания/ }).click();
    await expect(page.getByTestId("schedule-search-filter")).toBeVisible();
    await expect(page.getByTestId("schedule-program-filter")).toBeVisible();
    await expect(page.getByTestId("schedule-site-filter")).toBeVisible();
    const resetButton = page.getByTestId("schedule-reset-filter");

    await page.getByTestId("schedule-search-filter").fill("Школа №2103");
    await expect(resetButton).toBeVisible();
    await expect(page.getByTestId("schedule-card").first()).toContainText("Школа №2103");
    await resetButton.click();
    await expect(resetButton).toBeHidden();

    await page.getByTestId("schedule-program-filter").click();
    await page.getByRole("option", { name: /Minecraft|Мехвариум|Кибер/ }).first().click();

    await expect(resetButton).toBeVisible();
    await expect(page.getByTestId("schedule-card").first()).toBeVisible();
  });

  test("opens a quest page with the selected offer highlighted", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name === "mobile-chrome",
      "Mobile layout renders detailed cards; route highlighting is covered in desktop navigation.",
    );

    await page.goto("/agenda");

    const firstCard = page.getByTestId("schedule-card").first();
    const href = await firstCard.locator('a[href*="/quests/"]').first().getAttribute("href");
    expect(href).toBeTruthy();
    await page.goto(href!);

    await expect(page).toHaveURL(/offer=/);
    await expect(page.locator('[id^="schedule-offer-"]').first()).toBeVisible();
  });

  test("does not create horizontal overflow on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/agenda");

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });
});
