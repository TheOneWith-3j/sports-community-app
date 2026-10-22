import { expect, test } from "@playwright/test";

test("member can join a seeded published event", async ({ page }) => {
  test.skip(
    process.env.PLAYWRIGHT_E2E_ENABLED !== "1" ||
      !process.env.PLAYWRIGHT_EVENT_URL,
    "Set PLAYWRIGHT_E2E_ENABLED=1 and PLAYWRIGHT_EVENT_URL for seeded E2E tests.",
  );
  await page.goto(process.env.PLAYWRIGHT_EVENT_URL!);
  await page.getByRole("button", { name: /join event/i }).click();
  await expect(page.getByText(/confirmed|waitlist/i)).toBeVisible();
});
