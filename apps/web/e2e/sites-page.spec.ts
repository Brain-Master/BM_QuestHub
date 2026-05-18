import { expect, test } from "@playwright/test";

test.describe("Sites page", () => {
  test("shows venue controls and switches to list view", async ({ page }) => {
    await page.goto("/sites");

    await expect(
      page.getByRole("heading", { name: /Выберите (площадку|город)|Площадки ·/ }).first(),
    ).toBeVisible();
    await expect(page.getByLabel("Город")).toHaveCount(0);
    await expect(page.getByLabel("Тип")).toHaveCount(0);
    await expect(page.getByLabel("Поиск")).toBeVisible();
    await expect(page.getByRole("button", { name: /По названию/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Список" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Сбросить" })).toBeHidden();
    await expect(page.getByLabel("Цвета площадок")).toHaveCount(0);

    await page.getByRole("button", { name: "Список" }).click();
    await expect(page).toHaveURL(/view=list/);
    await page.getByLabel("Поиск").fill("Ясенево");
    await expect(page).toHaveURL(/q=%D0%AF%D1%81%D0%B5%D0%BD%D0%B5%D0%B2%D0%BE/);
    await expect(page.getByRole("button", { name: "Сбросить" })).toBeVisible();
    await expect(page.getByText("Школа №2103").first()).toBeVisible();
    await page.getByRole("button", { name: /По названию/ }).click();
    await expect(page).toHaveURL(/sort=name-asc/);
    await page.getByRole("button", { name: /По названию/ }).click();
    await expect(page).toHaveURL(/sort=name-desc/);
    await expect(page.getByRole("link", { name: /^Расписание$/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Доступные курсы/ }).first()).toBeVisible();
    await expect(page.getByText("проводится").first()).toBeVisible();
    await expect(page.getByText("открыто").first()).toBeVisible();
  });

  test("switches to the cyber map view", async ({ page }) => {
    await page.goto("/sites?view=map");

    await expect(page).toHaveURL(/view=map/);
    await expect(
      page.getByRole("img", { name: "Кибер-карта Москвы с площадками BrainMaster" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Площадки", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Приблизить карту" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Отдалить карту" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Сброс" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Показать моё местоположение" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Открыть карту на весь экран" })).toBeVisible();
    await page.getByRole("button", { name: /Фильтры/ }).click();
    await expect(page.getByLabel("Цвета площадок")).toBeVisible();
    await expect(page.getByRole("complementary")).toBeVisible();
    await expect(page.getByText(/найдено на карте из/)).toBeVisible();
    await expect(
      page.getByText("Статичная WebP-подложка, интерактивные точки"),
    ).toHaveCount(0);
  });

  test("keeps the map visible when map filters find no sites", async ({ page }) => {
    await page.goto("/sites?view=map");

    await page.getByRole("button", { name: /Фильтры/ }).click();
    await page.getByLabel("Поиск").fill("нет такой площадки");
    await expect(page).toHaveURL(/q=/);
    await expect(
      page.getByRole("img", { name: "Кибер-карта Москвы с площадками BrainMaster" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Выбрать площадку/ })).toHaveCount(0);
    await expect(page.getByText(/По текущим фильтрам площадки не найдены/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Сбросить фильтры" })).toBeVisible();
  });

  test("toggles site color mode for map points", async ({ page }) => {
    await page.goto("/sites?view=map");

    await page.getByRole("button", { name: /Фильтры/ }).click();
    await page.getByLabel("Цвета площадок").click();
    await expect(page).toHaveURL(/mapColors=site/);
    await page.getByLabel("Цвета площадок").click();
    await expect(page).not.toHaveURL(/mapColors=site/);
  });

  test("selects a map pin before opening the schedule", async ({ page }) => {
    await page.goto("/sites?view=map");

    const pin = page.getByRole("button", { name: /Выбрать площадку/ }).first();
    await pin.click();

    await expect(page).toHaveURL(/view=map/);
    await expect(
      page.getByRole("link", { name: "Посмотреть расписание площадки" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Скрыть" }).click();
    await expect(
      page.getByRole("link", { name: "Посмотреть расписание площадки" }),
    ).toHaveCount(0);
    await pin.click();
    await expect(
      page.getByRole("link", { name: "Посмотреть расписание площадки" }),
    ).toBeVisible();
    await page.getByTestId("sites-map-frame").click({
      position: { x: 12, y: 12 },
      force: true,
    });
    await expect(
      page.getByRole("link", { name: "Посмотреть расписание площадки" }),
    ).toHaveCount(0);
    await pin.click();
    await expect(
      page.getByRole("link", { name: "Посмотреть расписание площадки" }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: /Открыть расписание выбранной площадки/ })
      .click();
    await expect(page).toHaveURL(/\/sites\/.+\/agenda/);
  });

  test("toggles fullscreen map mode without hiding the sites list", async ({ page }) => {
    await page.goto("/sites?view=map");

    await page.getByRole("button", { name: "Открыть карту на весь экран" }).click();
    await expect(page.getByRole("button", { name: "Свернуть карту" })).toBeVisible();
    await expect(page.getByTestId("sites-map-list-scroll")).toBeVisible();
    await page.getByRole("heading", { name: "Площадки", exact: true }).dblclick();
    await expect(page.getByTestId("sites-map-list-scroll")).toBeVisible();

    await page.getByRole("button", { name: "Свернуть карту" }).click();
    await expect(page.getByRole("button", { name: "Открыть карту на весь экран" })).toBeVisible();
  });

  test("opens dev map calibrator outside production", async ({ page }) => {
    await page.goto("/dev/calibrator");

    await expect(
      page.getByRole("heading", { name: "Калибратор точек карты" }),
    ).toBeVisible();
    await expect(page.getByLabel("Экспорт координат карты")).toHaveValue(
      /SITE_MAP_POINTS/,
    );
    await expect(page.getByLabel("Экспорт координат карты")).toHaveValue(/:/);
    await page.getByRole("button", { name: "Geo-точки" }).click();
    await expect(page.getByLabel("Экспорт geo-точек карты")).toHaveValue(
      /MAP_GEO_CONTROL_POINTS/,
    );
  });

  test("falls back when city query is invalid", async ({ page }) => {
    await page.goto("/sites?city=unknown");

    await expect(
      page.getByRole("heading", { name: /Выберите (площадку|город)|Площадки ·/ }).first(),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /По активности/ })).toBeVisible();
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
