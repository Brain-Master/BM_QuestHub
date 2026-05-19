import { expect, test } from "@playwright/test";

test.describe("School host aliases", () => {
  test("host-aliases.json includes school 1517", async ({ request }) => {
    const response = await request.get("/host-aliases.json");
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as {
      schools: Record<string, { routeSlug: string; scopeSlug: string }>;
    };
    expect(body.schools["1517"]).toMatchObject({
      routeSlug: "1517",
      scopeSlug: "school-1517",
    });
  });

  test("scoped school agenda page is filterable by route slug", async ({ page }) => {
    await page.goto("/sites/1517/agenda/");
    await expect(page.getByRole("heading", { name: /Расписание/i })).toBeVisible();
    await expect(page).toHaveURL(/\/sites\/1517\/agenda/);
  });
});
