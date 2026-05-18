import { expect, test } from "@playwright/test";

test.describe("Sites page", () => {
  test("shows venue controls and switches to list view", async ({ page }) => {
    await page.goto("/sites");

    await expect(
      page.getByRole("heading", { name: "Выберите площадку", exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("Город")).toHaveCount(0);
    await expect(page.getByLabel("Сортировка")).toBeVisible();
    await expect(page.getByRole("button", { name: "Список" })).toBeVisible();

    await page.getByRole("button", { name: "Список" }).click();
    await expect(page).toHaveURL(/view=list/);
    await expect(page.getByRole("link", { name: /^Расписание$/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Доступные курсы/ }).first()).toBeVisible();
    await expect(page.getByText("проводится").first()).toBeVisible();
    await expect(page.getByText("открыто").first()).toBeVisible();
  });
});
