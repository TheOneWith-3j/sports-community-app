import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("public landing page is reachable", async ({ page }) => {
  test.skip(
    process.env.PLAYWRIGHT_E2E_ENABLED !== "1",
    "Set PLAYWRIGHT_E2E_ENABLED=1 to run browser tests.",
  );
  await page.goto("/");
  await expect(page).toHaveTitle(/RallyNook/i);
});

test("public landing page has no critical accessibility violations", async ({
  page,
}) => {
  test.skip(
    process.env.PLAYWRIGHT_E2E_ENABLED !== "1",
    "Set PLAYWRIGHT_E2E_ENABLED=1 to run browser tests.",
  );
  await page.goto("/");
  const accessibilityScan = await new AxeBuilder({ page }).analyze();
  expect(
    accessibilityScan.violations.filter(
      (violation) => violation.impact === "critical",
    ),
  ).toEqual([]);
});
