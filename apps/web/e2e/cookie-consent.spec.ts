import { expect, test } from "@playwright/test";

test.describe("Cookie consent", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem("bm.cookieConsent.v1");
    });
  });

  test("shows banner and does not load Metrika until analytics accepted", async ({
    page,
  }) => {
    const metrikaRequests: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("mc.yandex.ru") || url.includes("metrika")) {
        metrikaRequests.push(url);
      }
    });

    await page.goto("/");
    await expect(page.getByTestId("cookie-consent-banner")).toBeVisible();
    expect(metrikaRequests).toHaveLength(0);

    await page.getByTestId("cookie-consent-essential-only").click();
    await expect(page.getByTestId("cookie-consent-banner")).toBeHidden();
    await page.waitForTimeout(1500);
    expect(metrikaRequests).toHaveLength(0);
  });

  test("loads Metrika after accepting analytics", async ({ page }) => {
    const metrikaRequests: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("mc.yandex.ru")) {
        metrikaRequests.push(url);
      }
    });

    await page.goto("/");
    await page.getByTestId("cookie-consent-accept-all").click();
    await expect(page.getByTestId("cookie-consent-banner")).toBeHidden();

    await expect
      .poll(() => metrikaRequests.length, { timeout: 10_000 })
      .toBeGreaterThan(0);
  });
});
