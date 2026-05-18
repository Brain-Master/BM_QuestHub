import { expect, test } from "@playwright/test";

test.describe("Sites page", () => {
  test("shows venue controls and switches to list view", async ({ page }) => {
    await page.goto("/sites");

    await expect(
      page.getByRole("heading", { name: /Выберите (площадку|город)|Площадки ·/ }).first(),
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

  test("switches to the vector map view", async ({ page }) => {
    await page.goto("/sites");

    await page.getByRole("button", { name: "Карта" }).click();

    await expect(page).toHaveURL(/view=map/);
    await expect(
      page.getByRole("img", { name: "Векторная карта Москвы с площадками BrainMaster" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "География BrainMaster" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Подробнее|Открыть площадку/ }).first()).toBeVisible();
    await expect(page.getByText("Map data © OpenStreetMap contributors")).toBeVisible();
  });

  test("falls back when city query is invalid", async ({ page }) => {
    await page.goto("/sites?city=unknown");

    await expect(
      page.getByRole("heading", { name: /Выберите (площадку|город)|Площадки ·/ }).first(),
    ).toBeVisible();
    await expect(page.getByLabel("Сортировка")).toBeVisible();
    await expect(page.getByRole("link", { name: /^Расписание$/ }).first()).toBeVisible();
  });

  test("shows a school page with yandex map widget", async ({ page }) => {
    await page.goto("/sites/school-1517");

    await expect(
      page.getByRole("heading", { name: "Школа №1517", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Адрес и корпуса" })).toBeVisible();
    await expect(page.getByText("ул. М. Тухачевского, 58к2")).toBeVisible();
    await expect(
      page.getByRole("main").getByRole("link", { name: "Расписание" }),
    ).toBeVisible();
    await expect(page.getByTitle("Яндекс Карта: Школа №1517")).toHaveAttribute(
      "src",
      /yandex\.ru\/map-widget/,
    );
  });
});
