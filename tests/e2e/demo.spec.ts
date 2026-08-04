import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("landing explains the project and reaches the field test", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /When the model says clear/i })).toBeVisible();
  await page.getByRole("link", { name: /Run the field test/i }).click();
  await expect(page.getByText("SIMULATED SCENARIO")).toBeVisible();
});

test("replay reaches ground truth and accepts a local observation", async ({ page }) => {
  await page.goto("/demo");
  for (let step = 0; step < 8; step += 1) await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.locator("#evidence").getByText("ground truth", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "cloudy", exact: true }).click();
  await page.getByRole("button", { name: /Add local report/i }).click();
  await expect(page.getByRole("button", { name: /Replace local report/i })).toBeVisible();
  await page.getByRole("button", { name: "Reset demo data" }).click();
  await expect(page.getByRole("button", { name: /Add local report/i })).toBeVisible();
  await expect(page.getByText("Step 1 / 9")).toBeVisible();
});

test("developer console calls the deterministic API", async ({ page }) => {
  await page.goto("/developers");
  await page.getByRole("button", { name: "Run request" }).click();
  await expect(page.getByText("200 OK")).toBeVisible();
  await expect(page.getByText(/ground_truth/)).toBeVisible();
});

test("key routes have no serious accessibility violations", async ({ page }) => {
  for (const route of ["/", "/demo", "/observe", "/developers", "/lab"]) {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? "")), route).toEqual([]);
  }
});
