import { expect, test } from "@playwright/test";

test("waitlisted member sees promotion after a confirmed member leaves", async ({
  page,
}) => {
  test.skip(
    process.env.PLAYWRIGHT_E2E_ENABLED !== "1" ||
      !process.env.PLAYWRIGHT_WAITLIST_URL,
    "Set PLAYWRIGHT_E2E_ENABLED=1 and PLAYWRIGHT_WAITLIST_URL for seeded E2E tests.",
  );
  await page.goto(process.env.PLAYWRIGHT_WAITLIST_URL!);
  await expect(page.getByText(/waitlist/i)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/confirmed/i)).toBeVisible();
});
