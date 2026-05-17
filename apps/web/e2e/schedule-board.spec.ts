import { expect, test } from "@playwright/test";

test.describe("Schedule Board UX", () => {
  test("renders timeline cards with core decision data", async ({ page }) => {
    await page.goto("/agenda");

    await expect(page.getByTestId("schedule-toolbar")).toBeVisible();
    const firstCard = page.getByTestId("schedule-card").first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard.getByTestId("schedule-status")).toBeVisible();
    await expect(firstCard.getByTestId("schedule-media")).toBeVisible();
    await expect(firstCard.getByTestId("schedule-tariffs")).toBeVisible();
    await expect(
      firstCard.getByRole("link", { name: /Открыть|Minecraft|Мехвариум|Кибер/i }).first(),
    ).toBeVisible();
  });

  test("switches to compact mode without losing cards or CTA zone", async ({ page }) => {
    await page.goto("/agenda");

    await page.getByRole("button", { name: "Компактный вид" }).click();

    const firstCard = page.getByTestId("schedule-card").first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard.getByTestId("schedule-tariffs")).toBeVisible();
    await expect(page.getByTestId("schedule-card")).not.toHaveCount(0);
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
