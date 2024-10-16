const { test, expect } = require("@playwright/test");

test("Server responds with a page with the title 'Programming assignments'", async ({ page }) => {
  await page.goto("/");
  expect(await page.title()).toBe("Programming assignments");
  await expect(page.locator('text=Task 1')).toHaveText('Task 1');
});