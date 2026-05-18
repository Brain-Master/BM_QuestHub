import { expect, test, type Page } from "@playwright/test";

const QUEST_PATH = "/quests/minecraft-probuzhdenie-strazhey";

async function openQuestFilters(page: Page) {
  const siteFilter = page.getByTestId("schedule-site-filter");
  await expect(page.getByTestId("schedule-toolbar")).toBeVisible();
  try {
    await expect(siteFilter).toBeVisible({ timeout: 1000 });
    return;
  } catch {
    await page.getByRole("button", { name: /Фильтры расписания/ }).click();
  }
  await expect(siteFilter).toBeVisible();
}

test.describe("Quest schedule", () => {
  test("uses the shared schedule filters on quest pages", async ({ page }) => {
    await page.goto(QUEST_PATH);
    await openQuestFilters(page);

    const resetButton = page.getByTestId("schedule-reset-filter");
    await expect(page.getByTestId("schedule-site-filter")).toBeVisible();
    await expect(page.getByTestId("schedule-format-filter")).toBeVisible();
    await expect(page.getByTestId("schedule-status-filter")).toBeVisible();
    await expect(page.getByTestId("schedule-program-filter")).toHaveCount(0);

    await page.getByTestId("schedule-site-filter").click();
    await page.getByRole("option").nth(1).click();

    await expect(resetButton).toBeVisible();
    await expect(page.getByTestId("schedule-card").first()).toBeVisible();

    await resetButton.click();
    await expect(resetButton).toBeHidden();
  });

  test("opens a selected offer from agenda on the shared quest board", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name === "mobile-chrome",
      "Desktop navigation covers the deep-link highlight without mobile scroll timing.",
    );

    await page.goto("/agenda");
    const href = await page
      .getByTestId("schedule-card")
      .first()
      .locator('a[href*="/quests/"]')
      .first()
      .getAttribute("href");
    expect(href).toBeTruthy();
    await page.goto(href!);

    await expect(page).toHaveURL(/\/quests\/.+offer=/);
    const offerId = new URL(page.url()).searchParams.get("offer");
    expect(offerId).toBeTruthy();
    await expect(
      page.locator(`[id=${JSON.stringify(`schedule-offer-${offerId}`)}]`),
    ).toBeVisible();
  });

  test("keeps quest schedule usable on mobile without horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(QUEST_PATH);

    const firstCard = page.getByTestId("schedule-card").first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard.getByTestId("schedule-tariffs")).toBeVisible();
    await expect(firstCard.getByTestId("schedule-tariff-row").first()).toBeVisible();
    await expect(firstCard.getByText(/Школа №2103/).first()).toBeVisible();
    await expect(firstCard.getByTestId("schedule-quest-details-toggle")).toBeVisible();

    await firstCard.getByTestId("schedule-quest-details-toggle").click();
    await expect(firstCard.getByTestId("schedule-quest-details")).toBeVisible();
    await expect(firstCard.getByRole("link", { name: /Открыть адрес/ })).toBeVisible();
    await expect(firstCard.getByText(/Наставник:/)).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });

  test("keeps booking CTA context inside mobile variant cards", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(QUEST_PATH);

    const firstCard = page.getByTestId("schedule-card").first();
    await expect(firstCard.getByTestId("schedule-tariffs")).toBeVisible();

    const formButtons = firstCard.getByRole("button", {
      name: /Записаться|В лист ожидания|Узнать о старте|Предварительная заявка/,
    });
    if ((await formButtons.count()) > 0) {
      await formButtons.first().click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(
        /Оформление заявки|Заявка в лист ожидания/,
      );
      await expect(dialog.getByTestId("booking-summary")).toBeVisible();
      await expect(dialog.getByLabel("Имя родителя")).toBeVisible();
      await expect(
        dialog.getByRole("button", {
          name: /Забронировать место|Отправить заявку в лист ожидания/,
        }),
      ).toBeVisible();
      return;
    }

    await expect(
      firstCard.getByRole("link", { name: /Записаться|mos\.ru/i }).first(),
    ).toBeVisible();
  });
});
