import { expect, test } from "@playwright/test";

test.describe("Community contacts", () => {
  test("home footer and hero aside link to VK, Telegram, and phone", async ({ page }) => {
    await page.goto("/");

    const footer = page.getByTestId("community-connect-footer");
    await expect(footer).toBeVisible();
    await expect(footer.getByTestId("support-vk-link")).toHaveAttribute(
      "href",
      "https://vk.com/BrainMaster",
    );
    await expect(footer.getByTestId("support-telegram-link")).toHaveAttribute(
      "href",
      "https://t.me/BrainMaster_Academy",
    );
    await expect(footer.getByTestId("support-phone-link")).toHaveAttribute(
      "href",
      "tel:+79779678800",
    );

    const aside = page.getByTestId("community-connect-aside");
    await expect(aside).toBeVisible();
    await expect(aside.getByTestId("support-vk-link")).toBeVisible();
  });
});
